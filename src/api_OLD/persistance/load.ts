import PersistanceApi from './index';
import Fetch from '../fetch';
import {CreateElementAction, DProject, DUser} from '../../joiner';

export class Load {
    private static url = '/persistance/';

    static async project(project: DProject): Promise<void> {
        const projectUrl = this.url + `projects/${project.id}`;
        await Promise.all([
            /* COLLABORATORS */
            Load.element(`${projectUrl}/users`),
            /* DATA */
            Load.element(`${projectUrl}/metamodels`),
            Load.element(`${projectUrl}/models`),
            Load.element(`${projectUrl}/packages`),
            Load.element(`${projectUrl}/classes`),
            Load.element(`${projectUrl}/enumerators`),
            Load.element(`${projectUrl}/attributes`),
            Load.element(`${projectUrl}/references`),
            Load.element(`${projectUrl}/operations`),
            Load.element(`${projectUrl}/parameters`),
            Load.element(`${projectUrl}/literals`),
            Load.element(`${projectUrl}/objects`),
            Load.element(`${projectUrl}/values`),
            /* VIEWS */
            Load.element(`${projectUrl}/views`),
            Load.element(`${projectUrl}/viewpoints`),
            /* NODES */
            Load.element(`${projectUrl}/graphs`),
            Load.element(`${projectUrl}/graphVertexes`),
            Load.element(`${projectUrl}/voidVertexes`),
            Load.element(`${projectUrl}/vertexes`),
            Load.element(`${projectUrl}/graphElements`),
            Load.element(`${projectUrl}/edges`),
            Load.element(`${projectUrl}/edgePoints`)
        ]);
        CreateElementAction.new(project);
    }

    private static async element(url: string): Promise<void> {
        const response = await PersistanceApi.responseHandler(await Fetch.get(url));
        const elements = response.body;
        if(response.code !== 200 || !Array.isArray(elements)) return;
        for(let element of elements) {
            if(element.id === DUser.current) continue;
            console.log(`Loading From Server (${element.className})`, element);
            CreateElementAction.new(element);
        }
    }

}
