import {DGraphElement, DModelElement, DocString, DViewElement, EdgeHead, ShortAttribETypes as SAType, U} from '../joiner';
import {GObject, RuntimeAccessible} from '../joiner';
import React, {ReactElement} from "react";
// const beautify = require('js-beautify').html; // BEWARE: this adds some newline that might be breaking and introduce syntax errors in our JSX parser
const beautify = (s: string) => s;
let ShortAttribETypes: typeof SAType = (window as any).ShortAttribETypes;

@RuntimeAccessible('DV')
export class DV {
    public static modelView(): string { return beautify(DefaultView.model()); } // damiano: che fa beautify? magari potremmo settarlo in LView.set_jsx invece che solo qui, così viene formattato anche l'input utente?
    public static packageView(): string { return beautify(DefaultView.package()); }
    public static classView(): string { return beautify(DefaultView.class()); }
    public static attributeView(): string { return beautify(DefaultView.feature()); }
    public static referenceView(): string { return beautify(DefaultView.feature()); }
    public static enumeratorView(): string { return beautify(DefaultView.enum()); }
    public static literalView(): string { return beautify(DefaultView.literal()); }
    public static voidView(): string { return beautify(DefaultView.void()); }
    public static operationView(): string { return beautify(DefaultView.operation()); }

    // damiano: i want to keep it because it will be useful for a candidate next feature in m1 & layoutable elements
    // it is still work in progress.
    public static operationViewm1(): string { return beautify(DefaultView.operationm1()); }
    public static objectView(): string { return beautify(DefaultView.object()); }
    public static valueView(): string { return beautify(DefaultView.value()); }
    public static defaultPackage(): string { return beautify(DefaultView.defaultPackage()); }
    public static errorView(publicmsg: string | JSX.Element, debughiddenmsg:any, errortype: string, data?: DModelElement | undefined, node?: DGraphElement | undefined, v?: DViewElement): React.ReactNode {
        let visibleMessage = publicmsg && typeof publicmsg === "string" ? U.replaceAll(publicmsg, "Parse Error:", "").trim() : publicmsg;
        console.error("error in view:", {publicmsg, debuginfo:debughiddenmsg});
        return DefaultView.error(visibleMessage, errortype, data, node, v); }
    public static errorView_string(publicmsg: string, debughiddenmsg:any, errortype: string, data?: DModelElement | undefined, node?: DGraphElement | undefined, v?: DViewElement): React.ReactNode {
        let visibleMessage = publicmsg && typeof publicmsg === "string" ? U.replaceAll(publicmsg, "Parse Error:", "").trim() : publicmsg;
        console.error("error in view:", {publicmsg, debuginfo:debughiddenmsg});
        return DefaultView.error_string(visibleMessage, errortype, data, node, v); }

    static edgePointView(): string { return beautify((
`<div className={"edgePoint"} tabIndex="-1" hoverscale={"hardcoded in css"} style={{borderRadius:"999px", border: "2px solid black", background:"white", width:"100%", height:"100%"}}>
    {otherViews}
</div>`
))}
    static edgePointViewSVG(): string { return beautify(
        `<ellipse stroke={"black"} fill={"red"} cx={"50"} cy={"50"} rx={"20"} ry={"20"} />`
        //`<ellipse stroke={"black"} fill={"red"} cx={props.node.x} cy={props.node.y} rx={props.node.w} ry={props.node.h} />`
    )}

