import { builtins } from "./builtins.js";
import { registers as r } from "./constantes.js";
import { stringTo1ByteArray, numberToF32 } from "./utils.js";

class Instruction {

    constructor(instruccion, rd, rs1, rs2) {
        this.instruccion = instruccion;
        this.rd = rd;
        this.rs1 = rs1;
        this.rs2 = rs2;
    }

    toString() {
        const operandos = []
        if (this.rd !== undefined) operandos.push(this.rd)
        if (this.rs1 !== undefined) operandos.push(this.rs1)
        if (this.rs2 !== undefined) operandos.push(this.rs2)
        return `${this.instruccion} ${operandos.join(', ')}`
    }

}

export class Generador {

    constructor() {
        this.instrucciones = []
        this.objectStack = []
        this.instrucionesDeFunciones = []
        this.depth = 0
        this._usedBuiltins = new Set()
        this._labelCounter = 0;
    }

    getLabel() {
        return `L${this._labelCounter++}`
    }

    addLabel(label) {
        label = label || this.getLabel()
        this.instrucciones.push(new Instruction(`${label}:`))
        return label
    }

    add(rd, rs1, rs2) {
        this.instrucciones.push(new Instruction('add', rd, rs1, rs2))
    }

    sub(rd, rs1, rs2) {
        this.instrucciones.push(new Instruction('sub', rd, rs1, rs2))
    }

    mul(rd, rs1, rs2) {
        this.instrucciones.push(new Instruction('mul', rd, rs1, rs2))
    }
    and(rd, rs1, rs2){
        this.instrucciones.push(new Instruction('and', rd, rs1, rs2))
    }

    or(rd, rs1, rs2){
        this.instrucciones.push(new Instruction('or', rd, rs1, rs2))
    }
    xor(rd, rs1, rs2){
        this.instrucciones.push(new Instruction('xor', rd, rs1, rs2))
    }

    seqz(rd, rs1){
        this.instrucciones.push(new Instruction('seqz', rd, rs1))
    }

    snez(rd, rs1){
        this.instrucciones.push(new Instruction('snez', rd, rs1))
    }

    div(rd, rs1, rs2) {
        this.instrucciones.push(new Instruction('div', rd, rs1, rs2))
    }
    printLn(){
        this.li(r.A0, 10);
        this.li(r.A7, 11);
        this.ecall();
    }

    addi(rd, rs1, inmediato) {
        this.instrucciones.push(new Instruction('addi', rd, rs1, inmediato))
    }

    sw(rs1, rs2, inmediato = 0) {
        this.instrucciones.push(new Instruction('sw', rs1, `${inmediato}(${rs2})`))
    }

    sb(rs1, rs2, inmediato = 0) {
        this.instrucciones.push(new Instruction('sb', rs1, `${inmediato}(${rs2})`))
    }

    lw(rd, rs1, inmediato = 0) {
        this.instrucciones.push(new Instruction('lw', rd, `${inmediato}(${rs1})`))
    }

    lb(rd, rs1, inmediato = 0) {
        this.instrucciones.push(new Instruction('lb', rd, `${inmediato}(${rs1})`))
    }

    // --- Saltos condicionales


    /**
     * ==
     */
    beq(rs1, rs2, label) {
        this.instrucciones.push(new Instruction('beq', rs1, rs2, label))
    }

    beqz(rs1, label) {
        this.instrucciones.push(new Instruction('beqz', rs1, label));
    }
    /**
     * !=
     */
    bne(rs1, rs2, label) {
        this.instrucciones.push(new Instruction('bne', rs1, rs2, label))
    }

    /**
     * <
     */
    blt(rs1, rs2, label) {
        this.instrucciones.push(new Instruction('blt', rs1, rs2, label))
    }

    bnez(rs1, label){
        this.instrucciones.push(new Instruction('bnez', rs1, label))
    }

    /**
     * <=
     */
     ble(rs1, rs2, label) {
        this.instrucciones.push(new Instruction('ble', rs1, rs2, label))
    }
     

    /**
     * >
     */
    bgt(rs1, rs2, label) {
        this.instrucciones.push(new Instruction('bgt', rs1, rs2, label))
    }

