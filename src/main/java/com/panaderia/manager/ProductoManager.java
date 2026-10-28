package com.panaderia.manager;

import com.panaderia.config.Conexion;
import com.panaderia.modelo.Producto;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import java.util.ArrayList;
import java.util.List;

public class ProductoManager {

    public List<Producto> listarProductos() {

        List<Producto> productos = new ArrayList<>();

       String sql = "SELECT id_producto, nombre, descripcion, estado "
           + "FROM panaderia.productos "
           + "WHERE estado = TRUE "
           + "ORDER BY id_producto";
        try (
            Connection conexion = Conexion.getConexion();
            PreparedStatement ps = conexion.prepareStatement(sql);
            ResultSet rs = ps.executeQuery();
        ) {

            while (rs.next()) {

                Producto producto = new Producto();

                producto.setIdProducto(rs.getInt("id_producto"));
                producto.setNombre(rs.getString("nombre"));
                producto.setDescripcion(rs.getString("descripcion"));
                producto.setEstado(rs.getBoolean("estado"));

                productos.add(producto);
            }

        } catch (SQLException e) {

            System.out.println("ERROR AL LISTAR PRODUCTOS:");
            System.out.println(e.getMessage());
        }

        return productos;
    }
    public Producto crearProducto(Producto producto) {

    String sql = "INSERT INTO panaderia.productos "
               + "(nombre, descripcion, estado) "
               + "VALUES (?, ?, TRUE) "
               + "RETURNING id_producto";

    try (
        Connection conexion = Conexion.getConexion();
        PreparedStatement ps = conexion.prepareStatement(sql);
    ) {

        ps.setString(1, producto.getNombre());
        ps.setString(2, producto.getDescripcion());

        ResultSet rs = ps.executeQuery();

        if (rs.next()) {
            producto.setIdProducto(rs.getInt("id_producto"));
            producto.setEstado(true);
            return producto;
        }

    } catch (SQLException e) {
        System.out.println("ERROR AL CREAR PRODUCTO:");
        e.printStackTrace();
    }

    return null;
}
    public boolean actualizarProducto(Producto producto) {

    String sql = "UPDATE panaderia.productos "
               + "SET nombre = ?, descripcion = ?, estado = ? "
               + "WHERE id_producto = ?";

    try (
        Connection conexion = Conexion.getConexion();
        PreparedStatement ps = conexion.prepareStatement(sql);
    ) {

        ps.setString(1, producto.getNombre());
        ps.setString(2, producto.getDescripcion());
        ps.setBoolean(3, producto.isEstado());
        ps.setInt(4, producto.getIdProducto());

        int filas = ps.executeUpdate();

        return filas > 0;

    } catch (SQLException e) {
        System.out.println("ERROR AL ACTUALIZAR PRODUCTO:");
        e.printStackTrace();
    }

    return false;
}
    public boolean eliminarProducto(int idProducto) {

    String sql = "UPDATE panaderia.productos "
               + "SET estado = FALSE "
               + "WHERE id_producto = ?";

    try (
        Connection conexion = Conexion.getConexion();
        PreparedStatement ps = conexion.prepareStatement(sql);
    ) {

        ps.setInt(1, idProducto);

        int filas = ps.executeUpdate();

        return filas > 0;

    } catch (SQLException e) {
        System.out.println("ERROR AL ELIMINAR PRODUCTO:");
        e.printStackTrace();
    }

    return false;
}
}