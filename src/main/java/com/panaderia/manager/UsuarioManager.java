package com.panaderia.manager;

import com.panaderia.config.Conexion;
import com.panaderia.modelo.Usuario;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import java.util.ArrayList;
import java.util.List;

public class UsuarioManager {

    public List<Usuario> listarUsuarios() {

        List<Usuario> usuarios = new ArrayList<>();

        String sql =
                "SELECT id_usuario, nombre, correo, "
              + "rol, id_sucursal, estado "
              + "FROM panaderia.usuarios "
              + "WHERE estado = TRUE "
              + "ORDER BY id_usuario";

        try (
            Connection conexion = Conexion.getConexion();
            PreparedStatement ps = conexion.prepareStatement(sql);
            ResultSet rs = ps.executeQuery()
        ) {

            while (rs.next()) {

                Usuario usuario = new Usuario();

                usuario.setIdUsuario(
                        rs.getInt("id_usuario")
                );

                usuario.setNombre(
                        rs.getString("nombre")
                );

                usuario.setCorreo(
                        rs.getString("correo")
                );

                usuario.setRol(
                        rs.getString("rol")
                );

                usuario.setIdSucursal(
                        rs.getInt("id_sucursal")
                );

                usuario.setEstado(
                        rs.getBoolean("estado")
                );

                usuarios.add(usuario);
            }

        } catch (SQLException e) {

            System.out.println(
                    "ERROR AL LISTAR USUARIOS:"
            );

            e.printStackTrace();
        }

        return usuarios;
    }


    public Usuario iniciarSesion(
            String correo,
            String contrasena) {

        String sql =
                "SELECT id_usuario, nombre, correo, "
              + "rol, id_sucursal, estado "
              + "FROM panaderia.usuarios "
              + "WHERE correo = ? "
              + "AND contrasena = ? "
              + "AND estado = TRUE";

        try (
            Connection conexion = Conexion.getConexion();
            PreparedStatement ps = conexion.prepareStatement(sql)
        ) {

            ps.setString(1, correo);
            ps.setString(2, contrasena);

            try (ResultSet rs = ps.executeQuery()) {

                if (rs.next()) {

                    Usuario usuario = new Usuario();

                    usuario.setIdUsuario(
                            rs.getInt("id_usuario")
                    );

                    usuario.setNombre(
                            rs.getString("nombre")
                    );

                    usuario.setCorreo(
                            rs.getString("correo")
                    );

                    usuario.setRol(
                            rs.getString("rol")
                    );

                    usuario.setIdSucursal(
                            rs.getInt("id_sucursal")
                    );

                    usuario.setEstado(
                            rs.getBoolean("estado")
                    );

                    return usuario;
                }
            }

        } catch (SQLException e) {

            System.out.println(
                    "ERROR AL INICIAR SESION:"
            );

            e.printStackTrace();
        }

        return null;
    }
}