package com.panaderia.controller;

import com.google.gson.Gson;
import com.panaderia.manager.IngredienteManager;
import com.panaderia.modelo.Ingrediente;

import java.io.IOException;
import java.util.List;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@WebServlet("/api/ingredientes")
public class IngredienteController extends HttpServlet {

    private IngredienteManager ingredienteManager;
    private Gson gson;

    @Override
    public void init() throws ServletException {
        ingredienteManager = new IngredienteManager();
        gson = new Gson();
    }

    @Override
    protected void doGet(
            HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        List<Ingrediente> ingredientes =
                ingredienteManager.listarIngredientes();

        response.getWriter().print(
                gson.toJson(ingredientes)
        );
    }
}
