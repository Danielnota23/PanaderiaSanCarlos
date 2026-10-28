package com.panaderia.manager;

import com.panaderia.config.Conexion;
import com.panaderia.modelo.Produccion;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import java.util.ArrayList;
import java.util.List;

public class ProduccionManager {

    public List<Produccion> listarProduccion() {

        List<Produccion> lista = new ArrayList<>();

        String sql =
                "SELECT prod.id_produccion, prod.id_producto, "
              + "p.nombre AS nombre_producto, "
              + "prod.fecha, prod.cantidad_requerida, "
              + "prod.cantidad_producida, prod.estado "
              + "FROM panaderia.produccion prod "
              + "INNER JOIN panaderia.productos p "
              + "ON prod.id_producto = p.id_producto "
              + "ORDER BY prod.id_produccion";

        try (
            Connection conexion = Conexion.getConexion();
            PreparedStatement ps = conexion.prepareStatement(sql);
            ResultSet rs = ps.executeQuery();
        ) {

            while (rs.next()) {

                Produccion produccion = new Produccion();

                produccion.setIdProduccion(
                        rs.getInt("id_produccion")
                );

                produccion.setIdProducto(
                        rs.getInt("id_producto")
                );

                produccion.setNombreProducto(
                        rs.getString("nombre_producto")
                );

                produccion.setFecha(
                        rs.getDate("fecha").toString()
                );

                produccion.setCantidadRequerida(
                        rs.getInt("cantidad_requerida")
                );

                produccion.setCantidadProducida(
                        rs.getInt("cantidad_producida")
                );

                produccion.setEstado(
                        rs.getString("estado")
                );

                lista.add(produccion);
            }

        } catch (SQLException e) {

            System.out.println(
                    "ERROR AL LISTAR PRODUCCION:"
            );

            e.printStackTrace();
        }

        return lista;
    }
    
        /**
     * Registra el avance de una producción.
     * El procedimiento pkg_produccion.sp_registrar_avance descuenta los
     * ingredientes según la receta y hace COMMIT, o ROLLBACK si algún
     * ingrediente no alcanza. Los errores llegan como SQLException.
     */
    public void actualizarProduccion(
            int idProduccion,
            int cantidadProducida,
            String estado) throws SQLException {

        String sql =
                "CALL pkg_produccion.sp_registrar_avance(?, ?, ?)";

        try (
            Connection conexion = Conexion.getConexion();
            PreparedStatement ps = conexion.prepareStatement(sql)
        ) {
            ps.setInt(1, idProduccion);
            ps.setInt(2, cantidadProducida);
            ps.setString(3, estado);
            ps.execute();
        }
    }

    /**
     * Genera la producción de una fecha sumando los pedidos pendientes
     * de todas las sucursales (pkg_produccion.sp_generar_produccion).
     * @return cantidad de tipos de pan generados o actualizados
     */
    public int generarProduccion(java.sql.Date fecha) throws SQLException {

        String sql =
                "CALL pkg_produccion.sp_generar_produccion(?, NULL)";

        try (
            Connection conexion = Conexion.getConexion();
            PreparedStatement ps = conexion.prepareStatement(sql)
        ) {
            ps.setDate(1, fecha);

            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? rs.getInt("p_registros") : 0;
            }
        }
    }
}