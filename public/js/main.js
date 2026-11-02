// =====================================================
// MDRN & CO. - JavaScript del sitio público
// =====================================================

// ---------- Íconos SVG de los servicios (la base guarda solo el nombre) ----------
const ICONOS = {
  satelite: '<path d="M4 20l4-4M9 9l6 6M12.5 5.5l6 6-3 3-6-6zM3 11a8 8 0 0 1 8 8M3 7a12 12 0 0 1 12 12"/>',
  radioenlace: '<path d="M12 12v9M8 21h8M5.6 5.6a9 9 0 0 0 0 12.8M18.4 5.6a9 9 0 0 1 0 12.8M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7"/><circle cx="12" cy="12" r="1.5"/>',
  red: '<circle cx="12" cy="5" r="2.2"/><circle cx="5" cy="19" r="2.2"/><circle cx="19" cy="19" r="2.2"/><path d="M12 7.2v4.3M12 11.5l-6 5.5M12 11.5l6 5.5"/>',
  router: '<rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 16.5h.01M11 16.5h.01M8 9a6 6 0 0 1 8 0M5.5 6a10 10 0 0 1 13 0"/>',
  soporte: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>'
};
const ICONO_DEFECTO = '<circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 2"/>';

function crearIcono(nombre) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.7');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'icono');
  svg.innerHTML = ICONOS[nombre] || ICONO_DEFECTO; // el contenido sale de nuestro objeto ICONOS, no de la base
  return svg;
}

// ---------- Menú del celular ----------
const btnMenu = document.getElementById('btnMenu');
const menu = document.getElementById('menu');

btnMenu.addEventListener('click', () => {
  const abierto = menu.classList.toggle('abierto');
  btnMenu.setAttribute('aria-expanded', abierto);
});
menu.querySelectorAll('a').forEach((enlace) => {
  enlace.addEventListener('click', () => {
    menu.classList.remove('abierto');
    btnMenu.setAttribute('aria-expanded', 'false');
  });
});

// ---------- Servicios desde la API (MySQL) ----------
async function cargarServicios() {
  const contenedor = document.getElementById('listaServicios');
  const selector = document.getElementById('servicio_id');

  try {
    const respuesta = await fetch('/api/servicios');
    if (!respuesta.ok) throw new Error('Respuesta ' + respuesta.status);
    const servicios = await respuesta.json();

    contenedor.innerHTML = '';
    servicios.forEach((s) => {
      const tarjeta = document.createElement('article');
      tarjeta.className = 'servicio';

      const titulo = document.createElement('h3');
      titulo.textContent = s.nombre;
      const descripcion = document.createElement('p');
      descripcion.textContent = s.descripcion;
      const precio = document.createElement('span');
      precio.className = 'precio';
      precio.textContent = s.precio || 'Consultar';

      tarjeta.append(crearIcono(s.icono), titulo, descripcion, precio);
      contenedor.appendChild(tarjeta);

      const opcion = document.createElement('option');
      opcion.value = s.id;
      opcion.textContent = s.nombre;
      selector.appendChild(opcion);
    });
  } catch (error) {
    console.error('No se pudieron cargar los servicios:', error);
    contenedor.innerHTML = '';
    const aviso = document.createElement('p');
    aviso.className = 'nota';
    aviso.textContent = 'No pudimos cargar los servicios en este momento. Escribinos desde la sección Contacto.';
    contenedor.appendChild(aviso);
  }
}

// ---------- Formulario de consultas ----------
const form = document.getElementById('formConsulta');
const respuestaForm = document.getElementById('respuestaForm');
const btnEnviar = document.getElementById('btnEnviar');
const mensajeInput = document.getElementById('mensaje');
const contador = document.getElementById('contador');

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const REGEX_TELEFONO = /^[0-9+\-\s()]{6,30}$/;

mensajeInput.addEventListener('input', () => {
  contador.textContent = mensajeInput.value.length + ' / 2000';
});

function mostrarError(campo, texto) {
  document.getElementById('error-' + campo).textContent = texto;
  document.getElementById(campo).classList.toggle('invalido', Boolean(texto));
}

// Devuelve true si todo está bien
function validarFormulario() {
  const nombre = form.nombre.value.trim();
  const email = form.email.value.trim();
  const telefono = form.telefono.value.trim();
  const asunto = form.asunto.value.trim();
  const mensaje = form.mensaje.value.trim();
  let valido = true;

  const reglas = [
    ['nombre', nombre.length < 2, 'Ingresá tu nombre (mínimo 2 caracteres).'],
    ['email', !email, 'Ingresá tu email.'],
    ['email', email && !REGEX_EMAIL.test(email), 'El formato del email no es válido.'],
    ['telefono', telefono && !REGEX_TELEFONO.test(telefono), 'El teléfono solo puede tener números, +, -, ( ) y espacios.'],
    ['asunto', asunto.length < 3, 'Ingresá un asunto (mínimo 3 caracteres).'],
    ['mensaje', mensaje.length < 10, 'El mensaje debe tener al menos 10 caracteres.']
  ];

  // Se limpian todos los errores y se muestra el primero de cada campo
  ['nombre', 'email', 'telefono', 'asunto', 'mensaje'].forEach((c) => mostrarError(c, ''));
  reglas.forEach(([campo, falla, texto]) => {
    if (falla && !document.getElementById('error-' + campo).textContent) {
      mostrarError(campo, texto);
      valido = false;
    }
  });
  return valido;
}

function mostrarRespuesta(tipo, texto) {
  respuestaForm.className = 'respuesta ' + tipo;
  respuestaForm.textContent = texto;
}

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  respuestaForm.className = 'respuesta';
  respuestaForm.textContent = '';

  if (!validarFormulario()) {
    const primerError = form.querySelector('.invalido');
    if (primerError) primerError.focus();
    return;
  }

  const datos = {
    nombre: form.nombre.value.trim(),
    email: form.email.value.trim(),
    telefono: form.telefono.value.trim(),
    asunto: form.asunto.value.trim(),
    mensaje: form.mensaje.value.trim(),
    servicio_id: form.servicio_id.value || null
  };

  btnEnviar.disabled = true;
  btnEnviar.textContent = 'Enviando...';

  try {
    const respuesta = await fetch('/api/consultas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    const resultado = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
      mostrarRespuesta('mal', resultado.error || 'No se pudo enviar la consulta.');
    } else {
      mostrarRespuesta('ok', resultado.mensaje);
      form.reset();
      contador.textContent = '0 / 2000';
    }
  } catch (error) {
    console.error(error);
    mostrarRespuesta('mal', 'No hay conexión con el servidor. Probá de nuevo en unos minutos.');
  } finally {
    btnEnviar.disabled = false;
    btnEnviar.textContent = 'Enviar consulta';
  }
});

cargarServicios();
