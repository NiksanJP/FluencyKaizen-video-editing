import {createRef, useImperativeHandle} from 'react';
import {AssetSelector} from './AssetSelector';
import {CompSelectorRef} from './CompSelectorRef';

const container: React.CSSProperties = {
	height: '100%',
	width: '100%',
	maxWidth: '100%',
	display: 'flex',
	flexDirection: 'column',
	flex: 1,
};

export const explorerSidebarTabs = createRef<{
	selectAssetsPanel: () => void;
	selectCompositionPanel: () => void;
}>();

export const ExplorerPanel: React.FC<{
	readOnlyStudio: boolean;
}> = ({readOnlyStudio}) => {
	useImperativeHandle(explorerSidebarTabs, () => {
		return {
			selectAssetsPanel: () => {},
			selectCompositionPanel: () => {},
		};
	}, []);

	return (
		<CompSelectorRef>
			<div style={container} className="css-reset">
				<AssetSelector readOnlyStudio={readOnlyStudio} />
			</div>
		</CompSelectorRef>
	);
};
