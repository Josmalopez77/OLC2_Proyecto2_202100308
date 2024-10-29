import { FrameVisitor } from "./frame.js";
import { ReferenciaVariable } from "./nodos.js";
import { registers as r, floatRegisters as f } from "./risc/constantes.js";
import { Generador } from "./risc/generador.js";
import { BaseVisitor } from "./visitor.js";


export class CompilerVisitor extends BaseVisitor {

    constructor() {
        super();
        this.code = new Generador();

        this.continueLabel = null;
        this.breakLabel = null;

        this.functionMetada = {}
        this.insideFunction = false;
        this.frameDclIndex = 0;
        this.returnLabel = null;
    }

    /**
     * @type {BaseVisitor['visitExpresionStmt']}
     */
    visitExpresionStmt(node) {
        node.exp.accept(this);
        this.code.popObject(r.T0);
    }

    /**
     * @type {BaseVisitor['visitPrimitivo']}
     */
    visitPrimitivo(node) {
        this.code.comment(`Primitivo: ${node.valor}`);
        this.code.pushConstant({ type: node.tipo, valor: node.valor });
        this.code.comment(`Fin Primitivo: ${node.valor}`);
    }

    /**
     * @type {BaseVisitor['visitOperacionBinaria']}
     */
    visitOperacionBinaria(node) {
        let type = "";
        this.code.comment(`Operacion: ${node.op}`);

        if (node.op === '&&') {
            node.izq.accept(this); // izq
            this.code.popObject(r.T0); // izq

            const labelFalse = this.code.getLabel();
            const labelEnd = this.code.getLabel();

            this.code.beq(r.T0, r.ZERO, labelFalse); // if (!izq) goto labelFalse
            node.der.accept(this); // der
            this.code.popObject(r.T0); // der
            this.code.beq(r.T0, r.ZERO, labelFalse); // if (!der) goto labelFalse

            this.code.li(r.T0, 1);
            this.code.push(r.T0);
            this.code.j(labelEnd);
            this.code.addLabel(labelFalse);
            this.code.li(r.T0, 0);
            this.code.push(r.T0);

            this.code.addLabel(labelEnd);
            this.code.pushObject({ type: 'boolean', length: 4 });
            return
        }

        if (node.op === '||') {
            node.izq.accept(this); // izq
            this.code.popObject(r.T0); // izq

            const labelTrue = this.code.getLabel();
            const labelEnd = this.code.getLabel();

            this.code.bne(r.T0, r.ZERO, labelTrue); // if (izq) goto labelTrue
            node.der.accept(this); // der
            this.code.popObject(r.T0); // der
            this.code.bne(r.T0, r.ZERO, labelTrue); // if (der) goto labelTrue

            this.code.li(r.T0, 0);
            this.code.push(r.T0);

            this.code.j(labelEnd);
            this.code.addLabel(labelTrue);
            this.code.li(r.T0, 1);
            this.code.push(r.T0);

            this.code.addLabel(labelEnd);
            this.code.pushObject({ type: 'boolean', length: 4 });
            return
        }

        node.izq.accept(this); // izq |
        node.der.accept(this); // izq | der

        const isDerFloat = this.code.getTopObject().type === 'float';
        const der = this.code.popObject(isDerFloat ? f.FT0 : r.T0); // der
        const isIzqFloat = this.code.getTopObject().type === 'float';
        const izq = this.code.popObject(isIzqFloat ? f.FT1 : r.T1); // izq

        if (izq.type === 'string' && der.type === 'string') {
            switch (node.op) {
                case '==':
                    this.code.add(r.A0, r.ZERO, r.T1)
                    this.code.add(r.A1, r.ZERO, r.T0)
                    this.code.callBuiltin("compareString")
                    this.code.push(r.T0)
                    this.code.pushObject({ type: "boolean", length: 4})
                    return;
                case '+':
                    this.code.comment('Concatenacion de Strings');
                    this.code.add(r.A0, r.ZERO, r.T1);
                    this.code.add(r.A1, r.ZERO, r.T0);
                    this.code.callBuiltin('concatString');
                    this.code.pushObject({type: 'string', len: 4});
                    return;
                case '+=':
                    this.code.comment('Concatenacion de Strings');
                    this.code.add(r.A0, r.ZERO, r.T1);
                    this.code.add(r.A1, r.ZERO, r.T0);
                    this.code.callBuiltin('concatString');
                    this.code.pushObject({type: 'string', len: 4});
                    return;
                case '!=':
                    this.code.add(r.A0, r.ZERO, r.T1)
                    this.code.add(r.A1, r.ZERO, r.T0)
                    this.code.callBuiltin("compareString")
                    this.code.xori(r.T0, r.T0, 1)
                    this.code.push(r.T0)
                    this.code.pushObject({ type: "boolean", length: 4})
                    return;
                
            }
        }

        if (isIzqFloat || isDerFloat) {
            if (!isIzqFloat) this.code.fcvtsw(f.FT1, r.T1);
            if (!isDerFloat) this.code.fcvtsw(f.FT0, r.T0);

            switch (node.op) {
                case '+':
                    this.code.fadd(f.FT0, f.FT1, f.FT0);
                    break;
                case '-':
                    this.code.fsub(f.FT0, f.FT1, f.FT0);
                    break;
                case '*':
                    this.code.fmul(f.FT0, f.FT1, f.FT0);
                    break;
                case '/':
                    this.code.fdiv(f.FT0, f.FT1, f.FT0);
                    break;
                case '==':
                    this.code.feq(r.T0, f.FT0, f.FT1);
                    this.code.push(r.T0);
                    this.code.pushObject({ type: 'boolean', length: 4 });
                    return;
                case '>=':
                    this.code.fle(r.T0, f.FT0, f.FT1);
                    this.code.push(r.T0);
                    //type = 'boolean';
                    this.code.pushObject({type: 'boolean', len: 4});
                    return;
                case '<=':
                    this.code.fle(r.T0, f.FT1, f.FT0);
                    this.code.push(r.T0);
                    //type = 'boolean';
                    this.code.pushObject({type: 'boolean', len: 4});
                    return;
                case '>':
                    this.code.flt(r.T0, f.FT0, f.FT1);
                    this.code.push(r.T0);
                    //type = 'boolean';
                    this.code.pushObject({type: 'boolean', len: 4});
                    return;
                case '<':
                    this.code.flt(r.T0, f.FT1, f.FT0);
                    this.code.push(r.T0);
                    //type = 'boolean';
                    this.code.pushObject({type: 'boolean', len: 4});
                    return;
                case '+=':
                    this.code.fadd(f.FT0, f.FT1, f.FT0);
                    type = 'float';
                    break;
                case '-=':
                    this.code.fsub(f.FT0, f.FT1, f.FT0);
                    type = 'float';
                    break;
                case '!=':
                    this.code.feq(r.T0, f.FT1, f.FT0);
                    this.code.xori(r.T0, r.T0, 1);
                    this.code.push(r.T0);
                    this.code.pushObject({type: 'boolean', len: 4});
                    //type = 'boolean';
                    return;
                    }

                    this.code.pushFloat(f.FT0);
                    this.code.pushObject({ type: 'float', length: 4 });
                    return;
        }

        switch (node.op) {
            case '+':
                this.code.add(r.T0, r.T0, r.T1);
                this.code.push(r.T0);
                break;
            case '-':
                this.code.sub(r.T0, r.T1, r.T0);
                this.code.push(r.T0);
                break;
            case '*':
                this.code.mul(r.T0, r.T0, r.T1);
                this.code.push(r.T0);
                break;
            case '/':
                this.code.div(r.T0, r.T1, r.T0);
                this.code.push(r.T0);
                break;
            case '%':
                this.code.rem(r.T0, r.T1, r.T0);
                this.code.push(r.T0);
                break;
            case '==':
                this.code.xor(r.T0, r.T0, r.T1)
                this.code.seqz(r.T0, r.T0)
                this.code.push(r.T0)
                type = 'boolean';
                break;
            case '!=':
                this.code.xor(r.T0, r.T0, r.T1)
                this.code.snez(r.T0, r.T0)
                this.code.push(r.T0)
                type = 'boolean';
                break;
            case '>=':
                this.code.slt(r.T0, r.T1, r.T0)
                this.code.xori(r.T0, r.T0, 1)
                this.code.push(r.T0)
                type = 'boolean';
                break;
            case '<=':
                this.code.slt(r.T0, r.T0, r.T1)
                this.code.xori(r.T0, r.T0, 1)
                this.code.push(r.T0)
                type = 'boolean';
                break;
            case  '>':
                this.code.slt(r.T0, r.T0, r.T1)
                this.code.push(r.T0)
                type = 'boolean';
                break;
            case '<':
                this.code.slt(r.T0, r.T1, r.T0)
                this.code.push(r.T0)
                type = 'boolean';
                break;
            case '&&':
                this.code.and(r.T0, r.T0, r.T1)
                this.code.push(r.T0)
                type = 'boolean';
                break;
            case '||':
                this.code.or(r.T0, r.T0, r.T1)
                this.code.push(r.T0)
                type = 'boolean';
                break;
            case '+=':
                this.code.add(r.T0, r.T0, r.T1)
                this.code.push(r.T0)
                type = 'int';
                break;
            case '-=':
                this.code.sub(r.T0, r.T1, r.T0)
                this.code.push(r.T0)
                type = 'int';
                break;
            
        }
            
        this.code.pushObject({ type: 'int', length: 4 });
    }

