import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import {DModel, Pointer, Try} from "../../../joiner";
import {CreateElementAction, DGraph, DModelElement, DState, LGraph, LModel, LModelElement} from "../../../joiner";
import {DefaultNode} from "../../../joiner/components";
import ToolBar from "../../toolbar/ToolBar";
import ContextMenu from "../../contextMenu/ContextMenu";
import { MetricsPanel } from "../../metrics/Metrics";


function ModelTabComponent(props: AllProps) {
    const model = props.model;
    const graph = props.graph;

    if (!model) return(<>closed tab</>);
    if (!graph) {
        CreateElementAction.new(DGraph.new(0, model.id));
        return(<div style={{width: "100%", height: "100%", display: "flex"}}>
            <span style={{margin: "auto"}}>Building the Graph...</span>
        </div>);
    }

    return(<div className={'w-100 h-100'}>
        <ContextMenu />
        <div className={'d-flex h-100'}>
            <ToolBar model={model.id} isMetamodel={model.isMetamodel} metamodelId={props.metamodelid} />
            <Try>
                <div className={"GraphContainer h-100 w-100"} style={{position:"relative"}}>
                    {graph && <DefaultNode data={model} nodeid={graph.id} graphid={graph.id} />}
                </div>
            </Try>
        </div>
    </div>);
}
interface OwnProps {
    modelid: Pointer<DModel, 1, 1, LModel>,
    metamodelid?: Pointer<DModelElement, 1, 1, LModelElement>,
}
interface StateProps { model: LModel, graph?: LGraph }
interface DispatchProps { }
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    ret.model = LModel.fromPointer(ownProps.modelid);
    const graphs: DGraph[] = DGraph.fromPointer(state.graphs);
    const pointers = graphs.filter((graph) => { return graph.model === ownProps.modelid });
    if(pointers.length > 0) ret.graph = LGraph.fromPointer(pointers[0].id);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const ModelTabConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(ModelTabComponent);

export const ModelTab = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <ModelTabConnected {...{...props, children}} />;
}
export default ModelTab;
