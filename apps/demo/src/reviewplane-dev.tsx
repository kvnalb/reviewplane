import { createRoot } from 'react-dom/client'
import { ReviewPlane, registerReviewPlaneTools } from '@reviewplane/react'

const host = document.createElement('div')
host.dataset.reviewplaneRoot = ''
document.body.append(host)
createRoot(host).render(<ReviewPlane />)

if (document.modelContext) void registerReviewPlaneTools(document.modelContext)
