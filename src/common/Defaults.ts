import {Pointer, DViewElement, DViewPoint} from '../joiner';

export class Defaults {
    static cname: string = 'Defaults';
    static views: Pointer<DViewElement>[] = [
        'Pointer_ViewModel',
        'Pointer_ViewPackage',
        'Pointer_ViewClass',
        'Pointer_ViewEnum',
        'Pointer_ViewAttribute',
        'Pointer_ViewReference',
        'Pointer_ViewOperation',
        'Pointer_ViewLiteral',
        'Pointer_ViewObject',
        'Pointer_ViewValue',
        'Pointer_ViewDefaultPackage',
        'Pointer_ViewVoid',
        'Pointer_ViewEdgeAssociation',
        'Pointer_ViewEdgeDependency',
        'Pointer_ViewEdgeInheritance',
        'Pointer_ViewEdgeAggregation',
        'Pointer_ViewEdgeComposition',
        'Pointer_ViewEdgePoint'
    ];
    static viewpoints: Pointer<DViewPoint>[] = ['Pointer_ViewPointDefault'];

    static check(id: string): boolean {
        return id.indexOf('Pointer_View') !== -1
    }
}