import {DModel, DValue, LClass, LModel, LObject, LProject, SetFieldAction, U} from '../../../joiner';

export class StateMachine_M1 {
    static load1(project: LProject, m2: LModel, state: LClass, transition: LClass, command: LClass, event: LClass): [LModel, LObject] {
        const m1 = this.create(undefined, project, m2);
        /* Command */
        const command1 = this.createCommand(m1, command, 'unlockDoor ud');
        const command2 = this.createCommand(m1, command, 'lockPanel lp');
        const command3 = this.createCommand(m1, command, 'unlockPanel up');
        const command4 = this.createCommand(m1, command, 'lockDoor ld');
        /* Event */
        const event1 = this.createEvent(m1, event, 'panelClosed pc');
        const event2 = this.createEvent(m1, event, 'doorClosed dc');
        const event3 = this.createEvent(m1, event, 'lightOn Io');
        const event4 = this.createEvent(m1, event, 'drawerOpened do');
        /* Events */
        const events = m1.addObject({}, null);
        /* State */
        const idle = this.createState(m1, state, 'idle', [command1, command2]);
        const active = this.createState(m1, state, 'active', []);
        const waitingForDrawer = this.createState(m1, state, 'waitingForDrawer', []);
        const waitingForLight = this.createState(m1, state, 'waitingForLight', []);
        const unlockPanel = this.createState(m1, state, 'unlockPanel', [command3, command4]);
        /* Transition */
        const transition1 = this.createTransition(m1, transition, unlockPanel, idle, event1);
        const transition2 = this.createTransition(m1, transition, idle, active, event2);
        const transition3 = this.createTransition(m1, transition, active, waitingForDrawer, event3);
        const transition4 = this.createTransition(m1, transition, active, waitingForLight, event4);
        const transition5 = this.createTransition(m1, transition, waitingForDrawer, unlockPanel, event4);
        const transition6 = this.createTransition(m1, transition, waitingForLight, unlockPanel, event3);

        return [m1, idle];
    }
    static load2(name: string, project: LProject, m2: LModel, state: LClass, transition: LClass, command: LClass, event: LClass) {
        const m1 = this.create(name, project, m2);
        /* 168 Properties (84 commands & 84 events), 40 states and 48 transitions */
        const commandsLength = 84; const eventsLength = 84; const statesLength = 40; const transitionsLength = 48;
        const commands: LObject[] = []; const events: LObject[] = []; const states: LObject[] = []; const transitions: LObject[] = [];
        for(let i = 0; i < commandsLength; i++)
            commands.push(this.createCommand(m1, command, 'C' + i));
        for(let i = 0; i < eventsLength; i++)
            events.push(this.createEvent(m1, event, 'E' + i));
        const object = m1.addObject({name: 'Events'}, undefined);
        for(let i = 0; i < statesLength; i++)
            states.push(this.createState(m1, state, 'S' + i, [commands[i]]))
        for(let i = 0; i < transitionsLength; i++)
            transitions.push(this.createTransition(m1, transition, states[i % statesLength], states[(i + 1) % statesLength], events[i]));
        return [m1];
    }

    private static create(name: string|undefined, project: LProject, m2: LModel): LModel {
        const dModel: DModel = DModel.new(name, m2.id, false, true);
        const lModel: LModel = LModel.fromD(dModel);
        SetFieldAction.new(project.id, 'models', lModel.id, '+=', true);
        SetFieldAction.new(project.id, 'graphs', lModel.node?.id, '+=', true);
        return lModel;
    }
    private static createState(m1: LModel, state: LClass, name: string, actions: LObject[]): LObject {
        // const dObject = m1.addObject({$name: name, $actions: actions.map(o => o.id)}, state.id);
        const dObject = m1.addObject({}, state.id);
        const lObject: LObject = LObject.fromD(dObject);
        lObject.features[0].value = name;
        lObject.features[1].values = actions;
        return lObject;
    }
    private static createCommand(m1: LModel, command: LClass, name: string): LObject {
        const code = U.getRandomString(2);
        // const dObject = m1.addObject({$name: name, $code: code}, command.id);
        const dObject = m1.addObject({}, command.id);
        const lObject: LObject = LObject.fromD(dObject);
        lObject.features[0].value = name;
        lObject.features[1].value = code;
        return lObject;
    }
    public static createEvent(m1: LModel, event: LClass, name: string): LObject {
        const code = U.getRandomString(2);
        // const dObject = m1.addObject({$name: name, $code: code}, event.id);
        const dObject = m1.addObject({}, event.id);
        const lObject: LObject = LObject.fromD(dObject);
        lObject.features[0].value = name;
        lObject.features[1].value = code;
        return lObject;
    }
    public static createTransition(m1: LModel, transition: LClass, source: LObject, target: LObject, event: LObject): LObject {
        // const dObject = m1.addObject({$source: source.id, $target: target.id, $trigger: event.id}, transition.id);
        const dObject = m1.addObject({}, transition.id);
        const lObject: LObject = LObject.fromD(dObject);
        lObject.features[0].values = [source];
        lObject.features[1].values = [target];
        lObject.features[2].values = [event];
        return lObject;
    }
}
