import {
    Pointer,
    Dictionary,
    GObject,
    LogicContext,
    Info, DPointerTargetable, DOperation, ShortAttribETypes, DModelElement, DtoL, LTypeDeclaration, DTypeDeclaration,
    LOperation, NamedArr, DModel, LPointerTargetable, LAnnotation, ECoreAnnotation, orArr
} from "../../joiner";
import {
    DClassifier, LClassifier, Pointers, U, L, LModel, LClass, DClass, LEnumerator,
    LModelElement,
    DEnumerator, EcoreParser, LValue, AttribETypes, RuntimeAccessible, Uobj, TRANSACTION, SetFieldAction,
} from "../../joiner";
import {DictArr} from "../../joiner/types";

const OPERATOR_MAP: Dictionary<string, keyof GenericType> = {
    "&": "operandsAnd",
    "|": "operandsOr",
    "\\": "operandsDifference",
    "~": "operandsComplement",
    // ",": "operandsTuple",
};
const OPERATORS: { symbol: string; field: keyof GenericType }[] = [
    // { symbol: ",",  field: "operandsTuple" },
    { symbol: "|",  field: "operandsOr" },          // lowest precedence
    { symbol: "&",  field: "operandsAnd" },
    { symbol: "\\", field: "operandsDifference" },
    { symbol: "~",  field: "operandsComplement" },   // highest precedence
];

// ------------------------------------------------------------------
// Recursive descent parser
// Handles: T, Foo, Foo<A,B>, ?, ? extends A & B, ? super A,
//          A & B (intersection), T[], (Foo<A>)[]
// ------------------------------------------------------------------
class GenericTypeParser {
    private pos: number = 0;

    constructor(
        private input: string,
        private classes: NamedArr<LClass>,
        private enums: NamedArr<LEnumerator>,
        private typeDeclarations: NamedArr<(LTypeDeclaration | TypeDeclaration)>
        ) {}

    parseRef(): GenericType {
        this.skipWS();
        const ref = this.parseOperatorOrSingle();
        this.skipWS();
        return ref;
    }
    protected getPos(): number {
        return this.pos;
    }

    // Intersection: A & B & C  (only when not inside a wildcard bound)

// ------------------------------------------------------------------
// Precedence parser — replaces parseIntersectionOrSingle entirely.
// Call this wherever parseIntersectionOrSingle was called before.
// ------------------------------------------------------------------

// Entry point for all operator parsing with priority and parenthesis handling.
    private parseOperatorOrSingle(): GenericType {
        return this.parseAtPrecedence(0);
    }

// Recursive precedence climbing.
// level 0 = loosest (|), level OPERATORS.length = tightest (delegates to unary/primary)
    private parseAtPrecedence(level: number): GenericType {
        // beyond all operator levels — delegate to array suffix / primary
        if (level >= OPERATORS.length) {
            return this.parseArraySuffix();
        }

        const { symbol, field } = OPERATORS[level];

        // parse left operand at the next tighter precedence level
        const first = this.parseAtPrecedence(level + 1);
        this.skipWS();

        if (!this.input.startsWith(symbol, this.pos)) return first;

        // collect all operands for this operator
        const operands: GenericType[] = [first];
        while (this.input.startsWith(symbol, this.pos)) {
            this.consume(symbol);
            this.skipWS();
            // right operand is also parsed at the next tighter level
            // giving left-associativity naturally
            operands.push(this.parseAtPrecedence(level + 1));
            this.skipWS();
        }

        const ret = new GenericType("operator");
        (ret as any)[field] = operands;
        return ret;
    }

// ------------------------------------------------------------------
// parsePrimary — extend to handle parenthesis groups.
// Parentheses reset precedence back to 0 inside the group,
// allowing (A | B) & C to parse correctly.
// ------------------------------------------------------------------


    // Array suffix:  T   →  T[]  or  T[][]  etc.
    private parseArraySuffix(): GenericType {
        let ref = this.parsePrimary();
        this.skipWS();
        while (this.input.startsWith("[]", this.pos)) {
            this.pos += 2;
            ref = new GenericType("array");
            ref.operandsArray = ref;
            this.skipWS();
        }
        return ref;
    }
    // Primary: wildcard | parenthesised | named (raw/parameterized)
    private parsePrimary(): GenericType {
        this.skipWS();

        // parenthesis group — resets to lowest precedence inside
        if (this.peek() === "(") {
            this.consume("(");
            this.skipWS();
            const inner = this.parseAtPrecedence(0);   // full precedence reset
            this.skipWS();
            this.consume(")");
            return inner;
        }

        // wildcard
        if (this.peek() === "?") {
            this.consume("?");
            this.skipWS();
            if (this.tryConsume("extends")) {
                this.skipWS();
                const bounds = this.parseBoundList();
                const ret = new GenericType("wildcard");
                ret.upper = bounds;
                return ret;
            }
            if (this.tryConsume("super")) {
                this.skipWS();
                const bounds = this.parseBoundList();
                const ret = new GenericType("wildcard");
                ret.lower = bounds;
                return ret;
            }
            return new GenericType("wildcard");
        }

        // named: raw, parameterized
        const name = this.parseIdentifier();
        if (!name) throw new Error(
            `Unexpected token at pos ${this.pos}: "${this.input.slice(this.pos, this.pos + 20)}"`
        );

        this.skipWS();

        if (this.peek() === "<") {
            // Parameterized
            this.consume("<");
            const args: GenericType[] = [];
            this.skipWS();
            if (this.peek() !== ">") {
                // type arguments use full precedence reset too
                args.push(this.parseAtPrecedence(0));
                this.skipWS();
                while (this.peek() === ",") {
                    this.consume(",");
                    this.skipWS();
                    args.push(this.parseAtPrecedence(0));
                    this.skipWS();
                }
            }
            this.consume(">");
            // eg: Shape<Geom2D>, List<?>
            const ret = new GenericType("parameterized");
            ret.classifier = name;
            ret.typeArgs = args;
            return ret;
        }
        let ltarget = this.classes[name] || this.enums[name] || this.typeDeclarations[name];
        // eg: Shape, Map, T (target is LClass or LTypeParam
        const ret = new GenericType("raw");
        ret.classifier = ltarget?.id || name;
        return ret;
    }

    // Parse a & b & c  — used for wildcard bounds (no nested operator recursion)
    private parseBoundList(): GenericType[] {
        const bounds: GenericType[] = [this.parseArraySuffix()];
        this.skipWS();
        while (this.peek() === "&") {
            this.consume("&");
            this.skipWS();
            bounds.push(this.parseArraySuffix());
            this.skipWS();
        }
        return bounds;
    }

    // ---- low-level helpers ----

    private peek(): string {
        return this.input[this.pos] ?? "";
    }

    private consume(expected: string): void {
        if (!this.input.startsWith(expected, this.pos))
            throw new Error(`Expected "${expected}" at pos ${this.pos}, got "${this.input.slice(this.pos, this.pos + expected.length)}"`);
        this.pos += expected.length;
    }

    private tryConsume(word: string): boolean {
        const slice = this.input.slice(this.pos, this.pos + word.length);
        const after = this.input[this.pos + word.length];
        if (slice === word && (after === undefined || /\W/.test(after))) {
            this.pos += word.length;
            return true;
        }
        return false;
    }

    private parseIdentifier(): string {
        const match = /^[A-Za-z_$][A-Za-z0-9_$]*/.exec(this.input.slice(this.pos));
        if (!match) return "";
        this.pos += match[0].length;
        return match[0];
    }

    private skipWS(): void {
        while (this.pos < this.input.length && /\s/.test(this.input[this.pos])) this.pos++;
    }
}




type List = DClassifier;
type MMAP = DClassifier;
type String = DClassifier;


export type GenericTypeName = string;
export type TYPE =  Pointer<DClassifier> | Pointer<DTypeDeclaration>; // pointer or string like "T", because i can have stuff like K extends V


