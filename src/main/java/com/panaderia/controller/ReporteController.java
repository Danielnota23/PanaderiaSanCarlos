/*
 * Universidad Mariano Gálvez de Guatemala
 * Ingeniería en Sistemas de Información y Ciencias de la Computación
 * Curso: Desarrollo Web - Proyecto Final
 * Sistema de Control de Producción - Panadería San Carlos
 */
package com.panaderia.controller;

import com.panaderia.manager.ReporteManager;

import java.io.IOException;
import java.sql.Date;
import java.sql.SQLException;

import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * GET /api/reportes/consolidado-pedidos?fecha=AAAA-MM-DD[&turno=MANANA|TARDE]
 *     -> lo que pidió cada sucursal de cada tipo de pan
 * GET /api/reportes/requerimiento-insumos?fecha=AAAA-MM-DD
 *     -> insumos necesarios para la producción pendiente de esa fecha
 */
@WebServlet("/api/reportes/*")
public class ReporteController extends BaseController {

    private final ReporteManager reporteManager = new ReporteManager();

    @Override
    protected void doGet(HttpServletRequest request,
                         HttpServletResponse response) throws IOException {

        String reporte = request.getPathInfo() == null
                ? ""
                : request.getPathInfo();

        Date fecha = convertirFecha(request.getParameter("fecha"));

        if (fecha == null) {
            responderMensaje(response, HttpServletResponse.SC_BAD_REQUEST,
                    "Indique una fecha válida (AAAA-MM-DD)");
            return;
        }

        try {
            switch (reporte) {

                case "/consolidado-pedidos":
                    String turno = request.getParameter("turno");
                    turno = vacio(turno) ? null : turno.trim().toUpperCase();

                    responderJson(response, HttpServletResponse.SC_OK,
                            reporteManager.consolidadoPedidos(fecha, turno));
                    break;

                case "/requerimiento-insumos":
                    responderJson(response, HttpServletResponse.SC_OK,
                            reporteManager.requerimientoPorFecha(fecha));
                    break;

                default:
                    responderMensaje(response, HttpServletResponse.SC_NOT_FOUND,
                            "Reporte no encontrado");
            }

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
