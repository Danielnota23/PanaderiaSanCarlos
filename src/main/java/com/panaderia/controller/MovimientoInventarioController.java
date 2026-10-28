package com.panaderia.controller;

import com.google.gson.Gson;
import com.panaderia.manager.MovimientoInventarioManager;
import com.panaderia.modelo.MovimientoInventario;

import java.io.IOException;
import java.util.List;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.sql.SQLException;

@WebServlet("/api/movimientos-inventario")
public class MovimientoInventarioController extends HttpServlet {

    private MovimientoInventarioManager movimientoManager;
    private Gson gson;

    @Override
    public void init() throws ServletException {
        movimientoManager = new MovimientoInventarioManager();
        gson = new Gson();
    }

    @Override
    protected void doGet(
            HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        List<MovimientoInventario> movimientos =
                movimientoManager.listarMovimientos();

        response.getWriter().print(
                gson.toJson(movimientos)
        );
    }
    
    @Override
protected void doPost(
        HttpServletRequest request,
        HttpServletResponse response)
        throws ServletException, IOException {

    request.setCharacterEncoding("UTF-8");
    response.setContentType("application/json");
    response.setCharacterEncoding("UTF-8");

    MovimientoInventario movimiento =
            gson.fromJson(
                    request.getReader(),
                    MovimientoInventario.class
            );

    if (movimiento == null
            || movimiento.getIdIngrediente() <= 0
            || movimiento.getCantidad() <= 0
            || movimiento.getTipoMovimiento() == null) {

        response.setStatus(
                HttpServletResponse.SC_BAD_REQUEST
        );

        response.getWriter().print(
                "{\"mensaje\":\"Datos del movimiento incompletos\"}"
        );

        return;
    }

    String tipo =
            movimiento.getTipoMovimiento().toUpperCase();

    if (tipo.equals("ENTRADA")) {

        boolean registrado =
                movimientoManager.registrarEntrada(
                        movimiento.getIdIngrediente(),
                        movimiento.getCantidad(),
                        movimiento.getDescripcion()
                );

        if (registrado) {

            response.setStatus(
                    HttpServletResponse.SC_CREATED
            );

            response.getWriter().print(
                    "{\"mensaje\":\"Entrada registrada correctamente\"}"
            );

        } else {

            response.setStatus(
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR
            );

            response.getWriter().print(
                    "{\"mensaje\":\"No se pudo registrar la entrada\"}"
            );
        }

    } else if (tipo.equals("SALIDA")) {

        try {

            movimientoManager.registrarSalida(
                    movimiento.getIdIngrediente(),
                    movimiento.getCantidad(),
                    movimiento.getDescripcion()
            );

            response.setStatus(
                    HttpServletResponse.SC_CREATED
            );

            response.getWriter().print(
                    "{\"mensaje\":\"Salida registrada correctamente\"}"
            );

        } catch (SQLException e) {

    response.setStatus(
            HttpServletResponse.SC_BAD_REQUEST
    );

    String mensaje = e.getMessage();

    if (mensaje == null) {
        mensaje = "No se pudo registrar la salida";
    }

    if (mensaje.startsWith("ERROR: ")) {
        mensaje = mensaje.substring(7);
    }

    int posicionWhere = mensaje.indexOf("\n  Where:");

    if (posicionWhere > 0) {
        mensaje = mensaje.substring(0, posicionWhere);
    }

    mensaje = mensaje.replace("\"", "'");

    response.getWriter().print(
            "{\"mensaje\":\"" + mensaje + "\"}"
    );
}

    } else {

        response.setStatus(
                HttpServletResponse.SC_BAD_REQUEST
        );

        response.getWriter().print(
                "{\"mensaje\":\"Tipo de movimiento no valido\"}"
        );
    }
}
 
}