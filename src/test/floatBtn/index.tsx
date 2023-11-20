import { dq1 } from '@root/utils'
import App from './App'
import { createRoot } from 'react-dom/client'
import '@root/style/tailwind.css'
import '@root/style/tailwindBase.css'

const root = dq1('#app')

createRoot(root).render(<App />)
