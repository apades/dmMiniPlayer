import { dq1 } from '@root/utils'
import App from './App'
import { createRoot } from 'react-dom/client'

const root = dq1('#app')!

createRoot(root).render(<App />)
