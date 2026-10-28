package com.panaderia.manager;

import com.panaderia.config.Conexion;
import com.panaderia.modelo.Sucursal;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import java.util.ArrayList;
import java.util.List;

public class SucursalManager {

    public List<Sucursal> listarSucursales() {

        List<Sucursal> sucursales = new ArrayList<>();

        String sql = "SELECT id_sucursal, nombre, direccion, estado "
                   + "FROM panaderia.sucursales "
                   + "WHERE estado = TRUE "
                   + "ORDER BY id_sucursal";

        try (
            Connection conexion = Conexion.getConexion();
            PreparedStatement ps = conexion.prepareStatement(sql);
            ResultSet rs = ps.executeQuery();
        ) {

            while (rs.next()) {

                Sucursal sucursal = new Sucursal();

                sucursal.setIdSucursal(
                        rs.getInt("id_sucursal")
                );

                sucursal.setNombre(
                        rs.getString("nombre")
                );

                sucursal.setDireccion(
                        rs.getString("direccion")
                );

                sucursal.setEstado(
                        rs.getBoolean("estado")
                );

                sucursales.add(sucursal);
            }

        } catch (SQLException e) {

            System.out.println("ERROR AL LISTAR SUCURSALES:");
            e.printStackTrace();
        }

        return sucursales;
    }
}