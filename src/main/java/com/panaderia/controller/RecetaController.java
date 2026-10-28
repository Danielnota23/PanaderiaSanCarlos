/*
 * Universidad Mariano Gálvez de Guatemala
 * Ingeniería en Sistemas de Información y Ciencias de la Computación
 * Curso: Desarrollo Web - Proyecto Final
 * Sistema de Control de Producción - Panadería San Carlos
 */
package com.panaderia.controller;

import com.panaderia.manager.RecetaManager;
import com.panaderia.modelo.DetalleReceta;
import com.panaderia.modelo.Receta;

import java.io.IOException;
import java.sql.SQLException;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * GET    /api/recetas                         -> todas las recetas con ingredientes
 * GET    /api/recetas?idProducto=N            -> receta de un tipo de pan
 * GET    /api/recetas?idProducto=N&cantidad=C -> insumos necesarios para producir C
 * POST   /api/recetas  {idProducto, nombre, rendimiento, ingredientes[]} -> crea o actualiza
 * DELETE /api/recetas?id=N                    -> desactiva la receta
 */
@WebServlet("/api/recetas")
public class RecetaController extends BaseController {

    private final RecetaManager recetaManager = new RecetaManager();

    @Override
    protected void doGet(HttpServletRequest request,
                         HttpServletResponse response) throws IOException {

        Integer idProducto = parametroEntero(request, "idProducto");
        Integer cantidad = parametroEntero(request, "cantidad");

        try {
            if (idProducto == null) {
                responderJson(response, HttpServletResponse.SC_OK,
                        recetaManager.listarRecetas());
                return;
            }

            if (cantidad != null) {
                responderJson(response, HttpServletResponse.SC_OK,
                        recetaManager.calcularRequerimiento(idProducto, cantidad));
                return;
            }

            Receta receta = recetaManager.obtenerPorProducto(idProducto);

            if (receta == null) {
                responderMensaje(response, HttpServletResponse.SC_NOT_FOUND,
                        "El producto no tiene receta");
            } else {
                responderJson(response, HttpServletResponse.SC_OK, receta);
            }

        } catch (SQLException e) {
            responderErrorSQL(response, e);
        }
    }

    @Override
    protected void doPost(HttpServletRequest request,
                          HttpServletResponse response) throws IOException {

        Receta receta = leerJson(request, Receta.class);
        String error = validar(receta);

        if (error != null) {
            responderMensaje(response, HttpServletResponse.SC_BAD_REQUEST, error);
            return;
        }

        try {
            int idReceta = recetaManager.guardarReceta(receta);

            Map<String, Object> respuesta = new LinkedHashMap<>();
            respuesta.put("mensaje", "Receta guardada correctamente");
            respuesta.put("idReceta", idReceta);

            responderJson(response, HttpServletResponse.SC_CREATED, respuesta);

        } catch (SQLException e) {
            responderErrorSQL(response, e);
        }
    }

    @Override
    protected void doDelete(HttpServletRequest request,
                            HttpServletResponse response) throws IOException {

        Integer idReceta = parametroEntero(request, "id");

        if (idReceta == null) {
            responderMensaje(response, HttpServletResponse.SC_BAD_REQUEST,
                    "Debe indicar un id de receta numérico");
            return;
        }

        try {
            recetaManager.desactivarReceta(idReceta);
            responderMensaje(response, HttpServletResponse.SC_OK,
                    "Receta desactivada");

        } catch (SQLException e) {
            responderErrorSQL(response, e);
        }
    }

    /** Validación en el backend (la BD vuelve a validar). */
    private String validar(Receta receta) {

        if (receta == null || receta.getIdProducto() <= 0) {
            return "Seleccione el tipo de pan";
        }

        if (vacio(receta.getNombre())) {
            return "El nombre de la receta es obligatorio";
        }

        if (receta.getRendimiento() <= 0) {
            return "El rendimiento debe ser mayor que cero";
        }

        if (receta.getIngredientes() == null
                || receta.getIngredientes().isEmpty()) {
            return "Agregue al menos un ingrediente";
        }

        Set<Integer> usados = new HashSet<>();

        for (DetalleReceta detalle : receta.getIngredientes()) {

            if (detalle.getIdIngrediente() <= 0) {
                return "Seleccione el ingrediente en todas las filas";
            }

            if (detalle.getCantidad() <= 0) {
                return "Todas las cantidades deben ser mayores que cero";
            }

            if (!usados.add(detalle.getIdIngrediente())) {
                return "Un ingrediente está repetido en la receta";
            }
        }

        return null;
    }
}
