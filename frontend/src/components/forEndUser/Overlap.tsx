import React, {CSSProperties, PureComponent, ReactNode} from "react";
// import { connect } from "react-redux";
// import {DState} from "../../redux/store";
//import './overlap.scss';

// private
interface ThisState {
}

export class Overlap extends PureComponent<AllProps, ThisState>{
    static cname: string = "Overlap";

    render(): ReactNode {
        console.log('overlap childs:', this.props.children);
        if (!this.props.children || !Array.isArray(this.props.children)) return this.props.children;
        const children = this.props.children; // ? (Array.isArray(this.props.children) ? this.props.children : [this.props.children]) : [];
        return (<>
            {/*trouble on svg: G elements cannot be styled and rect cannot be nested, i cannot force a container to take size of children unless set size with plain js*/}
            <div className={"overlap-parent" + (this.props.autosizex ? " overlap-child-chooses-width" : "") + (this.props.autosizex ? " overlap-child-chooses-height" : "")} style={{...this.props.style}}>
                {React.Children.map(children, cc => {
                        return <div className={"overlap-child-wrapper" + (!this.props.autosizex ? " overlap-parent-chooses-width" : "") + (!this.props.autosizey ? " overlap-parent-chooses-height" : "")}>{cc}</div>
                    })}
            </div>
        </>); }
}

// private
interface OwnProps {
    children: ReactNode;
    // sizefollows: "parent" | "child";
    autosizex?: boolean;
    autosizey?: boolean;
    style?: CSSProperties;
    // propsRequestedFromHtmlAsAttributes: string;
}
// private
interface StateProps {
    // propsFromReduxStateOrOtherKindOfStateManagement: boolean; // flux or custom things too, unrelated to this.state of react.
}

// private
interface DispatchProps {
    // propsFromReduxActions: typeof funzioneTriggeraAzioneDaImportare;
}


// private
type AllProps = OwnProps & StateProps & DispatchProps;

////// mapper func
/*
function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    /// to fill
    return ret; }

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {} as any;
    /// to fill
    return ret; }
*/

(Overlap as any).defaultProps = {
  autosizex: true,
  autosizey: true,
  style: undefined,
  children: [],
} as OwnProps; // todo: se esporto con connect fose devo farlo al risultato della connect
export default Overlap;
/*connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(Overlap);*/
