package com.panaderia.controller;

import com.google.gson.Gson;
import com.panaderia.manager.UsuarioManager;
import com.panaderia.modelo.Usuario;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;

@WebServlet("/api/usuarios")
public class UsuarioController extends HttpServlet {

    private final UsuarioManager usuarioManager =
            new UsuarioManager();

    private final Gson gson =
            new Gson();

    @Override
    protected void doGet(
            HttpServletRequest request,
            HttpServletResponse response
    ) throws ServletException, IOException {

        response.setContentType(
                "application/json"
        );

        response.setCharacterEncoding(
                "UTF-8"
        );

        try {

            List<Usuario> usuarios =
                    usuarioManager.listarUsuarios();

            response.setStatus(
                    HttpServletResponse.SC_OK
            );

            response.getWriter().print(
                    gson.toJson(usuarios)
            );

        } catch (Exception e) {

            e.printStackTrace();

            response.setStatus(
                    HttpServletResponse
                            .SC_INTERNAL_SERVER_ERROR
            );

            response.getWriter().print(
                    "{\"mensaje\":\"Error al obtener usuarios\"}"
            );
        }
    }
}