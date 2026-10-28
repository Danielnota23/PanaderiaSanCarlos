let listaPedidos = [];

document.addEventListener("DOMContentLoaded", function () {

    const usuarioGuardado = localStorage.getItem("usuario");

    if (!usuarioGuardado) {
        window.location.href = "Login.html";
        return;
    }

    const usuario = JSON.parse(usuarioGuardado);

    if (usuario.rol !== "ADMIN") {
        window.location.href = "Login.html";
        return;
    }

    document.getElementById("nombreUsuario").textContent =
        usuario.nombre;

    document.getElementById("rolUsuario").textContent =
        usuario.rol;

    cargarPedidos();


    // BUSCADOR
    document
        .getElementById("buscarPedido")
        .addEventListener("input", aplicarFiltros);


    // FILTRO DE ESTADO
    document
        .getElementById("filtroEstado")
        .addEventListener("change", aplicarFiltros);


    // CERRAR DETALLE
    document
        .getElementById("btnCerrarDetalle")
        .addEventListener("click", function () {

            document
                .getElementById("detallePedido")
                .classList.add("oculto");
        });


    // CANCELAR CAMBIO DE ESTADO
    document
        .getElementById("btnCancelarEstado")
        .addEventListener("click", function () {

            document
                .getElementById("formularioEstado")
                .classList.add("oculto");
        });


    // GUARDAR ESTADO
    document
        .getElementById("btnGuardarEstado")
        .addEventListener("click", guardarEstado);


    // CERRAR SESIÓN
    document
        .getElementById("cerrarSesion")
        .addEventListener("click", function () {

            localStorage.removeItem("usuario");

            window.location.href = "Login.html";
        });
});


// ============================================
// CARGAR PEDIDOS
// ============================================

async function cargarPedidos() {

    try {

        const respuesta =
            await fetch("api/pedidos");

        if (!respuesta.ok) {
            throw new Error(
                "No se pudieron cargar los pedidos"
            );
        }

        listaPedidos =
            await respuesta.json();

        mostrarPedidos(listaPedidos);

    } catch (error) {

        console.error(error);

        alert(
            "Error al cargar los pedidos"
        );
    }
}


// ============================================
// MOSTRAR TABLA
// ============================================

function mostrarPedidos(pedidos) {

    const tabla =
        document.getElementById(
            "tablaPedidos"
        );

    tabla.innerHTML = "";

    if (pedidos.length === 0) {

        tabla.innerHTML = `
            <tr>
                <td colspan="7">
                    No se encontraron pedidos
                </td>
            </tr>
        `;

        return;
    }

    pedidos.forEach(pedido => {

        const fila =
            document.createElement("tr");

        const claseEstado =
            obtenerClaseEstado(
                pedido.estado
            );

        fila.innerHTML = `

            <td>
                ${pedido.idPedido}
            </td>

            <td>
                ${pedido.nombreSucursal}
            </td>

            <td>
                ${pedido.fechaPedido}
            </td>

            <td>
                ${pedido.turno}
            </td>

            <td class="${claseEstado}">
                ${formatearEstado(pedido.estado)}
            </td>

            <td>
                ${pedido.observacion || "-"}
            </td>

            <td>

                <button
                    class="btn-detalle"
                    onclick="verDetalle(${pedido.idPedido})"
                >
                    Ver detalle
                </button>

                <button
                    class="btn-estado"
                    onclick="abrirCambioEstado(${pedido.idPedido})"
                >
                    Cambiar estado
                </button>

            </td>
        `;

        tabla.appendChild(fila);
    });
}


// ============================================
// BUSCAR Y FILTRAR
// ============================================

function aplicarFiltros() {

    const texto =
        document
            .getElementById("buscarPedido")
            .value
            .toLowerCase()
            .trim();

    const estado =
        document
            .getElementById("filtroEstado")
            .value;

    const filtrados =
        listaPedidos.filter(pedido => {

            const sucursal =
                (pedido.nombreSucursal || "")
                    .toLowerCase();

            const turno =
                (pedido.turno || "")
                    .toLowerCase();

            const estadoPedido =
                (pedido.estado || "")
                    .toLowerCase();

            const coincideTexto =
                sucursal.includes(texto)
                ||
                turno.includes(texto)
                ||
                estadoPedido.includes(texto);

            const coincideEstado =
                estado === ""
                ||
                pedido.estado === estado;

            return (
                coincideTexto
                &&
                coincideEstado
            );
        });

    mostrarPedidos(filtrados);
}