    /**
     * >=
     */
    bge(rs1, rs2, label) {
        this.instrucciones.push(new Instruction('bge', rs1, rs2, label))
    }

    li(rd, inmediato) {
        this.instrucciones.push(new Instruction('li', rd, inmediato))
    }
    loadType(rd, rs1, inmediato){
        this.instrucciones.push(new Instruction('lw', rd, `${inmediato}(${rs1})`))
    }

    la(rd, label) {
        this.instrucciones.push(new Instruction('la', rd, label))
    }

    push(rd = r.T0) {
        this.addi(r.SP, r.SP, -4) // 4 bytes = 32 bits
        this.sw(rd, r.SP)
    }

    pushFloat(rd = r.FT0) {
        this.addi(r.SP, r.SP, -4) // 4 bytes = 32 bits
        this.fsw(rd, r.SP)
    }

    rem(rd, rs1, rs2) {
        this.instrucciones.push(new Instruction('rem', rd, rs1, rs2))
    }

    pop(rd = r.T0) {
        this.lw(rd, r.SP)
        this.addi(r.SP, r.SP, 4)
    }

    jal(label) {
        this.instrucciones.push(new Instruction('jal', label))
    }

    jalr(rd, rs1, imm) {
        this.instrucciones.push(new Instruction('jalr', rd, rs1, imm))
    }

    j(label) {
        this.instrucciones.push(new Instruction('j', label))
    }
    label(label) {
        this.instrucciones.push(new Instruction(label+':'));
    }

    ret() {
        this.instrucciones.push(new Instruction('ret'))
    }

    ecall() {
        this.instrucciones.push(new Instruction('ecall'))
    }

    callBuiltin(builtinName) {
        if (!builtins[builtinName]) {
            throw new Error(`Builtin ${builtinName} not found`)
        }
        this._usedBuiltins.add(builtinName)
        this.jal(builtinName)
    }

    printSalto() {
        this.li(r.A0, 10)
        this.li(r.A7, 11)
        this.ecall()
    }

    printInt(rd = r.A0) {

        if (rd !== r.A0) {
            this.push(r.A0)
            this.add(r.A0, rd, r.ZERO)
        }

        this.li(r.A7, 1)
        this.ecall()

        if (rd !== r.A0) {
            this.pop(r.A0)
        }

    }

    printString(rd = r.A0) {

        if (rd !== r.A0) {
            this.push(r.A0)
            this.add(r.A0, rd, r.ZERO)
        }

        this.li(r.A7, 4)
        this.ecall()

        if (rd !== r.A0) {
            this.pop(r.A0)
        }
    }

    printChar(rd = r.A0) {

        if (rd !== r.A0) {
            this.push(r.A0);
            this.add(r.A0, rd, r.ZERO); // Mover el valor de rd a r.A0
        }
    
        // Configurar el número de llamada del sistema para imprimir un carácter
        this.li(r.A7, 11); // 11 es el número de llamada para imprimir un carácter en sistemas basados en RISC-V
        this.ecall(); // Realizar la llamada al sistema
    
        // Restaurar el valor original de r.A0 si fue guardado
        if (rd !== r.A0) {
            this.pop(r.A0);
        }
    }

    printBoolean(rd = r.A0) {
        const labelFalse = this.getLabel()
        const labelEnd = this.getLabel()
    
        // Guardamos el valor actual si es necesario
        if (rd !== r.A0) {
            this.push(r.A0)
            this.add(r.A0, rd, r.ZERO)
        }
    
        // Comparamos con cero
        this.beq(r.A0, r.ZERO, labelFalse)
        
        // Si no es cero, imprimimos "true"
        this.la(r.A0, "true_str")
        this.li(r.A7, 4)
        this.ecall()
        this.j(labelEnd)
        
        // Etiqueta para imprimir "false"
        this.addLabel(labelFalse)
        this.la(r.A0, "false_str")
        this.li(r.A7, 4)
        this.ecall()
        
        // Etiqueta de fin
        this.addLabel(labelEnd)
    
        // Restauramos el valor si fue necesario
        if (rd !== r.A0) {
            this.pop(r.A0)
        }
    }


    endProgram() {
        this.li(r.A7, 10)
        this.ecall()
    }

    comment(text) {
        this.instrucciones.push(new Instruction(`# ${text}`))
    }

