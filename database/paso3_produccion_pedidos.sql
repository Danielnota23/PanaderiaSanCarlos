-- PASO 3: paquetes pkg_produccion y pkg_pedidos
-- Ejecutar sobre la BD panaderia_san_carlos con Alt+X

-- =====================================================================
-- 5. PAQUETE pkg_produccion
-- =====================================================================

/* Genera la producción de una fecha a partir de los pedidos PENDIENTES
   de todas las sucursales (suma por tipo de pan).
   - Si ya existe producción de ese pan en esa fecha, le suma lo nuevo.
   - Los pedidos incluidos pasan a estado EN_PRODUCCION.
   Devuelve en p_registros cuántos tipos de pan se generaron/actualizaron. */
CREATE OR REPLACE PROCEDURE pkg_produccion.sp_generar_produccion(
    IN    p_fecha     DATE,
    INOUT p_registros INTEGER DEFAULT 0
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_error TEXT;
    v_fila  RECORD;
BEGIN
    p_registros := 0;

    BEGIN
        IF p_fecha IS NULL THEN
            RAISE EXCEPTION 'La fecha es obligatoria';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM panaderia.pedidos
            WHERE fecha_pedido = p_fecha AND estado = 'PENDIENTE'
        ) THEN
            RAISE EXCEPTION 'No hay pedidos pendientes para la fecha %',
                TO_CHAR(p_fecha, 'DD/MM/YYYY');
        END IF;

        FOR v_fila IN
            SELECT dp.id_producto, SUM(dp.cantidad)::INTEGER AS total
            FROM panaderia.pedidos pe
            INNER JOIN panaderia.detalle_pedido dp ON dp.id_pedido = pe.id_pedido
            WHERE pe.fecha_pedido = p_fecha
              AND pe.estado = 'PENDIENTE'
            GROUP BY dp.id_producto
        LOOP
            INSERT INTO panaderia.produccion
                (id_producto, fecha, cantidad_requerida, cantidad_producida, estado)
            VALUES
                (v_fila.id_producto, p_fecha, v_fila.total, 0, 'PENDIENTE')
            ON CONFLICT (id_producto, fecha) DO UPDATE
                SET cantidad_requerida =
                        panaderia.produccion.cantidad_requerida + EXCLUDED.cantidad_requerida,
                    estado = CASE
                        WHEN panaderia.produccion.cantidad_producida > 0 THEN 'EN_PROCESO'
                        ELSE 'PENDIENTE'
                    END;

            p_registros := p_registros + 1;
        END LOOP;

        UPDATE panaderia.pedidos
        SET estado = 'EN_PRODUCCION'
        WHERE fecha_pedido = p_fecha
          AND estado = 'PENDIENTE';

    EXCEPTION
        WHEN OTHERS THEN
            v_error := SQLERRM;
    END;

    IF v_error IS NOT NULL THEN
        ROLLBACK;
        CALL pkg_utilidades.sp_registrar_error(
            'pkg_produccion.sp_generar_produccion', v_error,
            'fecha=' || COALESCE(p_fecha::TEXT, 'null'));
        COMMIT;
        RAISE EXCEPTION '%', v_error;
    END IF;

    COMMIT;
END;
$$;


/* Registra el avance de una producción.
   p_cantidad_producida es el TOTAL producido hasta ahora (no la diferencia).
   Por las unidades nuevas se descuentan los ingredientes según la receta:
       consumo = cantidad_receta * unidades_nuevas / rendimiento
   Si algún ingrediente no alcanza, se hace ROLLBACK de todo. */