export class TypeDeclaration {
    id?: Pointer<DTypeDeclaration>
    name!: string;
    upper!: (GenericType | TYPE)[];
    lower!: (GenericType | TYPE)[];
    direction!: "in" | "out" | "inout"; // also called variance: Input (contravariant) or an Output (covariant).
    defaultType?: GenericType | TYPE;
    constructor() {
        this.upper = [];
        this.lower = [];
        this.direction = "inout";
        this.defaultType = undefined;
        this.name = "T";
    }
}
@RuntimeAccessible("GenericType")
export class GenericType {
    static cname = "GenericType";
    kind: "raw" | "parameterized" | "wildcard" | "operator" | "array" | "todo";
    // name?: GenericTypeName | Pointer<DTypeDeclaration>;
    classifier?: Pointer<DClassifier> | Pointer<DTypeDeclaration> | GenericTypeName;
    typeArgs?: GenericType[];
    upper?: (Pointer<DClassifier> | Pointer<DTypeDeclaration> | GenericType)[];
    lower?: (Pointer<DClassifier> | Pointer<DTypeDeclaration> | GenericType)[];
    operandsOr?: GenericType[];
    operandsAnd?: GenericType[];
    operandsDifference?: GenericType[];
    operandsComplement?: GenericType[];
    operandsTuple?: GenericType[];
    operandsArray?: GenericType;
    // annotations?: LAnnotation; // removed because i cannot have GenericType contain L-elements


    static test() {
        const testt: Dictionary<string, Dictionary<string, Dictionary<string, (...a:any)=>any>>> = {
            GenericType: {
                serialize: {
                    universal: GenericType.serializeGenericType, // string
                    jodel: GenericType.serializeJOM, // string
                    ecore: GenericType.serializeEcore, // string
                },
                parse: {
                    universal: "cannot exist" as any,
                    jodel: GenericType.parse, // GenericType (jom struct)
                    ecore: GenericType.parseToEcore, // EGenericType (ecore struct)
                }
            },

            typeParameters: {
                serialize: {
                    universal: GenericType.serializeTypeDeclaration, // string
                    jodel: GenericType.serializeTypeDeclarationJOM, // string
                    ecore: GenericType.serializeETypeParameter, // string
                },
                parse: {
                    universal: "cannot exist" as any,
                    "??": GenericType.parseDeclaration,
                    jodel: null, jom setter?
                    ecore: null, l.toecore??
                }
            }
        }
    }

    static desc_feature: Info = {type: ShortAttribETypes.EString, txt: "Mutually exclusive with this.type, it specified a parametrized type.\n" +
            "The type must be declared in the class definition, and referenced here by name (string). example:" +
            "class Proxy<N>{" +
            "\tprivate originalData: N;\n;" +
            " ... }\n"};
    // validate and fix a tentative object received through API
    private static PointerOrName<T extends DPointerTargetable>(v: any, allowGenericType = false): string | Pointer<T> | undefined {
        if (!v) return undefined;
        let tv = typeof v;
        if (tv === "object") return Pointers.from(v) || (allowGenericType ? GenericType.getter(v) : undefined);
        if (tv === "string") return v;
        return undefined;
    }

    public static desc_class: Info = {type: "GenericType[]", txt: "Type parameters used to extend a superclass with generic typings.\n" +
            "like: class IntegerStack extends Array<Integer> { .. }"}
    public static desc_object: Info = {type: "GenericType", txt: "Type parameters used to create an object whose class have generic typings."}
    public static desc_value: Info = {type: "GenericType", txt: GenericType.desc_object.txt }
    public static descTypeParameters: Info = {type: "TypeDeclaration[]", txt: "Type parameters attached to the classifier or function definition, like in HashMap<K, V>"}
    public static descAllTypeParameters: Info = Info.typeDeclarations;

    private static serializeETypeParameter(...a: Parameters<typeof serializeETypeParameter>): ReturnType<typeof serializeETypeParameter> {
        return serializeETypeParameter(...a);
    }

    /*
    private static serializeECoreGenericType(...a: Parameters<typeof serializeECoreGenericType>): ReturnType<typeof serializeECoreGenericType> {
        return serializeECoreGenericType(...a);
    }*/

    // use lTypeDeclaration.toString instead
    static serializeJTypeParameter(arr: LTypeDeclaration[], m: LModel, asID: boolean = true ): string | null {return null as any; }

    public static getterArr(v?: Partial<GenericType>[]): GenericType[] {
        if (!v) return [];
        if (!Array.isArray(v)) v = [v];
        return v.map( e => GenericType.getter(e)).filter(e=>!!e);
    }
    public static setterArr<T extends DModelElement>(v: GenericType[] | undefined, c: LogicContext<T>, propkey: keyof T & string, thiss: DtoL<T>): boolean {
        v = GenericType.getterArr(v);
        let old  = GenericType.getterArr(c.data[propkey] as any);
        let delta = old && v && Uobj.objectDelta(old, v, true, false);
        if (delta && Object.keys(delta).length === 0) return true;
        TRANSACTION((thiss as any).get_name(c)+"."+propkey, ()=> {
            if (v) SetFieldAction.new(c.data, propkey, delta as any, "+=", false);
            else SetFieldAction.new(c.data, propkey, undefined, '', false);
        }, delta ? delta : old, delta ? undefined : (old ? v : null))
        return true;
    }

    public static getter(v?: Partial<GenericType>, c: LogicContext<DModelElement>): GenericType | undefined{
        if (typeof v === "string") {
            const model = (c.proxyObject as LModelElement).model;
            const classes = model.classes;
            const enums = model.enums;
            const typeDeclarations = model.allTypeDeclarations;
            return GenericType.parse(v, classes, enums, typeDeclarations);
        }
        if (!v || !v.kind || typeof v.kind !== "string") return undefined;
        let ret = new GenericType(v.kind);
        // ret.name = typeof v.name === "string" && v.name ? v.name : undefined;
        ret.classifier = this.PointerOrName<DClass>(v.classifier);
        ret.upper = (v.upper || []).map<GenericType | TYPE>(e=> GenericType.PointerOrName(e, true) as any).filter(e=>!!e);
        ret.lower = (v.lower || []).map<GenericType | TYPE>(e=> GenericType.PointerOrName(e, true) as any).filter(e=>!!e);

        ret.operandsTuple =      (v.operandsTuple      || []).map(e=> GenericType.getter(e, c)).filter(e=>!!e);
        ret.operandsAnd =        (v.operandsAnd        || []).map(e=> GenericType.getter(e, c)).filter(e=>!!e);
        ret.operandsOr =         (v.operandsOr         || []).map(e=> GenericType.getter(e, c)).filter(e=>!!e);
        ret.operandsDifference = (v.operandsDifference || []).map(e=> GenericType.getter(e, c)).filter(e=>!!e);
        ret.operandsComplement = (v.operandsComplement || []).map(e=> GenericType.getter(e, c)).filter(e=>!!e);
        ret.typeArgs =           (v.typeArgs           || []).map(e=> GenericType.getter(e, c)).filter(e=>!!e);
        ret.operandsArray = GenericType.getter(v.operandsArray, c);
        return ret;
    }

    public static setter(v: GenericType | undefined, c: LogicContext<any>, thiss: LModelElement): boolean {
        v = GenericType.getter(v, c as LogicContext<DModelElement>);
        let old = GenericType.getter(c.data.genericType, c as LogicContext<DModelElement>);
        let delta = old && v && Uobj.objectDelta(old, v, true, false);
        if (delta && Object.keys(delta).length === 0) return true;
        TRANSACTION((thiss as any).get_name(c)+".genericType", ()=> {
            if (v) SetFieldAction.new(c.data, "genericType", delta, "+=", false);
            else SetFieldAction.new(c.data, "genericType", undefined, '', false);
        }, delta ? delta : old, delta ? undefined : (old ? v : null))
        return true;
    }

    public static getter_typeParametersArr(v?: Pointer<DTypeDeclaration>[]): DictArr<LTypeDeclaration> {
        return U.toNamedArray(L.fromArr(v || []).filter((e: L)=> !!e));
    }

