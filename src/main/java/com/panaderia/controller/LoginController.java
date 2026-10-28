package com.panaderia.controller;

import com.google.gson.Gson;
import com.panaderia.manager.UsuarioManager;
import com.panaderia.modelo.Usuario;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@WebServlet("/api/login")
public class LoginController extends HttpServlet {

    private UsuarioManager usuarioManager;
    private Gson gson;

    @Override
    public void init() throws ServletException {
        usuarioManager = new UsuarioManager();
        gson = new Gson();
    }

    @Override
    protected void doPost(
            HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {

        request.setCharacterEncoding("UTF-8");
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        Usuario datos = gson.fromJson(
                request.getReader(),
                Usuario.class
        );

        if (datos == null
                || datos.getCorreo() == null
                || datos.getContrasena() == null
                || datos.getCorreo().trim().isEmpty()
                || datos.getContrasena().trim().isEmpty()) {

            response.setStatus(
                    HttpServletResponse.SC_BAD_REQUEST
            );

            response.getWriter().print(
                    "{\"mensaje\":\"Correo y contrasena son obligatorios\"}"
            );

            return;
        }

        Usuario usuario =
                usuarioManager.iniciarSesion(
                        datos.getCorreo(),
                        datos.getContrasena()
                );

        if (usuario != null) {

            response.setStatus(
                    HttpServletResponse.SC_OK
            );

            response.getWriter().print(
                    gson.toJson(usuario)
            );

        } else {

            response.setStatus(
                    HttpServletResponse.SC_UNAUTHORIZED
            );

            response.getWriter().print(
                    "{\"mensaje\":\"Correo o contrasena incorrectos\"}"
            );
        }
    }
}