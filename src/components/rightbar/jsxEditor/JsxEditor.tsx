import React, {Dispatch, ReactElement, ReactNode, useEffect} from "react";
import {connect} from "react-redux";
import {useStateIfMounted} from "use-state-if-mounted";
import type {FakeStateProps} from "../../../joiner/types";
import {DState, DViewElement, LViewElement, Pointer, Defaults} from "../../../joiner";
import Editor, { useMonaco } from "@monaco-editor/react";

// import monacoTypes2 from '!raw-loader!../../../static/monacotypes';
import monacoTypes from '../../../static/monacotypes';

function JsxEditorComponent(props: AllProps) {
    const monaco = useMonaco();
    const view = props.view;
    const dview = view.__raw;
    const readOnly = props.readonly !== undefined ? props.readonly : !props.debugmode && Defaults.check(dview.id);
    const [jsx, setJsx] = useStateIfMounted(dview.jsxString || '');
    const [show, setShow] = useStateIfMounted(true);


    const change = (value: string|undefined) => { // save in local state for frequent changes.
        if (value !== undefined) setJsx(value);
    }


    const blur = (evt: React.FocusEvent) => { // confirm in redux state for final state
        view.jsxString = jsx;
    }

    useEffect(() => {
        if (!monaco) return;
        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.Latest,
            allowNonTsExtensions: true,
            moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
            module: monaco.languages.typescript.ModuleKind.CommonJS,
            noEmit: true,
            esModuleInterop: true,
            jsx: monaco.languages.typescript.JsxEmit.React,
            reactNamespace: "React",
            allowJs: true,
            typeRoots: ["node_modules/@types"]//, 'src/static/'], // doubt those can be accesed at runtime but trying
        });

        monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({ noSemanticValidation: false, noSyntaxValidation: false });
        monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);

        monaco.languages.typescript.typescriptDefaults.addExtraLib("declare var data: 'datatype';");
        /*
        // doubt those files can be accesed at runtime but trying
        monaco.languages.typescript.javascriptDefaults.addExtraLib('declare var data: LModelElement; declare var node: LGraphElement;', 'src/static/monacotypes.d.ts');

        monaco.languages.typescript.typescriptDefaults.addExtraLib(
            '<<react-definition-file>>',
            `file:///node_modules/@react/types/index.d.ts`
        );*/



    }, [monaco]);


    return(<>
        <div className={'d-flex'}>
            <span className={'cursor-pointer my-auto'} tabIndex={-1} onClick={e => setShow(!show)}>
                {show ? <i className={'bi bi-eye-fill'} /> : <i className={'bi bi-eye-slash-fill'} /> }
            </span>
            <label className={'ms-2 mb-1 my-auto'}>
                JSX Editor
            </label>
        </div>
        {show && <div className={'mt-1'}>
            {jsx.match(/{\s*\(.+\?.+\:.+\)\s*}/gm) && <label>
                <b className={'text-warning'}>Warning:</b>
                Please remove the round parenthesis, concatenate it with an empty string as in &#123; (a ? b : c) + '' &#125;
                or replace the ternary operator as in (a && b || c).
            </label>}
            {(jsx).indexOf('<>') >= 0 && <label>
                <b className={'text-warning'}>Warning:</b>
                JSX.Fragment {'<>'} is valid JSX but is not supported by our compiler.
                Please replace it with an array [] instead.
            </label>}
            {(jsx).indexOf('?.') >= 0 && <label>
                <b className={'text-warning'}>Warning:</b>
                Optional chaining {'.?'} is valid JS but is not supported by our compiler.
                Please replace it with && instead. Eg: from (a?.b) to (a && a.b).
            </label>}
            {(jsx).indexOf('??') >= 0 && <label>
                <b className={'text-warning'}>Warning:</b>
                Nullish coalescing {'??'} is valid JS but is not supported by our compiler.
                Please replace it with explicit null and undefined checks, or a ||.
            </label>}
        </div>}
        {show && <div className={'monaco-editor-wrapper'}
                      style={{padding: '5px', minHeight: '20px', height:'100px', resize: 'vertical', overflow:'hidden'}}
                      tabIndex={-1} onBlur={blur}>
            <Editor className={'mx-1'} onChange={change} language={"typescript"}
                    options={{fontSize: 12, scrollbar: {vertical: 'hidden', horizontalScrollbarSize: 5}, minimap: {enabled: false}, readOnly: readOnly}}
                    defaultLanguage={'typescript'} value={dview.jsxString} />
        </div>}
    </>);
}
interface OwnProps {
    viewid: Pointer<DViewElement, 1, 1, LViewElement>;
    readonly?: boolean;
}

interface StateProps {
    view: LViewElement;
    debugmode: boolean;
}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    ret.debugmode = state.debug;
    ret.view = LViewElement.fromPointer(ownProps.viewid);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const JsxEditorConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(JsxEditorComponent);

export const JsxEditor = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <JsxEditorConnected {...{...props, children}} />;
}

JsxEditorComponent.cname = "JsxEditorComponent";
JsxEditorConnected.cname = "JsxEditorConnected";
JsxEditor.cname = "JsxEditor";
export default JsxEditor;
