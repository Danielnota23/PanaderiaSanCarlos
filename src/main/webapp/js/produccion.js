let listaProduccion = [];

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

    const usuario =
        JSON.parse(usuarioGuardado);

    if (usuario.rol !== "ADMIN") {
        window.location.href = "Login.html";
        return;
    }

    document.getElementById(
        "nombreUsuario"
    ).textContent = usuario.nombre;

    document.getElementById(
        "rolUsuario"
    ).textContent = usuario.rol;


    // ==========================================
    // CARGAR PRODUCCIÓN
    // ==========================================

    cargarProduccion();


    // ==========================================
    // BUSCADOR
    // ==========================================

    document
        .getElementById("buscarProduccion")
        .addEventListener("input", aplicarFiltros);


    // ==========================================
    // FILTRO POR ESTADO
    // ==========================================

    document
        .getElementById("filtroEstadoProduccion")
        .addEventListener("change", aplicarFiltros);


    // ==========================================
    // GUARDAR CAMBIOS
    // ==========================================

    document
        .getElementById("btnGuardarProduccion")
        .addEventListener("click", guardarProduccion);


    // ==========================================
    // CANCELAR
    // ==========================================

    document
        .getElementById("btnCancelarProduccion")
        .addEventListener("click", function () {

            document
                .getElementById("formularioProduccion")
                .classList.add("oculto");
        });


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
// CARGAR PRODUCCIÓN
// ==============================================

async function cargarProduccion() {

    try {

        const respuesta =
            await fetch("api/produccion");

        if (!respuesta.ok) {

            throw new Error(
                "No se pudo cargar la producción"
            );
        }

        listaProduccion =
            await respuesta.json();

        mostrarProduccion(
            listaProduccion
        );

    } catch (error) {

        console.error(error);

        alert(
            "Error al cargar los registros de producción"
        );
    }
}


// ==============================================
// MOSTRAR PRODUCCIÓN
// ==============================================

function mostrarProduccion(registros) {

    const tabla =
        document.getElementById(
            "tablaProduccion"
        );

    tabla.innerHTML = "";

    if (registros.length === 0) {

        tabla.innerHTML = `
            <tr>
                <td colspan="7">
                    No se encontraron registros
                </td>
            </tr>
        `;

        return;
    }

    registros.forEach(registro => {

        const fila =
            document.createElement("tr");

        const claseEstado =
            obtenerClaseEstado(
                registro.estado
            );

        fila.innerHTML = `

            <td>
                ${registro.idProduccion}
            </td>

            <td>
                ${registro.nombreProducto}
            </td>

            <td>
                ${registro.fecha}
            </td>

            <td>
                ${registro.cantidadRequerida}
            </td>

            <td>
                ${registro.cantidadProducida}
            </td>

            <td class="${claseEstado}">
                ${formatearEstado(registro.estado)}
            </td>

            <td>

                <button
                    class="btn-actualizar"
                    onclick="abrirFormulario(
                        ${registro.idProduccion}
                    )"
                >
                    Actualizar
                </button>

            </td>
        `;

        tabla.appendChild(fila);
    });
}


// ==============================================
// FILTRAR
// ==============================================

function aplicarFiltros() {

    const texto =
        document
            .getElementById("buscarProduccion")
            .value
            .toLowerCase()
            .trim();

    const estado =
        document
            .getElementById("filtroEstadoProduccion")
            .value;


    const filtrados =
        listaProduccion.filter(registro => {

            const producto =
                (registro.nombreProducto || "")
                    .toLowerCase();

            const estadoRegistro =
                (registro.estado || "")
                    .toLowerCase();


            const coincideTexto =
                producto.includes(texto)
                ||
                estadoRegistro.includes(texto);


            const coincideEstado =
                estado === ""
                ||
                registro.estado === estado;


            return (
                coincideTexto
                &&
                coincideEstado
            );
        });


    mostrarProduccion(
        filtrados
    );
}


// ==============================================
// ABRIR FORMULARIO
// ==============================================

