/*
 * Universidad Mariano Gálvez de Guatemala
 * Ingeniería en Sistemas de Información y Ciencias de la Computación
 * Curso: Desarrollo Web - Proyecto Final
 * Sistema de Control de Producción - Panadería San Carlos
 */
package com.panaderia.controller;

import com.google.gson.Gson;
import com.google.gson.JsonSyntaxException;

import java.io.IOException;
import java.sql.SQLException;
import java.util.Collections;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * Clase base de todos los controladores REST.
 *
 * Concentra el código que antes se repetía en cada servlet:
 * leer JSON del cuerpo, responder JSON, responder mensajes de error
 * y convertir los errores de PostgreSQL en mensajes legibles.
 */
public abstract class BaseController extends HttpServlet {

    private static final long serialVersionUID = 1L;

    protected final Gson gson = new Gson();

    /** Convierte el cuerpo de la petición en un objeto. */
    protected <T> T leerJson(HttpServletRequest request, Class<T> tipo)
            throws IOException {

        request.setCharacterEncoding("UTF-8");

        try {
            return gson.fromJson(request.getReader(), tipo);
        } catch (JsonSyntaxException e) {
            return null;
        }
    }

    /** Responde cualquier objeto como JSON con el código HTTP indicado. */
    protected void responderJson(HttpServletResponse response,
                                 int estado,
                                 Object datos) throws IOException {

        response.setStatus(estado);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().print(gson.toJson(datos));
    }

    /** Responde {"mensaje": "..."} con el código HTTP indicado. */
    protected void responderMensaje(HttpServletResponse response,
                                    int estado,
                                    String mensaje) throws IOException {

        responderJson(response, estado,
                Collections.singletonMap("mensaje", mensaje));
    }

    /**
     * Responde un error de base de datos.
     * Los RAISE EXCEPTION de los procedimientos son errores de negocio
     * (código 400); cualquier otro error es del servidor (código 500).
     */
    protected void responderErrorSQL(HttpServletResponse response,
                                     SQLException e) throws IOException {

        boolean errorDeNegocio = "P0001".equals(e.getSQLState());

        if (!errorDeNegocio) {
            e.printStackTrace();
        }

        responderMensaje(response,
                errorDeNegocio
                        ? HttpServletResponse.SC_BAD_REQUEST
                        : HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                errorDeNegocio
                        ? limpiarMensajeSQL(e)
                        : "Ocurrió un error en la base de datos");
    }

    /**
     * Quita del mensaje de PostgreSQL el prefijo "ERROR:" y el
     * contexto técnico ("Where: ...") para mostrarlo al usuario.
     */
    protected String limpiarMensajeSQL(SQLException e) {

        String mensaje = e.getMessage();

        if (mensaje == null) {
            return "Error en la base de datos";
        }

        if (mensaje.startsWith("ERROR: ")) {
            mensaje = mensaje.substring(7);
        }

        int corte = mensaje.indexOf("\n");

        if (corte > 0) {
            mensaje = mensaje.substring(0, corte);
        }

        return mensaje.trim();
    }

    /** Lee un parámetro entero de la URL; devuelve null si no es válido. */
    protected Integer parametroEntero(HttpServletRequest request,
                                      String nombre) {

        String valor = request.getParameter(nombre);

        if (valor == null || valor.trim().isEmpty()) {
            return null;
        }

        try {
            return Integer.parseInt(valor.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /** Valida que un texto no esté vacío. */
    protected boolean vacio(String texto) {
        return texto == null || texto.trim().isEmpty();
    }
}
