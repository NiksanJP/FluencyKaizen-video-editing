import React, {useCallback, useMemo, useState} from 'react';
import {BACKGROUND, BLUE, INPUT_BACKGROUND, LIGHT_TEXT} from '../helpers/colors';
import {copyText} from '../helpers/copy-text';

type SubtitleLike = {
	readonly startTime?: number;
	readonly endTime?: number;
	readonly en?: string;
	readonly ja?: string;
	readonly target?: string;
};

type ClipDataLike = {
	readonly socialTitle?: string;
	readonly targetLanguage?: string;
	readonly subtitles?: SubtitleLike[];
};

const container: React.CSSProperties = {
	padding: 16,
	display: 'flex',
	flexDirection: 'column',
	gap: 16,
	overflowY: 'auto',
	height: '100%',
	backgroundColor: BACKGROUND,
};

const card: React.CSSProperties = {
	backgroundColor: INPUT_BACKGROUND,
	borderRadius: 8,
	padding: 12,
	display: 'flex',
	flexDirection: 'column',
	gap: 10,
};

const textareaStyle: React.CSSProperties = {
	width: '100%',
	minHeight: 160,
	resize: 'vertical',
	border: '1px solid rgba(255,255,255,0.08)',
	borderRadius: 6,
	backgroundColor: 'rgba(0,0,0,0.18)',
	color: 'white',
	fontSize: 12,
	fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
	lineHeight: 1.5,
	padding: 10,
};

const buttonStyle: React.CSSProperties = {
	alignSelf: 'flex-start',
	border: 'none',
	borderRadius: 6,
	padding: '8px 12px',
	backgroundColor: BLUE,
	color: 'white',
	fontSize: 12,
	fontWeight: 600,
	cursor: 'pointer',
};

const labelStyle: React.CSSProperties = {
	fontSize: 11,
	letterSpacing: '0.06em',
	textTransform: 'uppercase',
	color: LIGHT_TEXT,
};

const titleStyle: React.CSSProperties = {
	fontSize: 14,
	fontWeight: 600,
	color: 'white',
};

const helperText: React.CSSProperties = {
	fontSize: 12,
	lineHeight: 1.5,
	color: LIGHT_TEXT,
};

const emptyState: React.CSSProperties = {
	...card,
	justifyContent: 'center',
	alignItems: 'center',
	minHeight: 220,
	color: LIGHT_TEXT,
	textAlign: 'center',
};

const LANGUAGE_LABELS: Record<string, string> = {
	ja: 'Japanese',
	zh: 'Chinese',
	ko: 'Korean',
	es: 'Spanish',
};

const formatTime = (value: number | undefined) => {
	if (typeof value !== 'number' || Number.isNaN(value)) {
		return '00:00.00';
	}

	const minutes = Math.floor(value / 60);
	const seconds = value - minutes * 60;
	return `${String(minutes).padStart(2, '0')}:${seconds
		.toFixed(2)
		.padStart(5, '0')}`;
};

const CopyBlock: React.FC<{
	readonly title: string;
	readonly description: string;
	readonly value: string;
	readonly buttonLabel: string;
}> = ({title, description, value, buttonLabel}) => {
	const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');

	const onCopy = useCallback(() => {
		copyText(value)
			.then(() => {
				setCopyState('copied');
				window.setTimeout(() => setCopyState('idle'), 1600);
			})
			.catch(() => {
				setCopyState('error');
				window.setTimeout(() => setCopyState('idle'), 2200);
			});
	}, [value]);

	return (
		<div style={card}>
			<div style={labelStyle}>{title}</div>
			<div style={helperText}>{description}</div>
			<textarea readOnly value={value} style={textareaStyle} />
			<button type="button" onClick={onCopy} style={buttonStyle}>
				{copyState === 'copied'
					? 'Copied'
					: copyState === 'error'
						? 'Copy failed'
						: buttonLabel}
			</button>
		</div>
	);
};

export const CaptionsPanel: React.FC<{
	readonly currentDefaultProps: Record<string, unknown>;
}> = ({currentDefaultProps}) => {
	const clipData = (currentDefaultProps.clipData ?? null) as ClipDataLike | null;

	const subtitles = clipData?.subtitles ?? [];
	const socialTitle = clipData?.socialTitle ?? '';
	const targetLanguage = clipData?.targetLanguage ?? 'ja';
	const nativeLabel = LANGUAGE_LABELS[targetLanguage] ?? 'Native';

	const nativeCaptions = useMemo(() => {
		return subtitles
			.map((subtitle) => subtitle.target ?? subtitle.ja ?? '')
			.filter((line) => line.trim().length > 0)
			.join('\n');
	}, [subtitles]);

	const englishCaptions = useMemo(() => {
		return subtitles
			.map((subtitle) => subtitle.en ?? '')
			.filter((line) => line.trim().length > 0)
			.join('\n');
	}, [subtitles]);

	const bilingualCaptions = useMemo(() => {
		return subtitles
			.map((subtitle) => {
				const nativeLine = subtitle.target ?? subtitle.ja ?? '';
				const englishLine = subtitle.en ?? '';
				const timeRange = `${formatTime(subtitle.startTime)} - ${formatTime(
					subtitle.endTime,
				)}`;
				return [timeRange, nativeLine, englishLine].filter(Boolean).join('\n');
			})
			.join('\n\n');
	}, [subtitles]);

	if (subtitles.length === 0) {
		return (
			<div style={container}>
				<div style={emptyState}>
					<div style={titleStyle}>No captions found for this composition.</div>
				</div>
			</div>
		);
	}

	return (
		<div style={container}>
			<div style={card}>
				<div style={labelStyle}>Captions</div>
				<div style={titleStyle}>
					{subtitles.length} subtitle lines ready to copy
				</div>
				<div style={helperText}>
					Use the native-language block for posting captions directly, or the
					bilingual block if you want timestamps plus both lines together.
				</div>
			</div>
			{socialTitle ? (
				<CopyBlock
					title="Social post title"
					description="Post-ready title/caption for Instagram or TikTok, including emojis and up to 3 hashtags."
					value={socialTitle}
					buttonLabel="Copy social title"
				/>
			) : null}
			<CopyBlock
				title={`${nativeLabel} captions`}
				description={`One line per subtitle in ${nativeLabel}.`}
				value={nativeCaptions}
				buttonLabel={`Copy ${nativeLabel}`}
			/>
			<CopyBlock
				title="English captions"
				description="One line per subtitle in spoken English."
				value={englishCaptions}
				buttonLabel="Copy English"
			/>
			<CopyBlock
				title="Bilingual captions"
				description="Timestamped block with native line followed by English."
				value={bilingualCaptions}
				buttonLabel="Copy bilingual"
			/>
		</div>
	);
};
