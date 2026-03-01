import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/AppSidebar'
import RemotionPlayer from '@/components/RemotionPlayer'
import Timeline from '@/components/Timeline'
import TerminalPanel from '@/components/TerminalPanel'
import UploadsPanel from '@/components/panels/UploadsPanel'
import VideosPanel from '@/components/panels/VideosPanel'
import EditPanel from '@/components/panels/EditPanel'
import CaptionsPanel from '@/components/panels/CaptionsPanel'
import TextTemplatesPanel from '@/components/panels/TextTemplatesPanel'
import ExportsPanel from '@/components/panels/ExportsPanel'
import SettingsPanel from '@/components/panels/SettingsPanel'
import { useProject } from '@/contexts/ProjectContext'

const DEFAULT_TIMELINE_DURATION = 30 // seconds

export default function VideoEditor({ onBack }) {
  const { project, saveProject } = useProject()
  const playerRef = useRef(null)
  const terminalPanelRef = useRef(null)
  const [terminalCollapsed, setTerminalCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('uploads')
  const [tracks, setTracks] = useState([])
  const [selectedClipIds, setSelectedClipIds] = useState([])
  const selectedClipId = selectedClipIds[selectedClipIds.length - 1] ?? null
  const [currentFrame, setCurrentFrame] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hiddenTrackIds, setHiddenTrackIds] = useState(() => new Set())
  const [timelineDurationSeconds, setTimelineDurationSeconds] = useState(DEFAULT_TIMELINE_DURATION)

  // Sync seconds↔frames helper
  const syncClipFields = useCallback((clip, clipFps) => ({
    ...clip,
    startFrame: Math.round((clip.start ?? (clip.startFrame || 0) / clipFps) * clipFps),
    durationFrames: Math.round((clip.duration ?? (clip.durationFrames || 0) / clipFps) * clipFps),
    start: clip.start ?? (clip.startFrame || 0) / clipFps,
    duration: clip.duration ?? (clip.durationFrames || 0) / clipFps,
  }), [])

  // Track the lastModified value we last saved, so we can ignore our own save echoes
  const lastSavedModified = useRef(null)

  // Initialize tracks from project (also reacts to external reloads via lastModified)
  useEffect(() => {
    if (project?.tracks) {
      // Skip if this reload is just the echo of our own save
      if (project.lastModified && project.lastModified === lastSavedModified.current) {
        return
      }
      setTracks(project.tracks)
    }
  }, [project?.id, project?.lastModified])

  const fps = project?.composition?.fps || 30
  const width = project?.composition?.width || 1080
  const height = project?.composition?.height || 1920

  // Migrate existing clips: add start/duration (seconds) if only frame-based fields exist
  useEffect(() => {
    setTracks((prev) => {
      let changed = false
      const migrated = prev.map((track) => {
        const migratedClips = (track.clips || []).map((clip) => {
          if (clip.start !== undefined && clip.duration !== undefined) return clip
          changed = true
          return syncClipFields(clip, fps)
        })
        return { ...track, clips: migratedClips }
      })
      return changed ? migrated : prev
    })
  }, [fps, syncClipFields])

  // Dynamic timeline duration — auto-extend when clips exceed current duration
  useEffect(() => {
    let maxEnd = 0
    for (const track of tracks) {
      for (const clip of (track.clips || [])) {
        const clipEnd = (clip.start || 0) + (clip.duration || 0)
        if (clipEnd > maxEnd) maxEnd = clipEnd
      }
    }
    const needed = Math.max(maxEnd + 5, DEFAULT_TIMELINE_DURATION)
    if (needed > timelineDurationSeconds) {
      setTimelineDurationSeconds(needed)
    }
  }, [tracks, timelineDurationSeconds])

  const totalFrames = Math.max(
    project?.composition?.durationInFrames || 0,
    Math.round(timelineDurationSeconds * fps)
  )

  // Filter tracks for player — hide tracks the user toggled off
  const playerTracks = useMemo(() =>
    tracks.map((track) => ({
      ...track,
      visible: !hiddenTrackIds.has(track.id),
    })),
    [tracks, hiddenTrackIds]
  )

  // All timeline clips flattened
  const timelineClips = useMemo(() =>
    tracks.flatMap((track) =>
      (track.clips || []).map((clip) => ({ ...clip, trackId: track.id }))
    ),
    [tracks]
  )

  const selectedClip = timelineClips.find((c) => c.id === selectedClipId) || null

  // Auto-save tracks to project (with synced frame↔seconds fields)
  const autoSaveTimeout = useRef(null)
  useEffect(() => {
    if (!project) return
    clearTimeout(autoSaveTimeout.current)
    autoSaveTimeout.current = setTimeout(async () => {
      const syncedTracks = tracks.map((track) => ({
        ...track,
        clips: (track.clips || []).map((clip) => syncClipFields(clip, fps)),
      }))
      try {
        const saved = await saveProject({ tracks: syncedTracks })
        if (saved?.lastModified) {
          lastSavedModified.current = saved.lastModified
        }
      } catch {}
    }, 2000)
    return () => clearTimeout(autoSaveTimeout.current)
  }, [tracks, fps, syncClipFields])

  const handleSeek = useCallback((frame) => {
    setCurrentFrame(frame)
    if (playerRef.current) {
      playerRef.current.seekTo(frame)
    }
  }, [])

  const handlePlayPause = useCallback(() => {
    setIsPlaying((prev) => {
      if (playerRef.current) {
        if (prev) {
          playerRef.current.pause()
        } else {
          playerRef.current.play()
        }
      }
      return !prev
    })
  }, [])

  // Refs for keyboard handler stabilization
  const currentFrameRef = useRef(currentFrame)
  useEffect(() => { currentFrameRef.current = currentFrame }, [currentFrame])

  const selectedClipIdsRef = useRef(selectedClipIds)
  useEffect(() => { selectedClipIdsRef.current = selectedClipIds }, [selectedClipIds])

  const selectedClipRef = useRef(selectedClip)
  useEffect(() => { selectedClipRef.current = selectedClip }, [selectedClip])

  const selectedClipIdRef = useRef(selectedClipId)
  useEffect(() => { selectedClipIdRef.current = selectedClipId }, [selectedClipId])

  // Skip forward/backward by N seconds
  const handleSkip = useCallback((seconds) => {
    const newFrame = Math.max(0, Math.min(currentFrameRef.current + Math.round(seconds * fps), totalFrames - 1))
    handleSeek(newFrame)
  }, [fps, totalFrames, handleSeek])

  const handleAddTrack = useCallback((type = 'video') => {
    const newTrack = {
      id: `track-${Date.now()}`,
      type,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${tracks.length + 1}`,
      clips: [],
      visible: true,
    }
    setTracks((prev) => [...prev, newTrack])
  }, [tracks.length])

  const handleTracksChange = useCallback((tracksOrUpdater) => {
    setTracks((prev) => {
      const next = typeof tracksOrUpdater === 'function' ? tracksOrUpdater(prev) : tracksOrUpdater
      return next
    })
  }, [])

  const handleClipUpdate = useCallback((clipId, updates) => {
    setTracks((prev) =>
      prev.map((track) => ({
        ...track,
        clips: track.clips.map((clip) =>
          clip.id === clipId ? { ...clip, ...updates } : clip
        ),
      }))
    )
  }, [])

  const handleClipDelete = useCallback((clipId) => {
    setTracks((prev) =>
      prev.map((track) => ({
        ...track,
        clips: track.clips.filter((clip) => clip.id !== clipId),
      }))
    )
    setSelectedClipIds((prev) => prev.filter((id) => id !== clipId))
  }, [])

  // Handle clip selection — supports single & multi-select from timeline
  const handleSelectedClipChange = useCallback((clipIdOrIds) => {
    if (clipIdOrIds === null) {
      setSelectedClipIds([])
    } else if (Array.isArray(clipIdOrIds)) {
      setSelectedClipIds(clipIdOrIds)
    } else {
      setSelectedClipIds([clipIdOrIds])
    }
  }, [])

  // Handle clip selection from the player overlay (always single select)
  const handlePlayerClipSelect = useCallback((clipId) => {
    if (clipId === null) {
      setSelectedClipIds([])
    } else {
      setSelectedClipIds([clipId])
    }
  }, [])

  const handleTrackVisibilityChange = useCallback((trackId) => {
    setHiddenTrackIds((prev) => {
      const next = new Set(prev)
      if (next.has(trackId)) {
        next.delete(trackId)
      } else {
        next.add(trackId)
      }
      return next
    })
  }, [])

  const probeMediaDimensions = useCallback((src, type) => {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(null), 5000)
      if (type === 'image') {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => { clearTimeout(timeout); resolve({ width: img.naturalWidth, height: img.naturalHeight }) }
        img.onerror = () => { clearTimeout(timeout); resolve(null) }
        img.src = src
      } else {
        const video = document.createElement('video')
        video.preload = 'metadata'
        video.crossOrigin = 'anonymous'
        video.onloadedmetadata = () => { clearTimeout(timeout); resolve({ width: video.videoWidth, height: video.videoHeight }) }
        video.onerror = () => { clearTimeout(timeout); resolve(null) }
        video.src = src
      }
    })
  }, [])

  const handleAddClipToTimeline = useCallback(async (asset) => {
    const isAudio = asset.name.match(/\.(mp3|wav|ogg|aac|m4a|flac)$/i)
    const isVideo = asset.name.match(/\.(mp4|mov|webm|avi|mkv)$/i)
    const isImage = asset.name.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i)
    let trackType = 'video'
    if (isAudio) trackType = 'audio'
    else if (isImage) trackType = 'image'

    // Pre-probe dimensions for visual clips
    let intrinsicDims = null
    if ((isVideo || isImage) && asset.path) {
      intrinsicDims = await probeMediaDimensions(asset.path, isImage ? 'image' : 'video')
    }

    let targetTrack = tracks.find((t) => t.type === trackType)
    if (!targetTrack) {
      targetTrack = {
        id: `track-${Date.now()}`,
        type: trackType,
        name: `${trackType.charAt(0).toUpperCase() + trackType.slice(1)} 1`,
        clips: [],
        visible: true,
      }
      setTracks((prev) => [...prev, targetTrack])
    }

    const lastEnd = targetTrack.clips.reduce(
      (max, c) => Math.max(max, (c.start || 0) + (c.duration || 0)),
      0
    )

    const durationSeconds = asset.duration || 5

    const newClip = {
      id: `clip-${Date.now()}`,
      type: trackType,
      name: asset.name,
      src: asset.path,
      path: asset.path,
      mimeType: asset.mimeType || (isVideo ? 'video/mp4' : isImage ? 'image/jpeg' : isAudio ? 'audio/mpeg' : 'video/mp4'),
      start: lastEnd,
      duration: durationSeconds,
      startFrame: Math.round(lastEnd * fps),
      durationFrames: Math.round(durationSeconds * fps),
      sourceStart: 0,
      ...(asset.duration && (isVideo || isAudio) ? { originalDuration: asset.duration } : {}),
      ...(intrinsicDims ? { intrinsicWidth: intrinsicDims.width, intrinsicHeight: intrinsicDims.height } : {}),
      // Transform defaults
      x: 0,
      y: 0,
      scale: 100,
      rotation: 0,
      opacity: 100,
    }

    setTracks((prev) =>
      prev.map((track) =>
        track.id === targetTrack.id
          ? { ...track, clips: [...track.clips, newClip] }
          : track
      )
    )
    toast.success(`Added ${asset.name} to timeline`)
  }, [tracks, fps, probeMediaDimensions])

  // Keyboard shortcuts — uses refs so handler is registered once
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return

      const clipIds = selectedClipIdsRef.current
      const clipId = selectedClipIdRef.current
      const clip = selectedClipRef.current

      switch (e.key) {
        case ' ':
          e.preventDefault()
          handlePlayPause()
          break
        case 'Delete':
        case 'Backspace':
          if (clipIds.length > 0) {
            e.preventDefault()
            clipIds.forEach((id) => handleClipDelete(id))
          }
          break
        case 'Escape':
          setSelectedClipIds([])
          break
        case 'ArrowLeft':
          e.preventDefault()
          if (clipId) {
            handleClipUpdate(clipId, {
              x: (clip?.x || 0) - (e.shiftKey ? 10 : 1),
            })
          } else {
            handleSkip(e.shiftKey ? -5 : -1)
          }
          break
        case 'ArrowRight':
          e.preventDefault()
          if (clipId) {
            handleClipUpdate(clipId, {
              x: (clip?.x || 0) + (e.shiftKey ? 10 : 1),
            })
          } else {
            handleSkip(e.shiftKey ? 5 : 1)
          }
          break
        case 'ArrowUp':
          e.preventDefault()
          if (clipId) {
            handleClipUpdate(clipId, {
              y: (clip?.y || 0) - (e.shiftKey ? 10 : 1),
            })
          }
          break
        case 'ArrowDown':
          e.preventDefault()
          if (clipId) {
            handleClipUpdate(clipId, {
              y: (clip?.y || 0) + (e.shiftKey ? 10 : 1),
            })
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlePlayPause, handleSkip, handleClipUpdate, handleClipDelete])

  const handleToggleTerminal = useCallback(() => {
    const panel = terminalPanelRef.current
    if (!panel) return
    if (terminalCollapsed) {
      panel.expand()
    } else {
      panel.collapse()
    }
  }, [terminalCollapsed])

  const renderPanel = () => {
    switch (activeTab) {
      case 'uploads':
        return <UploadsPanel onAddToTimeline={handleAddClipToTimeline} />
      case 'videos':
        return <VideosPanel onAddToTimeline={handleAddClipToTimeline} />
      case 'edit':
        return (
          <EditPanel
            selectedClip={selectedClip}
            onClipUpdate={handleClipUpdate}
          />
        )
      case 'text-templates':
        return <TextTemplatesPanel onTracksChange={handleTracksChange} fps={fps} />
      case 'captions':
        return <CaptionsPanel tracks={tracks} onTracksChange={handleTracksChange} fps={fps} />
      case 'exports':
        return <ExportsPanel tracks={tracks} totalFrames={totalFrames} />
      case 'settings':
        return <SettingsPanel />
      default:
        return <UploadsPanel onAddToTimeline={handleAddClipToTimeline} />
    }
  }

  if (!project) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading project...</div>
      </div>
    )
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex h-screen w-full bg-background">
        <AppSidebar
          activeTab={activeTab}
          onTabClick={setActiveTab}
          onBack={onBack}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <ResizablePanelGroup direction="horizontal" className="flex-1">
            {/* Left panel - sidebar content */}
            <ResizablePanel defaultSize={20} minSize={15} maxSize={35}>
              <div className="h-full border-r min-w-0 flex flex-col">
                {renderPanel()}
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Center panel - player + timeline */}
            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="h-full min-h-0 flex flex-col">
                <ResizablePanelGroup direction="vertical" className="flex-1 min-h-0">
                <ResizablePanel defaultSize={65} minSize={30}>
                  <div className="h-full w-full min-h-0 flex items-center justify-center bg-black/95">
                    <RemotionPlayer
                      ref={playerRef}
                      project={project}
                      tracks={playerTracks}
                      currentFrame={currentFrame}
                      isPlaying={isPlaying}
                      totalFrames={totalFrames}
                      fps={fps}
                      onFrameChange={setCurrentFrame}
                      onPlaybackStateChange={setIsPlaying}
                      selectedClipId={selectedClipId}
                      onClipSelect={handlePlayerClipSelect}
                      onClipUpdate={handleClipUpdate}
                    />
                  </div>
                </ResizablePanel>

                <ResizableHandle withHandle />

                <ResizablePanel defaultSize={35} minSize={15}>
                  <Timeline
                    tracks={tracks}
                    timelineClips={timelineClips}
                    currentFrame={currentFrame}
                    totalFrames={totalFrames}
                    fps={fps}
                    isPlaying={isPlaying}
                    onSeek={handleSeek}
                    onPlayPause={handlePlayPause}
                    onAddTrack={handleAddTrack}
                    onTracksChange={handleTracksChange}
                    selectedClipId={selectedClipId}
                    selectedClipIds={selectedClipIds}
                    onSelectedClipChange={handleSelectedClipChange}
                    onClipUpdate={handleClipUpdate}
                    onClipDelete={handleClipDelete}
                    onSkip={handleSkip}
                    onTrackVisibilityChange={handleTrackVisibilityChange}
                    hiddenTrackIds={hiddenTrackIds}
                  />
                </ResizablePanel>
              </ResizablePanelGroup>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Right panel - terminal */}
            <ResizablePanel
              ref={terminalPanelRef}
              defaultSize={30}
              minSize={15}
              maxSize={50}
              collapsible
              collapsedSize={3}
              onCollapse={() => setTerminalCollapsed(true)}
              onExpand={() => setTerminalCollapsed(false)}
            >
              <TerminalPanel
                collapsed={terminalCollapsed}
                onToggleCollapse={handleToggleTerminal}
                projectId={project.id}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </SidebarProvider>
  )
}
