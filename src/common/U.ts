// import * as detectzoooom from 'detect-zoom'; alternative: https://www.npmjs.com/package/zoom-level
import React, {ReactElement} from "react";
// import {Mixin} from "ts-mixer";
import type {AbstractConstructor, Constructor, Dictionary, GObject, Pointer, Temporary} from "../joiner";
import {
    CreateElementAction,
    DAttribute,
    DClassifier,
    DLog,
    DModelElement,
    DPointerTargetable,
    DRefEdge,
    DReference,
    GraphPoint,
    DState,
    DUser,
    LUser,
    Json,
    JsType,
    LClassifier,
    LGraphElement,
    LModelElement,
    LNamedElement,
    LogicContext,
    MyError,
    RuntimeAccessible,
    Selectors,
    TODO,
    windoww, RuntimeAccessibleClass, PointedBy, DViewElement
} from "../joiner";
import Swal from "sweetalert2";
import {AccessModifier} from "../api/data";
// import KeyDownEvent = JQuery.KeyDownEvent; // https://github.com/tombigel/detect-zoom broken 2013? but works

console.warn('loading ts U log');

@RuntimeAccessible('Color')
export class Color {
    r: number;
    g: number;
    b: number;

    constructor(r: number, g: number, b: number) {
        this.r = r;
        this.g = g;
        this.b = b;
    }

    static fromHex(hex:string): Color {
        return undefined as any;
    }
    static fromHLS({h, l, s}:{h: number, l:number, s: number}): Color {
        return undefined as any;
    }
    getHex(): string {
        return undefined as any;
    }
    mixWith(c: Color): void {

    }
    getHLS(): {h: number, l:number, s: number} {
        return undefined as any;
    }
    duplicate(): Color {
        return undefined as any;
    }
}
@RuntimeAccessible('U')
export class U {

    // damiano: eseguire una funzione costa in performance, anche se è brutto fare questi cast
    static wrapper<T>(obj: any): T {
        return obj as unknown as T;
    }
    // damiano: mi sa che c'era un metodo l.__serialize or something
    static json(dElement: GObject): Json {
        return JSON.parse(JSON.stringify(dElement.__raw));
    }

    public static fatherChain(me: LModelElement): Pointer<DModelElement, 0, 'N', LModelElement> {
        if(!me) return [];  // without this line go through delete error
        const fathers: Pointer<DModelElement, 0, 'N', LModelElement>= [me.id];
        const toCheck: LModelElement[] = [me];
        while(toCheck.length > 0) {
            const element = toCheck.pop();
            if(element && element.father) {
                fathers.push(element.father.id);
                toCheck.push(element.father);
            }
        }
        return fathers;
    }

    /// maxDepth = 2 is the minimum to check the content of objects inside usageDeclarations or node state. like node.errors.naming
    static isShallowEqualWithProxies(obj1: GObject, obj2: GObject, skipKeys: Dictionary<string, any>={}, out?: {reason?: string},
                                     depth: number = 0, maxDepth: number = 2, returnIfMaxDepth:boolean = false): boolean {
        let tobj1 = obj1 === null ? 'null' : typeof obj1;
        let tobj2 = obj2 === null ? 'null' : typeof obj2;
        if (obj1 === obj2) {
            // if (out) { out.reason = "identical objects"; }
            return true; }
        if (tobj1 !== tobj2) { if (out) { out.reason = "type changed: " + tobj1 + " --> " + tobj2; } return false; }

        // at this point: same type, but different values
        switch (tobj1) {
            case "number": // if both re nan it fails
                // NB: infinities are not nan, and they compare with === like normal numbers. weird js...
                if (isNaN(obj1 as any) && isNaN(obj2 as any)) return true;
                break;
            default:
                console.error("unexpected case in isshallowequal:", {tobj1, obj1, obj2});

                // primitive with different values
                if (out) {
                    if (undefined === tobj1) out.reason = 'primitive value newly introduced';
                    else if (undefined === tobj2) out.reason = 'primitive value got deleted';
                    else out.reason = 'primitive value changedd';
                }
                return false;

            case "function":
                if (obj1.toString() === obj2.toString()) break;
                if (out) out.reason = 'function body changed';
                return false;

            case "object":
                let o1Raw = obj1.__raw;
                let o2Raw = obj2.__raw;
                if (o1Raw) {
                    if (!o2Raw) {
                        if (out) out.reason = o1Raw.className + 'replaced by another object type:' + o2Raw?.className;
                        return false;
                    }
                    obj1 = o1Raw;
                    obj2 = o2Raw;
                }
                // for proxies and DObjects
                if (obj1.clonedCounter !== undefined && obj2.clonedCounter !== obj1.clonedCounter) {
                    if (out) out.reason = 'clonedCounter difference ' + obj1.clonedCounter+ ' != ' + obj2.clonedCounter;
                    return false;
                }/*
                if (obj1.className !== obj2.className) {
                 removed: too unlikely to happen that a DObject is raplaced in the same path with another type of DObject with same clonedCounter
                 nd it's checked anyway in for(let key in obj1)
                    if (out) out.reason = o1Raw.className + 'replaced by another object type:' + o2Raw?.className;
                    return false;
                }*/
                if (Array.isArray(obj1)) {
                    if (obj1.length !== obj2.length) {
                        if (out) out.reason = 'array length different: ' + obj1.length + " !== " + obj2.length;
                        return false;
                    }
                    if (!Array.isArray(obj2)){
                        if (out) out.reason = 'array became an object';
                        return false;
                    }
                }
                if (depth > maxDepth) {
                    // to debug and see where is too deep, make returnIfMaxDepth = false, so the path is displayed in out.reason
                    if (out) out.reason = 'max depth reached, assumed ' + returnIfMaxDepth;
                    return returnIfMaxDepth;
                }
                for (let key in obj1) {
                    if (key in skipKeys) continue;
                    let oldp: any = obj2[key];
                    let newp: any = obj1[key];
                    if (oldp === newp) continue;
                    if (!U.isShallowEqualWithProxies(newp, oldp, skipKeys, out, depth +1, maxDepth, returnIfMaxDepth)) {
                        if (out) out.reason = '['+key+']'+out.reason;
                        return false;
                    }
                }
                // just check for keys that were in props and are not in nextProps
                for (let key in obj2) {
                    if ((key in skipKeys) || (key in obj1)) continue;
                    if (out) out.reason = "deleted subobject property: " + key;
                    return false;
                }
            // else retIfMaxDepthReached; split the above if
        }



        return true;
    }

    public static deepEqual (x: GObject, y: GObject): boolean {
        const tx = typeof x, ty = typeof y;
        return x && y && tx === 'object' && tx === ty ? (
            Object.keys(x).length === Object.keys(y).length && Object.keys(x).every(key => U.deepEqual(x[key], y[key]))
        ) : (x === y);
    }

