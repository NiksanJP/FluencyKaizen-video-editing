import { useState, useRef, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, Video, Image, Music, Trash2, Loader2, Search, Plus } from 'lucide-react'
import { useProject } from '@/contexts/ProjectContext'
import { formatFileSize } from '@/utils/formatUtils'
import { sortUploads } from '@/utils/uploadSorting'

export default function UploadsPanel({ onAddToTimeline }) {
  const { assets, uploadAsset, deleteAsset, getAssetUrl, refreshAssets } = useProject()
  const [isUploading, setIsUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const fileInputRef = useRef(null)

  const handleFileSelect = useCallback(async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    e.target.value = ''

    setIsUploading(true)
    for (const file of files) {
      try {
        await uploadAsset(file)
        toast.success(`${file.name} uploaded`)
      } catch (err) {
        toast.error(`Failed to upload ${file.name}`)
      }
    }
    setIsUploading(false)
  }, [uploadAsset])

  const handleDelete = useCallback(async (filename) => {
    if (!window.confirm(`Delete ${filename}?`)) return
    try {
      await deleteAsset(filename)
      toast.success(`${filename} deleted`)
    } catch {
      toast.error('Failed to delete')
    }
  }, [deleteAsset])

  const filteredAssets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return assets
    return assets.filter((a) => a.name.toLowerCase().includes(q))
  }, [assets, searchQuery])

  const videos = filteredAssets.filter((a) => /\.(mp4|mov|webm|avi)$/i.test(a.name))
  const images = filteredAssets.filter((a) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(a.name))
  const audios = filteredAssets.filter((a) => /\.(mp3|wav|ogg|m4a|aac)$/i.test(a.name))

  const getTypeIcon = (name) => {
    if (/\.(mp4|mov|webm|avi)$/i.test(name)) return Video
    if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(name)) return Image
    if (/\.(mp3|wav|ogg|m4a|aac)$/i.test(name)) return Music
    return Upload
  }

  const renderSection = (title, items, Icon) => {
    if (!items.length) return null
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">{title}</span>
          <Badge variant="secondary" className="ml-auto text-xs">{items.length}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {items.map((asset) => (
            <div
              key={asset.name}
              className="border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
              onClick={() => onAddToTimeline?.(asset)}
            >
              <div className="w-full h-24 bg-muted rounded-t-lg flex items-center justify-center overflow-hidden">
                {/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(asset.name) ? (
                  <img
                    src={getAssetUrl(asset.name)}
                    alt={asset.name}
                    className="w-full h-full object-cover"
                  />
                ) : /\.(mp4|mov|webm|avi)$/i.test(asset.name) ? (
                  <video
                    src={getAssetUrl(asset.name)}
                    preload="metadata"
                    muted
                    className="w-full h-full object-cover pointer-events-none"
                  />
                ) : (
                  (() => { const TypeIcon = getTypeIcon(asset.name); return <TypeIcon className="w-6 h-6 text-muted-foreground" /> })()
                )}
              </div>
              <div className="p-2 flex items-start justify-between gap-1">
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{asset.name}</p>
                  <p className="text-[10px] text-muted-foreground">{formatFileSize(asset.size)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-0 group-hover:opacity-100 flex-shrink-0"
                  onClick={(e) => { e.stopPropagation(); handleDelete(asset.name) }}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full">
      <ScrollArea className="h-full">
        <div className="p-3 space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files..."
                className="pl-8 h-8 text-xs"
              />
            </div>
            <Button
              size="sm"
              className="h-8"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5 mr-1" />}
              {isUploading ? '...' : 'Upload'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="video/*,image/*,audio/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {renderSection('Videos', videos, Video)}
          {renderSection('Images', images, Image)}
          {renderSection('Audio', audios, Music)}

          {filteredAssets.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium">No files yet</p>
                <p className="text-xs text-muted-foreground mt-1">Upload videos, images, or audio to get started</p>
                <Button size="sm" className="mt-3" onClick={() => fileInputRef.current?.click()}>
                  <Plus className="h-3 w-3 mr-1" /> Upload files
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
