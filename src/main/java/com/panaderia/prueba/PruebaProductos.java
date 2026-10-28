package com.panaderia.prueba;

import com.panaderia.manager.ProductoManager;
import com.panaderia.modelo.Producto;
import java.util.List;

public class PruebaProductos {

    public static void main(String[] args) {

        ProductoManager manager = new ProductoManager();

        List<Producto> productos = manager.listarProductos();

        for (Producto producto : productos) {
            System.out.println(
                    producto.getIdProducto()
                    + " - "
                    + producto.getNombre()
            );
        }
    }
}