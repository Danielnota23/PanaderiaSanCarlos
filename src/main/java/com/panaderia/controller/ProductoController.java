package com.panaderia.controller;

import com.google.gson.Gson;
import com.panaderia.manager.ProductoManager;
import com.panaderia.modelo.Producto;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@WebServlet("/api/productos")
public class ProductoController extends HttpServlet {

    private ProductoManager productoManager;
    private Gson gson;

    @Override
    public void init() throws ServletException {
        productoManager = new ProductoManager();
        gson = new Gson();
    }

    @Override
    protected void doGet(
            HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        List<Producto> productos =
                productoManager.listarProductos();

        String json = gson.toJson(productos);

        PrintWriter out = response.getWriter();
        out.print(json);
        out.flush();
    }
    @Override
protected void doPost(
        HttpServletRequest request,
        HttpServletResponse response)
        throws ServletException, IOException {

    request.setCharacterEncoding("UTF-8");
    response.setContentType("application/json");
    response.setCharacterEncoding("UTF-8");

    Producto producto = gson.fromJson(
            request.getReader(),
            Producto.class
    );

    if (producto == null
            || producto.getNombre() == null
            || producto.getNombre().trim().isEmpty()) {

        response.setStatus(HttpServletResponse.SC_BAD_REQUEST);

        response.getWriter().print(
                "{\"mensaje\":\"El nombre del producto es obligatorio\"}"
        );

        return;
    }

    Producto creado = productoManager.crearProducto(producto);

    if (creado != null) {

        response.setStatus(HttpServletResponse.SC_CREATED);
        response.getWriter().print(gson.toJson(creado));

    } else {

        response.setStatus(
                HttpServletResponse.SC_INTERNAL_SERVER_ERROR
        );

        response.getWriter().print(
                "{\"mensaje\":\"No se pudo crear el producto\"}"
        );
    }
}
@Override
protected void doPut(
        HttpServletRequest request,
        HttpServletResponse response)
        throws ServletException, IOException {

    request.setCharacterEncoding("UTF-8");
    response.setContentType("application/json");
    response.setCharacterEncoding("UTF-8");

    Producto producto = gson.fromJson(
            request.getReader(),
            Producto.class
    );

    if (producto == null
            || producto.getIdProducto() <= 0
            || producto.getNombre() == null
            || producto.getNombre().trim().isEmpty()) {

        response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
        response.getWriter().print(
                "{\"mensaje\":\"Datos del producto incompletos\"}"
        );
        return;
    }

    boolean actualizado =
            productoManager.actualizarProducto(producto);

    if (actualizado) {

        response.setStatus(HttpServletResponse.SC_OK);
        response.getWriter().print(
                "{\"mensaje\":\"Producto actualizado correctamente\"}"
        );

    } else {

        response.setStatus(HttpServletResponse.SC_NOT_FOUND);
        response.getWriter().print(
                "{\"mensaje\":\"Producto no encontrado\"}"
        );
    }
}
@Override
protected void doDelete(
        HttpServletRequest request,
        HttpServletResponse response)
        throws ServletException, IOException {

    response.setContentType("application/json");
    response.setCharacterEncoding("UTF-8");

    String idParametro = request.getParameter("id");

    if (idParametro == null) {
        response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
        response.getWriter().print(
                "{\"mensaje\":\"Debe indicar el id del producto\"}"
        );
        return;
    }

    try {

        int idProducto = Integer.parseInt(idParametro);

        boolean eliminado =
                productoManager.eliminarProducto(idProducto);

        if (eliminado) {

            response.setStatus(HttpServletResponse.SC_OK);
            response.getWriter().print(
                    "{\"mensaje\":\"Producto eliminado correctamente\"}"
            );

        } else {

            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            response.getWriter().print(
                    "{\"mensaje\":\"Producto no encontrado\"}"
            );
        }

    } catch (NumberFormatException e) {

        response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
        response.getWriter().print(
                "{\"mensaje\":\"El id debe ser numerico\"}"
        );
    }
}
}   