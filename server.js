// MDRN & CO. - Servidor
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const app = express();
const PUERTO = process.env.PORT || 3000;

// Confi de la base de datos
const CONFIG_DB = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '', // XAMPP trae root sin contraseña
  database: process.env.DB_NAME || 'mdrn_co',
  dateStrings: true // las fechas llegan como texto "AAAA-MM-DD HH:MM:SS"
};

//  Conexion a MySQL con createConnection 
let db;
let reconectando = false;

function reconectar() {
  if (reconectando) return; // evita programar dos reintentos a la vez
  reconectando = true;
  console.error('Reintentando conexión a MySQL en 5 segundos...');
  setTimeout(() => { reconectando = false; conectar(); }, 5000);
}

function conectar() {
  db = mysql.createConnection(CONFIG_DB);

  db.connect((err) => {
    if (err) {
      console.error('No se pudo conectar a MySQL:', err.message);
      console.error('Revisá que MySQL esté iniciado en XAMPP y que database.sql esté importado.');
      reconectar();
      return;
    }
    console.log('Conectado a MySQL (base: ' + CONFIG_DB.database + ')');
  });

  db.on('error', (err) => {
    console.error('Error en la conexión MySQL:', err.code);
    if (err.fatal) reconectar();
  });
}
conectar();

// Ejecuta una consulta SQL parametrizada
function consultar(sql, parametros = []) {
  return new Promise((resolve, reject) => {
    db.execute(sql, parametros, (err, filas) => (err ? reject(err) : resolve(filas)));
  });
}

// Middlewares
app.use(cors());
app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname, 'public'))); // sitio público

// Sesiones del administrador 
const sesiones = new Map();
const DURACION_SESION = 2 * 60 * 60 * 1000;

function leerCookie(req, nombre) {
  const cookies = req.headers.cookie || '';
  for (const parte of cookies.split(';')) {
    const [clave, ...valor] = parte.trim().split('=');
    if (clave === nombre) return decodeURIComponent(valor.join('='));
  }
  return null;
}

function obtenerSesion(req) {
  const token = leerCookie(req, 'sesion');
  const sesion = token && sesiones.get(token);
  if (!sesion) return null;
  if (sesion.expira < Date.now()) {
    sesiones.delete(token);
    return null;
  }
  return sesion;
}

function requiereAuth(req, res, next) {
  const sesion = obtenerSesion(req);
  if (!sesion) return res.status(401).json({ error: 'No autorizado. Iniciá sesión.' });
  req.admin = sesion;
  next();
}

// Limite de intentos simple 5 de 15 min
const intentos = new Map();
function limiteLogin(req, res, next) {
  const ip = req.ip;
  const ahora = Date.now();
  const dato = intentos.get(ip) || { cantidad: 0, desde: ahora };
  if (ahora - dato.desde > 15 * 60 * 1000) { dato.cantidad = 0; dato.desde = ahora; }
  if (dato.cantidad >= 5) {
    return res.status(429).json({ error: 'Demasiados intentos. Probá de nuevo en unos minutos.' });
  }
  req.registrarFallo = () => { dato.cantidad++; intentos.set(ip, dato); };
  req.limpiarFallos = () => intentos.delete(ip);
  next();
}

//hash falso para simular un usuarioq no existe
const HASH_FALSO = bcrypt.hashSync('no-existe', 10);

// ---------- Validaciones ----------
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const REGEX_TELEFONO = /^[0-9+\-\s()]{6,30}$/;

function validarConsulta(d) {
  const errores = [];
  const nombre = String(d.nombre || '').trim();
  const email = String(d.email || '').trim();
  const telefono = String(d.telefono || '').trim();
  const asunto = String(d.asunto || '').trim();
  const mensaje = String(d.mensaje || '').trim();

  if (nombre.length < 2 || nombre.length > 100) errores.push('El nombre es obligatorio (2 a 100 caracteres).');
  if (!REGEX_EMAIL.test(email) || email.length > 120) errores.push('El email no es válido.');
  if (telefono && !REGEX_TELEFONO.test(telefono)) errores.push('El teléfono no es válido.');
  if (asunto.length < 3 || asunto.length > 150) errores.push('El asunto es obligatorio (3 a 150 caracteres).');
  if (mensaje.length < 10) errores.push('El mensaje debe tener al menos 10 caracteres.');
  if (mensaje.length > 2000) errores.push('El mensaje no puede superar los 2000 caracteres.');

  let servicioId = null;
  if (d.servicio_id !== undefined && d.servicio_id !== null && d.servicio_id !== '') {
    servicioId = Number(d.servicio_id);
    if (!Number.isInteger(servicioId) || servicioId < 1) errores.push('El servicio elegido no es válido.');
  }
  return { errores, datos: { nombre, email, telefono: telefono || null, asunto, mensaje, servicioId } };
}

function errorServidor(res, err) {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Error en el servidor o en la base de datos. Intentá de nuevo.' });
}


//PÚBLICA

// Lista de servicios MySQL
app.get('/api/servicios', async (req, res) => {
  try {
    const filas = await consultar(
      'SELECT id, nombre, descripcion, icono, precio FROM servicios ORDER BY orden, id'
    );
    res.json(filas);
  } catch (err) {
    errorServidor(res, err);
  }
});

