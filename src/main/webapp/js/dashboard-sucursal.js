let listaPedidosSucursal = [];
let listaProductos = [];
let usuarioActual = null;

document.addEventListener("DOMContentLoaded", function () {

    // ==========================================
    // VALIDAR SESIÓN
    // ==========================================

    const usuarioGuardado =
        localStorage.getItem("usuario");

    if (!usuarioGuardado) {
        window.location.href = "Login.html";
        return;
    }

    usuarioActual =
        JSON.parse(usuarioGuardado);


    // SOLO USUARIO SUCURSAL
    if (usuarioActual.rol !== "SUCURSAL") {
        window.location.href = "Login.html";
        return;
    }


    // MOSTRAR USUARIO
    document.getElementById(
        "nombreUsuario"
    ).textContent =
        usuarioActual.nombre;


    document.getElementById(
        "rolUsuario"
    ).textContent =
        usuarioActual.rol;


    document.getElementById(
        "nombreSucursalEncabezado"
    ).textContent =
        "Gestión de pedidos - "
        + usuarioActual.nombre;


    // ==========================================
    // CARGAR INFORMACIÓN
    // ==========================================

    cargarPedidosSucursal();

    cargarProductos();


    // ==========================================
    // FECHA ACTUAL
    // ==========================================

    establecerFechaActual();


    // ==========================================
    // GUARDAR PEDIDO
    // ==========================================

    document
        .getElementById("btnGuardarPedido")
        .addEventListener(
            "click",
            guardarPedido
        );


    // ==========================================
    // CERRAR SESIÓN
    // ==========================================

    document
        .getElementById("cerrarSesion")
        .addEventListener("click", function () {

            localStorage.removeItem("usuario");

            window.location.href =
                "Login.html";
        });
});


// ==============================================
// FECHA ACTUAL
// ==============================================

function establecerFechaActual() {

    const hoy =
        new Date();

    const anio =
        hoy.getFullYear();

    const mes =
        String(
            hoy.getMonth() + 1
        ).padStart(2, "0");

    const dia =
        String(
            hoy.getDate()
        ).padStart(2, "0");


    document.getElementById(
        "fechaPedido"
    ).value =
        `${anio}-${mes}-${dia}`;
}


// ==============================================
// CARGAR PEDIDOS
// ==============================================

async function cargarPedidosSucursal() {

    try {

        const respuesta =
            await fetch("api/pedidos");


        if (!respuesta.ok) {

            throw new Error(
                "No se pudieron cargar los pedidos"
            );
        }


        const todosPedidos =
            await respuesta.json();


        // SOLO PEDIDOS DE LA SUCURSAL DEL USUARIO
        listaPedidosSucursal =
            todosPedidos.filter(
                pedido =>
                    pedido.idSucursal ===
                    usuarioActual.idSucursal
            );


        mostrarPedidos(
            listaPedidosSucursal
        );


        actualizarTarjetas();


    } catch (error) {

        console.error(error);

        alert(
            "Error al cargar los pedidos"
        );
    }
}


// ==============================================
// MOSTRAR PEDIDOS
// ==============================================

