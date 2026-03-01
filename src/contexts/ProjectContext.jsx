import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { projects, assets } from '@/lib/api'

const ProjectContext = createContext(null)

export function useProject() {
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error('useProject must be used within ProjectProvider')
  return ctx
}

export function ProjectProvider({ projectId, children }) {
  const [project, setProject] = useState(null)
  const [assetList, setAssetList] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const loadProject = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await projects.get(projectId)
      setProject(data)
    } catch (err) {
      console.error('Failed to load project:', err)
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  const saveProject = useCallback(async (updates) => {
    try {
      const data = await projects.update(projectId, updates)
      setProject(data)
      return data
    } catch (err) {
      console.error('Failed to save project:', err)
      throw err
    }
  }, [projectId])

  const refreshAssets = useCallback(async () => {
    try {
      const data = await assets.list(projectId)
      setAssetList(data)
    } catch (err) {
      console.error('Failed to load assets:', err)
    }
  }, [projectId])

  const uploadAsset = useCallback(async (file) => {
    const data = await assets.upload(projectId, file)
    await refreshAssets()
    return data
  }, [projectId, refreshAssets])

  const deleteAsset = useCallback(async (filename) => {
    await assets.delete(projectId, filename)
    await refreshAssets()
  }, [projectId, refreshAssets])

  const getAssetUrl = useCallback((filename) => {
    return assets.getUrl(projectId, filename)
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
        assets: assetList,
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
