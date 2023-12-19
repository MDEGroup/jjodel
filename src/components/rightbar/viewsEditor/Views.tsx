import {Dispatch, MouseEvent, ReactElement} from 'react';
import {LProject, Dictionary, Pointer, TRANSACTION, Pointers} from '../../../joiner';
import {CreateElementAction, Defaults, DState, DUser, DViewElement, LUser, LViewElement, U} from '../../../joiner';
import {useStateIfMounted} from 'use-state-if-mounted';
import {FakeStateProps} from "../../../joiner/types";
import {connect} from "react-redux";

function ViewsDataComponent(props: AllProps) {
    const project = props.project;
    const views = project.views.filter(v => v && (!v.viewpoint || v.viewpoint.id === project.activeViewpoint.id));

    const [hoverID, setHoverID] = useStateIfMounted('');

    const add = (e: MouseEvent) => {
        const jsx =`<div className={'root bg-white'}>Hello World!</div>`;
        let name = 'view_' + 0;
        let names: string[] = project.views.map(v => v && v.name);
        name = U.increaseEndingNumber(name, false, false, newName => names.indexOf(newName) >= 0);
        DViewElement.new(name, jsx);
        // damiano: how does it ad to projecT? earleir was:  //project.views = [...project.views, dView as any];

    }

    const select = (view: LViewElement) => {
        project.pushToStackViews(view);
    }

    const clone = (e: MouseEvent, v: LViewElement) => {
        e.preventDefault(); e.stopPropagation();
        TRANSACTION(()=>{
            let clone = v.duplicate();
            let defaultViews: Dictionary<Pointer, boolean> = Defaults.defaultViewsMap;
            let oldViews: Pointer<DViewElement>[] = Pointers.from(project.views).filter( vid => !defaultViews[vid]);
            let i: number = oldViews.indexOf(v.id);
            if (i === -1) oldViews.push(clone.id);
            else oldViews.splice(i+1, 0, clone.id); // insert in-place right after the cloned view
            project.views = oldViews as any;
        })
    }

    return(<div>
        <div className={'d-flex p-2'}>
            <b className={'ms-1 my-auto'}>VIEWS</b>
            <button className={'btn btn-primary ms-auto'} onClick={add}>
                <i className={'p-1 bi bi-plus'}></i>
            </button>
        </div>
        {views.map((view, i) => {
            if(!view) return;
            return <div key={view.id} className={'d-flex p-1 mt-1 border round mx-1'} tabIndex={-1}
                        onMouseEnter={e => setHoverID(view.id)} onMouseLeave={e => setHoverID('')}
                        onClick={e => select(view)}
                        style={{cursor: 'pointer', background: hoverID === view.id ? '#E0E0E0' : 'transparent'}}>
                <label style={{cursor: 'pointer'}} className={'my-auto'}>{view.name}</label>
                <button className={'btn btn-success ms-auto'} onClick={e => clone(e, view)}>
                    <i className={'p-1 bi bi-clipboard2-fill'}></i>
                </button>
                <button className={'btn btn-danger ms-1'} disabled={Defaults.check(view.id)}
                        onClick={e => view.delete()}>
                    <i className={'p-1 bi bi-trash3-fill'}></i>
                </button>
            </div>
        })}
    </div>);
}

interface OwnProps { }
interface StateProps {
    project: LProject;
}
interface DispatchProps { }
type AllProps = OwnProps & StateProps & DispatchProps;

function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    const user = LUser.fromPointer(DUser.current);
    ret.project = user.project as LProject;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const ViewsDataConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(ViewsDataComponent);

export const ViewsData = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <ViewsDataConnected {...{...props, children}} />;
}
export default ViewsData;