    static svgHeadTail(head: "Head" | "Tail", type: EdgeHead): string {
        let inner: string;
        let headstr = head==="Head" ? "segments.head" : "segments.tail";
        let styleTranslate = "{}"; // '{transform:"translate(" + ' + headstr + '.x + "px, " + ' + headstr + '.y + "px)"}';
        let styleTranslateRotate = '{transform:"translate(" + ' + headstr + '.x + "px, " + ' + headstr + '.y + "px) rotate(" + (' + headstr + '.rad) + "rad)",' +
            ' "transformOrigin":'+headstr+'.w/2+"px "+ '+headstr+'.h/2+"px"}';
        let styleRotate = 'style={{transform:"rotate(" + ' + headstr + '.rad + "rad), transformOrigin:"noooope  not center"}}'; // edgeHead EdgeReference
        let attrs = `\n\t\t\t\tstyle={`+styleTranslateRotate +`}\n\t\t\t\t stroke={strokeColor} strokeWidth={strokeWidth}
 className={"edge` + head + ` ` + type +` preview"}></path>\n`;
        let path: string;
        let hoverAttrs = `\n\t\t\t\tstyle={`+styleTranslateRotate +`}\n\t\t\t\t stroke={segments.all[0]&&(segments.all[0].length > strokeLengthLimit )&& strokeColorLong || strokeColorHover} strokeWidth={strokeWidthHover}
 className={"edge` + head + ` ` + type +` clickable content"} tabIndex="-1"></path>\n`;
        switch(type) {
            default:
                inner = "edge '" + head + "' with type: '" +type + "' not found";
                break;
            case EdgeHead.extend:
                path = `<path d={"M 0 0   L " + `+headstr+`.w + " " + `+headstr+`.h/2 + "   L 0 " + `+headstr+`.h + "Z" } fill="#fff" `;
                inner = path + attrs + "\n\t\t\t\t" + path + hoverAttrs;
                break;
            case EdgeHead.reference:
                path = `<path d={"M 0 0   L " + `+headstr+`.w + " " + `+headstr+`.h/2 + "   L 0 " + `+headstr+`.h } fill="none" `;
                inner = path + attrs + "\n\t\t\t\t" + path + hoverAttrs;
                break;
            case EdgeHead.aggregation:
                path = `<path d={"M 0 " + `+headstr+`.h/2 + " L " + `+headstr+`.w/2 + " 0 L " +
                    `+headstr+`.w + " " +`+headstr+`.h/2 + " L " + `+headstr+`.w/2 + " " + `+headstr+`.h + " Z"} fill="#fff" `;
                inner = path + attrs + "\n\t\t\t\t" + path + hoverAttrs;
                break;
            case EdgeHead.composition:
                path = `<path d={"M 0 " + `+headstr+`.h/2 + " L " + `+headstr+`.w/2 + " 0 L " +
                    `+headstr+`.w + " " + `+headstr+`.h/2 + " L " + `+headstr+`.w/2 + " " + `+headstr+`.h + " Z"} fill="#000" `;
                inner = path + attrs + "\n\t\t\t\t" + path + hoverAttrs;
                break;
                /* `<svg width="20" height="20" viewBox="0 0 20 20" style={overflow: "visible"}>
                                            <path d={"M 10 0 L 0 20 L 20 20 Z"} fill="#ffffff" stroke="#808080" strokeWidth="1"></path>
                                         </svg>`;*/
                //  style={transform: "rotate3d(xcenter, ycenter, zcenter??, 90deg)"}
        }
        //  transform={"rotate("+`+headstr+`.rad+"rad "+ segments.all[0].start.pt.toString(false, " ")}
        return inner; // no wrap because of .hoverable > .preview  on root & subelements must be consecutive
        // return `<g className="edge`+head + ` ` + type +`" style={` + styleTranslate + `}>\n`+ inner +`</g>`
    }

