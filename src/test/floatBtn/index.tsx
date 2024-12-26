import '../polyfill/browser/index'
import { dq1 } from '@root/utils'
import App from './App'
import { createRoot } from 'react-dom/client'
import '@root/style'

const root = dq1('#app')

createRoot(root).render(<App />)