// ============================================
// VER DETALLE
// ============================================

function verDetalle(idPedido) {

    const pedido =
        listaPedidos.find(
            p => p.idPedido === idPedido
        );

    if (!pedido) {
        return;
    }

    document.getElementById(
        "detalleIdPedido"
    ).textContent =
        pedido.idPedido;

    document.getElementById(
        "detalleSucursal"
    ).textContent =
        pedido.nombreSucursal;

    document.getElementById(
        "detalleFecha"
    ).textContent =
        pedido.fechaPedido;

    document.getElementById(
        "detalleTurno"
    ).textContent =
        pedido.turno;

    document.getElementById(
        "detalleEstado"
    ).textContent =
        formatearEstado(pedido.estado);


    const tablaDetalle =
        document.getElementById(
            "tablaDetallePedido"
        );

    tablaDetalle.innerHTML = "";


    if (
        pedido.detalles
        &&
        pedido.detalles.length > 0
    ) {

        pedido.detalles.forEach(
            detalle => {

                const fila =
                    document.createElement("tr");

                fila.innerHTML = `

                    <td>
                        ${detalle.nombreProducto}
                    </td>

                    <td>
                        ${detalle.cantidad}
                    </td>
                `;

                tablaDetalle.appendChild(
                    fila
                );
            }
        );

    } else {

        tablaDetalle.innerHTML = `

            <tr>
                <td colspan="2">
                    Sin productos registrados
                </td>
            </tr>
        `;
    }


    document
        .getElementById("detallePedido")
        .classList.remove("oculto");


    document
        .getElementById("detallePedido")
        .scrollIntoView({
            behavior: "smooth"
        });
}


// ============================================
// ABRIR CAMBIO DE ESTADO
// ============================================

function abrirCambioEstado(idPedido) {

    const pedido =
        listaPedidos.find(
            p => p.idPedido === idPedido
        );

    if (!pedido) {
        return;
    }


    document.getElementById(
        "idPedidoEstado"
    ).value =
        pedido.idPedido;


    document.getElementById(
        "nuevoEstado"
    ).value =
        pedido.estado;


    document.getElementById(
        "mensajePedido"
    ).textContent = "";


    document
        .getElementById("formularioEstado")
        .classList.remove("oculto");


    document
        .getElementById("formularioEstado")
        .scrollIntoView({
            behavior: "smooth"
        });
}


// ============================================
// GUARDAR ESTADO
// ============================================

async function guardarEstado() {

    const idPedido =
        parseInt(
            document
                .getElementById("idPedidoEstado")
                .value
        );

    const estado =
        document
            .getElementById("nuevoEstado")
            .value;


    try {

        const respuesta =
            await fetch(
                "api/pedidos",
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        idPedido: idPedido,
                        estado: estado
                    })
                }
            );


        const datos =
            await respuesta.json();


        if (!respuesta.ok) {

            throw new Error(
                datos.mensaje
                ||
                "No se pudo actualizar el pedido"
            );
        }


        mostrarMensaje(
            "Estado actualizado correctamente",
            true
        );


        await cargarPedidos();


        setTimeout(function () {

            document
                .getElementById(
                    "formularioEstado"
                )
                .classList.add("oculto");

        }, 700);


    } catch (error) {

        console.error(error);

        mostrarMensaje(
            error.message,
            false
        );
    }
}


// ============================================
// ESTILOS DE ESTADO
// ============================================

function obtenerClaseEstado(estado) {

    switch (estado) {

        case "PENDIENTE":
            return "estado-pendiente";

        case "EN_PRODUCCION":
            return "estado-produccion";

        case "DESPACHADO":
            return "estado-despachado";

        case "CANCELADO":
            return "estado-cancelado";

        default:
            return "";
    }
}


function formatearEstado(estado) {

    switch (estado) {

        case "PENDIENTE":
            return "Pendiente";

        case "EN_PRODUCCION":
            return "En producción";

        case "DESPACHADO":
            return "Despachado";

        case "CANCELADO":
            return "Cancelado";

        default:
            return estado;
    }
}


// ============================================
// MENSAJES
// ============================================

function mostrarMensaje(
    mensaje,
    correcto
) {

    const elemento =
        document.getElementById(
            "mensajePedido"
        );

    elemento.textContent = mensaje;

    elemento.className =
        correcto
            ? "mensaje-exito"
            : "mensaje-error";
}