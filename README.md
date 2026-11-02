# MDRN & CO. — Sitio corporativo + panel de administración

Acreditación de Programación IV (7.º año) · Escuela Dr. Ernesto Guevara
Autor: Santiago González

Sitio web de **MDRN & CO.** ("Llevamos internet donde nadie más se anima a llegar"): presenta la empresa y sus servicios, recibe consultas por un formulario, las guarda en MySQL y las muestra en un panel de administración protegido.

## Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend | HTML5, CSS3, JavaScript puro |
| Backend | Node.js + Express |
| Base de datos | MySQL (XAMPP) con `mysql2` y `createConnection()` (sin pool) |
| Módulos | `express`, `mysql2`, `cors`, `path` (de Node) y `bcryptjs` (contraseñas) |
| Versiones | Git + GitHub |

## Estructura

```
mdrn-web/
├── server.js            Servidor y API REST
├── database.sql         Crea la base, tablas y datos iniciales
├── generar-hash.js      Genera hashes bcrypt para nuevas contraseñas
├── package.json
├── privado/
│   └── admin.html       Panel (solo se entrega con sesión iniciada)
└── public/              Archivos estáticos (sitio público)
    ├── index.html
    ├── admin-login.html
    ├── css/  styles.css, admin.css
    ├── js/   main.js, admin-login.js, admin.js
    └── img/  logo.png, favicon.png
```

## Instalación paso a paso

### 1. Requisitos
- [Node.js](https://nodejs.org) (versión 18 o superior)
- [XAMPP](https://www.apachefriends.org)
- Git

### 2. Instalar dependencias
Abrí una terminal en la carpeta del proyecto y ejecutá:
```
npm install
```

### 3. Iniciar XAMPP
1. Abrí el **XAMPP Control Panel**.
2. Presioná **Start** en **MySQL**. (Apache también se puede iniciar para usar phpMyAdmin; el sitio lo sirve Node, no Apache.)

### 4. Importar la base de datos
1. Entrá a <http://localhost/phpmyadmin>.
2. Pestaña **Importar** → **Seleccionar archivo** → elegí `database.sql` → **Importar**.
   (También sirve la pestaña **SQL**: pegás el contenido y presionás **Continuar**.)
3. Debe aparecer la base `mdrn_co` con las tablas `administradores`, `servicios` y `consultas`.

### 5. Ejecutar el servidor
```
npm start
```
Tiene que mostrar:
```
Servidor MDRN & CO. en http://localhost:3000
Conectado a MySQL (base: mdrn_co)
```

> Si tu MySQL tiene contraseña para `root` o usa otro puerto, ejecutá antes (Windows PowerShell):
> `$env:DB_PASSWORD="tu_clave"; npm start`

### 6. Probar el sitio
Abrí <http://localhost:3000>.

### 7. Probar el formulario
1. Andá a **Contacto**.
2. Probá enviarlo vacío: aparecen los errores de validación.
3. Probá un email inválido (`hola`) y un mensaje de menos de 10 caracteres.
4. Completalo bien y presioná **Enviar consulta**: aparece la confirmación.
5. Verificá en phpMyAdmin → `mdrn_co` → `consultas` que se guardó.

### 8. Acceder al panel de administración
- Desde el pie de la página (**Acceso administración**) o directo en <http://localhost:3000/admin-login.html>
- **Usuario:** `admin`
- **Contraseña:** `Mdrn2026!`  *(solo de prueba; cambiala antes de publicar)*

En el panel podés: ver el listado, hacer clic en una consulta para ver el detalle, marcarla como leída / no leída, filtrar por estado y fecha, buscar por nombre o email y **Cerrar sesión**.

Si entrás a <http://localhost:3000/admin> sin iniciar sesión, el servidor te redirige al login.

### Cambiar la contraseña del administrador
```
npm run hash -- MiNuevaClave
```
Copiá el hash que imprime y ejecutá en phpMyAdmin:
```sql
UPDATE administradores SET password_hash = 'EL_HASH_COPIADO' WHERE usuario = 'admin';
```

## API REST

| Método | Ruta | Acceso | Qué hace |
|---|---|---|---|
| GET | `/api/servicios` | Público | Lista los servicios desde MySQL |
| POST | `/api/consultas` | Público | Valida y guarda una consulta |
| GET | `/api/consultas` | Admin | Lista consultas. Filtros: `?estado=leidas\|noleidas&fecha=AAAA-MM-DD&q=texto` |
| GET | `/api/consultas/:id` | Admin | Detalle de una consulta |
| PUT | `/api/consultas/:id/leida` | Admin | Marca leída / no leída (`{"leida": true}`) |
| POST | `/api/login` | Público | Valida usuario y contraseña (bcrypt) |
| POST | `/api/logout` | Admin | Cierra la sesión |
| GET | `/api/sesion` | Admin | Datos del admin logueado |

## Seguridad

- Contraseñas guardadas con **bcrypt** (nunca en texto plano).
- Consultas SQL **parametrizadas** (`?`) contra inyección SQL.
- Validación en el **cliente y también en el servidor**.
- Sesión con token aleatorio en cookie `HttpOnly` + `SameSite=Strict`, con vencimiento de 2 horas.
- Rutas privadas y `/admin` protegidas desde el backend; `admin.html` no está en la carpeta pública.
- Límite de 5 intentos de login fallidos cada 15 minutos por IP.
- El panel muestra los datos con `textContent`, así que el HTML que escriba un visitante no se ejecuta.
- Los mensajes de error no exponen datos internos.

## Subir el proyecto a GitHub

1. Creá un repositorio **vacío** en <https://github.com/new> (sin README ni .gitignore), por ejemplo `mdrn-co-web`.
2. En la terminal, dentro de la carpeta del proyecto:
```
git init
git add .
git commit -m "Primera versión del sitio MDRN & CO."
git branch -M main
git remote add origin https://github.com/TU_USUARIO/mdrn-co-web.git
git push -u origin main
```
3. Comprobá que `node_modules` **no** se subió (el `.gitignore` ya lo excluye) y que `database.sql` sí está.
4. Entregá un archivo de **bloc de notas (.txt)** con la URL del repositorio.

## Problemas frecuentes

| Problema | Solución |
|---|---|
| `No se pudo conectar a MySQL` | Iniciá MySQL en XAMPP e importá `database.sql`. |
| `Access denied for user 'root'` | Tu MySQL tiene contraseña: usá la variable `DB_PASSWORD`. |
| `EADDRINUSE: puerto 3000` | Otro programa usa el puerto: cerralo o ejecutá con `PORT=3001`. |
| Los servicios no aparecen | Revisá que el servidor esté corriendo y la base importada. |
| Se pierde la sesión al reiniciar el servidor | Es normal: las sesiones viven en memoria. Volvé a iniciar sesión. |
