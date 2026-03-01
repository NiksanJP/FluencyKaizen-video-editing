import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Video, Plus } from 'lucide-react'
import { useProject } from '@/contexts/ProjectContext'
import { formatFileSize } from '@/utils/formatUtils'

export default function VideosPanel({ onAddToTimeline }) {
  const { assets, getAssetUrl } = useProject()

  const videos = useMemo(
    () => assets.filter((a) => /\.(mp4|mov|webm|avi)$/i.test(a.name)),
    [assets]
  )

  if (!videos.length) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Video className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium">No videos</p>
            <p className="text-xs text-muted-foreground mt-1">
              Upload video files from the Uploads tab
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-full">
      <ScrollArea className="h-full">
        <div className="p-3 space-y-3">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Videos</span>
            <Badge variant="secondary" className="ml-auto text-xs">{videos.length}</Badge>
          </div>
          <div className="space-y-2">
            {videos.map((video) => (
              <div
                key={video.name}
                className="flex items-center gap-3 p-2 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => onAddToTimeline?.(video)}
              >
                <div className="w-16 h-10 bg-muted rounded flex items-center justify-center flex-shrink-0">
                  <Video className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{video.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(video.size)}</p>
                </div>
                <Button size="sm" variant="ghost" className="h-7">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
