import { createRoot } from 'react-dom/client'
import { ReviewPlane, registerReviewPlaneTools } from '@reviewplane/react'

const overlay = document.createElement('div')
document.body.append(overlay)
createRoot(overlay).render(<ReviewPlane />)
if (document.modelContext) void registerReviewPlaneTools(document.modelContext)
