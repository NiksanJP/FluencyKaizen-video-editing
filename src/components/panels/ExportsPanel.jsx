import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Download, Film, CheckCircle, XCircle } from 'lucide-react'
import { useProject } from '@/contexts/ProjectContext'
import { exportVideo } from '@/lib/api'

export default function ExportsPanel({ tracks = [], totalFrames }) {
  const { project } = useProject()
  const [state, setState] = useState('idle') // idle | exporting | complete | error
  const [progress, setProgress] = useState({ percent: 0, message: '' })
  const [outputPath, setOutputPath] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)
  const exportingRef = useRef(false)

  const width = project?.composition?.width || 1080
  const height = project?.composition?.height || 1920
  const fps = project?.composition?.fps || 30
  const frames = totalFrames || project?.composition?.durationInFrames || 900

  const handleExport = async () => {
    if (exportingRef.current) return
    exportingRef.current = true
    setState('exporting')
    setProgress({ percent: 0, message: 'Starting export...' })
    setOutputPath(null)
    setErrorMessage(null)

    try {
      const result = await exportVideo.render(
        { tracks, width, height, fps, durationInFrames: frames },
        (event) => {
          setProgress({ percent: event.percent || 0, message: event.message || '' })
        }
      )

      if (result?.canceled) {
        setState('idle')
      } else if (result?.success) {
        setState('complete')
        setOutputPath(result.outputPath)
      }
    } catch (err) {
      setState('error')
      setErrorMessage(err?.message || 'Export failed')
    } finally {
      exportingRef.current = false
    }
  }

  const handleReset = () => {
    setState('idle')
    setProgress({ percent: 0, message: '' })
    setOutputPath(null)
    setErrorMessage(null)
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
                <p>Resolution: {width} x {height}</p>
                <p>FPS: {fps}</p>
                <p>Frames: {frames}</p>
                <p>Format: MP4</p>
              </div>

              {state === 'idle' && (
                <Button className="w-full" onClick={handleExport}>
                  <Film className="h-4 w-4 mr-2" />
                  Export MP4
                </Button>
              )}

              {state === 'exporting' && (
                <div className="space-y-2">
                  <Progress value={progress.percent} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">
                    {progress.message}
                  </p>
                </div>
              )}

              {state === 'complete' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-500">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Export complete</span>
                  </div>
                  {outputPath && (
                    <p className="text-xs text-muted-foreground break-all">
                      {outputPath.split('/').pop()}
                    </p>
                  )}
                  <Button variant="outline" size="sm" className="w-full" onClick={handleReset}>
                    Export Another
                  </Button>
                </div>
              )}

              {state === 'error' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-red-500">
                    <XCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Export failed</span>
                  </div>
                  {errorMessage && (
                    <p className="text-xs text-muted-foreground break-all">
                      {errorMessage}
                    </p>
                  )}
                  <Button variant="outline" size="sm" className="w-full" onClick={handleReset}>
                    Try Again
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  )
}
