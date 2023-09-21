import React, {Dispatch, InputHTMLAttributes, PureComponent, ReactNode} from "react";
import { connect } from "react-redux";
import './GenericInput.scss';
import {
    Pointer,
    Info,
    GObject,
    DocString,
    Dictionary,
    Log,
    TextArea,
    Select,
    ShortAttribETypes,
    Input, LViewElement, DViewElement, U
} from "../../joiner";
import {DState, DPointerTargetable, LPointerTargetable, RuntimeAccessibleClass} from "../../joiner";
import {SizeInput} from "./SizeInput";

// private
interface ThisState {
}
type Dic<K extends string|number, V> = Dictionary<K, V>;
type String<T> = DocString<T>;
class GenericInputComponent extends PureComponent<AllProps, ThisState/*undefined*/>{
    constructor(props: AllProps, context: any) {
        super(props, context);
    }

    render(): ReactNode {
        let d: DViewElement = ((this.props.data as LPointerTargetable).__raw || this.props.data) as any;
        let l: LViewElement = LPointerTargetable.wrap(this.props.data) as LViewElement;
        let field: keyof LViewElement = this.props.field as any;
        let infoof: GObject<Info>;
        if (!this.props.infoof){
            let DConstructor: typeof DPointerTargetable = RuntimeAccessibleClass.get(d.className);
            let singleton: GObject<LPointerTargetable> = DConstructor.singleton;
            infoof = singleton["__info_of__" + this.props.field] ;
        } else infoof = this.props.infoof;

        let type: string;
        let enumOptions: Dic<String<"optgroup">, Dic<String<"options">, String<"values">>> = {}; // "Options" entry is a fallback for items without an optgroup
        let enumOptionsJSX: JSX.Element | undefined;
        if (infoof.enum) {
            type = "EEnum";
            let prevoptgroup: string = "Options";
            let group: string;
            let option: string;
            for (let key in infoof.enum) {
                let val: string = infoof.enum[key];
                if (key.indexOf("(") === 0) {
                    let endi = key.indexOf(")");
                    group = key.substring(1, endi).trim();
                    option = key.substring(endi+1).trim();
                    prevoptgroup = group;
                } else {
                    option = key;
                    group = prevoptgroup;
                }
                if (!enumOptions[group]) enumOptions[group] = {};
                enumOptions[group][option] = val;
            }
            let unsorted = enumOptions.Options;
            delete enumOptions.Options;
            enumOptionsJSX = <>
                {
                    //data-selected={l[field] === unsorted[optkey]}
                    unsorted && Object.keys(unsorted).map( (optkey: string) => <option value={unsorted[optkey]}>{optkey}</option>)
                }
                {Object.keys(enumOptions).map((grpkey: string) => <optgroup label={grpkey}>{
                Object.keys(enumOptions[grpkey]).map( (optkey: string) => <option value={enumOptions[grpkey][optkey]}>{optkey}</option>)
            }</optgroup>)}</>;
        }
        else {
            if (typeof infoof.type === "string") {
                if (infoof.type.indexOf("Function") === 0) type = "Function";
                else type = infoof.type;
            }
            else {
                if (!infoof.type) { Log.exDevv("missing __info_of__ type for " + d.className + "." + this.props.field, {d, infoof, props:this.props}); return <></>}
                let infotype: GObject = infoof.type;
                type = infotype.cname || infotype.className || infotype.name;
                Log.exDev(!type, "missing type:", {type, infoof});
            }
        }

        /*if (type.indexOf("|") !== -1) {
            type = "EEnum";
            let options = type.split("|");
            if (!enumOptions.Option) enumOptions.Option = {};
            for (let o in options){
                o = o.trim();
                enumOptions.Option[o] = o;
            }
        }*/

        // const otherProps: {[inputattribute:HTMLInputTypeAttribute]: any} = {...this.props};
        const otherProps: InputHTMLAttributes<Event> = {...this.props} as any;
        function setMinMax(max: number): void {
            if (infoof.min !== undefined) otherProps.min = infoof.min;
            else otherProps.min = infoof.positive === true ? 0 : -max / 2; // assume false if non specified

            if (infoof.max !== undefined) otherProps.max = infoof.max;
            else otherProps.max = infoof.positive === false ? max/2 - 1 : max-1; // assume true if non specified
        }
        let label = U.uppercaseFirstLetter(infoof.label || this.props.field);

        switch (type) {
            default:
                Log.e("invalid type in GenericInput", {type, props:this.props, infoof, d});
                return <div {...otherProps as any} className={"danger"} style={{color: "red", border: "1px solid red"}}>Invalid GInput type: "{type}"</div>;
            case "Point": case "GraphPoint": case "Size": case "GraphSize":
                return <SizeInput {...otherProps} data={l} field={this.props.field} label={label} />;
            case "text": case "Function":
                return <TextArea inputClassName={"input my-auto ms-auto "} {...otherProps} className={this.props.rootClassName}
                                 data={this.props.data} field={this.props.field}
                                 jsxLabel={label} tooltip={infoof.text}></TextArea>;
            case "EEnum":
                return <Select inputClassName={"my-auto ms-auto select"} {...otherProps} className={this.props.rootClassName}
                               data={this.props.data} field={this.props.field} options={enumOptionsJSX}
                               jsxLabel={label} tooltip={infoof.text} />;
                // <input> natives
            case "radio":
                // problem: this would need to return a <form> and multiple inputs generated by a single element.
                // it should be easy but unlikely it will be needed so i won't do it for now.
                Log.eDevv("radio input type is unsuppoted"); break;
            case "datetime": type = "datetime-local"; break;
            case "color": break;
            case "email": break;
            case "image": break; // ?
            case "password": break;
            case "range": break;
            case "month": break;
            case "week": break;
            case "datetime-local": break;
            case "time": break;
            case "url": break;
            // ecore
            case ShortAttribETypes.EChar:
                type = "text";
                if (undefined === otherProps.minLength) otherProps.minLength = 1;
                otherProps.maxLength = 1;
                // otherProps.pattern = "^.{1}$";
                break;
            case ShortAttribETypes.EString: type = "text"; break;
            case ShortAttribETypes.EBoolean: type = "checkbox"; break;
            case ShortAttribETypes.EByte:
                type = "number";
                setMinMax(2**8);
                break;
            case ShortAttribETypes.EShort:
                type = "number";
                setMinMax(2**16);
                break;
            case ShortAttribETypes.EInt:
                type = "number";
                setMinMax(2**32);
                break;
            case ShortAttribETypes.ELong:
                type = "number";
                setMinMax(2**64);
                break;
            case ShortAttribETypes.EFloat:
            case ShortAttribETypes.EDouble:
                type = "number";
                if (!otherProps.step) otherProps.step = infoof.step || 0.1;
                if (!otherProps.pattern) otherProps.pattern = infoof.pattern || "^[0-9]+\.[0-9]{" + infoof.digits + "}$";
                break;
            case ShortAttribETypes.EDate: type = "datetime-local"; break;
        }
        // delete otherProps.field; delete otherProps.data; delete otherProps.infoof;
        return <Input inputClassName={"my-auto ms-auto input"} {...otherProps} className={this.props.rootClassName}
                      data={this.props.data} field={this.props.field}
                      jsxLabel={label} tooltip={infoof.text} type={type as any}/>;
    }
}