    /**
     * @type {BaseVisitor['visitOperacionUnaria']}
     */
    visitOperacionUnaria(node) {
        node.exp.accept(this);
        let valor;

        this.code.popObject(r.T0);

        switch (node.op) {
            case '-':
                this.code.li(r.T1, 0);
                this.code.sub(r.T0, r.T1, r.T0);
                this.code.push(r.T0);
                this.code.pushObject({ type: 'int', length: 4 });
                break;
            case '!':
                this.code.li(r.T1, 1);
                this.code.xor(r.T0, r.T0, r.T1);
                this.code.push(r.T0);
                this.code.pushObject({type: 'boolean', len: 4});
                return;
        }
    }

    

    /**
     * @type {BaseVisitor['visitAgrupacion']}
     */
    visitAgrupacion(node) {
        return node.exp.accept(this);
    }

    visitPrint(node) {
        this.code.comment('Print');
        node.exp.accept(this);

        const isFloat = this.code.getTopObject().type === 'float';
        const object = this.code.popObject(isFloat ? f.FA0 : r.A0);

        const tipoPrint = {
            'int': () => this.code.printInt(),
            'string': () => this.code.printString(),
            'float': () => this.code.printFloat(),
            'boolean': () => this.code.printBoolean(),
            'char': () => this.code.printChar(),
        }
        
        tipoPrint[object.type]();
        this.code.printSalto();
    }

