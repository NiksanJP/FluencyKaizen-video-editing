import { useState, useCallback } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Type } from 'lucide-react'
import { toast } from 'sonner'
import { TEMPLATES, TEMPLATE_CATEGORIES } from '@/data/textTemplates'

const CATEGORIES = TEMPLATE_CATEGORIES

export default function TextTemplatesPanel({ onTracksChange, fps = 30 }) {
  const [activeCategory, setActiveCategory] = useState('All')

  const filtered = activeCategory === 'All'
    ? TEMPLATES
    : TEMPLATES.filter((t) => t.category === activeCategory)

  const handleAddTemplate = useCallback((template) => {
    const timestamp = Date.now()
    const clip = {
      id: `text-${timestamp}`,
      type: 'text',
      name: template.name,
      textContent: template.textContent,
      start: 0,
      duration: template.duration,
      startFrame: 0,
      durationFrames: Math.round(template.duration * fps),
      sourceStart: 0,
      x: template.position.x,
      y: template.position.y,
      scale: 100,
      rotation: 0,
      opacity: 100,
      textStyles: { ...template.textStyles },
    }

    const track = {
      id: `track-text-${timestamp}`,
      type: 'text',
      name: template.name,
      clips: [clip],
      visible: true,
    }

    onTracksChange((prev) => [...prev, track])
    toast.success(`Added "${template.name}" to timeline`)
  }, [onTracksChange, fps])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <Type className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium text-sm">Text</span>
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 px-4 py-2 border-b flex-wrap">
        {CATEGORIES.map((cat) => (
          <Badge
            key={cat}
            variant={activeCategory === cat ? 'default' : 'secondary'}
            className="cursor-pointer text-xs"
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </Badge>
        ))}
      </div>

      {/* Template grid */}
      <ScrollArea className="flex-1">
        <div className="grid grid-cols-2 gap-3 p-4">
          {filtered.map((template) => (
            <button
              key={template.id}
              className="group flex flex-col rounded-lg border bg-card text-left transition-colors hover:border-primary hover:bg-accent cursor-pointer overflow-hidden"
              onClick={() => handleAddTemplate(template)}
            >
              {/* Preview */}
              <div className="flex items-center justify-center h-24 bg-black/80 px-3">
                <span
                  className="truncate text-center w-full"
                  style={{
                    fontFamily: template.textStyles.fontFamily,
                    fontWeight: template.textStyles.fontWeight,
                    fontSize: `${Math.min(template.textStyles.fontSize * 0.25, 22)}px`,
                    color: template.textStyles.color,
                    backgroundColor: template.textStyles.backgroundColor || 'transparent',
                    borderRadius: template.textStyles.borderRadius ? `${template.textStyles.borderRadius * 0.25}px` : undefined,
                    padding: template.textStyles.backgroundColor ? '4px 8px' : undefined,
                    WebkitTextStroke: template.textStyles.strokeWidth
                      ? `${template.textStyles.strokeWidth * 0.3}px ${template.textStyles.strokeColor || '#000'}`
                      : undefined,
                  }}
                >
                  {template.previewText}
                </span>
              </div>

              {/* Info */}
              <div className="px-3 py-2">
                <div className="text-xs font-medium truncate">{template.name}</div>
                <div className="text-[10px] text-muted-foreground">{template.category}</div>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
