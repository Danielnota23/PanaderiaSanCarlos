-- PASO 2: paquete pkg_recetas (procedimientos y funcion) + recetas de cada pan
-- Ejecutar sobre la BD panaderia_san_carlos con Alt+X

-- =====================================================================
-- 4. PAQUETE pkg_recetas
-- =====================================================================

/* Crea o actualiza la receta de un producto.
   p_ingredientes es un arreglo JSON con este formato:
     [ {"idIngrediente": 1, "cantidad": 5.0},
       {"idIngrediente": 8, "cantidad": 0.5} ]
   Las cantidades son las necesarias para producir "p_rendimiento" panes. */
CREATE OR REPLACE PROCEDURE pkg_recetas.sp_guardar_receta(
    IN    p_id_producto  INTEGER,
    IN    p_nombre       VARCHAR,
    IN    p_rendimiento  INTEGER,
    IN    p_ingredientes JSONB,
    INOUT p_id_receta    INTEGER DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_error    TEXT;
    v_item     JSONB;
    v_id_ing   INTEGER;
    v_cantidad NUMERIC(10,3);
BEGIN
    BEGIN
        -- Validaciones
        IF NOT EXISTS (
            SELECT 1 FROM panaderia.productos
            WHERE id_producto = p_id_producto AND estado = TRUE
        ) THEN
            RAISE EXCEPTION 'El producto % no existe o está inactivo', p_id_producto;
        END IF;

        IF p_nombre IS NULL OR TRIM(p_nombre) = '' THEN
            RAISE EXCEPTION 'El nombre de la receta es obligatorio';
        END IF;

        IF p_rendimiento IS NULL OR p_rendimiento <= 0 THEN
            RAISE EXCEPTION 'El rendimiento debe ser mayor que cero';
        END IF;

        IF p_ingredientes IS NULL
           OR jsonb_typeof(p_ingredientes) <> 'array'
           OR jsonb_array_length(p_ingredientes) = 0 THEN
            RAISE EXCEPTION 'La receta debe tener al menos un ingrediente';
        END IF;

        -- Encabezado: un producto tiene una sola receta
        SELECT id_receta INTO p_id_receta
        FROM panaderia.recetas
        WHERE id_producto = p_id_producto;

        IF p_id_receta IS NULL THEN
            INSERT INTO panaderia.recetas (id_producto, nombre, rendimiento, estado)
            VALUES (p_id_producto, TRIM(p_nombre), p_rendimiento, TRUE)
            RETURNING id_receta INTO p_id_receta;
        ELSE
            UPDATE panaderia.recetas
            SET nombre = TRIM(p_nombre),
                rendimiento = p_rendimiento,
                estado = TRUE
            WHERE id_receta = p_id_receta;

            DELETE FROM panaderia.detalle_receta
            WHERE id_receta = p_id_receta;
        END IF;

        -- Detalle de ingredientes
        FOR v_item IN SELECT * FROM jsonb_array_elements(p_ingredientes)
        LOOP
            v_id_ing   := (v_item ->> 'idIngrediente')::INTEGER;
            v_cantidad := (v_item ->> 'cantidad')::NUMERIC;

            IF NOT EXISTS (
                SELECT 1 FROM panaderia.ingredientes
                WHERE id_ingrediente = v_id_ing AND estado = TRUE
            ) THEN
                RAISE EXCEPTION 'El ingrediente % no existe o está inactivo', v_id_ing;
            END IF;

            IF v_cantidad IS NULL OR v_cantidad <= 0 THEN
                RAISE EXCEPTION 'La cantidad de cada ingrediente debe ser mayor que cero';
            END IF;

            -- uq_receta_ingrediente impide ingredientes repetidos
            INSERT INTO panaderia.detalle_receta (id_receta, id_ingrediente, cantidad)
            VALUES (p_id_receta, v_id_ing, v_cantidad);
        END LOOP;

    EXCEPTION
        WHEN unique_violation THEN
            v_error := 'Un ingrediente está repetido en la receta';
        WHEN invalid_text_representation THEN
            v_error := 'Los datos de los ingredientes no tienen un formato válido';
        WHEN OTHERS THEN
            v_error := SQLERRM;
    END;

    IF v_error IS NOT NULL THEN
        ROLLBACK;
        CALL pkg_utilidades.sp_registrar_error(
            'pkg_recetas.sp_guardar_receta', v_error,
            'producto=' || COALESCE(p_id_producto::TEXT, 'null'));
        COMMIT;
        RAISE EXCEPTION '%', v_error;
    END IF;

    COMMIT;
END;
$$;


-- Desactiva una receta (no se borra para conservar el historial)
CREATE OR REPLACE PROCEDURE pkg_recetas.sp_desactivar_receta(
    IN p_id_receta INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE panaderia.recetas
    SET estado = FALSE
    WHERE id_receta = p_id_receta;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'La receta % no existe', p_id_receta;
    END IF;

    COMMIT;
END;
$$;


/* Calcula cuánto de cada ingrediente se necesita para producir
   p_cantidad unidades de un producto, y si alcanza la existencia. */
CREATE OR REPLACE FUNCTION pkg_recetas.fn_requerimiento_insumos(
    p_id_producto INTEGER,
    p_cantidad    INTEGER
)
RETURNS TABLE (
    id_ingrediente     INTEGER,
    nombre_ingrediente VARCHAR,
    unidad_medida      VARCHAR,
    cantidad_necesaria NUMERIC,
    existencia_actual  NUMERIC,
    suficiente         BOOLEAN
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    IF p_cantidad IS NULL OR p_cantidad <= 0 THEN
        RAISE EXCEPTION 'La cantidad a producir debe ser mayor que cero';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM panaderia.recetas r
        WHERE r.id_producto = p_id_producto AND r.estado = TRUE
    ) THEN
        RAISE EXCEPTION 'El producto no tiene una receta activa';
    END IF;

    RETURN QUERY
    SELECT i.id_ingrediente,
           i.nombre,
           i.unidad_medida,
           ROUND(dr.cantidad * p_cantidad / r.rendimiento, 2),
           i.existencia_actual,
           i.existencia_actual >= ROUND(dr.cantidad * p_cantidad / r.rendimiento, 2)
    FROM panaderia.recetas r
    INNER JOIN panaderia.detalle_receta dr ON dr.id_receta = r.id_receta
    INNER JOIN panaderia.ingredientes i    ON i.id_ingrediente = dr.id_ingrediente
    WHERE r.id_producto = p_id_producto
      AND r.estado = TRUE
    ORDER BY i.nombre;
END;
$$;



-- =====================================================================
-- DATOS: recetas de los demas panes (cantidades para 100 panes)
-- =====================================================================

-- Encabezados de receta (rendimiento = panes que salen con esas cantidades)
INSERT INTO panaderia.recetas (id_producto, nombre, rendimiento, estado)
SELECT p.id_producto, 'Receta ' || p.nombre, 100, TRUE
FROM panaderia.productos p
WHERE p.nombre IN ('Cubos', 'Francés', 'Alemán', 'Cachos', 'Cortadas',
                   'Batidas', 'Campechanas', 'Shecas')
  AND NOT EXISTS (
      SELECT 1 FROM panaderia.recetas r WHERE r.id_producto = p.id_producto);

-- Ingredientes de cada receta (solo para recetas que aún no tienen detalle)
INSERT INTO panaderia.detalle_receta (id_receta, id_ingrediente, cantidad)
SELECT r.id_receta, i.id_ingrediente, d.cantidad
FROM (VALUES
    ('Cubos',       'Harina suave',      4.000),
    ('Cubos',       'Azúcar',            1.200),
    ('Cubos',       'Huevo',            12.000),
    ('Cubos',       'Leche',             1.000),
    ('Cubos',       'Levadura seca',     0.080),
    ('Cubos',       'Sal',               0.050),
    ('Francés',     'Harina de fuerza',  5.000),
    ('Francés',     'Levadura fresca',   0.150),
    ('Francés',     'Sal',               0.100),
    ('Francés',     'Vinagre',           0.050),
    ('Alemán',      'Harina de fuerza',  4.500),
    ('Alemán',      'Azúcar',            0.600),
    ('Alemán',      'Leche',             0.800),
    ('Alemán',      'Levadura fresca',   0.180),
    ('Alemán',      'Sal',               0.080),
    ('Alemán',      'Huevo',             6.000),
    ('Cachos',      'Harina suave',      3.500),
    ('Cachos',      'Azúcar',            0.800),
    ('Cachos',      'Leche',             0.600),
    ('Cachos',      'Levadura seca',     0.060),
    ('Cachos',      'Huevo',            10.000),
    ('Cachos',      'Sal',               0.040),
    ('Cortadas',    'Harina suave',      3.000),
    ('Cortadas',    'Azúcar',            1.500),
    ('Cortadas',    'Huevo',            20.000),
    ('Cortadas',    'Leche',             0.500),
    ('Cortadas',    'Jugo de fruta',     0.300),
    ('Batidas',     'Harina suave',      2.500),
    ('Batidas',     'Azúcar',            1.200),
    ('Batidas',     'Huevo',            25.000),
    ('Batidas',     'Leche',             0.800),
    ('Campechanas', 'Harina de fuerza',  3.000),
    ('Campechanas', 'Azúcar',            0.900),
    ('Campechanas', 'Levadura fresca',   0.100),
    ('Campechanas', 'Sal',               0.050),
    ('Campechanas', 'Huevo',             4.000),
    ('Shecas',      'Harina de fuerza',  4.000),
    ('Shecas',      'Azúcar',            1.000),
    ('Shecas',      'Levadura fresca',   0.150),
    ('Shecas',      'Leche',             0.500),
    ('Shecas',      'Huevo',             8.000),
    ('Shecas',      'Sal',               0.050)
) AS d(producto, ingrediente, cantidad)
INNER JOIN panaderia.productos p    ON p.nombre = d.producto
INNER JOIN panaderia.recetas r      ON r.id_producto = p.id_producto
INNER JOIN panaderia.ingredientes i ON i.nombre = d.ingrediente
WHERE NOT EXISTS (
    SELECT 1 FROM panaderia.detalle_receta x
    WHERE x.id_receta = r.id_receta);

UPDATE panaderia.recetas
SET nombre = 'Receta Especial'
WHERE nombre = 'Receta Especial - Prueba';

-- Comprobacion 1: deben salir los 9 panes con su numero de ingredientes
SELECT p.nombre AS pan, r.rendimiento, COUNT(dr.id_detalle_receta) AS ingredientes
FROM panaderia.recetas r
INNER JOIN panaderia.productos p ON p.id_producto = r.id_producto
LEFT JOIN panaderia.detalle_receta dr ON dr.id_receta = r.id_receta
GROUP BY p.nombre, r.rendimiento
ORDER BY p.nombre;

-- Comprobacion 2: insumos para producir 800 panes Especial
SELECT * FROM pkg_recetas.fn_requerimiento_insumos(2, 800);
