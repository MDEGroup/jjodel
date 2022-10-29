import React, {Dispatch, PureComponent, ReactElement, ReactNode} from "react";
import {connect} from "react-redux";
import {
    DGraphElement,
    DModelElement, DPointerTargetable,
    DViewElement, Input,
    IStore, LGraphElement,
    LModelElement, LViewElement, MDE,
    MyProxyHandler,
    Pointer, U,
} from "../../../joiner";
import "../rightbar.scss";
import Structure from "./Structure";



interface ThisState {}

class StructureEditorComponent extends PureComponent<AllProps, ThisState> {

    constructor(props: AllProps, context: any) {
        super(props, context);
    }

    render(): ReactNode{
        const lModelElement: LModelElement | undefined = this.props.selected?.modelElement;
        return <div className={"px-4"}>
            <h5 className={"text-center mt-2"}>Structure Editor</h5>
            <div className={"mt-3"}>
                {Structure.Editor(lModelElement)}
            </div>
            {JSON.stringify(lModelElement)}
            {lModelElement ? <>
                <button className={"btn btn-danger"} onClick={() => {lModelElement?.delete()}}>DELETE</button>
            </> : <></>}
        </div>;
    }
}

interface OwnProps {}
interface StateProps {
    selectedid?: { node: Pointer<DGraphElement, 1, 1>; view: Pointer<DViewElement, 1, 1>; modelElement: Pointer<DModelElement, 0, 1> };
    selected?: { node: LGraphElement; view: LViewElement; modelElement?: LModelElement };
}
interface DispatchProps {}

type AllProps = OwnProps & StateProps & DispatchProps;

function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    ret.selectedid = state._lastSelected;
    ret.selected = ret.selectedid && {
        node: DPointerTargetable.wrap(state.idlookup[ret.selectedid.node]) as LGraphElement,
        view: DPointerTargetable.wrap(state.idlookup[ret.selectedid.view]) as LViewElement,
        modelElement: ret.selectedid.modelElement ? DPointerTargetable.wrap<DPointerTargetable, LModelElement>(state.idlookup[ret.selectedid.modelElement]) : undefined };
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {} as any;
    return ret;
}


export const StructureEditorConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(StructureEditorComponent);

export const StructureEditor = (props: OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <StructureEditorConnected {...{...props, childrens}} />;
}
export default StructureEditor;