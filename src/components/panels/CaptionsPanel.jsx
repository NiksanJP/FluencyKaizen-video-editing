import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MessageSquare, Plus, Trash2, Loader2, Languages } from 'lucide-react'
import { useProject } from '@/contexts/ProjectContext'
import { captionsToTracks } from '@/utils/captionUtils'
import { toast } from 'sonner'
import { captions } from '@/lib/api'

const VIDEO_EXTENSIONS = /\.(mp4|mov|webm|avi|mkv)$/i

export default function CaptionsPanel({ tracks, onTracksChange, fps = 30 }) {
  const { project, assets } = useProject()
  const [selectedAsset, setSelectedAsset] = useState('')
  const [captionList, setCaptionList] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState({ stage: '', percent: 0, message: '' })
  const [addMode, setAddMode] = useState('both')
  const [hasCachedCaptions, setHasCachedCaptions] = useState(false)

  const videoAssets = (assets || []).filter((a) => VIDEO_EXTENSIONS.test(a.name))

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
      const list = (data.subtitles || []).map((sub, i) => ({
        id: `cap-${Date.now()}-${i}`,
        startTime: sub.startTime,
        endTime: sub.endTime,
        en: sub.en,
        ja: sub.ja,
        highlights: sub.highlights || [],
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
          setProgress({
            stage: event.stage,
            percent: event.percent,
            message: event.message,
          })
        } else if (event.type === 'complete') {
          const data = event.data
          const list = (data.subtitles || []).map((sub, i) => ({
            id: `cap-${Date.now()}-${i}`,
            startTime: sub.startTime,
            endTime: sub.endTime,
            en: sub.en,
            ja: sub.ja,
            highlights: sub.highlights || [],
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

  const updateCaption = (id, field, value) => {
    setCaptionList((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    )
  }

  const deleteCaption = (id) => {
    setCaptionList((prev) => prev.filter((c) => c.id !== id))
  }

  const addCaption = () => {
    const lastEnd = captionList.length > 0
      ? captionList[captionList.length - 1].endTime
      : 0
    setCaptionList((prev) => [
      ...prev,
      {
        id: `cap-${Date.now()}`,
        startTime: lastEnd,
        endTime: lastEnd + 3,
        en: '',
        ja: '',
        highlights: [],
      },
    ])
  }

  const addToTimeline = useCallback(() => {
    if (captionList.length === 0) return

    const newTracks = captionsToTracks(captionList, {
      fps,
      sourceOffset: 0,
      timelineOffset: 0,
      mode: addMode,
    })

    if (onTracksChange) {
      onTracksChange((prev) => [...prev, ...newTracks])
    }

    const trackCount = newTracks.length
    const clipCount = newTracks.reduce((sum, t) => sum + t.clips.length, 0)
    toast.success(`Added ${trackCount} track${trackCount > 1 ? 's' : ''} with ${clipCount} caption clips`)
  }, [captionList, fps, addMode, onTracksChange])

  const stageLabels = {
    starting: 'Starting...',
    extracting: 'Extracting audio',
    transcribing: 'Transcribing',
    analyzing: 'Analyzing with AI',
    complete: 'Complete',
    error: 'Error',
  }

  return (
    <div className="h-full">
      <ScrollArea className="h-full">
        <div className="p-3 space-y-3">
          {/* Header */}
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Captions</span>
          </div>

          {/* Video Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs">Source Video</Label>
            <Select value={selectedAsset} onValueChange={setSelectedAsset}>
              <SelectTrigger className="h-8 text-xs">
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
                <Languages className="h-3 w-3 mr-1.5" />
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

          {/* Caption List */}
          {captionList.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {captionList.length} caption{captionList.length !== 1 ? 's' : ''}
                </span>
                <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={addCaption}>
                  <Plus className="h-2.5 w-2.5 mr-0.5" /> Add
                </Button>
              </div>

              {captionList.map((caption, i) => (
                <Card key={caption.id}>
                  <CardHeader className="p-2.5 pb-1.5">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-[10px] text-muted-foreground">
                        #{i + 1}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => deleteCaption(caption.id)}
                      >
                        <Trash2 className="h-2.5 w-2.5 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-2.5 pt-0 space-y-1.5">
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="space-y-0.5">
                        <Label className="text-[10px]">Start (s)</Label>
                        <Input
                          type="number"
                          value={caption.startTime}
                          onChange={(e) =>
                            updateCaption(caption.id, 'startTime', parseFloat(e.target.value) || 0)
                          }
                          className="h-6 text-xs"
                          step="0.1"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <Label className="text-[10px]">End (s)</Label>
                        <Input
                          type="number"
                          value={caption.endTime}
                          onChange={(e) =>
                            updateCaption(caption.id, 'endTime', parseFloat(e.target.value) || 0)
                          }
                          className="h-6 text-xs"
                          step="0.1"
                        />
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-[10px]">English</Label>
                      <Input
                        value={caption.en}
                        onChange={(e) => updateCaption(caption.id, 'en', e.target.value)}
                        className="h-6 text-xs"
                        placeholder="English text..."
                      />
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-[10px]">Japanese</Label>
                      <Input
                        value={caption.ja}
                        onChange={(e) => updateCaption(caption.id, 'ja', e.target.value)}
                        className="h-6 text-xs"
                        placeholder="Japanese text..."
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Timeline Actions */}
              <div className="space-y-1.5 pt-1 border-t">
                <Label className="text-xs">Add to Timeline</Label>
                <Select value={addMode} onValueChange={setAddMode}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Both EN + JA</SelectItem>
                    <SelectItem value="en">English Only</SelectItem>
                    <SelectItem value="ja">Japanese Only</SelectItem>
                  </SelectContent>
                </Select>
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
                <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium">No captions</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Select a video and generate bilingual captions
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