    /**
     * @type {BaseVisitor['visitDeclaracionVariable']}
     */
    visitDeclaracionVariable(node) {
        this.code.comment(`Declaracion Variable: ${node.id}`);
        node.exp.accept(this);

        if (this.insideFunction) {
            const localObject = this.code.getFrameLocal(this.frameDclIndex);
            const valueObj = this.code.popObject(r.T0);

            this.code.addi(r.T1, r.FP, -localObject.offset * 4);
            this.code.sw(r.T0, r.T1);

            // ! inferir el tipo
            localObject.type = valueObj.type;
            this.frameDclIndex++;

            return
        }

        this.code.tagObject(node.id);

        this.code.comment(`Fin declaracion Variable: ${node.id}`);
    }

    /**
     * @type {BaseVisitor['visitAsignacion']}
     */
    visitAsignacion(node) {
        this.code.comment(`Asignacion Variable: ${node.id}`);

        node.asgn.accept(this);
        const valueObject = this.code.popObject(r.T0);
        const [offset, variableObject] = this.code.getObject(node.id);

        if (this.insideFunction) {
            this.code.addi(r.T1, r.FP, -variableObject.offset * 4); // ! REVISAR
            this.code.sw(r.T0, r.T1); // ! revisar
            return
        }

        this.code.addi(r.T1, r.SP, offset);
        this.code.sw(r.T0, r.T1);

        variableObject.type = valueObject.type;

        this.code.push(r.T0);
        this.code.pushObject(valueObject);

        this.code.comment(`Fin Asignacion Variable: ${node.id}`);
    }


