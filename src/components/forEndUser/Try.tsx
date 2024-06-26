import React, {Dispatch, ErrorInfo, KeyboardEvent, ReactElement, ReactNode} from 'react';
import {connect} from 'react-redux';
import {DState} from '../../redux/store';
import {
    Defaults,
    DPointerTargetable,
    DV,
    GObject,
    Keystrokes,
    LPointerTargetable,
    Overlap,
    Pointer,
    U
} from '../../joiner';
import {useStateIfMounted} from 'use-state-if-mounted';
import './style.scss';
/*
*   What's uncatched:
*   - reducer
*   - mapstatetoprops, if reducer doesn't do his job
*
*
*
*
*
* */
class TryComponent extends React.Component<AllProps, State> {
    static cname: string = "TryComponent";
    constructor(props: AllProps) {
        super(props);
        this.state = { error: undefined, info: undefined, stateUpdateTime: 0, canUseClipboard: true};
    }

    static getDerivedStateFromError(error: Error) {
        // Update state so the next render will show the fallback UI.
        return { error, info: undefined }; // this first set an error and stops error propagation
    }

    componentDidCatch(error: Error, info: React.ErrorInfo): void {
        console.error("uncatched error didcatch:", {info});
        // this is called after error propagation and a full render cycle is complete, i use it to trigger a rerender with more accurate infos.
        this.setState({error, info, stateUpdateTime: this.props.stateUpdateTime});
    }

    render() {
        /*
        if (this.props.stateUpdateTime !== this.state.stateUpdateTime) {
            // after a redux state update try checking if error is gone
            return this.props.children;
        }*/
        if (this.state.error) {
            // You can render any custom fallback UI
            return this.catch(this.state.error, this.state.info);
        }
        if (!React.isValidElement(this.props.children)) {
            // You can render any custom fallback UI
            console.error("Children is not a valid React Element", this.props.children, this);
            return this.catch({message: "Children is not a valid React Element"} as any, undefined);
        }
        return this.props.children;
    }

    catch(error: Error, info?: React.ErrorInfo): ReactNode{
        console.error("uncatched error:", {state:{...this.state}});
        let debug = false;
        if (debug) return<div>error</div>;
        if (this.props.catch) {
            try{
                if (typeof this.props.catch === "function") return this.props.catch(error, info);
                if (React.isValidElement(this.props.catch)) return this.props.catch;
            }
            catch (e) {
                console.error("uncatched error WITH INVALID CATCHING FUNC", {catcherFuncError:e});
            }
        }

        const msgbody_notencoded: string = "This mail is auto-generated, it might contain data of your views or model.\n" +
            "If your project have sensitive personal information please check the report below to omit them.\n\n" +
            "" + error?.message + "\n\n" +
            "_stack:\n" + U.cropStr(error.stack || '', 30) + '\n\n'+
            "_component_stack:\n" + (info ? U.cropStr(info.componentStack, 10) : '');
        const msgbody: string = encodeURIComponent(msgbody_notencoded);
        const mailtitle: string =  encodeURIComponent("Jodel assisted error report");
        const mailrecipients = ["damiano.divincenzo@student.univaq.it", "giordano.tinella@student.univaq.it"];
        // "mailto:no-one@snai1mai1.com?subject=look at this website&body=Hi,I found this website and thought you might like it http://www.geocities.com/wowhtml"
        const gitissue = "https://github.com/MDEGroup/jjodel/issues/new?title="+mailtitle+"&body="+msgbody;
        let mailto: string | undefined = "mailto:"+mailrecipients.join(';')+"?subject="+mailtitle+"&body="+msgbody;
        const mailtolimit = 2042 - 23/*for safety*/;
        if (mailto.length > mailtolimit){
            if (this.state.canUseClipboard) {
                const mailfallback = encodeURIComponent("mail body exceeded maximum mailto: link length.\n" +
                    "It has been copied to your clipboard, please past it here or use github issue report.");
                U.clipboardCopy(msgbody_notencoded, ()=>{}, ()=>{this.setState({canUseClipboard: false})});
                mailto =  "mailto:"+mailrecipients.join(';')+"?subject="+mailtitle+"&body=" + mailfallback;
            }
            else mailto = undefined;
        }
/*
mailto: limits
2042 characters on Chrome 64.0.3282.186
2046 characters on Edge 16.16299
approximately 32700 characters on Firefox 58.0

max URI lengths:
chrome: 15613 chars
firefox: 15708
*/

        let shortErrorBody = (error?.message || "\n").split("\n")[0];
        let visibleMessage: ReactNode = <div onClick={()=> this.setState({error:undefined, info: undefined})}>
            <div>{info ? "has info": "###########"}</div>
            <div>ut:{this.state.stateUpdateTime}, { shortErrorBody }</div>
            <div>What you can try:</div>
            <ul>
                <li>- Undo the last change</li>
                <li>- {mailto && [<a href={mailto}>Mail the developers</a>, " or"]} <a href={gitissue} target="_blank">open an issue</a></li>
            </ul>
        </div>
        return DV.error_raw(visibleMessage, "unhandled");
    }
}
interface State{
    error?: Error;
    info?: React.ErrorInfo;
    stateUpdateTime: number;
    canUseClipboard: boolean;
}
interface OwnProps {
    key?: React.Key | null;
    catch?: ReactNode | ((error: Error, info?: React.ErrorInfo) => ReactNode);
    children: ReactNode;
}
interface StateProps {
    stateUpdateTime: number;
}
interface DispatchProps { }
type AllProps = Overlap<OwnProps, Overlap<StateProps, DispatchProps>>;

let rendercount: number = 0;
function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    ret.stateUpdateTime = rendercount++; // new Date().getTime();
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}

const TryConnected =
    connect<StateProps, DispatchProps, OwnProps, DState>(mapStateToProps, mapDispatchToProps)(TryComponent);


export function Try(props: OwnProps): ReactElement {
    return <TryConnected {...{...props}}>{props.children}</TryConnected>;
}

TryComponent.cname = 'TryComponent';
TryConnected.cname = 'TryConnected';
Try.cname = 'Try';
