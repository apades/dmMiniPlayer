import { createIsolationModal } from '@root/hook/useOpenIsolationModal'
import configStore, { saveConfig, updateConfig } from '@root/store/config'
import { isArray } from '@root/utils'
import { runInAction } from 'mobx'
import { observer } from 'mobx-react'
import { Fragment } from 'react'
import Modal from '../Modal'

type keyDataItem = {
  key: string | string[]
  text: string
  desc?: string
}
const KeyboardTipsModal = createIsolationModal((props) => {
  const keydataList: keyDataItem[] = [
    {
      key: 'Space',
      text: '播放/暂停',
    },
    {
      key: '←',
      text: '快退5秒',
    },
    {
      key: '→',
      text: '快进5秒',
    },
    {
      key: ['Shift', '→'],
      text: '快进1帧',
    },
    {
      key: ['Shift', '←'],
      text: '快退1帧',
    },
    {
      key: ['长按', '→'],
      text: '倍速模式',
    },
    // {
    //   key: ['ctrl', '→'],
    //   text: '下一个视频',
    // },
    // {
    //   key: ['ctrl', '←'],
    //   text: '上一个视频',
    // },
    {
      key: '↑',
      text: '音量+',
    },
    {
      key: '↓',
      text: '音量-',
    },
    {
      key: 'M',
      text: '静音/取消静音',
    },
    {
      key: '0',
      text: '倍速模式/倍速重置',
    },
    {
      key: '-',
      text: '倍速-0.25',
    },
    {
      key: '=',
      text: '倍速+0.25',
    },
    {
      key: 'Enter',
      text: '弹出弹幕输入框',
    },
    {
      key: ['Shift', 'P'],
      text: '截图',
    },
    {
      key: 'D',
      text: '显示/隐藏弹幕',
    },
    {
      key: 'S',
      text: '显示/隐藏字幕',
    },
  ]

  return (
    <Modal isOpen={props.isOpen} onClose={props.destroy}>
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
          显示键盘提示
        </div>
        <table border={1}>
          <thead>
            <tr>
              <th>快捷键</th>
              <th>功能</th>
            </tr>
          </thead>
          <tbody>
            {keydataList.map((item, i) => {
              const kbds = isArray(item.key) ? item.key : [item.key]
              return (
                <tr key={i}>
                  <td>
                    {kbds.map((v, i) => {
                      const isLast = i === kbds.length - 1
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
                  <td>{item.text}</td>
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
