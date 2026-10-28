// ==============================================
// RECETAS - Panadería San Carlos
// ==============================================

let productos = [];
let ingredientes = [];
let recetas = [];

document.addEventListener("DOMContentLoaded", function () {

    // ---------- Validar sesión (solo ADMIN) ----------
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

    document.getElementById("nombreUsuario").textContent = usuario.nombre;
    document.getElementById("rolUsuario").textContent = usuario.rol;

    // ---------- Eventos ----------
    document.getElementById("btnNuevaReceta")
        .addEventListener("click", () => abrirFormulario(null));

    document.getElementById("btnAgregarIngrediente")
        .addEventListener("click", () => agregarFila());

    document.getElementById("btnCancelarReceta")
        .addEventListener("click", cerrarFormulario);

    document.getElementById("formReceta")
        .addEventListener("submit", guardarReceta);

    document.getElementById("formCalculo")
        .addEventListener("submit", calcularInsumos);

    document.getElementById("productoReceta")
        .addEventListener("change", sugerirNombre);

    document.getElementById("cerrarSesion")
        .addEventListener("click", function () {
            localStorage.removeItem("usuario");
            window.location.href = "Login.html";
        });

    cargarDatos();
});


// ==============================================
// CARGA DE DATOS
// ==============================================

async function cargarDatos() {

    try {
        const [resProductos, resIngredientes, resRecetas] = await Promise.all([
            fetch("api/productos"),
            fetch("api/ingredientes"),
            fetch("api/recetas")
        ]);

        if (!resProductos.ok || !resIngredientes.ok || !resRecetas.ok) {
            throw new Error("No se pudieron cargar los datos");
        }

        productos = await resProductos.json();
        ingredientes = await resIngredientes.json();
        recetas = await resRecetas.json();

        mostrarRecetas();
        llenarSelectProductos();

    } catch (error) {
        console.error(error);
        document.getElementById("tablaRecetas").innerHTML =
            `<tr><td colspan="5" class="mensaje-error">Error al cargar las recetas</td></tr>`;
    }
}


// ==============================================
// TABLA DE RECETAS
// ==============================================

function mostrarRecetas() {

    const tabla = document.getElementById("tablaRecetas");
    tabla.innerHTML = "";

    if (productos.length === 0) {
        tabla.innerHTML = `<tr><td colspan="5">No hay productos registrados</td></tr>`;
        return;
    }

    // Se muestran todos los panes; los que no tienen receta se marcan
    productos.forEach(producto => {

        const receta = recetaDe(producto.idProducto);
        const fila = document.createElement("tr");

        if (receta) {

            const chips = receta.ingredientes.map(i =>
                `<span class="chip">${escapar(i.nombreIngrediente)}: ${formatear(i.cantidad)} ${escapar(i.unidadMedida)}</span>`
            ).join("");

            fila.innerHTML = `
                <td><strong>${escapar(producto.nombre)}</strong></td>
                <td>${escapar(receta.nombre)}</td>
                <td class="num">${receta.rendimiento}</td>
                <td><div class="chips">${chips}</div></td>
                <td>
                    <div class="acciones-fila">
                        <button class="btn btn-editar" data-editar="${producto.idProducto}">Editar</button>
                        <button class="btn btn-secundario" data-calcular="${producto.idProducto}">Calcular</button>
                    </div>
                </td>
            `;

        } else {

            fila.innerHTML = `
                <td><strong>${escapar(producto.nombre)}</strong></td>
                <td class="sin-receta">Sin receta</td>
                <td class="num">—</td>
                <td>No se puede producir hasta registrar su receta</td>
                <td>
                    <button class="btn btn-primario" data-editar="${producto.idProducto}">Crear receta</button>
                </td>
            `;
        }

        tabla.appendChild(fila);
    });

    tabla.querySelectorAll("[data-editar]").forEach(boton =>
        boton.addEventListener("click", () =>
            abrirFormulario(parseInt(boton.dataset.editar))));

    tabla.querySelectorAll("[data-calcular]").forEach(boton =>
        boton.addEventListener("click", () => {
            document.getElementById("productoCalculo").value = boton.dataset.calcular;
            document.getElementById("cantidadCalculo").focus();
            document.getElementById("formCalculo").scrollIntoView({ behavior: "smooth" });
        }));
}

