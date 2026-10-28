let listaProductos = [];
let modoEdicion = false;

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

    // Mostrar usuario
    document.getElementById(
        "nombreUsuario"
    ).textContent = usuario.nombre;

    document.getElementById(
        "rolUsuario"
    ).textContent = usuario.rol;


    // ==========================================
    // CARGAR PRODUCTOS
    // ==========================================

    cargarProductos();


    // ==========================================
    // NUEVO PRODUCTO
    // ==========================================

    document
        .getElementById("btnNuevoProducto")
        .addEventListener("click", function () {

            modoEdicion = false;

            limpiarFormulario();

            document.getElementById(
                "tituloFormulario"
            ).textContent = "Nuevo producto";

            document.getElementById(
                "formularioProducto"
            ).classList.remove("oculto");
        });


    // ==========================================
    // CANCELAR
    // ==========================================

    document
        .getElementById("btnCancelarProducto")
        .addEventListener("click", function () {

            limpiarFormulario();

            document.getElementById(
                "formularioProducto"
            ).classList.add("oculto");
        });


    // ==========================================
    // GUARDAR
    // ==========================================

    document
        .getElementById("btnGuardarProducto")
        .addEventListener("click", function () {

            guardarProducto();
        });


    // ==========================================
    // BUSCADOR
    // ==========================================

    document
        .getElementById("buscarProducto")
        .addEventListener("input", function () {

            const texto =
                this.value.toLowerCase().trim();

            const filtrados =
                listaProductos.filter(producto =>

                    producto.nombre
                        .toLowerCase()
                        .includes(texto)

                    ||

                    (
                        producto.descripcion
                        &&
                        producto.descripcion
                            .toLowerCase()
                            .includes(texto)
                    )
                );

            mostrarProductos(filtrados);
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
// OBTENER PRODUCTOS
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

        mostrarProductos(
            listaProductos
        );

    } catch (error) {

        console.error(error);

        mostrarMensaje(
            "Error al cargar productos",
            false
        );
    }
}


// ==============================================
// MOSTRAR PRODUCTOS EN TABLA
// ==============================================

function mostrarProductos(productos) {

    const tabla =
        document.getElementById(
            "tablaProductos"
        );

    tabla.innerHTML = "";

    if (productos.length === 0) {

        tabla.innerHTML = `
            <tr>
                <td colspan="5">
                    No se encontraron productos
                </td>
            </tr>
        `;

        return;
    }

    productos.forEach(producto => {

        const fila =
            document.createElement("tr");

        const estadoTexto =
            producto.estado
                ? "Activo"
                : "Inactivo";

        const estadoClase =
            producto.estado
                ? "estado-activo"
                : "estado-inactivo";

        fila.innerHTML = `

            <td>
                ${producto.idProducto}
            </td>

            <td>
                ${producto.nombre}
            </td>

            <td>
                ${producto.descripcion || "-"}
            </td>

            <td class="${estadoClase}">
                ${estadoTexto}
            </td>

            <td>

                <button
                    class="btn-editar"
                    onclick="editarProducto(
                        ${producto.idProducto}
                    )"
                >
                    Editar
                </button>

                <button
                    class="btn-eliminar"
                    onclick="eliminarProducto(
                        ${producto.idProducto}
                    )"
                >
                    Eliminar
                </button>

            </td>
        `;

        tabla.appendChild(fila);
    });
}


// ==============================================
// GUARDAR PRODUCTO
// ==============================================

async function guardarProducto() {

    const idProducto =
        document
            .getElementById("idProducto")
            .value;

    const nombre =
        document
            .getElementById("nombreProducto")
            .value
            .trim();

    const descripcion =
        document
            .getElementById("descripcionProducto")
            .value
            .trim();

    const estado =
        document
            .getElementById("estadoProducto")
            .value === "true";


    if (nombre === "") {

        mostrarMensaje(
            "Debe ingresar el nombre del producto",
            false
        );

        return;
    }


    const producto = {

        nombre: nombre,

        descripcion: descripcion,

        estado: estado
    };


    // Si estamos editando agregamos el ID
    if (modoEdicion) {

        producto.idProducto =
            parseInt(idProducto);
    }


    try {

        const metodo =
            modoEdicion
                ? "PUT"
                : "POST";


        const respuesta =
            await fetch(
                "api/productos",
                {
                    method: metodo,

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(producto)
                }
            );


        const datos =
            await respuesta.json();


        if (!respuesta.ok) {

            throw new Error(
                datos.mensaje
                || "No se pudo guardar"
            );
        }


        if (modoEdicion) {

            mostrarMensaje(
                "Producto actualizado correctamente",
                true
            );

        } else {

            mostrarMensaje(
                "Producto creado correctamente",
                true
            );
        }


        await cargarProductos();

        limpiarFormulario();

        setTimeout(function () {

            document
                .getElementById(
                    "formularioProducto"
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
// EDITAR PRODUCTO
// ==============================================

function editarProducto(idProducto) {

    const producto =
        listaProductos.find(
            producto =>
                producto.idProducto === idProducto
        );


    if (!producto) {
        return;
    }


    modoEdicion = true;


    document.getElementById(
        "tituloFormulario"
    ).textContent =
        "Editar producto";


    document.getElementById(
        "idProducto"
    ).value =
        producto.idProducto;


    document.getElementById(
        "nombreProducto"
    ).value =
        producto.nombre;


    document.getElementById(
        "descripcionProducto"
    ).value =
        producto.descripcion || "";


    document.getElementById(
        "estadoProducto"
    ).value =
        producto.estado
            ? "true"
            : "false";


    document
        .getElementById(
            "formularioProducto"
        )
        .classList.remove("oculto");


    // Bajar automáticamente al formulario
    document
        .getElementById(
            "formularioProducto"
        )
        .scrollIntoView({
            behavior: "smooth"
        });
}


// ==============================================
// ELIMINAR PRODUCTO
// ==============================================

async function eliminarProducto(idProducto) {

    const producto =
        listaProductos.find(
            producto =>
                producto.idProducto === idProducto
        );


    const nombreProducto =
        producto
            ? producto.nombre
            : "este producto";


    const confirmar =
        confirm(
            "¿Está seguro de eliminar "
            + nombreProducto
            + "?"
        );


    if (!confirmar) {
        return;
    }


    try {

        const respuesta =
            await fetch(
                "api/productos?id="
                + idProducto,
                {
                    method: "DELETE"
                }
            );


        const datos =
            await respuesta.json();


        if (!respuesta.ok) {

            throw new Error(
                datos.mensaje
                || "No se pudo eliminar"
            );
        }


        alert(
            "Producto eliminado correctamente"
        );


        await cargarProductos();


    } catch (error) {

        console.error(error);

        alert(
            error.message
        );
    }
}


// ==============================================
// LIMPIAR FORMULARIO
// ==============================================

function limpiarFormulario() {

    modoEdicion = false;

    document.getElementById(
        "idProducto"
    ).value = "";

    document.getElementById(
        "nombreProducto"
    ).value = "";

    document.getElementById(
        "descripcionProducto"
    ).value = "";

    document.getElementById(
        "estadoProducto"
    ).value = "true";

    document.getElementById(
        "mensajeProducto"
    ).textContent = "";

    document.getElementById(
        "mensajeProducto"
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
            "mensajeProducto"
        );

    elemento.textContent =
        mensaje;

    elemento.className =
        correcto
            ? "mensaje-exito"
            : "mensaje-error";
}