    /**
     * @type {BaseVisitor['visitReferenciaVariable']}
     */
    visitReferenciaVariable(node) {
        this.code.comment(`Referencia a variable ${node.id}: ${JSON.stringify(this.code.objectStack)}`);


        const [offset, variableObject] = this.code.getObject(node.id);

        if (this.insideFunction) {
            this.code.addi(r.T1, r.FP, -variableObject.offset * 4);
            this.code.lw(r.T0, r.T1);
            this.code.push(r.T0);
            this.code.pushObject({ ...variableObject, id: undefined });
            return
        }

        this.code.addi(r.T0, r.SP, offset);
        this.code.lw(r.T1, r.T0);
        this.code.push(r.T1);
        this.code.pushObject({ ...variableObject, id: undefined });

        // this.code.comment(`Fin Referencia Variable: ${node.id}`);
        this.code.comment(`Fin referencia de variable ${node.id}: ${JSON.stringify(this.code.objectStack)}`);
    }


    /**
     * @type {BaseVisitor['visitBloque']}
     */
    visitBloque(node) {
        this.code.comment('Inicio de bloque');

        this.code.newScope();

        node.dcls.forEach(d => d.accept(this));

        this.code.comment('Reduciendo la pila');
        const bytesToRemove = this.code.endScope();

        if (bytesToRemove > 0) {
            this.code.addi(r.SP, r.SP, bytesToRemove);
        }

        this.code.comment('Fin de bloque');
    }


    /**
     * @type {BaseVisitor['visitIf']}
     */
    visitIf(node) {
        this.code.comment('Inicio de If');

        this.code.comment('Condicion');
        node.cond.accept(this);
        this.code.popObject(r.T0);
        this.code.comment('Fin de condicion');
        /*
        // no else
        if (!cond) goto endIf
            ...
        endIf:

        // else
        if (!cond) goto else
            ...
        goto endIf
        else:
            ...
        endIf:

        */

        const hasElse = !!node.stmtFalse

        if (hasElse) {
            const elseLabel = this.code.getLabel();
            const endIfLabel = this.code.getLabel();

            this.code.beq(r.T0, r.ZERO, elseLabel);
            this.code.comment('Rama verdadera');
            node.stmtTrue.accept(this);
            this.code.j(endIfLabel);
            this.code.addLabel(elseLabel);
            this.code.comment('Rama falsa');
            node.stmtFalse.accept(this);
            this.code.addLabel(endIfLabel);
        } else {
            const endIfLabel = this.code.getLabel();
            this.code.beq(r.T0, r.ZERO, endIfLabel);
            this.code.comment('Rama verdadera');
            node.stmtTrue.accept(this);
            this.code.addLabel(endIfLabel);
        }

        this.code.comment('Fin del If');
    }

