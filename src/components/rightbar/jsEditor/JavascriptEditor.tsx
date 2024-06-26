import React, {CSSProperties, Dispatch, ReactElement, ReactNode, useEffect} from 'react';
import {connect} from 'react-redux';
import Editor, {useMonaco} from '@monaco-editor/react';
import {
    DState,
    DViewElement,
    LViewElement,
    Pointer,
    Defaults,
    LPointerTargetable,
    Pack1,
    Overlap, GObject
} from '../../../joiner';
import {useStateIfMounted} from 'use-state-if-mounted';
import {FakeStateProps, Info} from '../../../joiner/types';

function JavascriptEditorComponent(props: AllProps) {
    let {placeHolder, height, title, jsxLabel, data, field} = props;
    let getter = ((): string => data && field && (data as any)[field]) || props.getter;
    let setter = ((val: string) => {
        data && field && ((data as any)[field] = val)
        return;
    }) || props.setter;
    const [js, setJs] = useStateIfMounted(getter());
    const [show, setShow] = useStateIfMounted(props.hide === false ? false : true);
    const [showTooltip, setShowTooltip] = useStateIfMounted(false);
    const readOnly = props.readonly !== undefined ? props.readonly : data && Defaults.check(data.id);
    const change = (value: string|undefined) => {
        /* save in local state for frequent changes */
        setJs(value || '');
    }
    const blur = () => {
        /* confirm in redux state for final state */
        setter(js);
    }
    const monaco = useMonaco();
    (window as any).monaco = monaco;

    useEffect(() => {
        if (!monaco) return;
        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.Latest,
            allowNonTsExtensions: true,
            moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
            module: monaco.languages.typescript.ModuleKind.CommonJS,
            noEmit: true,
            esModuleInterop: true,
            reactNamespace: 'React',
            allowJs: true,
            typeRoots: ['node_modules/@types']//, 'src/static/'], // doubt those can be accesed at runtime but trying
        });
        monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({ noSemanticValidation: false, noSyntaxValidation: false });
        monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);
        monaco.languages.typescript.typescriptDefaults.addExtraLib(`declare var data: 'datatype';`);
        }, [monaco]);

    let value = js || placeHolder;
    let gata = data as GObject;
    const info: Info | undefined = data && field && gata['__info_of__' + field];
    let tooltip: ReactNode = ((props.tooltip === true) ? (info ? info.txt: '') : props.tooltip) || '';

    if (jsxLabel === undefined && info) jsxLabel = typeof info.label === "string" ? <label className={'ms-2 mb-1 my-auto'}>{info.label}</label> : info.label || undefined;

    return <>
        <div style={{...(props.style || {})}} className={'d-flex'} onMouseEnter={e => setShowTooltip(true)} onMouseLeave={e => setShowTooltip(false)} >
            {props.hide !== undefined ? <span className={'cursor-pointer my-auto'} tabIndex={-1} onClick={e => setShow(!show)}>
                {show ? <i className={'bi bi-eye-fill'}/> : <i className={'bi bi-eye-slash-fill'}/>}
            </span> : undefined}
            {title}
            {jsxLabel}
        </div>
        {(tooltip && showTooltip) && <div className={'my-tooltip'}>
            <b className={'text-center text-capitalize'}>{field}</b>
            <br />
            <label>{tooltip}</label>
        </div>}
        {show && <div className={'monaco-editor-wrapper'}
             style={{padding: '5px', minHeight: '20px', height: height ? `${height}px` : '100px', resize: 'vertical', overflow:'hidden'}}
             tabIndex={-1} onBlur={blur}>
            <Editor className={'mx-1'} onChange={change}
                    options={{fontSize: 12, scrollbar: {vertical: 'hidden', horizontalScrollbarSize: 5}, minimap: {enabled: false}, readOnly: readOnly}}
                    defaultLanguage={'typescript'} value={value} />
        </div>}
    </>;
}
interface OwnProps {
    data?: Pack1<LPointerTargetable>;
    field?: string;
    getter?: () => string;
    setter?: (js: string) => void;
    readonly?: boolean;
    placeHolder?: string;
    hide: boolean | undefined; // undefined = show and disable autohiding. boolean, set initial state and allow hiding button.
    title?: ReactNode;
    jsxLabel?: ReactNode;
    tooltip?: ReactNode;
    style?: CSSProperties;
    height?: number;
}
interface StateProps { data?: LPointerTargetable; }
interface DispatchProps {}
type AllProps = Overlap<Overlap<OwnProps, DispatchProps>, StateProps>;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    ret.data = LViewElement.wrap(ownProps.data);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const JavascriptEditorConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(JavascriptEditorComponent);

export const JavascriptEditor = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <JavascriptEditorConnected {...{...props, children}} />;
}

JavascriptEditorComponent.cname = 'JavascriptEditorComponent';
JavascriptEditorConnected.cname = 'JavascriptEditorConnected';
JavascriptEditor.cname = 'JavascriptEditor';
export default JavascriptEditor;
