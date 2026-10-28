/*
 * Universidad Mariano Gálvez de Guatemala
 * Ingeniería en Sistemas de Información y Ciencias de la Computación
 * Curso: Desarrollo Web - Proyecto Final
 * Sistema de Control de Producción - Panadería San Carlos
 */
package com.panaderia.config;

/**
 * Identificación institucional del proyecto.
 * La usa el endpoint /api/info y se muestra en el frontend.
 */
public final class InfoSistema {

    public static final String UNIVERSIDAD =
            "Universidad Mariano Gálvez de Guatemala";

    public static final String CARRERA =
            "Ingeniería en Sistemas de Información y Ciencias de la Computación";

    public static final String CURSO = "Desarrollo Web";

    public static final String PROYECTO =
            "Sistema de Control de Producción - Panadería San Carlos";

    public static final String VERSION = "1.0";

    private InfoSistema() {
    }
}
