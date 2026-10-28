package com.panaderia.prueba;

import com.panaderia.manager.SucursalManager;
import com.panaderia.modelo.Sucursal;

import java.util.List;

public class PruebaSucursales {

    public static void main(String[] args) {

        SucursalManager manager =
                new SucursalManager();

        List<Sucursal> sucursales =
                manager.listarSucursales();

        for (Sucursal sucursal : sucursales) {

            System.out.println(
                    sucursal.getIdSucursal()
                    + " - "
                    + sucursal.getNombre()
            );
        }
    }
}