// Guarda las consulta del formulario
app.post('/api/consultas', async (req, res) => {
  const { errores, datos } = validarConsulta(req.body || {});
  if (errores.length > 0) return res.status(400).json({ error: errores[0], errores });

  try {
    const resultado = await consultar(
      `INSERT INTO consultas (nombre, email, telefono, asunto, mensaje, servicio_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [datos.nombre, datos.email, datos.telefono, datos.asunto, datos.mensaje, datos.servicioId]
    );
    res.status(201).json({
      mensaje: '¡Gracias! Recibimos tu consulta y te vamos a responder a la brevedad.',
      id: resultado.insertId
    });
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ error: 'El servicio elegido no existe.' });
    }
    errorServidor(res, err);
  }
});

// loguearse - desloguears3e
app.post('/api/login', limiteLogin, async (req, res) => {
  const usuario = String((req.body || {}).usuario || '').trim();
  const password = String((req.body || {}).password || '');

  if (!usuario || !password || usuario.length > 50 || password.length > 100) {
    return res.status(400).json({ error: 'Ingresá usuario y contraseña.' });
  }

  try {
    const filas = await consultar(
      'SELECT id, usuario, password_hash, nombre FROM administradores WHERE usuario = ?',
      [usuario]
    );
    const admin = filas[0];
    const coincide = await bcrypt.compare(password, admin ? admin.password_hash : HASH_FALSO);

    if (!admin || !coincide) {
      req.registrarFallo();
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
    }

    req.limpiarFallos();
    const token = crypto.randomBytes(32).toString('hex');
    sesiones.set(token, {
      id: admin.id,
      usuario: admin.usuario,
      nombre: admin.nombre,
      expira: Date.now() + DURACION_SESION
    });

    res.setHeader(
      'Set-Cookie',
      `sesion=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${DURACION_SESION / 1000}`
    );
    res.json({ mensaje: 'Sesión iniciada', nombre: admin.nombre });
  } catch (err) {
    errorServidor(res, err);
  }
});

app.post('/api/logout', (req, res) => {
  const token = leerCookie(req, 'sesion');
  if (token) sesiones.delete(token);
  res.setHeader('Set-Cookie', 'sesion=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
  res.json({ mensaje: 'Sesión cerrada' });
});

// Devuelve los datos del admin logueado
app.get('/api/sesion', requiereAuth, (req, res) => {
  res.json({ usuario: req.admin.usuario, nombre: req.admin.nombre });
});


// PRIVADA 


// Listado con sus filtros
app.get('/api/consultas', requiereAuth, async (req, res) => {
  const { estado, fecha, q } = req.query;
  const condiciones = [];
  const parametros = [];

  if (estado === 'leidas') condiciones.push('c.leida = 1');
  else if (estado === 'noleidas') condiciones.push('c.leida = 0');

  if (fecha) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(fecha))) {
      return res.status(400).json({ error: 'La fecha debe tener formato AAAA-MM-DD.' });
    }
    condiciones.push('DATE(c.fecha) = ?');
    parametros.push(String(fecha));
  }

  if (q && String(q).trim()) {
    const texto = '%' + String(q).trim().slice(0, 100) + '%';
    condiciones.push('(c.nombre LIKE ? OR c.email LIKE ?)');
    parametros.push(texto, texto);
  }

  const where = condiciones.length ? 'WHERE ' + condiciones.join(' AND ') : '';

  try {
    const filas = await consultar(
      `SELECT c.id, c.nombre, c.email, c.asunto, c.fecha, c.leida
       FROM consultas c ${where}
       ORDER BY c.fecha DESC, c.id DESC`,
      parametros
    );
    res.json(filas);
  } catch (err) {
    errorServidor(res, err);
  }
});

// Detalle de una consulta
app.get('/api/consultas/:id', requiereAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'ID inválido.' });

  try {
    const filas = await consultar(
      `SELECT c.id, c.nombre, c.email, c.telefono, c.asunto, c.mensaje, c.fecha, c.leida,
              s.nombre AS servicio, a.nombre AS leida_por
       FROM consultas c
       LEFT JOIN servicios s ON s.id = c.servicio_id
       LEFT JOIN administradores a ON a.id = c.leida_por
       WHERE c.id = ?`,
      [id]
    );
    if (filas.length === 0) return res.status(404).json({ error: 'La consulta no existe.' });
    res.json(filas[0]);
  } catch (err) {
    errorServidor(res, err);
  }
});

// marca las consultas como leidas y no leidas
app.put('/api/consultas/:id/leida', requiereAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'ID inválido.' });

  const leida = (req.body || {}).leida;
  if (typeof leida !== 'boolean') return res.status(400).json({ error: 'El campo "leida" debe ser true o false.' });

  try {
    const resultado = await consultar(
      'UPDATE consultas SET leida = ?, leida_por = ? WHERE id = ?',
      [leida ? 1 : 0, leida ? req.admin.id : null, id]
    );
    if (resultado.affectedRows === 0) return res.status(404).json({ error: 'La consulta no existe.' });
    res.json({ mensaje: leida ? 'Marcada como leída' : 'Marcada como no leída', leida });
  } catch (err) {
    errorServidor(res, err);
  }
});


// pagina del panel
app.get('/admin', (req, res) => {
  if (!obtenerSesion(req)) return res.redirect('/admin-login.html');
  res.sendFile(path.join(__dirname, 'privado', 'admin.html'));
});

// Errores 
app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta de la API no encontrada.' }));

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido.' });
  console.error(err);
  res.status(500).json({ error: 'Error inesperado en el servidor.' });
});

app.listen(PUERTO, () => {
  console.log('Servidor MDRN & CO. en http://localhost:' + PUERTO);
});