    public static getter_typeParameters(v?: Partial<TypeDeclaration>): TypeDeclaration | undefined {
        if (!v) return undefined;
        let ret = new TypeDeclaration();
        if (v.name && typeof v.name === "string") ret.name = v.name;
        else return undefined;
        ret.defaultType = GenericType.PointerOrName(v?.defaultType);
        ret.upper = (v.upper || []).map<GenericType | TYPE>(e=> GenericType.PointerOrName(e, true) as any).filter(e=>!!e);
        ret.lower = (v.lower || []).map<GenericType | TYPE>(e=> GenericType.PointerOrName(e, true) as any).filter(e=>!!e);
        let dir = typeof v.direction === "string" ? v.direction.toLowerCase() : undefined;
        switch (dir) {
            case "in":
            case "out":
            case "inout": ret.direction = dir; break;
            default: break;
        }
        return ret;
    }

    // type declarations on operation.eTypeParameters and class.eTypeParameters
    public static setter_typeParameters(v0: (Pointer<DTypeDeclaration> | TypeDeclaration)[] | undefined, c: LogicContext<DClass | DOperation | DModel>, thiss: LClass | LOperation | LModel): boolean {
        let old = (c.data as DClass | DOperation | DModel).typeParameters;
        console.log("0x1 set typeParameters", {v0, c, thiss});
        if (typeof v0 === "string") return TypeDeclaration.parse(v0);
        if (!v0 || typeof v0 !== "object" || U.isEmptyObject(v0)) v0 = [];
        if (!Array.isArray(v0)) { v0 = [v0 as any]; }
        // else v0 = Pointers.fromArr(v0);
        // if (v0.length === 0) v0 = undefined;

        const model = c.proxyObject.model;
        const classes = model.classes;
        const enums = model.enumerators;
        const typeDecls = (c.proxyObject as LClass | LOperation | LModel).allTypeDeclarations; // not model.typeDeclarations, because it needs to get all typedecls in this element and his ancestors.
        // let finalArr: Pointer<DTypeDeclaration>[] = [];
        const finalArr: Pointer<DTypeDeclaration>[] = v0.map(v => {
            let tv = typeof v;
            if (tv !== "string" && tv !== "object") return null;

            let ptr = Pointers.from(v as any as DPointerTargetable);
            let serialized: string | null = null;
            if (tv === "string") {
                if (Pointers.isPointer(ptr)) { finalArr.push(ptr as Pointer<any>); return v; }
                else serialized = v as string;
            }
            if (tv === "object") {
                // if not P or D, it's a xmi/ecore/json structure.
                const model = c.proxyObject.model;
                serialized = GenericType.serializeETypeParameter([v as TypeDeclaration], model, true);
            }
            if (!serialized) return null;
            let obj = GenericType.parseDeclaration(serialized, classes, enums, typeDecls);
            if (!obj) return null as any;
            return LPointerTargetable.fromD(DTypeDeclaration.new2({...obj, father:c.data.id} as any, (d) => {
                if (!obj || typeof obj !== "object") return;
                for (let k in obj) { (d as any)[k] = (obj as any)[k]; }
            }, true));
            // or already serialized version
        }).filter(e=>!!e)


        /*
        let delta = old && v?.length && Uobj.objectDelta(old, v, true, false);
        if (delta && Object.keys(delta).length === 0) return true;
        // delta = Uobj.fixDeltaArrays(delta);
        TRANSACTION((thiss as any).get_name(c)+".typeParameters", ()=> {
            if (v) SetFieldAction.new(c.data, "typeParameters", delta as any, "{}", false);
            else SetFieldAction.new(c.data, "typeParameters", [], '', false);
        }, delta ? delta : old, delta ? undefined : (old ? v : null))*/
        return true;
    }

/*
    public static setter_typeParameters(v: Partial<TypeDeclaration>[] | undefined, c: LogicContext<DClass | DOperation>, thiss: LModelElement): boolean {
        let old = GenericType.getter_typeParametersArr(c.data.typeParameters);
        v = GenericType.getter_typeParametersArr(v);
        let delta = old && v?.length && Uobj.objectDelta(old, v, true, false);
        if (delta && Object.keys(delta).length === 0) return true;
        TRANSACTION((thiss as any).get_name(c)+".typeParameters", ()=> {
            if (v) SetFieldAction.new(c.data, "typeParameters", delta as any, "+=", false);
            else SetFieldAction.new(c.data, "typeParameters", undefined, '', false);
        }, delta ? delta : old, delta ? undefined : (old ? v : null))
        return true;
    }
*/

    constructor(
        kind: GenericType["kind"],
        setter?:(d: GenericType)=>void/*
        classifier?: TYPE,
        typeArgs?: GenericType[],
        upper?: GenericType["upper"], lower?: GenericType["lower"],
        operandsAnd?: GenericType[],
        operandsArray?: GenericType,
        operandsOr?: GenericType[],
        operandsDifference?: GenericType[],
        operandsComplement?: GenericType[],
        operandsTuple?: GenericType[],*/
    ) {
        this.kind = kind;
        if (setter) setter(this);
        /*
        this.classifier = classifier;
        this.typeArgs = typeArgs;
        this.upper = upper;
        this.lower = lower;
        this.operandsAnd = operandsAnd;
        this.operandsOr = operandsOr;
        this.operandsDifference = operandsDifference;
        this.operandsTuple = operandsTuple;
        this.operandsComplement = operandsComplement;
        this.operandsArray = operandsArray;*/
    }

    // ------------------------------------------------------------------
    // Helper: extract a display name from a TYPE (Pointer or plain string)
    // ------------------------------------------------------------------
    private static classifierName(t: TYPE, defaultRet: string = ""): string {
        let tt = typeof t;
        if (tt === "object") return (t as any as LClassifier)?.name || defaultRet;
        if (tt === "string") {
            if (Pointers.isPointer(t)) return L.from(t)?.name || defaultRet;
            else return t || defaultRet;
        }
        return defaultRet;
    }

    static serializeTypeDeclarationJOM(l: LTypeDeclaration, asID = true): string {
        let def = l.defaultType; // thiss.get_defaultType(c);
        let upper = l.upper; // thiss.get_upper(c);
        let lower = l.lower; // thiss.get_lower(c);
        let direction: string = l.direction; // thiss.get_direction(c);
        const m: LModel = l.model;
        let name = l.name; // (thiss as any).get_name(c);
        if (direction === "inout" || !direction) direction = "";
        else direction += " ";
        if (!name && !def && !upper.length && !lower.length) return "";

        let extendsStr = upper.map(e=>GenericType.serializeJOM(e, m, asID)).filter(e=>!!e).join("&");
        let superStr = lower.map(e=>GenericType.serializeJOM(e, m, asID)).filter(e=>!!e).join("&");
        console.log("serialize tp", {upper, lower,
            umap:upper.map(e=>GenericType.serializeJOM(e, m, asID)),
            lmap: lower.map(e=>GenericType.serializeJOM(e, m, asID))
        });
        if (superStr) superStr = " super " + superStr;
        if (extendsStr) extendsStr = " extends "+extendsStr;
        return `${direction}${name}${extendsStr}${superStr}`;
    }

    static serializeTypeDeclaration(l: LTypeDeclaration, m?: LModel, asID = true): string {
        const fallback: string = "";
        if (l?.__isProxy) return l.toString();
        if (l?.className === "DTypeDeclaration") return L.fromD(l as any)?.toString?.() || fallback;
        if (Pointers.isPointer(l)) return L.fromPointer(l as any)?.toString?.() || fallback;
        const tl = typeof l;
        if (tl === "object") {
            if (!m) { windoww.Log.eDevv("Cannot serialize ETypeParameter without a reference to the model."); return fallback; }
            return serializeETypeParameter(l as any, m, asID) || fallback;
        }
        if (tl === "string") return l as any || fallback;
        return fallback;
    }

