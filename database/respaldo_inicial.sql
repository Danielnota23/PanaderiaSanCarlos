--
-- PostgreSQL database dump
--

\restrict 6fW5u6RJ9yyToWbeylJVbXepXc3qXI3DTq8ezI9YnNUqyZwPkHzUKAYmWaaaMaA

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-10-28 14:13:21

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 6 (class 2615 OID 18613)
-- Name: panaderia; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA panaderia;


ALTER SCHEMA panaderia OWNER TO postgres;

--
-- TOC entry 240 (class 1255 OID 18817)
-- Name: sp_registrar_entrada_inventario(character varying, numeric, character varying); Type: PROCEDURE; Schema: panaderia; Owner: postgres
--

CREATE PROCEDURE panaderia.sp_registrar_entrada_inventario(IN p_nombre_ingrediente character varying, IN p_cantidad numeric, IN p_descripcion character varying)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_id_ingrediente INTEGER;
BEGIN

    -- Validar cantidad
    IF p_cantidad <= 0 THEN
        RAISE EXCEPTION 'La cantidad debe ser mayor que cero';
    END IF;

    -- Buscar ingrediente
    SELECT id_ingrediente
    INTO v_id_ingrediente
    FROM panaderia.ingredientes
    WHERE nombre = p_nombre_ingrediente
      AND estado = TRUE;

    -- Validar que exista
    IF v_id_ingrediente IS NULL THEN
        RAISE EXCEPTION 'El ingrediente % no existe', p_nombre_ingrediente;
    END IF;

    -- Registrar movimiento
    INSERT INTO panaderia.movimientos_inventario
    (
        id_ingrediente,
        tipo_movimiento,
        cantidad,
        descripcion
    )
    VALUES
    (
        v_id_ingrediente,
        'ENTRADA',
        p_cantidad,
        p_descripcion
    );

    -- Actualizar existencia
    UPDATE panaderia.ingredientes
    SET existencia_actual = existencia_actual + p_cantidad
    WHERE id_ingrediente = v_id_ingrediente;

END;
$$;


ALTER PROCEDURE panaderia.sp_registrar_entrada_inventario(IN p_nombre_ingrediente character varying, IN p_cantidad numeric, IN p_descripcion character varying) OWNER TO postgres;

--
-- TOC entry 252 (class 1255 OID 18818)
-- Name: sp_registrar_salida_inventario(character varying, numeric, character varying); Type: PROCEDURE; Schema: panaderia; Owner: postgres
--

CREATE PROCEDURE panaderia.sp_registrar_salida_inventario(IN p_nombre_ingrediente character varying, IN p_cantidad numeric, IN p_descripcion character varying)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_id_ingrediente INTEGER;
    v_existencia_actual NUMERIC(10,2);
BEGIN

    -- Validar cantidad
    IF p_cantidad <= 0 THEN
        RAISE EXCEPTION 'La cantidad debe ser mayor que cero';
    END IF;

    -- Buscar ingrediente y bloquear el registro mientras se procesa
    SELECT id_ingrediente, existencia_actual
    INTO v_id_ingrediente, v_existencia_actual
    FROM panaderia.ingredientes
    WHERE nombre = p_nombre_ingrediente
      AND estado = TRUE
    FOR UPDATE;

    -- Validar que exista
    IF NOT FOUND THEN
        RAISE EXCEPTION 'El ingrediente % no existe', p_nombre_ingrediente;
    END IF;

    -- Validar existencia suficiente
    IF v_existencia_actual < p_cantidad THEN
        RAISE EXCEPTION
        'Existencia insuficiente. Disponible: %, solicitado: %',
        v_existencia_actual,
        p_cantidad;
    END IF;

    -- Registrar salida
    INSERT INTO panaderia.movimientos_inventario
    (
        id_ingrediente,
        tipo_movimiento,
        cantidad,
        descripcion
    )
    VALUES
    (
        v_id_ingrediente,
        'SALIDA',
        p_cantidad,
        p_descripcion
    );

    -- Descontar existencia
    UPDATE panaderia.ingredientes
    SET existencia_actual = existencia_actual - p_cantidad
    WHERE id_ingrediente = v_id_ingrediente;

END;
$$;


ALTER PROCEDURE panaderia.sp_registrar_salida_inventario(IN p_nombre_ingrediente character varying, IN p_cantidad numeric, IN p_descripcion character varying) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 233 (class 1259 OID 18728)
-- Name: detalle_pedido; Type: TABLE; Schema: panaderia; Owner: postgres
--

CREATE TABLE panaderia.detalle_pedido (
    id_detalle_pedido integer NOT NULL,
    id_pedido integer NOT NULL,
    id_producto integer NOT NULL,
    cantidad integer NOT NULL,
    CONSTRAINT chk_cantidad_pedido CHECK ((cantidad > 0))
);


ALTER TABLE panaderia.detalle_pedido OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 18727)
-- Name: detalle_pedido_id_detalle_pedido_seq; Type: SEQUENCE; Schema: panaderia; Owner: postgres
--

CREATE SEQUENCE panaderia.detalle_pedido_id_detalle_pedido_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE panaderia.detalle_pedido_id_detalle_pedido_seq OWNER TO postgres;

--
-- TOC entry 5155 (class 0 OID 0)
-- Dependencies: 232
-- Name: detalle_pedido_id_detalle_pedido_seq; Type: SEQUENCE OWNED BY; Schema: panaderia; Owner: postgres
--

ALTER SEQUENCE panaderia.detalle_pedido_id_detalle_pedido_seq OWNED BY panaderia.detalle_pedido.id_detalle_pedido;


--
-- TOC entry 229 (class 1259 OID 18683)
-- Name: detalle_receta; Type: TABLE; Schema: panaderia; Owner: postgres
--

