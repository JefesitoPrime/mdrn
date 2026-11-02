// Uso: npm run hash -- MiNuevaClave
// Genera el hash bcrypt para guardar en la tabla administradores.
const bcrypt = require('bcryptjs');
const clave = process.argv[2];
if (!clave) {
  console.log('Falta la contraseña. Ejemplo: npm run hash -- MiNuevaClave');
  process.exit(1);
}
console.log(bcrypt.hashSync(clave, 10));