    // ------------------------------------------------------------------
    // SERIALIZE
    // Produces a human-readable string like:
    //   raw:           "Shape", T
    //   parameterized: "Map<String, List<T>>"
    //   wildcard:      "?", "? extends Foo & Bar", "? super Baz"
    //   operator    :  "A & B & C"
    //   array:         "T[]", "List<T>[]"
    // ------------------------------------------------------------------
    public static serializeGenericType(gType: EGenericType | GenericType | TYPE |  LClass, m: LModel, asID = true): string {
        let to = typeof gType;
        if (to === "string") {
            if (Pointers.isPointer(gType)) return L.from(gType)?.name || ""; // should never be possible, this is not a LTypeDeclaration
            return gType as any;
        }
        if (to === "object") {
            // return (gType as any).name ?? (gType as any).toString() ?? null;
            let cnamePrefix = (gType as any)?.className?.[0];
            if (cnamePrefix === "D") return L.from(gType as LClass)?.name || "";
        }


        if (U.closerTo(gType, J_GTKeys, E_GTKeys).closestKeys = J_GTKeys) return GenericType.serializeJOM(gType as any, m, asID);
        else return GenericType.serializeEcore(gType as any, m, asID);
    }
    private static serializeEcore(type: EGenericType, m: LModel, asID = true): string{ return serializeECoreGenericType(type, m, asID); }
    private static serializeJOM(o0: GenericType | TYPE | LClass, m: LModel, asID = true): string {

        function joinOperands(arr: GenericType[], operator: string, autoParenthesis: boolean = true) {
            let types = arr.map(e=> GenericType.serializeGenericType(e, m, asID)).filter(e=>!!e);
            let s = types.join(operator);
            if (!types.length) return "";
            if (types.length === 1 || !autoParenthesis) { return s; }
            else return "(" + s + ")";
        }

        let o = o0 as GenericType;
        o = normalizeEcoreKeys(o);

        /*
        field	        raw	        parameterized   wildcard	intersection	array
        classifier	    �required	�required       ✗	        ✗	            ✗
        typeArgs	    ✗	        �required       ✗	        ✗	            ✗
        upper	        ✗	        ✗               �optional	✗	            ✗
        lower	        ✗	        ✗               �optional	✗	            ✗
        operands	    ✗	        ✗               ✗	        �required	    ✗
        componentType   ✗          	✗	            ✗	        ✗	            �required

        */
        switch (o.kind) {
            default: // throw new Error(`Unknown GenericType kind: ${(o as any).kind}`);
                let isDefault = !!o.kind;
                console.log("serialize gt", {o, cl:o.classifier, args:o.typeArgs});
                if (o.operandsArray) { // array mode
                    const inner = GenericType.serializeJOM(o.operandsArray, m, asID);
                    // Wrap parameterized/intersection in parens for clarity, e.g. (Map<K,V>)[]
                    const needsParens = true; // o.operandsArray.kind === "parameterized" || o.operandsArray.kind === "intersection" || o.typeArgs?.length > 0;
                    return needsParens ? `(${inner})[]` : `${inner}[]`;
                }
                // NB: mixed operators can be realized with nesting {operandsOr:[ a1, {operandsAND: [b1, b2]}]}  --> a1 | (b1 & b2)
                if (o.operandsTuple?.length)  return "[" + joinOperands(o.operandsTuple,        ", ", false) + "]";
                if (o.operandsOr?.length)           return joinOperands(o.operandsOr,           " | ", false);
                if (o.operandsAnd?.length)          return joinOperands(o.operandsAnd,          " & ", false);
                if (o.operandsDifference?.length)   return joinOperands(o.operandsDifference,   " \ ", false);
                if (o.operandsComplement?.length)   return joinOperands(o.operandsComplement,   " ~ ", false);

                o.classifier
                let base: string;
                let isWildcard: boolean = false;
                if (!o.classifier) {
                    if (!isDefault) throw new Error("parameterized GenericType missing classifier");
                    isWildcard = true;
                    base = "?";
                } else base = GenericType.classifierName(o.classifier);
                let bounds = "";

                if (o.upper?.length) {
                    const arr = o.upper.map(e=> GenericType.serializeGenericType(e, m, asID)).filter(e=>!!e);
                    if (arr.length) bounds += ` extends ${arr.join(" & ")}`;
                }
                if (o.lower?.length) {
                    // Java only allows a single lower bound but we stay general
                    const arr = o.lower.map(e=> GenericType.serializeGenericType(e, m, asID)).filter(e=>!!e);
                    if (arr.length) bounds += ` super ${arr.join(" & ")}`;
                }

                if (o.typeArgs?.length) {
                    const args = o.typeArgs.map(e=> GenericType.serializeGenericType(e, m, asID)).join(", ");
                    return `${base}<${args}>${bounds}`;
                }
                return base + bounds;
            break;
            case "raw": {
                if (!o.classifier) throw new Error("raw GenericType missing classifier");
                return GenericType.classifierName(o.classifier);
            }

            case "parameterized": {
                let isDefault = !!o.kind;
                console.log("serialize gt", {o, cl:o.classifier, args:o.typeArgs});
                if (!o.classifier) throw new Error("parameterized GenericType missing classifier");
                const base = GenericType.classifierName(o.classifier);
                if (o.typeArgs?.length) {
                    const args = o.typeArgs.map(e=> GenericType.serializeGenericType(e, m, asID)).filter(e=>!!e).join(", ");
                    return `${base}<${args}>`;
                }
                return base;
            }

            case "wildcard": {
                // upper and lower are mutually exclusive in practice
                if (o.upper?.length) {
                    const bounds = o.upper.map(e=> GenericType.serializeGenericType(e, m, asID)).filter(e=>!!e).join(", ");
                    return `? extends ${bounds}`;
                }
                if (o.lower?.length) {
                    // Java only allows a single lower bound but we stay general
                    const bounds = o.lower.map(e=> GenericType.serializeGenericType(e, m, asID)).filter(e=>!!e).join(", ");
                    return `? super ${bounds}`;
                }
                return "?";
            }

            case "operator": {
                let collection: keyof GenericType;
                if (o.operandsTuple?.length) {
                    return "["+o.operandsTuple.map(e=> GenericType.serializeGenericType(e, m, asID)).filter(e=>!!e).join(", ")+"]";
                }

                if (o.operandsAnd?.length) collection = "operandsAnd";
                if (o.operandsOr?.length) collection = "operandsOr";
                if (o.operandsComplement?.length) collection = "operandsComplement";
                if (o.operandsDifference?.length) collection = "operandsDifference";
                else collection = "" as any;

                let arr: GenericType["operandsAnd"] = o[collection] as GenericType["operandsAnd"] || [];
                let symbol = OPERATOR_MAP[collection];
                if (arr.length === 0) windoww.Log.ee("GenericType operation("+collection+") has no operands", {arr, o});
                return "("+arr.map(e=> GenericType.serializeGenericType(e, m, asID)).filter(e=>!!e).join(symbol)+")";
            }

            case "array": {
                if (!o.operandsArray) throw new Error("array GenericType missing componentType");
                const inner = GenericType.serializeJOM(o.operandsArray, m, asID);
                // Wrap parameterized/intersection in parens for clarity, e.g. (Map<K,V>)[]
                const needsParens = o.operandsArray.kind === "parameterized" || o.operandsArray.kind === "operator";
                return needsParens ? `(${inner})[]` : `${inner}[]`;
            }
        }
    }

