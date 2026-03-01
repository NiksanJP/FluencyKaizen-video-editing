import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const ProjectContext = createContext(null)

export function useProject() {
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error('useProject must be used within ProjectProvider')
  return ctx
}

export function ProjectProvider({ projectId, children }) {
  const [project, setProject] = useState(null)
  const [assets, setAssets] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const loadProject = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await fetch(`/api/projects/${projectId}`)
      if (!res.ok) throw new Error('Project not found')
      const data = await res.json()
      setProject(data)
    } catch (err) {
      console.error('Failed to load project:', err)
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  const saveProject = useCallback(async (updates) => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const data = await res.json()
      setProject(data)
      return data
    } catch (err) {
      console.error('Failed to save project:', err)
      throw err
    }
  }, [projectId])

  const refreshAssets = useCallback(async () => {
    try {
      const res = await fetch(`/api/assets/${projectId}`)
      const data = await res.json()
      setAssets(data)
    } catch (err) {
      console.error('Failed to load assets:', err)
    }
  }, [projectId])

  const uploadAsset = useCallback(async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch(`/api/assets/${projectId}/upload`, {
      method: 'POST',
      body: formData,
    })
    const data = await res.json()
    await refreshAssets()
    return data
  }, [projectId, refreshAssets])

  const deleteAsset = useCallback(async (filename) => {
    await fetch(`/api/assets/${projectId}/${filename}`, { method: 'DELETE' })
    await refreshAssets()
  }, [projectId, refreshAssets])

  const getAssetUrl = useCallback((filename) => {
    return `/api/assets/${projectId}/${filename}`
  }, [projectId])

  useEffect(() => {
    loadProject()
    refreshAssets()
  }, [loadProject, refreshAssets])

  return (
    <ProjectContext.Provider
      value={{
        project,
        projectId,
        assets,
        isLoading,
        saveProject,
        refreshAssets,
        uploadAsset,
        deleteAsset,
        getAssetUrl,
        setProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  )
}
