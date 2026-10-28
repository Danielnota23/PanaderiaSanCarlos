let listaSucursales = [];

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
    // CARGAR SUCURSALES
    // ==========================================

    cargarSucursales();


    // ==========================================
    // BUSCADOR
    // ==========================================

    document
        .getElementById("buscarSucursal")
        .addEventListener("input", function () {

            const texto =
                this.value
                    .toLowerCase()
                    .trim();

            const filtradas =
                listaSucursales.filter(
                    sucursal => {

                        const nombre =
                            (sucursal.nombre || "")
                                .toLowerCase();

                        return nombre.includes(texto);
                    }
                );

            mostrarSucursales(filtradas);
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
// CARGAR SUCURSALES
// ==============================================

async function cargarSucursales() {

    try {

        const respuesta =
            await fetch("api/sucursales");

        if (!respuesta.ok) {

            throw new Error(
                "No se pudieron cargar las sucursales"
            );
        }

        listaSucursales =
            await respuesta.json();

        mostrarSucursales(
            listaSucursales
        );

    } catch (error) {

        console.error(error);

        alert(
            "Error al cargar las sucursales"
        );
    }
}


// ==============================================
// MOSTRAR SUCURSALES
// ==============================================

function mostrarSucursales(sucursales) {

    const tabla =
        document.getElementById(
            "tablaSucursales"
        );

    tabla.innerHTML = "";


    if (sucursales.length === 0) {

        tabla.innerHTML = `

            <tr>

                <td colspan="3">
                    No se encontraron sucursales
                </td>

            </tr>
        `;

        return;
    }


    sucursales.forEach(
        sucursal => {

            const fila =
                document.createElement("tr");


            const estadoTexto =
                sucursal.estado
                    ? "Activo"
                    : "Inactivo";


            const estadoClase =
                sucursal.estado
                    ? "estado-activo"
                    : "estado-inactivo";


            fila.innerHTML = `

                <td>
                    ${sucursal.idSucursal}
                </td>

                <td>
                    ${sucursal.nombre}
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
