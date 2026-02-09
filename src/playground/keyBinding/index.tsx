import { dq1 } from '@root/utils'
import { KeyBinding } from '@root/core/KeyBinding'
import { eventBus } from '@root/core/event'

// Initialize test state
window.testEvents = []
window.testKeyBinding = new KeyBinding()
window.testEventBus = eventBus

// Initialize KeyBinding with the current window
window.testKeyBinding.updateKeydownWindow(window)

// Listen to all command_* events
const commandEvents = [
  'command_playToggle',
  'command_rewind',
  'command_forward',
  'command_fineRewind',
  'command_fineForward',
  'command_volumeUp',
  'command_volumeDown',
  'command_muteToggle',
  'command_danmakuVisible',
  'command_subtitleVisible',
  'command_speedUp',
  'command_speedDown',
  'command_speedToggle',
  'command_pressSpeedMode',
  'command_pressSpeedMode_release',
  'command_screenshot',
  'command_danmakuShowInput',
  'command_autoResize',
]

const eventList = dq1('#event-list')!

function addEventToLog(eventName: string) {
  window.testEvents!.push(eventName)
  const eventItem = document.createElement('div')
  eventItem.className = 'event-item'
  eventItem.textContent = `${new Date().toLocaleTimeString()} - ${eventName}`
  eventList.appendChild(eventItem)
  // Auto scroll to bottom
  eventList.scrollTop = eventList.scrollHeight
  console.log('Event emitted:', eventName)
}

commandEvents.forEach((eventName) => {
  eventBus.on(eventName as any, () => {
    addEventToLog(eventName)
  })
})

window.testReady = true
console.log('KeyBinding test setup complete')

// Add some helpful instructions
const testContainer = dq1('#test-container')!
const instructions = document.createElement('div')
instructions.className = 'test-section'
instructions.innerHTML = `
  <h3>Keyboard Shortcuts to Test:</h3>
  <ul>
    <li><strong>Space</strong> - Play/Pause (command_playToggle)</li>
    <li><strong>←</strong> - Rewind (command_rewind)</li>
    <li><strong>→</strong> - Forward (command_forward)</li>
    <li><strong>Shift + ←</strong> - Fine Rewind (command_fineRewind)</li>
    <li><strong>Shift + →</strong> - Fine Forward (command_fineForward)</li>
    <li><strong>↑</strong> - Volume Up (command_volumeUp)</li>
    <li><strong>↓</strong> - Volume Down (command_volumeDown)</li>
    <li><strong>M</strong> - Mute Toggle (command_muteToggle)</li>
    <li><strong>D</strong> - Danmaku Visible (command_danmakuVisible)</li>
    <li><strong>S</strong> - Subtitle Visible (command_subtitleVisible)</li>
    <li><strong>=</strong> - Speed Up (command_speedUp)</li>
    <li><strong>-</strong> - Speed Down (command_speedDown)</li>
    <li><strong>0</strong> - Speed Toggle (command_speedToggle)</li>
    <li><strong>Enter</strong> - Danmaku Input (command_danmakuShowInput)</li>
    <li><strong>R</strong> - Auto Resize (command_autoResize)</li>
    <li><strong>Shift + P</strong> - Screenshot (command_screenshot)</li>
    <li><strong>→ (long press)</strong> - Press Speed Mode (command_pressSpeedMode)</li>
  </ul>
`
testContainer.appendChild(instructions)
