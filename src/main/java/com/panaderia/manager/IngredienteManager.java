package com.panaderia.manager;

import com.panaderia.config.Conexion;
import com.panaderia.modelo.Ingrediente;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import java.util.ArrayList;
import java.util.List;

public class IngredienteManager {

    public List<Ingrediente> listarIngredientes() {

        List<Ingrediente> ingredientes = new ArrayList<>();

        String sql =
                "SELECT id_ingrediente, nombre, unidad_medida, "
              + "existencia_actual, existencia_minima, estado "
              + "FROM panaderia.ingredientes "
              + "WHERE estado = TRUE "
              + "ORDER BY id_ingrediente";

        try (
            Connection conexion = Conexion.getConexion();
            PreparedStatement ps = conexion.prepareStatement(sql);
            ResultSet rs = ps.executeQuery();
        ) {

            while (rs.next()) {

                Ingrediente ingrediente = new Ingrediente();

                ingrediente.setIdIngrediente(
                        rs.getInt("id_ingrediente")
                );

                ingrediente.setNombre(
                        rs.getString("nombre")
                );

                ingrediente.setUnidadMedida(
                        rs.getString("unidad_medida")
                );

                ingrediente.setExistenciaActual(
                        rs.getDouble("existencia_actual")
                );

                ingrediente.setExistenciaMinima(
                        rs.getDouble("existencia_minima")
                );
                
                double existenciaActual =
        rs.getDouble("existencia_actual");

double existenciaMinima =
        rs.getDouble("existencia_minima");

ingrediente.setExistenciaActual(existenciaActual);
ingrediente.setExistenciaMinima(existenciaMinima);

if (existenciaActual <= existenciaMinima) {
    ingrediente.setNivelStock("BAJO_STOCK");
} else {
    ingrediente.setNivelStock("NORMAL");
}

                ingrediente.setEstado(
                        rs.getBoolean("estado")
                );

                ingredientes.add(ingrediente);
            }

        } catch (SQLException e) {

            System.out.println(
                    "ERROR AL LISTAR INGREDIENTES:"
            );

            e.printStackTrace();
        }

        return ingredientes;
    }
}
