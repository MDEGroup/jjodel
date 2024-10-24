import {Pointer, DViewElement, DViewPoint, Dictionary, U, RuntimeAccessible} from '../joiner';
@RuntimeAccessible('Defaults')
export class Defaults { /// TODO: this really needs to become dynamically generated, after view creations.
    static cname: string = 'Defaults';
    static views: Pointer<DViewElement>[] = [
        'Pointer_ViewModel',
        'Pointer_ViewPackage',
        'Pointer_ViewClass',
        'Pointer_ViewEnum',
        'Pointer_ViewAttribute',
        'Pointer_ViewReference',
        'Pointer_ViewOperation',
        'Pointer_ViewParameter',
        'Pointer_ViewLiteral',
        'Pointer_ViewObject',
        'Pointer_ViewValue',
        // 'Pointer_ViewDefaultPackage',
        'Pointer_ViewVoid',
        'Pointer_ViewEdgeAssociation',
        'Pointer_ViewEdgeDependency',
        'Pointer_ViewEdgeInheritance',
        'Pointer_ViewEdgeAggregation',
        'Pointer_ViewEdgeComposition',
        'Pointer_ViewEdgePoint',
        // 'Pointer_ViewAnchors',
    ];
    static viewpoints: Pointer<DViewPoint>[] = ['Pointer_ViewPointDefault', 'Pointer_ViewPointValidation'];

    // @ts-ignore
    static defaultViewsMap: Dictionary<Pointer, boolean> = Defaults.views.reduce((acc, val) => { acc[val] = true; return acc; }, {}); // U.objectFromArrayValues(Defaults.views);
    // @ts-ignore
    static defaultViewPointsMap: Dictionary<Pointer, boolean> = Defaults.viewpoints.reduce((acc, val) => { acc[val] = true; return acc; }, {});

    static check(id: string): boolean {
        return !!Defaults.defaultViewsMap[id] || !!Defaults.defaultViewPointsMap[id]; // id.indexOf('Pointer_View') !== -1
    }
}
