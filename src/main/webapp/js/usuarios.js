let listaUsuarios = [];

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
    // CARGAR USUARIOS
    // ==========================================

    cargarUsuarios();


    // ==========================================
    // BUSCADOR
    // ==========================================

    document
        .getElementById("buscarUsuario")
        .addEventListener("input", aplicarFiltros);


    // ==========================================
    // FILTRO POR ROL
    // ==========================================

    document
        .getElementById("filtroRol")
        .addEventListener("change", aplicarFiltros);


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
// CARGAR USUARIOS
// ==============================================

async function cargarUsuarios() {

    try {

        const respuesta =
            await fetch("api/usuarios");

        if (!respuesta.ok) {

            throw new Error(
                "No se pudieron cargar los usuarios"
            );
        }

        listaUsuarios =
            await respuesta.json();

        mostrarUsuarios(
            listaUsuarios
        );

    } catch (error) {

        console.error(error);

        alert(
            "Error al cargar los usuarios"
        );
    }
}


// ==============================================
// MOSTRAR USUARIOS
// ==============================================

function mostrarUsuarios(usuarios) {

    const tabla =
        document.getElementById(
            "tablaUsuarios"
        );

    tabla.innerHTML = "";


    if (usuarios.length === 0) {

        tabla.innerHTML = `

            <tr>

                <td colspan="6">
                    No se encontraron usuarios
                </td>

            </tr>
        `;

        return;
    }


    usuarios.forEach(
        usuario => {

            const fila =
                document.createElement("tr");


            const claseRol =
                obtenerClaseRol(
                    usuario.rol
                );


            const estadoTexto =
                usuario.estado
                    ? "Activo"
                    : "Inactivo";


            const estadoClase =
                usuario.estado
                    ? "estado-activo"
                    : "estado-inactivo";


            const sucursal =
                usuario.idSucursal &&
                usuario.idSucursal !== 0
                    ? usuario.idSucursal
                    : "-";


            fila.innerHTML = `

                <td>
                    ${usuario.idUsuario}
                </td>

                <td>
                    ${usuario.nombre}
                </td>

                <td>
                    ${usuario.correo}
                </td>

                <td class="${claseRol}">
                    ${formatearRol(usuario.rol)}
                </td>

                <td>
                    ${sucursal}
                </td>

                <td class="${estadoClase}">
                    ${estadoTexto}
                </td>
            `;


            tabla.appendChild(
                fila
            );
        }
    );
}


// ==============================================
// FILTRAR
// ==============================================

function aplicarFiltros() {

    const texto =
        document
            .getElementById("buscarUsuario")
            .value
            .toLowerCase()
            .trim();


    const rol =
        document
            .getElementById("filtroRol")
            .value;


    const filtrados =
        listaUsuarios.filter(
            usuario => {

                const nombre =
                    (usuario.nombre || "")
                        .toLowerCase();

                const correo =
                    (usuario.correo || "")
                        .toLowerCase();


                const coincideTexto =
                    nombre.includes(texto)
                    ||
                    correo.includes(texto);


                const coincideRol =
                    rol === ""
                    ||
                    usuario.rol === rol;


                return (
                    coincideTexto
                    &&
                    coincideRol
                );
            }
        );


    mostrarUsuarios(
        filtrados
    );
}


// ==============================================
// CLASE DEL ROL
// ==============================================

function obtenerClaseRol(rol) {

    switch (rol) {

        case "ADMIN":
            return "rol-admin";

        case "SUCURSAL":
            return "rol-sucursal";

        case "PRODUCCION":
            return "rol-produccion";

        default:
            return "";
    }
}


// ==============================================
// FORMATEAR ROL
// ==============================================

function formatearRol(rol) {

    switch (rol) {

        case "ADMIN":
            return "Administrador";

        case "SUCURSAL":
            return "Sucursal";

        case "PRODUCCION":
            return "Producción";

        default:
            return rol;
    }
}


