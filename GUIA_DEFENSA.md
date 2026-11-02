# Guía para la defensa oral — MDRN & CO.

## 1. Presentación (30 segundos)
"Hice el sitio web corporativo de MDRN & CO., mi empresa de asistencia informática que instala redes y conectividad en zonas alejadas. El sitio presenta la empresa y sus servicios, tiene un formulario que guarda las consultas en MySQL y un panel protegido donde el dueño las lee y gestiona."

## 2. Qué hace cada tecnología

| Tecnología | Para qué la usé |
|---|---|
| **HTML5** | Estructura de las páginas (secciones, formulario, tabla). |
| **CSS3** | Diseño con los colores de la marca, responsive con `grid`, `flex` y `@media`. |
| **JavaScript** | Validar el formulario, pedir datos a la API con `fetch` y armar el panel. |
| **Node.js** | Permite ejecutar JavaScript en el servidor. |
| **Express** | Define las rutas de la API y sirve los archivos. |
| **mysql2** | Conecta Node con MySQL y ejecuta consultas SQL. |
| **cors** | Middleware que permite o restringe pedidos desde otros orígenes. |
| **path** | Arma rutas de archivos que funcionan en cualquier sistema (`path.join`). |
| **MySQL (XAMPP)** | Guarda administradores, servicios y consultas. |
| **bcryptjs** | Guarda las contraseñas como hash, no como texto. |
| **Git y GitHub** | Control de versiones y entrega del proyecto. |

## 3. Cómo funciona el sistema

**Visitante:**
1. El navegador pide `index.html` y Express lo entrega desde `public/` (`express.static` + `path`).
2. `main.js` hace `fetch('/api/servicios')`; el servidor consulta MySQL y devuelve JSON; el JS dibuja las tarjetas.
3. En el formulario, el JS valida (obligatorios, email, mensaje de 10+ caracteres) y envía `POST /api/consultas`.
4. El servidor **valida de nuevo**, hace un `INSERT` parametrizado y responde con la confirmación.

**Administrador:**
1. En `admin-login.html` envía usuario y contraseña a `POST /api/login`.
2. El servidor busca el usuario en `administradores` y compara con `bcrypt.compare`.
3. Si coincide, crea un token aleatorio, lo guarda en memoria y lo manda en una cookie `HttpOnly`.
4. `/admin` solo entrega el panel si la cookie tiene un token válido; si no, redirige al login.
5. Las rutas `GET /api/consultas` pasan por el middleware `requiereAuth`, que responde 401 sin sesión.
6. El panel llama a la API con filtros, muestra el listado y el detalle, y permite marcar como leída (`PUT`).
7. **Cerrar sesión** borra el token del servidor y la cookie.

## 4. Preguntas probables

**¿Por qué `createConnection` y no `createPool`?**
Un pool mantiene varias conexiones abiertas para muchos usuarios simultáneos. Este proyecto es pequeño, con pocos usuarios, así que una sola conexión alcanza, es más simple de entender y se ve claro cómo conecta. Como una conexión simple puede caerse, agregué una función que la vuelve a crear si falla. Si el sitio creciera, pasaría a pool.

**¿Qué es una consulta parametrizada y por qué importa?**
Es usar `?` en el SQL y pasar los valores aparte: `WHERE usuario = ?`. MySQL trata el dato como dato, nunca como código. Así alguien no puede escribir `' OR 1=1 --` para romper la consulta (inyección SQL).

**¿Por qué bcrypt?**
Guarda un hash con "sal", que no se puede revertir. Si roban la base, no ven las contraseñas reales.

**¿Por qué validás en el cliente y en el servidor?**
El cliente da respuesta rápida al usuario, pero cualquiera puede saltearlo (con Postman, por ejemplo). La validación del servidor es la que realmente protege.

**¿Cómo protegiste el panel?**
Con sesión en el backend: `/admin` y las rutas privadas verifican la cookie. Esconder un botón no alcanza. Además `admin.html` está fuera de `public/`, así que no se puede abrir directo.

**¿Qué es `express.json()`?**
Middleware que lee el cuerpo de un pedido en JSON y lo deja en `req.body`.

**¿Qué es CORS?**
Una regla del navegador que bloquea pedidos entre orígenes distintos. El middleware `cors` indica quién puede hacerlos. Acá frontend y backend comparten origen, pero lo configuré como pide la consigna.

**¿Qué relaciones tiene la base?**
`consultas.servicio_id` → `servicios.id` (servicio de interés) y `consultas.leida_por` → `administradores.id` (quién la marcó). Son claves foráneas.

**¿Qué haría con más tiempo?**
Guardar sesiones en la base o usar JWT, enviar un email al llegar una consulta, paginar el listado y agregar un CRUD de servicios.

## 5. Obstáculos y soluciones (contá los que realmente viviste)
La profesora pide obstáculos y soluciones. Estos son los que aparecieron al armar el proyecto; agregá los tuyos y quedate con los que puedas explicar:
- **Acentos mal guardados** al importar el `.sql`: se solucionó con `SET NAMES utf8mb4` al inicio de `database.sql`.
- **Conexión simple que puede caerse:** se agregó reconexión automática.
- **Proteger el panel:** ocultar un botón no alcanza; la protección real es la sesión validada en el backend.
- **Texto con HTML enviado en el formulario:** el panel lo muestra con `textContent` en lugar de `innerHTML`, así no se ejecuta.

## 6. Demostración sugerida (3 minutos)
1. Mostrar el sitio en escritorio y achicar la ventana para ver el responsive.
2. Enviar el formulario con errores y después correctamente.
3. Mostrar el registro nuevo en phpMyAdmin.
4. Intentar entrar a `/admin` sin sesión → redirige.
5. Iniciar sesión, abrir el detalle, marcar como leída, usar filtros y buscar.
6. Cerrar sesión.
7. Mostrar en `server.js` el `createConnection`, un `?` parametrizado y `requiereAuth`.
