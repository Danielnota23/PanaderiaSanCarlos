/*
 * Universidad Mariano Gálvez de Guatemala
 * Ingeniería en Sistemas de Información y Ciencias de la Computación
 * Curso: Desarrollo Web - Proyecto Final
 * Sistema de Control de Producción - Panadería San Carlos
 */
package com.panaderia.manager;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.panaderia.config.Conexion;
import com.panaderia.modelo.DetalleReceta;
import com.panaderia.modelo.Receta;
import com.panaderia.modelo.RequerimientoInsumo;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Acceso a datos de recetas.
 * Las operaciones que modifican datos se delegan al paquete
 * pkg_recetas de la base de datos (procedimientos almacenados).
 */
public class RecetaManager {

    private static final String SQL_LISTAR =
            "SELECT r.id_receta, r.id_producto, p.nombre AS nombre_producto, "
          + "r.nombre, r.rendimiento, r.estado, "
          + "dr.id_detalle_receta, dr.id_ingrediente, "
          + "i.nombre AS nombre_ingrediente, i.unidad_medida, dr.cantidad "
          + "FROM panaderia.recetas r "
          + "INNER JOIN panaderia.productos p ON p.id_producto = r.id_producto "
          + "LEFT JOIN panaderia.detalle_receta dr ON dr.id_receta = r.id_receta "
          + "LEFT JOIN panaderia.ingredientes i ON i.id_ingrediente = dr.id_ingrediente "
          + "WHERE r.estado = TRUE AND p.estado = TRUE ";

    /** Lista todas las recetas activas con sus ingredientes. */
    public List<Receta> listarRecetas() throws SQLException {
        return consultar(SQL_LISTAR + "ORDER BY p.id_producto, i.nombre", null);
    }

    /** Devuelve la receta activa de un producto, o null si no tiene. */
    public Receta obtenerPorProducto(int idProducto) throws SQLException {

        List<Receta> recetas = consultar(
                SQL_LISTAR + "AND r.id_producto = ? ORDER BY i.nombre",
                idProducto);

        return recetas.isEmpty() ? null : recetas.get(0);
    }

    /**
     * Crea o actualiza la receta de un producto.
     * Llama a pkg_recetas.sp_guardar_receta, que hace COMMIT o ROLLBACK.
     * @return id de la receta guardada
     */
    public int guardarReceta(Receta receta) throws SQLException {

        JsonArray ingredientes = new JsonArray();

        for (DetalleReceta detalle : receta.getIngredientes()) {
            JsonObject item = new JsonObject();
            item.addProperty("idIngrediente", detalle.getIdIngrediente());
            item.addProperty("cantidad", detalle.getCantidad());
            ingredientes.add(item);
        }

        String sql =
                "CALL pkg_recetas.sp_guardar_receta(?, ?, ?, CAST(? AS JSONB), NULL)";

        try (
            Connection conexion = Conexion.getConexion();
            PreparedStatement ps = conexion.prepareStatement(sql)
        ) {
            ps.setInt(1, receta.getIdProducto());
            ps.setString(2, receta.getNombre());
            ps.setInt(3, receta.getRendimiento());
            ps.setString(4, ingredientes.toString());

            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? rs.getInt("p_id_receta") : 0;
            }
        }
    }

    /** Desactiva una receta (no se borra para conservar el historial). */
    public void desactivarReceta(int idReceta) throws SQLException {

        try (
            Connection conexion = Conexion.getConexion();
            PreparedStatement ps = conexion.prepareStatement(
                    "CALL pkg_recetas.sp_desactivar_receta(?)")
        ) {
            ps.setInt(1, idReceta);
            ps.execute();
        }
    }

    /** Ingredientes necesarios para producir una cantidad de un pan. */
    public List<RequerimientoInsumo> calcularRequerimiento(
            int idProducto, int cantidad) throws SQLException {

        List<RequerimientoInsumo> lista = new ArrayList<>();

        String sql =
                "SELECT * FROM pkg_recetas.fn_requerimiento_insumos(?, ?)";

        try (
            Connection conexion = Conexion.getConexion();
            PreparedStatement ps = conexion.prepareStatement(sql)
        ) {
            ps.setInt(1, idProducto);
            ps.setInt(2, cantidad);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    RequerimientoInsumo r = new RequerimientoInsumo();
                    r.setIdIngrediente(rs.getInt("id_ingrediente"));
                    r.setNombreIngrediente(rs.getString("nombre_ingrediente"));
                    r.setUnidadMedida(rs.getString("unidad_medida"));
                    r.setCantidadNecesaria(rs.getDouble("cantidad_necesaria"));
                    r.setExistenciaActual(rs.getDouble("existencia_actual"));
                    r.setSuficiente(rs.getBoolean("suficiente"));
                    r.setFaltante(Math.max(0,
                            r.getCantidadNecesaria() - r.getExistenciaActual()));
                    lista.add(r);
                }
            }
        }

        return lista;
    }

    /** Ejecuta la consulta y agrupa las filas por receta. */
    private List<Receta> consultar(String sql, Integer idProducto)
            throws SQLException {

        Map<Integer, Receta> recetas = new LinkedHashMap<>();

        try (
            Connection conexion = Conexion.getConexion();
            PreparedStatement ps = conexion.prepareStatement(sql)
        ) {
            if (idProducto != null) {
                ps.setInt(1, idProducto);
            }

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {

                    int idReceta = rs.getInt("id_receta");
                    Receta receta = recetas.get(idReceta);

                    if (receta == null) {
                        receta = new Receta();
                        receta.setIdReceta(idReceta);
                        receta.setIdProducto(rs.getInt("id_producto"));
                        receta.setNombreProducto(rs.getString("nombre_producto"));
                        receta.setNombre(rs.getString("nombre"));
                        receta.setRendimiento(rs.getInt("rendimiento"));
                        receta.setEstado(rs.getBoolean("estado"));
                        recetas.put(idReceta, receta);
                    }

                    int idIngrediente = rs.getInt("id_ingrediente");

                    if (!rs.wasNull()) {
                        DetalleReceta detalle = new DetalleReceta();
                        detalle.setIdDetalleReceta(rs.getInt("id_detalle_receta"));
                        detalle.setIdIngrediente(idIngrediente);
                        detalle.setNombreIngrediente(rs.getString("nombre_ingrediente"));
                        detalle.setUnidadMedida(rs.getString("unidad_medida"));
                        detalle.setCantidad(rs.getDouble("cantidad"));
                        receta.getIngredientes().add(detalle);
                    }
                }
            }
        }

        return new ArrayList<>(recetas.values());
    }
}
