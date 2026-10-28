// ==============================================
// PLANIFICACIÓN DE PRODUCCIÓN - Panadería San Carlos
// Disponible para los roles ADMIN y PRODUCCION
// ==============================================

const MENUS = {
    ADMIN: [
        ["dashboard-admin.html", "🏠 Dashboard"],
        ["productos.html", "📦 Productos"],
        ["pedidos.html", "📝 Pedidos"],
        ["produccion.html", "🏭 Producción"],
        ["recetas.html", "📋 Recetas"],
        ["planificacion.html", "📑 Planificación"],
        ["inventario.html", "📊 Inventario"],
        ["sucursales.html", "🏢 Sucursales"],
        ["usuarios.html", "👥 Usuarios"]
    ],
    PRODUCCION: [
        ["dashboard-produccion.html", "🏠 Inicio"],
        ["planificacion.html", "📑 Planificación"]
    ]
};

let sucursales = [];

document.addEventListener("DOMContentLoaded", function () {

    // ---------- Validar sesión ----------
    const usuarioGuardado = localStorage.getItem("usuario");

    if (!usuarioGuardado) {
        window.location.href = "Login.html";
        return;
    }

    const usuario = JSON.parse(usuarioGuardado);

    if (!MENUS[usuario.rol]) {
        window.location.href = "Login.html";
        return;
    }

    document.getElementById("nombreUsuario").textContent = usuario.nombre;
    document.getElementById("rolUsuario").textContent = usuario.rol;
    construirMenu(usuario.rol);

    // ---------- Fecha de hoy por defecto ----------
    const inputFecha = document.getElementById("fechaConsulta");
    inputFecha.value = fechaHoy();

    // ---------- Eventos ----------
    document.getElementById("formFiltros")
        .addEventListener("submit", function (evento) {
            evento.preventDefault();
            consultar();
        });

    document.getElementById("btnGenerar")
        .addEventListener("click", generarProduccion);

    document.getElementById("cerrarSesion")
        .addEventListener("click", function () {
            localStorage.removeItem("usuario");
            window.location.href = "Login.html";
        });

    iniciar();
});

async function iniciar() {
    try {
        const respuesta = await fetch("api/sucursales");
        sucursales = await respuesta.json();
    } catch (error) {
        console.error(error);
    }

    consultar();
}

function construirMenu(rol) {

    const actual = location.pathname.split("/").pop();

    document.getElementById("menuLateral").innerHTML = MENUS[rol]
        .map(([enlace, texto]) =>
            `<a href="${enlace}" class="${enlace === actual ? "activo" : ""}">${texto}</a>`)
        .join("");
}


// ==============================================
// CONSULTAR
// ==============================================

async function consultar() {

    const inputFecha = document.getElementById("fechaConsulta");
    const error = document.getElementById("errorFiltros");
    const fecha = inputFecha.value;
    const turno = document.getElementById("turnoConsulta").value;

    error.textContent = "";
    inputFecha.classList.remove("invalido");
    document.getElementById("mensajeGenerar").textContent = "";

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        inputFecha.classList.add("invalido");
        error.textContent = "Seleccione una fecha válida";
        return;
    }

    try {
        const [resConsolidado, resInsumos, resPedidos] = await Promise.all([
            fetch(`api/reportes/consolidado-pedidos?fecha=${fecha}&turno=${turno}`),
            fetch(`api/reportes/requerimiento-insumos?fecha=${fecha}`),
            fetch("api/pedidos")
        ]);

        if (!resConsolidado.ok || !resInsumos.ok || !resPedidos.ok) {
            throw new Error("No se pudo consultar la información");
        }

        const consolidado = await resConsolidado.json();
        const insumos = await resInsumos.json();
        const pedidos = await resPedidos.json();

        const pendientes = pedidos.filter(p =>
            p.fechaPedido === fecha
            && p.estado === "PENDIENTE"
            && (turno === "" || p.turno === turno));

        mostrarConsolidado(consolidado, fecha, turno);
        mostrarInsumos(insumos);

        document.getElementById("totalPendientes").textContent = pendientes.length;

        const boton = document.getElementById("btnGenerar");
        boton.disabled = pendientes.length === 0;
        boton.title = pendientes.length === 0
            ? "No hay pedidos pendientes en esta fecha"
            : "";

    } catch (e) {
        console.error(e);
        error.textContent = e.message;
    }
}


// ==============================================
// TABLA CONSOLIDADA (productos x sucursales)
// ==============================================