CREATE TABLE panaderia.detalle_receta (
    id_detalle_receta integer NOT NULL,
    id_receta integer NOT NULL,
    id_ingrediente integer NOT NULL,
    cantidad numeric(10,3) NOT NULL,
    CONSTRAINT chk_cantidad_receta CHECK ((cantidad > (0)::numeric))
);


ALTER TABLE panaderia.detalle_receta OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 18682)
-- Name: detalle_receta_id_detalle_receta_seq; Type: SEQUENCE; Schema: panaderia; Owner: postgres
--

CREATE SEQUENCE panaderia.detalle_receta_id_detalle_receta_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE panaderia.detalle_receta_id_detalle_receta_seq OWNER TO postgres;

--
-- TOC entry 5156 (class 0 OID 0)
-- Dependencies: 228
-- Name: detalle_receta_id_detalle_receta_seq; Type: SEQUENCE OWNED BY; Schema: panaderia; Owner: postgres
--

ALTER SEQUENCE panaderia.detalle_receta_id_detalle_receta_seq OWNED BY panaderia.detalle_receta.id_detalle_receta;


--
-- TOC entry 225 (class 1259 OID 18642)
-- Name: ingredientes; Type: TABLE; Schema: panaderia; Owner: postgres
--

CREATE TABLE panaderia.ingredientes (
    id_ingrediente integer NOT NULL,
    nombre character varying(100) NOT NULL,
    unidad_medida character varying(20) NOT NULL,
    existencia_actual numeric(10,2) DEFAULT 0 NOT NULL,
    existencia_minima numeric(10,2) DEFAULT 0 NOT NULL,
    estado boolean DEFAULT true NOT NULL,
    CONSTRAINT chk_existencia_actual CHECK ((existencia_actual >= (0)::numeric)),
    CONSTRAINT chk_existencia_minima CHECK ((existencia_minima >= (0)::numeric))
);


ALTER TABLE panaderia.ingredientes OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 18641)
-- Name: ingredientes_id_ingrediente_seq; Type: SEQUENCE; Schema: panaderia; Owner: postgres
--

CREATE SEQUENCE panaderia.ingredientes_id_ingrediente_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE panaderia.ingredientes_id_ingrediente_seq OWNER TO postgres;

--
-- TOC entry 5157 (class 0 OID 0)
-- Dependencies: 224
-- Name: ingredientes_id_ingrediente_seq; Type: SEQUENCE OWNED BY; Schema: panaderia; Owner: postgres
--

ALTER SEQUENCE panaderia.ingredientes_id_ingrediente_seq OWNED BY panaderia.ingredientes.id_ingrediente;


--
-- TOC entry 237 (class 1259 OID 18776)
-- Name: movimientos_inventario; Type: TABLE; Schema: panaderia; Owner: postgres
--

CREATE TABLE panaderia.movimientos_inventario (
    id_movimiento integer NOT NULL,
    id_ingrediente integer NOT NULL,
    tipo_movimiento character varying(10) NOT NULL,
    cantidad numeric(10,2) NOT NULL,
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    descripcion character varying(255),
    CONSTRAINT chk_cantidad_movimiento CHECK ((cantidad > (0)::numeric)),
    CONSTRAINT chk_tipo_movimiento CHECK (((tipo_movimiento)::text = ANY ((ARRAY['ENTRADA'::character varying, 'SALIDA'::character varying])::text[])))
);


ALTER TABLE panaderia.movimientos_inventario OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 18775)
-- Name: movimientos_inventario_id_movimiento_seq; Type: SEQUENCE; Schema: panaderia; Owner: postgres
--

CREATE SEQUENCE panaderia.movimientos_inventario_id_movimiento_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE panaderia.movimientos_inventario_id_movimiento_seq OWNER TO postgres;

--
-- TOC entry 5158 (class 0 OID 0)
-- Dependencies: 236
-- Name: movimientos_inventario_id_movimiento_seq; Type: SEQUENCE OWNED BY; Schema: panaderia; Owner: postgres
--

ALTER SEQUENCE panaderia.movimientos_inventario_id_movimiento_seq OWNED BY panaderia.movimientos_inventario.id_movimiento;


--
-- TOC entry 231 (class 1259 OID 18707)
-- Name: pedidos; Type: TABLE; Schema: panaderia; Owner: postgres
--

CREATE TABLE panaderia.pedidos (
    id_pedido integer NOT NULL,
    id_sucursal integer NOT NULL,
    fecha_pedido date DEFAULT CURRENT_DATE NOT NULL,
    turno character varying(20) NOT NULL,
    estado character varying(20) DEFAULT 'PENDIENTE'::character varying NOT NULL,
    observacion character varying(255),
    CONSTRAINT chk_estado_pedido CHECK (((estado)::text = ANY ((ARRAY['PENDIENTE'::character varying, 'EN_PRODUCCION'::character varying, 'DESPACHADO'::character varying, 'CANCELADO'::character varying])::text[]))),
    CONSTRAINT chk_turno CHECK (((turno)::text = ANY ((ARRAY['MANANA'::character varying, 'TARDE'::character varying])::text[])))
);


ALTER TABLE panaderia.pedidos OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 18706)
-- Name: pedidos_id_pedido_seq; Type: SEQUENCE; Schema: panaderia; Owner: postgres
--

CREATE SEQUENCE panaderia.pedidos_id_pedido_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE panaderia.pedidos_id_pedido_seq OWNER TO postgres;

--
-- TOC entry 5159 (class 0 OID 0)
-- Dependencies: 230
-- Name: pedidos_id_pedido_seq; Type: SEQUENCE OWNED BY; Schema: panaderia; Owner: postgres
--

