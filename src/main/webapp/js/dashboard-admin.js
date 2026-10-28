document.addEventListener("DOMContentLoaded", function () {

    // Recuperar usuario guardado en el login
    const usuarioGuardado = localStorage.getItem("usuario");

    // Si no existe sesión, regresar al login
    if (!usuarioGuardado) {
        window.location.href = "Login.html";
        return;
    }

    const usuario = JSON.parse(usuarioGuardado);

    // Solo ADMIN puede entrar a este dashboard
    if (usuario.rol !== "ADMIN") {
        window.location.href = "Login.html";
        return;
    }

    // Mostrar datos del usuario
    document.getElementById("nombreUsuario").textContent =
        usuario.nombre;

    document.getElementById("rolUsuario").textContent =
        usuario.rol;

    // Cargar información del dashboard
    cargarDashboard();


    // CERRAR SESIÓN
    document
        .getElementById("cerrarSesion")
        .addEventListener("click", function () {

            localStorage.removeItem("usuario");

            window.location.href = "Login.html";
        });
});


async function cargarDashboard() {

    try {

        const [
            respuestaPedidos,
            respuestaProductos,
            respuestaProduccion,
            respuestaIngredientes
        ] = await Promise.all([

            fetch("api/pedidos"),

            fetch("api/productos"),

            fetch("api/produccion"),

            fetch("api/ingredientes")
        ]);


        // Verificar respuestas
        if (!respuestaPedidos.ok) {
            throw new Error("Error cargando pedidos");
        }

        if (!respuestaProductos.ok) {
            throw new Error("Error cargando productos");
        }

        if (!respuestaProduccion.ok) {
            throw new Error("Error cargando producción");
        }

        if (!respuestaIngredientes.ok) {
            throw new Error("Error cargando ingredientes");
        }


        // Convertir respuestas a JSON
        const pedidos =
            await respuestaPedidos.json();

        const productos =
            await respuestaProductos.json();

        const produccion =
            await respuestaProduccion.json();

        const ingredientes =
            await respuestaIngredientes.json();


        // TOTAL DE PEDIDOS
        document.getElementById(
            "totalPedidos"
        ).textContent = pedidos.length;


        // TOTAL DE PRODUCTOS
        document.getElementById(
            "totalProductos"
        ).textContent = productos.length;


        // TOTAL DE PRODUCCIÓN
        document.getElementById(
            "totalProduccion"
        ).textContent = produccion.length;


        // CONTAR INGREDIENTES CON STOCK BAJO
        const ingredientesStockBajo =
            ingredientes.filter(
                ingrediente =>
                    ingrediente.nivelStock === "BAJO_STOCK"
            );


        document.getElementById(
            "stockBajo"
        ).textContent =
            ingredientesStockBajo.length;


        console.log(
            "Dashboard cargado correctamente"
        );

    } catch (error) {

        console.error(
            "Error al cargar dashboard:",
            error
        );
    }
}
