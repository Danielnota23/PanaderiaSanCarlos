package com.panaderia.prueba;

import com.panaderia.manager.ProduccionManager;
import com.panaderia.modelo.Produccion;

import java.util.List;

public class PruebaProduccion {

    public static void main(String[] args) {

        ProduccionManager manager =
                new ProduccionManager();

        List<Produccion> lista =
                manager.listarProduccion();

        for (Produccion p : lista) {

            System.out.println(
                    p.getIdProduccion()
                    + " - "
                    + p.getNombreProducto()
                    + " - Requerida: "
                    + p.getCantidadRequerida()
                    + " - Producida: "
                    + p.getCantidadProducida()
                    + " - "
                    + p.getEstado()
            );
        }
    }
}