// private
interface OwnProps0 {
    // propsRequestedFromJSX_AsAttributes: string;
    data: DPointerTargetable | LPointerTargetable;
    field: string;
    infoof: Info | undefined;

    className?: string;
    rootClassName?: string;
    inputClassName?: string;
    rootStyle?: GObject;// this goes to root
    style?: GObject; // this goes at the root of <Input> or <Select> element(s)
    inputStyle?: GObject; // this goes to the actual native <input> or <select> element(s)

    /*
    they might be useful, but can just add them in without declaring all of them. i pass them like <input ...otherprops>
    multiple?: boolean;  // multi value for select! works on file, email (just changes default validation pattern), and maybe others
    size?: ??
    accept?: string // only for type = "file"
    capture?: string // only for type = "file"
    autocomplete?: string; // only for <input> types
    disabled?: boolean;
    height?: string; // for "image"
    list?: string; // datalist
    maxLength?: string; // chars
    */
    // many more skipped mostly for forms

}
type OwnProps = OwnProps0 & InputHTMLAttributes<Event>; // {[inputattribute:HTMLInputAttribute]: any};
// private
interface StateProps {
    // propsFromReduxStateOrOtherKindOfStateManagement: boolean; // flux or custom things too, unrelated to this.state of react.
}

// private
interface DispatchProps {
    // propsFromReduxActions: typeof funzioneTriggeraAzioneDaImportare;
}


// private
type AllProps = OwnProps & StateProps & DispatchProps;

////// mapper func

function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    /// to fill
    return ret; }

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {} as any;
    /// to fill
    return ret; }


export const GenericInput = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(GenericInputComponent);


/*

Supported __info_of__.type values:


- ShortAttribETypes     =   ecore type names
- text                  =   for textarea
- Function              =   for textarea
- richtext              =   for monaco editor
- native <input> types
- DPointerTargetable    = will make a select out of available elements of that kind
- GraphPoint            = will make a mini interactive square where you can select a point, output is in % [0, 1].
                          NEED A SETTER AND GETTER to get from % to coords and the other way
- GraphSize             = will make a mini interactive square where you can select a rectangle, output is in % [0, 1].
                          NEED A SETTER AND GETTER to get from % to coords and the other way


- typescript enumerators, with optgroups defined as following
        (optgroup1) option1
        option2 // assumed still in optgroup1
        option3 // assumed still in optgroup1
        (optgroup2) option4
        if first option(s) are without optgroup, they are grouped in optgroup "Options"

NOT SUPPORT
- "EEnum" string, it is only used internally. pass it the whole enum.
native <input> not supported
- radio
- tel
- search
- reset
- hidden
- image
- button
- submit








* */