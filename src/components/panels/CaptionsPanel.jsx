import { useState, useCallback, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Mic, Loader2, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'
import { useProject } from '@/contexts/ProjectContext'
import { captionsToTracks, splitCaptions } from '@/utils/captionUtils'
import { toast } from 'sonner'
import { captions } from '@/lib/api'
import { TEMPLATES } from '@/data/textTemplates'
import { FONTS } from '@/data/fonts'

const VIDEO_EXTENSIONS = /\.(mp4|mov|webm|avi|mkv)$/i

const FONT_FAMILIES = [...new Set(FONTS.map((f) => f.family))]

const WEIGHT_OPTIONS = [
  { value: 400, label: 'Regular' },
  { value: 500, label: 'Medium' },
  { value: 600, label: 'SemiBold' },
  { value: 700, label: 'Bold' },
]

export default function CaptionsPanel({ tracks, onTracksChange, fps = 30 }) {
  const { project, assets } = useProject()
  const [selectedAsset, setSelectedAsset] = useState('')
  const [captionList, setCaptionList] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState({ stage: '', percent: 0, message: '' })
  const [hasCachedCaptions, setHasCachedCaptions] = useState(false)
  const [maxChars, setMaxChars] = useState(40)

  // Style controls
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [positionY, setPositionY] = useState(1480)
  const [fontFamily, setFontFamily] = useState('Inter')
  const [fontSize, setFontSize] = useState(42)
  const [fontWeight, setFontWeight] = useState(700)
  const [textAlign, setTextAlign] = useState('center')
  const [textColor, setTextColor] = useState('#FFFFFF')
  const [bgColor, setBgColor] = useState('rgba(0,0,0,0.6)')
  const [strokeWidth, setStrokeWidth] = useState(0)
  const [strokeColor, setStrokeColor] = useState('#000000')

  // Decorative properties from template (not individually editable)
  const [templateDecorative, setTemplateDecorative] = useState({})

  const splitCaptionList = useMemo(
    () => splitCaptions(captionList, maxChars),
    [captionList, maxChars]
  )

  const videoAssets = (assets || []).filter((a) => VIDEO_EXTENSIONS.test(a.name))

  // Compute final style from individual controls + template decorative props
  const captionStyle = useMemo(() => {
    const y = positionY

    const sharedDecorative = {}
    if (templateDecorative.shadowColor) sharedDecorative.shadowColor = templateDecorative.shadowColor
    if (templateDecorative.shadowBlur) sharedDecorative.shadowBlur = templateDecorative.shadowBlur
    if (templateDecorative.shadowOffsetX !== undefined) sharedDecorative.shadowOffsetX = templateDecorative.shadowOffsetX
    if (templateDecorative.shadowOffsetY !== undefined) sharedDecorative.shadowOffsetY = templateDecorative.shadowOffsetY
    if (templateDecorative.borderRadius) sharedDecorative.borderRadius = templateDecorative.borderRadius
    if (templateDecorative.letterSpacing) sharedDecorative.letterSpacing = templateDecorative.letterSpacing
    if (templateDecorative.backgroundPadding) sharedDecorative.backgroundPadding = templateDecorative.backgroundPadding

    return {
      fontFamily,
      fontWeight,
      fontSize,
      color: textColor,
      backgroundColor: bgColor,
      textAlign,
      x: 0,
      y,
      width: 1080,
      paddingX: 40,
      paddingY: 10,
      ...(strokeWidth > 0 ? { strokeWidth, strokeColor } : {}),
      ...sharedDecorative,
    }
  }, [
    positionY,
    fontFamily, fontSize, fontWeight,
    textAlign, textColor, bgColor,
    strokeWidth, strokeColor, templateDecorative,
  ])

  const applyTemplate = useCallback((template) => {
    if (!template) {
      setSelectedTemplate(null)
      setTemplateDecorative({})
      return
    }

    setSelectedTemplate(template.id)
    const ts = template.textStyles

    setFontFamily(ts.fontFamily)
    setFontSize(ts.fontSize)
    setFontWeight(parseInt(ts.fontWeight) || 700)

    if (ts.color) setTextColor(ts.color)
    if (ts.backgroundColor) setBgColor(ts.backgroundColor)
    if (ts.textAlign) setTextAlign(ts.textAlign)
    if (ts.strokeWidth) {
      setStrokeWidth(ts.strokeWidth)
      if (ts.strokeColor) setStrokeColor(ts.strokeColor)
    } else {
      setStrokeWidth(0)
    }

    // Collect decorative properties
    const deco = {}
    if (ts.shadowColor) deco.shadowColor = ts.shadowColor
    if (ts.shadowBlur) deco.shadowBlur = ts.shadowBlur
    if (ts.shadowOffsetX !== undefined) deco.shadowOffsetX = ts.shadowOffsetX
    if (ts.shadowOffsetY !== undefined) deco.shadowOffsetY = ts.shadowOffsetY
    if (ts.borderRadius) deco.borderRadius = ts.borderRadius
    if (ts.letterSpacing) deco.letterSpacing = ts.letterSpacing
    if (ts.paddingX) deco.backgroundPadding = ts.paddingX
    setTemplateDecorative(deco)
  }, [])

  // Load cached captions when asset selection changes
  useEffect(() => {
    if (!selectedAsset || !project?.id) {
      setHasCachedCaptions(false)
      return
    }

    let cancelled = false
    ;(async () => {
      const data = await captions.get(project.id, selectedAsset)
      if (cancelled || !data) return

      // Only use Whisper segments — ignore legacy subtitles format
      const rawList = data.segments || []
      const list = rawList.map((seg, i) => ({
        id: `cap-${Date.now()}-${i}`,
        startTime: seg.startTime ?? seg.start ?? 0,
        endTime: seg.endTime ?? seg.end ?? 0,
        text: seg.text ?? '',
        words: seg.words || [],
      }))
      setCaptionList(list)
      setHasCachedCaptions(true)
    })()

    return () => { cancelled = true }
  }, [selectedAsset, project?.id])

  const generateCaptions = useCallback(async () => {
    if (!selectedAsset || !project?.id) return

    setIsGenerating(true)
    setProgress({ stage: 'starting', percent: 5, message: 'Starting...' })
    setCaptionList([])

    try {
      await captions.generate(project.id, selectedAsset, (event) => {
        if (event.type === 'progress') {
          // Captions use Whisper only — never show Gemini-related messages
          const rawMessage = event.message || ''
          const message = rawMessage.toLowerCase().includes('gemini')
            ? 'Transcribing with Whisper...'
            : rawMessage
          setProgress({
            stage: event.stage,
            percent: event.percent,
            message,
          })
        } else if (event.type === 'complete') {
          const data = event.data
          // Only use Whisper segments — ignore legacy subtitles format
          const rawList = data.segments || []
          const list = rawList.map((seg, i) => ({
            id: `cap-${Date.now()}-${i}`,
            startTime: seg.startTime ?? seg.start ?? 0,
            endTime: seg.endTime ?? seg.end ?? 0,
            text: seg.text ?? '',
            words: seg.words || [],
          }))
          setCaptionList(list)
          setHasCachedCaptions(true)
          setProgress({ stage: 'complete', percent: 100, message: 'Done!' })
          toast.success(`Generated ${list.length} captions`)
        } else if (event.type === 'error') {
          toast.error(`Caption generation failed: ${event.message}`)
          setProgress({ stage: 'error', percent: 0, message: event.message })
        }
      })
    } catch (error) {
      console.error('Caption generation failed:', error)
      toast.error(`Caption generation failed: ${error.message}`)
      setProgress({ stage: 'error', percent: 0, message: error.message })
    } finally {
      setIsGenerating(false)
    }
  }, [selectedAsset, project?.id])

  const updateCaption = useCallback((id, field, value) => {
    setCaptionList((prev) =>
      prev.map((cap) => (cap.id === id ? { ...cap, [field]: value } : cap))
    )
  }, [])

  const addToTimeline = useCallback(() => {
    if (splitCaptionList.length === 0) return

    const newTracks = captionsToTracks(splitCaptionList, {
      fps,
      sourceOffset: 0,
      timelineOffset: 0,
      style: captionStyle,
    })

    if (onTracksChange) {
      onTracksChange((prev) => [...prev, ...newTracks])
    }

    const clipCount = newTracks.reduce((sum, t) => sum + t.clips.length, 0)
    toast.success(`Added 1 track with ${clipCount} caption clips`)
  }, [splitCaptionList, fps, captionStyle, onTracksChange])

  const stageLabels = {
    starting: 'Starting...',
    extracting: 'Extracting audio',
    transcribing: 'Transcribing',
    complete: 'Complete',
    error: 'Error',
  }

  return (
    <div className="flex flex-col h-full min-w-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b shrink-0">
        <Mic className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium text-sm">Captions</span>
      </div>

      <ScrollArea className="flex-1 min-w-0">
        <div className="p-3 space-y-3 min-w-0 overflow-hidden">
          {/* Video Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs">Source Video</Label>
            <Select value={selectedAsset} onValueChange={setSelectedAsset}>
              <SelectTrigger className="h-8 text-xs min-w-0 w-full">
                <SelectValue placeholder="Select a video..." />
              </SelectTrigger>
              <SelectContent>
                {videoAssets.length === 0 ? (
                  <SelectItem value="_none" disabled>
                    No videos uploaded
                  </SelectItem>
                ) : (
                  videoAssets.map((asset) => (
                    <SelectItem key={asset.name} value={asset.name}>
                      {asset.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Generate Button */}
          <Button
            size="sm"
            variant={hasCachedCaptions ? 'outline' : 'default'}
            className="w-full h-8 text-xs"
            disabled={!selectedAsset || isGenerating}
            onClick={generateCaptions}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                {stageLabels[progress.stage] || 'Processing...'}
              </>
            ) : (
              <>
                <Mic className="h-3 w-3 mr-1.5" />
                {hasCachedCaptions ? 'Regenerate Captions' : 'Generate Captions'}
              </>
            )}
          </Button>

          {/* Progress Bar */}
          {isGenerating && (
            <div className="space-y-1">
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                {progress.message}
              </p>
            </div>
          )}

          {/* Cache indicator */}
          {hasCachedCaptions && !isGenerating && captionList.length > 0 && (
            <p className="text-[10px] text-muted-foreground text-center">
              Loaded from cache
            </p>
          )}

          {/* Max character per caption shown */}
          {captionList.length > 0 && (
            <div className="space-y-2 p-2.5 rounded-md border bg-muted/30 min-w-0">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px]">Max character per caption shown</Label>
                  <span className="text-[10px] text-muted-foreground tabular-nums">{maxChars} chars</span>
                </div>
                <Slider
                  value={[maxChars]}
                  onValueChange={([v]) => setMaxChars(v)}
                  min={10}
                  max={100}
                  step={5}
                />
              </div>
              {splitCaptionList.length > captionList.length && (
                <p className="text-[10px] text-primary">
                  {captionList.length} captions split into {splitCaptionList.length} segments
                </p>
              )}
            </div>
          )}

          {/* Caption List */}
          {captionList.length > 0 && (
            <>
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs text-muted-foreground truncate min-w-0">
                  {splitCaptionList.length} segment{splitCaptionList.length !== 1 ? 's' : ''}
                  {splitCaptionList.length > captionList.length && (
                    <> (from {captionList.length} caption{captionList.length !== 1 ? 's' : ''})</>
                  )}
                </span>
              </div>

              {splitCaptionList.map((caption, i) => {
                const isDerivedSegment = Boolean(caption._isDerived)
                const sourceCount = caption._sourceIds?.length || (caption._sourceId ? 1 : 0)
                const derivedLabel = sourceCount > 1 ? 'merged' : 'split'
                const sourceCaptionId = caption._sourceId || caption.id
                return (
                  <div
                    key={caption.id}
                    className="rounded border bg-muted/20 min-w-0 overflow-hidden"
                  >
                    <div className="p-2 space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground min-w-0">
                        <span className="shrink-0">#{i + 1}</span>
                        {isDerivedSegment ? (
                          <>
                            <span className="tabular-nums">
                              {caption.startTime.toFixed(1)}s - {caption.endTime.toFixed(1)}s
                            </span>
                            <span className="text-[9px] text-primary">{derivedLabel}</span>
                          </>
                        ) : (
                          <>
                            <Input
                              type="number"
                              value={caption.startTime}
                              onChange={(e) => updateCaption(sourceCaptionId, 'startTime', parseFloat(e.target.value) || 0)}
                              className="h-5 w-14 text-[10px] px-1 tabular-nums"
                              step={0.1}
                              min={0}
                            />
                            <span>-</span>
                            <Input
                              type="number"
                              value={caption.endTime}
                              onChange={(e) => updateCaption(sourceCaptionId, 'endTime', parseFloat(e.target.value) || 0)}
                              className="h-5 w-14 text-[10px] px-1 tabular-nums"
                              step={0.1}
                              min={0}
                            />
                            <span className="text-[9px]">s</span>
                          </>
                        )}
                      </div>
                      {isDerivedSegment ? (
                        <p
                          className="w-full text-xs text-foreground border border-border/50 rounded px-1.5 py-1 bg-muted/30 break-words"
                        >
                          {caption.text}
                        </p>
                      ) : (
                        <textarea
                          value={caption.text}
                          onChange={(e) => updateCaption(sourceCaptionId, 'text', e.target.value)}
                          className="w-full text-xs text-foreground bg-transparent border border-border rounded px-1.5 py-1 resize-none focus:outline-none focus:ring-1 focus:ring-ring min-w-0"
                          rows={Math.max(1, Math.ceil(caption.text.length / 50))}
                        />
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Timeline Actions */}
              <div className="space-y-3 pt-2 border-t min-w-0">
                <Label className="text-xs font-semibold">Add to Timeline</Label>

                {/* Text Effect Template */}
                <div className="space-y-1.5 min-w-0">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Text Effect
                  </span>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 min-w-0">
                    <button
                      className={`shrink-0 flex flex-col items-center rounded border px-2 py-1.5 text-[9px] cursor-pointer transition-colors ${
                        selectedTemplate === null
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => applyTemplate(null)}
                    >
                      <span className="h-6 flex items-center text-[10px] text-foreground">Aa</span>
                      <span className="text-muted-foreground">Default</span>
                    </button>
                    {TEMPLATES.map((tmpl) => (
                      <button
                        key={tmpl.id}
                        className={`shrink-0 flex flex-col items-center rounded border px-2 py-1.5 text-[9px] cursor-pointer transition-colors ${
                          selectedTemplate === tmpl.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => applyTemplate(tmpl)}
                        title={tmpl.name}
                      >
                        <span
                          className="h-6 flex items-center truncate max-w-[50px]"
                          style={{
                            fontFamily: tmpl.textStyles.fontFamily,
                            fontWeight: tmpl.textStyles.fontWeight,
                            fontSize: `${Math.min(tmpl.textStyles.fontSize * 0.15, 11)}px`,
                            color: tmpl.textStyles.color,
                            WebkitTextStroke: tmpl.textStyles.strokeWidth
                              ? `${Math.max(1, tmpl.textStyles.strokeWidth * 0.2)}px ${tmpl.textStyles.strokeColor || '#000'}`
                              : undefined,
                          }}
                        >
                          {tmpl.previewText.slice(0, 4)}
                        </span>
                        <span className="text-muted-foreground truncate max-w-[50px]">{tmpl.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Position */}
                <div className="space-y-2 min-w-0">
                  <div className="flex items-center justify-between min-w-0">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      Position
                    </span>
                    <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                      {positionY} px
                    </span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[9px] text-muted-foreground shrink-0">Up</span>
                    <Slider
                      value={[positionY]}
                      onValueChange={([v]) => setPositionY(v)}
                      min={0}
                      max={1920}
                      step={10}
                      className="flex-1"
                    />
                    <span className="text-[9px] text-muted-foreground shrink-0">Down</span>
                  </div>
                </div>

                {/* Font */}
                <div className="space-y-1.5 min-w-0">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Font
                  </span>
                  <div className="space-y-1 min-w-0">
                    <Select value={fontFamily} onValueChange={setFontFamily}>
                      <SelectTrigger className="h-7 text-xs min-w-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_FAMILIES.map((family) => (
                          <SelectItem key={family} value={family}>
                            <span style={{ fontFamily: family }}>{family}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="grid grid-cols-2 gap-1.5 min-w-0">
                      <div className="space-y-0.5 min-w-0">
                        <Label className="text-[10px]">Size</Label>
                        <Input
                          type="number"
                          value={fontSize}
                          onChange={(e) => setFontSize(parseInt(e.target.value) || 12)}
                          className="h-6 text-xs min-w-0"
                          min={8}
                          max={200}
                        />
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <Label className="text-[10px]">Weight</Label>
                        <Select value={String(fontWeight)} onValueChange={(v) => setFontWeight(parseInt(v))}>
                          <SelectTrigger className="h-6 text-[10px] min-w-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {WEIGHT_OPTIONS.map((w) => (
                              <SelectItem key={w.value} value={String(w.value)}>{w.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Alignment */}
                <div className="space-y-1.5 min-w-0">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Alignment
                  </span>
                  <div className="flex gap-1 min-w-0">
                    {[
                      { value: 'left', icon: AlignLeft },
                      { value: 'center', icon: AlignCenter },
                      { value: 'right', icon: AlignRight },
                    ].map(({ value, icon: Icon }) => (
                      <Button
                        key={value}
                        size="sm"
                        variant={textAlign === value ? 'default' : 'outline'}
                        className="h-7 flex-1"
                        onClick={() => setTextAlign(value)}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Colors & Effects */}
                <div className="space-y-2 min-w-0">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Colors & Effects
                  </span>

                  <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1.5 items-center min-w-0">
                    <Label className="text-[10px]">Color</Label>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-6 h-6 rounded border border-border cursor-pointer bg-transparent shrink-0"
                      />
                      <Input
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="h-6 text-[10px] font-mono min-w-0 flex-1"
                      />
                    </div>

                    <Label className="text-[10px]">BG</Label>
                    <Input
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="h-6 text-[10px] font-mono min-w-0"
                      placeholder="rgba(0,0,0,0.6)"
                    />
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center justify-between min-w-0">
                      <Label className="text-[10px]">Stroke</Label>
                      <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">{strokeWidth} px</span>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Slider
                        value={[strokeWidth]}
                        onValueChange={([v]) => setStrokeWidth(v)}
                        min={0}
                        max={10}
                        step={1}
                        className="flex-1"
                      />
                      <input
                        type="color"
                        value={strokeColor}
                        onChange={(e) => setStrokeColor(e.target.value)}
                        className="w-6 h-6 rounded border border-border cursor-pointer bg-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Add Button */}
                <Button
                  size="sm"
                  className="w-full h-8 text-xs"
                  onClick={addToTimeline}
                >
                  Add to Timeline
                </Button>
              </div>
            </>
          )}

          {/* Empty state (no captions yet, not generating) */}
          {captionList.length === 0 && !isGenerating && (
            <Card>
              <CardContent className="p-6 text-center">
                <Mic className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium">No captions</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Select a video and generate captions
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