    pushConstant(object) {
        let length = 0;

        switch (object.type) {
            case 'int':
                this.li(r.T0, object.valor);
                this.push()
                length = 4;
                break;

            case 'string':
                const stringArray = stringTo1ByteArray(object.valor);

                this.comment(`Pushing string ${object.valor}`);
                // this.addi(r.T0, r.HP, 4);
                // this.push(r.T0);
                this.push(r.HP);

                stringArray.forEach((charCode) => {
                    this.li(r.T0, charCode);
                    // this.push(r.T0);
                    // this.addi(r.HP, r.HP, 4);
                    // this.sw(r.T0, r.HP);

                    this.sb(r.T0, r.HP);
                    this.addi(r.HP, r.HP, 1);
                });

                length = 4;
                break;

            case 'boolean':
                this.li(r.T0, object.valor ? 1 : 0);
                this.push(r.T0);
                length = 4;
                break;

            case 'char':
                this.li(r.T0, object.valor.charCodeAt(0));
                this.push(r.T0);
                length = 4;
                break;

            case 'float':
                const ieee754 = numberToF32(object.valor);
                this.li(r.T0, ieee754);
                this.push(r.T0);
                length = 4;
                break;

            default:
                break;
        }

        this.pushObject({ type: object.type, length, depth: this.depth });
    }

    pushObject(object) {
        // this.objectStack.push(object);
        this.objectStack.push({
            ...object,
            depth: this.depth,
        });
    }

    popFloat(rd = r.FT0) {
        this.flw(rd, r.SP)
        this.addi(r.SP, r.SP, 4)
    }

    popObject(rd = r.T0) {
        const object = this.objectStack.pop();


        switch (object.type) {
            case 'int':
                this.pop(rd);
                break;

            case 'string':
                this.pop(rd);
                break;
            case 'boolean':
                this.pop(rd);
                break;
            case 'float':
                this.popFloat(rd);
                break;
            case 'char':
                this.pop(rd);
                break;
            default:
                break;
        }

        return object;
    }

    toLowerr() {
        const endLabel = this.getLabel();
        const loopLabel = this.getLabel();
        const skipLowerLabel = this.getLabel();
    
        this.pop(r.T0); 
    
        this.push(r.T0);
    
        this.label(loopLabel);
        
        this.lb(r.T1, r.T0);

        this.beqz(r.T1, endLabel);
    
        this.li(r.T2, 65);  
        this.li(r.T3, 90);  
        this.slt(r.T4, r.T1, r.T2); 
        this.bnez(r.T4, skipLowerLabel);
        this.slt(r.T4, r.T3, r.T1);  
        this.bnez(r.T4, skipLowerLabel);

        this.addi(r.T1, r.T1, 32);
        
        this.sb(r.T1, r.T0);
    
        this.label(skipLowerLabel);
        this.addi(r.T0, r.T0, 1);
        this.j(loopLabel);
    
        this.label(endLabel);
        
    }

    toUpperr() {
        const endLabel = this.getLabel();
        const loopLabel = this.getLabel();
        const skipUpperLabel = this.getLabel();
        console.log(endLabel)
        console.log(loopLabel)
        console.log(skipUpperLabel)
    
    
        this.pop(r.T0); 

        this.push(r.T0);
    
        this.label(loopLabel);
        
        this.lb(r.T1, r.T0);

        this.beqz(r.T1, endLabel);
    
        this.li(r.T2, 97); 
        this.li(r.T3, 122);  
        this.slt(r.T4, r.T1, r.T2); 
  
        this.bnez(r.T4, skipUpperLabel);
 
        this.slt(r.T4, r.T3, r.T1);  
        this.bnez(r.T4, skipUpperLabel); 
        this.addi(r.T1, r.T1, -32);
        this.sb(r.T1, r.T0);

        this.label(skipUpperLabel);
        this.addi(r.T0, r.T0, 1); 
        this.j(loopLabel);     
        this.label(endLabel);
        
    }


    getTopObject() {
        return this.objectStack[this.objectStack.length - 1];
        
    }

    /*
     FUNCIONES PARA ENTORNOS
    */

    newScope() {
        this.depth++
    }

