import { Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import ProjectsPage from '@/pages/ProjectsPage'
import EditorPage from '@/pages/EditorPage'

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<ProjectsPage />} />
        <Route path="/editor/:id" element={<EditorPage />} />
      </Routes>
      <Toaster position="bottom-right" />
    </>
  )
}
