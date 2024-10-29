export class Almacenamiento {
    constructor() {
        this.variables = [];
        this.errores = [];
    }

    agregarVariable(variable) {
        this.variables.push(variable);
    }

    imprimirVariables() {
        if (this.variables.length === 0) {
            console.log("No hay variables almacenadas.");
        } else {
            console.log("Variables almacenadas:");
            this.variables.forEach(variable => {
                console.log(`
                    ID: ${variable.id}
                    Tipo: ${variable.tipo}
                    Tipo de Dato: ${variable.tipoDato}
                    Ámbito: ${variable.ambito}
                    Valor: ${variable.valor}
                    Línea: ${variable.linea}
                    Columna: ${variable.columna}
                `);
            });
        }
    }

    imprimirErrores() {
        if (this.errores.length === 0) {
            console.log("No hay errores almacenados.");
        } else {
            console.log("Errores almacenados:");
            this.errores.forEach(error => {
                console.log(`
                    Descripción: ${error.descripcion}
                    Línea: ${error.linea}
                    Columna: ${error.columna}
                `);
            });
        }
    }

    agregarError(error) {
        this.errores.push(error);
    }
}
