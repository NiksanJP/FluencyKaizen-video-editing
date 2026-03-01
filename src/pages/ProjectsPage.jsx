import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FolderOpen, FolderPlus, Loader2, Trash2 } from 'lucide-react'
import { projects } from '@/lib/api'

const formatDate = (value) => {
  if (!value) return 'Unknown'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export default function ProjectsPage() {
  const navigate = useNavigate()
  const [projectList, setProjectList] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const loadProjects = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await projects.list()
      setProjectList(data)
    } catch (err) {
      console.error('Failed to load projects:', err)
      toast.error('Failed to load projects')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const createProject = async () => {
    const trimmedName = newProjectName.trim()
    if (!trimmedName) return

    try {
      setIsCreating(true)
      const project = await projects.create(trimmedName)
      setNewProjectName('')
      setIsCreateDialogOpen(false)
      navigate(`/editor/${project.id}`)
    } catch (err) {
      console.error('Failed to create project:', err)
      toast.error('Failed to create project')
    } finally {
      setIsCreating(false)
    }
  }

  const deleteProject = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return

    try {
      await projects.delete(id)
      await loadProjects()
    } catch (err) {
      console.error('Failed to delete project:', err)
      toast.error('Failed to delete project')
    }
  }

  const sortedProjects = [...projectList].sort((a, b) => {
    return (b.lastModified || 0) - (a.lastModified || 0)
  })

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold">FluencyKaizen Editor</h1>
            <p className="text-sm text-muted-foreground">
              Select a project to edit or create a new one.
            </p>
          </div>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <FolderPlus className="mr-2 h-4 w-4" />
            New project
          </Button>
        </header>

        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-xl">Project library</CardTitle>
              <CardDescription>Browse saved projects or create a new one.</CardDescription>
            </div>
            {!isLoading && (
              <div className="text-sm text-muted-foreground">
                {sortedProjects.length} {sortedProjects.length === 1 ? 'project' : 'projects'}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center gap-3 rounded-lg border border-dashed p-6 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading projects...</span>
              </div>
            ) : sortedProjects.length > 0 ? (
              <ScrollArea className="max-h-[540px] pr-4">
                <div className="space-y-3">
                  {sortedProjects.map((project) => (
                    <div
                      key={project.id}
                      className="flex flex-col gap-4 rounded-lg border p-4 transition hover:bg-muted/50 md:flex-row md:items-center md:justify-between cursor-pointer"
                      onClick={() => navigate(`/editor/${project.id}`)}
                    >
                      <div className="space-y-1">
                        <h2 className="text-lg font-semibold">{project.name}</h2>
                        <p className="text-sm text-muted-foreground">
                          {project.lastModified
                            ? `Last updated ${formatDate(project.lastModified)}`
                            : `Created ${formatDate(project.createdAt)}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="secondary"
                          onClick={() => navigate(`/editor/${project.id}`)}
                        >
                          <FolderOpen className="mr-2 h-4 w-4" />
                          Open
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => deleteProject(project.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-10 text-center">
                <h2 className="text-lg font-semibold">No projects yet</h2>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Create your first project to start editing videos.
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <FolderPlus className="mr-2 h-4 w-4" />
                  Create project
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="w-full max-w-md">
          <DialogHeader>
            <DialogTitle>Create a new project</DialogTitle>
            <DialogDescription>
              Pick a name for your new video editing project.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault()
              createProject()
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="project-name">Project name</Label>
              <Input
                id="project-name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="e.g. Business English Lesson 5"
                autoFocus
                disabled={isCreating}
              />
            </div>
            <DialogFooter>
              <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={!newProjectName.trim() || isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create project'
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
