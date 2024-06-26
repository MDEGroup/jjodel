import {DModel, DProject, LPointerTargetable, LProject, LUser, Pointer, SetRootFieldAction, U} from '../../joiner';
import Storage from "../../data/storage";
import Api from "../../data/api";

class ProjectsApi {
    static async create(type: DProject['type'], name: DProject['name'], m2: Pointer<DModel>[] = [], m1: Pointer<DModel>[] = []): Promise<DProject> {
        const project = DProject.new(type, name, undefined, m2, m1);
        if(U.isOffline()) Offline.create(project);
        else await Online.create(project);
        return project;
    }
    static async getAll(): Promise<void> {
        if(U.isOffline()) Offline.getAll();
        else await Online.getAll();
    }
    static async delete(project: LProject): Promise<void> {
        if(U.isOffline()) Offline.delete(project.__raw as DProject);
        else await Online.delete(project.__raw as DProject);
        project.delete();
    }
    static async getOne(id: DProject['id']): Promise<null|DProject> {
        if(U.isOffline()) return Offline.getOne(id);
        else return await Online.getOne(id);
    }
    static async save(project: LUser['project']): Promise<void> {
        if(!project) return;
        SetRootFieldAction.new('_lastSelected', undefined);
        if(U.isOffline()) await Offline.save(project.__raw as DProject);
        else await Online.save(project.__raw as DProject);
    }
}

class Offline {
    static create (project: DProject): void {
        const projects = Storage.read<DProject[]>('projects') || [];
        projects.push(project);
        Storage.write('projects', projects);
    }
    static getAll(): void {
        const projects = Storage.read<DProject[]>('projects') || [];
        for(const project of projects)
            DProject.new(project.type, project.name, project.state, [], [], project.id);
    }
    static delete(project: DProject): void {
        const projects = Storage.read<DProject[]>('projects') || [];
        const filteredProjects = projects.filter(p => p.id !== project.id);
        Storage.write('projects', filteredProjects);
    }
    static getOne(id: string): DProject|null {
        const projects = Storage.read<DProject[]>('projects') || [];
        let filtered: DProject|DProject[] = projects.filter(p => p.id === id);
        if(filtered.length <= 0) return null;
        return filtered[0];
    }
    static async save(project: DProject): Promise<void> {
        const projects = Storage.read<DProject[]>('projects') || [];
        const filtered = projects.filter(p => p.id !== project.id);
        const state = await U.compressedState();
        Storage.write('projects', [...filtered, {...project, state}]);
        alert('Saved');
    }
}

class Online {
    static async create (project: DProject): Promise<void> {
        await Api.post(`${Api.persistance}/projects`, {
           id: project.id,
           name: project.name,
           type: project.type
        });
    }
    static async getAll(): Promise<void> {
        const response = await Api.get(`${Api.persistance}/projects`);
        if(response.code !== 200) {
            /* 401: Unauthorized -> Invalid Token (Local Storage)  */
            Storage.reset();
            U.refresh();
        }
        const data = U.wrapper<DProject[]>(response.data);
        for(const project of data)
            DProject.new(project.type, project.name, project.state, [], [], project.id);
    }
    static async delete(project: DProject): Promise<void> {
        await Api.delete(`${Api.persistance}/projects/${project.id}`);
    }
    static async getOne(id: string): Promise<DProject|null> {
        const response = await Api.get(`${Api.persistance}/projects/${id}`);
        if(response.code !== 200) return null;
        return U.wrapper<DProject>(response.data);
    }
    static async save(project: DProject): Promise<void> {
        const state = await U.compressedState();
        const response = await Api.patch(`${Api.persistance}/projects/${project.id}`, {...project, state});
        if(response.code !== 200) alert('Cannot Save');
        else alert('Saved')
    }
}

export {ProjectsApi};
