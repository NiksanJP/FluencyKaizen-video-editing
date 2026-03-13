import type {MouseEventHandler} from 'react';
import React from 'react';
import {Tab} from './Tabs';

export const CaptionsTab: React.FC<{
	readonly selected: boolean;
	readonly onClick: MouseEventHandler<HTMLDivElement>;
}> = ({selected, onClick}) => {
	return <Tab selected={selected} onClick={onClick}>Captions</Tab>;
};