ALTER SEQUENCE panaderia.pedidos_id_pedido_seq OWNED BY panaderia.pedidos.id_pedido;


--
-- TOC entry 235 (class 1259 OID 18752)
-- Name: produccion; Type: TABLE; Schema: panaderia; Owner: postgres
--

CREATE TABLE panaderia.produccion (
    id_produccion integer NOT NULL,
    id_producto integer NOT NULL,
    fecha date DEFAULT CURRENT_DATE NOT NULL,
    cantidad_requerida integer NOT NULL,
    cantidad_producida integer DEFAULT 0 NOT NULL,
    estado character varying(20) DEFAULT 'PENDIENTE'::character varying NOT NULL,
    CONSTRAINT chk_cantidad_producida CHECK ((cantidad_producida >= 0)),
    CONSTRAINT chk_cantidad_requerida CHECK ((cantidad_requerida > 0)),
    CONSTRAINT chk_estado_produccion CHECK (((estado)::text = ANY ((ARRAY['PENDIENTE'::character varying, 'EN_PROCESO'::character varying, 'FINALIZADA'::character varying])::text[])))
);


ALTER TABLE panaderia.produccion OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 18751)
-- Name: produccion_id_produccion_seq; Type: SEQUENCE; Schema: panaderia; Owner: postgres
--

CREATE SEQUENCE panaderia.produccion_id_produccion_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE panaderia.produccion_id_produccion_seq OWNER TO postgres;

--
-- TOC entry 5160 (class 0 OID 0)
-- Dependencies: 234
-- Name: produccion_id_produccion_seq; Type: SEQUENCE OWNED BY; Schema: panaderia; Owner: postgres
--

ALTER SEQUENCE panaderia.produccion_id_produccion_seq OWNED BY panaderia.produccion.id_produccion;


--
-- TOC entry 223 (class 1259 OID 18628)
-- Name: productos; Type: TABLE; Schema: panaderia; Owner: postgres
--

CREATE TABLE panaderia.productos (
    id_producto integer NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion character varying(255),
    estado boolean DEFAULT true NOT NULL
);


ALTER TABLE panaderia.productos OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 18627)
-- Name: productos_id_producto_seq; Type: SEQUENCE; Schema: panaderia; Owner: postgres
--

CREATE SEQUENCE panaderia.productos_id_producto_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE panaderia.productos_id_producto_seq OWNER TO postgres;

--
-- TOC entry 5161 (class 0 OID 0)
-- Dependencies: 222
-- Name: productos_id_producto_seq; Type: SEQUENCE OWNED BY; Schema: panaderia; Owner: postgres
--

ALTER SEQUENCE panaderia.productos_id_producto_seq OWNED BY panaderia.productos.id_producto;


--
-- TOC entry 227 (class 1259 OID 18662)
-- Name: recetas; Type: TABLE; Schema: panaderia; Owner: postgres
--

CREATE TABLE panaderia.recetas (
    id_receta integer NOT NULL,
    id_producto integer NOT NULL,
    nombre character varying(100) NOT NULL,
    rendimiento integer NOT NULL,
    estado boolean DEFAULT true NOT NULL,
    CONSTRAINT chk_rendimiento CHECK ((rendimiento > 0))
);


ALTER TABLE panaderia.recetas OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 18661)
-- Name: recetas_id_receta_seq; Type: SEQUENCE; Schema: panaderia; Owner: postgres
--

CREATE SEQUENCE panaderia.recetas_id_receta_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE panaderia.recetas_id_receta_seq OWNER TO postgres;

--
-- TOC entry 5162 (class 0 OID 0)
-- Dependencies: 226
-- Name: recetas_id_receta_seq; Type: SEQUENCE OWNED BY; Schema: panaderia; Owner: postgres
--

ALTER SEQUENCE panaderia.recetas_id_receta_seq OWNED BY panaderia.recetas.id_receta;


--
-- TOC entry 221 (class 1259 OID 18615)
-- Name: sucursales; Type: TABLE; Schema: panaderia; Owner: postgres
--

CREATE TABLE panaderia.sucursales (
    id_sucursal integer NOT NULL,
    nombre character varying(50) NOT NULL,
    direccion character varying(150),
    estado boolean DEFAULT true NOT NULL
);


ALTER TABLE panaderia.sucursales OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 18614)
-- Name: sucursales_id_sucursal_seq; Type: SEQUENCE; Schema: panaderia; Owner: postgres
--

CREATE SEQUENCE panaderia.sucursales_id_sucursal_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE panaderia.sucursales_id_sucursal_seq OWNER TO postgres;

--
-- TOC entry 5163 (class 0 OID 0)
-- Dependencies: 220
-- Name: sucursales_id_sucursal_seq; Type: SEQUENCE OWNED BY; Schema: panaderia; Owner: postgres
--

ALTER SEQUENCE panaderia.sucursales_id_sucursal_seq OWNED BY panaderia.sucursales.id_sucursal;


--
-- TOC entry 239 (class 1259 OID 18796)
-- Name: usuarios; Type: TABLE; Schema: panaderia; Owner: postgres
--

CREATE TABLE panaderia.usuarios (
    id_usuario integer NOT NULL,
    nombre character varying(100) NOT NULL,
    correo character varying(100) NOT NULL,
    contrasena character varying(255) NOT NULL,
    rol character varying(20) NOT NULL,
    id_sucursal integer,
    estado boolean DEFAULT true NOT NULL,
    CONSTRAINT chk_usuario_rol CHECK (((rol)::text = ANY ((ARRAY['ADMIN'::character varying, 'PRODUCCION'::character varying, 'SUCURSAL'::character varying])::text[])))
);


