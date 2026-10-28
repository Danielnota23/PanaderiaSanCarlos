/*
 * Universidad Mariano Gálvez de Guatemala
 * Ingeniería en Sistemas de Información y Ciencias de la Computación
 * Curso: Desarrollo Web - Proyecto Final
 * Sistema de Control de Producción - Panadería San Carlos
 */
package com.panaderia.modelo;

/**
 * Cantidad de un ingrediente que se necesita para producir,
 * comparada con lo que hay en inventario.
 */
public class RequerimientoInsumo {

    private int idIngrediente;
    private String nombreIngrediente;
    private String unidadMedida;
    private double cantidadNecesaria;
    private double existenciaActual;
    private double faltante;
    private boolean suficiente;

    public RequerimientoInsumo() {
    }

    public int getIdIngrediente() {
        return idIngrediente;
    }

    public void setIdIngrediente(int idIngrediente) {
        this.idIngrediente = idIngrediente;
    }

    public String getNombreIngrediente() {
        return nombreIngrediente;
    }

    public void setNombreIngrediente(String nombreIngrediente) {
        this.nombreIngrediente = nombreIngrediente;
    }

    public String getUnidadMedida() {
        return unidadMedida;
    }

    public void setUnidadMedida(String unidadMedida) {
        this.unidadMedida = unidadMedida;
    }

    public double getCantidadNecesaria() {
        return cantidadNecesaria;
    }

    public void setCantidadNecesaria(double cantidadNecesaria) {
        this.cantidadNecesaria = cantidadNecesaria;
    }

    public double getExistenciaActual() {
        return existenciaActual;
    }

    public void setExistenciaActual(double existenciaActual) {
        this.existenciaActual = existenciaActual;
    }

    public double getFaltante() {
        return faltante;
    }

    public void setFaltante(double faltante) {
        this.faltante = faltante;
    }

    public boolean isSuficiente() {
        return suficiente;
    }

    public void setSuficiente(boolean suficiente) {
        this.suficiente = suficiente;
    }
}
