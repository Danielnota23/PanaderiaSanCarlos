/*
 * Universidad Mariano Gálvez de Guatemala
 * Ingeniería en Sistemas de Información y Ciencias de la Computación
 * Curso: Desarrollo Web - Proyecto Final
 * Sistema de Control de Producción - Panadería San Carlos
 */
package com.panaderia.manager;

import com.panaderia.config.Conexion;
import com.panaderia.modelo.ConsolidadoPedido;
import com.panaderia.modelo.RequerimientoInsumo;

import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;

import java.util.ArrayList;
import java.util.List;

/**
 * Reportes para planificar la producción del día.
 * Usa las funciones de los paquetes pkg_pedidos y pkg_produccion.
 */
public class ReporteManager {

    /**
     * Consolidado de pedidos de todas las sucursales por fecha y turno.
     * @param turno MANANA, TARDE o null para ambos turnos
     */
    public List<ConsolidadoPedido> consolidadoPedidos(Date fecha, String turno)
            throws SQLException {

        List<ConsolidadoPedido> lista = new ArrayList<>();

        String sql = "SELECT * FROM pkg_pedidos.fn_consolidado(?, ?)";

        try (
            Connection conexion = Conexion.getConexion();
            PreparedStatement ps = conexion.prepareStatement(sql)
        ) {
            ps.setDate(1, fecha);

            if (turno == null) {
                ps.setNull(2, Types.VARCHAR);
            } else {
                ps.setString(2, turno);
            }

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    ConsolidadoPedido c = new ConsolidadoPedido();
                    c.setIdSucursal(rs.getInt("id_sucursal"));
                    c.setNombreSucursal(rs.getString("nombre_sucursal"));
                    c.setIdProducto(rs.getInt("id_producto"));
                    c.setNombreProducto(rs.getString("nombre_producto"));
                    c.setCantidad(rs.getInt("cantidad"));
                    lista.add(c);
                }
            }
        }

        return lista;
    }

    /**
     * Ingredientes que faltan para terminar la producción
     * pendiente de una fecha.
     */
    public List<RequerimientoInsumo> requerimientoPorFecha(Date fecha)
            throws SQLException {

        List<RequerimientoInsumo> lista = new ArrayList<>();

        String sql = "SELECT * FROM pkg_produccion.fn_requerimiento_fecha(?)";

        try (
            Connection conexion = Conexion.getConexion();
            PreparedStatement ps = conexion.prepareStatement(sql)
        ) {
            ps.setDate(1, fecha);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    RequerimientoInsumo r = new RequerimientoInsumo();
                    r.setIdIngrediente(rs.getInt("id_ingrediente"));
                    r.setNombreIngrediente(rs.getString("nombre_ingrediente"));
                    r.setUnidadMedida(rs.getString("unidad_medida"));
                    r.setCantidadNecesaria(rs.getDouble("cantidad_necesaria"));
                    r.setExistenciaActual(rs.getDouble("existencia_actual"));
                    r.setFaltante(rs.getDouble("faltante"));
                    r.setSuficiente(r.getFaltante() <= 0);
                    lista.add(r);
                }
            }
        }

        return lista;
    }
}