ALTER TABLE panaderia.usuarios OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 18795)
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE; Schema: panaderia; Owner: postgres
--

CREATE SEQUENCE panaderia.usuarios_id_usuario_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE panaderia.usuarios_id_usuario_seq OWNER TO postgres;

--
-- TOC entry 5164 (class 0 OID 0)
-- Dependencies: 238
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE OWNED BY; Schema: panaderia; Owner: postgres
--

ALTER SEQUENCE panaderia.usuarios_id_usuario_seq OWNED BY panaderia.usuarios.id_usuario;


--
-- TOC entry 4918 (class 2604 OID 18731)
-- Name: detalle_pedido id_detalle_pedido; Type: DEFAULT; Schema: panaderia; Owner: postgres
--

ALTER TABLE ONLY panaderia.detalle_pedido ALTER COLUMN id_detalle_pedido SET DEFAULT nextval('panaderia.detalle_pedido_id_detalle_pedido_seq'::regclass);


--
-- TOC entry 4914 (class 2604 OID 18686)
-- Name: detalle_receta id_detalle_receta; Type: DEFAULT; Schema: panaderia; Owner: postgres
--

ALTER TABLE ONLY panaderia.detalle_receta ALTER COLUMN id_detalle_receta SET DEFAULT nextval('panaderia.detalle_receta_id_detalle_receta_seq'::regclass);


--
-- TOC entry 4908 (class 2604 OID 18645)
-- Name: ingredientes id_ingrediente; Type: DEFAULT; Schema: panaderia; Owner: postgres
--

ALTER TABLE ONLY panaderia.ingredientes ALTER COLUMN id_ingrediente SET DEFAULT nextval('panaderia.ingredientes_id_ingrediente_seq'::regclass);


--
-- TOC entry 4923 (class 2604 OID 18779)
-- Name: movimientos_inventario id_movimiento; Type: DEFAULT; Schema: panaderia; Owner: postgres
--

ALTER TABLE ONLY panaderia.movimientos_inventario ALTER COLUMN id_movimiento SET DEFAULT nextval('panaderia.movimientos_inventario_id_movimiento_seq'::regclass);


--
-- TOC entry 4915 (class 2604 OID 18710)
-- Name: pedidos id_pedido; Type: DEFAULT; Schema: panaderia; Owner: postgres
--

ALTER TABLE ONLY panaderia.pedidos ALTER COLUMN id_pedido SET DEFAULT nextval('panaderia.pedidos_id_pedido_seq'::regclass);


--
-- TOC entry 4919 (class 2604 OID 18755)
-- Name: produccion id_produccion; Type: DEFAULT; Schema: panaderia; Owner: postgres
--

ALTER TABLE ONLY panaderia.produccion ALTER COLUMN id_produccion SET DEFAULT nextval('panaderia.produccion_id_produccion_seq'::regclass);


--
-- TOC entry 4906 (class 2604 OID 18631)
-- Name: productos id_producto; Type: DEFAULT; Schema: panaderia; Owner: postgres
--

ALTER TABLE ONLY panaderia.productos ALTER COLUMN id_producto SET DEFAULT nextval('panaderia.productos_id_producto_seq'::regclass);


--
-- TOC entry 4912 (class 2604 OID 18665)
-- Name: recetas id_receta; Type: DEFAULT; Schema: panaderia; Owner: postgres
--

ALTER TABLE ONLY panaderia.recetas ALTER COLUMN id_receta SET DEFAULT nextval('panaderia.recetas_id_receta_seq'::regclass);


--
-- TOC entry 4904 (class 2604 OID 18618)
-- Name: sucursales id_sucursal; Type: DEFAULT; Schema: panaderia; Owner: postgres
--

ALTER TABLE ONLY panaderia.sucursales ALTER COLUMN id_sucursal SET DEFAULT nextval('panaderia.sucursales_id_sucursal_seq'::regclass);


--
-- TOC entry 4925 (class 2604 OID 18799)
-- Name: usuarios id_usuario; Type: DEFAULT; Schema: panaderia; Owner: postgres
--

ALTER TABLE ONLY panaderia.usuarios ALTER COLUMN id_usuario SET DEFAULT nextval('panaderia.usuarios_id_usuario_seq'::regclass);


--
-- TOC entry 5143 (class 0 OID 18728)
-- Dependencies: 233
-- Data for Name: detalle_pedido; Type: TABLE DATA; Schema: panaderia; Owner: postgres
--

INSERT INTO panaderia.detalle_pedido VALUES (1, 1, 2, 300);
INSERT INTO panaderia.detalle_pedido VALUES (2, 1, 3, 80);
INSERT INTO panaderia.detalle_pedido VALUES (3, 1, 4, 600);
INSERT INTO panaderia.detalle_pedido VALUES (4, 1, 5, 300);
INSERT INTO panaderia.detalle_pedido VALUES (5, 1, 6, 20);
INSERT INTO panaderia.detalle_pedido VALUES (6, 1, 7, 20);
INSERT INTO panaderia.detalle_pedido VALUES (7, 1, 8, 150);
INSERT INTO panaderia.detalle_pedido VALUES (8, 1, 9, 200);
INSERT INTO panaderia.detalle_pedido VALUES (9, 2, 2, 500);
INSERT INTO panaderia.detalle_pedido VALUES (10, 2, 3, 80);
INSERT INTO panaderia.detalle_pedido VALUES (11, 2, 4, 700);
INSERT INTO panaderia.detalle_pedido VALUES (12, 2, 5, 300);
INSERT INTO panaderia.detalle_pedido VALUES (13, 2, 6, 15);
INSERT INTO panaderia.detalle_pedido VALUES (14, 2, 7, 10);
INSERT INTO panaderia.detalle_pedido VALUES (15, 2, 8, 80);
INSERT INTO panaderia.detalle_pedido VALUES (16, 2, 9, 150);
INSERT INTO panaderia.detalle_pedido VALUES (17, 3, 2, 300);
INSERT INTO panaderia.detalle_pedido VALUES (18, 3, 3, 80);
INSERT INTO panaderia.detalle_pedido VALUES (19, 4, 2, 50);
INSERT INTO panaderia.detalle_pedido VALUES (20, 4, 3, 100);


