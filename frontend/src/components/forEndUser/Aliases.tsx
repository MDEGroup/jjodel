import React, {Dispatch, ReactNode} from 'react';
import type {GObject} from '../../joiner';
import {U} from '../../joiner';

type OwnProps = GObject;
type StateProps = GObject;
type DispatchProps = GObject;
type AllProps = GObject; // Overlap<OwnProps, Overlap<StateProps, DispatchProps>>;

export function View(props: AllProps, children: ReactNode) {
    // @ts-ignore
    // console.log("VIEWW", {props, thiss: this as any, args: arguments});
    const rootprops: Partial<GObject<AllProps>> = {...props};
    delete rootprops.graph;
    delete rootprops.view;
    return(<view className={"view " + (props.className||'')} {...rootprops}>{props.children || children}</view>); }

View.cname = 'View';