    endScope() {
        let byteOffset = 0;

        for (let i = this.objectStack.length - 1; i >= 0; i--) {
            if (this.objectStack[i].depth === this.depth) {
                byteOffset += this.objectStack[i].length;
                this.objectStack.pop();
            } else {
                break;
            }
        }
        this.depth--

        return byteOffset;
    }


    tagObject(id) {
        this.objectStack[this.objectStack.length - 1].id = id;
    }

    getObject(id) {
        let byteOffset = 0;
        for (let i = this.objectStack.length - 1; i >= 0; i--) {
            if (this.objectStack[i].id === id) {
                return [byteOffset, this.objectStack[i]];
            }
            byteOffset += this.objectStack[i].length;
        }

        throw new Error(`Variable ${id} not found`);
    }

    toString() {
        this.comment('Fin del programa')
        this.endProgram()
        this.comment('Builtins')

        this.comment('Funciones foraneas')
        this.instrucionesDeFunciones.forEach(instruccion => this.instrucciones.push(instruccion))

        Array.from(this._usedBuiltins).forEach(builtinName => {
            this.addLabel(builtinName)
            builtins[builtinName](this)
            this.ret()
        })
        return `
.data
        true_str: .string "true"
        false_str: .string "false"
        heap:
.text

# inicializando el heap pointer
    la ${r.HP}, heap

main:
    ${this.instrucciones.map(instruccion => `${instruccion}`).join('\n')}
`
    }


    // --- Instruciones flotantes

    fadd(rd, rs1, rs2) {
        this.instrucciones.push(new Instruction('fadd.s', rd, rs1, rs2))
    }

    fsub(rd, rs1, rs2) {
        this.instrucciones.push(new Instruction('fsub.s', rd, rs1, rs2))
    }
    feq(rd, rs1, rs2){
        this.instrucciones.push(new Instruction('feq.s', rd, rs1, rs2))
    }
    xori(rd, rs1, inmediato){
        this.instrucciones.push(new Instruction('xori', rd, rs1, inmediato))
    }
    slt(rd, rs1, rs2){
        this.instrucciones.push(new Instruction('slt', rd, rs1, rs2))
    }

    fmul(rd, rs1, rs2) {
        this.instrucciones.push(new Instruction('fmul.s', rd, rs1, rs2))
    }
    fle(rd, rs1, rs2){
        this.instrucciones.push(new Instruction('fle.s', rd, rs1, rs2))
    }
    flt(rd, rs1, rs2){
        this.instrucciones.push(new Instruction('flt.s', rd, rs1, rs2))
    }
    fadd(rd, rs1, rs2){
        this.instrucciones.push(new Instruction('fadd.s', rd, rs1, rs2))
    }

    fsub(rd, rs1, rs2){
        this.instrucciones.push(new Instruction('fsub.s', rd, rs1, rs2))
    }

    fdiv(rd, rs1, rs2) {
        this.instrucciones.push(new Instruction('fdiv.s', rd, rs1, rs2))
    }

    fli(rd, inmediato) {
        this.instrucciones.push(new Instruction('fli.s', rd, inmediato))
    }

    fmv(rd, rs1) {
        this.instrucciones.push(new Instruction('fmv.s', rd, rs1))
    }

    flw(rd, rs1, inmediato = 0) {
        this.instrucciones.push(new Instruction('flw', rd, `${inmediato}(${rs1})`))
    }

    fsw(rs1, rs2, inmediato = 0) {
        this.instrucciones.push(new Instruction('fsw', rs1, `${inmediato}(${rs2})`))
    }

    fcvtsw(rd, rs1) {
        this.instrucciones.push(new Instruction('fcvt.s.w', rd, rs1))
    }

    print

    printFloat() {
        this.li(r.A7, 2)
        this.ecall()
    }

    getFrameLocal(index) {
        const frameRelativeLocal = this.objectStack.filter(obj => obj.type === 'local');
        return frameRelativeLocal[index];
    }

    printStringLiteral(string) {
        const stringArray = stringTo1ByteArray(string);
        stringArray.pop(); // No queremos el 0 al final

        this.comment(`Imprimiendo literal ${string}`);

        stringArray.forEach((charCode) => {
            this.li(r.A0, charCode);
            this.printChar();
        });
    }
}