    /**
     * @type {BaseVisitor['visitWhile']}
     */
    visitWhile(node) {
        /*
        startWhile:
            cond
        if !cond goto endWhile
            stmt
            goto startWhile
        endWhile:
        */

        const startWhileLabel = this.code.getLabel();
        const prevContinueLabel = this.continueLabel;
        this.continueLabel = startWhileLabel;

        const endWhileLabel = this.code.getLabel();
        const prevBreakLabel = this.breakLabel;
        this.breakLabel = endWhileLabel;

        this.code.addLabel(startWhileLabel);
        this.code.comment('Condicion');
        node.cond.accept(this);
        this.code.popObject(r.T0);
        this.code.comment('Fin de condicion');
        this.code.beq(r.T0, r.ZERO, endWhileLabel);
        this.code.comment('Cuerpo del while');
        node.stmt.accept(this);
        this.code.j(startWhileLabel);
        this.code.addLabel(endWhileLabel);

        this.continueLabel = prevContinueLabel;
        this.breakLabel = prevBreakLabel;
    }

    /**
     * @type {BaseVisitor['visitFor']}
     */
    visitFor(node) {
        // node.cond
        // node.inc
        // node.stmt


        /*
            {
                init()
                startFor:
                    cond
                if !cond goto endFor
                    stmt
                incrementLabel:
                    inc
                    goto startFor
                endFor:
            } 
        */

        this.code.comment('For');

        const startForLabel = this.code.getLabel();

        const endForLabel = this.code.getLabel();
        const prevBreakLabel = this.breakLabel;
        this.breakLabel = endForLabel;

        const incrementLabel = this.code.getLabel();
        const prevContinueLabel = this.continueLabel;
        this.continueLabel = incrementLabel;

        this.code.newScope();

        node.init.accept(this);

        this.code.addLabel(startForLabel);
        this.code.comment('Condicion');
        node.cond.accept(this);
        this.code.popObject(r.T0);
        this.code.comment('Fin de condicion');
        this.code.beq(r.T0, r.ZERO, endForLabel);

        this.code.comment('Cuerpo del for');
        node.stmt.accept(this);

        this.code.addLabel(incrementLabel);
        node.inc.accept(this);
        this.code.popObject(r.T0);
        this.code.j(startForLabel);

        this.code.addLabel(endForLabel);

        this.code.comment('Reduciendo la pila');
        const bytesToRemove = this.code.endScope();

        if (bytesToRemove > 0) {
            this.code.addi(r.SP, r.SP, bytesToRemove);
        }

        this.continueLabel = prevContinueLabel;
        this.breakLabel = prevBreakLabel;

        this.code.comment('Fin de For');
    }

    /**
 * @type {BaseVisitor['visitForeach']}
 */
visitForeach(node) {
    this.code.comment('Inicio Foreach');

    const startFor = this.code.getLabel();
    
    const prevContinueLabel = this.continueLabel;
    this.continueLabel = startFor;


    const endFor = this.code.getLabel();

    const prevBreakLabel = this.breakLabel;
    this.breakLabel = endFor;

    

    const refArray = {
        id: node.id2,
        pos: []
    };
    this.visitReferenciaVariable(refArray);

    const [object,arrayObj] = this.code.getObject(node.id2);
    const length = arrayObj.len / 4;

    this.code.li(r.T2, length);

    this.code.li(r.T5, 0);  

    this.code.newScope();
    
    this.code.tagObject(node.id);

    this.code.addLabel(startFor);

    this.code.slt(r.T0, r.T5, r.T2);
    this.code.beq(r.T0, r.ZERO, endFor);

    this.code.la(r.T4, node.id2);
    this.code.li(r.T3, 4);
    this.code.mul(r.T3, r.T5, r.T3);
    this.code.add(r.T4, r.T4, r.T3);
    this.code.lw(r.T0, r.T4);

    const [offset, variableObject] = this.code.getObject(node.id);
    this.code.addi(r.T3, r.SP, offset);
    this.code.sw(r.T0, r.T3);

    node.stmt.accept(this);


    this.code.addi(r.T5, r.T5, 1);
    
    this.code.j(startFor);

    this.code.addLabel(endFor);

    const bytesToRemove = this.code.endScope();
    if (bytesToRemove > 0) {
        this.code.addi(r.SP, r.SP, bytesToRemove);
    }

    this.continueLabel = prevContinueLabel;
    this.breakLabel = prevBreakLabel;

    this.code.comment('Fin Foreach');
}


