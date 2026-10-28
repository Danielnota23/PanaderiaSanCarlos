/*
 * Universidad Mariano Gálvez de Guatemala
 * Ingeniería en Sistemas de Información y Ciencias de la Computación
 * Curso: Desarrollo Web - Proyecto Final
 * Sistema de Control de Producción - Panadería San Carlos
 */
package com.panaderia.config;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

/**
 * Punto único de acceso a la base de datos.
 *
 * Los datos de conexión se leen de variables de entorno para poder
 * publicar el sistema en internet sin dejar contraseñas en el código:
 *   DB_URL, DB_USER, DB_PASSWORD
 * Si no existen, se usan los valores de desarrollo local.
 */
public final class Conexion {

    private static final String URL =
            leer("DB_URL", "jdbc:postgresql://localhost:5432/panaderia_san_carlos");

    private static final String USUARIO =
            leer("DB_USER", "postgres");

    private static final String CONTRASENA =
            leer("DB_PASSWORD", "Daniel2026");

    static {
        try {
            Class.forName("org.postgresql.Driver");
        } catch (ClassNotFoundException e) {
            throw new IllegalStateException(
                    "No se encontró el driver de PostgreSQL", e);
        }
    }

    private Conexion() {
        // Clase de utilidad: no se instancia
    }

    /**
     * Abre una conexión nueva. Quien la pide debe cerrarla
     * (se recomienda usar try-with-resources).
     */
    public static Connection getConexion() throws SQLException {
        return DriverManager.getConnection(URL, USUARIO, CONTRASENA);
    }

    private static String leer(String variable, String valorPorDefecto) {
        String valor = System.getenv(variable);
        return (valor == null || valor.trim().isEmpty())
                ? valorPorDefecto
                : valor.trim();
    }
}
