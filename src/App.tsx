import React, {Dispatch} from 'react';
import './App.scss';
import './styles/view.scss';
import './styles/style.scss';
import {DState, DUser, LUser, SetRootFieldAction, statehistory, stateInitializer, Try, U} from "./joiner";
import {connect} from "react-redux";
import Loader from "./components/loader/Loader";
import {FakeStateProps} from "./joiner/types";
import {useEffectOnce} from "usehooks-ts";
import {HashRouter, Route, Routes} from 'react-router-dom';
import PathChecker from "./components/pathChecker/PathChecker";
import {AuthApi} from "./api/persistance";

import {
    AccountPage,
    AllProjectsPage,
    ArchivePage,
    AuthPage,
    CommunityPage,
    NotesPage,
    ProfilePage,
    ProjectPage,
    RecentPage,
    SettingsPage,
    TemplatePage,
    UpdatesPage
} from "./pages";

import {ExternalLibraries} from "./components/forEndUser/ExternalLibraries";
import {TooltipVisualizer} from "./components/forEndUser/Tooltip";
import {MessageVisualizer} from "./components/forEndUser/SplashMessage";
import {JQDock, MyDock} from "./components/dock/MyDock";
import {BottomBar} from "./pages/components";
import AlertVisualizer from "./components/alert/Alert";

let userHasInteracted = false;
function endPendingActions() {
    if (!userHasInteracted) firstInteraction();
}
function firstInteraction(){
    statehistory.globalcanundostate = true;
}

function App(props: AllProps): JSX.Element {
    const debug = props.debug;
    const isLoading = props.isLoading;
    const tooltip = props.tooltip;
    let user: LUser = props.user;

    useEffectOnce(() => {
        SetRootFieldAction.new('isLoading', true);
        stateInitializer().then(() => {
            SetRootFieldAction.new('isLoading', false);
        });
    });

    return(<>
        <div className={"router-wrapper"}>
            {isLoading && <Loader />}
            <ExternalLibraries />
            <Try><TooltipVisualizer /></Try>
            {/*<MessageVisualizer />*/}
            <Try><AlertVisualizer /></Try>
            <HashRouter>
                <Try><PathChecker /></Try>
                <Try><Routes>
                    {DUser.current ? <>
                        <Route path={'allProjects'} element={<AllProjectsPage />} />
                        {/*<Route path={'dock'} element={<MyDock />} />*/}
                        <Route path={'account'} element={<AccountPage />} />
                        <Route path={'settings'} element={<SettingsPage />} />
                        <Route path={'updates'} element={<UpdatesPage />} />
                        <Route path={'community'} element={<CommunityPage />} />
                        <Route path={'templates'} element={<TemplatePage />} />
                        <Route path={'notes'} element={<NotesPage />} />
                        <Route path={'archive'} element={<ArchivePage />} />
                        <Route path={'project'} element={<ProjectPage />} />
                        <Route path={'recent'} element={<RecentPage />} />
                        <Route path={'profile'} element={<ProfilePage />} />
                        <Route path={'*'} element={<AllProjectsPage />} />
                    </> : <Route path={'*'} element={<AuthPage />} />}
                </Routes></Try>
            </HashRouter>
            {DUser.current && <Try><BottomBar /></Try>}
        </div>
    </>);

    /*
    if (user) {
        return(<div className={'d-flex flex-column h-100 p-1 REACT-ROOT' + (props.debug ? ' debug' : '')}
                    onClick={e => statehistory.globalcanundostate = true}>
            {isLoading && <Loader />}
            {tooltip && <ToolTip />}
            <Navbar />
            <Helper />
            {(project) ? (project.type === 'collaborative' && !DUser.offlineMode) ? <CollaborativeAttacher project={project} /> : <Editor /> : <Dashboard />}
        </div>);
    } else {
        return(<>
            {isLoading && <Loader />}
            <Auth />
        </>);
    }
    */
}

interface OwnProps {room?: string}
interface StateProps {
    offlineMode: boolean,
    debug: boolean,
    isLoading: boolean
    tooltip: string,
    user: LUser
}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    ret.debug = state.debug;
    ret.isLoading = state.isLoading;
    ret.user = LUser.fromPointer(DUser.current);
    // needed here as props, because apparently functional components are memoized by default.
    ret.offlineMode = DUser.offlineMode;
    ret.tooltip = state.tooltip;
    // console.log("app re mapstate", {u:DUser.current, o:DUser.offlineMode});
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}

export const AppConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(App);

export default AppConnected;


/* SPLASH SCREEN
return(<div className={'w-100 h-100 text-center bg-smoke'}>
    <img style={{height: '60%', width: '80%'}} className={'mt-3 rounded shadow'} src={SplashImage}></img>
    <Oval height={80} width={80} wrapperStyle={{justifyContent: 'center'}} wrapperClass={'mt-3'}
          color={'#475e6c'} secondaryColor={'#ff8811'} />
</div>);
*/
