let listaIngredientes = [];
let listaMovimientos = [];

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
    // CARGAR INFORMACIÓN
    // ==========================================

    cargarIngredientes();
    cargarMovimientos();


    // ==========================================
    // BUSCADOR
    // ==========================================

    document
        .getElementById("buscarIngrediente")
        .addEventListener("input", aplicarFiltros);


    // ==========================================
    // FILTRO DE STOCK
    // ==========================================

    document
        .getElementById("filtroStock")
        .addEventListener("change", aplicarFiltros);


    // ==========================================
    // NUEVA ENTRADA
    // ==========================================

    document
        .getElementById("btnNuevaEntrada")
        .addEventListener("click", function () {

            abrirFormularioMovimiento(
                "ENTRADA"
            );
        });


    // ==========================================
    // NUEVA SALIDA
    // ==========================================

    document
        .getElementById("btnNuevaSalida")
        .addEventListener("click", function () {

            abrirFormularioMovimiento(
                "SALIDA"
            );
        });


    // ==========================================
    // GUARDAR MOVIMIENTO
    // ==========================================

    document
        .getElementById("btnGuardarMovimiento")
        .addEventListener(
            "click",
            guardarMovimiento
        );


    // ==========================================
    // CANCELAR
    // ==========================================

    document
        .getElementById("btnCancelarMovimiento")
        .addEventListener("click", function () {

            limpiarFormulario();

            document
                .getElementById(
                    "formularioMovimiento"
                )
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
// CARGAR INGREDIENTES
// ==============================================

async function cargarIngredientes() {

    try {

        const respuesta =
            await fetch("api/ingredientes");

        if (!respuesta.ok) {

            throw new Error(
                "No se pudieron cargar los ingredientes"
            );
        }

        listaIngredientes =
            await respuesta.json();

        mostrarIngredientes(
            listaIngredientes
        );

        llenarSelectIngredientes();

    } catch (error) {

        console.error(error);

        alert(
            "Error al cargar los ingredientes"
        );
    }
}


// ==============================================
// MOSTRAR INGREDIENTES
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

                <td colspan="6">
                    No se encontraron ingredientes
                </td>

            </tr>
        `;

        return;
    }


    ingredientes.forEach(
        ingrediente => {

            const fila =
                document.createElement("tr");


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
                    ${ingrediente.idIngrediente}
                </td>

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


            tabla.appendChild(fila);
        }
    );
}


// ==============================================
// BUSCAR Y FILTRAR
// ==============================================

function aplicarFiltros() {

    const texto =
        document
            .getElementById("buscarIngrediente")
            .value
            .toLowerCase()
            .trim();


    const nivel =
        document
            .getElementById("filtroStock")
            .value;


    const filtrados =
        listaIngredientes.filter(
            ingrediente => {

                const nombre =
                    (ingrediente.nombre || "")
                        .toLowerCase();


                const coincideTexto =
                    nombre.includes(texto);


                const coincideNivel =
                    nivel === ""
                    ||
                    ingrediente.nivelStock === nivel;


                return (
                    coincideTexto
                    &&
                    coincideNivel
                );
            }
        );


    mostrarIngredientes(
        filtrados
    );
}


// ==============================================
// LLENAR SELECT
// ==============================================

function llenarSelectIngredientes() {

    const select =
        document.getElementById(
            "ingredienteMovimiento"
        );


    select.innerHTML = "";


    listaIngredientes.forEach(
        ingrediente => {

            const opcion =
                document.createElement(
                    "option"
                );


            opcion.value =
                ingrediente.idIngrediente;


            opcion.textContent =
                ingrediente.nombre
                + " - Disponible: "
                + ingrediente.existenciaActual
                + " "
                + ingrediente.unidadMedida;


            select.appendChild(
                opcion
            );
        }
    );
}


// ==============================================
// ABRIR FORMULARIO
// ==============================================

function abrirFormularioMovimiento(tipo) {

    limpiarFormulario();


    document.getElementById(
        "tipoMovimiento"
    ).value = tipo;


    if (tipo === "ENTRADA") {

        document.getElementById(
            "tituloMovimiento"
        ).textContent =
            "Registrar entrada de inventario";

    } else {

        document.getElementById(
            "tituloMovimiento"
        ).textContent =
            "Registrar salida de inventario";
    }


    document
        .getElementById(
            "formularioMovimiento"
        )
        .classList.remove("oculto");


    document
        .getElementById(
            "formularioMovimiento"
        )
        .scrollIntoView({
            behavior: "smooth"
        });
}


// ==============================================
// GUARDAR MOVIMIENTO
// ==============================================

async function guardarMovimiento() {

    const idIngrediente =
        parseInt(
            document
                .getElementById(
                    "ingredienteMovimiento"
                )
                .value
        );


    const cantidad =
        parseFloat(
            document
                .getElementById(
                    "cantidadMovimiento"
                )
                .value
        );


    const descripcion =
        document
            .getElementById(
                "descripcionMovimiento"
            )
            .value
            .trim();


    const tipoMovimiento =
        document
            .getElementById(
                "tipoMovimiento"
            )
            .value;


    // VALIDACIONES

    if (
        isNaN(idIngrediente)
    ) {

        mostrarMensaje(
            "Seleccione un ingrediente",
            false
        );

        return;
    }


    if (
        isNaN(cantidad)
        ||
        cantidad <= 0
    ) {

        mostrarMensaje(
            "Ingrese una cantidad válida",
            false
        );

        return;
    }


    if (descripcion === "") {

        mostrarMensaje(
            "Ingrese una descripción",
            false
        );

        return;
    }


    try {

        const respuesta =
            await fetch(
                "api/movimientos-inventario",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            idIngrediente:
                                idIngrediente,

                            tipoMovimiento:
                                tipoMovimiento,

                            cantidad:
                                cantidad,

                            descripcion:
                                descripcion
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
                "No se pudo registrar el movimiento"
            );
        }


        if (
            tipoMovimiento ===
            "ENTRADA"
        ) {

            mostrarMensaje(
                "Entrada registrada correctamente",
                true
            );

        } else {

            mostrarMensaje(
                "Salida registrada correctamente",
                true
            );
        }


        // ACTUALIZAR TABLAS

        await cargarIngredientes();

        await cargarMovimientos();


        setTimeout(function () {

            limpiarFormulario();

            document
                .getElementById(
                    "formularioMovimiento"
                )
                .classList.add("oculto");

        }, 800);


    } catch (error) {

        console.error(error);

        mostrarMensaje(
            error.message,
            false
        );
    }
}


// ==============================================
// CARGAR HISTORIAL
// ==============================================

async function cargarMovimientos() {

    try {

        const respuesta =
            await fetch(
                "api/movimientos-inventario"
            );


        if (!respuesta.ok) {

            throw new Error(
                "No se pudieron cargar los movimientos"
            );
        }


        listaMovimientos =
            await respuesta.json();


        mostrarMovimientos(
            listaMovimientos
        );


    } catch (error) {

        console.error(error);

        alert(
            "Error al cargar movimientos"
        );
    }
}


// ==============================================
// MOSTRAR HISTORIAL
// ==============================================

function mostrarMovimientos(movimientos) {

    const tabla =
        document.getElementById(
            "tablaMovimientos"
        );


    tabla.innerHTML = "";


    if (movimientos.length === 0) {

        tabla.innerHTML = `

            <tr>

                <td colspan="6">
                    No existen movimientos registrados
                </td>

            </tr>
        `;

        return;
    }


    movimientos.forEach(
        movimiento => {

            const fila =
                document.createElement("tr");


            const claseTipo =
                movimiento.tipoMovimiento ===
                "ENTRADA"
                    ? "movimiento-entrada"
                    : "movimiento-salida";


            fila.innerHTML = `

                <td>
                    ${movimiento.idMovimiento}
                </td>

                <td>
                    ${movimiento.nombreIngrediente}
                </td>

                <td class="${claseTipo}">
                    ${movimiento.tipoMovimiento}
                </td>

                <td>
                    ${movimiento.cantidad}
                </td>

                <td>
                    ${movimiento.fecha}
                </td>

                <td>
                    ${movimiento.descripcion || "-"}
                </td>
            `;


            tabla.appendChild(
                fila
            );
        }
    );
}


// ==============================================
// LIMPIAR FORMULARIO
// ==============================================

function limpiarFormulario() {

    document.getElementById(
        "cantidadMovimiento"
    ).value = "";


    document.getElementById(
        "descripcionMovimiento"
    ).value = "";


    document.getElementById(
        "tipoMovimiento"
    ).value = "";


    document.getElementById(
        "mensajeInventario"
    ).textContent = "";


    document.getElementById(
        "mensajeInventario"
    ).className = "";
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
            "mensajeInventario"
        );


    elemento.textContent =
        mensaje;


    elemento.className =
        correcto
            ? "mensaje-exito"
            : "mensaje-error";
}

