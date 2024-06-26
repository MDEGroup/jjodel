import Logo from '../../static/img/logo.png';
import {ProjectsApi} from '../../api/persistance';
import {useNavigate} from 'react-router-dom';
import {SetRootFieldAction} from '../../redux/action/action';
import type {DState} from '../../joiner';
import {U} from '../../joiner';

type Props = {
    version: DState["version"];
};
function Navbar(props: Props): JSX.Element {
    const navigate = useNavigate();

    const createProject = async() => {
        navigate('/allProjects');
        SetRootFieldAction.new('isLoading', true);
        await U.sleep(1);
        await ProjectsApi.create('public', 'Unnamed Project');
        SetRootFieldAction.new('isLoading', false);
    }

    return(<div className={'d-flex bg-white border border-start-0 border-end-0 border-light-subtle hoverable'}>
        <div className={"hoverable"}>
            <img style={{height: '5em'}} alt={'JJodel Logo'} src={Logo} />
            <b style={{marginTop:"auto", marginBottom:"12px"}}>V{props.version.n}</b>
            <i className={"content inline ms-1"} style={{marginTop:"auto", marginBottom:"12px"}}> {props.version.date}</i>
        </div>
        <button className={'ms-auto btn btn-light'}>
            <i className={'bi bi-person-fill'} />
            <label className={'ms-1'}>1</label>
        </button>
        <button className={'mx-2 btn btn-light'}>
            <label>Invite Member</label>
        </button>
        <button className={'me-1 btn btn-primary'} onClick={e => createProject()}>
            <label>New Project</label>
        </button>
    </div>)
}

export {Navbar};
