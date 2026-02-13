import configStore, { saveConfig } from '@root/store/config'
import { t } from '@root/utils/i18n'
import { observer } from 'mobx-react'
import { FC } from 'react'
import ActionButton from './ActionButton'

const SharpeningIcon: FC<{ active?: boolean }> = ({ active }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ opacity: active ? 1 : 0.5 }}
  >
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
)

const SharpeningButton: FC = observer(() => {
  const active = configStore.videoSharpening

  const handleToggle = () => {
    ;(configStore as any).videoSharpening = !active
    saveConfig()
  }

  return (
    <ActionButton
      onClick={handleToggle}
      isUnActive={!active}
      title={t('settingPanel.videoSharpening')}
    >
      <SharpeningIcon active={active} />
    </ActionButton>
  )
})

export default SharpeningButton