function abrirFormulario(idProduccion) {

    const registro =
        listaProduccion.find(
            r => r.idProduccion === idProduccion
        );

    if (!registro) {
        return;
    }


    document.getElementById(
        "idProduccion"
    ).value =
        registro.idProduccion;


    document.getElementById(
        "productoProduccion"
    ).value =
        registro.nombreProducto;


    document.getElementById(
        "cantidadRequerida"
    ).value =
        registro.cantidadRequerida;


    const campoNuevas = document.getElementById("cantidadProducida");
    const faltan = registro.cantidadRequerida - registro.cantidadProducida;

    // El usuario escribe solo las unidades nuevas; el total se calcula al guardar
    campoNuevas.value = "";
    campoNuevas.dataset.actual = registro.cantidadProducida;
    campoNuevas.max = faltan;

    document.getElementById("ayudaProduccion").textContent =
        "Ya se registraron " + registro.cantidadProducida + " de "
        + registro.cantidadRequerida + ". Escriba solo las unidades nuevas "
        + "(faltan " + faltan + "); el sistema las suma y descuenta sus "
        + "ingredientes según la receta.";


    document.getElementById(
        "estadoProduccion"
    ).value =
        registro.estado;


    document.getElementById(
        "mensajeProduccion"
    ).textContent = "";


    document
        .getElementById(
            "formularioProduccion"
        )
        .classList.remove("oculto");


    document
        .getElementById(
            "formularioProduccion"
        )
        .scrollIntoView({
            behavior: "smooth"
        });
}


// ==============================================
// GUARDAR PRODUCCIÓN
// ==============================================

async function guardarProduccion() {

    const idProduccion =
        parseInt(
            document
                .getElementById("idProduccion")
                .value
        );

    const campoNuevas = document.getElementById("cantidadProducida");
    const nuevas = parseInt(campoNuevas.value);
    const actual = parseInt(campoNuevas.dataset.actual) || 0;

    if (isNaN(nuevas) || nuevas < 0) {
        mostrarMensaje("Escriba cuántas unidades nuevas se produjeron (0 o más)", false);
        return;
    }

    // Total producido = lo que ya había + las unidades nuevas
    const cantidadProducida = actual + nuevas;

    const cantidadRequerida = parseInt(
        document.getElementById("cantidadRequerida").value
    );

    if (cantidadProducida > cantidadRequerida) {
        mostrarMensaje(
            "Solo faltan " + (cantidadRequerida - actual) + " unidades para completar lo requerido",
            false
        );
        return;
    }

    const estado =
        document
            .getElementById("estadoProduccion")
            .value;


    if (
        isNaN(cantidadProducida)
        ||
        cantidadProducida < 0
    ) {

        mostrarMensaje(
            "Ingrese una cantidad válida",
            false
        );

        return;
    }


    try {

        const respuesta =
            await fetch(
                "api/produccion",
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            idProduccion: idProduccion,
                            cantidadProducida: cantidadProducida,
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
                "No se pudo actualizar"
            );
        }


        mostrarMensaje(
            "Producción actualizada correctamente",
            true
        );


        await cargarProduccion();


        setTimeout(function () {

            document
                .getElementById(
                    "formularioProduccion"
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


// ==============================================
// CLASE DE ESTADO
// ==============================================

function obtenerClaseEstado(estado) {

    switch (estado) {

        case "PENDIENTE":
            return "estado-pendiente";

        case "EN_PROCESO":
            return "estado-proceso";

        case "FINALIZADA":
            return "estado-finalizada";

        default:
            return "";
    }
}


// ==============================================
// FORMATEAR ESTADO
// ==============================================

function formatearEstado(estado) {

    switch (estado) {

        case "PENDIENTE":
            return "Pendiente";

        case "EN_PROCESO":
            return "En proceso";

        case "FINALIZADA":
            return "Finalizada";

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
            "mensajeProduccion"
        );

    elemento.textContent =
        mensaje;

    elemento.className =
        correcto
            ? "mensaje-exito"
            : "mensaje-error";
}

