import React, {Dispatch} from 'react';
import {
    DState,
    DViewElement,
    GenericInput,
    GObject,
    Info,
    LPointerTargetable,
    LViewElement,
    Pointer
} from '../../../../joiner';
import {FakeStateProps} from "../../../../joiner/types";
import {connect} from "react-redux";

function EdgeDataComponent(props: AllProps) {
    const view = props.view;
    const readOnly = props.readonly;
    let l: GObject & LViewElement = LViewElement.singleton as any;
    let prefixLength = '__info_of__'.length;
    let rows: JSX.Element[] = [];
    for (let fullKey in l) {
        if (fullKey[0] !== '_' || fullKey.indexOf('__info_of__') !== 0) continue;
        let info: Info = l[fullKey];
        // infos[key] = info;
        let key: string = fullKey.substring(prefixLength);
        if (info.hidden || info.obsolete || info.todo) continue;
        if (!info.isEdge) continue;
        rows.push(<div className={'input-container'}>
            <b className={'me-2'}>{key[0].toUpperCase() + key.substring(1)}:</b>
            <GenericInput rootClassName={'mx-3 mt-1 d-flex edgepoint-adjust'} className={'d-flex'} data={view}
                field={key as any} tooltip={true} info={info} disabled={readOnly} />
        </div>);
    }

    return(<section>
        <h5>Edge</h5>
        <div className={'px-2'}>
            {rows}
        </div>
    </section>);
}

interface OwnProps {
    viewID: Pointer<DViewElement>;
    readonly : boolean;
}

interface StateProps {
    view: LViewElement;
}

interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;

function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    ret.view = LPointerTargetable.fromPointer(ownProps.viewID);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}

export const EdgeData = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(EdgeDataComponent);

export default EdgeData;
