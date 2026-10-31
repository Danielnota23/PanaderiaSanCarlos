let listaProduccion = [];
let listaIngredientes = [];

document.addEventListener("DOMContentLoaded", function () {

    // ==========================================
    // VALIDAR SESIÓN
    // ==========================================

    const usuarioGuardado =
        localStorage.getItem("usuario");

    if (!usuarioGuardado) {

        window.location.href =
            "Login.html";

        return;
    }

    const usuario =
        JSON.parse(usuarioGuardado);


    // SOLO PRODUCCION
    if (usuario.rol !== "PRODUCCION") {

        window.location.href =
            "Login.html";

        return;
    }


    document.getElementById(
        "nombreUsuario"
    ).textContent =
        usuario.nombre;


    document.getElementById(
        "rolUsuario"
    ).textContent =
        usuario.rol;


    // ==========================================
    // CARGAR INFORMACIÓN
    // ==========================================

    cargarProduccion();

    cargarIngredientes();


    // ==========================================
    // GUARDAR PRODUCCIÓN
    // ==========================================

    document
        .getElementById("btnGuardarProduccion")
        .addEventListener(
            "click",
            guardarProduccion
        );


    // ==========================================
    // CANCELAR
    // ==========================================

    document
        .getElementById("btnCancelarProduccion")
        .addEventListener("click", function () {

            document
                .getElementById(
                    "formularioProduccion"
                )
                .classList.add("oculto");
        });


    // ==========================================
    // CERRAR SESIÓN
    // ==========================================

    document
        .getElementById("cerrarSesion")
        .addEventListener("click", function () {

            localStorage.removeItem(
                "usuario"
            );

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
            await fetch(
                "api/produccion"
            );


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


        actualizarTarjetas();


    } catch (error) {

        console.error(error);

        alert(
            "Error al cargar producción"
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
                    No hay registros de producción
                </td>

            </tr>
        `;

        return;
    }


    registros.forEach(
        registro => {

            const fila =
                document.createElement(
                    "tr"
                );


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
                    ${formatearEstado(
                        registro.estado
                    )}
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


            tabla.appendChild(
                fila
            );
        }
    );
}


// ==============================================
// TARJETAS
// ==============================================

function actualizarTarjetas() {

    const pendientes =
        listaProduccion.filter(
            registro =>
                registro.estado ===
                "PENDIENTE"
        ).length;


    const proceso =
        listaProduccion.filter(
            registro =>
                registro.estado ===
                "EN_PROCESO"
        ).length;


    const finalizadas =
        listaProduccion.filter(
            registro =>
                registro.estado ===
                "FINALIZADA"
        ).length;


    document.getElementById(
        "totalPendientes"
    ).textContent =
        pendientes;


    document.getElementById(
        "totalProceso"
    ).textContent =
        proceso;


    document.getElementById(
        "totalFinalizadas"
    ).textContent =
        finalizadas;
}


// ==============================================
// ABRIR FORMULARIO
// ==============================================

function abrirFormulario(idProduccion) {

    const registro =
        listaProduccion.find(
            r =>
                r.idProduccion ===
                idProduccion
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
        .classList.remove(
            "oculto"
        );


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
                .getElementById(
                    "idProduccion"
                )
                .value
        );


    const cantidadRequerida =
        parseInt(
            document
                .getElementById(
                    "cantidadRequerida"
                )
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


    const estado =
        document
            .getElementById(
                "estadoProduccion"
            )
            .value;


    // VALIDAR CANTIDAD
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


    if (
        cantidadProducida >
        cantidadRequerida
    ) {

        mostrarMensaje(
            "Solo faltan " + (cantidadRequerida - actual) + " unidades para completar lo requerido",
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

                            idProduccion:
                                idProduccion,

                            cantidadProducida:
                                cantidadProducida,

                            estado:
                                estado
                        })
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
                "No se pudo actualizar la producción"
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
                .classList.add(
                    "oculto"
                );

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
// CARGAR INVENTARIO
// ==============================================

async function cargarIngredientes() {

    try {

        const respuesta =
            await fetch(
                "api/ingredientes"
            );


        if (!respuesta.ok) {

            throw new Error(
                "No se pudo cargar el inventario"
            );
        }


        listaIngredientes =
            await respuesta.json();


        mostrarIngredientes(
            listaIngredientes
        );


    } catch (error) {

        console.error(error);

        alert(
            "Error al cargar inventario"
        );
    }
}


// ==============================================
// MOSTRAR INVENTARIO
// ==============================================

function mostrarIngredientes(ingredientes) {

    const tabla =
        document.getElementById(
            "tablaIngredientes"
        );


    tabla.innerHTML = "";


    if (ingredientes.length === 0) {

        tabla.innerHTML = `

            <tr>

                <td colspan="5">
                    No hay ingredientes registrados
                </td>

            </tr>
        `;

        return;
    }


    ingredientes.forEach(
        ingrediente => {

            const fila =
                document.createElement(
                    "tr"
                );


            const claseStock =
                ingrediente.nivelStock ===
                "BAJO_STOCK"
                    ? "stock-bajo"
                    : "stock-normal";


            const textoStock =
                ingrediente.nivelStock ===
                "BAJO_STOCK"
                    ? "Stock bajo"
                    : "Normal";


            fila.innerHTML = `

                <td>
                    ${ingrediente.nombre}
                </td>

                <td>
                    ${ingrediente.unidadMedida}
                </td>

                <td>
                    ${ingrediente.existenciaActual}
                </td>

                <td>
                    ${ingrediente.existenciaMinima}
                </td>

                <td class="${claseStock}">
                    ${textoStock}
                </td>
            `;


            tabla.appendChild(
                fila
            );
        }
    );
}


// ==============================================
// ESTADOS
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