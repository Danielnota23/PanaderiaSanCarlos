/*
 * Universidad Mariano Gálvez de Guatemala
 * Ingeniería en Sistemas de Información y Ciencias de la Computación
 * Curso: Desarrollo Web - Proyecto Final
 * Sistema de Control de Producción - Panadería San Carlos
 */
package com.panaderia.modelo;

import java.util.ArrayList;
import java.util.List;

/**
 * Receta de un tipo de pan (producto final).
 * Las cantidades de los ingredientes son para producir
 * "rendimiento" unidades de pan.
 */
public class Receta {

    private int idReceta;
    private int idProducto;
    private String nombreProducto;
    private String nombre;
    private int rendimiento;
    private boolean estado;
    private List<DetalleReceta> ingredientes = new ArrayList<>();

    public Receta() {
    }

    public int getIdReceta() {
        return idReceta;
    }

    public void setIdReceta(int idReceta) {
        this.idReceta = idReceta;
    }

    public int getIdProducto() {
        return idProducto;
    }

    public void setIdProducto(int idProducto) {
        this.idProducto = idProducto;
    }

    public String getNombreProducto() {
        return nombreProducto;
    }

    public void setNombreProducto(String nombreProducto) {
        this.nombreProducto = nombreProducto;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public int getRendimiento() {
        return rendimiento;
    }

    public void setRendimiento(int rendimiento) {
        this.rendimiento = rendimiento;
    }

    public boolean isEstado() {
        return estado;
    }

    public void setEstado(boolean estado) {
        this.estado = estado;
    }

    public List<DetalleReceta> getIngredientes() {
        return ingredientes;
    }

    public void setIngredientes(List<DetalleReceta> ingredientes) {
        this.ingredientes = ingredientes;
    }
}
