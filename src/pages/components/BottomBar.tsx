import './style.scss';
import {DState, DUser, LGraphElement, LModelElement, LUser, U} from "../../joiner";
import {FakeStateProps} from "../../joiner/types";
import React, {Dispatch, ReactElement, useState} from "react";
import {connect} from "react-redux";

import swen from '../../static/img/swen-splash.png';
import { Tooltip } from '../../components/forEndUser/Tooltip';

enum notificationType {
    Clients = 0,
    Terminal = 1,
    Messages = 2
  }

enum alertType {
    Normal = 0,
    Success = 1,
    RequireAttention = 2,
    Alert = 3,
    Error = 4
}

type Props = {
    type: notificationType;
    alert: alertType;
    message: string;

};




const Notify = (props: Props) => {

    const [isOpen, setIsOpen] = useState<number|null>(null);

    const typeInfo = [
        {name: 'clients', icon: 'bi bi-diagram-3', defaultMessage: 'There are currently no clients connected.'},
        {name: 'terminal', icon: 'bi bi-terminal-fill', defaultMessage: ''},
        {name: 'messages', icon: 'bi bi-bell-fill', defaultMessage: 'There are no messages.'}
    ];

    const openNotify = () => {
            setIsOpen(props.type);
    };

    const closeNotify = () => {
        setIsOpen(null);
    }

    return (
        <React.Fragment>
            <div onClick={openNotify} className={'widget'}><i className={`bi ${typeInfo[props.type].icon} ${isOpen != null && 'active'}` }></i><label>{typeInfo[props.type].name}</label></div>

            {isOpen != null &&
                <div className={'notify show'}>
                    <div  className={'message'}>
                        {props.message ? props.message : typeInfo[props.type].defaultMessage}
                    </div>
                    <div className={'button'}>
                        <i className={ `bi ${typeInfo[props.type].icon}` }></i>
                        <i onClick={closeNotify} className="bi bi-chevron-down"></i>
                    </div>
                </div>
            }


        </React.Fragment>

    );
  };




function openControl(){

}

const JjodelName = () => {
const [animal, setAnimal] = useState(false);


    return (<>
        {false && 
            <>
            <div className='swen-container'></div>
            
                <div className='swen animal'>
                    <h1>Manatees</h1>
                    <p>
                    Manatees (/ˈmænətiːz/, family Trichechidae, genus Trichechus) are large, fully aquatic, mostly herbivorous marine mammals sometimes known as sea cows. There are three accepted living species of Trichechidae, representing three of the four living species in the order Sirenia: the Amazonian manatee (Trichechus inunguis), the West Indian manatee (Trichechus manatus), and the West African manatee (Trichechus senegalensis). They measure up to 4.0 metres (13 ft 1 in) long, weigh as much as 590 kilograms (1,300 lb),[2] and have paddle-like tails.
                    </p>
                </div>

            </>
        } 
        <div className={'jjodel'} onClick={(e) => setAnimal(!animal)}>
            <span>jjodel v1.1</span> <i className="bi bi-globe-americas"></i> manatee
        </div>
        </>);
}

function BottomBarComponent(props: AllProps): JSX.Element {
    const [swenOpen, setSwen] = useState(false);
    const {node,data} = props;
    let nodepos: string | undefined;
    if (node) {
        let size = {...node.size};
        if (size && typeof size === 'object'){
            let ret = [
                '', U.cropNum(+(+size.x||0).toFixed(2)),
                ', ', U.cropNum(+(+size.y||0).toFixed(2)),
                ', ', U.cropNum(+(+node.zIndex||0).toFixed(2)),
                ' w:', U.cropNum(+(+size.w||0).toFixed(2)),
                ' h:', U.cropNum(+(+size.h||0).toFixed(2)),
            ]
            nodepos = ret.join('');
        }
    }

    return(<footer className={'footer'}>
        <label className={'me-3'}>
            Made with <i className="bi bi-heart-fill" onClick={() => setSwen(true)}/> in the swen group
        </label>
        <div style={{width: '100px'}}></div>
        <div className={'coordinates'} hidden={!node}>
            {data?.name}&nbsp;
            {nodepos}
        </div>
        {swenOpen && 
                <>
                <div className='swen-container'></div>
                {/* <Tooltip tooltip={'More informations on https://www.disim.univaq.it/swen'}> */}
                    <div className='swen'>
                        <img src={swen} onClick={(e) => setSwen(false)} />
                    </div>
                {/* </Tooltip> */}
                </>
        }
        {/* <div className={'widgetbar float-end'}>
            <Notify  type={notificationType.Clients} alert={alertType.Normal} message={''} />
            <Notify  type={notificationType.Terminal} alert={alertType.Normal} message={''} />
            <Notify  type={notificationType.Messages} alert={alertType.Normal} message={''} />
        </div> */}
        <JjodelName />

    </footer>)
}
interface OwnProps {}
interface StateProps {
    node?: LGraphElement;
    data?: LModelElement
}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    const selected = state._lastSelected;
    if(selected?.node) ret.node = LGraphElement.fromPointer(selected.node);
    if(selected?.modelElement) ret.data = LModelElement.fromPointer(selected.modelElement);

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
