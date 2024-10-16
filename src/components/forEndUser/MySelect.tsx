import {DPointerTargetable, LClass, LModel, Defaults, U, Input} from '../../joiner';
import {DState, GObject, LEnumerator, LPointerTargetable, Overlap, Pointer} from '../../joiner';
import React, {Dispatch, LegacyRef, ReactElement, ReactNode} from 'react';
import {connect} from 'react-redux';
import {useStateIfMounted} from 'use-state-if-mounted';
import './inputselect.scss';


function SelectorComponent(props: AllProps) {
    
    const data = props.data;
    const [showTooltip, setShowTooltip] = useStateIfMounted(false);
    if (!data) return(<></>);
    let d: DPointerTargetable = data.__raw || data;
    let l: LPointerTargetable = LPointerTargetable.fromD(data);
    let gdata: GObject<LPointerTargetable> = data;
    const field: (keyof LPointerTargetable & keyof DPointerTargetable) = props.field as any;
    const readOnly = props.readonly !== undefined ? props.readonly : !props.debugmode && Defaults.check(data.id);
    const value: string | Pointer = props.getter ? props.getter(d, field) : d[field] as string;
    const label: string|undefined = props.label;
    const jsxLabel: ReactNode|undefined = props.jsxLabel;
    let tooltip: string|undefined = (props.tooltip === true) ? ((gdata['__info_of__' + field]) ? gdata['__info_of__' + field].txt: '') : props.tooltip;
    tooltip = tooltip || '';
    let css = '';//'my-auto select ';
   // css += (jsxLabel) ? 'ms-1' : 'ms-auto';
    css += (props.hidden) ? ' hidden-input' : '';

    
    /* @ts-ignore */
    let setter = (id) => {l.value=id} 
    
    /* @ts-ignore */
    let getter = () => l.$type.__raw.values[0];
    

    function SelectorChange(evt: React.ChangeEvent<HTMLSelectElement>) {
        if (readOnly) return;
        const newValue = evt.target.value;
        const oldValue = getter ? getter() : d[field] as string;
        if (newValue === oldValue) return;
        if (setter) setter(newValue);
        else (data as GObject)[field] = newValue;
    }

    // 

    function getOptions(): any {
        
        console.log('ALF ',l, data);
        return (<>
            {/* @ts-ignore */}
            {l.type.father.instanceof[field].type.allInstances.map(cl => 
                <option value={cl.id}>{cl.name}</option>    
            )}

        </>)
        
    }

    const otherprops: GObject = {...props};
    delete otherprops.data;
    delete otherprops.getter;
    delete otherprops.setter;
    delete otherprops.jsxLabel;
    delete otherprops.primitives;
    delete otherprops.returns;
    delete otherprops.hidden;
    let cursor: string;
    if (tooltip) cursor = 'help';
    else if (readOnly) cursor = 'not-allowed';
    else cursor = 'pointer';
    let inputStyle = props.inputStyle || {};
    if (!inputStyle.cursor && cursor === 'not-allowed') { inputStyle.cursor = cursor; }
    U.objectMergeInPlace(inputStyle, props.inputStyle || {}, props.style || {});
    let className = [props.className, props.inputClassName, css].join(' ');


    let select = (<select {...otherprops} className={className+ ' model-select'} disabled={readOnly}
            style={props.inputStyle}
            value={value}
            onChange={SelectorChange}>
                {getOptions()}
    </select>);


    return select;
}

SelectorComponent.cname = 'SelectorComponent';
export interface SelectorOwnProps {
    data?: DPointerTargetable | Pointer<DPointerTargetable, 1, 1, LPointerTargetable>;
    field: string;
    label?: string;
    jsxLabel?: ReactNode;
    tooltip?: boolean|string;
    hidden?: boolean;
    options?: JSX.Element;
    key?: React.Key | null;
    className?: string;
    style?: GObject;
    ref?: React.RefObject<HTMLElement> | LegacyRef<HTMLElement>;
    readonly?: boolean;
    inputClassName?: string;
    inputStyle?: GObject;
    // DANGER: use the data provided in parameters instead of using js closure, as the proxy accessed from using closure won't be updated in rerenders.
    getter?: <T extends DPointerTargetable = any>(data: any | T | Pointer<T>, field: (string | number | symbol) | keyof T) => string;
    // setter?: <T extends DPointerTargetable = any>(data: T | Pointer<T>, field: keyof T, selectedValue: string) => void;
    // setter?: <T extends DPointerTargetable = any>(data: any | T | Pointer<T>, field: (string | number | symbol) | keyof T, selectedValue: string) => void;
    setter?: (data: any, field: string, selectedValue: string) => void;

}
interface StateProps {
    debugmode: boolean,
    data: LPointerTargetable;
    primitives: LClass[];
    returns: LClass[]; }
interface DispatchProps { }

type AllProps = Overlap<SelectorOwnProps, Overlap<StateProps, DispatchProps>>;


function mapStateToProps(state: DState, ownProps: SelectorOwnProps): StateProps {
    const ret: StateProps = {} as any;
    if (!ownProps.data) return ret;
    const pointer: Pointer = typeof ownProps.data === 'string' ? ownProps.data : ownProps.data.id;
    ret.debugmode = state.debug;
    ret.data = LPointerTargetable.fromPointer(pointer);
    ret.primitives = LPointerTargetable.fromPointer(state.primitiveTypes);
    ret.returns = LPointerTargetable.fromPointer(state.returnTypes);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const SelectorConnected = connect<StateProps, DispatchProps, SelectorOwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(SelectorComponent);

export const Selector = (props: SelectorOwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <SelectorConnected {...{...props, children}} />;
}


SelectorComponent.cname = 'SelectorComponent';
SelectorConnected.cname = 'SelectorConnected';
Selector.cname = 'Selector';
export default Selector;
