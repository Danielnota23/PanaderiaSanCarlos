package com.panaderia.manager;

import com.panaderia.config.Conexion;
import com.panaderia.modelo.DetallePedido;
import com.panaderia.modelo.Pedido;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class PedidoManager {

    public Pedido crearPedido(Pedido pedido) {

        Connection conexion = null;

        String sqlPedido =
                "INSERT INTO panaderia.pedidos "
              + "(id_sucursal, fecha_pedido, turno, estado, observacion) "
              + "VALUES (?, CURRENT_DATE, ?, 'PENDIENTE', ?) "
              + "RETURNING id_pedido";

        String sqlDetalle =
                "INSERT INTO panaderia.detalle_pedido "
              + "(id_pedido, id_producto, cantidad) "
              + "VALUES (?, ?, ?)";

        try {

            conexion = Conexion.getConexion();

            // Iniciar transacción
            conexion.setAutoCommit(false);

            try (
                PreparedStatement psPedido =
                        conexion.prepareStatement(sqlPedido)
            ) {

                psPedido.setInt(
                        1,
                        pedido.getIdSucursal()
                );

                psPedido.setString(
                        2,
                        pedido.getTurno()
                );

                psPedido.setString(
                        3,
                        pedido.getObservacion()
                );

                ResultSet rs =
                        psPedido.executeQuery();

                if (!rs.next()) {
                    throw new SQLException(
                            "No se pudo crear el pedido"
                    );
                }

                int idPedido =
                        rs.getInt("id_pedido");

                pedido.setIdPedido(idPedido);
                pedido.setEstado("PENDIENTE");

                if (pedido.getDetalles() == null
                        || pedido.getDetalles().isEmpty()) {

                    throw new SQLException(
                            "El pedido debe tener al menos un detalle"
                    );
                }

                try (
                    PreparedStatement psDetalle =
                            conexion.prepareStatement(sqlDetalle)
                ) {

                    for (DetallePedido detalle
                            : pedido.getDetalles()) {

                        if (detalle.getCantidad() <= 0) {
                            throw new SQLException(
                                    "La cantidad debe ser mayor que cero"
                            );
                        }

                        psDetalle.setInt(
                                1,
                                idPedido
                        );

                        psDetalle.setInt(
                                2,
                                detalle.getIdProducto()
                        );

                        psDetalle.setInt(
                                3,
                                detalle.getCantidad()
                        );

                        psDetalle.executeUpdate();

                        detalle.setIdPedido(
                                idPedido
                        );
                    }
                }

                // Confirmar transacción
                conexion.commit();

                return pedido;
            }

        } catch (SQLException e) {

            System.out.println(
                    "ERROR AL CREAR PEDIDO:"
            );

            e.printStackTrace();

            if (conexion != null) {
                try {
                    // Deshacer todo si algo falla
                    conexion.rollback();

                    System.out.println(
                            "ROLLBACK REALIZADO"
                    );

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

        return null;
    }
    public java.util.List<Pedido> listarPedidos() {

    java.util.List<Pedido> pedidos =
            new java.util.ArrayList<>();

    String sqlPedido =
        "SELECT pe.id_pedido, pe.id_sucursal, s.nombre AS nombre_sucursal, "
      + "pe.fecha_pedido, pe.turno, pe.estado, pe.observacion "
      + "FROM panaderia.pedidos pe "
      + "INNER JOIN panaderia.sucursales s "
      + "ON pe.id_sucursal = s.id_sucursal "
      + "ORDER BY pe.id_pedido";

    String sqlDetalle =
        "SELECT dp.id_detalle_pedido, dp.id_pedido, "
      + "dp.id_producto, p.nombre AS nombre_producto, dp.cantidad "
      + "FROM panaderia.detalle_pedido dp "
      + "INNER JOIN panaderia.productos p "
      + "ON dp.id_producto = p.id_producto "
      + "WHERE dp.id_pedido = ? "
      + "ORDER BY dp.id_detalle_pedido";
    try (
        Connection conexion = Conexion.getConexion();
        PreparedStatement psPedido =
                conexion.prepareStatement(sqlPedido);
        ResultSet rsPedido =
                psPedido.executeQuery();
    ) {

        while (rsPedido.next()) {

            Pedido pedido = new Pedido();

            pedido.setIdPedido(
                    rsPedido.getInt("id_pedido")
            );

            pedido.setIdSucursal(
                    rsPedido.getInt("id_sucursal")
            );
            
            pedido.setNombreSucursal(
        rsPedido.getString("nombre_sucursal")
);

            pedido.setFechaPedido(
                    rsPedido.getDate("fecha_pedido").toString()
            );

            pedido.setTurno(
                    rsPedido.getString("turno")
            );

            pedido.setEstado(
                    rsPedido.getString("estado")
            );

            pedido.setObservacion(
                    rsPedido.getString("observacion")
            );

            java.util.List<DetallePedido> detalles =
                    new java.util.ArrayList<>();

            try (
                PreparedStatement psDetalle =
                        conexion.prepareStatement(sqlDetalle)
            ) {

                psDetalle.setInt(
                        1,
                        pedido.getIdPedido()
                );

                try (
                    ResultSet rsDetalle =
                            psDetalle.executeQuery()
                ) {

                    while (rsDetalle.next()) {

                        DetallePedido detalle =
                                new DetallePedido();

                        detalle.setIdDetallePedido(
                                rsDetalle.getInt(
                                        "id_detalle_pedido"
                                )
                        );

                        detalle.setIdPedido(
                                rsDetalle.getInt(
                                        "id_pedido"
                                )
                        );

                        detalle.setIdProducto(
                                rsDetalle.getInt(
                                        "id_producto"
                                )
                        );
                        
                        detalle.setNombreProducto(
        rsDetalle.getString("nombre_producto")
);

                        detalle.setCantidad(
                                rsDetalle.getInt(
                                        "cantidad"
                                )
                        );

                        detalles.add(detalle);
                    }
                }
            }

            pedido.setDetalles(detalles);

            pedidos.add(pedido);
        }

    } catch (SQLException e) {

        System.out.println(
                "ERROR AL LISTAR PEDIDOS:"
        );

        e.printStackTrace();
    }

    return pedidos;
      
}
    
       /**
     * Cambia el estado de un pedido usando pkg_pedidos.sp_cambiar_estado,
     * que valida el flujo (un pedido despachado o cancelado ya no cambia).
     */
    public void actualizarEstadoPedido(
            int idPedido,
            String estado) throws SQLException {

        String sql = "CALL pkg_pedidos.sp_cambiar_estado(?, ?)";

        try (
            Connection conexion = Conexion.getConexion();
            PreparedStatement ps = conexion.prepareStatement(sql)
        ) {
            ps.setInt(1, idPedido);
            ps.setString(2, estado);
            ps.execute();
        }
    }
}