    public static parseToEcore(s: string | GenericType,
                               classes: NamedArr<LClass>,
                               enums: NamedArr<LEnumerator>,
                               typeDeclarations: NamedArr<(LTypeDeclaration | TypeDeclaration)>, asID = false): XmiGenericTypeJson{
        let gt: GenericType;
        if (typeof s === "string") gt = GenericType.parse(s, classes, enums, typeDeclarations);
        else gt = s as any;
        const ret = new XmiGenericTypeJson();
        ret.ebounds         = gt.upper?.map(g=> GenericType.parseToEcore(g, classes, enums, typeDeclarations));
        ret.etypearguments  = gt.typeArgs?.map(g=> GenericType.parseToEcore(g, classes, enums, typeDeclarations));
        // block: set eTypeParameter or eClassifier (mutually exclusive
        {
            let l = L.fromPointer(gt.classifier) as LClass | LTypeDeclaration;
            if (gt.classifier && !l) ret.etypeparameter = gt.classifier; // treating unknown target as a missing type declaration like K, V, T
            else {
                let val: string = l ? l.ecorePointer() : gt.classifier; // target's name or ecore-based pointer string
                if (l.className === "LClass") { ret.eclassifier = val; }
                else ret.etypeparameter = val;

            }
            if (Pointers.isPointer(ret.eclassifier) && !asID) {
                ret.eclassifier = (L.fromPointer(ret.eclassifier) as LClass | LTypeDeclaration)?.name || "";
            }

        }
        // ret.eannotations = gt.annotations.map((a: LAnnotation)=> a.eCore);

        if (ret.ebounds?.length === 1) ret.ebounds = ret.ebounds[0];
        if (ret.etypearguments?.length === 1) ret.etypearguments = ret.etypearguments[0];
        // if (ret.eannotations?.length === 1) ret.eannotations = ret.eannotations[0];

        if (!ret.eclassifier || !(ret.eclassifier as any).length) delete ret.eclassifier;
        if (!ret.eannotations || !(ret.eannotations as any).length) delete ret.eannotations;
        if (!ret.ebounds || !(ret.ebounds as any).length) delete ret.ebounds;
        if (!ret.etypearguments || !(ret.etypearguments as any).length) delete ret.etypearguments;
        return ret;
    }
    //  parse("Map<String, List<? extends Foo>>") --> JOM object
    public static parse(s: string,
                        classes: NamedArr<LClass>,
                        enums: NamedArr<LEnumerator>,
                        typeDeclarations: NamedArr<(LTypeDeclaration | TypeDeclaration)>
    ): GenericType {
        const trimmed = s.trim();
        const parser = new GenericTypeParser(trimmed, classes, enums, typeDeclarations);
        return parser.parseRef();
    }
    public static parseDeclaration(s: string,
                                   classes: NamedArr<LClass>,
                                   enums: NamedArr<LEnumerator>,
                                   typeDeclarations: NamedArr<(LTypeDeclaration | TypeDeclaration)>,
                                   base?: LTypeDeclaration): TypeDeclaration {
        const trimmed = s.trim();
        const parser = new TypeParamDeclParser(trimmed, classes, enums, typeDeclarations);
        return parser.parse(base);
    }
}




// ------------------------------------------------------------------
// Syntax assumed:
//   [direction] name [extends A] [super B] [= DefaultType]
// e.g.
//   "T"
//   "in T"
//   "out T extends Shape"
//   "inout T extends Shape super Base = DefaultShape"
//   "T = Shape"
// ------------------------------------------------------------------

class TypeParamDeclParser {
    private pos: number = 0;

    constructor(
        private input: string,
        private classes: NamedArr<LClass>,
        private enums: NamedArr<LEnumerator>,
        private typeDeclarations: NamedArr<(LTypeDeclaration | TypeDeclaration)>
    ) {}

    parse(base?: LTypeDeclaration): TypeDeclaration {
        let ret = new TypeDeclaration();
        // baseobj or at least id is required for making pointers of subelements recursively pointing to this declaration.
        if (base) { ret.id = base.id; }
        this.skipWS();

        // 1. optional direction keyword — must come before the name
        ret.direction = this.parseDirection() as any;
        this.skipWS();

        // 2. type parameter name
        ret.name = this.parseIdentifier();
        if (!ret.name) throw new Error(
            `Expected type parameter name at pos ${this.pos}`
        );

        if (!this.typeDeclarations[ret.name]) {
            this.typeDeclarations.push(ret);
            this.typeDeclarations[ret.name] = ret;
            // save old name so references can still point to it with old name?
            if (base && !this.typeDeclarations[base.name]) this.typeDeclarations[base.name] = ret;
        }
        this.skipWS();

        // 3. extends / super clauses in any order, each at most once

        for (let i = 0; i < 2; i++) {
            if (ret.upper.length === 0 && this.tryConsume("extends")) {
                this.skipWS();
                ret.upper = this.parseBoundList();
                this.skipWS();
            } else if (ret.lower.length === 0 && this.tryConsume("super")) {
                this.skipWS();
                ret.lower = this.parseBoundList();
                this.skipWS();
            } else {
                break;
            }
        }

        // 4. optional default type  "= SomeType"
        if (this.tryConsume("=")) {
            this.skipWS();
            ret.defaultType = this.parseSingleBound();
        }

        return ret;
    }

    // Tries to consume "in" | "out" | "inout" as a direction keyword.
    // Must be followed by whitespace and a valid identifier to avoid
    // consuming a type parameter literally named "in" or "out".
    private parseDirection(): TypeDeclaration["direction"] | undefined {
        for (const candidate of ["inout", "in", "out"] as const) {
            const slice = this.input.slice(this.pos, this.pos + candidate.length);
            const after = this.input[this.pos + candidate.length];
            if (slice === candidate && after !== undefined && /\s/.test(after)) {
                // peek ahead: next non-whitespace must be a valid identifier start
                // (the type parameter name) to confirm this is a direction keyword
                const rest = this.input.slice(this.pos + candidate.length).trimStart();
                if (/^[A-Za-z_$]/.test(rest)) {
                    this.pos += candidate.length;
                    return candidate;
                }
            }
        }
        return undefined;
    }

    private parseBoundList(): GenericType[] {
        const bounds: GenericType[] = [this.parseSingleBound()];
        this.skipWS();
        while (this.tryConsume("&")) {
            this.skipWS();
            bounds.push(this.parseSingleBound());
            this.skipWS();
        }
        return bounds;
    }

    private parseSingleBound(): GenericType {
        const slice = this.input.slice(this.pos);
        console.log("parse single bound", {slice, input:this.input, this:this, cl:this.classes, e:this.enums, td: this.typeDeclarations});
        const inner = new GenericTypeParser(slice, this.classes, this.enums, this.typeDeclarations);
        const ref = inner.parseRef();
        this.pos += inner.getPos();
        return ref;
    }

    private tryConsume(word: string): boolean {
        const slice = this.input.slice(this.pos, this.pos + word.length);
        const after = this.input[this.pos + word.length];
        if (slice === word && (after === undefined || /\W/.test(after))) {
            this.pos += word.length;
            return true;
        }
        return false;
    }

    private parseIdentifier(): string {
        const match = /^[A-Za-z_$][A-Za-z0-9_$]*/.exec(this.input.slice(this.pos));
        if (!match) return "";
        this.pos += match[0].length;
        return match[0];
    }

    private skipWS(): void {
        while (this.pos < this.input.length && /\s/.test(this.input[this.pos]))
            this.pos++;
    }
}
// A type parameter declaration (the <T extends ...> part in a class or function header)


/*| { kind: "raw";        classifier: TYPE }
// e.g. List (no type args — raw/non-generic use)

| { kind: "parameterized"; classifier: TYPE; typeArgs: GenericType[] }
// e.g. Map<String, List<T>>

| { kind: "raw";  name: GenericTypeName }
// e.g. T, K, V — reference to a declared type parameter

| { kind: "wildcard";   upper: TYPE[]; lower: TYPE[] }* /
// e.g. ?, ? extends Foo, ? super Bar
// upper: [] + lower: [] = unbounded ?
// upper: ["Foo"]        = ? extends Foo
// lower: ["Bar"]        = ? super Bar

| { kind: "intersection"; operands: GenericType[] }
// e.g. T extends A & B used as a standalone type (rare but valid in some languages)

| { kind: "array";      componentType: GenericType }
// e.g. T[], List<T>[] — if your platform targets Java-like languages
*/

