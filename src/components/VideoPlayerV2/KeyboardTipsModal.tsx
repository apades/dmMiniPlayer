import { getShortcutAllConfigs } from '@root/core/KeyBinding'
import { createIsolationModal } from '@root/hook/useOpenIsolationModal'
import configStore, { saveConfig, updateConfig } from '@root/store/config'
import config_shortcut from '@root/store/config/shortcut'
import { t } from '@root/utils/i18n'
import { observer } from 'mobx-react'
import { Fragment } from 'react'
import Modal from '../Modal'

const KeyboardTipsModal = createIsolationModal((props) => {
  const keydataMap = getShortcutAllConfigs()
  return (
    <Modal isOpen={props.isOpen} onClose={props.destroy} fullWidth>
      <div className="[&_th]:bor-[#dee2e6] [&_td]:bor-[#dee2e6] [&_td]:px-4 [&_td]:py-2 p-4">
        <div className="f-i-center gap-4 mb-2">
          <input
            type="checkbox"
            checked={configStore.keyboardTips_show}
            onChange={(e) => {
              const visible = e.target.checked
              updateConfig({ keyboardTips_show: visible })
              saveConfig()
            }}
          />
          {t('shortcut.showShortcutTips')}
        </div>
        <table border={1}>
          <thead>
            <tr>
              <th>{t('shortcut.shortcut')}</th>
              <th>{t('shortcut.feat')}</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(keydataMap)
              .filter(([, kbds]) => Array.isArray(kbds))
              .map(([key, kbds], i) => {
                const keys = kbds as string[]
                return (
                  <tr key={i}>
                    <td>
                      {keys.map((v, i) => {
                        const isLast = i === keys.length - 1
                        return (
                          <Fragment>
                            <kbd className="shadow-sm bor-[#b4b4b4] rounded font-bold px-2 py-0.5 font-[monospace] leading-[1]">
                              {v}
                            </kbd>
                            {isLast ? '' : ' + '}
                          </Fragment>
                        )
                      })}
                    </td>
                    <td>{(config_shortcut as any)[key].label}</td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>
    </Modal>
  )
})

export default observer(KeyboardTipsModal)
