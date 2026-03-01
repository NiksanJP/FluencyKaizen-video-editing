import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import { Download, Loader2, Film } from 'lucide-react'
import { useProject } from '@/contexts/ProjectContext'

export default function ExportsPanel() {
  const { project } = useProject()
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    // Placeholder — would trigger server-side Remotion render
    setTimeout(() => {
      setIsExporting(false)
    }, 2000)
  }

  return (
    <div className="h-full">
      <ScrollArea className="h-full">
        <div className="p-3 space-y-3">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Export</span>
          </div>

          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Resolution: {project?.composition?.width || 1080} x {project?.composition?.height || 1920}</p>
                <p>FPS: {project?.composition?.fps || 30}</p>
                <p>Format: MP4</p>
              </div>

              <Button
                className="w-full"
                onClick={handleExport}
                disabled={isExporting}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Rendering...
                  </>
                ) : (
                  <>
                    <Film className="h-4 w-4 mr-2" />
                    Export MP4
                  </>
                )}
              </Button>

              <p className="text-[10px] text-muted-foreground text-center">
                Use the Claude Code terminal to run render commands
              </p>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  )
}
