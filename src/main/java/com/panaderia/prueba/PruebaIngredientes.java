package com.panaderia.prueba;

import com.panaderia.manager.IngredienteManager;
import com.panaderia.modelo.Ingrediente;

import java.util.List;

public class PruebaIngredientes {

    public static void main(String[] args) {

        IngredienteManager manager =
                new IngredienteManager();

        List<Ingrediente> ingredientes =
                manager.listarIngredientes();

        for (Ingrediente ingrediente : ingredientes) {

            System.out.println(
                    ingrediente.getIdIngrediente()
                    + " - "
                    + ingrediente.getNombre()
                    + " - Existencia: "
                    + ingrediente.getExistenciaActual()
                    + " "
                    + ingrediente.getUnidadMedida()
                    + " - Minimo: "
                    + ingrediente.getExistenciaMinima()
            );
        }
    }
}