function mostrarPedidos(pedidos) {

    const tabla =
        document.getElementById(
            "tablaPedidosSucursal"
        );


    tabla.innerHTML = "";


    if (pedidos.length === 0) {

        tabla.innerHTML = `

            <tr>

                <td colspan="6">
                    No hay pedidos registrados
                    para esta sucursal
                </td>

            </tr>
        `;

        return;
    }


    pedidos.forEach(
        pedido => {

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
                    ${pedido.fechaPedido}
                </td>

                <td>
                    ${pedido.turno}
                </td>

                <td class="${claseEstado}">
                    ${formatearEstado(
                        pedido.estado
                    )}
                </td>

                <td>
                    ${pedido.observacion || "-"}
                </td>

                <td>

                    <button
                        class="btn-detalle"
                        onclick="verDetalle(
                            ${pedido.idPedido}
                        )"
                    >
                        Ver detalle
                    </button>

                </td>
            `;


            tabla.appendChild(
                fila
            );
        }
    );
}


// ==============================================
// ACTUALIZAR TARJETAS
// ==============================================

function actualizarTarjetas() {

    const total =
        listaPedidosSucursal.length;


    const pendientes =
        listaPedidosSucursal.filter(
            pedido =>
                pedido.estado === "PENDIENTE"
        ).length;


    const produccion =
        listaPedidosSucursal.filter(
            pedido =>
                pedido.estado === "EN_PRODUCCION"
        ).length;


    const despachados =
        listaPedidosSucursal.filter(
            pedido =>
                pedido.estado === "DESPACHADO"
        ).length;


    document.getElementById(
        "totalPedidosSucursal"
    ).textContent =
        total;


    document.getElementById(
        "pedidosPendientes"
    ).textContent =
        pendientes;


    document.getElementById(
        "pedidosProduccion"
    ).textContent =
        produccion;


    document.getElementById(
        "pedidosDespachados"
    ).textContent =
        despachados;
}


// ==============================================
// VER DETALLE
// ==============================================

function verDetalle(idPedido) {

    const pedido =
        listaPedidosSucursal.find(
            p => p.idPedido === idPedido
        );


    if (!pedido) {
        return;
    }


    let detalleTexto =
        "PEDIDO #" + pedido.idPedido
        + "\n\n";


    detalleTexto +=
        "Fecha: "
        + pedido.fechaPedido
        + "\n";


    detalleTexto +=
        "Turno: "
        + pedido.turno
        + "\n";


    detalleTexto +=
        "Estado: "
        + formatearEstado(
            pedido.estado
        )
        + "\n\n";


    detalleTexto +=
        "PRODUCTOS:\n";


    if (
        pedido.detalles
        &&
        pedido.detalles.length > 0
    ) {

        pedido.detalles.forEach(
            detalle => {

                detalleTexto +=
                    "- "
                    + detalle.nombreProducto
                    + ": "
                    + detalle.cantidad
                    + "\n";
            }
        );

    } else {

        detalleTexto +=
            "Sin productos registrados";
    }


    alert(
        detalleTexto
    );
}


// ==============================================
// CARGAR PRODUCTOS
// ==============================================

async function cargarProductos() {

    try {

        const respuesta =
            await fetch("api/productos");


        if (!respuesta.ok) {

            throw new Error(
                "No se pudieron cargar los productos"
            );
        }


        listaProductos =
            await respuesta.json();


        mostrarProductosPedido();


    } catch (error) {

        console.error(error);

        alert(
            "Error al cargar productos"
        );
    }
}


// ==============================================
// MOSTRAR PRODUCTOS PARA EL PEDIDO
// ==============================================

function mostrarProductosPedido() {

    const contenedor =
        document.getElementById(
            "listaProductosPedido"
        );


    contenedor.innerHTML = "";


    listaProductos.forEach(
        producto => {

            const elemento =
                document.createElement("div");


            elemento.className =
                "producto-pedido";


            elemento.innerHTML = `

                <div>

                    <strong>
                        ${producto.nombre}
                    </strong>

                </div>


                <input
                    type="number"
                    class="cantidad-producto"
                    data-id-producto="${producto.idProducto}"
                    min="0"
                    value="0"
                    placeholder="Cantidad"
                >
            `;


            contenedor.appendChild(
                elemento
            );
        }
    );
}


// ==============================================
// GUARDAR PEDIDO
// ==============================================

async function guardarPedido() {

    const fechaPedido =
        document
            .getElementById("fechaPedido")
            .value;


    const turno =
        document
            .getElementById("turnoPedido")
            .value;


    const observacion =
        document
            .getElementById("observacionPedido")
            .value
            .trim();


    // ==========================================
    // OBTENER PRODUCTOS CON CANTIDAD MAYOR A 0
    // ==========================================

    const cantidades =
        document.querySelectorAll(
            ".cantidad-producto"
        );


    const detalles = [];


    cantidades.forEach(
        input => {

            const cantidad =
                parseInt(
                    input.value
                );


            if (
                !isNaN(cantidad)
                &&
                cantidad > 0
            ) {

                detalles.push({

                    idProducto:
                        parseInt(
                            input.dataset.idProducto
                        ),

                    cantidad:
                        cantidad
                });
            }
        }
    );


    // ==========================================
    // VALIDACIONES
    // ==========================================

    if (!fechaPedido) {

        mostrarMensaje(
            "Seleccione la fecha del pedido",
            false
        );

        return;
    }


    if (detalles.length === 0) {

        mostrarMensaje(
            "Debe ingresar al menos un producto",
            false
        );

        return;
    }


    const pedido = {

        idSucursal:
            usuarioActual.idSucursal,

        fechaPedido:
            fechaPedido,

        turno:
            turno,

        estado:
            "PENDIENTE",

        observacion:
            observacion,

        detalles:
            detalles
    };


    try {

        const respuesta =
            await fetch(
                "api/pedidos",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            pedido
                        )
                }
            );


        let datos = {};


        try {

            datos =
                await respuesta.json();

        } catch (error) {

            datos = {};
        }


        if (!respuesta.ok) {

            throw new Error(
                datos.mensaje
                ||
                "No se pudo registrar el pedido"
            );
        }


        mostrarMensaje(
            "Pedido registrado correctamente",
            true
        );


        // LIMPIAR CANTIDADES
        cantidades.forEach(
            input => {

                input.value = 0;
            }
        );


        document.getElementById(
            "observacionPedido"
        ).value = "";


        // ACTUALIZAR PEDIDOS
        await cargarPedidosSucursal();


        // SUBIR A MIS PEDIDOS
        setTimeout(function () {

            document
                .getElementById(
                    "pedidosSucursal"
                )
                .scrollIntoView({
                    behavior: "smooth"
                });

        }, 700);


    } catch (error) {

        console.error(error);


        mostrarMensaje(
            error.message,
            false
        );
    }
}


// ==============================================
// ESTADOS
// ==============================================

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


// ==============================================
// MENSAJES
// ==============================================

function mostrarMensaje(
    mensaje,
    correcto
) {

    const elemento =
        document.getElementById(
            "mensajePedidoSucursal"
        );


    elemento.textContent =
        mensaje;


    elemento.className =
        correcto
            ? "mensaje-exito"
            : "mensaje-error";
}