    /**
     * @type {BaseVisitor['visitSwitch']}
     */
    visitSwitch(node) {
        this.code.comment('Inicio Switch');
        
        // Evaluar la expresión del switch
        node.exp.accept(this);
        this.code.pop(r.T0);  // Valor del switch en T0
        
        const endSwitch = this.code.getLabel();
        const cases = node.cases || [];
        const labels = cases.map(() => this.code.getLabel());
        const defaultLabel = node.defa ? this.code.getLabel() : endSwitch;

        const breakLabel = this.breakLabel;
        this.breakLabel = endSwitch;

        cases.forEach((caso, index) => {
            this.code.push(r.T0);
            
            caso.exp.accept(this);
            this.code.pop(r.T1); 
            
            this.code.pop(r.T0);
            
            this.code.beq(r.T0, r.T1, labels[index]);
        });
        
        this.code.j(defaultLabel);
        
        cases.forEach((caso, index) => {
            this.code.addLabel(labels[index]);
            
            caso.stmt.forEach(stmt => stmt.accept(this));
            
            //this.code.j(endSwitch);
        });
        
        // Generar el código para el default si existe
        if (node.defa) {
            this.code.addLabel(defaultLabel);
            node.defa.forEach(stmt => stmt.accept(this));
        }
        
        this.code.addLabel(endSwitch);
        
        this.breakLabel = breakLabel;

        this.code.comment('Fin Switch');
    }


    /**
     * @type {BaseVisitor['node']}
     */
    visitBreak(node) {
        this.code.j(this.breakLabel);
    }

    /**
     * @type {BaseVisitor['node']}
     */
    visitContinue(node) {
        this.code.j(this.continueLabel);
    }

    /**
     * @type {BaseVisitor['visitFuncDcl']}
     */
    visitFuncDcl(node) {
        const baseSize = 2; // | ra | fp |

        const paramSize = node.params.length; // | ra | fp | p1 | p2 | ... | pn |

        const frameVisitor = new FrameVisitor(baseSize + paramSize);
        node.bloque.accept(frameVisitor);
        const localFrame = frameVisitor.frame;
        const localSize = localFrame.length; // | ra | fp | p1 | p2 | ... | pn | l1 | l2 | ... | ln |

        const returnSize = 1; // | ra | fp | p1 | p2 | ... | pn | l1 | l2 | ... | ln | rv |

        const totalSize = baseSize + paramSize + localSize + returnSize;
        this.functionMetada[node.id] = {
            frameSize: totalSize,
            returnType: node.tipo,
        }

        const instruccionesDeMain = this.code.instrucciones;
        const instruccionesDeDeclaracionDeFuncion = []
        this.code.instrucciones = instruccionesDeDeclaracionDeFuncion;

        node.params.forEach((param, index) => {
            this.code.pushObject({
                id: param.id,
                type: param.tipo,
                length: 4,
                offset: baseSize + index
            })
        });

        localFrame.forEach(variableLocal => {
            this.code.pushObject({
                ...variableLocal,
                length: 4,
                type: 'local',
            })
        });

        this.insideFunction = node.id;
        this.frameDclIndex = 0;
        this.returnLabel = this.code.getLabel();

        this.code.comment(`Declaracion de funcion ${node.id}`);
        this.code.addLabel(node.id);

        node.bloque.accept(this);

        this.code.addLabel(this.returnLabel);

        this.code.add(r.T0, r.ZERO, r.FP);
        this.code.lw(r.RA, r.T0);
        this.code.jalr(r.ZERO, r.RA, 0);
        this.code.comment(`Fin de declaracion de funcion ${node.id}`);

        // Limpiar metadatos
        for (let i = 0; i < paramSize + localSize; i++) {
            this.code.objectStack.pop(); // ! aqui no retrocedemos el SP, hay que hacerlo más adelanto
        }

        this.code.instrucciones = instruccionesDeMain

        instruccionesDeDeclaracionDeFuncion.forEach(instruccion => {
            this.code.instrucionesDeFunciones.push(instruccion);
        });

    }

