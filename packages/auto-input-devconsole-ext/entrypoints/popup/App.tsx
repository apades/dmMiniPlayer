import { useOnce } from '@root/hook'
import { useState } from 'react'
import { sendMessage } from 'webext-bridge/popup'
import Browser from 'webextension-polyfill'
import reactLogo from '@/assets/react.svg'
import './App.css'
import wxtLogo from '/wxt.svg'

function App() {
  const [count, setCount] = useState(0)

  useOnce(async () => {
    const tabs = await Browser.tabs.query({ active: true, currentWindow: true })

    const tarTab = tabs[0]
    if (!tarTab?.id) return

    sendMessage('start', null, {
      tabId: tarTab.id,
      context: 'content-script',
    })
  })

  return (
    <>
      <div>
        <a href="https://wxt.dev" target="_blank">
          <img src={wxtLogo} className="logo" alt="WXT logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>WXT + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the WXT and React logos to learn more
      </p>
    </>
  )
}

export default App
