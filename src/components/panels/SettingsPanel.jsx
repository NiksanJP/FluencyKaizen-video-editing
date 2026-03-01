import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Settings } from 'lucide-react'
import { useProject } from '@/contexts/ProjectContext'

export default function SettingsPanel() {
  const { project, saveProject } = useProject()
  const [settings, setSettings] = useState({
    name: '',
    width: 1080,
    height: 1920,
    fps: 30,
  })

  useEffect(() => {
    if (project) {
      setSettings({
        name: project.name || 'Untitled',
        width: project.composition?.width || 1080,
        height: project.composition?.height || 1920,
        fps: project.composition?.fps || 30,
      })
    }
  }, [project?.id])

  const orientation = settings.width > settings.height ? 'landscape' : 'portrait'

  const presets = [
    { label: 'Vertical (TikTok)', w: 1080, h: 1920 },
    { label: 'Full HD', w: 1920, h: 1080 },
    { label: 'Square', w: 1080, h: 1080 },
    { label: 'HD', w: 1280, h: 720 },
  ]

  const handleSave = async () => {
    try {
      await saveProject({
        name: settings.name,
        composition: {
          ...project.composition,
          width: settings.width,
          height: settings.height,
          fps: settings.fps,
        },
      })
      toast.success('Settings saved')
    } catch {
      toast.error('Failed to save settings')
    }
  }

  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Settings</span>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Project Name</Label>
            <Input
              value={settings.name}
              onChange={(e) => setSettings((s) => ({ ...s, name: e.target.value }))}
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Orientation</Label>
            <div className="grid grid-cols-2 gap-2">
              {['portrait', 'landscape'].map((o) => (
                <button
                  key={o}
                  onClick={() =>
                    setSettings((s) => ({
                      ...s,
                      width: o === 'portrait' ? 1080 : 1920,
                      height: o === 'portrait' ? 1920 : 1080,
                    }))
                  }
                  className={`p-2 rounded border-2 transition-colors text-center ${
                    orientation === o
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-input hover:bg-muted/50'
                  }`}
                >
                  <div className={`mx-auto mb-1 bg-current opacity-20 rounded ${
                    o === 'portrait' ? 'w-4 h-6' : 'w-6 h-4'
                  }`} />
                  <span className="text-xs font-medium capitalize">{o}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Dimensions</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-muted-foreground">Width</span>
                <Input
                  type="number"
                  value={settings.width}
                  onChange={(e) => setSettings((s) => ({ ...s, width: parseInt(e.target.value) || 0 }))}
                  className="h-7 text-xs"
                />
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground">Height</span>
                <Input
                  type="number"
                  value={settings.height}
                  onChange={(e) => setSettings((s) => ({ ...s, height: parseInt(e.target.value) || 0 }))}
                  className="h-7 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Frame Rate</Label>
            <Select
              value={String(settings.fps)}
              onValueChange={(v) => setSettings((s) => ({ ...s, fps: parseInt(v) }))}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24">24 FPS</SelectItem>
                <SelectItem value="30">30 FPS</SelectItem>
                <SelectItem value="60">60 FPS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Presets</Label>
            <div className="space-y-1">
              {presets.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setSettings((s) => ({ ...s, width: p.w, height: p.h }))}
                  className="w-full p-2 text-left border rounded hover:bg-muted/50 text-xs"
                >
                  <span className="font-medium">{p.label}</span>
                  <span className="text-muted-foreground ml-2">{p.w} x {p.h}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>

      <div className="p-3 border-t">
        <Button className="w-full h-8 text-xs" onClick={handleSave}>
          Save Settings
        </Button>
      </div>
    </div>
  )
}
