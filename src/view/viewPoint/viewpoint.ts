import {
    Constructors,
    DPointerTargetable,
    DViewElement,
    GraphSize,
    LPointerTargetable,
    LViewElement,
    Pointer,
    RuntimeAccessible,
    RuntimeAccessibleClass
} from "../../joiner";


@RuntimeAccessible
export class DViewPoint extends DViewElement {
    public static cname: string = "DViewPoint";
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];

    id!: Pointer<DViewPoint, 1, 1, LViewPoint>;
    name!: string;


    public static new(name: string, jsxString: string, defaultVSize?: GraphSize, usageDeclarations: string = '', constants: string = '',
                      preRenderFunc: string = '', appliableToClasses: string[] = [], oclApplyCondition: string = '', priority: number = 1 , persist: boolean = true): DViewElement {
        return new Constructors(new DViewPoint('dwc'), undefined, persist, undefined).DPointerTargetable()
            .DViewElement(name, jsxString, defaultVSize, usageDeclarations, constants,
                preRenderFunc, appliableToClasses, oclApplyCondition, priority).DViewPoint().end();
    }
    public static new2(name: string, jsxString: string, callback?: (d:DViewElement)=>void, persist: boolean = true): DViewElement {
        return new Constructors(
            new DViewElement('dwc'), undefined, persist, undefined
        ).DPointerTargetable().DViewElement(name, jsxString).DViewPoint().end(callback);
    }
}

@RuntimeAccessible
export class LViewPoint extends LViewElement {
    public static cname: string = "LViewPoint";
    static subclasses: (typeof RuntimeAccessibleClass | string)[] = [];
    static _extends: (typeof RuntimeAccessibleClass | string)[] = [];
    //public __raw!: DViewPoint;
    id!: Pointer<DViewPoint, 1, 1, LViewPoint>;
    name!: string;
}

RuntimeAccessibleClass.set_extend(DPointerTargetable, DViewPoint);
RuntimeAccessibleClass.set_extend(LPointerTargetable, LViewPoint);
