import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  MoveHorizontal,
  MoveVertical,
  RotateCw,
  Expand,
  Link,
  Unlink,
} from 'lucide-react'

export default function EditPanel({ selectedClip, onClipUpdate }) {
  const [aspectLocked, setAspectLocked] = useState(true)

  if (!selectedClip) {
    return (
      <div className="p-4 text-muted-foreground text-sm">
        Select a clip on the timeline to edit its properties.
      </div>
    )
  }

  const update = (updates) => {
    onClipUpdate(selectedClip.id, updates)
  }

  const isText = selectedClip.type === 'text'

  return (
    <div className="h-full">
      <ScrollArea className="h-full">
        <div className="p-3 space-y-5">
          <div>
            <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Selected</h3>
            <p className="text-sm font-medium truncate">{selectedClip.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{selectedClip.type}</p>
          </div>

          {/* Position */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground">Position</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1">
                  <MoveHorizontal className="h-3 w-3" /> X
                </Label>
                <Input
                  type="number"
                  value={selectedClip.x || 0}
                  onChange={(e) => update({ x: parseInt(e.target.value) || 0 })}
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1">
                  <MoveVertical className="h-3 w-3" /> Y
                </Label>
                <Input
                  type="number"
                  value={selectedClip.y || 0}
                  onChange={(e) => update({ y: parseInt(e.target.value) || 0 })}
                  className="h-7 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Dimensions */}
          {!isText && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">Dimensions</h3>
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <Expand className="h-3 w-3" /> W
                  </Label>
                  <Input
                    type="number"
                    value={selectedClip.width || 0}
                    onChange={(e) => update({ width: parseInt(e.target.value) || 0 })}
                    className="h-7 text-xs"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 flex-shrink-0"
                  onClick={() => setAspectLocked(!aspectLocked)}
                >
                  {aspectLocked ? <Link className="h-3 w-3" /> : <Unlink className="h-3 w-3" />}
                </Button>
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">H</Label>
                  <Input
                    type="number"
                    value={selectedClip.height || 0}
                    onChange={(e) => update({ height: parseInt(e.target.value) || 0 })}
                    className="h-7 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Rotation */}
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <RotateCw className="h-3 w-3 text-muted-foreground" />
              <Label className="text-xs">Rotation</Label>
              <span className="text-xs text-muted-foreground ml-auto">{selectedClip.rotation || 0}°</span>
            </div>
            <Slider
              value={[selectedClip.rotation || 0]}
              onValueChange={([v]) => update({ rotation: v })}
              min={0}
              max={360}
              step={1}
            />
          </div>

          {/* Opacity */}
          <div className="space-y-2">
            <div className="flex items-center">
              <Label className="text-xs">Opacity</Label>
              <span className="text-xs text-muted-foreground ml-auto">{selectedClip.opacity ?? 100}%</span>
            </div>
            <Slider
              value={[selectedClip.opacity ?? 100]}
              onValueChange={([v]) => update({ opacity: v })}
              min={0}
              max={100}
              step={1}
            />
          </div>

          {/* Playback rate for video */}
          {selectedClip.type === 'video' && (
            <div className="space-y-2">
              <div className="flex items-center">
                <Label className="text-xs">Speed</Label>
                <span className="text-xs text-muted-foreground ml-auto">{(selectedClip.playbackRate || 1).toFixed(1)}x</span>
              </div>
              <Slider
                value={[selectedClip.playbackRate || 1]}
                onValueChange={([v]) => update({ playbackRate: v })}
                min={0.25}
                max={4}
                step={0.25}
              />
            </div>
          )}

          {/* Volume for video/audio */}
          {(selectedClip.type === 'video' || selectedClip.type === 'audio') && (
            <div className="space-y-2">
              <div className="flex items-center">
                <Label className="text-xs">Volume</Label>
                <span className="text-xs text-muted-foreground ml-auto">{Math.round((selectedClip.volume ?? 1) * 100)}%</span>
              </div>
              <Slider
                value={[(selectedClip.volume ?? 1) * 100]}
                onValueChange={([v]) => update({ volume: v / 100 })}
                min={0}
                max={100}
                step={1}
              />
            </div>
          )}

          {/* Text content for text clips */}
          {isText && (
            <div className="space-y-2">
              <Label className="text-xs">Text Content</Label>
              <Input
                value={selectedClip.text || ''}
                onChange={(e) => update({ text: e.target.value })}
                className="h-7 text-xs"
              />
            </div>
          )}

          {/* Alignment */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Alignment</Label>
            <div className="grid grid-cols-6 gap-1">
              {[
                { icon: AlignHorizontalJustifyStart, title: 'Left' },
                { icon: AlignHorizontalJustifyCenter, title: 'Center H' },
                { icon: AlignHorizontalJustifyEnd, title: 'Right' },
                { icon: AlignVerticalJustifyStart, title: 'Top' },
                { icon: AlignVerticalJustifyCenter, title: 'Center V' },
                { icon: AlignVerticalJustifyEnd, title: 'Bottom' },
              ].map(({ icon: Icon, title }) => (
                <Button key={title} variant="outline" size="icon" className="h-7 w-full" title={title}>
                  <Icon className="h-3 w-3" />
                </Button>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
