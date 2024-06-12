import {Action, CompositeAction, DState, DUser, GObject, LUser, SetRootFieldAction, store, U} from '../../../joiner';
import {FakeStateProps} from '../../../joiner/types';
import {Dispatch, ReactElement, ReactNode, useState} from 'react';
import {connect} from 'react-redux';
import WebSockets from "../../webSockets/WebSockets";

function makeInput(label: string, type: 'text'|'number'|'password'): ReactNode {
    return(<div className={'p-1 d-flex'}>
        <label className={'my-auto'}>{label}</label>
        <input type={type} className={'my-auto input ms-auto'} spellCheck={false} />
    </div>);
}

function MqttEditorComponent(props: AllProps) {
    const {user} = props;
    const [connected, setConnected] = useState(WebSockets.iot.connected);


    const connect = async() => {
        SetRootFieldAction.new('isLoading', true);
        WebSockets.iot.io.opts.query = {'project': user.project?.id};
        WebSockets.iot.off('pull-action');
        WebSockets.iot.on('pull-action', (receivedAction: GObject<Action & CompositeAction>) => {
            const action = Action.fromJson(receivedAction);
            if(!(action.field in store.getState()['topics']))
                SetRootFieldAction.new(action.field.replaceAll('+=', ''), [], '', false);
            action.hasFired = 0;
            console.log('Received Action from server.', action);
            action.fire();
        });
        WebSockets.iot.connect();
        await U.sleep(1);
        SetRootFieldAction.new('isLoading', false);
        setConnected(WebSockets.iot.connected);
    }
    const disconnect = async() => {
        SetRootFieldAction.new('isLoading', true);
        WebSockets.iot.off('pull-action');
        WebSockets.iot.disconnect();
        await U.sleep(1);
        SetRootFieldAction.new('isLoading', false);
        setConnected(WebSockets.iot.connected);
    }

    return <section className={'p-2'}>
        <div className={'d-flex'}>
            <h4 className={'d-block my-auto'}>MQTT</h4>
            <div style={{width: '15px', height: '15px'}} className={`d-block ms-2 my-auto circle ${connected ? 'bg-success' : 'bg-danger'}`}></div>
        </div>
        {makeInput('Host', 'text')}
        {makeInput('Port', 'number')}
        <hr className={'my-2'} />
        {makeInput('Username', 'text')}
        {makeInput('Password', 'password')}
        {!connected && <button onClick={connect} className={'mt-3 btn btn-primary w-100 p-2'}>Connect</button>}
        {connected && <button onClick={disconnect} className={'mt-3 btn btn-primary w-100 p-2'}>Disconnect</button>}
    </section>;
}
interface OwnProps {}
interface StateProps {user: LUser}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    ret.user = LUser.fromPointer(DUser.current);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const MqttEditorConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(MqttEditorComponent);

export const MqttEditor = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <MqttEditorConnected {...{...props, children}} />;
}

MqttEditorComponent.cname = 'MqttEditorComponent';
MqttEditorConnected.cname = 'MqttEditorConnected';
MqttEditor.cname = 'MqttEditor';
export default MqttEditor;