--
-- TOC entry 5139 (class 0 OID 18683)
-- Dependencies: 229
-- Data for Name: detalle_receta; Type: TABLE DATA; Schema: panaderia; Owner: postgres
--

INSERT INTO panaderia.detalle_receta VALUES (1, 1, 1, 5.000);
INSERT INTO panaderia.detalle_receta VALUES (2, 1, 8, 0.500);
INSERT INTO panaderia.detalle_receta VALUES (3, 1, 6, 0.200);
INSERT INTO panaderia.detalle_receta VALUES (4, 1, 9, 0.100);
INSERT INTO panaderia.detalle_receta VALUES (5, 1, 10, 20.000);


--
-- TOC entry 5135 (class 0 OID 18642)
-- Dependencies: 225
-- Data for Name: ingredientes; Type: TABLE DATA; Schema: panaderia; Owner: postgres
--

INSERT INTO panaderia.ingredientes VALUES (2, 'Harina suave', 'kg', 0.00, 0.00, true);
INSERT INTO panaderia.ingredientes VALUES (3, 'Vinagre', 'litro', 0.00, 0.00, true);
INSERT INTO panaderia.ingredientes VALUES (4, 'Leche', 'litro', 0.00, 0.00, true);
INSERT INTO panaderia.ingredientes VALUES (5, 'Jugo de fruta', 'litro', 0.00, 0.00, true);
INSERT INTO panaderia.ingredientes VALUES (7, 'Levadura seca', 'kg', 0.00, 0.00, true);
INSERT INTO panaderia.ingredientes VALUES (6, 'Levadura fresca', 'kg', 3.40, 1.00, true);
INSERT INTO panaderia.ingredientes VALUES (9, 'Sal', 'kg', 9.20, 2.00, true);
INSERT INTO panaderia.ingredientes VALUES (10, 'Huevo', 'unidad', 340.00, 100.00, true);
INSERT INTO panaderia.ingredientes VALUES (8, 'Azúcar', 'kg', 13.00, 5.00, true);
INSERT INTO panaderia.ingredientes VALUES (1, 'Harina de fuerza', 'kg', 70.00, 20.00, true);


--
-- TOC entry 5147 (class 0 OID 18776)
-- Dependencies: 237
-- Data for Name: movimientos_inventario; Type: TABLE DATA; Schema: panaderia; Owner: postgres
--

INSERT INTO panaderia.movimientos_inventario VALUES (1, 1, 'SALIDA', 40.00, '2026-10-15 13:19:45.587372', 'Consumo para produccion de pan Especial');
INSERT INTO panaderia.movimientos_inventario VALUES (2, 6, 'SALIDA', 1.60, '2026-10-15 13:19:45.587372', 'Consumo para produccion de pan Especial');
INSERT INTO panaderia.movimientos_inventario VALUES (3, 8, 'SALIDA', 4.00, '2026-10-15 13:19:45.587372', 'Consumo para produccion de pan Especial');
INSERT INTO panaderia.movimientos_inventario VALUES (4, 9, 'SALIDA', 0.80, '2026-10-15 13:19:45.587372', 'Consumo para produccion de pan Especial');
INSERT INTO panaderia.movimientos_inventario VALUES (5, 10, 'SALIDA', 160.00, '2026-10-15 13:19:45.587372', 'Consumo para produccion de pan Especial');
INSERT INTO panaderia.movimientos_inventario VALUES (6, 8, 'ENTRADA', 5.00, '2026-10-15 13:26:16.114116', 'Compra de prueba de azúcar');
INSERT INTO panaderia.movimientos_inventario VALUES (7, 8, 'SALIDA', 3.00, '2026-10-15 13:29:08.065641', 'Salida de prueba de azúcar');
INSERT INTO panaderia.movimientos_inventario VALUES (8, 1, 'ENTRADA', 10.00, '2026-10-23 20:33:35.595326', 'Compra de harina de fuerza');
INSERT INTO panaderia.movimientos_inventario VALUES (9, 1, 'SALIDA', 5.00, '2026-10-23 20:50:03.570757', 'Salida de prueba de harina');
INSERT INTO panaderia.movimientos_inventario VALUES (10, 1, 'ENTRADA', 10.00, '2026-10-28 11:01:10.95101', 'compra de harina para inventario');
INSERT INTO panaderia.movimientos_inventario VALUES (11, 1, 'SALIDA', 5.00, '2026-10-28 11:03:18.897885', 'Salida de prueba desde el sistema web');


--
-- TOC entry 5141 (class 0 OID 18707)
-- Dependencies: 231
-- Data for Name: pedidos; Type: TABLE DATA; Schema: panaderia; Owner: postgres
--

INSERT INTO panaderia.pedidos VALUES (1, 1, '2022-09-17', 'MANANA', 'PENDIENTE', 'Pedido de prueba basado en el ejemplo del proyecto');
INSERT INTO panaderia.pedidos VALUES (2, 2, '2022-09-17', 'MANANA', 'PENDIENTE', 'Pedido de prueba sucursal Chiva');
INSERT INTO panaderia.pedidos VALUES (3, 1, '2026-10-23', 'MANANA', 'DESPACHADO', 'Pedido creado desde Postman');
INSERT INTO panaderia.pedidos VALUES (4, 1, '2026-10-28', 'MANANA', 'PENDIENTE', 'Pedido creado desde panel de sucursal');


