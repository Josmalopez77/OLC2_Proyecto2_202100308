import { FuncionForanea } from "./foreanea.js";
import { Instancia } from "./instancia.js";
import { Invocable } from "./invocable.js";
import { Expresion } from "./nodos.js";


export class Clase extends Invocable {

    constructor(nombre, propiedades) {
        super();

        /**
         * @type {string}
         */
        this.nombre = nombre;

        /**
         * @type {Object.<string, Expresion>}
         */
        this.propiedades = propiedades;

    }

    /**
    * @param {string} nombre
    * @returns {FuncionForanea | null}
    */
    buscarMetodo(nombre) {
        if (this.metodos.hasOwnProperty(nombre)) {
            return this.metodos[nombre];
        }
        return null;
    }

    aridad() {
        return Object.keys(this.properties).length;
    }


    /**
    * @type {Invocable['invocar']}
    */
    invocar(interprete, args) {
        const instanciaNueva = new Instancia(this);

        Object.entries(this.properties).forEach(([nombre, valor]) => {
            instanciaNueva.set(nombre, valor);
        });

        return instanciaNueva;

    }

}