let type: any;






// T                      simple generic
let simpleT = new GenericType("raw");
simpleT.classifier = "T";

// List                         no type args — raw/non-generic use
type = new GenericType("raw"); // raw keyword can be removed and replaced with "parameterized" with empty parameter array

// List<T>                      simple parameterized
let listType = new GenericType("parameterized");
listType.typeArgs = [simpleT];

// Map<String, List<T>>         nested parameterized
type = new GenericType("parameterized");
type.typeArgs = [
    new GenericType("raw"),
    listType
];

// Map<K, List<T>>              nested parameterized 2
type = new GenericType("parameterized");
type.typeArgs = [
    {...new GenericType("raw"), classifier: "K"},
    listType
];
// ? extends Foo        upper wildcard
type = new GenericType("wildcard");
type.upper = [listType];









// Resolver: turns an ecore classifier reference string like
//   "#//Foo"  or  "ecore:EDataType http://...#//EString"
// into your internal TYPE (Pointer or plain name string).
// You must supply this from your model-loading context.
type ClassifierResolver = (ecoreRef: string) => TYPE;

// ------------------------------------------------------------------
// Raw JSON shapes produced by XMI parsing
// ------------------------------------------------------------------

class ECoreGenericType {
    static "eClassifier" =   "eClassifier" as const;
    static "eTypeParameter" = "eTypeParameter" as const;
    static "eTypeArguments" =  "eTypeArguments" as const;
    static "eBounds" =  "eBounds" as const;

    static "eclassifier" =   "eclassifier" as const;
    static "etypeparameter" = "etypeparameter" as const;
    static "etypearguments" =  "etypearguments" as const;
    static "ebounds" =  "ebounds" as const;

    // A wildcard has neither eClassifier nor eTypeParameter
}

// removes XMI inline marker and transforms all keys to lowercase.
function normalizeEcoreKeys<T extends GObject>(go: T, deep = true): T{
    go = {...go};
    for (let k0 in go) {
        if (typeof k0 !== "string") continue;
        let v = go[k0];
        delete go[k0];
        let ks = k0 as string & keyof T;
        ks = ks.toLowerCase();
        if (ks[0] === EcoreParser.XMLinlineMarker) ks = ks.substring(1);
        if (deep && v && typeof v === "object") {
            if (Array.isArray(v)) v = v.map((e: unknown)=> {
                if (!e || typeof e !== "object") return e;
                return normalizeEcoreKeys(e);
            });
            else v = normalizeEcoreKeys(v);
        }
        go[ks] = v;
    }
    return go;
}


// ------------------------------------------------------------------
// Raw JSON shapes produced by XMI parsing
// ------------------------------------------------------------------

class XmiGenericTypeJson {
    eannotations?:     orArr<ECoreAnnotation>;
    "eclassifier"?:    string;  // present for raw / parameterized / wildcard-bound
    "etypeparameter"?: string;  // present for typeParam references. mutually exclusive with eclassifier but same meaning for different target types
    "etypearguments"?: orArr<XmiGenericTypeJson>;
    "ebounds"?:        orArr<XmiGenericTypeJson>;
    // A wildcard has neither eClassifier nor eTypeParameter
}

//////    parser start




let test = [
    {
        "type": "ecore:EClass",
        "name": "Composite",
        "etypeparameters": [
            {
                "name": "A",
                "ebounds": {
                    "type": "ecore:EGenericType",
                    "eclassifier": "#//List",
                    "etypearguments": [
                        {
                            "type": "ecore:EGenericType",
                            "etypeparameter": "#//Composite/B"
                        }
                    ]
                }
            },
            {
                "name": "B",
                "ebounds": {
                    "type": "ecore:EGenericType",
                    "eclassifier": "#//Dictionary",
                    "etypearguments": [
                        {
                            "type": "ecore:EGenericType",
                            "etypeparameter": "#//Composite/K"
                        },
                        {
                            "type": "ecore:EGenericType",
                            "etypeparameter": "#//Composite/V"
                        }
                    ]
                }
            },
            {
                "name": "K",
                "ebounds": {
                    "type": "ecore:EGenericType",
                    "eclassifier": "ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EString"
                }
            },
            {
                "name": "V",
                "ebounds": {
                    "type": "ecore:EGenericType",
                    "eclassifier": "#//Number"
                }
            }
        ]
    },
    {
        "type": "ecore:EClass",
        "name": "Dictionary",
        "etypeparameters": [
            {
                "name": "Key"
            },
            {
                "name": "Value"
            }
        ]
    },
];
// g

type ResolveClassifierFn = (ref: Pointer | string) => LClassifier | null;

// --- Serialization Functions ---


// Expressive semantic aliases mapping to XMI structural roles
type EBound = EGenericType; // eBounds can appear as XMI tag, but the name only comes from the container property, they are actually EGenericType as of contents.
type ETypeArgument = EGenericType;
type EGenericSuperTypes = EGenericType;
type EUpperBound = EGenericType;
type ELowerBound = EGenericType;

// Structural application
export class ETypeParameter { // K extends ...
    name!: string;
    ebounds!: EBound[];
}
export class TypeDeclaration {
    id?: Pointer<DTypeDeclaration>
    name!: string;
    upper!: (GenericType | TYPE)[];
    lower!: (GenericType | TYPE)[];
    direction!: "in" | "out" | "inout"; // also called variance: Input (contravariant) or an Output (covariant).
    defaultType?: GenericType | TYPE;
    constructor() {
        this.upper = [];
        this.lower = [];
        this.direction = "inout";
        this.defaultType = undefined;
        this.name = "T";
    }
}

// ? type TypeDecl = EGenericType;
// ? type TypeFill = ETypeParameter;


class EGenericType { // todo: not ecore's structure, when i'm using this? use instead XmiGenericTypeJson
    elowerbound?: ELowerBound;
    eupperbound?: EUpperBound;
    etypearguments?: ETypeArgument[]; // containment, assign a value to a generic type, can only appear to fill slots in extending a egenericsupertype
    // non-containment:
    // erawtype!: string | Pointer<DClassifier>; // derived attribute, strips away all type arguments and returns the bare underlying classifier.
    eclassifier?: string | Pointer<DClassifier>; // mutually exclusive with etypeparameter
    // SINGLE type used for typing features with a generic type, like: class Tree<T>{ public node:T }
    // etypeparameter is mutually exclusive with eclassifier
    etypeparameter?: Pointer<DTypeDeclaration | DClass> | string; // <Date> actually a string (name) or ecore style pointer to ETypeParameter. cannot have type parameter instantiations (etypearguments)
}
// public class Repository<T extends Number> extends AbstractData<T, String> { }
//                         T = ETypeParameter declaration,
//                                                  AbstractData<T, String> = EGenericSuperTypes(EGenericType)
//                                                                T, String = 2 different eTypeParameter
// class -> eGenericSuperTypes eIDAttribute (todo add this)


// (class | operation) --> eTypeParameter --> eBounds
// eGenericType --> eTypeArguments

// (ETypeParameter, ETypedElement) --> eGenericType

/**
 * Serializes a GObject structure back into a Java-like generic declaration string.
 */
interface EcoreClassJSON {
    type?: string;
    name?: string;
    version?: string;
    nsprefix?: string;
    nsuri?: string;
    abstract?: string;
    eclassifiers?: GObject[];
    ebounds?: GObject;
    eclassifier?: Pointer;

    etypeparameters?: ETypeParameter[];
    // non contain?
    egenericsupertypes?: EGenericSuperTypes[]; // only references, assign a value to a eTypeParameter.
    // class can only do it when extending, like: class C extends List<String>{}
}

function resolveClassifier(s: string, m: LModel): LClassifier | null{
    // as ecore primitive
    let ptr = U.solveEcoreType(s, true);
    if (ptr) return L.from(ptr) || null;
    if (Pointers.isPointer(s)) return L.from(s) || null;
    else return LValue.resolveReference(s, m) as any || null;
}

