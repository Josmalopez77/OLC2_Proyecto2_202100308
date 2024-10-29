import { parse } from './analizador2.js'
import { CompilerVisitor } from './compilador.js'
import {Almacenamiento} from './almacenamiento.js'


// const editor = document.getElementById('editor')
const btn = document.getElementById('btn')
let indicador = true;
const ast = document.getElementById('ast')
const errores = document.getElementById('Errores')
const variables = document.getElementById('Variables')
const salida = document.getElementById('salida')
const editor = document.getElementById('editor')

const almacenamiento = new Almacenamiento();


btn.addEventListener('click', () => {
    const codigoFuente = editor.value;
    try {


        const sentencias = parse(codigoFuente)
        // ast.innerHTML = JSON.stringify(sentencias, null, 2)

        const interprete = new CompilerVisitor()

        // for (const sentencia of sentencias) {
        //     sentencia.accept(interprete)
        // }
        console.log({ sentencias })
        sentencias.forEach(sentencia => sentencia.accept(interprete))

        salida.value = interprete.code.toString().replace(/\n/g, '\n')

    } catch (error) {
        console.log(error)
        // console.log(JSON.stringify(error, null, 2))
        salida.value = error.message + ' at line ' + error.location.start.line + ' column ' + error.location.start.column
    }
})

function generarTabla(datos, titulo) {
    // Crear nueva ventana
    const nuevaVentana = window.open("", titulo, "width=600,height=400");
    nuevaVentana.document.write(`<html><head><title>${titulo}</title></head><body>`);
    nuevaVentana.document.write(`<h1>${titulo}</h1>`);
    nuevaVentana.document.write('<table border="1" style="width:100%; text-align: left;">');

    // Generar encabezados
    const keys = Object.keys(datos[0]);
    nuevaVentana.document.write('<tr>');
    keys.forEach(key => nuevaVentana.document.write(`<th>${key}</th>`));
    nuevaVentana.document.write('</tr>');

    // Generar filas de datos
    datos.forEach(dato => {
        nuevaVentana.document.write('<tr>');
        keys.forEach(key => nuevaVentana.document.write(`<td>${dato[key]}</td>`));
        nuevaVentana.document.write('</tr>');
    });

    nuevaVentana.document.write('</table>');
    nuevaVentana.document.write('</body></html>');
    nuevaVentana.document.close();
}
variables.addEventListener('click', () => {
    almacenamiento.agregar2();
    
    almacenamiento.imprimirVariables();
    if (almacenamiento.variables.length > 0) {
        generarTabla(almacenamiento.variables, 'Variables');
    } else {
        alert('No hay variables almacenadas');
    }
});
errores.addEventListener('click', () => {
    almacenamiento.agregarError2();
    almacenamiento.imprimirErrores();
    if (almacenamiento.errores.length > 0) {
        generarTabla(almacenamiento.errores, 'Errores');
    } else {
        alert('No hay variables almacenadas');
    }
});