function llenarSelectProductos() {

    const opciones = productos.map(p =>
        `<option value="${p.idProducto}">${escapar(p.nombre)}</option>`).join("");

    document.getElementById("productoReceta").innerHTML =
        `<option value="">Seleccione...</option>` + opciones;

    // En la calculadora solo los panes con receta
    const conReceta = productos.filter(p => recetaDe(p.idProducto));

    document.getElementById("productoCalculo").innerHTML = conReceta.length
        ? conReceta.map(p => `<option value="${p.idProducto}">${escapar(p.nombre)}</option>`).join("")
        : `<option value="">No hay recetas</option>`;
}


// ==============================================
// FORMULARIO
// ==============================================

function abrirFormulario(idProducto) {

    limpiarErrores();
    document.getElementById("mensajeReceta").textContent = "";
    document.getElementById("filasIngredientes").innerHTML = "";

    const select = document.getElementById("productoReceta");
    const receta = idProducto ? recetaDe(idProducto) : null;

    if (receta) {
        document.getElementById("tituloFormulario").textContent =
            "Editar receta - " + receta.nombreProducto;
        select.value = receta.idProducto;
        select.disabled = true;
        document.getElementById("nombreReceta").value = receta.nombre;
        document.getElementById("rendimientoReceta").value = receta.rendimiento;
        receta.ingredientes.forEach(i => agregarFila(i.idIngrediente, i.cantidad));

    } else {
        document.getElementById("tituloFormulario").textContent = "Nueva receta";
        select.value = idProducto || "";
        select.disabled = Boolean(idProducto);
        document.getElementById("nombreReceta").value = "";
        document.getElementById("rendimientoReceta").value = 100;
        agregarFila();
        sugerirNombre();
    }

    const formulario = document.getElementById("formularioReceta");
    formulario.classList.remove("oculto");
    formulario.scrollIntoView({ behavior: "smooth" });
}

function cerrarFormulario() {
    document.getElementById("formularioReceta").classList.add("oculto");
}

function sugerirNombre() {

    const select = document.getElementById("productoReceta");
    const nombre = document.getElementById("nombreReceta");
    const producto = productos.find(p => p.idProducto === parseInt(select.value));

    if (producto && nombre.value.trim() === "") {
        nombre.value = "Receta " + producto.nombre;
    }
}

function agregarFila(idIngrediente, cantidad) {

    const fila = document.createElement("tr");

    const opciones = ingredientes.map(i =>
        `<option value="${i.idIngrediente}" data-unidad="${escapar(i.unidadMedida)}">${escapar(i.nombre)}</option>`
    ).join("");

    fila.innerHTML = `
        <td>
            <select class="ingrediente">
                <option value="">Seleccione...</option>
                ${opciones}
            </select>
        </td>
        <td><input type="number" class="cantidad" min="0.001" step="0.001" placeholder="0.000"></td>
        <td class="unidad">—</td>
        <td><button type="button" class="btn btn-quitar" title="Quitar">✕</button></td>
    `;

    const select = fila.querySelector(".ingrediente");
    const unidad = fila.querySelector(".unidad");

    const actualizarUnidad = () => {
        const opcion = select.selectedOptions[0];
        unidad.textContent = opcion && opcion.dataset.unidad ? opcion.dataset.unidad : "—";
    };

    select.addEventListener("change", actualizarUnidad);

    fila.querySelector(".btn-quitar").addEventListener("click", () => {
        fila.remove();
        if (!document.querySelector("#filasIngredientes tr")) {
            agregarFila();
        }
    });

    if (idIngrediente) {
        select.value = idIngrediente;
        fila.querySelector(".cantidad").value = cantidad;
        actualizarUnidad();
    }

    document.getElementById("filasIngredientes").appendChild(fila);
}


// ==============================================
// VALIDAR Y GUARDAR
// ==============================================

async function guardarReceta(evento) {

    evento.preventDefault();
    limpiarErrores();

    const datos = validarFormulario();

    if (!datos) {
        mostrarMensaje("Revise los campos marcados", false);
        return;
    }

    const boton = document.getElementById("btnGuardarReceta");
    boton.disabled = true;
    boton.textContent = "Guardando...";

    try {
        const respuesta = await fetch("api/recetas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(resultado.mensaje || "No se pudo guardar la receta");
        }

        mostrarMensaje(resultado.mensaje, true);
        await cargarDatos();
        setTimeout(cerrarFormulario, 900);

    } catch (error) {
        mostrarMensaje(error.message, false);

    } finally {
        boton.disabled = false;
        boton.textContent = "Guardar receta";
    }
}

