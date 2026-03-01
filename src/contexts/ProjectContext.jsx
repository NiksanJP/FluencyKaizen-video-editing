import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { projects, assets, watch } from '@/lib/api'

const ProjectContext = createContext(null)

export function useProject() {
  const ctx = useContext(ProjectContext)
  if (!ctx) {
    return {
      project: null,
      projectId: null,
      assets: [],
      isLoading: true,
      saveProject: async () => {},
      refreshAssets: async () => {},
      uploadAsset: async () => {},
      deleteAsset: async () => {},
      getAssetUrl: () => '',
      setProject: () => {},
    }
  }
  return ctx
}

export function ProjectProvider({ projectId, children }) {
  const [project, setProject] = useState(null)
  const [assetList, setAssetList] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const loadProject = useCallback(async (isReload = false) => {
    try {
      if (!isReload) setIsLoading(true)
      const data = await projects.get(projectId)
      setProject(data)
    } catch (err) {
      console.error('Failed to load project:', err)
    } finally {
      if (!isReload) setIsLoading(false)
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

  // Watch for external changes to project.json (e.g. from Claude Code terminal)
  useEffect(() => {
    watch.project(projectId).catch(() => {})

    const removeListener = watch.onExternalChange((changedId) => {
      if (changedId === projectId) {
        loadProject(true)
      }
    })

    return () => {
      removeListener()
      watch.stop(projectId)
    }
  }, [projectId, loadProject])

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