    // about label rotation in .edge > foreignObect > div (label)
    // first transform is h-center. second is rotate, third adds [0, 50%] of 50% vertical offset AFTER rotation to take label out of edge. fourth is to add a margin.
    static edgeView(modename: EdgeHead, head: DocString<"JSX">, tail: DocString<"JSX">, dashing: string | undefined): string { return beautify(
        `<div className={"hoverable edge hide-ep ` + modename + `"} style={{overflow: "visible", width:"100vw", height:"100vh", pointerEvents:"none"}}>
            <svg style={{width:"100vw", height:"100vh", pointerEvents:"none", overflow: "visible"}}>
                { /* edge full paths
               
                 first is preview path, normally seen
                 third (segmented) is path onHover
                 second is to enlarge the hover area of path.preview to the same as path.content, so i avoid hover loop enter-leave and graphical flashing
                
                */ }
                <path className={"preview"} strokeWidth={strokeWidth} stroke={strokeColor}
                fill={"none"} d={this.edge.d} strokeDasharray="` + dashing + `"></path>
                <path className={"preview"} strokeWidth={strokeWidthHover} stroke={"transparent"}
                fill={"none"} d={this.edge.d}></path>
                { /* edge separate segments */ }
                {segments && segments.all && segments.all.flatMap(s => [
                    <path tabIndex="-1" className={"clickable content"} style={{pointerEvents:"all"}} strokeWidth={strokeWidthHover}
                    stroke={s.length > strokeLengthLimit && strokeColorLong || strokeColorHover}
                     fill={"none"} d={s.dpart}></path>,
                    s.label && <foreignObject style={{overflow: "visible", height:"0", width:"0", whiteSpace:"pre", x:(s.start.pt.x + s.end.pt.x)/2+"px", y:(s.start.pt.y + s.end.pt.y)/2+"px"}}>
                    <div
                     style={{width: "fit-content",
                      transform: "translate(-50%, 0%) rotate("+s.radLabels+"rad) translate(0%, -"+(1-0.5*Math.abs(Math.abs(s.radLabels)%Math.PI)/(Math.PI/2))*100+"%)"+
                     " translate(0%, -5px", color: strokeColor}}>{s.label}</div>
                    </foreignObject>
                ])}
            { /* edge head */ }
            ` + head + `
            { /* edge tail */ }
            ` + tail + `
            </svg>
            { /* interactively added edgepoints */ }
            {
                edge.midPoints.map( m => <EdgePoint data={edge.father.model.id} initialSize={m} key={m.id} view={"Pointer_ViewEdgePoint"} /> )
            }
            {otherViews}
        </div>`
    )}
    /*
    {
        false && edge.end.model.attributes.map( (m, index, arr) => <EdgePoint data={m.id} initialSize={(parent) => {
            let segs = parent.segments.segments;
            let pos = segs[0].start.pt.multiply(1-(index+1)/(arr.length+1), true).add(segs[segs.length-1].end.pt.multiply((index+1)/(arr.length+1), true));
            // console.trace("initial ep", {segs, pos, ratio:(index+1)/(arr.length+1), s:segs[0].start.pt, e:segs[segs.length-1].end.pt});
            return {...pos, w:55, h:55}}} key={m.id} view={"Pointer_ViewEdgePoint"} /> )
    }{
        false && <EdgePoint key={"midnode1"} view={"Pointer_ViewEdgePoint"} />
    }{
        false && <EdgePoint key={"midnode2"} view={"Pointer_ViewEdgePoint"} />
    }{
        false && props.children && "this would cause loop no idea why, needs to be fixed to allow passing EdgeNodes here" || []
    }
    */
    static semanticErrorOverlay() { return (
`<section className="overlap">
    <div className="error-message">Lowerbound violation</div>
</section>`
)}


} // DV class end

let valuecolormap: GObject = {};
valuecolormap[ShortAttribETypes.EBoolean] = "orange";
valuecolormap[ShortAttribETypes.EByte] = "orange";
valuecolormap[ShortAttribETypes.EShort] = "orange";
valuecolormap[ShortAttribETypes.EInt] = "orange";
valuecolormap[ShortAttribETypes.ELong] = "orange";
valuecolormap[ShortAttribETypes.EFloat] = "orange";
valuecolormap[ShortAttribETypes.EDouble] = "orange";
valuecolormap[ShortAttribETypes.EDate] = "green";
valuecolormap[ShortAttribETypes.EString] = "green";
valuecolormap[ShortAttribETypes.EChar] = "green";
valuecolormap[ShortAttribETypes.EVoid] = "gray";

// &&[]bn
let valuecolormap_str = JSON.stringify(valuecolormap); // can this be declared inside view.constants ?