export function serializeETypeParameter_old(arr: ETypeParameter[], m: LModel, asID: boolean = true ): string | null {
    const fallback = null;
    arr = normalizeArray(arr);
    if (!arr?.length) return fallback;
    return arr.map((param) => {
        let paramStr = param.name || fallback;

        // Checks if the parameter has an upper bound (extends clause)
        if (param.ebounds) {
            const boundStr = normalizeArray(param.ebounds).map(b=>GenericType.serializeGenericType(b, m, asID) || fallback).join( " & ");
            if (boundStr) paramStr += ` extends ${boundStr}`;
        }
        return paramStr;
    }).join(", ")
}

function resolveClassifierName(s: string, m: LModel, asID: boolean = true): string | null {
    // as class eid
    let lc =  resolveClassifier(s, m);
    let fallbackRet = null;
    if (lc && typeof lc === "object") return lc[asID ? "id" : "name"] || fallbackRet;
    if (typeof lc === "string") s = lc;
    // string fallback for ecore-style pointers pointing to a generic type (not in jom model)
    const fragment = s.includes("#") ? s.split("#")[1] : s;
    return fragment.split("/").pop() || fallbackRet;
}

// used in GenericType.serializeETypeParameter
function serializeETypeParameter(arr: (ETypeParameter | TypeDeclaration)[], m: LModel, asID: boolean = true): string | null {
    const fallback = null;
    arr = normalizeArray(arr);
    if (!arr?.length) return fallback;

    return arr.map((param0) => {
        const param: Partial<ETypeParameter & TypeDeclaration> = param0 as any;
        let paramStr = "";
        // 1. direction / variance prefix
        if (param.direction) {
            paramStr += `${param.direction} `;
        }

        // 2. name
        paramStr += param.name || fallback;

        // 3. upper bounds — extends clause
        if (param.upper?.length) {
            const upperStr = normalizeArray(param.upper)
                .map(b => serializeGenericTypeOrType(b, m, asID) || fallback)
                .filter(e=>!!e)
                .join(" & ");
            param.upper.map(b=> GenericType.serializeGenericType(b, m, asID));

            if (param.ebounds) {
                const boundStr = normalizeArray(param.ebounds).map(b=>GenericType.serializeGenericType(b, m, asID) || fallback).join( " & ");
                if (boundStr) paramStr += ` extends ${boundStr}`;
            }
            if (upperStr) paramStr += ` extends ${upperStr}`;
        }

        // 4. lower bounds — super clause
        if (param.lower?.length) {
            const lowerStr = normalizeArray(param.lower)
                .map(b => serializeGenericTypeOrType(b, m, asID) || fallback)
                .filter(Boolean)
                .join(" & ");
            if (lowerStr) paramStr += ` super ${lowerStr}`;
        }

        // 5. default type
        if (param.defaultType !== undefined) {
            const defaultStr = serializeGenericTypeOrType(param.defaultType, m, asID);
            if (defaultStr) paramStr += ` = ${defaultStr}`;
        }

        return paramStr;
    }).join(", ");
}

// dispatcher — routes to the correct serializer depending on whether
// the value is a GenericType node or a plain TYPE (Pointer / string)
function serializeGenericTypeOrType(value: GenericType | TYPE, m: LModel, asID: boolean): string | null {
    if (value instanceof GenericType) {
        return GenericType.serializeGenericType(value, m, asID);
    }
    // plain TYPE: either a Pointer<DClassifier> or a raw string name
    if (typeof value === "string") return value;
    return (value as any).name ?? (value as any).toString() ?? null;
}

/**
 * recursively serialize (eBounds / eTypeArguments / eGenericType / eGenericSuperTypes / eGenericExceptions) GObjects.
 */
// const GTKeys = ["classifier" || "operandsTuple" || "operandsOr" || "operandsAnd" || "operandsDifference" || "operandsComplement" || "operandsArray" || "typeArgs" || ".upper" || "lower" || "kind"] as keyof GenericType
const J_GTKeys = Object.keys(new GenericType("raw")) as (keyof GenericType)[];
const E_GTKeys = Object.keys(new EGenericType()) as (keyof EGenericType)[];
// used in GenericType.serializeEcoreGenericType
export function serializeECoreGenericType(gType: EBound | EGenericType, m: LModel, asID: boolean = true): string {
    const fallback = "";
    // if (!gType) return fallback;
    // if (typeof gType === "string") return gType;
    gType = normalizeEcoreKeys(gType);
    // NB: eclassifier and etypeparameter are mutually exclusive: (public next: List) vs (public next: T)
    // Case 1: The generic type points to a concrete classifier (e.g., #//List)
    if (gType.eclassifier) {
        const baseName = resolveClassifierName(gType.eclassifier, m, asID) || fallback;
        // if (!baseName) return fallback;
        // If it has nested type arguments (e.g., List<B>), process them recursively
        let args: string = "";
        let arr = normalizeArray(gType.etypearguments);
        if (arr && arr.length > 0) {
            args = arr.map((arg) => serializeECoreGenericType(arg, m, asID) || fallback)
                .join(", ");
        }
        return baseName + (args.length ? `<${args}>` : "");
    }

    // Case 2: The generic type points to a local type parameter reference (e.g., #//Composite/B), cannot have type parameter instantiations
    if (gType.etypeparameter) {
        return resolveClassifierName(gType.etypeparameter, m, asID) || fallback;
    }

    // Case 3: Wildcards (? / ? extends T / ? super T)
    // Neither eclassifier nor etypeparameter is set here
    if (gType.eupperbound) return `? extends ${serializeECoreGenericType(gType.eupperbound, m, asID) || fallback}`;
    if (gType.elowerbound) return `? super ${serializeECoreGenericType(gType.elowerbound, m, asID) || fallback}`;
    // Pure wildcard: List<?>
    return "?";
}

