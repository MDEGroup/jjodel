import React, {Component} from 'react';
import {Input, LViewElement, LViewPoint, Select, SetFieldAction} from '../../../../joiner';
import {OclEditor} from '../../oclEditor/OclEditor';
import {GraphElements} from "../../../../joiner/components";

interface Props {view: LViewElement, viewpoints: LViewPoint[], readonly: boolean}

function InfoData(props: Props) {
    const view = props.view;
    const viewpoints = props.viewpoints;
    const readOnly = props.readonly;

    const objectTypes = ['', 'DModel', 'DPackage', 'DEnumerator', 'DEnumLiteral', 'DClass', 'DAttribute', 'DReference', 'DOperation', 'DParameter', 'DObject', 'DValue', 'DStructuralFeature'];
    const classesOptions = <optgroup label={'Object type'}>
            {objectTypes.map((o)=><option key={o} value={o}>{o ? o.substring(1) : 'anything'}</option>)}
    </optgroup>;

    const changeVP = (evt: React.ChangeEvent<HTMLSelectElement>) => {
        const value = evt.target.value;
        if(value !== 'null') SetFieldAction.new(view.id, 'viewpoint', value, '', true);
        else SetFieldAction.new(view.id, 'viewpoint', '', '', false);
    }

    return(<section className={'p-3'}>
        <Input data={view} field={'name'} label={'Name'} type={'text'} readonly={readOnly}/>
        <Input data={view} field={'explicitApplicationPriority'} label={'Priority'} type={'number'} readonly={readOnly}/>
        {/*
        <Select data={view} field={'appliableTo'} label={'Appliable to node types'} readonly={readOnly} options={<optgroup label={'Appliable Types'}>
            <option value={'node'}>Node</option>
            <option value={'edge'}>Edge</option>
            <option value={'edgePoint'}>Edge Point</option>
        </optgroup>} />
        */}
        <Select data={view} field={'forceNodeType'} label={'Preferred appearance'} readonly={readOnly} options={
            <>
                <optgroup label={'Graph'}>{
                    Object.keys(GraphElements.Graphs).map((key: string) => <option value={key}>{GraphElements[key].cname}</option>)
                }</optgroup>
                <optgroup label={'Edge'}>{
                    Object.keys(GraphElements.Edges).map((key: string) => <option value={key}>{GraphElements[key].cname}</option>)
                }</optgroup>
                <optgroup label={'Vertex'}>{
                    Object.keys(GraphElements.Vertexes).map((key: string) => <option value={key}>{GraphElements[key].cname}</option>)
                }</optgroup>
                <optgroup label={'Field'}>{
                    Object.keys(GraphElements.Fields).map((key: string) => <option value={key}>{GraphElements[key].cname}</option>)
                }</optgroup>
            </>
        } />
        <Select data={view} field={'appliableToClasses'} label={'Appliable to classes'} readonly={readOnly} options={classesOptions} />
        <div className={'d-flex p-1'}>
            <label className={'my-auto'}>Viewpoint</label>
            <select className={'my-auto ms-auto select'} disabled={readOnly}
                    defaultValue={view.viewpoint ? view.viewpoint.id : 'null'} onChange={changeVP}>
                <option value={'null'}>-----</option>
                {viewpoints.map((viewpoint, index) => {
                    return(<option key={index} value={viewpoint.id}>{viewpoint.name}</option>);
                })}
            </select>
        </div>
        {/* damiano: qui Select component avrebbe fatto comodo al posto del select nativo, ma è troppo poco generica*/}
        {/*<div className='p-1' style={{display: 'flex'}}><label className='my-auto'>Appliable to</label>
            <select data-obj={view.id} data-field={'appliableToClasses'} data-label={'Appliable to'} data-options={ classesOptions }
                    value={view.appliableToClasses[0] || ''} onChange={(e) => { view.appliableToClasses = e.target.value as any; }}
                    className={'my-auto ms-auto select'} disabled={readOnly}>
                {classesOptions}
            </select>
        </div>*/}
        <OclEditor viewid={view.id} readonly={readOnly} />
        <span>OCL engine by Stephan Köninger, <a href={"https://ocl.stekoe.de/#examples"}>Supported instructions</a></span>
    </section>);
}

export default InfoData;