    /**
     * @type {BaseVisitor['visitLlamada']}
     */
    visitLlamada(node) {
        if (!(node.callee instanceof ReferenciaVariable)) return

        const nombreFuncion = node.callee.id;

        this.code.comment(`Llamada a funcion ${nombreFuncion}`);

        const embebidas = {
            parseInt: () => {
                node.args[0].accept(this);
                this.code.popObject(r.A0);
                this.code.callBuiltin('parseInt');
                this.code.pushObject({ type: 'int', length: 4 });
            },
            parseFloat: () => {
                node.args[0].accept(this);
                this.code.popObject(r.A0);
                this.code.callBuiltin('parseFloat');
                this.code.pushObject({ type: 'float', length: 4 });
            },
            toString: () => {
                node.args[0].accept(this);
                this.code.popObject(r.A0);
                this.code.callBuiltin('toString');
                this.code.pushObject({ type: 'string', length: 4 });
            },
            toLowerCase: () => {
                node.args[0].accept(this);
                this.code.popObject(r.A0);
                this.code.callBuiltin('toLowerCase');
                this.code.pushObject({ type: 'string', length: 4 });
            },
            toUpperCase: () => {
                node.args[0].accept(this);
                this.code.popObject(r.A0);
                this.code.callBuiltin('toUpperCase');
                this.code.pushObject({ type: 'string', length: 4 });
            }
        }

        if (embebidas[nombreFuncion]) {
            embebidas[nombreFuncion]();
            return
        }

         // ---- LLamadas a funcion foraneas

         const etiquetaRetornoLlamada = this.code.getLabel();

         // 1. Guardar los argumentos
         this.code.addi(r.SP, r.SP, -4 * 2)
         node.args.forEach((arg) => {
             arg.accept(this)
         });
         this.code.addi(r.SP, r.SP, 4 * (node.args.length + 2))
 
         // Calcular la dirección del nuevo FP en T1
         this.code.addi(r.T1, r.SP, -4)
 
         // Guardar direccion de retorno
         this.code.la(r.T0, etiquetaRetornoLlamada)
         this.code.push(r.T0)
 
         // Guardar el FP
         this.code.push(r.FP)
         this.code.addi(r.FP, r.T1, 0)
 
         const frameSize = this.functionMetada[nombreFuncion].frameSize
         this.code.addi(r.SP, r.SP, -(frameSize - 2) * 4)
 
 
         // Saltar a la función
         this.code.j(nombreFuncion)
         this.code.addLabel(etiquetaRetornoLlamada)
 
         // Recuperar el valor de retorno
         const returnSize = frameSize - 1;
         this.code.addi(r.T0, r.FP, -returnSize * 4)
         this.code.lw(r.A0, r.T0)
 
         // Regresar el FP al contexto de ejecución anterior
         this.code.addi(r.T0, r.FP, -4)
         this.code.lw(r.FP, r.T0)
 
         // Regresar mi SP al contexto de ejecución anterior
         this.code.addi(r.SP, r.SP, frameSize * 4)
 
 
         this.code.push(r.A0)
         this.code.pushObject({ type: this.functionMetada[nombreFuncion].returnType, length: 4 })
 
         this.code.comment(`Fin de llamada a funcion ${nombreFuncion}`);
    }


    /**
     * @type {BaseVisitor['visitReturn']}
     */
    visitReturn(node) {
        this.code.comment('Inicio Return');

        if (node.exp) {
            node.exp.accept(this);
            this.code.popObject(r.A0);

            const frameSize = this.functionMetada[this.insideFunction].frameSize
            const returnOffest = frameSize - 1;
            this.code.addi(r.T0, r.FP, -returnOffest * 4)
            this.code.sw(r.A0, r.T0)
        }

        this.code.j(this.returnLabel);
        this.code.comment('Final Return');
    }



}