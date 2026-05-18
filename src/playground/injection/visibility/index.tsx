import { dq1 } from '@root/utils'
import { bootstrapInjection } from '../setup'

const client = bootstrapInjection(['visibility'])
const stateDisplay = dq1('#state-display')!

function renderVisibilityState() {
  stateDisplay.textContent = document.visibilityState
}

window.readVisibilityState = () => document.visibilityState

window.visibilityAlwaysVisibleTest = async () => {
  await client.visibility.alwaysVisible()
  renderVisibilityState()
}

window.visibilityAlwaysHiddenTest = async () => {
  await client.visibility.alwaysHidden()
  renderVisibilityState()
}

window.visibilityRestoreTest = async () => {
  await client.visibility.restore()
  renderVisibilityState()
}

renderVisibilityState()
window.testReady = true
