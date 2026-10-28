/*
 * Universidad Mariano Gálvez de Guatemala
 * Ingeniería en Sistemas de Información y Ciencias de la Computación
 * Curso: Desarrollo Web - Proyecto Final
 * Sistema de Control de Producción - Panadería San Carlos
 */
package com.panaderia.controller;

import com.panaderia.manager.ProduccionManager;
import com.panaderia.modelo.Produccion;

import java.io.IOException;
import java.sql.Date;
import java.sql.SQLException;
import java.util.Collections;

import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * GET  /api/produccion  -> registros de producción
 * POST /api/produccion  {fecha: "AAAA-MM-DD"} -> genera la producción del día
 *                                               a partir de los pedidos
 * PUT  /api/produccion  {idProduccion, cantidadProducida, estado}
 *                       -> registra avance y descuenta insumos según receta
 */
@WebServlet("/api/produccion")
public class ProduccionController extends BaseController {

    private final ProduccionManager produccionManager =
            new ProduccionManager();

    @Override
    protected void doGet(HttpServletRequest request,
                         HttpServletResponse response) throws IOException {

        responderJson(response, HttpServletResponse.SC_OK,
                produccionManager.listarProduccion());
    }

    @Override
    protected void doPost(HttpServletRequest request,
                          HttpServletResponse response) throws IOException {

        Produccion datos = leerJson(request, Produccion.class);
        Date fecha = convertirFecha(datos == null ? null : datos.getFecha());

        if (fecha == null) {
            responderMensaje(response, HttpServletResponse.SC_BAD_REQUEST,
                    "Indique una fecha válida (AAAA-MM-DD)");
            return;
        }

        try {
            int registros = produccionManager.generarProduccion(fecha);

            responderJson(response, HttpServletResponse.SC_CREATED,
                    Collections.singletonMap("mensaje",
                            "Producción generada: " + registros
                            + " tipo(s) de pan"));

        } catch (SQLException e) {
            responderErrorSQL(response, e);
        }
    }

    @Override
    protected void doPut(HttpServletRequest request,
                         HttpServletResponse response) throws IOException {

        Produccion produccion = leerJson(request, Produccion.class);

        if (produccion == null
                || produccion.getIdProduccion() <= 0
                || produccion.getCantidadProducida() < 0
                || vacio(produccion.getEstado())) {

            responderMensaje(response, HttpServletResponse.SC_BAD_REQUEST,
                    "Datos de producción incompletos");
            return;
        }

        try {
            produccionManager.actualizarProduccion(
                    produccion.getIdProduccion(),
                    produccion.getCantidadProducida(),
                    produccion.getEstado().trim().toUpperCase());

            responderMensaje(response, HttpServletResponse.SC_OK,
                    "Producción actualizada e insumos descontados");

        } catch (SQLException e) {
            responderErrorSQL(response, e);
        }
    }

    private Date convertirFecha(String texto) {
        try {
            return vacio(texto) ? null : Date.valueOf(texto.trim());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}