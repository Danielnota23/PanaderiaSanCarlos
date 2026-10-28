/*
 * Universidad Mariano Gálvez de Guatemala
 * Ingeniería en Sistemas de Información y Ciencias de la Computación
 * Curso: Desarrollo Web - Proyecto Final
 * Sistema de Control de Producción - Panadería San Carlos
 */
package com.panaderia.controller;

import com.panaderia.manager.PedidoManager;
import com.panaderia.modelo.Pedido;

import java.io.IOException;
import java.sql.SQLException;
import java.util.Arrays;
import java.util.List;

import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * GET  /api/pedidos  -> pedidos de todas las sucursales con su detalle
 * POST /api/pedidos  {idSucursal, turno, observacion, detalles[]} -> crea pedido
 * PUT  /api/pedidos  {idPedido, estado} -> cambia el estado
 */
@WebServlet("/api/pedidos")
public class PedidoController extends BaseController {

    private static final List<String> TURNOS =
            Arrays.asList("MANANA", "TARDE");

    private final PedidoManager pedidoManager = new PedidoManager();

    @Override
    protected void doGet(HttpServletRequest request,
                         HttpServletResponse response) throws IOException {

        responderJson(response, HttpServletResponse.SC_OK,
                pedidoManager.listarPedidos());
    }

    @Override
    protected void doPost(HttpServletRequest request,
                          HttpServletResponse response) throws IOException {

        Pedido pedido = leerJson(request, Pedido.class);

        if (pedido == null
                || pedido.getIdSucursal() <= 0
                || vacio(pedido.getTurno())
                || pedido.getDetalles() == null
                || pedido.getDetalles().isEmpty()) {

            responderMensaje(response, HttpServletResponse.SC_BAD_REQUEST,
                    "Datos del pedido incompletos");
            return;
        }

        pedido.setTurno(pedido.getTurno().trim().toUpperCase());

        if (!TURNOS.contains(pedido.getTurno())) {
            responderMensaje(response, HttpServletResponse.SC_BAD_REQUEST,
                    "El turno debe ser MANANA o TARDE");
            return;
        }

        Pedido creado = pedidoManager.crearPedido(pedido);

        if (creado != null) {
            responderJson(response, HttpServletResponse.SC_CREATED, creado);
        } else {
            responderMensaje(response,
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    "No se pudo crear el pedido");
        }
    }

    @Override
    protected void doPut(HttpServletRequest request,
                         HttpServletResponse response) throws IOException {

        Pedido pedido = leerJson(request, Pedido.class);

        if (pedido == null
                || pedido.getIdPedido() <= 0
                || vacio(pedido.getEstado())) {

            responderMensaje(response, HttpServletResponse.SC_BAD_REQUEST,
                    "Id y estado son obligatorios");
            return;
        }

        try {
            pedidoManager.actualizarEstadoPedido(
                    pedido.getIdPedido(),
                    pedido.getEstado().trim().toUpperCase());

            responderMensaje(response, HttpServletResponse.SC_OK,
                    "Estado actualizado correctamente");

        } catch (SQLException e) {
            responderErrorSQL(response, e);
        }
    }
}