--
-- TOC entry 5145 (class 0 OID 18752)
-- Dependencies: 235
-- Data for Name: produccion; Type: TABLE DATA; Schema: panaderia; Owner: postgres
--

INSERT INTO panaderia.produccion VALUES (4, 5, '2022-09-17', 600, 0, 'PENDIENTE');
INSERT INTO panaderia.produccion VALUES (5, 4, '2022-09-17', 1300, 0, 'PENDIENTE');
INSERT INTO panaderia.produccion VALUES (7, 6, '2022-09-17', 35, 0, 'PENDIENTE');
INSERT INTO panaderia.produccion VALUES (8, 3, '2022-09-17', 160, 0, 'PENDIENTE');
INSERT INTO panaderia.produccion VALUES (6, 2, '2022-09-17', 800, 800, 'FINALIZADA');
INSERT INTO panaderia.produccion VALUES (1, 8, '2022-09-17', 230, 100, 'EN_PROCESO');
INSERT INTO panaderia.produccion VALUES (2, 9, '2022-09-17', 350, 100, 'EN_PROCESO');
INSERT INTO panaderia.produccion VALUES (3, 7, '2022-09-17', 30, 15, 'EN_PROCESO');


--
-- TOC entry 5133 (class 0 OID 18628)
-- Dependencies: 223
-- Data for Name: productos; Type: TABLE DATA; Schema: panaderia; Owner: postgres
--

INSERT INTO panaderia.productos VALUES (1, 'Cubos', NULL, true);
INSERT INTO panaderia.productos VALUES (2, 'Especial', NULL, true);
INSERT INTO panaderia.productos VALUES (3, 'Francés', NULL, true);
INSERT INTO panaderia.productos VALUES (4, 'Alemán', NULL, true);
INSERT INTO panaderia.productos VALUES (5, 'Cachos', NULL, true);
INSERT INTO panaderia.productos VALUES (6, 'Cortadas', NULL, true);
INSERT INTO panaderia.productos VALUES (7, 'Batidas', NULL, true);
INSERT INTO panaderia.productos VALUES (8, 'Campechanas', NULL, true);
INSERT INTO panaderia.productos VALUES (9, 'Shecas', NULL, true);
INSERT INTO panaderia.productos VALUES (10, 'Pan Especial de Prueba', 'Producto actualizado desde Postman', false);
INSERT INTO panaderia.productos VALUES (11, 'Pan Integral', 'Pan Integral', false);


--
-- TOC entry 5137 (class 0 OID 18662)
-- Dependencies: 227
-- Data for Name: recetas; Type: TABLE DATA; Schema: panaderia; Owner: postgres
--

INSERT INTO panaderia.recetas VALUES (1, 2, 'Receta Especial - Prueba', 100, true);


--
-- TOC entry 5131 (class 0 OID 18615)
-- Dependencies: 221
-- Data for Name: sucursales; Type: TABLE DATA; Schema: panaderia; Owner: postgres
--

INSERT INTO panaderia.sucursales VALUES (1, 'Central', NULL, true);
INSERT INTO panaderia.sucursales VALUES (2, 'Chiva', NULL, true);
INSERT INTO panaderia.sucursales VALUES (3, 'Barco', NULL, true);
INSERT INTO panaderia.sucursales VALUES (4, 'Heydi', NULL, true);
INSERT INTO panaderia.sucursales VALUES (5, 'Terminal', NULL, true);


--
-- TOC entry 5149 (class 0 OID 18796)
-- Dependencies: 239
-- Data for Name: usuarios; Type: TABLE DATA; Schema: panaderia; Owner: postgres
--

INSERT INTO panaderia.usuarios VALUES (2, 'Administrador', 'admin@panaderia.com', 'Admin123', 'ADMIN', NULL, true);
INSERT INTO panaderia.usuarios VALUES (3, 'Sucursal Central', 'central@panaderia.com', 'Central123', 'SUCURSAL', 1, true);
INSERT INTO panaderia.usuarios VALUES (4, 'Usuario Produccion', 'produccion@panaderia.com', 'Produccion123', 'PRODUCCION', NULL, true);


--
-- TOC entry 5165 (class 0 OID 0)
-- Dependencies: 232
-- Name: detalle_pedido_id_detalle_pedido_seq; Type: SEQUENCE SET; Schema: panaderia; Owner: postgres
--

SELECT pg_catalog.setval('panaderia.detalle_pedido_id_detalle_pedido_seq', 20, true);


--
-- TOC entry 5166 (class 0 OID 0)
-- Dependencies: 228
-- Name: detalle_receta_id_detalle_receta_seq; Type: SEQUENCE SET; Schema: panaderia; Owner: postgres
--

SELECT pg_catalog.setval('panaderia.detalle_receta_id_detalle_receta_seq', 5, true);


--
-- TOC entry 5167 (class 0 OID 0)
-- Dependencies: 224
-- Name: ingredientes_id_ingrediente_seq; Type: SEQUENCE SET; Schema: panaderia; Owner: postgres
--

SELECT pg_catalog.setval('panaderia.ingredientes_id_ingrediente_seq', 10, true);


--
-- TOC entry 5168 (class 0 OID 0)
-- Dependencies: 236
-- Name: movimientos_inventario_id_movimiento_seq; Type: SEQUENCE SET; Schema: panaderia; Owner: postgres
--

SELECT pg_catalog.setval('panaderia.movimientos_inventario_id_movimiento_seq', 11, true);