function mostrarConsolidado(filas, fecha, turno) {

    const thead = document.getElementById("encabezadoConsolidado");
    const tbody = document.getElementById("cuerpoConsolidado");
    const tfoot = document.getElementById("pieConsolidado");

    const textoTurno = turno === "MANANA" ? " · turno mañana"
        : turno === "TARDE" ? " · turno tarde" : "";

    document.getElementById("descripcionConsolidado").textContent =
        `Pedidos del ${formatearFecha(fecha)}${textoTurno}.`;

    // Columnas: todas las sucursales activas
    const columnas = sucursales.length
        ? sucursales
        : unicos(filas, "idSucursal", "nombreSucursal");

    thead.innerHTML = `
        <tr>
            <th>Clase de pan</th>
            ${columnas.map(s => `<th>${escapar(s.nombre || s.nombreSucursal)}</th>`).join("")}
            <th class="col-total">Total</th>
        </tr>`;

    if (filas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${columnas.length + 2}">No hay pedidos para esta fecha</td></tr>`;
        tfoot.innerHTML = "";
        document.getElementById("totalPanes").textContent = 0;
        document.getElementById("totalSucursales").textContent = 0;
        return;
    }

    // Agrupar por producto
    const productos = unicos(filas, "idProducto", "nombreProducto");
    const totalesColumna = {};
    let granTotal = 0;

    tbody.innerHTML = productos.map(producto => {

        let totalFila = 0;

        const celdas = columnas.map(s => {
            const celda = filas.find(f =>
                f.idProducto === producto.idProducto && f.idSucursal === s.idSucursal);
            const cantidad = celda ? celda.cantidad : 0;

            totalFila += cantidad;
            totalesColumna[s.idSucursal] = (totalesColumna[s.idSucursal] || 0) + cantidad;

            return cantidad
                ? `<td>${cantidad.toLocaleString("es-GT")}</td>`
                : `<td class="vacio">-</td>`;
        }).join("");

        granTotal += totalFila;

        return `
            <tr>
                <td>${escapar(producto.nombreProducto)}</td>
                ${celdas}
                <td class="col-total">${totalFila.toLocaleString("es-GT")}</td>
            </tr>`;
    }).join("");

    tfoot.innerHTML = `
        <tr>
            <td>Total</td>
            ${columnas.map(s => `<td>${(totalesColumna[s.idSucursal] || 0).toLocaleString("es-GT")}</td>`).join("")}
            <td>${granTotal.toLocaleString("es-GT")}</td>
        </tr>`;

    document.getElementById("totalPanes").textContent = granTotal.toLocaleString("es-GT");
    document.getElementById("totalSucursales").textContent =
        Object.values(totalesColumna).filter(v => v > 0).length;
}


// ==============================================
// INSUMOS NECESARIOS
// ==============================================

function mostrarInsumos(insumos) {

    const tabla = document.getElementById("tablaInsumos");
    const faltantes = insumos.filter(i => !i.suficiente).length;

    document.getElementById("totalFaltantes").textContent = faltantes;

    if (insumos.length === 0) {
        tabla.innerHTML = `<tr><td colspan="5">No hay producción pendiente para esta fecha</td></tr>`;
        return;
    }

    tabla.innerHTML = insumos.map(i => `
        <tr>
            <td>${escapar(i.nombreIngrediente)}</td>
            <td class="num">${numero(i.cantidadNecesaria)} ${escapar(i.unidadMedida)}</td>
            <td class="num">${numero(i.existenciaActual)} ${escapar(i.unidadMedida)}</td>
            <td class="num">${i.faltante > 0 ? numero(i.faltante) + " " + escapar(i.unidadMedida) : "-"}</td>
            <td class="${i.suficiente ? "estado-ok" : "estado-falta"}">
                ${i.suficiente ? "✔ Alcanza" : "✖ Comprar"}
            </td>
        </tr>`).join("");
}


// ==============================================
// GENERAR PRODUCCIÓN
// ==============================================

async function generarProduccion() {

    const fecha = document.getElementById("fechaConsulta").value;
    const mensaje = document.getElementById("mensajeGenerar");
    const boton = document.getElementById("btnGenerar");

    const confirmado = confirm(
        `Se sumarán los pedidos PENDIENTES del ${formatearFecha(fecha)} `
        + "de todas las sucursales y se enviarán a producción. ¿Continuar?");

    if (!confirmado) {
        return;
    }

    boton.disabled = true;

    try {
        const respuesta = await fetch("api/produccion", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fecha: fecha })
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(datos.mensaje || "No se pudo generar la producción");
        }

        await consultar();
        mensaje.textContent = datos.mensaje;
        mensaje.className = "mensaje mensaje-exito";

    } catch (e) {
        mensaje.textContent = e.message;
        mensaje.className = "mensaje mensaje-error";
        boton.disabled = false;
    }
}


// ==============================================
// UTILIDADES
// ==============================================

function unicos(filas, campoId, campoNombre) {
    const vistos = new Map();
    filas.forEach(f => {
        if (!vistos.has(f[campoId])) {
            vistos.set(f[campoId], { [campoId]: f[campoId], [campoNombre]: f[campoNombre] });
        }
    });
    return Array.from(vistos.values());
}

function fechaHoy() {
    const hoy = new Date();
    const mes = String(hoy.getMonth() + 1).padStart(2, "0");
    const dia = String(hoy.getDate()).padStart(2, "0");
    return `${hoy.getFullYear()}-${mes}-${dia}`;
}

function formatearFecha(fecha) {
    const [anio, mes, dia] = fecha.split("-");
    return `${dia}/${mes}/${anio}`;
}

function numero(valor) {
    return Number(valor).toLocaleString("es-GT", { maximumFractionDigits: 2 });
}

function escapar(texto) {
    return String(texto ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
