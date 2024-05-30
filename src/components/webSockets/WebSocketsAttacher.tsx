
import {Action, DProject, Pointer} from '../../joiner';
import type {CompositeAction, GObject, LProject} from '../../joiner';
import {useEffectOnce} from 'usehooks-ts';
import WebSockets from './WebSockets';

interface Props {projectID: Pointer<DProject, 1, 1, LProject>}
function WebSocketsAttacher(props: Props) {
    const {projectID} = props;

    useEffectOnce(() => {
        // SetRootFieldAction.new('collaborativeSession', true);
        WebSockets.iot.io.opts.query = {'project': projectID};
        WebSockets.iot.connect();
    });

    WebSockets.iot.on('pullAction', (action: GObject<Action & CompositeAction>) => {
        const receivedAction = Action.fromJson(action);
        console.log('Received Action from server.', action);
        receivedAction.hasFired = 0;
        receivedAction.fire();
    });

    return(<></>);
}

export default WebSocketsAttacher;
