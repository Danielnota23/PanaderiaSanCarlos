package com.panaderia.prueba;

import com.panaderia.manager.UsuarioManager;
import com.panaderia.modelo.Usuario;

public class PruebaUsuario {

    public static void main(String[] args) {

        UsuarioManager manager =
                new UsuarioManager();

        Usuario usuario =
                manager.iniciarSesion(
                        "admin@panaderia.com",
                        "Admin123"
                );

        if (usuario != null) {

            System.out.println("LOGIN CORRECTO");
            System.out.println(
                    "ID: " + usuario.getIdUsuario()
            );
            System.out.println(
                    "Nombre: " + usuario.getNombre()
            );
            System.out.println(
                    "Correo: " + usuario.getCorreo()
            );
            System.out.println(
                    "Rol: " + usuario.getRol()
            );

        } else {

            System.out.println(
                    "CORREO O CONTRASENA INCORRECTOS"
            );
        }
    }
}