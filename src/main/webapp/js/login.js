document
    .getElementById("loginForm")
    .addEventListener("submit", async function (event) {

        event.preventDefault();

        const correo =
            document.getElementById("correo").value.trim();

        const contrasena =
            document.getElementById("contrasena").value.trim();

        const mensaje =
            document.getElementById("mensaje");

        mensaje.textContent = "";
        mensaje.className = "";

        try {

            const respuesta = await fetch("api/login", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    correo: correo,
                    contrasena: contrasena
                })
            });

            const datos = await respuesta.json();

            if (respuesta.ok) {

                mensaje.textContent =
                    "Inicio de sesión correcto";

                mensaje.className = "exito";

                localStorage.setItem(
                    "usuario",
                    JSON.stringify(datos)
                );

                console.log(
                    "Usuario autenticado:",
                    datos
                );
        
       const rol = (datos.rol || "")
        .trim()
        .toUpperCase();

console.log("Rol recibido:", rol);

if (rol === "ADMIN") {

    window.location.href =
        "dashboard-admin.html";

} else if (rol === "SUCURSAL") {

    window.location.href =
        "dashboard-sucursal.html";

} else if (rol === "PRODUCCION") {

    window.location.href =
        "dashboard-produccion.html";
}

            } else {

                mensaje.textContent =
                    datos.mensaje
                    || "Correo o contraseña incorrectos";

                mensaje.className = "error";
            }

        } catch (error) {

            console.error(error);

            mensaje.textContent =
                "No se pudo conectar con el servidor";

            mensaje.className = "error";
        }
    });

