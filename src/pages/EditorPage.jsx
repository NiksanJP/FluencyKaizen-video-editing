import { useParams, useNavigate } from 'react-router-dom'
import { ProjectProvider } from '@/contexts/ProjectContext'
import VideoEditor from '@/components/VideoEditor'

export default function EditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  return (
    <ProjectProvider projectId={id}>
      <VideoEditor onBack={() => navigate('/')} />
    </ProjectProvider>
  )
}