let windoww = window as any;
windoww.serializeECoreGenericType = GenericType.serializeGenericType;
windoww.serializeETypeParameter = serializeETypeParameter;
windoww.test = test;
setTimeout(()=>{

windoww.jsonn = windoww.XMI.toJSON(`<?xml version="1.0" encoding="UTF-8"?>
<ecore:EPackage xmi:version="2.0" xmlns:xmi="http://www.omg.org/XMI" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xmlns:ecore="http://www.eclipse.org/emf/2002/Ecore" name="generics_example" nsURI="http://www.example.org/generics_example"
    nsPrefix="generics_example">
  
  <!-- Example of ETypeParameter definition on an EClass -->
  <eClassifiers xsi:type="ecore:EClass" name="Repository">
    <eTypeParameters name="T"/>
    <eStructuralFeatures xsi:type="ecore:EReference" name="elements" upperBound="-1">
      <!-- Example of EGenericType referencing an ETypeParameter -->
      <eGenericType eTypeParameter="#//Repository/T"/>
    </eStructuralFeatures>
  </eClassifiers>

  <!-- Example of EClass that binds a specific type to a generic class using EGenericType -->
  <eClassifiers xsi:type="ecore:EClass" name="StringRepository" eSuperTypes="#//Repository">
    <eGenericSuperTypes eClassifier="#//Repository">
      <!-- Example of EGenericType specifying the type argument for the super type -->
      <eTypeArguments eClassifier="ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EString"/>
    </eGenericSuperTypes>

  </eClassifiers>

  <!-- Example of ETypeParameter definition on an EOperation -->
  <eClassifiers xsi:type="ecore:EClass" name="UtilityContainer">
    <eOperations name="transform" upperBound="-1">
      <eTypeParameters name="E"/>
      <!-- The operation returns a list of E generic types -->
      <eGenericType eTypeParameter="#//UtilityContainer/transform/E"/>
      <eParameters name="input" upperBound="-1">
        <!-- The operation accepts a list of E generic types -->
        <eGenericType eTypeParameter="#//UtilityContainer/transform/E"/>
      </eParameters>
    </eOperations>
  </eClassifiers>

</ecore:EPackage>
`);
}, 1000);
// c
/*
function xmiToJavaString(
    node: XmiGenericTypeJson,
    resolveClassifier: ClassifierResolver,
    resolveTypeParam: (path: string) => string,  // resolves "../0/Container/0" → "T"
    mode:"name" | "id" | "jsx" = "name"
): string | null{
    const classifierRef  = node[ECoreGenericType.eclassifier];
    const typeParamRef   = node[ECoreGenericType.etypeparameter];
    const typeArgs   = normalizeArray(node[ECoreGenericType.etypearguments]);
    const bounds     = normalizeArray(node[ECoreGenericType.ebounds]);
    let useID = mode === "id";
    let useJSX = mode === "jsx";

    // 1. type parameter reference  →  T
    if (typeParamRef !== undefined) {
        return resolveTypeParam(typeParamRef);
    }

    // 2. wildcard
    if (classifierRef === undefined) {
        if (bounds.length === 0) return "?";
        const boundStr = bounds
            .map(b => xmiToJavaString(b, resolveClassifier, resolveTypeParam))
            .join(" & ");
        return `? extends ${boundStr}`;
        // note: Ecore has no lower bound / super, so we never emit "? super ..."
    }

    // 3. raw or parameterized
    let lclassifier: LClassifier | null = resolveClassifier(classifierRef);
    const name = (useID ? lclassifier?.id : lclassifier?.name) || classifierRef;

    if (typeArgs.length === 0) return name;

    const argsStr = typeArgs
        .map(a => xmiToJavaString(a, resolveClassifier, resolveTypeParam))
        .join(", ");
    return `${name}<${argsStr}>`;
}

function xmiTypeParamToJavaString(
    node: XmiTypeParameterJson,
    resolveClassifier: ClassifierResolver,
    resolveTypeParam: (path: string) => string
): string {
    const name   = node["@_name"];
    const bounds = normalizeArray(node["eBounds"]);

    if (bounds.length === 0) return name;
    // e.g.  T extends Shape & Bidimensional
    const boundsStr = bounds
        .map(b => xmiToJavaString(b, resolveClassifier, resolveTypeParam))
        .join(" & ");
    return `${name} extends ${boundsStr}`;
}
// ------------------------------------------------------------------
// STEP 2 — Java string → GenericTypeRef
//          reuses the GenericTypeParser from previous discussion
// ------------------------------------------------------------------

function javaStringToGenericTypeRef(
    javaStr: string,
    scopeTypeParams: Set<string> = new Set()
): GenericTypeRef {
    // Swap the heuristic single-uppercase-letter detection for an explicit
    // scope set so callers control exactly which names are type parameters.
    const parser = new ScopedGenericTypeParser(javaStr, scopeTypeParams);
    return parser.parseRef();
}

// ------------------------------------------------------------------
// COMPOSED — XMI JSON → GenericTypeRef
// ------------------------------------------------------------------

function xmiToGenericTypeRef(
    node: XmiGenericTypeJson,
    resolveClassifier: ClassifierResolver,
    resolveTypeParam: (path: string) => string,
    scopeTypeParams: Set<string> = new Set()
): GenericTypeRef {
    const javaStr = xmiToJavaString(node, resolveClassifier, resolveTypeParam);
    return javaStringToGenericTypeRef(javaStr, scopeTypeParams);
}

// ------------------------------------------------------------------
// ScopedGenericTypeParser
// Replaces the heuristic uppercase-letter detection with an explicit
// set of in-scope type parameter names supplied by the caller.
// Everything else is identical to GenericTypeParser.
// ------------------------------------------------------------------

class ScopedGenericTypeParser {
    private pos: number = 0;

    constructor(
        private input: string,
        private scopeTypeParams: Set<string>
    ) {}

    parseRef(): GenericTypeRef {
        this.skipWS();
        const ref = this.parseIntersectionOrSingle();
        this.skipWS();
        return ref;
    }

    private parseIntersectionOrSingle(): GenericTypeRef {
        const first = this.parseArraySuffix();
        this.skipWS();
        if (this.peek() === "&") {
            const operands: GenericTypeRef[] = [first];
            while (this.peek() === "&") {
                this.consume("&");
                this.skipWS();
                operands.push(this.parseArraySuffix());
                this.skipWS();
            }
            return new GenericTypeRef("intersection", undefined, undefined, [], [], [], operands);
        }
        return first;
    }

    private parseArraySuffix(): GenericTypeRef {
        let ref = this.parsePrimary();
        this.skipWS();
        while (this.input.startsWith("[]", this.pos)) {
            this.pos += 2;
            ref = new GenericTypeRef("array", undefined, undefined, [], [], [], [], ref);
            this.skipWS();
        }
        return ref;
    }

    private parsePrimary(): GenericTypeRef {
        this.skipWS();

        if (this.peek() === "(") {
            this.consume("(");
            const inner = this.parseRef();
            this.skipWS();
            this.consume(")");
            return inner;
        }

        if (this.peek() === "?") {
            this.consume("?");
            this.skipWS();
            if (this.tryConsume("extends")) {
                this.skipWS();
                const bounds = this.parseBoundList();
                return new GenericTypeRef("wildcard", undefined, undefined, [], bounds, []);
            }
            if (this.tryConsume("super")) {
                this.skipWS();
                const bounds = this.parseBoundList();
                return new GenericTypeRef("wildcard", undefined, undefined, [], [], bounds);
            }
            return new GenericTypeRef("wildcard");
        }

        const name = this.parseIdentifier();
        if (!name) throw new Error(
            `Unexpected token at pos ${this.pos}: "${this.input.slice(this.pos, this.pos + 10)}"`
        );

        this.skipWS();

        if (this.peek() === "<") {
            this.consume("<");
            const args: GenericTypeRef[] = [];
            this.skipWS();
            if (this.peek() !== ">") {
                args.push(this.parseRef());
                this.skipWS();
                while (this.peek() === ",") {
                    this.consume(",");
                    this.skipWS();
                    args.push(this.parseRef());
                    this.skipWS();
                }
            }
            this.consume(">");
            return new GenericTypeRef("parameterized", name, undefined, args);
        }

        // explicit scope check replaces the heuristic
        if (this.scopeTypeParams.has(name)) {
            return new GenericTypeRef("typeParam" --> became "raw", undefined, name);
        }
        return new GenericTypeRef("raw", name);
    }

    private parseBoundList(): GenericTypeRef[] {
        const bounds: GenericTypeRef[] = [this.parseArraySuffix()];
        this.skipWS();
        while (this.peek() === "&") {
            this.consume("&");
            this.skipWS();
            bounds.push(this.parseArraySuffix());
            this.skipWS();
        }
        return bounds;
    }

    private peek(): string { return this.input[this.pos] ?? ""; }

    private consume(expected: string): void {
        if (!this.input.startsWith(expected, this.pos))
            throw new Error(
                `Expected "${expected}" at pos ${this.pos}, got "${this.input.slice(this.pos, this.pos + expected.length)}"`
            );
        this.pos += expected.length;
    }

    private tryConsume(word: string): boolean {
        const slice = this.input.slice(this.pos, this.pos + word.length);
        const after = this.input[this.pos + word.length];
        if (slice === word && (after === undefined || /\W/.test(after))) {
            this.pos += word.length;
            return true;
        }
        return false;
    }

    private parseIdentifier(): string {
        const match = /^[A-Za-z_$][A-Za-z0-9_$]*/
/*.exec(this.input.slice(this.pos));
        if (!match) return "";
        this.pos += match[0].length;
        return match[0];
    }

    private skipWS(): void {
        while (this.pos < this.input.length && /\s/.test(this.input[this.pos]))
            this.pos++;
    }
}




*/



























// XMI parsers emit a single object when there is one child,
// and an array when there are multiple. Normalise to always array.
function normalizeArray<T>(value: T | T[] | undefined): T[] {
    if (value === undefined || value === null) return [];
    return Array.isArray(value) ? value : [value];
}