    public static sleep(s: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, s * 1000));
    }

    public static getRandomString(length: number): string {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let randomString = '';
        let index = 0;
        while(index < length) {
            const randomNumber = Math.floor(Math.random() * characters.length);
            randomString += characters.charAt(randomNumber);
            index += 1;
        }
        return randomString;
    }

    public static alert(title: string, text: string) {
        let color = 'text-';
        switch(title.toLowerCase()) {
            case 'error': color += 'danger'; break;
            default: color += 'primary'
        }
        let html = '<style>body.swal2-no-backdrop .swal2-container {background-color: rgb(0 0 0 / 60%) !important}</style>';
        html += `<div><b><label class='fs-5 mb-2 text-uppercase ${color}'>${title}</label></b><hr/>`;
        html += `<label class='fs-6 mt-3'>${text}</label><br/>`;
        const result = Swal.fire({
            html: html,
            backdrop: false,
            showCloseButton: true,
            showConfirmButton: false
            //confirmButtonText: 'GOT IT'
        })
    }

    public static popup(element: any) {
        let html = '<style>body.swal2-no-backdrop .swal2-container {background-color: rgb(0 0 0 / 60%) !important}</style>'+ element;
        const result = Swal.fire({
            html: html,
            backdrop: false,
            showCloseButton: true,
            showConfirmButton: false
            //confirmButtonText: 'GOT IT'
        })
    }
    public static filteredPointedBy(data: LModelElement, label: string): LModelElement[] {
        const models: LModelElement[] = [];
        for(let dict of data.pointedBy) {
            const pointedBy = dict.source.split('.');
            if(pointedBy.length === 3 && pointedBy[2] === label) {
                models.push(LModelElement.fromPointer(pointedBy[1]));
            }
        }
        return models;
    }

    public static getFatherFieldToDelete(data: LModelElement): keyof DModelElement|null {
        const father = data.father;
        let field = '';
        switch(father.className + '|' + data.className) {
            // DPackage
            case 'DModel|DPackage': field = 'packages'; break;
            case 'DPackage|DPackage': field = 'subpackages'; break;
            // DEnumerator and DClass
            case 'DPackage|DEnumerator':
            case 'DPackage|DClass': field = 'classifiers'; break;
            // DAttribute
            case 'DClass|DAttribute': field = 'attributes'; break;
            // DReference
            case 'DClass|DReference': field = 'references'; break;
            // DOperation
            case 'DClass|DOperation': field = 'operations'; break;
            // DEnumLiteral
            case 'DEnumerator|DEnumLiteral': field = 'literals'; break;
            // DObject
            case 'DModel|DObject': field = 'objects'; break;
            // DParameter
            case 'DOperation|DParameter': field = 'parameters'; break;
            // DValue
            case 'DObject|DValue': field = 'features'; break;
            // Error
            default: return null;
        }
        return field as keyof DModelElement;
    }

    public static initializeValue(typeclassifier: undefined|DClassifier|LClassifier|Pointer<DClassifier, 1, 1, LClassifier>): string {
        // if(!classifier) return 'null';
        const pointer: Pointer = typeof typeclassifier === 'string' ? typeclassifier : (typeclassifier as DClassifier)?.id;
        const me: LNamedElement = LNamedElement.fromPointer(pointer);
        switch(me?.name) {
            default:
            case 'EString': return '';
            case 'EChar':  return 'a';
            case 'EInt': return '0';
            case 'ELong': return '0';
            case 'EShort': return '0';
            case 'Byte': return '0';
            case 'EFloat': return '0';
            case 'EDouble': return '0';
            case 'EBoolean': return 'false';
            case 'EDate': return new Date().toJSON().slice(0,10);
        }
        return 'null';
    }

    public static orderChildrenByTimestamp(context: LogicContext): LModelElement[] {
        const children = context.proxyObject.children;
        if(children && children.length > 0) {
            let orderedChildren = new Map<number, LModelElement>();
            for(let child of children) {
                let timestamp = child.id.slice(-13);
                orderedChildren.set(+timestamp, child);
            }
            orderedChildren = new Map([...orderedChildren.entries()].sort());
            return [...orderedChildren.values()];
        } else return [];
    }


    public static followPath(base: GObject, path: string): {chain: GObject[], lastObject: GObject, keys:string[], lastkey: string, lastval: any, failedRemainingPath: string[]} {
        let patharr = path.split('.');
        let base0 = base;
        let ret: {chain: GObject[], lastObject: GObject, keys: string[], lastkey: string, lastval: any, failedRemainingPath: string[]}  = {} as any;
        ret.keys = patharr;
        ret.chain = [base];
        let lastObject = base;

        for (let i = 0; i < patharr.length; i++) {
            let path = ret.lastkey = patharr[i];
            lastObject = base;
            base = base[path];
            ret.chain.push(base);
            if (typeof base !== "object" || i + 1 === patharr.length) {
                ret.failedRemainingPath = patharr.slice(i);
                ret.lastval = base;
                ret.lastObject = lastObject;
                return ret;
            }
        }
        throw new Error("followPath should never reach here");
        return ret;
    }

    static multiReplaceAllKV(a: string, kv: string[][] = []): string {
        const keys: string[] = [];
        const vals: string[] = [];
        let i: number;
        for (i = 0; i < kv.length; i++) { keys.push(kv[i][0]); vals.push(kv[i][0]); }
        return U.multiReplaceAll(a, keys, vals); }

    // if replacement is empty, it will be filled with '';
    // if replacement length < searchText, replacement will be filled with copies of his elements cycling from 0 to his length until his length matches searchText.length
    static multiReplaceAll(a: string, searchText: string[] = [], replacement: string[] = []): string {
        Log.ex(searchText.length !== replacement.length, 'search and replacement must be have same length: ' + searchText.length + "vs" + replacement.length + " " +JSON.stringify(searchText) + "   " + JSON.stringify(replacement));
        let i = -1;
        while (replacement.length !== 0 && replacement.length < searchText.length) replacement.push(replacement[++i]);
        i = -1;
        while (++i < searchText.length) { a = U.replaceAll(a, searchText[i], replacement[i]); }
        return a; }

    static replaceAll(str: string, searchText: string, replacement: string | undefined, debug: boolean = false, warn: boolean = true): string {
        if (!str) { return str; }
        return str.split(searchText).join(replacement||''); }

    static toFileName(a: string = 'nameless.txt'): string {
        if (!a) { a = 'nameless.txt'; }
        a = U.multiReplaceAll(a.trim(), ['\\', '//', ':', '*', '?', '<', '>', '"', '|'],
            ['[lslash]', '[rslash]', ';', '°', '_', '{', '}', '\'', '!']);
        return a;
    }


    // warn: this check if the scope containing the function is strict, to check if a specific external scope-file is strict
    // you have to write inline the code:        var isStrict = true; eval("var isStrict = false"); if (isStrict)...
    // @ts-ignore
    public static isStrict: boolean = ( function() { return !this; })();

    // merge properties with first found first kept (first parameters have priority on override). only override null|undefined values, not (false|0|'') values
    static objectMergeInPlace<A extends object, B extends object>(output: A, ...objarr: B[]): void {
        const out: GObject = output;
        if (objarr)
        for (let o of objarr) {
            if (o && typeof o === "object")
            for (let key in o) {
                // noinspection BadExpressionStatementJS,JSUnfilteredForInLoop
                out[key] ?? (out[key] = o[key]);
            }
        }
    }

    public static log(obj: unknown, label: string = '###') {
        console.clear();
        console.log(label, obj);
    }

    static removeEmptyObjectKeys(obj: GObject): void{
        for (let key of Object.keys(obj)) {
            if (obj[key] === null || obj[key] === undefined) delete obj[key];
        }
    }

    // usage example: objectMergeInPlace_conditional(baseobj, (out, key, current) => !out[key] && current[key];
    // culprit of "couldn't find intersection" problem: condition type: (out:A&B, key: string | number, current:B, objarr?: B[], indexOfCurrent?: number) => boolean
    static objectMergeInPlace_conditional<A extends GObject, B extends GObject>(output: A, condition: (...a:any)=>any, ...objarr: B[]): A & B {
        const out: GObject<"A & B"> = output;
        let i: number = 0;
        for (let o of objarr) for (let key in o) { if (condition(out, key, o, objarr, i++)) out[key] = o[key]; }
        return out as  A & B; }

    static buildFunctionDocumentation(f: Function): {parameters: {name: string, defaultVal: string | undefined, typedesc: string | null}[], returns: string | undefined, f: Function, fname: string | undefined, isLambda: boolean, signature: string} {
        Log.e(!JsType.isFunction(f), 'getFunctionSignature() parameter must be a function', f);
        // let parameters: {name: string, defaultVal: string, typedesc: string}[] = []; //{name: '', defaultVal: undefined, typedesc: ''};
        let ret: {parameters: {name: string, defaultVal: string | undefined, typedesc: string | null}[], returns: string | undefined, f: Function, fname: string | undefined, isLambda: boolean, signature: string}
            = {parameters: [], returns: undefined, f: f, fname: undefined, isLambda: null as Temporary, signature: ''};
        let str: string = f.toString();
        let starti: number = str.indexOf('(');
        let endi: number;
        let parcounter: number = 1;
        for (endi = starti + 1; endi < str.length; endi++) {
            if (str[endi] === ')' && --parcounter === 0) break;
            if (str[endi] === '(') parcounter++; }

        let parameterStr = str.substring(starti + 1, endi);
        // console.log('getfuncsignature starti:', starti, 'endi', endi, 'fname:', str.substr(0, starti), 'parameterStr:', parameterStr);
        ret.fname = str.substr(0, starti).trim();
        ret.fname = ret.fname.substr(0, ret.fname.indexOf(' ')).trim();
        // 2 casi: anonimo "function (par1...){}" e "() => {}", oppure nominato: "function a1(){}"
        if (ret.fname === '' || ret.fname === 'function') ret.fname = undefined; // 'anonymous function';



        let returnstarti: number = str.indexOf('/*', endi + 1);
        let returnendi: number = -1;
        let bodystarti: number = str.indexOf('{', endi + 1);
        if (returnstarti === -1 || bodystarti !== -1 && bodystarti < returnstarti) {
            // no return type or comment is past body
            ret.returns = undefined;
        } else {
            returnendi = str.indexOf('*/', returnstarti + 2);
            ret.returns = str.substring(returnstarti + 2, returnendi).trim();
            bodystarti = str.indexOf('{', returnendi); }
        if (ret.returns === '') ret.returns = undefined;

        // is lambda if do not have curly body or contains => between return comment and body
        // console.log('isLambda:', bodystarti, str.substring(Math.max(endi, returnendi)+1, bodystarti));
        ret.isLambda =  bodystarti === -1 || str.substring((window as any).Math.max(endi, returnendi)+1, bodystarti).trim() === '=>';

        let regexp = /([^=\/\,]+)(=?)([^,]*?)(\/\*[^,]*?\*\/)?,/g; // only problem: the last parameter won't match because it does not end with ",", so i will append it everytime.
        let match;
        while ((match = regexp.exec(parameterStr + ','))) {
            // match[0] is always the full match (not a capture group)
            // match[2] can only be "=" or empty string
            // nb: match[4] can be "/*something*/" or "," a single , without spaces.
            let par: {name: string, defaultVal: string | undefined, typedesc: string | null} = {name: match[1], defaultVal: match[3], typedesc: match[4] && match[4].length > 1 ? match[4] : null};
            par.name = par.name.trim();
            par.defaultVal = par.defaultVal ? par.defaultVal.trim() : undefined;
            par.typedesc = par.typedesc && par.typedesc && par.typedesc.length > 1 ? par.typedesc.substring(2, par.typedesc.length - 2).trim() || null : null;
            ret.parameters.push(par); }
        // set signature

        ret.signature = '' + (ret.fname ? '/*' + ret.fname + '*/' : '') + '(';
        let i: number;
        for (i = 0; i < ret.parameters.length; i++) {
            let par = ret.parameters[i];
            ret.signature += (i === 0 ? '' : ', ') + par.name + (par.typedesc ? '/*' + par.typedesc + '*/' : '') + (par.defaultVal ? ' = ' + par.defaultVal : '');
        }
        ret.signature += ')' + (ret.returns ? '/*' + ret.returns + '*/' : '');
        return ret; }



    // NB: need to use result.apply(context) to have a usable "this"
    // if you want to pass a parameter to the function, pass it through scope insteand !! AND UNDECLARE the parameter in function string signature !!
    //if inner funcstr have parameters, need to declare them as codestrParamNames arr, and pass them in that order, after the scope which is fixed as first argument.
    // rest values are declared with ellipsis in codestrParamNames
    // !!! scope passed here, is only used for keys. values are not bound. scope is set as first parameter when you call the function.
    // context is bound, but can be re-assigned by calling .bind(), .call() or .apply(), so neither context nor scope assigned in parsing phase are final.
    // innerfunc params do not have to match the name on the string function, but only the correct amount. they can have any name i think, but i list them correctly to documentate.
    public static parseFunctionWithContextAndScope<ParamNames extends string[], T extends Function = Function, TT extends GObject | undefined = GObject>(
        codeStr0: string | Function, context0: GObject | undefined, scope0: TT, codestrParamNames?: ParamNames, protectShallowValues: boolean = false, doIdentifierValidation: boolean = false):
        (TT extends undefined ? (...params: any)=>any : (scopee:TT, ...paramss: { [K in keyof ParamNames]: any;})=>any){
        if (!codestrParamNames) codestrParamNames = [] as any;

        let codeStr: string = typeof codeStr0 === "function" ? codeStr0.toString() : codeStr0;
        let scopeParams: string = '';
        let scope: GObject | undefined;
        let context: GObject | undefined;
        if (protectShallowValues) {
            if (scope0) { //scope = {...scope0}; scope.__proto__ = scope0.__proto__; // for...in gets values in __proto__ too, {...o} instead gets only hasOwnProperty copied
                scope = {};
                for (let k in scope0) scope[k] = scope0[k];
            } else scope = undefined;
            if (context0) { // context = {...context0}; context.__proto__ = context0.__proto__;
                context = {};
                for (let k in context0) context[k] = context0[k];
            } else context = undefined;
        } else { scope = scope0; context = context0; }


        if (scope) {
            let scopekeys: string[] = Object.keys(scope);
            if (doIdentifierValidation) scopekeys.map((key)=>{
                key = key?.trim() || '';
                if (!key || !U.validIdentfierRegexp.test(key)) return undefined;
                return key;
            }).filter(k=>!!k);
            scopeParams = '{'+scopekeys.join(',')+'}';
        }

        let innerFuncParams = (codestrParamNames as string[]).join(',');
        let _jevalfunc = undefined as any; // is set by eval
        const evalmode = false;
        console.log('parseFunctionWithContextAndScope', {codeStr, scope, context, params:{scopeParams, innerFuncParams}});
        scopeParams = scopeParams && innerFuncParams ? scopeParams + ',' + innerFuncParams : scopeParams + innerFuncParams;
        if (evalmode) {
            codeStr = "_jevalfunc = function ("+scopeParams+") { return ("+codeStr+")("+innerFuncParams+") }";
            eval(codeStr);
        } else {
            _jevalfunc = new Function(scopeParams, " return ("+codeStr+")("+innerFuncParams+")");
        }

        console.log('parseFunctionWithContextAndScope', {_jevalfunc, params:{scopeParams}});

        if (context) return _jevalfunc.bind(context);
        else return _jevalfunc;
    }/*
    public static evalInContextAndScope<T = any>(...a:any):any {return undefined}
    public static evalInContextAndScopeNew<T = any>(...a:any):any {return undefined}*/
    public static evalInContextAndScopeNew<T = any>(codeStr: string | ((...a:any)=>any), context0: GObject, injectScopeToo: boolean,
                                                    protectShallowValues?: boolean, doIdentifierValidation?: boolean): T {
        return U.evalInContextAndScope(codeStr, context0, injectScopeToo ? context0 : undefined, protectShallowValues, doIdentifierValidation);
    }

    // important! this is a simplified version. the correct one allows unicode chars and is 11kb long of regex expression
    public static validIdentfierRegexp = /^[a-zA-Z_$][0-9a-zA-Z_$]*$/;

    // warn: if return is not explicitly inserted (if that's the case set imlicitReturn = false) with a scope and the code have multiple statemepts it will fail.
    // can modify scope AND context
    // warn: can access global scope (window)
    // if the context (this) is missing it will take the scope as context.
    // warn: cannot set different scope and context, "this" della funzione sovrascrive anche il "this" interno allo scope come chiave dell'oggetto
    // warn: !context && scope is impossible, so it gets autofixed by assigning context = scope; check Log messages inside function for details.
    // warn: context && scope is impossible if context !== scope and cannot be hotfixed, that will cause a crash.
    public static evalInContextAndScope<T = any>(codeStr: string | ((...a:any)=>any), scope0: GObject | undefined, context0?: GObject,
                                                 protectShallowValues?: boolean, doIdentifierValidation?:boolean): T {
        // console.log('evalInContextAndScope', {codeStr, scope, context});
        // scope per accedere a variabili direttamente "x + y"
        // context per accedervi tramite this, possono essere impostati come diversi.
        if (!scope0 && !context0) { Log.ex(true, 'evalInContextAndScope: must specify at least one of scope || context', {codeStr, scope0, context0}); }

        // scope.this = scope.this || context || scope; non funziona
        // console.log('"with(this){ return eval( \'" + codeStr + "\' ); }"', "with(this){ return eval( '" + codeStr + "' ); }");
        // eslint-disable-next-line no-restricted-syntax,no-with
        // if (allowScope && allowContext) { return function(){ with(this){ return eval( '" + codeStr + "' ); }}.call(scopeAndContext); }
        // if (allowScope && allowContext) { return new Function( "with(this){ return eval( '" + codeStr + "' ); }").call(scopeAndContext); }
        let _ret: T = null as any;
        let scope: GObject | undefined;
        let context: GObject | undefined;
        if (protectShallowValues) {
            if (scope0) { scope = {...scope0, __proto__: scope0.__proto__}; scope.__proto__ = scope0.__proto__; } else scope = undefined;
            if (context0) { context = {...context0, __proto__: context0.__proto__}; context.__proto__ = context0.__proto__; } else context = undefined;
        } else { scope = scope0; context = context0; }

        Log.w(!!(!context && scope),
            "evalInContextAndScope() Context is mandatory, as scope && !context case is not working properly \n" +
            "because scope is simulated by declaring variables pointing to \"this\" objects instead of doing a full deep copy.\n" +
            "Autofixed by assigning context = scope;");
        Log.eDev(!!((context && scope) && (context !== scope)),
            "evalInContextAndScope() Context and scope cannot be different if both present.\n" +
            "Because scope is simulated by declaring variables pointing to \"this\" objects instead of doing a full deep copy.");
        if (!context) context = scope; // se creo un nuovo contesto pulisco anche lo scope dalle variabili locali di questa funzione.


        /*
        if (allowScope && allowContext) { return new Function( "with(this){ return eval( '" + codeStr.replace(/'/g, "\\'") + "' ); }").call(scopeAndContext); }
        if (!allowScope && allowContext) { return new Function( "return eval( '" + codeStr + "' );").call(scopeAndContext); }
        if (allowScope && !allowContext) { return eval("with(scopeAndContext){ " + codeStr + " }"); }*/
//      U.pe(!!scope && U.isStrict(), 'cannot change scope while in strict mode ("use strict")');
        let prefixDeclarations: string = "", postfixDeclarations: string = '';
        if (scope) {
            if (U.isStrict) {
                for (let key in scope) {
                    if (doIdentifierValidation) {
                        key = key.trim();
                        if (!key || !U.validIdentfierRegexp.test(key)) continue;
                    }
                    // anche se li assegno non cambiano i loro valori nel contesto fuori dall'eval, quindi lancio eccezioni con const.
                    prefixDeclarations += "const " + key + "=this." + key + ";";
                    postfixDeclarations = "";
                }
            } else {
                prefixDeclarations = "with(" + (context ? "this._eval." : "") + "scope){ ";
                postfixDeclarations = " }";
            }
        }

        if (scope && context) {
            if (typeof codeStr === "function") { codeStr = codeStr.toString(); } // functions cannot change scope (with statement is deprecated)
            (context as any)._eval = {__codeStr: codeStr}; // necessary to reach this._eval.codeStr inside the eval()
            // console.log("evalincontextandscope: ", {fullCodeStr: prefixDeclarations + "return eval( this._eval._codeStr );" + postfixDeclarations, codeStr});
            _ret = new (Function as any)(prefixDeclarations + "; return eval( this._eval.__codeStr );" + postfixDeclarations).call(context);
            delete (context as any)._eval;
        } else
        if (!scope && context) {
            if (typeof codeStr === "function") {
                _ret = (function(...a: any){ return (codeStr as Function).call(context, ...a)}) as any;
                // _ret = (...a: any)=>codeStr.call(context, ...a);
            } else {
                // cannot just eval(codeStr).call(context) because the result might not be a function but only a piece of code or an expression
                (context as any)._eval = {__codeStr: codeStr}; // necessary to reach this._eval.codeStr inside the eval()
                _ret = new (Function as any)("return eval( this._eval.__codeStr );").call(context);
                delete (context as any)._eval;
                // this below  is not good, as i need to quote the expanded result of codeStr,
                // but since it might contain quotes as well i would need to escape them too.
                // _ret = new (Function as any)("return eval( " + codeStr + " );").call(context);
            }
        } else
        if (scope && !context) {
            // NB: potrei creare lo scope con "let key = value;" per ogni chiave, ma dovrei fare json stringify e non è una serializzazione perfetta e può dare eccezioni(circolarità)
            // console.log({isStrict: U.isStrict, eval: "eval(" + prefixDeclarations + codeStr + postfixDeclarations + ")"});
            if (typeof codeStr === "function") { codeStr = codeStr.toString(); } // functions cannot change scope (with statement is deprecated)
            _ret = eval(prefixDeclarations + codeStr + postfixDeclarations); }

        return _ret; }

    //T extends ( ((...args: any[]) => any) | (() => any)
    public static execInContextAndScope<T extends (...args: any) => any>(func: T, parameters: Parameters<T>, scope?: GObject, context?: GObject): ReturnType<T>{
        Log.l(false, 'execInCtxScope', {func, parameters, scope, context});
        let ret: any;
        const _eval = {context, scope, func, parameters: parameters || []};
        let prefixDeclarations: string = "", postfixDeclarations: string = '';
        if (scope) {
            if (U.isStrict) {
                for (let key in scope) {
                    // anche se li assegno non cambiano i loro valori nel contesto fuori dall'eval, quindi lancio eccezioni con const.
                    prefixDeclarations += "const " + key + " = this." + key + "; ";
                    postfixDeclarations = "";
                }
            } else {
                prefixDeclarations = "with(" + (context ? "this._eval." : "") + "scope){ ";
                postfixDeclarations = " }";
            }
        }
        if (!scope && !context) { Log.ex(true, 'execInContextAndScope: must specify at least one of scope || context', {func, scope, context}); }
        if (!context) context = scope; // se creo un nuovo contesto pulisco anche lo scope dalle variabili locali di questa funzione.
        if (scope && context) {
            context._eval = _eval;
            // will the scope work with "with" outside the function body?
            ret = new Function( prefixDeclarations + "return this._eval.func.apply(this._eval.context, this._eval.parameters);" + postfixDeclarations).call(context);
            delete context._eval;
        }
        if (!scope && context) { return _eval.func.apply(_eval.context, _eval.parameters); }
        if (scope && !context) {
            // todo: non credo funzioni, _eval non dovrebbe essere accessibile dopo la "with" forse devo fare scope._eval = _eval;
            return eval(prefixDeclarations + "return _eval.func(..._eval.parameters);" + postfixDeclarations); }
        return ret; }

    // warn: aggiunge un layer di scope ma ha accesso anche agli scope precedenti (del chiamante della funzione e superiori)
    // warn2: può modificare lo scope internamente all'eval ma ogni cambiamento è perso all'uscita dell'esecuzione (modifica copie)
    // warn3: gli oggetti nested variabili dentro oggetti dello scope) sono modificabili con modifiche persistenti perchè vengono pasate per puntatore.
    // warn4: richiede un return per leggere il valore
    // insomma: sta funzione fa schifo ma non c'è di meglio e non puoi nè permettere nè vietare completamente le modifiche allo scope.
    private static execInScope_DO_NOT_USE(codeStr: string, scope: GObject) {
        return (new Function(...Object.keys(scope), codeStr))(...Object.values(scope));
    }

    // can modify context in-place, requires "this" before variable
    private static evalInContext(js: string, context: GObject): unknown {
        //# Return the results of the in-line anonymous function we .call with the passed context
        return function() { return eval(js); }.call(context);
    }/*
    / *
    // NO: ha 2 problemi: il contesto non è persistente e puoi accedere al contesto solo con "this" ma non direttamente usando i nomi delle variabili
    public static evalInContext(contextObj: GObject, code: string): any{
        return U.evalContextFunction.call(contextObj || {}, code);
    }

    // only create a context for "this", wich is bound by .call(), should never be called without .call()
    private static evalContextFunction(code: string): any { eval(code); }
*/
    public static highOrderFunctionExampleTyped<T extends (...args: any[]) => ReturnType<T>>(func: T): (...funcArgs: Parameters<T>) => ReturnType<T> {
        const funcName = (func as any).cname || func.name;

        // Return a new function that tracks how long the original took
        return (...args: Parameters<T>): ReturnType<T> => {
            console.time(funcName);
            const results = func(...args);
            console.timeEnd(funcName);
            return results; };
    }

    static asClass<T extends Function>(obj: any, classe: T, elseReturn: T | null = null): null | T { return obj instanceof classe ? obj as any as T: elseReturn; }
    static asString<T>(propKey: unknown, elseReturn: T | null = null): string | null | T { return typeof propKey === 'string' ? propKey : elseReturn; }
    static isString(propKey: unknown): boolean { return typeof propKey === 'string'; }

    static loadScript(path: string, useEval: boolean = false): void {
        const script = document.createElement('script');
        script.src = path;
        script.type = 'text/javascript';
        Log.eDev(useEval, 'loadScript', 'useEval','useEval todo. potrebbe essere utile per avviare codice fuori dalle funzioni in futuro.');
        document.body.append(script); }

    static ancestorArray<T extends Element>(domelem: T, stopNode?: Node, includeSelf: boolean = true): Array<T> {
        // [0]=element, [1]=father, [2]=grandfather... [n]=document
        if (domelem === null || domelem === undefined) { return []; }
        const arr = includeSelf ? [domelem] : [];
        let tmp: T = domelem.parentNode as T;
        while (tmp !== null && tmp !== stopNode) {
            arr.push(tmp);
            tmp = tmp.parentNode as T; }
        return arr; }

    static toHtml<T extends Element>(html: string, container?: Element, containerTag: string = 'div'): T {
        if (!container) { container = document.createElement(containerTag); }
        Log.e(!html || html === '', 'toHtml', 'require a non-empty string', html);
        container.innerHTML = html;
        const ret: T = container.firstChild as any;
        if (ret) container.removeChild(ret);
        return ret; }

    public static levenshtein(a: string, b: string): number {
        if (!a.length) return b.length;
        if (!b.length) return a.length;
        let cost = (a.charAt(a.length - 1) === b.charAt(b.length - 1)) ? 0 : 1;
        return (window as any).Math.min(
            U.levenshtein(a.substring(0, a.length - 1), b) + 1,
            U.levenshtein(a, b.substring(0, b.length - 1)) + 1,
            U.levenshtein(a.substring(0, a.length - 1), b.substring(0, b.length - 1)) + cost,
        );
    }

    public static getClosestPropertyName(names: string[], name: string): string {
        let lowest = Infinity;
        return names.reduce(function(previous, current) {
            let distance = U.levenshtein(current, name);
            if (distance < lowest) {
                lowest = distance;
                return current;
            }
            return previous;
        }, '');
    }
    public static getClosestPropertyNames(names: string[], name: string): string[] {
        let distances: {distance: number, value: string}[] = names.map( value => { return {distance: U.levenshtein(value, name), value}; });
        return distances.sort( (a, b) => a.distance - b.distance).map( e => e.value);
    }

    //todo for console
    public static autoCorrectProxy<T extends GObject>(target: T, recursive: boolean, logger: Console): ProxyHandler<T> {
        return new Proxy(target, {
            get: function(target, name) {
                let namestr = U.asString(name, null);
                if (!namestr) return undefined;
                if (name in target) return target[namestr];
                const suggestions: string[] = U.getClosestPropertyNames(Object.getOwnPropertyNames(target), namestr);
                logger.warn(`${namestr} is not defined, did you meant ${suggestions[0]}?\t\nother suggestions:`, suggestions);
                return namestr && target[suggestions[0]];
            },
        });
    }

    static arrayRemoveAll<T>(arr: Array<T>, elem: T, debug: boolean = false): void {
        let index;
        if (!arr) return;
        while (true) {
            index = arr.indexOf(elem);
            Log.l(debug, 'ArrayRemoveAll: index: ', index, '; arr:', arr, '; elem:', elem);
            if (index === -1) { return; }
            arr.splice(index, 1);
            Log.l(debug, 'ArrayRemoveAll RemovedOne:', arr);
        }
    }

    static arrayUnique<T>(arr: T[]): Array<T> { return [ ...new Set<T>(arr)]; }

    static fileReadContent(file: File, callback: (content :string) => void): void {
        const textType = /text.*/;
        try { if (!file.type || file.type.match(textType)) {
            let reader = new FileReader();
            reader.onload = function(e) { callback( '' + reader.result ); };
            reader.readAsText(file);
            return;
        } } catch(e) { Log.e(true, "Exception while trying to read file as text. Error: |", e, "|", file); }
        Log.e(true, "Wrong file type found: |", file ? file.type : null, "|", file); }

    static fileRead(onChange: (e: Event, files: FileList | null, contents?: string[]) => void, extensions: string[] | FileReadTypeEnum[], readContent: boolean): void {
        // $(document).on('change', (e) => console.log(e));
        console.log("importEcore: pre file reader");
        myFileReader.show(onChange, extensions, readContent);
    }

    public static clear(htmlNode: Element): void {
        if (htmlNode) while (htmlNode.firstChild) { htmlNode.removeChild(htmlNode.firstChild); }
    }

    static clearAllTimeouts(): void {
        const highestTimeoutId: number = setTimeout(() => {}, 1) as any;
        for (let i = 0 ; i < highestTimeoutId ; i++) { clearTimeout(i); }
    }

    static getStackTrace(sliceCalls: number = 2): string[] {
        const ret: string | undefined = Error().stack;
        // try { var a = {}; a.debug(); } catch(ex) { ret = ex.stack; }
        // if (Array.isArray(ret)) return ret;
        if (!ret) return ['UnknownStackTrace'];
        const arr: string[] = ret.split('\n');
        // first 2 entries are "Erorr" and "getStackTrace()"
        return sliceCalls > 0 ? arr.slice( sliceCalls ) : arr; }

    // 0 for caller, 1 for caller of caller, -1 for current function, up to -4 to see internal layers (useless)
    public static getCaller(stacksToSkip: number = 0): string {
        const stack: string[] = this.getStackTrace(4);
        // erase getStackTrace() and isFirstTimeCalled() + Error() first stack + n° of layer the caller wants.
        return stack[stacksToSkip]; }

    private static gotcalledby: Dictionary<string, boolean> = {};

    // todo: use in Log.once
    // returns true only the first time this line is reached, false in loops >1 loop, false in recursion >1 recursion, false even days after the first execution unless the page is reloaded
    public static isFirstTimeCalledByThisLine(stacksToSkip: number = 0): boolean {
        const caller: string = this.getCaller(stacksToSkip);
        if (U.gotcalledby[caller]) return false;
        return U.gotcalledby[caller] = true; }

    public static lineKey(): string { return this.getCaller(0); }

    // Prevent the backspace key from navigating back.
    static preventBackSlashHistoryNavigation(event: JQuery.KeyDownEvent): boolean {
        if (!event || !event.key || event.key.toLowerCase() !== 'backspace') { return true; }
        const types: string[] = ['text', 'password', 'file', 'search', 'email', 'number', 'date',
            'color', 'datetime', 'datetime-local', 'month', 'range', 'search', 'tel', 'time', 'url', 'week'];
        const srcElement: JQuery<any> = $((event as any)['srcElement'] || event.target);
        const disabled = srcElement.prop('readonly') || srcElement.prop('disabled');
        if (!disabled) {
            if (srcElement[0].isContentEditable || srcElement.is('textarea')) { return true; }
            if (srcElement.is('input')) {
                const type = srcElement.attr('type');
                if (!type || types.indexOf(type.toLowerCase()) > -1) { return true; }
            }
        }
        event.preventDefault();
        return false; }

    static SetMerge<T>(modifyFirst: boolean = true, ...iterables: Iterable<T>[]): Set<T> {
        const set: Set<T> = modifyFirst ? iterables[0] as Set<T>: new Set<T>();
        Log.e(!(set instanceof Set), 'U.SetMerge() used with modifyFirst = true requires the first argument to be a set');
        for (let iterable of iterables) { for (let item of iterable) { set.add(item); } }
        return set; }

    // merge with unique elements
    static ArrayMergeU(arr1: any[], ...arr2: any[]): void { U.ArrayMerge0(true, arr1, arr2); }
    // merge without unique check
    static ArrayMerge(arr1: any[], ...arr2: any[]): void { U.ArrayMerge0(false, arr1, arr2); }
    // implementation
    static ArrayMerge0(unique: boolean, arrtarget: any[], ...arrays: any[]): void {
        if (!arrtarget || !arrays) return;

        if (unique) { for (let arri of arrays) for (let e of arri) U.ArrayAdd(arrtarget, e); }
        else { for (let arri of arrays) Array.prototype.push.apply(arrtarget, arri); }
    }

    static ArrayAdd<T>(arr: Array<T>, elem: T, unique: boolean = true, throwIfContained: boolean = false): boolean {
        Log.ex(!arr || !Array.isArray(arr), 'ArrayAdd arr null or not array:', arr);
        if (!unique) { arr.push(elem); return true; }
        if (arr.indexOf(elem) === -1) { arr.push(elem); return true; }
        Log.ex(throwIfContained, 'ArrayAdd element already contained:', arr, elem);
        return false; }


    private static maxID: number = 0;
    public static idPrefix: string = '';
    // static getID(): string { return U.idPrefix + U.maxID++; }
    static getID: Generator<number> = function* idgenerator(): Generator<number> { let i: number = 0; while(true) yield i++; }();


    static getType(param: any): string {
        switch (typeof param) {
            default: return typeof param;
            case 'object':
                return (param?.constructor as typeof RuntimeAccessibleClass)?.cname || param?.className || "{_rawobject_}";
            case 'function': // and others
                return "geType for function todo: distinguish betweeen arrow and classic";
        }
    }

    static stringCompare(s1: string, s2: string): -1 | 0 | 1 { return (s1 < s2) ? -1 : (s1 > s2) ? 1 : 0; }

    static endsWith(str: string, suffix: string | string[]): boolean {
        if (Array.isArray(suffix)) {
            for (let suf of suffix) {
                if (U.endsWith(str, suf)) return true;
            }
            return false;
        }
        return str.length >= suffix.length && str.lastIndexOf(suffix) === str.length - suffix.length;
    }


    static arrayMergeInPlace<T>(arr1: T[], ...otherArrs: T[][]): T[] {
        for (const arr of otherArrs) arr1.push.apply(arr1, arr || []);
        return arr1; }

    static getEndingNumber(s: string, ignoreNonNumbers: boolean = false, allowDecimal: boolean = false): number {
        let i = s.length;
        let numberEnd = -1;
        while (--i > 0) {
            if (!isNaN(+s[i])) { if (numberEnd === -1) { numberEnd = i; } continue; }
            if (s[i] === '.' && !allowDecimal) { break; }
            if (s[i] === '.') { allowDecimal = false; continue; }
            if (!ignoreNonNumbers) { break; }
            if (numberEnd !== -1) { ignoreNonNumbers = false; }
        }
        s = numberEnd === -1 ? '1' : s.substring(i, numberEnd);
        return +parseFloat(s); }

    static increaseEndingNumber(s: string, allowLastNonNumberChars: boolean = false, allowDecimal: boolean = false, increaseWhile?: ((x: string) => boolean)): string {
        let regexpstr = '([0-9]+' + (allowDecimal ? '|[0-9]+\\.[0-9]+' : '') + ')' + (allowLastNonNumberChars ? '[^0-9]*' : '') + '$';
        const matches: RegExpExecArray | null = new RegExp(regexpstr, 'g').exec(s); // Global (return multi-match) Single line (. matches \n).
        // S flag removed for browser support (firefox), should work anyway.
        let prefix: string;
        let num: number;
        if (!matches) {
            prefix = s;
            num = 2;
        } else {
            Log.ex(matches.length > 2, 'parsing error: /' + regexpstr + '/gs.match(' + s + ')');
            let i = s.length - matches[0].length;
            prefix = s.substring(0, i);
            num = 1 + (+matches[1]);
        }
        if (increaseWhile) while (increaseWhile(prefix + num)) { num++; }
        return prefix + num; }


    public static shallowEqual(objA: GObject, objB: GObject): boolean {
        if (objA === objB) { return true; }

        if (!objA || !objB || typeof objA !== 'object' || typeof objB !== 'object') { return false; }

        var keysA = Object.keys(objA);
        var keysB = Object.keys(objB);
        if (keysA.length !== keysB.length) return false;

        // if (keysA.length !== keysB.length) { return false; }
        // Test for A's keys different from B.
        // var bHasOwnProperty = hasOwnProperty.bind(objB);
        for (let keya in objA) if (!Object.is(objA[keya], objB[keya])) return false;

        // for (var i = 0; i < keysA.length; i++) if (!bHasOwnProperty(keysA[i]) || objA[keysA[i]] !== objB[keysA[i]]) { return false; }
        return true;
    }

    // returns true only if parameter is already a number by type. UU.isNumber('3') will return false
    static isNumber(o: any): o is number { return typeof o === "number" && !isNaN(o); }

    public static getAllPrototypes(constructor: Constructor, chainoutoutrecursive: GObject[] = [], currentRecursion = 0, maxRecursion = 20, cache: boolean = true): GObject[] {
        // console.log('getAllPrototypes:', {name: constructor.name, currentRecursion, constructor, chainoutoutrecursive});
        if (cache && (constructor as any).__allprototypes) return (constructor as any).__allprototypes;
        let prototype = (constructor.prototype?.name) && constructor.prototype;
        let __proto__ = (constructor.__proto__?.name) && constructor.__proto__;
        if (!prototype && !__proto__ || currentRecursion >= maxRecursion) return chainoutoutrecursive;
        if (prototype) chainoutoutrecursive.push(prototype);
        if (__proto__) chainoutoutrecursive.push(__proto__);
        if (prototype) U.getAllPrototypes(prototype, chainoutoutrecursive, currentRecursion + 1, maxRecursion);
        if (__proto__) U.getAllPrototypes(__proto__, chainoutoutrecursive, currentRecursion + 1, maxRecursion);
        if (cache) (constructor as any).__allprototypes = chainoutoutrecursive;
        return chainoutoutrecursive;
    }

    public static classIsExtending(subconstructor: Constructor | AbstractConstructor, superconstructor: Constructor | AbstractConstructor): boolean {
        return (superconstructor as typeof DPointerTargetable)?._extends?.includes(subconstructor as any) || false;
        // return U.getAllPrototypes(subconstructor).includes(superconstructor);
    }

    static isObject(v: GObject|any, returnIfNull: boolean = true, returnIfUndefined: boolean = false, retIfArray: boolean = false): boolean {
        if (v === null) { return returnIfNull; }
        if (v === undefined) { return returnIfUndefined; }
        if (Array.isArray(v)) { return retIfArray; }
        // nb: mind that typeof [] === 'object'
        return typeof v === 'object'; }

    static objectFromArrayValues(arr: (string | number)[]): Dictionary<string | number, boolean> {
        // @ts-ignore
        return arr.reduce((acc, val) => { acc[val] = true; return acc; }, {});
        /*let ret: Dictionary = {};
        for (let val of arr) { ret[val] = true; }
        return ret;*/
    }

    static toBoolString(bool: boolean, ifNotBoolean: boolean = false): string { return bool === true ? 'true' : (bool === false ? 'false' : '' + ifNotBoolean); }
    static fromBoolString<T extends any>(str: string | boolean): boolean;
    static fromBoolString<T extends any>(str: string | boolean, defaultVal?: T): boolean | T;
    static fromBoolString<T extends any>(str: string | boolean, defaultVal?: T, allowNull?: boolean): boolean | null | T;
    static fromBoolString<T extends any>(str: string | boolean, defaultVal: T = false as any, allowNull: boolean = false, allowUndefined: boolean = false): boolean | null | undefined | T {
        str = ('' + str).toLowerCase();
        if (allowNull && (str === 'null')) return null;
        if (allowUndefined && (str === 'undefined')) return undefined;

        if (str === "true" || str === 't' || str === '1') return true;
        // if (defaultVal === true) return str === "false" || str === 'f' || str === '0'; // false solo se è esplicitamente false, true se ambiguo.
        if (str === "false" || str === 'f' || str === '0') return false;
        return defaultVal;
    }

    static arrayDifference<T>(starting: T[], final: T[]): {added: T[], removed: T[], starting: T[], final: T[]} {
        let ret: {added: T[], removed: T[], starting: T[], final: T[]} = {} as any;
        ret.starting = starting;
        ret.final = final;
        if (!starting) starting = [];
        if (!final) final = [];
        ret.removed = Uarr.arraySubtract(starting, final, false); // start & !end
        ret.added = Uarr.arraySubtract(final, starting, false); // end & !start
        return ret;
    }

    // returns <"what changed from old to neww"> and in nested objects recursively
    // todo: how can i tell at what point it's the fina lvalue (might be a nestedobj) and up to when it's a delta to follow and unroll?   using __isAdelta:true ?
    // NB: this returns the delta that generates the future. if you want the delta that generate the past one, invert parameter order.
    public static objectDelta<T extends object>(old: T, neww: T, deep: boolean = true): Partial<T>{
        let newwobj: GObject = neww;
        let oldobj: GObject = old;
        if (old === neww) return {};
        let diff = U.objdiff(old, neww); // todo: optimize this, remove the 3 loops below and add those directly in U.objdiff(old, neww, ret); writing inside the obj in third parameter

        let ret: GObject = {}; // {__isAdelta:true};
        for (let key in diff.added) { ret[key] = newwobj[key]; }
        for (let key in diff.changed) {
            let subold = oldobj[key];
            let subnew = newwobj[key];
            if (typeof subold === typeof subnew && typeof subold === "object") { ret[key] = deep ? U.objectDelta(subold, subnew, true) : subnew; }
            else ret[key] = subnew;
        }
        // todo: add to variable naming rules: can't start with "_-", like in "_-keyname", it means "keyname" removed in undo delta
        let removedprefix = ""; // "_-";
        for (let key in diff.removed) { ret[removedprefix + key] = undefined; } //newwobj[key]; }
        // console.log("objdiff", {old, neww, diff, ret});
        return ret as Partial<T>;
    }

    // difference react-style. lazy check by === equality field by field. parameters are readonly
    public static objdiff<T extends GObject>(old:T, neww: T): {removed: Partial<T>, added: Partial<T>, changed: Partial<T>, unchanged: Partial<T>} {
        // let ret: GObject = {removed:{}, added:{}, changed:{}};
        let ret: {removed: Partial<T>, added: Partial<T>, changed: Partial<T>, unchanged: Partial<T>}  = {removed:{}, added:{}, changed:{}, unchanged: {}};
        if (!neww && !old) { return ret; }
        if (!neww) { ret.removed = old; return ret; }
        if (!old) { ret.added = neww; return ret; }
        // let oldkeys: string[] = Object.keys(old); let newkeys: string[] = Object.keys(neww);

        let key: any;
        for (key in old) {
            // if (neww[key] === undefined){
            // if neww have a key with undefined value, it counts (and should) as having that property key defined
            if (!(key in neww)){ (ret.removed as GObject)[key] = old[key]; }
            else if (neww[key] === old[key]) { (ret.unchanged as GObject)[key] = old[key] }
            else (ret.changed as GObject)[key] = old[key];
        }
        for (let key in neww) {
            if (!(key in old)){ (ret.added as GObject)[key] = neww[key]; }
        }
        return ret;
    }
    /*  {a: { b: { c1: 1, c2:2, c3:3 } }, d: 1 }     ---->  {"a.b.c1":1, "a.b.c2":2, "a.b.c3":3. "d":1}*/
    public static flattenObjectToRoot(obj: GObject, prefix: string = '', pathseparator: string = '.'): GObject{
        return Object.keys(obj).reduce((acc: GObject, k: string) => {
            const pre = prefix.length ? prefix + pathseparator : '';
            if (typeof obj[k] === 'object') Object.assign(acc, U.flattenObjectToRoot(obj[k], pre + k, pathseparator));
            else acc[pre + k] = obj[k];
            return acc;
        }, {});
    }

    // from {a:{aa:true, ab:"ab"}, b:4} to ["a.aa = true", "a.ab = \"ab\"", "a.b = 4"]
    // maxkeylength is max length of any individual key, after it it will become: superlongpath --> supe...path
    // maxsubpaths is how many subpaths are displayed at most. after it it will be: super.rea.lly.long.pa.th --> super.rea.pa.th
    public static ObjectToAssignementStrings<R extends {str: string, fullstr: string, path:string[], fullpath:string[], val: string, fullvalue: string, pathlength?: number}>
    (obj: GObject, maxkeylength: number = 10, maxsubpaths: number = 6, maxvallength: number = 20, toolongreplacer: string = "…", out?:{best: R}&R[], quotestrings: boolean = true): {best: string}&string[] {
        const pathseparator = ".";
        const valueseparator = " = ";
        const filterrow = (rowpaths: string[]) => { return (!rowpaths.includes("clonedCounter") && !rowpaths.includes("pointedBy")); };
        let flatten = U.flattenObjectToRoot(obj, '', pathseparator);
        let i = -1;
        let tmp;
        let ret: {best: string} & string[] = [] as GObject as {best: string} & string[];
        tmp = (maxkeylength - toolongreplacer.length)/2;
        let halfpath = { start: (window as any).Math.floor(tmp), end: (window as any).Math.ceil(tmp) };
        tmp = (maxvallength - toolongreplacer.length)/2;
        let halfval = { start: (window as any).Math.floor(tmp), end: (window as any).Math.ceil(tmp) };
        tmp = (maxsubpaths - toolongreplacer.length)/2;
        let halfsubpaths = { start: (window as any).Math.floor(tmp), end: (window as any).Math.ceil(tmp) };


        let bestpathsize = 0;
        let best: R | null = null;
        let countsize = (total: number, arrelem: string): number => total + arrelem.length;
        const filterbest = (row: R) => {
            row.pathlength = row.fullstr.length; // row.fullpath.reduce<number>(countsize, 0);
            if (!best || bestpathsize < row.pathlength && filterrow(row.fullpath)) {
                best = row; bestpathsize = row.pathlength;
                if (out) out.best = best;
                ret.best = best.str;
            }
        }
        console.log("u get assignements", {flatten, obj});

        for (let key in flatten) {
            let row: R = {fullpath: key.split(pathseparator), fullstr: key} as R;
            // if (!filterrow(row.fullpath)) continue;
            // stringify(undefined) = undefined, so i add + ""
            try {
                if (!quotestrings && typeof flatten[key] === "string") row.fullvalue = flatten[key];
                else row.fullvalue = JSON.stringify(flatten[key]) + "";
            } catch(e) { row.fullvalue = "⁜not serializable⁜"; }
            // console.log("U get assignements loop", {row, key, flatten, obj});
            row.val = row.fullvalue.length <= maxvallength ? row.fullvalue : row.fullvalue.substring(0, halfval.start) + toolongreplacer + row.fullvalue.substring(halfval.start);
            if (row.fullpath.length > maxsubpaths) {
                row.path = [...row.fullpath];
                row.path.splice( halfsubpaths.start, row.fullpath.length - halfsubpaths.start - halfsubpaths.end, toolongreplacer);
            } else row.path = row.fullpath;

            // row.path = row.fullpath.length <= maxsubpaths ? row.fullpath : [...row.fullpath.slice(0, halfsubpaths.start), ...row.fullpath.toomanyarraycopies];
            row.path = row.path.map((p: string) => (p.length <= maxkeylength ? p : p.substring(0, halfpath.start) + toolongreplacer + p.substring(p.length - halfpath.end)));
            if (out) { out.push(row); }
            row.str = row.path.join(pathseparator) + valueseparator + row.val;
            ret.push( row.str );
            filterbest(row);
        }
        return ret;
    }


    static download(filename: string = 'nameless.txt', text: string = '', debug: boolean = true): void {
        if (!text) { return; }
        filename = U.toFileName(filename);
        const htmla: HTMLAnchorElement = document.createElement('a');
        const blob: Blob = new Blob([text], {type: 'text/plain', endings: 'native'});
        const blobUrl: string = URL.createObjectURL(blob);
        Log.l(debug, text + '|\r\n| <-- rn, |\n| <--n.');
        htmla.style.display = 'none';
        htmla.href = blobUrl;
        htmla.download = filename;
        document.body.appendChild(htmla);
        htmla.click();
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(htmla); }

    static formatXml(xml: string): string {
        const reg = /(>)\s*(<)(\/*)/g;
        const wsexp = / *(.*) +\n/g;
        const contexp = /(<.+>)(.+\n)/g;
        xml = xml.replace(reg, '$1\n$2$3').replace(wsexp, '$1\n').replace(contexp, '$1\n$2');
        const pad: string = '' || '\t';
        let formatted = '';
        const lines = xml.split('\n');
        let indent = 0;
        let lastType = 'other';
        // 4 types of tags - single, closing, opening, other (text, doctype, comment) - 4*4 = 16 transitions
        const transitions: GObject = {
            'single->single': 0,
            'single->closing': -1,
            'single->opening': 0,
            'single->other': 0,
            'closing->single': 0,
            'closing->closing': -1,
            'closing->opening': 0,
            'closing->other': 0,
            'opening->single': 1,
            'opening->closing': 0,
            'opening->opening': 1,
            'opening->other': 1,
            'other->single': 0,
            'other->closing': -1,
            'other->opening': 0,
            'other->other': 0
        };
        let i = 0;
        for (i = 0; i < lines.length; i++) {
            const ln = lines[i];

            // Luca Viggiani 2017-07-03: handle optional <?xml ... ?> declaration
            if (ln.match(/\s*<\?xml/)) {
                formatted += ln + '\n';
                continue;
            }
            // ---

            const single = Boolean(ln.match(/<.+\/>/)); // is this line a single tag? ex. <br />
            const closing = Boolean(ln.match(/<\/.+>/)); // is this a closing tag? ex. </a>
            const opening = Boolean(ln.match(/<[^!].*>/)); // is this even a tag (that's not <!something>)
            const type = single ? 'single' : closing ? 'closing' : opening ? 'opening' : 'other';
            const fromTo = lastType + '->' + type;
            lastType = type;
            let padding = '';

            indent += transitions[fromTo];
            let j: number;
            for (j = 0; j < indent; j++) {
                padding += pad;
            }
            if (fromTo === 'opening->closing') {
                formatted = formatted.substr(0, formatted.length - 1) + ln + '\n'; // substr removes line break (\n) from prev loop
            } else {
                formatted += padding + ln + '\n';
            }
        }

        return formatted.trim(); }


    // https://stackoverflow.com/questions/13861254/json-stringify-deep-objects  implementation with depth
    static circularStringify(obj: GObject, replacer?: null | ((key: string, value: any) => any), space?: string | number, maxDepth_unsupported: number = 100): string {
        const cache: any[] = [];
        return JSON.stringify(obj, (key, value: any) => {
            if (typeof value === 'object' && value !== null) {
                // Duplicate reference found, discard key
                if (cache.includes(value)) return "[Circular Reference]"; // might happen both before and after the replacer func
                if (replacer){
                    value = replacer(key, value);
                    if (cache.includes(value)) return "[Circular Reference]"; // might happen both before and after the replacer func
                }
                // Store value in our collection
                cache.push(value);
            }
            return value;
        }, space);
    }

    static getFirstNumber(s: string, allowDecimalDot: boolean = true, allowDecimalComma: boolean = true, valueifmismatch: any = null): number {
        let commamode = (allowDecimalComma ? (allowDecimalDot ?"(\\.|\\,)" : "\\,") : (allowDecimalDot ? "\\." : "will not use this regex"));
        let floatregex = new RegExp("-?" + commamode  + "?\\d+(" + commamode + "\\d{1,2})?");
        let intregex = /-?\d+/;
        let ret: any;
        if (allowDecimalDot || allowDecimalComma) ret = floatregex.exec(s);
        else ret = intregex.exec(s);
        ret = ret && ret[0]; // first match
        if (ret === null) return valueifmismatch;

        let tmpindex:number;
        if (allowDecimalComma) ret = U.replaceAll(ret, ",", ".");
        // while (allowDecimalComma && (tmpindex = ret.indexOf(",")) !== ret.lastIndexOf(",")) ret.substring(tmp+1) // ret.indexOf(.)
        while ((allowDecimalDot || allowDecimalComma) && (tmpindex = ret.indexOf(".")) !== ret.lastIndexOf(".")) ret = ret.substring(tmpindex+1) // ret.indexOf(.)
        // if (ret[0]==="-" && (ret[1]==="," || ret[1]===".")) ret = "-0."+ret.substring(2); automatically done bu js.    +"-.5" = -0.5
        return +ret;
    }

    // faster than jquery, underscore and many native methods checked https://stackoverflow.com/a/59787784
    public static isEmptyObject(obj: GObject | undefined): boolean {
        for(var i in obj) return false;
        return true;
    }

    private static pairArrayElementsRepeatFunc<T>(val: T, index: number, arr:T[]): T[]{ return [arr[index], arr[index+1]] }
    private static pairArrayElementsReducerFunc<T>(accumulator: T[][], value: T, index: number, array: T[]):T[][] {
        if (index % 2 === 0) accumulator.push(array.slice(index, index + 2));
        return accumulator; }

    // from arr[] to arr[][]. if is with repetitions is: [1,2], [2,3], [3,4]... (ret.length = source.length-1)
    // if without repetitions is: [1,2], [3,4].... (ret.length = Math.ceil(source.length/2);
    public static pairArrayElements<T>(arr:T[], withRepetitions:boolean = false):T[][] {
        if (withRepetitions) { return arr.map(U.pairArrayElementsRepeatFunc).slice(0, arr.length-1); }
        return arr.reduce( U.pairArrayElementsReducerFunc as ((accumulator: T[][], value: T, index: number, array: T[]) => T[][]), []); }

    // removes line // and block /**/ comments  todo: can likely be improved by a regular expression
    public static decomment_all(str: string): string { return this.decomment_line(this.decomment_block(str)); }
    // removes line comments //
    public static decomment_line(str: string, trimLines: boolean = true): string {
        return str
            .split("\n")
            .map(s=> { let i = s.indexOf("//"); s = (i === -1 ? s : s.substring(i)); return trimLines ? s.trim() : s; } )
            .join("\n");
    }
    // removes block comments /**/
    public static decomment_block(str: string): string {
        // let maxcomments = 100;
        while(true){
            // if (--maxcomments===0) break;
            let s: number = str.indexOf("/*");
            if (s === -1) break;
            let e: number = str.indexOf("*/", s+1);
            if (e === -1) e = str.length;
            str = str.substring(0, s) + str.substring(e+2);
        }
        return str; }

    static uppercaseFirstLetter<T extends (string | GObject<"jsx">)>(str: T): T {
        if (typeof str !== "string") return str;
        return str.charAt(0).toUpperCase() + str.slice(1) as T;
    }

    // CAREFUL! it's imperfect.
    // Does not handle strings starting with ( that are not ()=> arrow functions
    // or codes whose last chars are () but not in (function)() form
    static wrapUserFunction(str: string): string {
        str = str.trim();
        if (str[0]!=='(' || str.indexOf("function") !== 0) {
            str = "()=>{" + str + "\n}"; // last \n important for line comments //
        }
        if (str[str.length - 2] !== "(" || str[str.length - 1] !== ")") str = "(" + str + ")()";
        return str;
    }

    // adds ellipsis in the middle of a string to truncate it when it's too long.
    public static stringMiddleCut<T extends boolean | undefined, RET extends string | string[] = T extends true ? string[] : string>
    (str: string, maxLength: number, ellipsisChar: string = '…', asArray?: T): RET{
        if (!str as unknown || maxLength < 0 || str.length <= maxLength) return (asArray ? [str] : str) as RET;
        var midpoint = Math.ceil(str.length / 2);
        var toremove = str.length - maxLength + ellipsisChar.length; // makes room for the additional ellipsis too
        var lstrip = Math.ceil(toremove/2); // left strip is the bigger one if odd chars
        var rstrip = toremove - lstrip;
        if (asArray) return [str.substring(0, midpoint-lstrip), ellipsisChar, str.substring(midpoint+rstrip)] as RET;
        else return str.substring(0, midpoint-lstrip) + ellipsisChar + str.substring(midpoint+rstrip) as RET;
    }
}
export class DDate{
    static cname: string = "DDate";

    public static addDay(date: Date, offset: number, inplace: boolean): Date {
        const ret: Date = inplace ? date : new Date(date);
        ret.setDate(date.getDate() + offset);
        return ret;
    }
    public static addMonth(date: Date, offset: number, inplace: boolean): Date {
        const ret: Date = inplace ? date : new Date(date);
        ret.setMonth(date.getMonth() + offset);
        return ret;
    }
    public static addYear(date: Date, offset: number, inplace: boolean): Date {
        const ret: Date = inplace ? date : new Date(date);
        ret.setFullYear(date.getFullYear() + offset);
        return ret;
    }
}

export class myFileReader {
    private static input: HTMLInputElement = null as any;
    private static fileTypes: string[] = null as any;
    private static onchange: (e: Event) => void = null as any;
    // constructor(onchange: (e: ChangeEvent) => void = null, fileTypes: FileReadTypeEnum[] | string[] = null) { myFileReader.setinfos(fileTypes, onchange); }
    private static setinfos(fileTypes: undefined | FileReadTypeEnum[] | string[], onchange: (e: Event, files: FileList | null, contents: string[] | undefined ) => void, readcontent: boolean) {
        myFileReader.fileTypes = (fileTypes || myFileReader.fileTypes) as string[];
        const debug: boolean = false;
        debug&&console.log('fileTypes:', myFileReader.fileTypes, fileTypes);
        myFileReader.input = document.createElement('input');
        const input: HTMLInputElement = myFileReader.input;
        myFileReader.onchange = function (e: Event): void {
            if (!readcontent) { onchange(e, input.files, undefined); return; }
            let contentObj: Dictionary<number, string> = {};
            let fileLetti: number = 0;
            for (let i: number = 0; input.files && i <input.files.length; i++) {
                const f: File = input.files[i];
                debug&&console.log('filereadContent['+i+']( file:', f, ')');
                U.fileReadContent(f, (content: string) => {
                    debug&&console.log('file['+i+'] read complete. done: ' + ( 1 + fileLetti) + ' / ' + input.files?.length, 'contentObj:', contentObj);
                    contentObj[i] = content; // cannot use array, i'm not sure the callbacks will be called in order. using push is safer but could alter order.
                    // this is last file to read.
                    if (input.files && ++fileLetti === input.files.length) {
                        const contentArr: string[] = [];
                        for (let j: number = 0; j < input.files.length; j++) { contentArr.push(contentObj[j]); }
                        onchange(e, input.files, contentArr);
                    }
                });
            }
        } || myFileReader.onchange;
    }
    private static reset(): void {
        myFileReader.fileTypes = undefined as any;
        myFileReader.onchange = undefined as any;
        myFileReader.input = undefined as any;
    }
    public static show(onChange: (e: Event, files: FileList | null, contents?: string[]) => void, extensions: undefined | string[] | FileReadTypeEnum[] = undefined, readContent: boolean): void {
        console.log("importEcore: pre file reader", myFileReader.input);
        myFileReader.setinfos(extensions, onChange, readContent);
        //if (!myFileReader.input) return;
        myFileReader.input.setAttribute('type', 'file');
        if (myFileReader.fileTypes) {
            myFileReader.input.setAttribute('accept', myFileReader.fileTypes.join(','));
        }
        //console.log('fileTypes:', myFileReader.fileTypes, 'input:', myFileReader.input);
        $(myFileReader.input).on('change.custom' as any, myFileReader.onchange).trigger('click');
        myFileReader.reset();
    }

}
@RuntimeAccessible('Uarr')
export class Uarr{
    public static arrayIntersection<T>(arr1: T[], arr2: T[]): T[]{
        if (!arr1 || ! arr2) return null as any;
        return arr1.filter( e => arr2.indexOf(e) >= 0);
    }

    static arraySubtract(arr1: any[], arr2: any[], inPlace: boolean): any[]{
        let i: number;
        const ret: any[] = inPlace ? arr1 : [...arr1];
        for (i = 0; i < arr2.length; i++) { U.arrayRemoveAll(ret, arr2[i]); }
        return ret; }

    static equals<T extends any>(a1: T[], a2: T[], deep: boolean): boolean {
        Log.ex(deep, "deep array comparison is not supported yet");
        if (!a1 || !a2) return false;
        if (a1.length !== a2.length) return false;
        for (let i = 0; i < a1.length; i++) if (a1[i] !== a2[i]) return false;
        return true;
    }
}

export class FocusHistoryEntry {
    static cname: string = "FocusHistoryEntry";
    time: Date;
    evt: JQuery.FocusInEvent;
    element: Element;
    constructor(e: JQuery.FocusInEvent, element?: Element, time?: Date) {
        this.evt = e;
        this.element = element || e.target;
        this.time = time || new Date();
    }
}
export enum ShortDefaultEClasses{
    EObject = "EObject",
    EAnnotation = "EAnnotation",
    EClass = "EClass",
    EPackage = "EPackage",
    ENamedElement = "ENamedElement",
}
export enum ShortAttribETypes {
    EVoid = 'EVoid',
    EChar  = 'EChar',
    EString  = 'EString',
    EDate  = 'EDate',
    EBoolean = 'EBoolean',
    EByte  = 'EByte',
    EShort  = 'EShort',
    EInt  = 'EInt',
    ELong  = 'ELong',
    EFloat  = 'EFloat',
    EDouble  = 'EDouble',
    // EDiagnosticChain = "EDiagnosticChain", // present in uml.ecore, without definition. i guess it's a custom installed package which is commonly used
    /*
  ECharObj  = 'ECharObj',
  EStringObj  = 'EStringObj',
  EDateObj  = 'EDateObj',
  EFloatObj  = 'EFloatObj',
  EDoubleObj  = 'EDoubleObj',
  EBooleanObj = 'EBooleanObj',
  EByteObj  = 'EByteObj',
  EShortObj  = 'EShortObj',
  EIntObj  = 'EIntObj',
  ELongObj  = 'ELongObj',
  EELIST  = 'EELIST',*/

}
windoww.ShortAttribETypes = ShortAttribETypes;

export const ShortAttribSuperTypes: Dictionary<ShortAttribETypes, ShortAttribETypes[]> = {
    "EVoid"    : [],
    "EChar"    : [ShortAttribETypes.EString],
    "EString"  : [],
    "EDate"    : [],
    "EBoolean" : [ShortAttribETypes.EByte, ShortAttribETypes.EShort, ShortAttribETypes.EInt, ShortAttribETypes.ELong, ShortAttribETypes.EFloat, ShortAttribETypes.EDouble],
    "EByte"    : [ShortAttribETypes.EShort, ShortAttribETypes.EInt, ShortAttribETypes.ELong, ShortAttribETypes.EFloat, ShortAttribETypes.EDouble],
    "EShort"   : [ShortAttribETypes.EInt, ShortAttribETypes.ELong, ShortAttribETypes.EFloat, ShortAttribETypes.EDouble],
    "EInt"     : [ShortAttribETypes.ELong, ShortAttribETypes.EFloat, ShortAttribETypes.EDouble],
    "ELong"    : [ShortAttribETypes.EFloat, ShortAttribETypes.EDouble],
    "EFloat"   : [ShortAttribETypes.EDouble],
    "EDouble"  : []
};
let ecoreprefix = "ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//";
let ecoreclasprefix = "ecore:EClass platform:/plugin/org.eclipse.emf.ecore/model/Ecore.ecore#//";
export function toShortEType(a: AttribETypes): ShortAttribETypes{ return a.substring(ecoreprefix.length) as any; }
export function toLongEType(a: ShortAttribETypes): AttribETypes {
    return AttribETypes[a];
    // return ecoreprefix + a as any;
}

export function toShortEClass(a: DefaultEClasses): ShortDefaultEClasses{ return a.substring(ecoreclasprefix.length) as any; }
export function toLongEClass(a: ShortDefaultEClasses): DefaultEClasses { return DefaultEClasses[a]; }

export class SelectorOutput {
    jqselector!: string;
    attrselector!: string;
    attrRegex!: RegExp;
    exception!: any;
    resultSetAttr!: Attr[];
    resultSetElem!: JQuery<Element>;
}
// compare it with event.key
export enum Keystrokes {
    clickLeft = 0,
    clickWheel = 1,
    clickRight = 2,
    clickBackMouseButton = 3,
    clickForwardMouseButton = 4,

    // keyboard
    escape = 'Escape',
    capsLock = 'CapsLock',
    shift = 'Shift',
    tab = 'Tab',
    alt = 'Alt',
    control = 'Control',
    end = 'End',
    home = 'Home',
    pageUp = 'PageUp',
    pageDown = 'PageDown',
    enter = 'Enter', // event.code = 'NumpadEnter' se fatto da numpad, oppure "numpad3", "NumpadMultiply", ShiftLeft, etc...
    numpadEnter = 'NumpadEnter',
    audioVolumeMute = 'AudioVolumeMute',
    audioVolumeUp = 'AudioVolumeUp',
    audioVolumeDown = 'AudioVolumeDown',
    mediaTrackPrevious = 'MediaTrackPrevious',
    delete = 'Delete', // canc
    backspace = 'Backspace',
    space = ' ',
    altGraph = 'AltGraph',
    arrowLeft = 'ArrowLeft',
    arrowRight = 'ArrowRight',
    arrowUp = 'ArrowUp',
    arrowDown = 'ArrowDown',
    insert = 'Insert',
    f1 = 'F1',
    // weird ones:
    meta = 'Meta', // f1, or other f's with custom binding and windows key
    unidentified = 'Unidentified', // brightness
    __NotReacting__ = 'fn, print, maybe others', // not even triggering event?
}

export enum DefaultEClasses{
    EObject = "ecore:EClass platform:/plugin/org.eclipse.emf.ecore/model/Ecore.ecore#//EObject",
    EAnnotation = "ecore:EClass platform:/plugin/org.eclipse.emf.ecore/model/Ecore.ecore#//EAnnotation",
    EClass = "ecore:EClass platform:/plugin/org.eclipse.emf.ecore/model/Ecore.ecore#//EClass",
    EPackage = "ecore:EClass platform:/plugin/org.eclipse.emf.ecore/model/Ecore.ecore#//EPackage",
    ENamedElement = "ecore:EClass platform:/plugin/org.eclipse.emf.ecore/model/Ecore.ecore#//ENamedElement",
}
export enum AttribETypes {
    EVoid = 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EVoid', // ??? i invented this.
    EChar = 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EChar',
    EString = 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EString',
    EDate = 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EDate',
    EFloat = 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EFloat',
    EDouble = 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EDouble',
    EBoolean = 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EBoolean',
    EByte = 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EByte',
    EShort = 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EShort',
    EInt = 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EInt',
    ELong = 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//ELong',
    // present in uml.ecore, without definition. i guess it's a custom installed package which is commonly used
    // EDiagnosticChain = 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EDiagnosticChain',
    /*
  ECharObj = 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//ECharObject',
  EStringObj = 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EStringObject',
  EDateObj = 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EDateObject',
  EFloatObj = 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EFloatObject',
  EDoubleObj = 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EDoubleObject',
  EBooleanObj = 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EBooleanObj',
  EByteObj = 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EByteObject',
  EShortObj = 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EShortObject',
  EIntObj = 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EIntegerObject',
  ELongObj = 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//ELongObject', */
    // EELIST = 'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EEList', // List<E> = List<?>
}

// export type Json = object;

export class ParseNumberOrBooleanOptions{
    defaultValue?: any;
    allowNull?: boolean; nullValue?: any;
    allowUndefined?: boolean; undefinedValue?: any;
    allowedNan?: boolean; nanValue?: any;
    allowBooleans?: boolean; trueValue?: any; falseValue?: any;
    constructor(
        defaultValue: any = null, allowNull: boolean = false, nullValue: any = null,
        allowUndefined: boolean = false, undefinedValue: any = undefined,
        allowedNan: boolean = false, nanValue: any = NaN,
        allowBooleans: boolean = true, trueValue : any = 1, falseValue: any = 0) {
        this.defaultValue = defaultValue; this.allowNull = allowNull; this.nullValue = nullValue;
        this.allowUndefined = allowUndefined; this.undefinedValue = undefinedValue;
        this.allowedNan = allowedNan; this.nanValue = nanValue;
        this.allowBooleans = allowBooleans; this.trueValue = trueValue; this.falseValue = falseValue;
    }
}

@RuntimeAccessible('Log')
export class Log{
    constructor() { }
    // public static history: Dictionary<string, Dictionary<string, any[]>> = {}; // history['pe']['key'] = ...parameters
    public static lastError: any[];
    private static loggerMapping: Dictionary<string, LoggerInterface[]> = {} // takes function name returns logger list
    public static registerLogger(logger: LoggerInterface, triggerAt: (typeof windoww.U.pe) & {name: string, cname:string}) {
        let tname: string = (triggerAt as any).cname || (triggerAt as any).name;
        if (!Log.loggerMapping[tname]) Log.loggerMapping[tname] = [];
        Log.loggerMapping[tname].push(logger);
    }

    static disableConsole(){
        // @ts-ignore
        console['logg'] = console.log;
        console.log = () => {}; }

    static enableConsole() {
        // @ts-ignore
        if (console['logg']) console.log = console['logg']; }

    private static log(prefix: string, category: string, originalFunc: typeof console.log, b: boolean, ...restArgs: any[]): string {
        if (!b) { return ''; }
        const key: string = windoww.U.getCaller(1);
        if (restArgs === null || restArgs === undefined) { restArgs = []; }
        let str = '[' + prefix + ']' + key + ': ';
        for (let i = 0; i < restArgs.length; i++) {
            // console.log(prefix, {i, restArgs, curr:restArgs[i]});
            str += '' +
                (typeof restArgs[i] === 'symbol' ?
                    '' + String(restArgs[i]) :
                    restArgs[i])
                + '\t\r\n'; }
        if (Log.loggerMapping[category]) for (const logger of Log.loggerMapping[category]) { logger.log(category, key, restArgs, str); }
        originalFunc(key, ...restArgs);
        return str; }

    public static e(b: boolean, ...restArgs: any[]): string {
        if (!b) return '';
        const str = Log.log('Error', 'e', console.error, b, ...restArgs);
        Log.lastError = restArgs;
        return str;
        // throw new Error(str);
    }

    public static eDev(b: boolean, ...restArgs: any[]): string {
        if (!b) return '';
        const str = Log.log('Dev Error','eDev', console.error, b, ...restArgs);
        Log.lastError = restArgs;
        return str;
        // throw new Error(str);
    }

    public static ex(b: boolean, ...restArgs: any[]): null | never | any {
        if (!b) return null;
        const str = Log.log('Error', 'e', console.error, b, ...restArgs);
        Log.lastError = restArgs;
        windoww.ee = restArgs;
        windoww.e1 = restArgs[1];
        throw new MyError(str, ...restArgs); }

    public static exDev(b: boolean, ...restArgs: any[]): null | never | any {
        if (!b) return null;
        const str = Log.log('Dev Error','eDev', console.error, b, ...restArgs);
        Log.lastError = restArgs;
        windoww.ee = restArgs;
        windoww.e1 = restArgs[1];
        throw new MyError(str, ...restArgs); }

    public static i(b: boolean, ...restArgs: any[]): string { return Log.log('Info', 'i', console.log, b, ...restArgs); }
    public static l(b: boolean, ...restArgs: any[]): string { return Log.log('Log', 'l', console.log, b, ...restArgs); }
    public static w(b: boolean, ...restArgs: any[]): string { return Log.log('Warn', 'w', console.warn, b, ...restArgs); }


    public static eDevv<T extends any = any>(firstParam?: NotBool<T>, ...restAgs: any): string { return Log.eDev(true, ...[firstParam, ...restAgs]); }
    public static ee(...restAgs: any): string { return Log.e(true, ...restAgs); }
    public static exDevv<T extends any = any>(firstParam?: NotBool<T>, ...restAgs: any): never | any { return Log.exDev(true, ...[firstParam, ...restAgs]); }
    public static exx(...restAgs: any): never | any { return Log.ex(true, ...restAgs); }
    public static ii(...restAgs: any): string { return Log.i(true, ...restAgs); }
    public static ll(...restAgs: any): string { return Log.l(true, ...restAgs); }
    public static ww(...restAgs: any): string { return Log.w(true, ...restAgs); }
}

type NotBool<T> = Exclude<T, boolean>;

interface LoggerInterface{
    log: (category: string, key: string, data: any[], fullconcat?: string) => any;
}



export class FileReadTypeEnum {
    public static image: FileReadTypeEnum = "image/*" as any;
    public static audio: FileReadTypeEnum = "audio/*" as any;
    public static video: FileReadTypeEnum = "video/*" as any;
    /// a too much huge list https://www.iana.org/assignments/media-types/media-types.xhtml
    public static AndManyOthersButThereAreTooMuch: string = "And many others... https://www.iana.org/assignments/media-types/media-types.xhtml";
    public static OrJustPutFileExtension: string = "OrJustPutFileExtension";
}

// console.info('loaded ts U');
