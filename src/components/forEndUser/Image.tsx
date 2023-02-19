import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import {IStore} from "../../redux/store";


function ImageComponent(props: AllProps) {
    let link = 'https://www.svgrepo.com/show/';
    link += props.code + '/';
    link += props.name + '.svg';
    return <img className={'h-100 w-100'} src={link} />;
}
interface OwnProps { code: string; name: string; }
interface StateProps { }
interface DispatchProps { }
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const ImageConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(ImageComponent);

export const Image = (props: OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <ImageConnected {...{...props, childrens}} />;
}
export default Image;