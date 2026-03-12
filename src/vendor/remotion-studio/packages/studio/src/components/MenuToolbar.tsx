import type {SetStateAction} from 'react';
import React, {useCallback, useMemo, useState} from 'react';
import {BACKGROUND, getBackgroundFromHoverState, LIGHT_TEXT} from '../helpers/colors';
import {useMobileLayout} from '../helpers/mobile-layout';
import {useMenuStructure} from '../helpers/use-menu-structure';
import {Row, Spacing} from './layout';
import type {MenuId} from './Menu/MenuItem';
import {MenuItem} from './Menu/MenuItem';
import {MenuBuildIndicator} from './MenuBuildIndicator';
import {SidebarCollapserControls} from './SidebarCollapserControls';
import {UpdateCheck} from './UpdateCheck';

const BackToHomeButton: React.FC<{readonly onClick: () => void}> = ({onClick}) => {
	const [hovered, setHovered] = useState(false);
	const btnStyle: React.CSSProperties = useMemo(
		() => ({
			display: 'inline-flex',
			alignItems: 'center',
			gap: 6,
			padding: '4px 10px',
			marginRight: 4,
			background: getBackgroundFromHoverState({hovered, selected: false}),
			border: '1px solid rgba(255,255,255,0.15)',
			borderRadius: 4,
			color: hovered ? 'white' : LIGHT_TEXT,
			fontSize: 12,
			fontFamily: 'inherit',
			cursor: 'pointer',
			transition: 'background 0.15s, color 0.15s, border-color 0.15s',
			whiteSpace: 'nowrap' as const,
			flexShrink: 0,
		}),
		[hovered],
	);
	return (
		<button
			type="button"
			id="fk-back-home"
			title="Back to Home"
			style={btnStyle}
			onClick={onClick}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
		>
			<svg
				viewBox="0 0 24 24"
				style={{width: 14, height: 14, fill: 'currentColor'}}
			>
				<path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
			</svg>
			Home
		</button>
	);
};

const row: React.CSSProperties = {
	alignItems: 'center',
	flexDirection: 'row',
	display: 'flex',
	color: 'white',
	borderBottom: '1px solid black',
	fontSize: 13,
	paddingLeft: 6,
	paddingRight: 10,
	backgroundColor: BACKGROUND,
};

const flex: React.CSSProperties = {
	flex: 1,
};

export const MenuToolbar: React.FC<{
	readonly readOnlyStudio: boolean;
}> = ({readOnlyStudio}) => {
	const [selected, setSelected] = useState<string | null>(null);

	const mobileLayout = useMobileLayout();

	const fixedWidthRight: React.CSSProperties = useMemo(() => {
		return {
			...(mobileLayout
				? {width: 'fit-content'}
				: {
						width: '330px',
					}),
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'flex-end',
		};
	}, [mobileLayout]);

	const fixedWidthLeft: React.CSSProperties = useMemo(() => {
		return {
			...(mobileLayout
				? {minWidth: '0px'}
				: {
						minWidth: '330px',
					}),
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'flex-start',
		};
	}, [mobileLayout]);

	const itemClicked = useCallback(
		(itemId: SetStateAction<string | null>) => {
			setSelected(itemId);
		},
		[setSelected],
	);

	const itemHovered = useCallback(
		(itemId: MenuId) => {
			if (selected) {
				setSelected(itemId);
			}
		},
		[selected, setSelected],
	);

	const closeMenu = useCallback(() => {
		setSelected(null);
	}, []);

	const structure = useMenuStructure(closeMenu, readOnlyStudio);

	const menus = useMemo(() => {
		return structure.map((s) => s.id);
	}, [structure]);

	const onPreviousMenu = useCallback(() => {
		setSelected((s) => {
			if (s === null) {
				return null;
			}

			return menus[(menus.indexOf(s as MenuId) + 1) % menus.length];
		});
	}, [menus]);

	const onNextMenu = useCallback(() => {
		setSelected((s) => {
			if (s === null) {
				return null;
			}

			if (menus.indexOf(s as MenuId) === 0) {
				return menus[menus.length - 1];
			}

			return menus[(menus.indexOf(s as MenuId) - 1) % menus.length];
		});
	}, [menus]);

	const onItemQuit = useCallback(() => {
		setSelected(null);
	}, [setSelected]);

	const goBackToProjects = useCallback(() => {
		if (typeof window !== 'undefined' && (window as Window & {studio?: {goBack?: () => void}}).studio?.goBack) {
			(window as Window & {studio: {goBack: () => void}}).studio.goBack();
		} else if (typeof window !== 'undefined' && window.parent !== window) {
			window.parent.postMessage({type: 'go-home'}, '*');
		} else if (typeof window !== 'undefined') {
			window.location.href = '/';
		}
	}, []);

	return (
		<Row align="center" className="css-reset" style={row}>
			<div style={fixedWidthLeft}>
				<BackToHomeButton onClick={goBackToProjects} />
				<Spacing x={1} />
				{structure.map((s) => {
					return (
						<MenuItem
							key={s.id}
							selected={selected === s.id}
							onItemSelected={itemClicked}
							onItemHovered={itemHovered}
							id={s.id}
							label={s.label}
							onItemQuit={onItemQuit}
							menu={s}
							onPreviousMenu={onPreviousMenu}
							onNextMenu={onNextMenu}
							leaveLeftPadding={s.leaveLeftPadding}
						/>
					);
				})}
				{readOnlyStudio ? null : <UpdateCheck />}
			</div>
			<div style={flex} />
			<MenuBuildIndicator />
			<div style={flex} />
			<div style={fixedWidthRight}>
				<SidebarCollapserControls />
			</div>
			<Spacing x={1} />
		</Row>
	);
};