class DefaultView {

    public static model(): string { return (
`<div className={'root'}>
    {!data && "Model data missing."}
    <div className="edges" style={{zIndex:101, position: "absolute", height:0, width:0, overflow: "visible"}}>{[
            refEdges.map(se=> <Edge start={se.start.father.node} end={se.end.node} view={"Pointer_ViewEdge" + ( se.start.containment && "Composition" || "Association")} key={se.start.node.id+"~"+se.end.node.id}/>)
            , extendEdges.map(se=><Edge start={se.start} end={se.end} view={"Pointer_ViewEdgeInheritance"} key={"EXT_"+se.start.node.id+"~"+se.end.node.id}/>)]
        }
    </div>
    {otherPackages.filter(p => p).map(pkg => <DefaultNode key={pkg.id} data={pkg} />)}
    {firstPackage && firstPackage.children.filter(c => c).map(classifier => <DefaultNode key={classifier.id} data={classifier} />)}
    {m1Objects.filter(o => o).map(m1object => <DefaultNode key={m1object.id} data={m1object}></DefaultNode>)}
    {otherViews}
</div>`
);}

    public static void(): string { return (
`<div className={'round bg-white root void model-less p-1'}>
    <div>voidvertex element test</div>
    <div>data: {props.data ? props.data.name : "empty"}</div>
    {otherViews}
</div>`
);}

    public static package(): string { return (
`<div className={'round root bg-white package'}>
    <div className={'package-children'}>
        { data.children.map(c => <DefaultNode key={c.id} data={c} />) }
    </div>
    {otherViews}
</div>`
);}

    public static defaultPackage(): string { return (
`<div className={'root'}>
    <div className={'package-children'}>
        { data.children.map(c => <DefaultNode key={c.id} data={c} />) }
    </div>
    {otherViews}
</div>`
);}

    public static class(): string { return (
`<div className={'round root class'} style={{background: 'var(--background-1)', color:'var(--color-2)'}}>
    <Input jsxLabel={<b className={'class-name'}>EClass:</b>} data={data} field={'name'} hidden={true} autosize={true} />
    <hr/>
    <div className={'class-children'}>{ data.attributes.map(c => <DefaultNode key={c.id} data={c} />) }</div>
    <div className={'class-children'}>{ data.references.map(c => <DefaultNode key={c.id} data={c} />) }</div>
    <div className={'class-children'}>{ data.operations.map(c => <DefaultNode key={c.id} data={c} />) }</div>
    {otherViews}
</div>`
);}

    public static enum(): string { return (
`<div className={'round bg-white root enumerator'}>
    <Input jsxLabel={<b className={'my-auto enumerator-name'}>EEnum:</b>} data={data} field={'name'} hidden={true} autosize={true} />
    <hr />
    <div className={'enumerator-children'}>
        { data.children.map(c => <DefaultNode key={c.id} data={c}/>) }
    </div>
    {otherViews}
</div>`
);}

    public static feature(): string { return (
`<div className={'w-100 root feature'} style={{background: 'var(--background-2)', color:'var(--color-2)'}}>
    <Select className={'p-1 d-flex'} data={data} field={'type'} label={data.name} />
    {otherViews}
</div>`
);}

    public static literal(): string { return (
`<label className={'d-block text-center root literal'}>
    {data.name}
    {otherViews}
</label>`
);}

    public static operation(): string { return (
`<div className={'w-100'}>
    <Select className={'p-1 root operation d-flex'} data={data} field={'type'} label={data.name + ' () => '} />
    {otherViews}
</div>`
);}

    // damiano: i want to keep it because it will be useful for a candidate next feature in m1 & layoutable elements
    // it is still work in progress.
    public static operationm1(): string { return (
`<div className={'d-flex root operationm1'} style={{paddingRight: "6px"}}>
    <label className={'d-block ms-1'}>{this.props.data.instanceof.name}</label>
    <label className={'d-block ms-auto hover-root'} style={{color:` + valuecolormap_str + `[this.props.data.values.type] || "gray"}}>
        →→→
        <div className="hover-content">
            <ParameterForm operation={this.props.data.id} vertical={true} />
        </div>
    </label>
    {otherViews}
</div>`
);}

