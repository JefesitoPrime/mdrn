// =====================================================
// MDRN & CO. - Panel de administración
// =====================================================
const cuerpoTabla = document.getElementById('cuerpoTabla');
const mensajeLista = document.getElementById('mensajeLista');
const filtroEstado = document.getElementById('filtroEstado');
const filtroFecha = document.getElementById('filtroFecha');
const filtroBusqueda = document.getElementById('filtroBusqueda');

const modal = document.getElementById('modal');
let consultaAbierta = null; // detalle de la consulta que se está viendo
let ultimoFoco = null;

// Todas las llamadas a la API pasan por acá: si la sesión venció, se vuelve al login
async function api(url, opciones = {}) {
  const respuesta = await fetch(url, opciones);
  if (respuesta.status === 401) {
    window.location.href = '/admin-login.html';
    throw new Error('Sesión no válida');
  }
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new Error(datos.error || 'Error ' + respuesta.status);
  return datos;
}

// "2026-11-01 22:15:00" -> "01/11/2026 22:15"
function formatearFecha(texto) {
  if (!texto) return '';
  const [fecha, hora = ''] = texto.split(' ');
  const [anio, mes, dia] = fecha.split('-');
  return dia + '/' + mes + '/' + anio + (hora ? ' ' + hora.slice(0, 5) : '');
}

function crearEtiqueta(leida) {
  const span = document.createElement('span');
  span.className = 'etiqueta ' + (leida ? 'etiqueta-leida' : 'etiqueta-nueva');
  span.textContent = leida ? 'Leída' : 'No leída';
  return span;
}

// ---------- Listado ----------
async function cargarConsultas() {
  const parametros = new URLSearchParams();
  if (filtroEstado.value) parametros.set('estado', filtroEstado.value);
  if (filtroFecha.value) parametros.set('fecha', filtroFecha.value);
  if (filtroBusqueda.value.trim()) parametros.set('q', filtroBusqueda.value.trim());

  try {
    const consultas = await api('/api/consultas?' + parametros.toString());
    dibujarTabla(consultas);
  } catch (error) {
    if (error.message === 'Sesión no válida') return;
    cuerpoTabla.innerHTML = '';
    mensajeLista.textContent = 'No se pudieron cargar las consultas: ' + error.message;
    mensajeLista.className = 'mensaje-lista mensaje-error';
  }
}

function dibujarTabla(consultas) {
  cuerpoTabla.innerHTML = '';
  const leidas = consultas.filter((c) => c.leida).length;
  document.getElementById('totalGeneral').textContent = consultas.length;
  document.getElementById('totalLeidas').textContent = leidas;
  document.getElementById('totalNoLeidas').textContent = consultas.length - leidas;

  if (consultas.length === 0) {
    mensajeLista.textContent = 'No hay consultas que coincidan con los filtros.';
    mensajeLista.className = 'mensaje-lista';
    return;
  }
  mensajeLista.textContent = '';
  mensajeLista.className = 'mensaje-lista';

  consultas.forEach((c) => {
    const fila = document.createElement('tr');
    fila.tabIndex = 0;
    fila.className = c.leida ? '' : 'fila-nueva';
    fila.setAttribute('aria-label', 'Ver detalle de la consulta de ' + c.nombre);

    const celdas = [
      ['Nombre', c.nombre], ['Email', c.email], ['Asunto', c.asunto], ['Fecha', formatearFecha(c.fecha)]
    ];
    celdas.forEach(([titulo, texto]) => {
      const td = document.createElement('td');
      td.dataset.titulo = titulo; // se usa en el celular para mostrar el nombre de la columna
      td.textContent = texto; // textContent evita que se ejecute código HTML enviado por un visitante
      fila.appendChild(td);
    });

    const tdEstado = document.createElement('td');
    tdEstado.dataset.titulo = 'Estado';
    tdEstado.appendChild(crearEtiqueta(c.leida));
    fila.appendChild(tdEstado);

    fila.addEventListener('click', () => abrirDetalle(c.id));
    fila.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirDetalle(c.id); }
    });
    cuerpoTabla.appendChild(fila);
  });
}

// ---------- Detalle ----------
async function abrirDetalle(id) {
  ultimoFoco = document.activeElement;
  document.getElementById('detError').textContent = '';
  try {
    consultaAbierta = await api('/api/consultas/' + id);
    mostrarDetalle();
    modal.hidden = false;
    document.getElementById('btnCerrarModal').focus();
  } catch (error) {
    if (error.message === 'Sesión no válida') return;
    mensajeLista.textContent = 'No se pudo abrir la consulta: ' + error.message;
    mensajeLista.className = 'mensaje-lista mensaje-error';
  }
}

function mostrarDetalle() {
  const c = consultaAbierta;
  document.getElementById('detAsunto').textContent = c.asunto;
  document.getElementById('detNombre').textContent = c.nombre;
  document.getElementById('detEmail').textContent = c.email;
  document.getElementById('detTelefono').textContent = c.telefono || 'No indicado';
  document.getElementById('detServicio').textContent = c.servicio || 'Sin especificar';
  document.getElementById('detFecha').textContent = formatearFecha(c.fecha);
  document.getElementById('detMensaje').textContent = c.mensaje;

  const estado = document.getElementById('detEstado');
  estado.textContent = '';
  estado.appendChild(crearEtiqueta(c.leida));
  if (c.leida && c.leida_por) estado.append(' Marcada por ' + c.leida_por);

  document.getElementById('btnToggleLeida').textContent = c.leida ? 'Marcar como no leída' : 'Marcar como leída';
}

function cerrarModal() {
  modal.hidden = true;
  consultaAbierta = null;
  if (ultimoFoco) ultimoFoco.focus();
}

document.getElementById('btnToggleLeida').addEventListener('click', async () => {
  if (!consultaAbierta) return;
  const boton = document.getElementById('btnToggleLeida');
  boton.disabled = true;
  try {
    await api('/api/consultas/' + consultaAbierta.id + '/leida', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leida: !consultaAbierta.leida })
    });
    consultaAbierta = await api('/api/consultas/' + consultaAbierta.id);
    mostrarDetalle();
    cargarConsultas();
  } catch (error) {
    if (error.message !== 'Sesión no válida') document.getElementById('detError').textContent = error.message;
  } finally {
    boton.disabled = false;
  }
});

['btnCerrarModal', 'btnCerrarModal2', 'modalFondo'].forEach((id) =>
  document.getElementById(id).addEventListener('click', cerrarModal)
);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) cerrarModal(); });

// ---------- Filtros ----------
let temporizador;
filtroBusqueda.addEventListener('input', () => {
  clearTimeout(temporizador);
  temporizador = setTimeout(cargarConsultas, 300); // espera a que termine de escribir
});
filtroEstado.addEventListener('change', cargarConsultas);
filtroFecha.addEventListener('change', cargarConsultas);
document.getElementById('btnLimpiar').addEventListener('click', () => {
  filtroEstado.value = '';
  filtroFecha.value = '';
  filtroBusqueda.value = '';
  cargarConsultas();
});

// ---------- Cerrar sesión ----------
document.getElementById('btnSalir').addEventListener('click', async () => {
  try { await fetch('/api/logout', { method: 'POST' }); } catch (e) { console.error(e); }
  window.location.href = '/admin-login.html';
});

// ---------- Inicio ----------
api('/api/sesion')
  .then((datos) => { document.getElementById('saludo').textContent = 'Hola, ' + datos.nombre; })
  .catch(() => {});
cargarConsultas();