CREATE OR REPLACE PROCEDURE pkg_produccion.sp_registrar_avance(
    IN p_id_produccion      INTEGER,
    IN p_cantidad_producida INTEGER,
    IN p_estado             VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_error        TEXT;
    v_prod         RECORD;
    v_receta       RECORD;
    v_ing          RECORD;
    v_nuevas       INTEGER;
    v_consumo      NUMERIC(10,2);
    v_estado_final VARCHAR(20);
BEGIN
    BEGIN
        -- Bloquear el registro mientras se procesa
        SELECT pr.id_produccion, pr.id_producto, pr.cantidad_requerida,
               pr.cantidad_producida, pr.estado, p.nombre AS nombre_producto
        INTO v_prod
        FROM panaderia.produccion pr
        INNER JOIN panaderia.productos p ON p.id_producto = pr.id_producto
        WHERE pr.id_produccion = p_id_produccion
        FOR UPDATE OF pr;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'El registro de producción % no existe', p_id_produccion;
        END IF;

        IF p_cantidad_producida IS NULL OR p_cantidad_producida < 0 THEN
            RAISE EXCEPTION 'La cantidad producida no es válida';
        END IF;

        IF p_cantidad_producida < v_prod.cantidad_producida THEN
            RAISE EXCEPTION
                'No se puede disminuir lo producido (ya se registraron % unidades)',
                v_prod.cantidad_producida;
        END IF;

        IF p_cantidad_producida > v_prod.cantidad_requerida THEN
            RAISE EXCEPTION
                'La cantidad producida (%) supera la requerida (%)',
                p_cantidad_producida, v_prod.cantidad_requerida;
        END IF;

        IF UPPER(COALESCE(p_estado, '')) NOT IN ('PENDIENTE', 'EN_PROCESO', 'FINALIZADA') THEN
            RAISE EXCEPTION 'Estado de producción no válido';
        END IF;

        v_nuevas := p_cantidad_producida - v_prod.cantidad_producida;

        -- Descontar ingredientes de las unidades nuevas
        IF v_nuevas > 0 THEN

            SELECT id_receta, rendimiento INTO v_receta
            FROM panaderia.recetas
            WHERE id_producto = v_prod.id_producto AND estado = TRUE;

            IF NOT FOUND THEN
                RAISE EXCEPTION
                    'El pan % no tiene receta. Regístrela antes de producir',
                    v_prod.nombre_producto;
            END IF;

            FOR v_ing IN
                SELECT i.id_ingrediente, i.nombre, i.unidad_medida,
                       i.existencia_actual, dr.cantidad
                FROM panaderia.detalle_receta dr
                INNER JOIN panaderia.ingredientes i ON i.id_ingrediente = dr.id_ingrediente
                WHERE dr.id_receta = v_receta.id_receta
                ORDER BY i.id_ingrediente
                FOR UPDATE OF i
            LOOP
                v_consumo := ROUND(v_ing.cantidad * v_nuevas / v_receta.rendimiento, 2);

                IF v_consumo <= 0 THEN
                    CONTINUE;
                END IF;

                IF v_ing.existencia_actual < v_consumo THEN
                    RAISE EXCEPTION
                        'Existencia insuficiente de %: se necesitan % %, hay %',
                        v_ing.nombre, v_consumo, v_ing.unidad_medida,
                        v_ing.existencia_actual;
                END IF;

                UPDATE panaderia.ingredientes
                SET existencia_actual = existencia_actual - v_consumo
                WHERE id_ingrediente = v_ing.id_ingrediente;

                INSERT INTO panaderia.movimientos_inventario
                    (id_ingrediente, tipo_movimiento, cantidad, descripcion)
                VALUES
                    (v_ing.id_ingrediente, 'SALIDA', v_consumo,
                     'Consumo por producción #' || p_id_produccion || ' de '
                     || v_prod.nombre_producto || ' (' || v_nuevas || ' unidades)');
            END LOOP;
        END IF;

        -- Estado final coherente con las cantidades
        v_estado_final := UPPER(p_estado);

        IF p_cantidad_producida = v_prod.cantidad_requerida THEN
            v_estado_final := 'FINALIZADA';
        ELSIF p_cantidad_producida > 0 AND v_estado_final = 'PENDIENTE' THEN
            v_estado_final := 'EN_PROCESO';
        END IF;

        UPDATE panaderia.produccion
        SET cantidad_producida = p_cantidad_producida,
            estado = v_estado_final
        WHERE id_produccion = p_id_produccion;

    EXCEPTION
        WHEN OTHERS THEN
            v_error := SQLERRM;
    END;

    IF v_error IS NOT NULL THEN
        ROLLBACK;
        CALL pkg_utilidades.sp_registrar_error(
            'pkg_produccion.sp_registrar_avance', v_error,
            'produccion=' || COALESCE(p_id_produccion::TEXT, 'null')
            || ', cantidad=' || COALESCE(p_cantidad_producida::TEXT, 'null'));
        COMMIT;
        RAISE EXCEPTION '%', v_error;
    END IF;

    COMMIT;
END;
$$;


/* Total de ingredientes que hacen falta para terminar la producción
   pendiente de una fecha, comparado con la existencia actual. */
CREATE OR REPLACE FUNCTION pkg_produccion.fn_requerimiento_fecha(
    p_fecha DATE
)
RETURNS TABLE (
    id_ingrediente     INTEGER,
    nombre_ingrediente VARCHAR,
    unidad_medida      VARCHAR,
    cantidad_necesaria NUMERIC,
    existencia_actual  NUMERIC,
    faltante           NUMERIC
)
LANGUAGE sql
STABLE
AS $$
    SELECT i.id_ingrediente,
           i.nombre,
           i.unidad_medida,
           ROUND(SUM(dr.cantidad * (pr.cantidad_requerida - pr.cantidad_producida)
                     / r.rendimiento), 2) AS cantidad_necesaria,
           i.existencia_actual,
           GREATEST(
               ROUND(SUM(dr.cantidad * (pr.cantidad_requerida - pr.cantidad_producida)
                         / r.rendimiento), 2) - i.existencia_actual,
               0) AS faltante
    FROM panaderia.produccion pr
    INNER JOIN panaderia.recetas r         ON r.id_producto = pr.id_producto AND r.estado = TRUE
    INNER JOIN panaderia.detalle_receta dr ON dr.id_receta = r.id_receta
    INNER JOIN panaderia.ingredientes i    ON i.id_ingrediente = dr.id_ingrediente
    WHERE pr.fecha = p_fecha
      AND pr.estado <> 'FINALIZADA'
    GROUP BY i.id_ingrediente, i.nombre, i.unidad_medida, i.existencia_actual
    ORDER BY i.nombre;
$$;


-- =====================================================================
-- 6. PAQUETE pkg_pedidos
-- =====================================================================

/* Consolidado de pedidos por fecha y turno (como la hoja de Excel):
   una fila por sucursal y tipo de pan. Si p_turno es NULL trae ambos. */
CREATE OR REPLACE FUNCTION pkg_pedidos.fn_consolidado(
    p_fecha DATE,
    p_turno VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    id_sucursal     INTEGER,
    nombre_sucursal VARCHAR,
    id_producto     INTEGER,
    nombre_producto VARCHAR,
    cantidad        BIGINT
)
LANGUAGE sql
STABLE
AS $$
    SELECT s.id_sucursal,
           s.nombre,
           p.id_producto,
           p.nombre,
           SUM(dp.cantidad)
    FROM panaderia.pedidos pe
    INNER JOIN panaderia.sucursales s      ON s.id_sucursal = pe.id_sucursal
    INNER JOIN panaderia.detalle_pedido dp ON dp.id_pedido = pe.id_pedido
    INNER JOIN panaderia.productos p       ON p.id_producto = dp.id_producto
    WHERE pe.fecha_pedido = p_fecha
      AND pe.estado <> 'CANCELADO'
      AND (p_turno IS NULL OR pe.turno = p_turno)
    GROUP BY s.id_sucursal, s.nombre, p.id_producto, p.nombre
    ORDER BY p.id_producto, s.id_sucursal;
$$;


/* Cambia el estado de un pedido validando el flujo:
   PENDIENTE -> EN_PRODUCCION -> DESPACHADO
   PENDIENTE / EN_PRODUCCION -> CANCELADO
   Un pedido DESPACHADO o CANCELADO ya no se puede modificar. */
CREATE OR REPLACE PROCEDURE pkg_pedidos.sp_cambiar_estado(
    IN p_id_pedido INTEGER,
    IN p_estado    VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_actual VARCHAR(20);
    v_nuevo  VARCHAR(20) := UPPER(COALESCE(p_estado, ''));
    v_error  TEXT;
BEGIN
    BEGIN
        SELECT estado INTO v_actual
        FROM panaderia.pedidos
        WHERE id_pedido = p_id_pedido
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'El pedido % no existe', p_id_pedido;
        END IF;

        IF v_nuevo NOT IN ('PENDIENTE', 'EN_PRODUCCION', 'DESPACHADO', 'CANCELADO') THEN
            RAISE EXCEPTION 'Estado no válido';
        END IF;

        IF v_actual IN ('DESPACHADO', 'CANCELADO') AND v_nuevo <> v_actual THEN
            RAISE EXCEPTION 'El pedido ya está % y no se puede modificar', v_actual;
        END IF;

        UPDATE panaderia.pedidos
        SET estado = v_nuevo
        WHERE id_pedido = p_id_pedido;

    EXCEPTION
        WHEN OTHERS THEN
            v_error := SQLERRM;
    END;

    IF v_error IS NOT NULL THEN
        ROLLBACK;
        CALL pkg_utilidades.sp_registrar_error(
            'pkg_pedidos.sp_cambiar_estado', v_error,
            'pedido=' || COALESCE(p_id_pedido::TEXT, 'null') || ', estado=' || v_nuevo);
        COMMIT;
        RAISE EXCEPTION '%', v_error;
    END IF;

    COMMIT;
END;
$$;


-- =====================================================================
-- ÍNDICES
-- =====================================================================

CREATE INDEX IF NOT EXISTS idx_pedidos_fecha_turno
    ON panaderia.pedidos (fecha_pedido, turno);

CREATE INDEX IF NOT EXISTS idx_produccion_fecha
    ON panaderia.produccion (fecha);

CREATE INDEX IF NOT EXISTS idx_movimientos_ingrediente
    ON panaderia.movimientos_inventario (id_ingrediente, fecha);


-- =====================================================================
-- AJUSTE DE DATOS
-- =====================================================================

-- Los pedidos del 17/09/2022 ya se cargaron a producción manualmente,
-- así que se marcan EN_PRODUCCION para no sumarlos dos veces.
UPDATE panaderia.pedidos pe
SET estado = 'EN_PRODUCCION'
WHERE pe.estado = 'PENDIENTE'
  AND EXISTS (
      SELECT 1 FROM panaderia.produccion pr
      WHERE pr.fecha = pe.fecha_pedido);

-- Comprobacion 1: consolidado del 17/09/2022 (Central y Chiva)
SELECT * FROM pkg_pedidos.fn_consolidado('2022-09-17');

-- Comprobacion 2: insumos que faltan para terminar la produccion de esa fecha
SELECT * FROM pkg_produccion.fn_requerimiento_fecha('2022-09-17');
