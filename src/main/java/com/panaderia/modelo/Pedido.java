package com.panaderia.modelo;

import java.util.List;

public class Pedido {

    private int idPedido;
    private int idSucursal;
    private String nombreSucursal;
    private String fechaPedido;
    private String turno;
    private String estado;
    private String observacion;
    private List<DetallePedido> detalles;

    public Pedido() {
    }

    public Pedido(
            int idPedido,
            int idSucursal,
            String fechaPedido,
            String turno,
            String estado,
            String observacion,
            List<DetallePedido> detalles) {

        this.idPedido = idPedido;
        this.idSucursal = idSucursal;
        this.fechaPedido = fechaPedido;
        this.turno = turno;
        this.estado = estado;
        this.observacion = observacion;
        this.detalles = detalles;
    }

    public int getIdPedido() {
        return idPedido;
    }

    public void setIdPedido(int idPedido) {
        this.idPedido = idPedido;
    }

    public int getIdSucursal() {
        return idSucursal;
    }

    public void setIdSucursal(int idSucursal) {
        this.idSucursal = idSucursal;
    }
    
    public String getNombreSucursal() {
    return nombreSucursal;
}

public void setNombreSucursal(String nombreSucursal) {
    this.nombreSucursal = nombreSucursal;
}

    public String getFechaPedido() {
        return fechaPedido;
    }

    public void setFechaPedido(String fechaPedido) {
        this.fechaPedido = fechaPedido;
    }

    public String getTurno() {
        return turno;
    }

    public void setTurno(String turno) {
        this.turno = turno;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getObservacion() {
        return observacion;
    }

    public void setObservacion(String observacion) {
        this.observacion = observacion;
    }

    public List<DetallePedido> getDetalles() {
        return detalles;
    }

    public void setDetalles(List<DetallePedido> detalles) {
        this.detalles = detalles;
    }
}