import React, {Dispatch, ReactElement} from 'react';
import {SaveManager} from "../../topbar/SaveManager";
import {DModel, LModel, LPackage} from "../../../model/logicWrapper";
import TabDataMaker from "../../abstract/tabs/TabDataMaker";
import {DState, DUser, LGraph, LProject, LUser, Selectors, U} from "../../../joiner";
import DockManager from "../../abstract/DockManager";
import {connect} from "react-redux";
import {FakeStateProps} from "../../../joiner/types";
import Examples from './Examples';

function FileComponent(props: AllProps) {
    const user = props.user;
    const project: LProject = user.project as unknown as LProject;
    const metamodels = project.metamodels;
    const models = project.models;
    const elements = [...metamodels, ...models];

    const createM2 = async() => {
        let name = 'metamodel_' + 0;
        let names: string[] = Selectors.getAllMetamodels().map(m => m.name);
        name = U.increaseEndingNumber(name, false, false, newName => names.indexOf(newName) >= 0)
        const dModel = DModel.new(name, undefined, true);
        const lModel: LModel = LModel.fromD(dModel);
        project.metamodels = [...project.metamodels, lModel];
        project.graphs = [...project.graphs, lModel.node as LGraph];
        const dPackage = lModel.addChild('package');
        const lPackage: LPackage = LPackage.fromD(dPackage);
        lPackage.name = 'default';
        const tab = TabDataMaker.metamodel(dModel);
        await DockManager.open('models', tab);
    }

    const createM1 = async(metamodel: LModel) => {
        let name = 'model_' + 0;
        let modelNames: (string)[] = metamodel.models.map(m => m.name);
        name = U.increaseEndingNumber(name, false, false, newName => modelNames.indexOf(newName) >= 0);
        const dModel: DModel = DModel.new(name, metamodel.id, false, true);
        const lModel: LModel = LModel.fromD(dModel);
        project.models = [...project.models, lModel];
        project.graphs = [...project.graphs, lModel.node as LGraph];
        const tab = TabDataMaker.model(dModel);
        await DockManager.open('models', tab);
    }

    const open = async(me: LModel) => {
        const tab = (me.isMetamodel) ? TabDataMaker.metamodel(me) : TabDataMaker.model(me);
        await DockManager.open('models', tab);
    }

    const save = () => {SaveManager.save()}
    const load = () => {SaveManager.load()}

    const exportJson = () => {SaveManager.exportEcore_click(false, true)}
    const importJson = () => {SaveManager.importEcore_click(false, true)}

    const exportXml = () => {SaveManager.exportEcore_click(true, true)}
    const importXml = () => {SaveManager.importEcore_click(true, true)}

    const exportLayout = () => {SaveManager.exportLayout_click(false)}
    const importLayout = () => {SaveManager.importLayout_click(false)}

    return(<li className={'dropdown-item'}>File
        <i className={'ms-auto bi bi-caret-right-fill'} />
        <ul className={'submenu dropdown-menu'}>
            <li tabIndex={-1} className={'dropdown-item'}>New
                <i className={'ms-auto bi bi-caret-right-fill'} />
                <ul className={'submenu dropdown-menu'}>
                    <li tabIndex={-1} onClick={createM2} className={'dropdown-item'}>Metamodel</li>
                    {metamodels.length > 0 && <li tabIndex={-1} className={'dropdown-item'}>Model
                        <i className={'ms-auto bi bi-caret-right-fill'} />
                        <ul className={'submenu dropdown-menu'}>
                            {metamodels.map((metamodel, index) => {
                                return(<li key={index} tabIndex={-1} onClick={e => createM1(metamodel)} className={'dropdown-item'}>
                                    {metamodel.name}
                                </li>)
                            })}
                        </ul>
                    </li>}
                </ul>
            </li>
            {elements.length > 0 && <li tabIndex={-1} className={'dropdown-item'}>Open
                <i className={'ms-auto bi bi-caret-right-fill'} />
                <ul className={'submenu dropdown-menu'}>
                    {elements.map((m, index) => {
                        return(<li key={index} tabIndex={-1} onClick={e => open(m)} className={'dropdown-item'}>
                            {m.name}
                        </li>)
                    })}
                </ul>
            </li>}
            <li tabIndex={-1} onClick={save} className={'dropdown-item'}>Save</li>
            <li tabIndex={-1} onClick={load} className={'dropdown-item'}>Load</li>
            <Examples />
            <li tabIndex={-1} className={'dropdown-item'}>Export
                <i className={'ms-auto bi bi-caret-right-fill'} />
                <ul className={'submenu dropdown-menu'}>
                    <li tabIndex={-1} onClick={exportJson} className={'dropdown-item'}>JSON</li>
                    <li tabIndex={-1} onClick={exportXml} className={'dropdown-item'}>XML</li>
                    <li tabIndex={-1} onClick={exportLayout} className={'dropdown-item'}>Layout</li>
                </ul>
            </li>
            <li tabIndex={-1} className={'dropdown-item'}>Import
                <i className={'ms-auto bi bi-caret-right-fill'} />
                <ul className={'submenu dropdown-menu'}>
                    <li tabIndex={-1} onClick={importJson} className={'dropdown-item'}>JSON</li>
                    <li tabIndex={-1} onClick={importXml} className={'dropdown-item'}>XML</li>
                    <li tabIndex={-1} onClick={importLayout} className={'dropdown-item'}>Layout</li>
                </ul>
            </li>
        </ul>
    </li>);
}

interface OwnProps {}
interface StateProps {
    user: LUser;
}
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


export const FileConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(FileComponent);

const File = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <FileConnected {...{...props, children}} />;
}
export default File;


