// =====================================================
// MDRN & CO. - Login del administrador
// =====================================================
const formLogin = document.getElementById('formLogin');
const errorLogin = document.getElementById('errorLogin');
const btnLogin = document.getElementById('btnLogin');

// Si ya hay una sesión abierta, se va directo al panel
fetch('/api/sesion').then((r) => { if (r.ok) window.location.href = '/admin'; }).catch(() => {});

formLogin.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  errorLogin.textContent = '';

  const usuario = formLogin.usuario.value.trim();
  const password = formLogin.password.value;

  if (!usuario || !password) {
    errorLogin.textContent = 'Completá usuario y contraseña.';
    return;
  }

  btnLogin.disabled = true;
  btnLogin.textContent = 'Ingresando...';

  try {
    const respuesta = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, password })
    });
    const resultado = await respuesta.json().catch(() => ({}));

    if (respuesta.ok) {
      window.location.href = '/admin';
    } else {
      errorLogin.textContent = resultado.error || 'No se pudo iniciar sesión.';
      formLogin.password.value = '';
    }
  } catch (error) {
    console.error(error);
    errorLogin.textContent = 'No hay conexión con el servidor.';
  } finally {
    btnLogin.disabled = false;
    btnLogin.textContent = 'Ingresar';
  }
});
