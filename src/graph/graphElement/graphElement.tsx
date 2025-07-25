import React, {Component, Dispatch, PureComponent, ReactElement, ReactNode,} from "react";
import {createPortal} from "react-dom";
import {connect} from "react-redux";
import './graphElement.scss';
import type {EdgeOwnProps} from "./sharedTypes/sharedTypes";
import {
    GraphSize,
    LGraph, MouseUpEvent, Point,
    Pointers,
    Selectors as Selectors_, Size, TRANSACTION, WGraph,
    GraphDragManager, GraphPoint, Selectors, DNamedElement, DVoidEdge, LEdge, LPackage, LReference, LVoidEdge, LValue
} from "../../joiner";
import {DefaultUsageDeclarations} from "./sharedTypes/sharedTypes";

import {EdgeStateProps, LGraphElement, store, VertexComponent,
    BEGIN,
    CreateElementAction, DClass, Debug,
    DEdge, DEnumerator,
    DGraph,
    DGraphElement,
    Dictionary, DModel,
    DModelElement, DObject,
    DocString, DPackage,
    DPointerTargetable,
    DState,
    DUser,
    DV,
    DViewElement,
    EMeasurableEvents, END,
    GObject,
    GraphElementDispatchProps,
    GraphElementOwnProps,
    GraphElementReduxStateProps,
    GraphElementStatee,
    InOutParam,
    JSXT, Keystrokes,
    LClass,
    LModelElement,
    Log,
    LPointerTargetable,
    LViewElement,
    MyProxyHandler,
    Overlap,
    Pointer,
    RuntimeAccessible,
    RuntimeAccessibleClass,
    SetFieldAction,
    SetRootFieldAction,
    U,
    UX,
    windoww, transientProperties
} from "../../joiner";
import {NodeTransientProperties, Pack1} from "../../joiner/classes";

// const Selectors: typeof Selectors_ = windoww.Selectors;
/*
export function makeEvalContext(view: LViewElement, state: DState, ownProps: GraphElementOwnProps, stateProps: GraphElementReduxStateProps): GObject {
    let component = GraphElementComponent.map[ownProps.nodeid as Pointer<DGraphElement>];
    let allProps = {...ownProps, ...stateProps};
    let parsedConstants = stateProps.view._parsedConstants;
    let evalContext: GObject = {
        model: stateProps.data,
        ...ownProps,
        ...stateProps,
        edge: (RuntimeAccessibleClass.extends(stateProps.node?.className, "DVoidEdge") ? stateProps.node : undefined),
        state,
        ownProps,
        stateProps,
        props: allProps,
        component,
        constants: parsedConstants,
        // getSize:vcomponent?.getSize, setSize: vcomponent?.setSize,
        ...parsedConstants,
        // ...stateProps.usageDeclarations, NOT because they are not evaluated yet. i need a basic eval context to evaluate them
    };
    evalContext.__proto__ = windoww.defaultContext;
    transientProperties.node[ownProps.nodeid as string].evalContext = evalContext;
    return evalContext;
}

function setTemplateString(stateProps: InOutParam<GraphElementReduxStateProps>, ownProps: Readonly<GraphElementOwnProps>, state: DState): void {
    //if (!jsxString) { this.setState({template: this.getDefaultTemplate()}); return; }
    // sintassi: '||' + anything + (opzionale: '|' + anything)*N_Volte + '||' + jsx oppure direttamente: jsx
    const view: LViewElement = stateProps.view; //data._transient.currentView;
    // eslint-disable-next-line no-mixed-operators
    const evalContext = makeEvalContext(view, state, ownProps, stateProps);
    // Log.exDev(!evalContext.data, "missing data", {evalContext, ownProps, stateProps});

    // const evalContextOld = U.evalInContext(this, constants);
    // this.setState({evalContext});

}*/

function computeUsageDeclarations(component: GraphElementComponent, allProps: AllPropss, state: GraphElementStatee, lview: LViewElement): GObject {
    // compute usageDeclarations
    let udret: GObject = {__notInitialized: true};
    const view: DViewElement = lview.__raw;
    const vid: Pointer<DViewElement> = view.id;
    const constants = transientProperties.view[vid].constants;
    let UDEvalContext: GObject = {...allProps, ...constants, constants, component,
        view:lview, // data and node are inherited through props, but view needs redefinition
        usageDeclarations: undefined, stateProps: allProps, props:allProps, ownProps:allProps, state}//transientProperties.node[stateProps.nodeid].evalContext;
/*
*
        "constants": true, "usageDeclarations": true,
        "component": true,
        "htmlindex": true,
        "state": true, "stateProps": true, "ownProps": true,*/
    if (!view.usageDeclarations) {
        udret = {data: allProps.data, view, node: allProps.node};
    } else try {
        transientProperties.view[vid].UDFunction.call(UDEvalContext, UDEvalContext, udret);
        // console.log("computing usage declarations: ", {f:transientProperties.view[vid].UDFunction, udret, UDEvalContext});
    } catch (e: any) {
        e.isSyntax = false;
        udret = {data: allProps.data, view, node: allProps.node, __invalidUsageDeclarations: e};// "@runtime:" +e};
        Log.ee("Invalid usage declarations", {e, str: view.usageDeclarations, view, data: allProps.data, stateProps: allProps});
    }

    transientProperties.node[allProps.nodeid].viewScores[vid].usageDeclarations = udret;
    // do not merge to create jsx final context now, because if shouldcomponentupdate fails, i want to keep the OLD context for measurable events.
    return udret;
}

let debugcount = 0;
let maxRenderCounter = Number.POSITIVE_INFINITY;
export const lightModeAllowedElements = [DModel.cname, DPackage.cname, DClass.cname, DEnumerator.cname, DObject.cname];

function getScores(ret: GraphElementReduxStateProps, ownProps: GraphElementOwnProps): NodeTransientProperties{
    return Selectors.getAppliedViewsNew({data:ret.data, node: ret.node,
        nid: ownProps.nodeid as string, pv: ownProps.parentViewId && DPointerTargetable.from(ownProps.parentViewId)});
}

