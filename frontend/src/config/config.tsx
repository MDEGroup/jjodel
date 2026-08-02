import {
    DState,
    Overlap,
    RuntimeAccessible
} from "../joiner";
import {connect} from "react-redux";
import React, {Component, ReactElement, ReactNode} from "react";

class RawConfig{

}
@RuntimeAccessible('ConfigComponent')
export class Config extends Component<AllPropss, ConfigState>{
    private static singleton: Config;
    constructor(props: AllPropss){
        super(props);
        Config.singleton = this;
    }
    static set<T extends keyof Config>(key: T, val: Config[T]) {

    }

    static get<T extends keyof Config>(key: T): Config[T] {

    }

}


class ConfigState {// react component state

}
class ConfigOwnProps{

}
class ConfigDispatchProps {}
class ConfigReduxStateProps {}
type AllPropss = Overlap<Overlap<ConfigOwnProps, ConfigDispatchProps>, ConfigReduxStateProps>;

const ConfigConnected = connect<ConfigReduxStateProps, ConfigDispatchProps, ConfigOwnProps, DState>(
    ConfigComponent.mapStateToProps,
    ConfigComponent.mapDispatchToProps
)(ConfigComponent as any);

export const Configg = (props: ConfigOwnProps, children: ReactNode = []): ReactElement => {
    let props2 = {...props, children: children||props.children};
    // @ts-ignore
    delete props2.key;
    return <ConfigConnected {...props2} />; }
// console.info('Config loaded');


ConfigComponent.cname = "ConfigComponent";
ConfigConnected.cname = "ConfigConnected";
Configg.cname = "Config";