--
-- TOC entry 5169 (class 0 OID 0)
-- Dependencies: 230
-- Name: pedidos_id_pedido_seq; Type: SEQUENCE SET; Schema: panaderia; Owner: postgres
--

SELECT pg_catalog.setval('panaderia.pedidos_id_pedido_seq', 4, true);


--
-- TOC entry 5170 (class 0 OID 0)
-- Dependencies: 234
-- Name: produccion_id_produccion_seq; Type: SEQUENCE SET; Schema: panaderia; Owner: postgres
--

SELECT pg_catalog.setval('panaderia.produccion_id_produccion_seq', 8, true);


--
-- TOC entry 5171 (class 0 OID 0)
-- Dependencies: 222
-- Name: productos_id_producto_seq; Type: SEQUENCE SET; Schema: panaderia; Owner: postgres
--

SELECT pg_catalog.setval('panaderia.productos_id_producto_seq', 11, true);


--
-- TOC entry 5172 (class 0 OID 0)
-- Dependencies: 226
-- Name: recetas_id_receta_seq; Type: SEQUENCE SET; Schema: panaderia; Owner: postgres
--

SELECT pg_catalog.setval('panaderia.recetas_id_receta_seq', 1, true);


--
-- TOC entry 5173 (class 0 OID 0)
-- Dependencies: 220
-- Name: sucursales_id_sucursal_seq; Type: SEQUENCE SET; Schema: panaderia; Owner: postgres
--

SELECT pg_catalog.setval('panaderia.sucursales_id_sucursal_seq', 5, true);


--
-- TOC entry 5174 (class 0 OID 0)
-- Dependencies: 238
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE SET; Schema: panaderia; Owner: postgres
--

SELECT pg_catalog.setval('panaderia.usuarios_id_usuario_seq', 4, true);


--
-- TOC entry 4963 (class 2606 OID 18738)
-- Name: detalle_pedido detalle_pedido_pkey; Type: CONSTRAINT; Schema: panaderia; Owner: postgres
--

ALTER TABLE ONLY panaderia.detalle_pedido
    ADD CONSTRAINT detalle_pedido_pkey PRIMARY KEY (id_detalle_pedido);


--
-- TOC entry 4957 (class 2606 OID 18693)
-- Name: detalle_receta detalle_receta_pkey; Type: CONSTRAINT; Schema: panaderia; Owner: postgres
--

ALTER TABLE ONLY panaderia.detalle_receta
    ADD CONSTRAINT detalle_receta_pkey PRIMARY KEY (id_detalle_receta);


--
-- TOC entry 4949 (class 2606 OID 18660)
-- Name: ingredientes ingredientes_nombre_key; Type: CONSTRAINT; Schema: panaderia; Owner: postgres
--

ALTER TABLE ONLY panaderia.ingredientes
    ADD CONSTRAINT ingredientes_nombre_key UNIQUE (nombre);


--
-- TOC entry 4951 (class 2606 OID 18658)
-- Name: ingredientes ingredientes_pkey; Type: CONSTRAINT; Schema: panaderia; Owner: postgres
--

ALTER TABLE ONLY panaderia.ingredientes
    ADD CONSTRAINT ingredientes_pkey PRIMARY KEY (id_ingrediente);


--
-- TOC entry 4969 (class 2606 OID 18789)
-- Name: movimientos_inventario movimientos_inventario_pkey; Type: CONSTRAINT; Schema: panaderia; Owner: postgres
--

ALTER TABLE ONLY panaderia.movimientos_inventario
    ADD CONSTRAINT movimientos_inventario_pkey PRIMARY KEY (id_movimiento);


--
-- TOC entry 4961 (class 2606 OID 18721)
-- Name: pedidos pedidos_pkey; Type: CONSTRAINT; Schema: panaderia; Owner: postgres
--

ALTER TABLE ONLY panaderia.pedidos
    ADD CONSTRAINT pedidos_pkey PRIMARY KEY (id_pedido);


--
-- TOC entry 4967 (class 2606 OID 18769)
-- Name: produccion produccion_pkey; Type: CONSTRAINT; Schema: panaderia; Owner: postgres
--

ALTER TABLE ONLY panaderia.produccion
    ADD CONSTRAINT produccion_pkey PRIMARY KEY (id_produccion);


--
-- TOC entry 4945 (class 2606 OID 18639)
-- Name: productos productos_nombre_key; Type: CONSTRAINT; Schema: panaderia; Owner: postgres
--

ALTER TABLE ONLY panaderia.productos
    ADD CONSTRAINT productos_nombre_key UNIQUE (nombre);


--
-- TOC entry 4947 (class 2606 OID 18637)
-- Name: productos productos_pkey; Type: CONSTRAINT; Schema: panaderia; Owner: postgres
--

ALTER TABLE ONLY panaderia.productos
    ADD CONSTRAINT productos_pkey PRIMARY KEY (id_producto);


--
-- TOC entry 4953 (class 2606 OID 18676)
-- Name: recetas recetas_id_producto_key; Type: CONSTRAINT; Schema: panaderia; Owner: postgres
--

ALTER TABLE ONLY panaderia.recetas
    ADD CONSTRAINT recetas_id_producto_key UNIQUE (id_producto);


--
-- TOC entry 4955 (class 2606 OID 18674)
-- Name: recetas recetas_pkey; Type: CONSTRAINT; Schema: panaderia; Owner: postgres
--

ALTER TABLE ONLY panaderia.recetas
    ADD CONSTRAINT recetas_pkey PRIMARY KEY (id_receta);


--
-- TOC entry 4941 (class 2606 OID 18626)
-- Name: sucursales sucursales_nombre_key; Type: CONSTRAINT; Schema: panaderia; Owner: postgres
--

