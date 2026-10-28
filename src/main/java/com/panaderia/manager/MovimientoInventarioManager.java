package com.panaderia.manager;

import com.panaderia.config.Conexion;
import com.panaderia.modelo.MovimientoInventario;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import java.util.ArrayList;
import java.util.List;

public class MovimientoInventarioManager {

    public List<MovimientoInventario> listarMovimientos() {

        List<MovimientoInventario> movimientos = new ArrayList<>();

        String sql =
                "SELECT mi.id_movimiento, mi.id_ingrediente, "
              + "i.nombre AS nombre_ingrediente, "
              + "mi.tipo_movimiento, mi.cantidad, "
              + "mi.fecha, mi.descripcion "
              + "FROM panaderia.movimientos_inventario mi "
              + "INNER JOIN panaderia.ingredientes i "
              + "ON mi.id_ingrediente = i.id_ingrediente "
              + "ORDER BY mi.id_movimiento";

        try (
            Connection conexion = Conexion.getConexion();
            PreparedStatement ps = conexion.prepareStatement(sql);
            ResultSet rs = ps.executeQuery();
        ) {

            while (rs.next()) {

                MovimientoInventario movimiento =
                        new MovimientoInventario();

                movimiento.setIdMovimiento(
                        rs.getInt("id_movimiento")
                );

                movimiento.setIdIngrediente(
                        rs.getInt("id_ingrediente")
                );

                movimiento.setNombreIngrediente(
                        rs.getString("nombre_ingrediente")
                );

                movimiento.setTipoMovimiento(
                        rs.getString("tipo_movimiento")
                );

                movimiento.setCantidad(
                        rs.getDouble("cantidad")
                );

                movimiento.setFecha(
                        rs.getTimestamp("fecha").toString()
                );

                movimiento.setDescripcion(
                        rs.getString("descripcion")
                );

                movimientos.add(movimiento);
            }

        } catch (SQLException e) {

            System.out.println(
                    "ERROR AL LISTAR MOVIMIENTOS DE INVENTARIO:"
            );

            e.printStackTrace();
        }

        return movimientos;
    }
    
    public boolean registrarEntrada(
        int idIngrediente,
        double cantidad,
        String descripcion) {

    Connection conexion = null;

    String sqlActualizar =
            "UPDATE panaderia.ingredientes "
          + "SET existencia_actual = existencia_actual + ? "
          + "WHERE id_ingrediente = ?";

    String sqlMovimiento =
            "INSERT INTO panaderia.movimientos_inventario "
          + "(id_ingrediente, tipo_movimiento, cantidad, fecha, descripcion) "
          + "VALUES (?, 'ENTRADA', ?, CURRENT_TIMESTAMP, ?)";

    try {

        conexion = Conexion.getConexion();
        conexion.setAutoCommit(false);

        try (
            PreparedStatement psActualizar =
                    conexion.prepareStatement(sqlActualizar);
            PreparedStatement psMovimiento =
                    conexion.prepareStatement(sqlMovimiento)
        ) {

            psActualizar.setDouble(1, cantidad);
            psActualizar.setInt(2, idIngrediente);

            int filas = psActualizar.executeUpdate();

            if (filas == 0) {
                throw new SQLException(
                        "Ingrediente no encontrado"
                );
            }

            psMovimiento.setInt(1, idIngrediente);
            psMovimiento.setDouble(2, cantidad);
            psMovimiento.setString(3, descripcion);

            psMovimiento.executeUpdate();

            conexion.commit();

            return true;
        }

    } catch (SQLException e) {

        System.out.println(
                "ERROR AL REGISTRAR ENTRADA:"
        );

        e.printStackTrace();

        if (conexion != null) {
            try {
                conexion.rollback();
            } catch (SQLException ex) {
                ex.printStackTrace();
            }
        }

    } finally {

        if (conexion != null) {
            try {
                conexion.setAutoCommit(true);
                conexion.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
    }

    return false;
}   
    
 public void registrarSalida(
        int idIngrediente,
        double cantidad,
        String descripcion) throws SQLException {

    String nombreIngrediente = null;

    String sqlBuscar =
            "SELECT nombre "
          + "FROM panaderia.ingredientes "
          + "WHERE id_ingrediente = ?";

    try (
        Connection conexion = Conexion.getConexion();
        PreparedStatement ps =
                conexion.prepareStatement(sqlBuscar)
    ) {

        ps.setInt(1, idIngrediente);

        try (ResultSet rs = ps.executeQuery()) {

            if (rs.next()) {
                nombreIngrediente = rs.getString("nombre");
            } else {
                throw new SQLException(
                        "Ingrediente no encontrado"
                );
            }
        }

        String sqlSalida =
        "CALL panaderia.sp_registrar_salida_inventario("
      + "?, CAST(? AS NUMERIC), ?)";
        try (
            PreparedStatement psSalida =
                    conexion.prepareStatement(sqlSalida)
        ) {

            psSalida.setString(1, nombreIngrediente);
            psSalida.setDouble(2, cantidad);
            psSalida.setString(3, descripcion);

            psSalida.execute();
        }
    }
}   
}
