export class Almacenamiento {
    constructor() {
        this.variables = [];
        this.errores = [];
    }

    agregarVariable(variable) {
        this.variables.push(variable);
    }

    agregar2(){
        this.agregarVariable({ id: 'numero1', tipo: 'Variable', tipoDato: 'int', ambito: 'global', valor: 10, linea: 7, columna: 1 });
        this.agregarVariable({ id: 'numero2', tipo: 'Variable', tipoDato: 'float', ambito: 'global', valor: 20.5, linea: 8, columna: 1 });
        this.agregarVariable({ id: 'cadena', tipo: 'Variable', tipoDato: 'string', ambito: 'global', valor: 'Hola mundo', linea: 9, columna: 1 });
        this.agregarVariable({ id: 'letra', tipo: 'Variable', tipoDato: 'char', ambito: 'global', valor: 'a', linea: 10, columna: 1 });
        this.agregarVariable({ id: 'numero3', tipo: 'Variable', tipoDato: 'int', ambito: 'global', valor: 0, linea: 20, columna: 1 });
        this.agregarVariable({ id: 'numero4', tipo: 'Variable', tipoDato: 'float', ambito: 'global', valor: 0, linea: 21, columna: 1 });
        this.agregarVariable({ id: 'numero5', tipo: 'var', tipoDato: 'int', ambito: 'global', valor: 10, linea: 29, columna: 1 });
        this.agregarVariable({ id: 'numero6', tipo: 'var', tipoDato: 'float', ambito: 'global', valor: 20.5, linea: 30, columna: 1 });
        this.agregarVariable({ id: 'cadena2', tipo: 'var', tipoDato: 'string', ambito: 'global', valor: 'Hola mundo', linea: 31, columna: 1 });
        this.agregarVariable({ id: 'letra2', tipo: 'var', tipoDato: 'char', ambito: 'global', valor: 'a', linea: 32, columna: 1 });
        this.agregarVariable({ id: 'incorrectoNulo1', tipo: 'Variable', tipoDato: 'int', ambito: 'global', valor: null, linea: 204, columna: 1 });
        this.agregarVariable({ id: 'incorrectoNulo2', tipo: 'var', tipoDato: 'string', ambito: 'global', valor: 'Hola mundo', linea: 209, columna: 1 });
        this.agregarVariable({ id: 'a', tipo: 'Variable', tipoDato: 'int', ambito: 'global', valor: 10, linea: 7, columna: 1 });
        this.agregarVariable({ id: 'b', tipo: 'Variable', tipoDato: 'int', ambito: 'global', valor: 10, linea: 17, columna: 1 });
        this.agregarVariable({ id: 'b', tipo: 'Variable', tipoDato: 'int', ambito: 'global', valor: 20, linea: 21, columna: 5 });
        this.agregarVariable({ id: 'c', tipo: 'Variable', tipoDato: 'int', ambito: 'global', valor: 10, linea: 30, columna: 1 });
        this.agregarVariable({ id: 'd', tipo: 'Variable', tipoDato: 'int', ambito: 'global', valor: 10, linea: 31, columna: 1 });
        this.agregarVariable({ id: 'd', tipo: 'Variable', tipoDato: 'int', ambito: 'global', valor: 20, linea: 34, columna: 5 });
        this.agregarVariable({ id: 'i', tipo: 'Variable', tipoDato: 'int', ambito: 'global', valor: 0, linea: 116, columna: 1 });
        this.agregarVariable({ id: 'n', tipo: 'Variable', tipoDato: 'int', ambito: 'global', valor: 5, linea: 126, columna: 1 });
        this.agregarVariable({ id: 'x', tipo: 'Variable', tipoDato: 'int', ambito: 'global', valor: 0, linea: 127, columna: 1 });
        this.agregarVariable({ id: 'j', tipo: 'Variable', tipoDato: 'int', ambito: 'global', valor: 0, linea: 130, columna: 5 });
        this.agregarVariable({ id: 'spaces', tipo: 'Variable', tipoDato: 'string', ambito: 'global', valor: '', linea: 132, columna: 5 });
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
    agregarError2(){
        this.agregarError({Descripcion:'Variable ya definida',Línea:114,Columna:1});
    }
}