function validarFormulario() {

    let valido = true;

    const selectProducto = document.getElementById("productoReceta");
    const inputNombre = document.getElementById("nombreReceta");
    const inputRendimiento = document.getElementById("rendimientoReceta");

    const idProducto = parseInt(selectProducto.value);
    const nombre = inputNombre.value.trim();
    const rendimiento = Number(inputRendimiento.value);

    if (!idProducto) {
        marcarError(selectProducto, "errorProducto", "Seleccione el tipo de pan");
        valido = false;
    }

    if (nombre.length < 3) {
        marcarError(inputNombre, "errorNombre", "Escriba un nombre de al menos 3 letras");
        valido = false;
    }

    if (!Number.isInteger(rendimiento) || rendimiento <= 0) {
        marcarError(inputRendimiento, "errorRendimiento", "Debe ser un número entero mayor que 0");
        valido = false;
    }

    const lista = [];
    const usados = new Set();
    let errorFilas = "";

    document.querySelectorAll("#filasIngredientes tr").forEach(fila => {

        const select = fila.querySelector(".ingrediente");
        const input = fila.querySelector(".cantidad");
        const idIngrediente = parseInt(select.value);
        const cantidad = Number(input.value);

        if (!idIngrediente) {
            select.classList.add("invalido");
            errorFilas = errorFilas || "Seleccione el ingrediente en todas las filas";
        } else if (usados.has(idIngrediente)) {
            select.classList.add("invalido");
            errorFilas = "Hay ingredientes repetidos";
        } else {
            usados.add(idIngrediente);
        }

        if (input.value === "" || isNaN(cantidad) || cantidad <= 0) {
            input.classList.add("invalido");
            errorFilas = errorFilas || "Todas las cantidades deben ser mayores que 0";
        }

        lista.push({ idIngrediente: idIngrediente, cantidad: cantidad });
    });

    if (lista.length === 0) {
        errorFilas = "Agregue al menos un ingrediente";
    }

    if (errorFilas) {
        document.getElementById("errorIngredientes").textContent = errorFilas;
        valido = false;
    }

    if (!valido) {
        return null;
    }

    return {
        idProducto: idProducto,
        nombre: nombre,
        rendimiento: rendimiento,
        ingredientes: lista
    };
}

function marcarError(campo, idError, mensaje) {
    campo.classList.add("invalido");
    document.getElementById(idError).textContent = mensaje;
}

function limpiarErrores() {
    document.querySelectorAll(".invalido").forEach(c => c.classList.remove("invalido"));
    document.querySelectorAll(".error-campo").forEach(e => e.textContent = "");
}

function mostrarMensaje(texto, correcto) {
    const elemento = document.getElementById("mensajeReceta");
    elemento.textContent = texto;
    elemento.className = "mensaje " + (correcto ? "mensaje-exito" : "mensaje-error");
}


// ==============================================
// CALCULADORA DE INSUMOS
// ==============================================

async function calcularInsumos(evento) {

    evento.preventDefault();

    const error = document.getElementById("errorCalculo");
    const inputCantidad = document.getElementById("cantidadCalculo");
    const idProducto = parseInt(document.getElementById("productoCalculo").value);
    const cantidad = Number(inputCantidad.value);

    error.textContent = "";
    inputCantidad.classList.remove("invalido");

    if (!idProducto) {
        error.textContent = "Primero registre una receta";
        return;
    }

    if (!Number.isInteger(cantidad) || cantidad <= 0) {
        inputCantidad.classList.add("invalido");
        error.textContent = "Ingrese una cantidad entera mayor que 0";
        return;
    }

    try {
        const respuesta = await fetch(
            `api/recetas?idProducto=${idProducto}&cantidad=${cantidad}`);
        const datos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(datos.mensaje || "No se pudo calcular");
        }

        document.getElementById("tablaCalculo").innerHTML = datos.map(r => `
            <tr>
                <td>${escapar(r.nombreIngrediente)}</td>
                <td class="num">${formatear(r.cantidadNecesaria)} ${escapar(r.unidadMedida)}</td>
                <td class="num">${formatear(r.existenciaActual)} ${escapar(r.unidadMedida)}</td>
                <td class="${r.suficiente ? "estado-ok" : "estado-falta"}">
                    ${r.suficiente ? "✔ Alcanza" : "✖ Faltan " + formatear(r.faltante) + " " + escapar(r.unidadMedida)}
                </td>
            </tr>
        `).join("");

        document.getElementById("resultadoCalculo").classList.remove("oculto");

    } catch (e) {
        error.textContent = e.message;
    }
}


// ==============================================
// UTILIDADES
// ==============================================

function recetaDe(idProducto) {
    return recetas.find(r => r.idProducto === idProducto);
}

function formatear(numero) {
    return Number(numero).toLocaleString("es-GT", { maximumFractionDigits: 3 });
}

function escapar(texto) {
    return String(texto ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
