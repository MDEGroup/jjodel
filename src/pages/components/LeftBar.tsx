import { meanBy } from 'lodash';
import { useState, MouseEventHandler } from 'react';
import { IconTheme } from 'react-hot-toast';
import {useNavigate} from 'react-router-dom';
import {DProject, DUser, L, LProject, LUser, SetRootFieldAction, U} from '../../joiner';

import { icon } from './icons/Icons';
import {DashProps} from "./Dashboard";
import Collaborative from "../../components/collaborative/Collaborative";
import {ProjectsApi} from "../../api/persistance";
import storage from "../../data/storage";

interface StateProps {
    projects: LProject[];
}


export type LeftBarProps = {
    user?: LUser;
    active: DashProps['active']; // prende il tipo dal parent-component, così si evita di aggiornare entrambi o avere tipi discordanti.
    projects?: LProject[];
    project?: LProject;

};


type ItemProps = {
    children: string;
    icon?: any;
    action?: string | MouseEventHandler;
    dot?: boolean;
    onClick?: MouseEventHandler
};

const Item = (props: ItemProps) => {
    const navigate = useNavigate();
    let action: (e:any)=>any = props.action as any;
    if (typeof action === 'string') action = (e => navigate(`/${props.action}`));
    let finalaction = (e:any) =>{ props.onClick?.(e); action(e); }

    return (<>
            <div onClick={finalaction} className={'item ' + (props.dot ? 'red-dot' : '')}>{props.icon && props.icon}&nbsp;<span>{props.children}</span></div>
    </>);
}

const Upload = () => {
    return(<></>);
    return(
        <div className={'upload'}>
            <i className="bi bi-arrow-up-circle"></i>
            <p>Drop your jjodel project archive here to import it.</p>
        </div>
    );
};

type MenuProps = {
    children: any;
    title?: string;
    mode?: "collapsable";
};

const Menu = (props: MenuProps) => {
    const [open,setOpen] = useState(true);

    return (<>
        {props.title && props.mode && open && <i className={'bi bi-chevron-down'} onClick={(e) => setOpen(!open)}></i>}
        {props.title && props.mode && !open && <i className={'bi bi-chevron-right'} onClick={(e) => setOpen(!open)}></i>}

        <div className='menu border-bottom'>
            {props.title && <h1>{props.title}</h1>}
            <div>
                {open && props.children}
            </div>
        </div>
    </>);
}

const Divisor = () => {
    return (<hr className='my-1' />);
};

Menu.Item = Item;

function LeftBar(props: LeftBarProps): JSX.Element {

    // export type LeftBarProps = {
    //     active: DashProps['active']; // prende il tipo dal parent-component, così si evita di aggiornare entrambi o avere tipi discordanti.
    //     projects: LProject[];
    //     project?: LProject;

    // };

    const {active, project} = props;
    let user: LUser = props.user || L.fromPointer(DUser.current);
    const navigate = useNavigate();

    const selectProject= (project: LProject) => {
        navigate(`/project?id=${project.id}`);
        U.resetState();
    };

    const closeProject = () => {
        navigate('/allProjects');
        Collaborative.client.off('pullAction');
        Collaborative.client.disconnect();
        SetRootFieldAction.new('collaborativeSession', false);
        U.resetState();
    }
    const toggleFavorite = async() => {
        await ProjectsApi.favorite(project?.__raw as DProject);
    };
    const exportProject = async() => {
        if(project) {
            await ProjectsApi.save(project);
            U.download(`${project?.name}.jjodel`, JSON.stringify(project?.__raw));
        }
    }

    return(<>

        {active === 'Project' ?
            <div className={'leftbar border-end border-light-subtle '}>

                <i className="bi bi-search"></i>
                <input placeholder={'Search for anything'} type={'text'} name='search-text' />
                {/* @ts-ignore */}
                <Menu title={props.project.name}>
                    {/*<Item icon={icon['edit']}>Edit </Item>*/}
                    <Item action={exportProject} icon={icon['download']}>Download</Item>
                    {/*<Item icon={icon['duplicate']}>Duplicate </Item>*/}
                    <Item action={toggleFavorite} icon={!project?.isFavorite ? icon['favorite'] : icon['favoriteFill']}>{!project?.isFavorite ? 'Add to favorites ' : 'Remove from favorites '}</Item>
                    {/*<Item icon={icon['share']}>Public link </Item>*/}
                    {/*<Item icon={icon['delete']}>Delete </Item>*/}
                    <Item action={closeProject} icon={icon['close']}>Close project </Item>
                </Menu>

                {/* {props.projects.filter(p => p.favorite).length > 0 &&
                    <Menu title={"Starred"} mode={'collapsable'}>
                        {props.projects.filter(p => p.favorite).map(p => <Item icon={icon['folder']} action={e => selectProject()}>{p.name}</Item>)}
                    </Menu>
                } *//*}

                { <Menu>
                    <Item action={'templates'} icon={icon['template2']}>Templates</Item>
                    <Item action={'notes'} icon={icon['edit']}>Notes</Item>
                </Menu>}

                <Menu title={'Support'} mode={'collapsable'}>
                    <Item icon={icon['whats-new']}>What's newwew</Item>
                    <Item icon={icon['getting-started']}>Getting started</Item>
                    <Item icon={icon['manual']}>User guide</Item>
                </Menu>*/
                }

            </div>
            :
            <div className={'leftbar border-end border-light-subtle '}>

                <i className="bi bi-search"></i>
                <input placeholder={'Search for anything'} type={'text'} name='search-text' />


                {user.email === 'admin@gmail.it' && <Menu title={'Administration'} mode={'collapsable'}>
                    <Item action={'usersInfo'} icon={icon['profile']}>Users</Item>
                    <Item action={'projectsInfo'} icon={icon['folder']}>Projects</Item>
                    <Item action={'news'} icon={icon['manual']}>News</Item>
                </Menu>}

                <Menu>
                    <Item action={'allProjects'} icon={icon['dashboard']}>All projects </Item>
                    <Item action={'recent'} icon={icon['recent']}>Recent</Item>
                </Menu>
                {props.projects && props.projects.filter(p => p.isFavorite).length > 0 &&
                    <Menu title={"Starred"} mode={'collapsable'}>
                        {props.projects.filter(p => p.isFavorite).map(p => <Item icon={icon['folder']} action={e => selectProject(p)}>{p.name}</Item>)}
                    </Menu>
                }
                {/* <Menu>
                    <Item action={'templates'} icon={icon['template2']}>Templates</Item>
                    <Item action={'notes'} icon={icon['edit']}>Notes</Item>
                </Menu>*/}
                <Menu title={'Support'} mode={'collapsable'}>
                    <Item action={'updates'} icon={icon['whats-new']}
                          dot={+(localStorage.getItem('_jj_update_seen')||0)<+(localStorage.getItem('_jj_update_date')||Number.POSITIVE_INFINITY)}
                          onClick={()=>localStorage.setItem('_jj_update_seen', ''+Date.now())}
                    >What's new</Item>
                    <Item action={'gettingstarted'} icon={icon['getting-started']}>Getting started</Item>
                    <Item action={'guide'} icon={icon['manual']}>User guide</Item>
                </Menu>

                <Upload />

            </div>
        }

    </>)
}

export {LeftBar};
