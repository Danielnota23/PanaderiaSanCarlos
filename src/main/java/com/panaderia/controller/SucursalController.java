package com.panaderia.controller;

import com.google.gson.Gson;
import com.panaderia.manager.SucursalManager;
import com.panaderia.modelo.Sucursal;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@WebServlet("/api/sucursales")
public class SucursalController extends HttpServlet {

    private SucursalManager sucursalManager;
    private Gson gson;

    @Override
    public void init() throws ServletException {
        sucursalManager = new SucursalManager();
        gson = new Gson();
    }

    @Override
    protected void doGet(
            HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        List<Sucursal> sucursales =
                sucursalManager.listarSucursales();

        String json = gson.toJson(sucursales);

        PrintWriter out = response.getWriter();
        out.print(json);
        out.flush();
    }
}