-- PASO 1: paquetes, bitacora de errores e integridad
-- Ejecutar sobre la BD panaderia_san_carlos con Alt+X

-- 1. Paquetes (en PostgreSQL se hacen con esquemas)
CREATE SCHEMA IF NOT EXISTS pkg_utilidades;
CREATE SCHEMA IF NOT EXISTS pkg_recetas;
CREATE SCHEMA IF NOT EXISTS pkg_produccion;
CREATE SCHEMA IF NOT EXISTS pkg_pedidos;

-- 2. Bitacora de errores
CREATE TABLE IF NOT EXISTS panaderia.bitacora_errores (
    id_error       SERIAL PRIMARY KEY,
    procedimiento  VARCHAR(100) NOT NULL,
    mensaje        TEXT         NOT NULL,
    parametros     TEXT,
    fecha          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Procedimiento para registrar errores
CREATE OR REPLACE PROCEDURE pkg_utilidades.sp_registrar_error(
    IN p_procedimiento VARCHAR,
    IN p_mensaje       TEXT,
    IN p_parametros    TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO panaderia.bitacora_errores (procedimiento, mensaje, parametros)
    VALUES (p_procedimiento, p_mensaje, p_parametros);
END;
$$;

-- 4. Integridad: una produccion por pan y fecha
ALTER TABLE panaderia.produccion
    ADD CONSTRAINT uq_produccion_producto_fecha UNIQUE (id_producto, fecha);

-- 5. Integridad: lo producido no puede superar lo requerido
ALTER TABLE panaderia.produccion
    ADD CONSTRAINT chk_producida_no_supera_requerida
    CHECK (cantidad_producida <= cantidad_requerida);

-- Comprobacion: deben salir 4 esquemas pkg_
SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'pkg_%';
