package com.panaderia.prueba;

import com.panaderia.manager.MovimientoInventarioManager;
import com.panaderia.modelo.MovimientoInventario;

import java.util.List;

public class PruebaMovimientosInventario {

    public static void main(String[] args) {

        MovimientoInventarioManager manager =
                new MovimientoInventarioManager();

        List<MovimientoInventario> movimientos =
                manager.listarMovimientos();

        for (MovimientoInventario movimiento : movimientos) {

            System.out.println(
                    movimiento.getIdMovimiento()
                    + " - "
                    + movimiento.getNombreIngrediente()
                    + " - "
                    + movimiento.getTipoMovimiento()
                    + " - "
                    + movimiento.getCantidad()
                    + " - "
                    + movimiento.getDescripcion()
            );
        }
    }
}
