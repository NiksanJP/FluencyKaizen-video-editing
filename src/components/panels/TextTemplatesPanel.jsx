import { useState, useCallback } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Type } from 'lucide-react'
import { toast } from 'sonner'

const TEMPLATES = [
  {
    id: 'bold-title',
    name: 'Bold Title',
    category: 'Titles',
    previewText: 'Bold Title',
    textContent: 'Bold Title',
    position: { x: 0, y: 200 },
    duration: 5,
    textStyles: {
      fontFamily: 'Montserrat',
      fontWeight: '700',
      fontSize: 72,
      color: '#ffffff',
      textAlign: 'center',
      width: 960,
    },
  },
  {
    id: 'subtitle',
    name: 'Subtitle',
    category: 'Captions',
    previewText: 'Subtitle text here',
    textContent: 'Subtitle text here',
    position: { x: 0, y: 1600 },
    duration: 5,
    textStyles: {
      fontFamily: 'Inter',
      fontWeight: '400',
      fontSize: 36,
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.6)',
      textAlign: 'center',
      width: 960,
      paddingX: 16,
      paddingY: 8,
    },
  },
  {
    id: 'lower-third',
    name: 'Lower Third',
    category: 'Captions',
    previewText: 'Lower Third',
    textContent: 'Lower Third',
    position: { x: 60, y: 1500 },
    duration: 5,
    textStyles: {
      fontFamily: 'Poppins',
      fontWeight: '600',
      fontSize: 44,
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.75)',
      textAlign: 'left',
      width: 600,
      paddingX: 20,
      paddingY: 12,
      borderRadius: 12,
    },
  },
  {
    id: 'hook-title',
    name: 'Hook Title',
    category: 'Titles',
    previewText: 'HOOK TITLE',
    textContent: 'HOOK TITLE',
    position: { x: 0, y: 100 },
    duration: 5,
    textStyles: {
      fontFamily: 'Inter',
      fontWeight: '700',
      fontSize: 86,
      color: '#ffffff',
      textAlign: 'center',
      width: 960,
      strokeWidth: 3,
      strokeColor: '#000000',
    },
  },
  {
    id: 'callout-box',
    name: 'Callout Box',
    category: 'Callouts',
    previewText: 'Callout!',
    textContent: 'Callout!',
    position: { x: 0, y: 860 },
    duration: 5,
    textStyles: {
      fontFamily: 'Inter',
      fontWeight: '700',
      fontSize: 48,
      color: '#1a1a1a',
      backgroundColor: '#f5c542',
      textAlign: 'center',
      width: 700,
      paddingX: 24,
      paddingY: 16,
      borderRadius: 16,
    },
  },
  {
    id: 'minimal-caption',
    name: 'Minimal Caption',
    category: 'Captions',
    previewText: 'minimal caption',
    textContent: 'minimal caption',
    position: { x: 0, y: 1650 },
    duration: 5,
    textStyles: {
      fontFamily: 'Lato',
      fontWeight: '400',
      fontSize: 32,
      color: '#d4d4d4',
      textAlign: 'center',
      width: 960,
    },
  },
  {
    id: 'accent-heading',
    name: 'Accent Heading',
    category: 'Titles',
    previewText: 'ACCENT',
    textContent: 'ACCENT',
    position: { x: 0, y: 400 },
    duration: 5,
    textStyles: {
      fontFamily: 'Oswald',
      fontWeight: '700',
      fontSize: 64,
      color: '#f5c542',
      textAlign: 'center',
      width: 960,
    },
  },
  {
    id: 'elegant-quote',
    name: 'Elegant Quote',
    category: 'Callouts',
    previewText: '"Elegant Quote"',
    textContent: '"Elegant Quote"',
    position: { x: 0, y: 800 },
    duration: 5,
    textStyles: {
      fontFamily: 'Playfair Display',
      fontWeight: '400',
      fontSize: 44,
      color: '#ffffff',
      backgroundColor: 'rgba(30,30,30,0.85)',
      textAlign: 'center',
      width: 800,
      paddingX: 28,
      paddingY: 20,
      borderRadius: 12,
    },
  },
  {
    id: 'code-snippet',
    name: 'Code Snippet',
    category: 'Callouts',
    previewText: 'console.log()',
    textContent: 'console.log()',
    position: { x: 0, y: 860 },
    duration: 5,
    textStyles: {
      fontFamily: 'Roboto Mono',
      fontWeight: '500',
      fontSize: 36,
      color: '#4ade80',
      backgroundColor: 'rgba(20,20,30,0.9)',
      textAlign: 'center',
      width: 700,
      paddingX: 24,
      paddingY: 16,
      borderRadius: 10,
    },
  },
  {
    id: 'japanese-title',
    name: 'Japanese Title',
    category: 'Titles',
    previewText: 'タイトル',
    textContent: 'タイトル',
    position: { x: 0, y: 300 },
    duration: 5,
    textStyles: {
      fontFamily: 'Noto Sans JP',
      fontWeight: '700',
      fontSize: 64,
      color: '#ffffff',
      textAlign: 'center',
      width: 960,
    },
  },
]

const CATEGORIES = ['All', 'Titles', 'Captions', 'Callouts']

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
