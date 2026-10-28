package com.panaderia.prueba;

import com.panaderia.config.Conexion;
import java.sql.Connection;
import java.sql.SQLException;

public class PruebaConexion {

    public static void main(String[] args) {

        try {

            Connection conexion = Conexion.getConexion();

            if (conexion != null) {
                System.out.println("CONEXION EXITOSA A PANADERIA SAN CARLOS");
                conexion.close();
            }

        } catch (SQLException e) {

            System.out.println("ERROR DE CONEXION:");
            System.out.println(e.getMessage());

        }
    }
}