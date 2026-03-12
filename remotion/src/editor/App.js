import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef, useCallback, } from "react";
import { Toolbar } from "./components/Toolbar";
import { PlayerPanel } from "./components/PlayerPanel";
import { Timeline } from "./components/Timeline";
import { EditPanel } from "./components/EditPanel";
const FPS = 30;
export const App = () => {
    const [clips, setClips] = useState([]);
    const [selectedClipId, setSelectedClipId] = useState(null);
    const [clipData, setClipData] = useState(null);
    const [isDirty, setIsDirty] = useState(false);
    const [saveStatus, setSaveStatus] = useState("idle");
    const [currentFrame, setCurrentFrame] = useState(0);
    const [selectedSubtitleIdx, setSelectedSubtitleIdx] = useState(null);
    const [selectedVocabIdx, setSelectedVocabIdx] = useState(null);
    const playerRef = useRef(null);
    const saveTimeout = useRef(null);
    // Load clip list
    useEffect(() => {
        fetch("/api/clips")
            .then((r) => r.json())
            .then((data) => {
            setClips(data);
            if (data.length > 0)
                loadClip(data[0].id);
        })
            .catch(() => { });
    }, []);
    function loadClip(id) {
        setSelectedClipId(id);
        setCurrentFrame(0);
        setSelectedSubtitleIdx(null);
        setSelectedVocabIdx(null);
        fetch(`/api/clip/${encodeURIComponent(id)}`)
            .then((r) => r.json())
            .then((data) => {
            setClipData(data);
            setIsDirty(false);
            setSaveStatus("idle");
        })
            .catch(() => { });
    }
    function updateClipData(updater) {
        setClipData((prev) => {
            if (!prev)
                return prev;
            const next = updater(JSON.parse(JSON.stringify(prev)));
            return next;
        });
        setIsDirty(true);
        setSaveStatus("idle");
        // Auto-save after 1.5s idle
        if (saveTimeout.current)
            clearTimeout(saveTimeout.current);
        saveTimeout.current = setTimeout(doSave, 1500);
    }
    const doSave = useCallback(() => {
        if (!selectedClipId || !clipData)
            return;
        setSaveStatus("saving");
        fetch(`/api/clip/${encodeURIComponent(selectedClipId)}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(clipData, null, 2),
        })
            .then((r) => {
            if (!r.ok)
                throw new Error("save failed");
            setIsDirty(false);
            setSaveStatus("saved");
        })
            .catch(() => setSaveStatus("error"));
    }, [selectedClipId, clipData]);
    // Cmd/Ctrl+S save
    useEffect(() => {
        const handler = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "s") {
                e.preventDefault();
                if (isDirty) {
                    if (saveTimeout.current)
                        clearTimeout(saveTimeout.current);
                    doSave();
                }
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [isDirty, doSave]);
    // Sync currentFrame from player
    const handleFrameUpdate = useCallback((frame) => {
        setCurrentFrame(frame);
    }, []);
    // Seek player to a specific second (relative to clip start)
    const seekToSecond = useCallback((sec) => {
        const frame = Math.round(sec * FPS);
        playerRef.current?.seekTo(frame);
        setCurrentFrame(frame);
    }, []);
    // Click subtitle → seek to it
    const handleSubtitleClick = useCallback((idx) => {
        setSelectedSubtitleIdx(idx);
        setSelectedVocabIdx(null);
        if (clipData) {
            const relSec = clipData.subtitles[idx].startTime - clipData.clip.startTime;
            seekToSecond(Math.max(0, relSec));
        }
    }, [clipData, seekToSecond]);
    // Click vocab card → seek to it
    const handleVocabClick = useCallback((idx) => {
        setSelectedVocabIdx(idx);
        setSelectedSubtitleIdx(null);
        if (clipData) {
            const relSec = clipData.vocabCards[idx].triggerTime - clipData.clip.startTime;
            seekToSecond(Math.max(0, relSec));
        }
    }, [clipData, seekToSecond]);
    const durationInFrames = clipData
        ? Math.max(1, Math.round((clipData.clip.endTime - clipData.clip.startTime) * FPS))
        : 1;
    return (_jsxs("div", { style: {
            display: "flex",
            flexDirection: "column",
            height: "100vh",
            background: "#0d0d0d",
            color: "#d4d4d4",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            fontSize: 13,
            overflow: "hidden",
        }, children: [_jsx(Toolbar, { clips: clips, selectedClipId: selectedClipId, isDirty: isDirty, saveStatus: saveStatus, onSelectClip: loadClip, onSave: () => {
                    if (saveTimeout.current)
                        clearTimeout(saveTimeout.current);
                    doSave();
                } }), _jsxs("div", { style: { display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }, children: [_jsx(PlayerPanel, { playerRef: playerRef, clipData: clipData, durationInFrames: durationInFrames, fps: FPS, onFrameUpdate: handleFrameUpdate }), _jsx(EditPanel, { clipData: clipData, selectedSubtitleIdx: selectedSubtitleIdx, selectedVocabIdx: selectedVocabIdx, onSubtitleClick: handleSubtitleClick, onVocabClick: handleVocabClick, onUpdateClip: updateClipData })] }), _jsx(Timeline, { clipData: clipData, currentFrame: currentFrame, fps: FPS, durationInFrames: durationInFrames, selectedSubtitleIdx: selectedSubtitleIdx, selectedVocabIdx: selectedVocabIdx, onSeek: (frame) => {
                    playerRef.current?.seekTo(frame);
                    setCurrentFrame(frame);
                }, onSubtitleClick: handleSubtitleClick, onVocabClick: handleVocabClick })] }));
};
//# sourceMappingURL=App.js.map