    public static objectOld(): string { return (
`<div className={'round bg-white root class'}>
    <label className={'ms-1'}>
        <Input jsxLabel={<b className={'my-auto class-name'}>{data.instanceof ? data.instanceof.name : "Object"}:</b>} 
           data={data} field={'name'} hidden={true} autosize={true}/>
    </label>
    <hr />
    <div className={'object-children'}>
        { features.map(c => <DefaultNode key={c.id} data={c} />) }
    </div>
    {otherViews}
</div>`);
}

    public static object(): string { return (
`<div className={'round bg-white root class'}>
    <label className={'ms-1'}>
        <Input jsxLabel={<b className={'my-auto class-name'}>{metaclassName}:</b>} 
           data={data} field={'name'} hidden={true} autosize={true} />
    </label>
    <hr />
    <div className={'object-children'}>
        { features.map(c => <DefaultNode key={c.id} data={c} />) }
    </div>
    {otherViews}
</div>`
);}

    public static value() { return (
`<div className={'d-flex root value'} style={{paddingRight: "6px"}}>
     {instanceofname && <label className={'d-block ms-1'}>{instanceofname}</label>}
     {!instanceofname && <Input asLabel={true} data={data} field={'name'} hidden={true} autosize={true} />}
    <label className={'d-block m-auto'} style={{color: constants[typeString] || "gray"}}>
        : {valuesString}
    </label>
    {otherViews}
</div>`
);}



    public static error(msg: undefined | string | JSX.Element, errortype: string | "SYNTAX" | "RUNTIME", data?: DModelElement | undefined, node?: DGraphElement | undefined, v?: DViewElement) {
        let dname: string | undefined = data && ((data as any).name || data.className.substring(1));
        if (dname && dname.length >= 8) dname = dname.substring(0, 7) + '…';
        let nodename: string = (node?.className || '').replace(/[^A-Z]+/g, "").substring(1);
        return <div className={'w-100 h-100 round bg-white border border-danger'} style={{minHeight:"min-content"}}>
            <div className={'text-center text-danger'} tabIndex={-1} style={{background:"#fff", overflow: 'visible', zIndex:100, minWidth:"min-content"}}>
                <b>{errortype} ERROR on ${(dname ? dname  : '') + (false ? ' / ' + nodename : '')})</b>
                <hr/>
                <label className={'text-center mx-1 d-block'}>
                    While applying view "{v?.name}"
                </label>
                {msg && <label className={'text-center mx-1 d-block'} style={{color:"black"}}>{msg}</label>}
            </div>
        </div>;
    }
    public static error_string(msg: undefined | string | JSX.Element, errortype: string | "SYNTAX" | "RUNTIME", data?: DModelElement | undefined, node?: DGraphElement | undefined, v?: DViewElement) {
        let dname: string | undefined = data && ((data as any).name || data.className.substring(1));
        if (dname && dname.length >= 8) dname = dname.substring(0, 7) + '…';
        let nodename: string = (node?.className || '').replace(/[^A-Z]+/g, "").substring(1);
        return `<div className={'w-100 h-100 round bg-white border border-danger'} style={{minHeight:"min-content"}}>
            <div className={'text-center text-danger'} tabIndex={-1} style={{background:"#fff", overflow: 'visible', zIndex:100, minWidth:"min-content"}}>
                <b>{errortype} ERROR on {${dname ? dname : ''} + (false ? ' / ' + ${nodename} : '')})</b>
                <hr/>
                <label className={'text-center mx-1 d-block'}>
                    While applying view "${v?.name}"
                </label>
                {${msg} && <label className={'text-center mx-1 d-block'} style={{color:"black"}}>${msg}</label>}
            </div>
        </div>`;
    }


}
