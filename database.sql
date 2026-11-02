-- =====================================================
-- MDRN & CO. - Base de datos
-- Se puede ejecutar completo desde phpMyAdmin (pestaña "Importar"
-- o pestaña "SQL") o desde la consola de MySQL.
-- Usuario de prueba: admin / Mdrn2026!
-- =====================================================

-- Asegura que los acentos y la ñ se guarden bien
SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS mdrn_co
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE mdrn_co;

-- Se borran las tablas en orden (primero la que depende de las otras)
DROP TABLE IF EXISTS consultas;
DROP TABLE IF EXISTS servicios;
DROP TABLE IF EXISTS administradores;

-- -----------------------------------------------------
-- Tabla administradores (quienes entran al panel)
-- La contraseña se guarda con bcrypt, nunca en texto plano
-- -----------------------------------------------------
CREATE TABLE administradores (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario       VARCHAR(50)  NOT NULL,
  password_hash VARCHAR(100) NOT NULL,
  nombre        VARCHAR(100) NOT NULL,
  creado_en     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admin_usuario (usuario)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Tabla servicios (se muestran en la web desde /api/servicios)
-- -----------------------------------------------------
CREATE TABLE servicios (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre      VARCHAR(100) NOT NULL,
  descripcion VARCHAR(500) NOT NULL,
  icono       VARCHAR(30)  NOT NULL,
  precio      VARCHAR(40)  NOT NULL DEFAULT 'Consultar',
  orden       TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Tabla consultas (lo que envían los visitantes)
-- servicio_id: servicio de interés (opcional)
-- leida_por:   administrador que la marcó como leída
-- -----------------------------------------------------
CREATE TABLE consultas (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre      VARCHAR(100) NOT NULL,
  email       VARCHAR(120) NOT NULL,
  telefono    VARCHAR(30)  NULL,
  asunto      VARCHAR(150) NOT NULL,
  mensaje     TEXT         NOT NULL,
  servicio_id INT UNSIGNED NULL,
  leida       TINYINT(1)   NOT NULL DEFAULT 0,
  leida_por   INT UNSIGNED NULL,
  fecha       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_consultas_fecha (fecha),
  KEY idx_consultas_leida (leida),
  CONSTRAINT fk_consulta_servicio
    FOREIGN KEY (servicio_id) REFERENCES servicios (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_consulta_admin
    FOREIGN KEY (leida_por) REFERENCES administradores (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =====================================================
-- DATOS INICIALES
-- =====================================================

-- Contraseña: Mdrn2026!  (hash bcrypt)
INSERT INTO administradores (usuario, password_hash, nombre) VALUES
('admin', '$2b$10$LdaqZsZ7XDd54zAJRuPpUuWfCIKq.cAyUGLc3Z4iBistfiwuu7obG', 'Santiago González');

-- Precios en "Consultar": el documento de la empresa no define precios
INSERT INTO servicios (nombre, descripcion, icono, precio, orden) VALUES
('Conectividad satelital',
 'Internet para zonas donde casi no hay infraestructura de comunicaciones cerca: campos, minas, obras y estaciones de investigación.',
 'satelite', 'Consultar', 1),
('Instalación de radioenlaces',
 'Conexión entre dos puntos alejados mediante antenas de larga distancia, cuando existe un lugar desde el cual establecer el enlace.',
 'radioenlace', 'Consultar', 2),
('Redes cableadas y Wi-Fi',
 'Diseño e instalación de la red interna del establecimiento: cableado y cobertura Wi-Fi para computadoras, impresoras, cámaras y servidores.',
 'red', 'Consultar', 3),
('Routers y switches',
 'Instalación y configuración de routers y switches para distribuir la conectividad de forma estable y preparada para crecer.',
 'router', 'Consultar', 4),
('Mantenimiento y asistencia técnica',
 'Soporte continuo una vez instalada la red: monitoreo, resolución de fallas y actualización de equipamiento. Incluye garantía de instalación.',
 'soporte', 'Consultar', 5);

-- Consultas de ejemplo para probar el panel
INSERT INTO consultas (nombre, email, telefono, asunto, mensaje, servicio_id, leida, fecha) VALUES
('Laura Benítez', 'laura.benitez@ejemplo.com', '+54 9 2964 11-2233',
 'Internet para un campo',
 'Hola, tenemos un campo a 80 km del pueblo y no hay señal de ningún tipo. Necesitamos internet para oficina y cámaras. ¿Pueden hacer un relevamiento?',
 1, 0, DATE_SUB(NOW(), INTERVAL 1 DAY)),
('Ramiro Soto', 'ramiro.soto@ejemplo.com', NULL,
 'Presupuesto de red para depósito',
 'Estamos armando un depósito logístico y necesitamos cableado, Wi-Fi y switches para unas 30 computadoras. Quedo atento al presupuesto.',
 3, 1, DATE_SUB(NOW(), INTERVAL 3 DAY)),
('Obras Patagonia S.A.', 'contacto@obraspatagonia.example', '+54 9 2964 55-8899',
 'Enlace para obra en construcción',
 'Tenemos una obra a 12 km de la ruta. Queremos saber si es viable un radioenlace y cuánto tiempo lleva la instalación.',
 2, 0, NOW());