ALTER TABLE ONLY panaderia.sucursales
    ADD CONSTRAINT sucursales_nombre_key UNIQUE (nombre);


--
-- TOC entry 4943 (class 2606 OID 18624)
-- Name: sucursales sucursales_pkey; Type: CONSTRAINT; Schema: panaderia; Owner: postgres
--

ALTER TABLE ONLY panaderia.sucursales
    ADD CONSTRAINT sucursales_pkey PRIMARY KEY (id_sucursal);


--
-- TOC entry 4965 (class 2606 OID 18740)
-- Name: detalle_pedido uq_pedido_producto; Type: CONSTRAINT; Schema: panaderia; Owner: postgres
--

ALTER TABLE ONLY panaderia.detalle_pedido
    ADD CONSTRAINT uq_pedido_producto UNIQUE (id_pedido, id_producto);


--
-- TOC entry 4959 (class 2606 OID 18695)
-- Name: detalle_receta uq_receta_ingrediente; Type: CONSTRAINT; Schema: panaderia; Owner: postgres
--

ALTER TABLE ONLY panaderia.detalle_receta
    ADD CONSTRAINT uq_receta_ingrediente UNIQUE (id_receta, id_ingrediente);


--
-- TOC entry 4971 (class 2606 OID 18811)
-- Name: usuarios usuarios_correo_key; Type: CONSTRAINT; Schema: panaderia; Owner: postgres
--

ALTER TABLE ONLY panaderia.usuarios
    ADD CONSTRAINT usuarios_correo_key UNIQUE (correo);


--
-- TOC entry 4973 (class 2606 OID 18809)
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: panaderia; Owner: postgres
--

ALTER TABLE ONLY panaderia.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id_usuario);


--
-- TOC entry 4978 (class 2606 OID 18741)
-- Name: detalle_pedido fk_detalle_pedido_pedido; Type: FK CONSTRAINT; Schema: panaderia; Owner: postgres
--

ALTER TABLE ONLY panaderia.detalle_pedido
    ADD CONSTRAINT fk_detalle_pedido_pedido FOREIGN KEY (id_pedido) REFERENCES panaderia.pedidos(id_pedido);


--
-- TOC entry 4979 (class 2606 OID 18746)
-- Name: detalle_pedido fk_detalle_pedido_producto; Type: FK CONSTRAINT; Schema: panaderia; Owner: postgres
--

ALTER TABLE ONLY panaderia.detalle_pedido
    ADD CONSTRAINT fk_detalle_pedido_producto FOREIGN KEY (id_producto) REFERENCES panaderia.productos(id_producto);


--
-- TOC entry 4975 (class 2606 OID 18701)
-- Name: detalle_receta fk_detalle_receta_ingrediente; Type: FK CONSTRAINT; Schema: panaderia; Owner: postgres
--

ALTER TABLE ONLY panaderia.detalle_receta
    ADD CONSTRAINT fk_detalle_receta_ingrediente FOREIGN KEY (id_ingrediente) REFERENCES panaderia.ingredientes(id_ingrediente);


--
-- TOC entry 4976 (class 2606 OID 18696)
-- Name: detalle_receta fk_detalle_receta_receta; Type: FK CONSTRAINT; Schema: panaderia; Owner: postgres
--

ALTER TABLE ONLY panaderia.detalle_receta
    ADD CONSTRAINT fk_detalle_receta_receta FOREIGN KEY (id_receta) REFERENCES panaderia.recetas(id_receta);


--
-- TOC entry 4981 (class 2606 OID 18790)
-- Name: movimientos_inventario fk_movimiento_ingrediente; Type: FK CONSTRAINT; Schema: panaderia; Owner: postgres
--

ALTER TABLE ONLY panaderia.movimientos_inventario
    ADD CONSTRAINT fk_movimiento_ingrediente FOREIGN KEY (id_ingrediente) REFERENCES panaderia.ingredientes(id_ingrediente);


--
-- TOC entry 4977 (class 2606 OID 18722)
-- Name: pedidos fk_pedido_sucursal; Type: FK CONSTRAINT; Schema: panaderia; Owner: postgres
--

ALTER TABLE ONLY panaderia.pedidos
    ADD CONSTRAINT fk_pedido_sucursal FOREIGN KEY (id_sucursal) REFERENCES panaderia.sucursales(id_sucursal);


--
-- TOC entry 4980 (class 2606 OID 18770)
-- Name: produccion fk_produccion_producto; Type: FK CONSTRAINT; Schema: panaderia; Owner: postgres
--

ALTER TABLE ONLY panaderia.produccion
    ADD CONSTRAINT fk_produccion_producto FOREIGN KEY (id_producto) REFERENCES panaderia.productos(id_producto);


--
-- TOC entry 4974 (class 2606 OID 18677)
-- Name: recetas fk_receta_producto; Type: FK CONSTRAINT; Schema: panaderia; Owner: postgres
--

ALTER TABLE ONLY panaderia.recetas
    ADD CONSTRAINT fk_receta_producto FOREIGN KEY (id_producto) REFERENCES panaderia.productos(id_producto);


--
-- TOC entry 4982 (class 2606 OID 18812)
-- Name: usuarios fk_usuario_sucursal; Type: FK CONSTRAINT; Schema: panaderia; Owner: postgres
--

ALTER TABLE ONLY panaderia.usuarios
    ADD CONSTRAINT fk_usuario_sucursal FOREIGN KEY (id_sucursal) REFERENCES panaderia.sucursales(id_sucursal);


-- Completed on 2026-10-28 14:13:22

--
-- PostgreSQL database dump complete
--

\unrestrict 6fW5u6RJ9yyToWbeylJVbXepXc3qXI3DTq8ezI9YnNUqyZwPkHzUKAYmWaaaMaA