const countRenders = true;
@RuntimeAccessible('GraphElementComponent')
export class GraphElementComponent<AllProps extends AllPropss = AllPropss, GraphElementState extends GraphElementStatee = GraphElementStatee>
    extends Component<AllProps, GraphElementState>{
    public static cname: string;
    static all: Dictionary<number, GraphElementComponent> = {};
    public static map: Dictionary<Pointer<DGraphElement>, GraphElementComponent> = {};
    static defaultProps: Partial<GraphElementOwnProps> = GraphElementOwnProps.new();
    static maxid: number = 0;
    id: number;

    public static defaultShouldComponentUpdate<AllProps extends GObject, State extends GObject, Context extends any>
    (instance: React.Component, nextProps: Readonly<AllProps>, nextState: Readonly<State>, nextContext: Context) {
        return (
            !U.shallowEqual(instance.props, nextProps) ||
            !U.shallowEqual(instance.state, nextState)
        );
    }

    // requires data and node wrapping first
    static mapViewStuff(state: DState, ret: GraphElementReduxStateProps, ownProps: GraphElementOwnProps) {
        // let dnode: DGraphElement | undefined = ownProps?.nodeid && DPointerTargetable.from(ownProps.nodeid, state) as any;
        // console.log("viewsss mapstate 3 " + ret.node?.className + " " + ret.data?.name, {views:ret.views, vv:ret.view, ownProps, stateProps:{...ret}, thiss:this});
        ret.parentviewid = ownProps.parentViewId;

        const explicitView: Pack1<LViewElement> | string | undefined = ret.view || ownProps.view;
        const explicitViews: (Pack1<LViewElement> | string | undefined)[] = ret.views || ownProps.views;

        let scores: NodeTransientProperties = undefined as any;
        let tn = transientProperties.node[ownProps.nodeid as string]; // tn === scores if getScore is called (getScore have a sideeffect)
        if (!tn) transientProperties.node[ownProps.nodeid as string] = tn = new NodeTransientProperties();
        if (explicitView) {
            let idorname: string = Pointers.from(explicitView) || explicitView as any as string;
            ret.view = tn.mainView = LPointerTargetable.fromD(Selectors.getViewByIDOrNameD(idorname, state) as DViewElement);

        }
        if (!ret.view) { // if view is not explicitly set or the assigned view is not found, match a new one.
            if (!scores) scores = getScores(ret, ownProps);
            ret.view = scores.mainView = LPointerTargetable.fromPointer((scores.mainView as any)?.id, state);
            Log.w(!!explicitView, "Requested main view "+ownProps.view+" not found. Another view got assigned: " + ret.view?.__raw.name, {requested: ownProps.view, props: ownProps, state: ret});
        }
        if (!tn.validMainViews?.[0] || tn.validMainViews[0].id !== tn.mainView?.id) tn.validMainViews = [tn.mainView, ...(tn.validMainViews || [])];
        // @ts-ignore
        let vname: string = !ret.view && ownProps.view ? ' Check the manual assignment of props view={"'+(ownProps.view?.name || ownProps.view) +'"}' : '';
        let pview: LViewElement|undefined = !ret.view ?  ret.node?.father?.view : undefined;
        Log.ex(!ret.view, "Could not find any view applicable to element." + vname + (pview ? ' in view "'+pview.name+'"' : ''),
            {data:ret.data, props: ownProps, state: ret, scores: (ret as any).viewScores, nid: ownProps.nodeid, tn:transientProperties.node[ownProps.nodeid as any]});

        if (explicitViews){
            // ret.views = tn.stackViews = LPointerTargetable.fromArr(explicitView);
            let views: LViewElement[] = [];
            for (let v of explicitViews) {
                let idorname: string = Pointers.from(v as DViewElement) || v as any as string;
                let view: LViewElement = LPointerTargetable.fromD(Selectors.getViewByIDOrNameD(idorname, state) as DViewElement);
                if (view) views.push(view);
                else Log.ww("Requested decorative view "+v+" not found.", {requested: v, idorname, props: ownProps, state: ret});
            }
            ret.views = tn.stackViews = views;
        }
        if (!ret.views) {
            // if views is not explicitly set. (if some are not found, they are just missing by choice, will not replace)
            if (!scores) {
                scores = getScores(ret, ownProps);
                ret.views = scores.stackViews;
            }
            else ret.views = scores.stackViews = LPointerTargetable.fromArr((scores.stackViews||[]).map((v:LViewElement)=>v?.id).filter(vid=>!!vid));
        }
        // console.log("viewsss mapstate 4 " + ret.node?.className + " " + ret.data?.name, {views:ret.views, ownProps, stateProps: {...ret}, thiss:this});


        ret.viewsid = Pointers.fromArr(ret.views) as Pointer<DViewElement>[];
        ret.viewid = ret.view.id;

        let dnode = ret.node?.__raw;
        if (dnode) dnode.view = ret.viewid;
        (ret as any).viewScores = tn; // debug only
    }

    static mapLModelStuff(state: DState, ownProps: GraphElementOwnProps, ret: GraphElementReduxStateProps): void {
        // NB: Edge constructor might have set it from props.start, so keep the check before overwriting.
        if (typeof ownProps.data === "object") { ret.dataid = (ownProps.data as any).id; }
        else ret.dataid = ownProps.data as string | undefined;
        ret.data = LPointerTargetable.wrap(ret.dataid) // forcing re-wrapping even if props was a dobject or lobject, because i want to get the latest version of it.

        /*
        const meid: string = (typeof ownProps.data === 'string' ? ownProps.data as string : (ownProps.data as any as DModelElement)?.id) as string;
        // Log.exDev(!meid, "model element id not found in GE.mapstatetoprops", {meid, ret, ownProps, state});
        ret.data = MyProxyHandler.wrap(meid, state);
        // Log.ex(!ret.data, "can't find model data:", {meid, state, ownpropsdata:ownProps.data, ownProps});
        */
    }


    static mapLGraphElementStuff(state: DState,
                                 ownProps: GraphElementOwnProps,
                                 ret: GraphElementReduxStateProps,
                                 dGraphElementDataClass: typeof DGraphElement = DGraphElement,
                                 isDGraph?: DGraph): void {
        let nodeid: string = ownProps.nodeid as string;
        let graphid: string = isDGraph ? isDGraph.id : ownProps.graphid as string;
        let parentnodeid: string = ownProps.parentnodeid as string;
        ret.nodeid = nodeid;
        let tn = transientProperties.node[nodeid];
        if (!tn) tn = transientProperties.node[nodeid] = new NodeTransientProperties();
        // let data: Pointer<DModelElement, 0, 1, LModelElement> = ownProps.data || null;
        // Log.exDev(!nodeid || !graphid, 'node id injection failed', {ownProps, data: ret.data, name:(ret.data as any)?.name || (ret.data as any)?.className}); /*
        /*if (!nodeid) {
            nodeid = 'nodeof_' + stateProps.data.id + (stateProps.view.storeSize ? '_' + stateProps.view.id : '') + '_1';
            stateProps.nodeid = U.increaseEndingNumber(nodeid, false, false, id => !DPointerTargetable.from(id, state));
            todo: quando il componente si aggiorna questo viene perso, come posso rendere permanente un settaggio di reduxstate in mapstatetoprops? o devo metterlo nello stato normale?
        }*/

        let graph: DGraph = DPointerTargetable.from(graphid, state) as DGraphElement as any; // se non c'è un grafo lo creo
        if (!graph) {
            // Log.exDev(!dataid, 'attempted to make a Graph element without model', {dataid, ownProps, ret, thiss:this});
            if (ret.data) CreateElementAction.new(DGraph.new(0, ret.data.id, parentnodeid, graphid, graphid)); }
        /*else {
            graph = MyProxyHandler.wrap(graph);
            Log.exDev(graph.__raw.className !== "DGraph", 'graph class is wrong', {graph: ret.graph, ownProps});
        }*/
        let dnode: DGraphElement = DPointerTargetable.from(nodeid, state) as DGraphElement;

        // console.log('dragx GE mapstate addGEStuff', {dGraphElementDataClass, created: new dGraphElementDataClass(false, nodeid, graphid)});
        if (!dnode && !DPointerTargetable.pendingCreation[nodeid]) {
            /*
            console.log("making node:", {dGraphElementDataClass, nodeid, parentnodeid, graphid, dataid, ownProps, ret,
                pendings: {...DPointerTargetable.pendingCreation}, pending:DPointerTargetable.pendingCreation[nodeid]});*/
            // so this is called once, but createaction is triggered twice only for edgepoints? it works if i create it through console.
            let dge;
            /*
            if (dGraphElementDataClass === DEdgePoint) { // made it same as dvertex
                let initialSize = ownProps.initialSize;
                dge = DEdgePoint.new(ownProps.htmlindex as number, dataid, parentnodeid, graphid, nodeid, initialSize);
                ret.node =  MyProxyHandler.wrap(dge);
            } else*/
            if (dGraphElementDataClass === DEdge) {
                // set start and end from ownprops;
                let edgeOwnProps: EdgeOwnProps = ownProps as EdgeOwnProps;
                let edgeStateProps: EdgeStateProps = ret as EdgeStateProps;
                let startnodeid = LGraphElement.getNodeId(edgeOwnProps.start);
                let endnodeid = LGraphElement.getNodeId(edgeOwnProps.end);
                if (!startnodeid) {
                    startnodeid = LGraphElement.getNodeId(ret.data);
                }
                edgeStateProps.start = LPointerTargetable.fromPointer(startnodeid)
                edgeStateProps.end = LPointerTargetable.fromPointer(endnodeid);
                Log.e(!startnodeid, "Cannot create an edge without start node", {startnodeid, data:ret.data, propsStart:edgeOwnProps.start});
                Log.e(!endnodeid, "Cannot create an edge without end node (yet)", {endnodeid, data:ret.data, propsEnd:edgeOwnProps.end});
                if (!startnodeid || !endnodeid) return;
                let longestLabel = edgeOwnProps.label;
                let labels = edgeOwnProps.labels;
                // dge = DEdge.new(ownProps.htmlindex as number, ret.data?.id, parentnodeid, graphid, nodeid, startnodeid, endnodeid, longestLabel, labels);
                let ddata = ret.data?.__raw;
                dge = DEdge.new2(ddata?.id, parentnodeid, graphid, nodeid, startnodeid, endnodeid, (d: DEdge)=>{
                    //d.longestLabel = longestLabel;
                    //d.labels = labels;
                    d.isReference = !!edgeOwnProps.isReference;
                    if (edgeOwnProps.isValue !== undefined) d.isValue = !!edgeOwnProps.isValue;
                    else d.isValue = !!(d.isReference && ddata && ddata.className === 'DValue');
                    if (d.isValue) d.isReference = false;
                    d.isDependency = !!edgeOwnProps.isDepencency;
                    d.isExtend = !!edgeOwnProps.isExtend;
                    let tn = (transientProperties.node[nodeid]);
                    if (!tn) transientProperties.node[nodeid] = {} as any;
                    tn.onDelete = edgeOwnProps.onDelete;
                    tn.labels = labels;
                    tn.longestLabel = longestLabel;
                    d.zIndex = edgeOwnProps.htmlindex || 1;
                    if (edgeOwnProps.anchorStart) d.anchorStart = edgeOwnProps.anchorStart;
                    if (edgeOwnProps.anchorEnd) d.anchorEnd = edgeOwnProps.anchorEnd;
                });
                edgeStateProps.node = edgeStateProps.edge = MyProxyHandler.wrap(dge);
            }
            else {
                let initialSize = ownProps.initialSize;
                dge = dGraphElementDataClass.new(ownProps.htmlindex as number, ret.data?.id, parentnodeid, graphid, nodeid, initialSize);
                if (!tn) transientProperties.node[nodeid] = {} as any;
                tn.onDelete = ownProps.onDelete;
                ret.node =  MyProxyHandler.wrap(dge);
            }
            // console.log("map ge2", {nodeid: nodeid+'', dge: {...dge}, dgeid: dge.id});
        }
        else {
            ret.node = MyProxyHandler.wrap(dnode);
            if (dGraphElementDataClass === DEdge) (ret as EdgeStateProps).edge = ret.node as any;
        }


        if (ret.dataid) {
            // set up transient model-> node map
            let ta = transientProperties.modelElement[ret.dataid];
            if (!ta) transientProperties.modelElement[ret.dataid] = {nodes: {}} as any;
            ta.nodes[ownProps.nodeid as string] = ret.node;
            ta.node = ret.node;
        }


    }

    ////// mapper func
    static mapStateToProps(state: DState, ownProps: GraphElementOwnProps, dGraphDataClass: (typeof DGraphElement | typeof DEdge) = DGraphElement, startingobj?: GObject): GraphElementReduxStateProps {
        // console.log('dragx GE mapstate', {dGraphDataClass});
        let ret: GraphElementReduxStateProps = (startingobj || GraphElementReduxStateProps.new()) as GraphElementReduxStateProps; // NB: cannot use a constructor, must be pojo
        // console.log("viewsss mapstate 0 " + ownProps.view + " " + ret.data?.name, {views:ret.views, ownProps, stateProps:{...ret}, thiss:this});

        GraphElementComponent.mapLModelStuff(state, ownProps, ret);
        if (Debug.lightMode && (!ret.data || !(lightModeAllowedElements.includes(ret.data.className)))){
            return ret;
        }
        // console.log("map ge", {ownProps, ret, state});
        GraphElementComponent.mapLGraphElementStuff(state, ownProps, ret, dGraphDataClass);
        // console.log("viewsss mapstate 2 " + ret.node?.className + " " + ret.data?.name, {views:ret.views, ownProps, stateProps:{...ret}, thiss:this});

        GraphElementComponent.mapViewStuff(state, ret, ownProps);
        // console.log("viewsss mapstate 5 " + ret.node?.className + " " + ret.data?.name, {views:ret.views, ownProps, stateProps:{...ret}, thiss:this});

        Log.exDev(!ret.view || !ret.views, 'failed to assign view:', {state, ownProps, reduxProps: ret});
        // @ts-ignore
        ret.key = ret.key || ownProps.key;
        // @ts-ignore
        ret.forceupdate = state.forceupdate;

        // Log.l((ret.data as any)?.name === "concept 1", "mapstatetoprops concept 1", {newnode: ret.node});
        U.removeEmptyObjectKeys(ret);
        return ret;
    }

    static mapDispatchToProps(dispatch: Dispatch<any>): GraphElementDispatchProps {
        const ret: GraphElementDispatchProps = {} as any;
        return ret;
    }


    countRenders: number;
    _isMounted: boolean;
    html: React.RefObject<HTMLElement | undefined>;
    lastViewChanges: {t: number, vid: Pointer<DViewElement>, v: LViewElement, key?: string}[];
    lastOnUpdateChanges: {t: number}[];
    stopUpdateEvents?: number; // undefined or view.clonedCounter;
    dataOldClonedCounter?: number; // undefined or data.clonedCounter;

    public shouldComponentUpdate(nextProps: Readonly<AllProps>, nextState: Readonly<GraphElementState>, nextContext: any, oldProps?: Readonly<AllProps>): boolean {
        if (!oldProps) oldProps = this.props;//for subviewcomponent
        if (nextProps.__skipRender) return true;
        let debug = false;
        // return GraphElementComponent.defaultShouldComponentUpdate(this, nextProps, nextState, nextContext);
        let data = nextProps.data?.__raw as DNamedElement | undefined;

        let out = {reason:undefined};
        let skipDeepKeys = {pointedBy:true, clonedCounter: true};// clonedCounter is checked manually before looping object keys
        // let skipPropKeys = {...skipDeepKeys, usageDeclarations: true, node:true, data:true, initialSize: true};
        let ret = false; // !U.isShallowEqualWithProxies(oldProps, nextProps, 0, 1, skipPropKeys, out);
        // if node and data in props must be ignored and not checked for changes. but they are checked if present in usageDeclarations
        let component = nextProps.node.component;
        const nid = nextProps.nodeid;
        // U.arrayDiff()
        for (let v of nextProps.views) {
            const vid: Pointer<DViewElement> = v.__raw.id;
            let nodeviewentry = transientProperties.node[nid].viewScores[vid];
            let old_ud = nodeviewentry.usageDeclarations;
            computeUsageDeclarations(component, nextProps, nextState, v);
            let new_ud = nodeviewentry.usageDeclarations;
            nodeviewentry.shouldUpdate = !U.isShallowEqualWithProxies(old_ud, new_ud, skipDeepKeys, out);

            nodeviewentry.shouldUpdate_reason = {...out};
            (nodeviewentry as any).shouldUpdate_reasonDebug = {old_ud, new_ud};
            Log.l(debug, "DECORATIVE_VIEW ShouldComponentUpdate " + data?.name + (nodeviewentry.shouldUpdate ? " UPDATED " : " REJECTED ")  + vid,
                {ret:nodeviewentry.shouldUpdate, reason: out.reason, old_ud, new_ud, oldProps:oldProps, nextProps, vid});

            if (!ret && nodeviewentry.shouldUpdate) ret = true;
        }

        const vid: Pointer<DViewElement> = nextProps.view.__raw.id;
        let nodeviewentry = transientProperties.node[nextProps.nodeid].viewScores[vid];
        let old_ud = nodeviewentry.usageDeclarations;
        computeUsageDeclarations(component, nextProps, nextState, nextProps.view);
        let new_ud = nodeviewentry.usageDeclarations;
        nodeviewentry.shouldUpdate = !U.isShallowEqualWithProxies(old_ud, new_ud,  skipDeepKeys, out);
        nodeviewentry.shouldUpdate_reason = {...out};
        (nodeviewentry as any).shouldUpdate_reasonDebug = {old_ud, new_ud};

        Log.l(debug, "ShouldComponentUpdate " + data?.name + (nodeviewentry.shouldUpdate ? " UPDATED " : " REJECTED ") + vid,
            {ret:nodeviewentry.shouldUpdate, reason: out.reason, old_ud, new_ud, oldProps:oldProps, nextProps});
        if (!ret && nodeviewentry.shouldUpdate) ret = true;
        return ret; // if any of main view or decorative views need updating
        // apparently node changes are not working? also check docklayout shouldupdate
    }

    protected doMeasurableEvent(type: EMeasurableEvents, vid: Pointer<DViewElement>): boolean {
        if (Debug.lightMode) return false;
        let measurableFunc: undefined | ((context:GObject)=>void) = (transientProperties.view[vid] as any)[type];
        if (!measurableFunc) return false;
        let context: GObject = this.getJSXContext(vid); // context + usagedeclarations of main view only
        try {
            measurableFunc.call(context, context);
            console.log("measurable executed", {type, measurableFunc, vid, transient:transientProperties.view[vid]});
        }
        catch (e: any) { Log.ee('Error in measurable "'+type+'" ' + e.message, {e, measurableFunc, context}); }
        // it has executed at least partially.
        // i just need to know if he had the chance to do side-effects and the answer is yes regardless of exceptions
        return true;
    }



    select(forUser?: Pointer<DUser>): void {
        // if (forUser === DUser.current && this.html.current) this.html.current.focus();
        BEGIN();
        this.props.node?.select(forUser);
        SetRootFieldAction.new('_lastSelected', {
            node: this.props.nodeid,
            view: this.props.view.id,
            modelElement: this.props.data?.id
        });/*
        // ? why this?
        const id = this.props.data?.id;
        if (id) {
            //selected[forUser] = id;
            SetRootFieldAction.new('selected', id, '', true);
        }*/

        // SetRootFieldAction.new(`selected.${DUser.current}`, nodeid, '', true);
        END();
    }

    constructor(props: AllProps, context: any) {
        super(props, context);
        this.lastViewChanges = [];
        this.lastOnUpdateChanges = []
        this.stopUpdateEvents = undefined;
        this._isMounted = false;
        this.countRenders = 0;
        this.id = GraphElementComponent.maxid++;
        GraphElementComponent.all[this.id] = this;
        GraphElementComponent.map[props.nodeid as Pointer<DGraphElement>] = this; // props might change at runtime, setting in constructor is not enough
        this.html = React.createRef();
        let functionsToBind = [this.onClick,
            this.onLeave, this.onEnter,
            this.doContextMenu, this.onContextMenu,
            this.onMouseDown, this.onMouseUp, this.onKeyDown, this.onScroll, this.onMouseMove];/*
        this.onClick = this.onClick.bind(this);
        this.onLeave = this.onLeave.bind(this);
        this.onContextMenu = this.onContextMenu.bind(this);
        this.onEnter = this.onEnter.bind(this);
        this.select = this.select.bind(this);*/
        for (let f of functionsToBind) (this as any)[f.name] = f.bind(this);
        // @ts-ignore
        this.state = {classes: [] as string[]};
        this.shouldComponentUpdate(this.props, this.state, undefined, undefined);
    }

    // constants: evalutate solo durante il primo render, può essere una funzione con effetti collaterali sul componente,
    // in tal caso la si esegue e si prende il valore di ritorno.
    // preRenderFunc: funzione evalutata ed eseguita sempre prima del render, ha senso solo per generare effetti collaterali sulle "costanti".
    // jsxString: funzione evalutata una sola volta durante il primo render ed eseguita ad ogni update dei dati.



    componentDidMount(): void {
        // after first render
        this._isMounted = true;
    }

    componentWillUnmount(): void {
        // todo: devo fare in modo che il nodo venga cancellato solo se sto modificando la vista in modo che questo vertice non esista più.
        //  e non venga cancellato se il componente viene smontato perchè ho solo cambiato vista
        //  LOW PRIORITY perchè funziona anche senza, pur sprecando memoria che potrebbe essere liberata.
        // if (view_is_still_active_but_got_modified_and_vertex_is_deleted) new DeleteElementAction(this.getId());
    }
    /*
        componentDidUpdate(oldProps: Readonly<AllProps {/*
            const newProps = this.props
            if (oldProps.view !== newProps.view) { this.setTemplateString(newProps.view); }
    }*/



    protected getJSXContext(vid: Pointer<DViewElement>): GObject{
        let context: GObject = transientProperties.node[this.props.nodeid].viewScores[vid].evalContext;
        if (context && context.component) return context;

        // else rebuild + update it
        let tnv = transientProperties.node[this.props.nodeid].viewScores[vid];
        let tv = transientProperties.view[vid];
        context = tnv.evalContext = {...this.props, ...tv.constants, ...tnv.usageDeclarations,
            // add component stuff that could not be computed in reducer
            component: this,
            otherViews: this.props.views,
            constants: tv.constants,
            usageDeclarations: tnv.usageDeclarations,
            props: this.props};
        context._context = context;
        return context;
    }

    public static displayError(e: Error, where: string, view: DViewElement, data?: DModelElement, node?: DGraphElement, asString:boolean = false, printData?: GObject): React.ReactNode {
        // const view: LViewElement = this.props.view; //data._transient.currentView;
        let errormsg = (where === "preRenderFunc" ? "Pre-Render " : "") +(e.message||"\n").split("\n")[0];
        if (e.message.indexOf("Unexpected token .") >= 0 || view.jsxString.indexOf('?.') >= 0 || view.jsxString.indexOf('??') >= 0) {
            errormsg += '\n\nReminder: nullish operators ".?" and "??" are not supported.'; }
        else if (view.jsxString.indexOf('?.') >= 0) { errormsg += '\n\nReminder: ?. operator and empty tags <></> are not supported.'; }
        else if (e.message.indexOf("Unexpected token '<'") !== -1) { errormsg += '\n\nDid you forgot to close a html </tag>?'; }
        try {
            let ee = e.stack || "";
            let stackerrorlast = ee.split("\n")[1];

            let icol = stackerrorlast.lastIndexOf(":");
            let jsxString = view.jsxString;
            // let col = stackerrorlast.substring(icol+1);
            let irow = stackerrorlast.lastIndexOf(":", icol-1);
            const offset={row:-2, col:1};
            let stackerrorlinenum: GObject = {
                row: Number.parseInt(stackerrorlast.substring(irow+1, icol)) + offset.row,
                col: Number.parseInt(stackerrorlast.substring(icol+1)) + offset.col };
            let linesPre = 1;
            let linesPost = 1;
            let jsxlines = jsxString.split("\n");
            let culpritlinesPre: string[] = jsxlines.slice(stackerrorlinenum.row-linesPre-1, stackerrorlinenum.row - 1);
            let culpritline: string = jsxlines[stackerrorlinenum.row - 1]; // stack start counting lines from 1
            let culpritlinesPost: string[] = jsxlines.slice(stackerrorlinenum.row, stackerrorlinenum.row + linesPost);
            console.error("errr", {e, node, jsxlines, culpritlinesPre, culpritline, culpritlinesPost, stackerrorlinenum, icol, irow, stackerrorlast});

            if (stackerrorlinenum.col - offset.col > culpritline?.length && stackerrorlinenum.row === 1) stackerrorlinenum.col = 0;
            let caretCursor = "▓" // ⵊ ꕯ 𝙸 Ꮖ
            if (culpritline && stackerrorlinenum.col - offset.col <= culpritline?.length && stackerrorlast.indexOf("main.chunk.js") === -1) {
                let rowPre = culpritline.substring(0, stackerrorlinenum.col);
                let rowPost = culpritline.substring(stackerrorlinenum.col);
                let jsxcode =
                    <div style={{fontFamily: "monospaced sans-serif", color:"#444"}}>
                        { culpritlinesPre.map(l => <div>{l}</div>) }
                        <div>{rowPre} <b style={{color:"red"}}> {caretCursor} </b> {rowPost}</div>
                        { culpritlinesPost.map(l => <div>{l}</div>) }
                    </div>;
                errormsg += " @ line " + stackerrorlinenum.row + ", col:" + stackerrorlinenum.col;
                if (asString) return DV.errorView_string('<div>'+errormsg+'\n'+jsxcode+'</div>', {where:"in "+where+"()", e, template:view.jsxString, view: view}, where, data, node, view);
                return DV.errorView(<div>{errormsg}{jsxcode}</div>, {where:"in "+where+"()", e, template:view.jsxString, view: view}, where, data, node, view);
            } else {
                // it means it is likely accessing a minified.js src code, sending generic error without source mapping
            }
        } catch(e2) {
            Log.eDevv("internal error in error view", {e, e2, where} );
            return null;
        }
        if (asString) return DV.errorView_string('<div>'+errormsg+'</div>', {where:"in "+where+"()", e, template: view.jsxString, view: view}, where, data, node, view);
        return DV.errorView(<div>{errormsg}</div>, {where:"in "+where+"()", e, template: view.jsxString, view: view, ...(printData || {})}, where, data, node, view);
    }
/*
    protected getTemplate(): ReactNode {
        /*if (!this.state.template) {
            this.setTemplateString('{c1: 118}', '()=>{this.setState({c1: this.state.c1+1})}',
                '<div><input value="{name}" onInput="{setName}"></input><p>c1:{this.state.c1}</p><Attribute prop1={daa} prop2={1 + 1.5} stringPropdaa=\"daa\" /><ul>{colors.map( color => <li>color: {color}</li>)}</ul></div>');
        }* /
        // console.log('getTemplate:', {props: this.props, template: this.props.template, ctx: this.props.evalContext});

        // Log.exDev(debug && maxRenderCounter-- < 0, "loop involving render");
        if (this.props.invalidUsageDeclarations) {
            return this.displayError(this.props.invalidUsageDeclarations, "Usage Declaration");
        }
        let context: GObject = this.getContext();
        // abababababab
        // todo: invece di fare un mapping ricorsivo dei figli per inserirgli delle prop, forse posso farlo passando una mia factory che wrappa React.createElement

        try {
            let preRenderFuncStr: string | undefined = this.props.view.preRenderFunc;
            if (preRenderFuncStr) {
                // eval prerender
                let obj: GObject = {};
                let tempContext: GObject = {__param: obj};
                tempContext.__proto__ = context;
                U.evalInContextAndScopeNew("("+preRenderFuncStr+")(this.__param)", tempContext, true, false);
                U.objectMergeInPlace(context, obj);
            }
        }
        catch(e: any) { return this.displayError(e, "Pre-Render");  }

        let ret;
        // eval template
        let jsxCodeString: DocString<ReactNode>;

        try { jsxCodeString = JSXT.fromString(this.props.view.jsxString, {factory: 'React.createElement'}); }
        catch (e: any) { return this.displayError(e, "JSX Syntax"); }

        try { ret = U.evalInContextAndScope<() => ReactNode>('(()=>{ return ' + jsxCodeString + '})()', context); }
        catch (e: any) { return this.displayError(e, "JSX Semantic"); }
        return ret;
    }*/
    protected getTemplate3(vid: Pointer<DViewElement>, v: LViewElement, context: GObject): ReactNode {
        let tnv = transientProperties.node[this.props.nodeid].viewScores[vid];
        let tv = transientProperties.view[vid];
        // console.log("getTemplate jsx", {vid, v, context, tnv, tv, shouldUp: tnv.shouldUpdate, jsxFunc:tv.JSXFunction});
        let ret = this.getTemplate3_(vid, v, context);
        return ret;
    }
    protected getTemplate3_(vid: Pointer<DViewElement>, v: LViewElement, context: GObject): ReactNode{
        let tnv = transientProperties.node[this.props.nodeid].viewScores[vid];
        if (!tnv.shouldUpdate && tnv.jsxOutput) return tnv.jsxOutput;
        let tv = transientProperties.view[vid];
        let ret = tnv.jsxOutput = (tv.JSXFunction ? tv.JSXFunction.call(context, context) : null);
        if (typeof ret === "object" && ret !== null && !React.isValidElement(ret)) {
            // plain objects cannot be react nodes, but react noeds are objects. so i try serializing
            // this only happens if someone puts an object in jsx
            try{
                ret = JSON.stringify(ret);
            }
            catch(e){ ret = "{__ Cyclic Object __}"; }
        }
        return ret;
    }

    protected getTemplate2(v: LViewElement, udContext: GObject): ReactNode {
        // todo: invece di fare un mapping ricorsivo dei figli per inserirgli delle prop, forse posso farlo passando una mia factory che wrappa React.createElement

        /*
        let thisContext: GObject = {};
        try {
            let preRenderFuncStr: string | undefined = v.preRenderFunc;
            if (preRenderFuncStr) {
                // eval prerender
                let tempContext: GObject = {__param: thisContext};
                this.addToContext(udContext, {__param: thisContext});
                tempContext.__proto__ = sharedContext;
                U.evalInContextAndScopeNew("("+preRenderFuncStr+")(this.__param)", tempContext, true, false);
                U.objectMergeInPlace(thisContext, udContext);
                // thisContext.__proto__ = sharedContext;
            } else thisContext = udContext;
        }
        catch(e: any) { return this.displayError(e, "Pre-Render", v);  }*/

        let ret;
        // eval template
        let jsxCodeString: DocString<ReactNode>;

        try { jsxCodeString = JSXT.fromString(v.jsxString, {factory: 'React.createElement'}); }
        catch (e: any) { return GraphElementComponent.displayError(e, "JSX Syntax", v.__raw, this.props.data?.__raw, this.props.node?.__raw); }

        // console.log('context for ' + (this.props.data?.name), {udContext});
        try {
            let parsedFunc = U.parseFunctionWithContextAndScope('()=>{ return ' + jsxCodeString + '}', udContext, udContext);
            ret = parsedFunc(udContext) as ReactNode;
            /// ret = U.evalInContextAndScope<() => ReactNode>('(()=>{ return ' + jsxCodeString + '})()', udContext);
        }
        catch (e: any) { return GraphElementComponent.displayError(e, "JSX Semantic", v.__raw, this.props.data?.__raw, this.props.node?.__raw, false, {udContext}); }
        return ret;
    }

    onContextMenu(e: React.MouseEvent<Element>) {
        e.preventDefault();
        e.stopPropagation();
        // NOT executed here, but on mousedown because of IOS compatibility
    }

    doContextMenu(e: React.MouseEvent<Element>) {
        BEGIN()
        this.props.node.select();
        if (this.html.current) this.html.current.focus();
        let state: DState = store.getState();
        if (state.contextMenu?.x !== e.clientX) {
            SetRootFieldAction.new("contextMenu", {
                display: true,
                x: e.clientX,
                y: e.clientY,
                nodeid: this.props.node?.id
            });
        }
        END();
    }

    onEnter(e: React.MouseEvent<Element>) { // instead of doing it here, might set this class on render, and trigger it visually operative with :hover selector css
        const isEdgePending = this.props.isEdgePending?.source;
        if (!isEdgePending || this.props.data?.className !== "DClass") return;
        const extendError: {reason: string, allTargetSuperClasses: LClass[]} = {reason: '', allTargetSuperClasses: []}
        const canBeExtend = isEdgePending.canExtend(this.props.data as any as LClass, extendError);

        if (canBeExtend) this.setState({classes:[...this.state.classes, "class-can-be-extended"]});
        else this.setState({classes:[...this.state.classes, "class-cannot-be-extended"]});
    }
    onLeave(e: React.MouseEvent<Element>) {
        if (this.props.data?.className !== "DClass") return;
        this.setState({classes: this.state.classes.filter((classname) => {
            return classname !== "class-can-be-extended" && classname !== "class-cannot-be-extended"
        })});
    }

    static mousedownComponent: GraphElementComponent | undefined;
    onMouseDown(e: React.MouseEvent): void {
        if (UX.isStoppedEvt(e)) return;
        e.stopPropagation();
        GraphElementComponent.mousedownComponent = this;
        TRANSACTION(()=>{
            if (e.button === Keystrokes.clickRight) { this.doContextMenu(e); }
            let p: GObject = this.props;
            console.log('try drag', {p, ig: p.isGraph, iv:p.isVertex, e});
            // if ((p.isGraph && !p.isVertex) || (p.isGraph && p.isVertex && e.ctrlKey)) GraphDragManager.startPanning(e, this.props.node as LGraph);
        })
    }



    onScroll(e: React.MouseEvent): void {
        console.log("onScroll");
        let scroll: Point = new Point(e.currentTarget.scrollLeft, e.currentTarget.scrollTop);
        let scrollOrigin: Point = new Point(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        let g: LGraph = this.props.node.graph;
        let oldZoom: GraphPoint = g.zoom;
        let newZoom: GraphPoint = new GraphPoint(oldZoom.x+0.1, oldZoom.y+0.1);
        let oldOffset: GraphPoint = g.offset;
        let gscrollOrigin: GraphPoint = oldOffset.add(scrollOrigin.multiply(oldZoom, true), true);
        let newscrollOrigin: GraphPoint = oldOffset.add(scrollOrigin.multiply(newZoom, true), true);
        let newOffset: GraphPoint = oldOffset.add( gscrollOrigin.subtract(newscrollOrigin, true), true);
        TRANSACTION(()=>{
            g.offset = newOffset;
            g.zoom = newZoom;
        })
        e.stopPropagation();
    }
    onMouseMove(e: React.MouseEvent): void {
        //this.onMouseUp(e);
    }
    onMouseUp(e: React.MouseEvent, frommousemove: boolean = false): void {
        e.stopPropagation();
        TRANSACTION(()=>{
            //GraphDragManager.stopPanning(e);
            if (GraphElementComponent.mousedownComponent !== this) { return; }
            if (!frommousemove) this.doOnClick(e);
        })
    }
    onKeyDown(e: React.KeyboardEvent){
        console.log('keydown', e.key, {e, m:this.props.data?.name});
        let target: HTMLElement = e.target as any;
        switch (target?.tagName.toLowerCase()) {
            case 'input':
            case 'textarea':
                e.stopPropagation(); return;
            default: if (target?.getAttribute('contenteditable') === 'true') { e.stopPropagation(); return; }
        }
        if (!(this.props.isGraph && !this.props.isVertex)) e.stopPropagation();
        if (e.key === Keystrokes.escape) {
            this.props.node.deselect();
            if (this.props.isEdgePending) {
                // this.stopPendingEdge(); todo
                return;
            }
        }
        let isDelete: boolean = false;
        if (e.key === Keystrokes.delete){ isDelete = true; }
        if (e.shiftKey) {
            // todo: make them a switch
            if (e.key === "D" || e.key === "d") this.props.data?.duplicate(); else
            if (e.key === "R" || e.key === "r") { isDelete = true; }
        }
        console.log('keydown isDelete', isDelete);
        if (isDelete){
            let nid = this.props.nodeid;
            let tn = transientProperties.node[nid];
            TRANSACTION(()=>{
                if (tn && tn.onDelete && tn.onDelete(this.props.node) === false) return;
                // if shapeless, erase the node directly.
                if (!this.props.data) {
                    this.props.node.delete();
                    return;
                }
                // if dictated by the model, change the model to erase indirectly the node.
                if (!this.props.isEdge) {
                    this.props.data.delete();
                    return;
                }
                // if edge
                let e = this.props.node as LVoidEdge;
                let de = e.__raw;
                if (de.isExtend) {
                    let data: LClass = this.props.data as any;
                    data.unsetExtends( e.end.model as LClass);
                    // SetFieldAction(data.id, 'extends', )
                }
                if (de.isReference){
                    if (this.props.data.className === 'DReference'){
                        let ref: LReference = this.props.data as any;
                        ref.type = ref.father.id as any;
                    } else {
                        let lval: LValue = this.props.data as any;
                        lval.remove(e.end.model);
                    }
                }
                if (de.isDependency){ // pkg dependency
                    let ref: LPackage = this.props.data as any;
                }
                else {}
            })
        }
        if (e.ctrlKey) {
            // if (e.key === Keystrokes.escape) this.props.node.toggleMinimize();
            if (e.key === "a") this.props.data?.addChild("auto"); else // add class if on package, literal if on enum...
            if (e.key === "r") this.props.data?.addChild("reference"); else
            if (e.key === "o") this.props.data?.addChild("operation") || this.props.data?.addChild("object"); else
            if (e.key === "l") this.props.data?.addChild("literal"); else
            if (e.key === "p") this.props.data?.addChild("package") || this.props.data?.addChild("parameter"); else
            if (e.key === "c") this.props.data?.addChild("class"); else
            if (e.key === "e") this.props.data?.addChild("enumerator"); else
            if (e.key === "q") this.props.data?.addChild("annotation"); else
            ;
        }
    }

    private doOnClick(e: React.MouseEvent): void {
        // (e.target as any).focus();
        e.stopPropagation();
        let state: DState = store.getState();
        if (e.button !== Keystrokes.clickRight && state.contextMenu?.display) SetRootFieldAction.new("contextMenu", {display: false, x: 0, y: 0}); // todo: need to move it on document or <App>
        const edgePendingSource = this.props.isEdgePending?.source;
        console.log('mousedown select() check PRE:', {e, name: this.props.data?.name, isSelected: this.props.node.isSelected(), 'nodeIsSelectedMapProxy': this.props.node?.isSelected, nodeIsSelectedRaw:this.props.node?.__raw.isSelected});

        if (edgePendingSource) {
            if (this.props.data?.className !== "DClass") return;
            // const user = this.props.isEdgePending.user;
            const extendError: {reason: string, allTargetSuperClasses: LClass[]} = {reason: '', allTargetSuperClasses: []}
            const canBeExtend = this.props.data && edgePendingSource.canExtend(this.props.data as any as LClass, extendError);
            if (canBeExtend && this.props.data) {
                const lClass: LClass = LPointerTargetable.from(this.props.data.id);
                // SetFieldAction.new(lClass.id, "extendedBy", source.id, "", true); // todo: this should throw a error for wrong type.
                // todo: use source.addExtends(lClass); or something (source is LClass)
                SetFieldAction.new(lClass.id, "extendedBy", edgePendingSource.id, "+=", true);
                SetFieldAction.new(edgePendingSource.id, "extends", lClass.id, "+=", true);
            }
            SetRootFieldAction.new('isEdgePending', { user: '',  source: '' });
            return;
        }
        console.log('mousedown select() check:', {e, isSelected: this.props.node.isSelected(), 'nodeIsSelectedMapProxy': this.props.node?.isSelected, nodeIsSelectedRaw:this.props.node?.__raw.isSelected});
        BEGIN();
        windoww.node = this.props.node;
        this.props.node.toggleSelected(DUser.current);
        if (state._lastSelected?.node !== this.props.nodeid) {
            SetRootFieldAction.new('_lastSelected', {
                node: this.props.nodeid,
                view: this.props.view.id,
                modelElement: this.props.data?.id
            });
        }

        if (e.shiftKey || e.ctrlKey) { }
        else {
            let allNodes: LGraphElement[] | undefined = this.props.node?.graph.allSubNodes;
            let nid = this.props.node.id;
            if (allNodes) for (let node of allNodes) if (node.id !== nid) node.deselect(DUser.current);
        }
        END();
    }

    onClick(e: React.MouseEvent): void {

    }

    onDataUpdateMeasurable(view: LViewElement, vid: Pointer<DViewElement>, index: number): void{
        if (index > 0) { this.doMeasurableEvent(EMeasurableEvents.onDataUpdate, vid); return; }
        // only on first of a sequence of onDataUpdate events for all stackviews (the mainview),
        // set time of current stack of updates, to check if they are generating a loop

        // EMeasurableEvents.onDataUpdate -> handling and checking for loops
        if (!this.stopUpdateEvents || this.stopUpdateEvents !== this.props.view.clonedCounter) {
            this.stopUpdateEvents = undefined;
            if (this.props.data && (this.dataOldClonedCounter !== this.props.data.clonedCounter) && this.doMeasurableEvent(EMeasurableEvents.onDataUpdate, vid)) {
                this.dataOldClonedCounter = this.props.data.clonedCounter;
                let thischange = {t: Date.now()};
                this.lastOnUpdateChanges.push(thischange);
                if (thischange.t - this.lastOnUpdateChanges[this.lastOnUpdateChanges.length - 10]?.t < 300) {
                    // if N updates in <= 0.2 sec
                    this.stopUpdateEvents = this.props.view.clonedCounter;
                    Log.eDevv("loop in node.render() likely due to MeasurableEvent onDataUpdate. It has been disabled until the view changes.",{
                        change_log: this.lastOnUpdateChanges,
                        component: this,
                        timediff: (thischange.t - this.lastOnUpdateChanges[this.lastOnUpdateChanges.length - 10]?.t)
                    } as any);
                }
            }
    }
    }


    // returns: true if an action is fired and component needs re-rendering
    updateNodeFromProps(props: GObject<AllProps>): boolean {
        let ret = false;
        let tn = transientProperties.node[props.nodeid];
        let ptr: Pointer<any>;
        if (!props.node) return false;
        let node = props.node;
        let dnode = node.__raw;
        let edge: LVoidEdge = props.node as any;
        let dedge: DVoidEdge = dnode as any;
        // if edge.label props is func, do not set in the dedge, just in transientproperties. totally override the "text" system.
        // it does not need collab sync:
        // because if the view is active for the other user, his synched jsx will generate the same function in transientProperties.
        // if it is inactive it does not matter, the value is not used.
        if (props.label) { tn.longestLabel = props.label; }
        if (props.onDelete) { tn.onDelete = props.onDelete; }
        if (props.longestLabel) { tn.longestLabel = props.longestLabel; }
        if (props.labels) { tn.labels = props.labels; }
        if (props.anchorStart && props.isEdge) { edge.anchorStart = props.anchorStart; }
        if (props.anchorEnd && props.isEdge) { edge.anchorEnd = props.anchorEnd; }
        if (props.start && props.isEdge) {
            ptr = Pointers.from(props.start);
            if (dedge.id !== ptr) edge.start = ptr as any;
        }
        // console.log("changing endpt", props, props.end, props.end?.model?.name);
        if (props.end && props.isEdge) {
            ptr = Pointers.from(props.end);
            if (dedge.id !== ptr) edge.end = ptr as any;
        }
        if (props.anchorEnd) { tn.labels = props.labels; }
        // if (typeof props.viewid === 'string') { let old = props.viewid; if (old !== props.node.view.id) { this.forceUpdate(); ret = true;} }
        if (typeof props.isReference) { let old = dedge.isReference; let n = !!props.isReference; if (old !== n) { edge.isReference = n; ret = true;} }
        if (typeof props.isExtend) { let old = dedge.isExtend; let n = !!props.isExtend; if (old !== n) { edge.isExtend = n; ret = true;} }
        if (typeof props.isValue) { let old = dedge.isValue; let n = !!props.isValue; if (old !== n) { edge.isValue = n; ret = true;} }
        if (typeof props.isDependency) { let old = dedge.isDependency; let n = !!props.isDependency; if (old !== n) { edge.isDependency = n; ret = true;} }
        if (typeof props.x === 'number') { let old = dnode.x; let n = +props.x; if (old !== n) { node.x = n; ret = true;} }
        if (typeof props.y === 'number') { let old = dnode.y; let n = +props.y; if (old !== n) { node.y = n; ret = true;} }
        // risk loop: todo loop detection and skip setting
        if (typeof props.w === 'number') { let old = dnode.w; let n = +props.w; if (old !== n) { node.w = n; ret = true;} }
        if (typeof props.h === 'number') { let old = dnode.h; let n = +props.h; if (old !== n) { node.h = n; ret = true;} }
        if (typeof props.width  === 'number') { let old = dnode.w; let n = +props.width;  if (old !== n) { node.w = n; ret = true;} }
        if (typeof props.height === 'number') { let old = dnode.h; let n = +props.height; if (old !== n) { node.h = n; ret = true;} }

        return ret;
    }

    public render(nodeType:string = '', styleoverride:React.CSSProperties={}, classes: string[]=[]): ReactNode {
        GraphElementComponent.map[this.props.nodeid as Pointer<DGraphElement>] = this; // props might change at runtime, setting in constructor is not enough
        if (Debug.lightMode && (!this.props.data || !(lightModeAllowedElements.includes(this.props.data.className)))){
            return this.props.data ? <div>{" " + ((this.props.data as any).name)}:{this.props.data.className}</div> : undefined;
        }
        if (!this.props.node) return "Loading...";
        /*if (this.props.node.__raw.view !== this.props.view.id) {
            this.onViewChange();
            return "Updating view...";
        }*/
        if (this.updateNodeFromProps(this.props as GObject<any>)) return 'Updating...';
        let nid = this.props.nodeid;
        let allviews = [...this.props.views, this.props.view]; // main view must be last, for renderView ordering


        for (let i = 0 ; i < allviews.length; i++){
            let v = allviews[i];
            const vid = v.id;
            let viewnodescore = transientProperties.node[nid].viewScores[v.id];
            if (!viewnodescore.shouldUpdate) continue;
            viewnodescore.evalContext = undefined as any; // force rebuild jsx context, needs to be done before renderView and measurable events
            // only if this exact view had UD changed, instead of being forced to rended by other in viewstack)
            this.onDataUpdateMeasurable(v, vid, i);
        }

        /// set classes
        if (this.props.node) {
            let isSelected: Dictionary<Pointer<DUser>, boolean> = this.props.node.__raw.isSelected;
            if(isSelected) {
                if (isSelected[DUser.current]) { // todo: better to just use css attribute selectors [data-userselecting = "userID"]
                    classes.push('selected-by-me');
                    if (Object.keys(isSelected).length > 1) classes.push('selected-by-others');
                } else if (Object.keys(isSelected).length) classes.push('selected-by-others');
            }
        }

        classes.push(this.props.data?.className || 'DVoid');
        U.arrayMergeInPlace(classes, this.state.classes);
        if (Array.isArray(this.props.className)) { U.arrayMergeInPlace(classes, this.props.className); }
        else if (this.props.className) { classes.push(this.props.className); }
        if (Array.isArray(this.props.class)) { U.arrayMergeInPlace(classes, this.props.class); }
        else if (this.props.class) { classes.push(this.props.class); }
        /// end set classes


        let mainView: LViewElement = this.props.view;
        let otherViews: LViewElement[] = this.props.views;
        let decoratorViewsOutput: (ReactNode | ReactElement)[] = [];/*
        for (let v of this.props.views) {
            if (v.isExclusiveView) {
                if (mainView) continue;
                mainView = v;
            } else otherViews.push(v);
        }*/

        let jsxOutput: ReactNode = undefined as any;
        const tn = transientProperties.node[nid]
        //console.log("render", {mainView, otherViews, scores:tn.viewScores, tnv:tn.viewScores[this.props.viewid], ud:tn.viewScores[this.props.viewid].usageDeclarations});
        for (let v of allviews) { // main view is the last
            let viewnodescore = transientProperties.node[nid].viewScores[v.id];
            jsxOutput = viewnodescore.shouldUpdate ? undefined : viewnodescore.jsxOutput;
            let isMain: true | undefined = v === mainView || undefined;
            if (!jsxOutput) viewnodescore.jsxOutput = jsxOutput =
                this.renderView(this.props, v, nodeType, classes, styleoverride,
                    isMain && decoratorViewsOutput, mainView.id, isMain && otherViews.map(v=>v.id));
            if (!isMain) decoratorViewsOutput.push(jsxOutput);
            if (viewnodescore.shouldUpdate) viewnodescore.shouldUpdate = false; // this needs to be placed post renderView call
        }

        let mainViewOutput: ReactNode = jsxOutput;
        return mainViewOutput;
        // console.log('rendering view stack', {mainView, otherViews, mainViewOutput, decoratorsJSX:decoratorViewsOutput});
        // windoww.debbugg = {mainViewOutput,otherViews, ret:<>renderrr{mainViewOutput}{otherViews}</>}
        // return this.props.data?.className === "DValue" ? <div>{mainView.jsxString}{mainViewElement}</div> : mainViewElement;
    }


    protected renderView(props: AllProps, v: LViewElement, nodeType: string, classes: string[], styleoverride: React.CSSProperties,
                         otherViews?: (ReactNode | ReactElement)[], mainviewid?: Pointer<DViewElement>, subViewsID: Pointer<DViewElement>[] = []): ReactNode | ReactElement {
        let dv = v.__raw;
        const nid = props.nodeid;
        const vid = v.id;
        const tnv = transientProperties.node[nid].viewScores[vid];
        let ud: GObject | undefined = tnv.usageDeclarations;
        /*if (false && !ud) {
            this.forceUpdate();
            return <div>Loading...</div>;
        }*/

        if (!ud) tnv.usageDeclarations = ud = computeUsageDeclarations(this, props, this.state, v);
        //console.log("renderView", {dv, tnv, ud});

        if (ud.__invalidUsageDeclarations) {
            console.error("renderView error ud:", {dv, tnv, ud});
            return GraphElementComponent.displayError(ud.__invalidUsageDeclarations, "Usage Declaration " + (ud.__invalidUsageDeclarations.isSyntax ? "Syntax" : "Semantic"), v.__raw,
                this.props.data?.__raw, this.props.node?.__raw, false, {ud});
        }
        let isMainView: boolean = !!otherViews;
        const context: GObject = this.getJSXContext(vid);

        if (isMainView) context.decorators = otherViews;
        let rnode: ReactNode;
        try { rnode = this.getTemplate3(vid, v, context); }
        catch (e: any) {
            console.error("renderView error get template:", {e, dv, tnv});
            // rnode = undefined as any;
            // todo: move in reducer parser of jsx: catch (e: any) { return GraphElementComponent.displayError(e, "JSX Syntax", v.__raw, this.props.data?.__raw, this.props.node?.__raw); }
            rnode = GraphElementComponent.displayError(e, "JSX Semantic", v.__raw, this.props.data?.__raw, this.props.node?.__raw, false, {context});
        }
        let rawRElement: ReactElement | null = UX.ReactNodeAsElement(rnode);


        // \console.log('GE render', {thiss: this, data:me, rnode, rawRElement, props:this.props, name: (me as any)?.name});

        function makeItArray(val?: any) { return val ? [] : (Array.isArray(val) ? val : [val]); }
        function getNodeText(node?: any | ReactNode): string | undefined {
            if (['string', 'number'].includes(typeof node)) return node;
            if (node instanceof Array) return node.map(getNodeText).join('');
            if (typeof node === 'object' && node) return getNodeText(node.props.children);
        }
        const addprops: boolean = true;
        let fiximport = !!this.props.node;
        //let a: false = true as any; if (a) return "Loading...";
        // if (this.props.data?.name === "Concept 1") console.log("shouldcomponentupdate rendering " + this.props.data?.name, {cc: this.props.data.clonedCounter, attrs: (this.props.data as any).attributes});
        if (addprops && rawRElement && fiximport) {
            if (windoww.debugcount && debugcount++>windoww.debugcount) throw new Error("debug triggered stop");
            let fixdoubleroot = true;
            // add view props to GraphElement children (any level down)
            const subElements: Dictionary<DocString<'nodeid'>, boolean> = {}; // this.props.getGVidMap();
            try {
                let viewStyle: GObject = {...(this.props.style || {})};
                /*
                    if (view.adaptWidth) viewStyle.width = view.adaptWidth; // '-webkit-fill-available';
                    else viewStyle.height = (rootProps.view.height) && rootProps.view.height + 'px';
                    if (view.adaptHeight) viewStyle.height = view.adaptHeight; //'fit-content'; // '-webkit-fill-available'; if needs to actually fill all it's not a vertex but a field.
                    else viewStyle.width = (rootProps.view.width) && rootProps.view.width + 'px';
                    viewStyle = {};
                */
                // viewStyle.pointerEvents = "all";
                let injectProps: GObject = {};
                if (isMainView) {
                    viewStyle.order = viewStyle.zIndex = props.node?.zIndex; // alias? this.props.node.z
                    viewStyle.display = v?.display;
                    const me: LModelElement | undefined = props.data; // this.props.model;
                    if (countRenders) {
                        classes.push(this.countRenders%2 ? "animate-on-update-even" : "animate-on-update-odd");
                    }                /// let excludeProps = ['data', 'node', 'view', 'children', ]
                    classes.push("mainView", dv.id);
                    classes.push(...subViewsID);
                    injectProps = {
                        ref: this.html,
                        // damiano: ref html viene settato correttamente a tutti tranne ad attribute, ref, operation (è perchè iniziano con <Select/> as root?)
                        id: props.nodeid,
                        "data-nodeid": props.nodeid,
                        "data-dataid": me?.id,
                        "data-viewid": dv.id,
                        "data-modelname": me?.className || "model-less",
                        "data-userselecting": JSON.stringify(props.node?.isSelected || {}),
                        "data-nodetype": nodeType,
                        // "data-order": this.props.node?.zIndex,
                        style: {...viewStyle, ...styleoverride},
                        className: classes.join(' '),
                        onClick: this.onClick,
                        onContextMenu: this.onContextMenu,
                        onMouseDown: this.onMouseDown,
                        onMouseUp: this.onMouseUp,
                        onMouseMove: this.onMouseMove,
                        onKeyDown: this.onKeyDown,
                        // onKeyUp: this.onKeyUp,
                        onwheel: this.onScroll,
                        onMouseEnter: this.onEnter,
                        onMouseLeave: this.onLeave,
                        tabIndex: (props as any).tabIndex || -1,
                        "data-countrenders": this.countRenders++,
                        "data-clonedcounter": props.node?.clonedCounter || -1,
                        // decorators: otherViews,
                    };
                    let p: GObject = this.props;
                    for (let k in p) {
                        if (typeof p[k] === 'object' || typeof p[k] === 'function') continue;
                        if (!injectProps[k]) injectProps[k] = p[k];
                    }
                }
                else injectProps = {"data-viewid": v.id, className: "decorativeView " + v.id, "data-mainview": mainviewid};


                let debug: GObject = {};
                injectProps.children = UX.recursiveMap(rawRElement/*.props.children*/,
                    (rn: ReactNode, index: number, depthIndexes: number[]) => {
                        let injectOffset: undefined | LGraph = ((this.props as any).isGraph && !depthIndexes[0] && !index) && (this.props.node as LGraph);
                        //injectOffset&&console.log("inject offset props0:", {injectOffset});
                        //console.log("inject offset props00:", {injectOffset, ig:(this.props as any).isGraph, props:this.props, depthIndexes, index});
                        return UX.injectProp(this, rn, subElements, this.props.parentnodeid as string, index, depthIndexes, injectOffset)
                    });
/*
                debug.injectPropsOriginal = injectProps.children;
                debug.recursivemap = injectProps.children;
                debug.injectChildrensAttempt = [...injectProps.children, ...makeItArray(props.children), ...(otherViews as any[])];
                debug.rawRElement = {node:rawRElement, text: getNodeText(rawRElement)};*/

                if (otherViews && false) injectProps.children = [...injectProps.children, ...makeItArray(props.children), ...(otherViews as any[])];

                // injectProps.children = [...makeItArray(rawRElement.props.children), ...makeItArray(injectProps.children)];
                let children = makeItArray(injectProps.children); // [...makeItArray(rawRElement.props.children), ...makeItArray(injectProps.children)]; rawRElement.child are already in injectprops
                // injectProps.children = [<div>{children}</div>];//[]; making any change at injectprops.children breaks it?
                rawRElement = React.cloneElement(rawRElement, injectProps);//, ...children); // adding chioldrens after injectprops seems pointless

                debug.rawRElementPostInjection = {node:rawRElement, text: getNodeText(rawRElement)};
                // rawRElement = React.cloneElement(rawRElement, {children: [...makeItArray(rawRElement.props.children), ...makeItArray(injectProps.children)]});
                // console.log('rendering view stack fixing doubles', {v0:rnode, v1:rawRElement, fixed:rawRElement.props.children})
                fixdoubleroot = false; // need to set the props to new root in that case.
                if (fixdoubleroot) rawRElement = rawRElement.props.children;
                // debug.rawRElementPostfixdoubleroot = {node:rawRElement, text: getNodeText(rawRElement)};
                // console.log("probem", {rawRElement, children:(rawRElement as any)?.children, pchildren:(rawRElement as any)?.props?.children});
            } catch (e: any) {
                console.error("renderView error inject props:", {e, dv, tnv});
                rawRElement = DV.errorView("error while injecting props to subnodes\n:" + (e.message || '').split('\n')[0],
                    {e, rawRElement, key: props.key, newid: props.nodeid},
                    'Subelement props', props.data?.__raw, props.node?.__raw, dv) as ReactElement;
                /*
                rawRElement = U.eval InContextAndScope<ReactElement>('()=>{ return ' +
                    DV.errorView("error while injecting props to subnodes",
                        {e, rawRElement, key:this.props.key, newid: this.props.nodeid}) + '}',
                    {});*/

                // rawRElement = DV.errorView("error while injecting props to subnodes", {e, rawRElement, key:this.props.key, newid: this.props.nodeid});
            }
            /*console.log('tempdebug', {deepStrictEqual, okeys:Object.keys});
            let isEqual = true;
            try {deepStrictEqual(subElements, this.props.node.subElements)} catch(e) { isEqual = false; }
            if (isEqual) {
                this.props.node.subElements = Object.keys(subElements);
            }*/
        }
        // const injectprops = {a:3, b:4} as DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
        // rnode = React.cloneElement(rnode as ReactElement, injectprops);

        // console.log("nodeee", {thiss:this, props:this.props, node: this.props.node});
        if (false && dv.isExclusiveView && (props.node?.__raw as DGraphElement).father) {
            let $containedIn = $('#' + props.node.__raw.father);
            let $containerDropArea = $containedIn.find(".VertexContainer");
            const droparea = $containerDropArea[0] || $containedIn[0];
            Log.exDev(!droparea, 'invalid vertex container target', {$containedIn, $containerDropArea});
            if (droparea) return createPortal(rawRElement || rnode, droparea);
        }/*
        if (countRenders) return <>{[
            rawRElement || rnode,
            <div className={this.countRenders%2 ? "animate-on-update-even" : "animate-on-update-odd"} data-countrenders={this.countRenders++} />
        ]}</>/*/

        //console.log("renderView return:", rawRElement || rnode);
        return rawRElement || rnode;
    }

}

// private
// type AllPropss = GraphElementOwnProps & GraphElementDispatchProps & GraphElementReduxStateProps;
type AllPropss = Overlap<Overlap<GraphElementOwnProps, GraphElementDispatchProps>, GraphElementReduxStateProps>;

const GraphElementConnected = connect<GraphElementReduxStateProps, GraphElementDispatchProps, GraphElementOwnProps, DState>(
    GraphElementComponent.mapStateToProps,
    GraphElementComponent.mapDispatchToProps
)(GraphElementComponent as any);

export const GraphElement = (props: GraphElementOwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <GraphElementConnected {...{...props, children}} />; }
// console.info('graphElement loaded');


GraphElementComponent.cname = "GraphElementComponent";
GraphElementConnected.cname = "GraphElementConnected";
GraphElement.cname = "GraphElement";
