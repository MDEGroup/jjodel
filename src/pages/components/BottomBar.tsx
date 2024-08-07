import './style.scss';
import {DState, DUser, LGraphElement, LUser} from "../../joiner";
import {FakeStateProps} from "../../joiner/types";
import {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";

function BottomBarComponent(props: AllProps): JSX.Element {
    const {node} = props;
    return(<footer className={'footer'}>
        <label className={'me-3 text-white'}> JJodel</label>
        <div className={'text-white'} hidden={!node}>(x: {node?.x}, y: {node?.y})</div>
    </footer>)
}
interface OwnProps {}
interface StateProps {node?: LGraphElement}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    const selected = state._lastSelected;
    if(selected?.node) ret.node = LGraphElement.fromPointer(selected.node);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}

export const BottomBarConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(BottomBarComponent);

const BottomBar = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <BottomBarConnected {...{...props, children}} />;
}

export {BottomBar};
