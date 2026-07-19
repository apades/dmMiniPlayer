import { isNumber, isString } from '@root/utils'
import classNames from 'classnames'
import {
  cloneElement,
  FC,
  isValidElement,
  ReactElement,
  ReactNode,
  useState,
} from 'react'

type Props = {
  tabs: {
    label: ReactNode | string
    value: string
    content: ReactNode
  }[]
  className?: string
  tabHeaderClassName?: string
  value?: string
  onChange?: (value: string) => void
  /** @default 'top' */
  adjustContent?: 'top' | 'bottom'
  /**
   * @default 'top'
   * @deprecated
   */
  tabHeaderPosition?: 'top' | 'bottom'
}
const Tabs: FC<Props> = (props) => {
  const {
    className,
    tabs,
    value,
    onChange,
    adjustContent = 'top',
    tabHeaderPosition = 'top',
    tabHeaderClassName,
  } = props
  const [activeTab, setActiveTab] = useState(value ?? tabs[0].value)

  const activeTabIndex = tabs.findIndex((tab) => tab.value === activeTab)

  return (
    <div className={classNames('flex flex-col pointer-events-none')}>
      <div
        className={classNames('tabs-content-list flex relative order-2')}
        style={{
          width: `${100 * tabs.length}%`,
          left: `${-1 * activeTabIndex * 100}%`,
        }}
      >
        {tabs.map((tab) => (
          <div
            key={tab.value}
            className={classNames(
              'tabs-content-list-item w-full flex flex-col',
              activeTab === tab.value ? 'active opacity-100' : 'opacity-0',
              adjustContent === 'bottom' ? 'justify-end' : 'justify-start',
              tabHeaderClassName,
            )}
          >
            <div className={classNames(className)}>
              <div
                className={classNames(
                  'f-i-center mb-1 gap-1 pointer-events-auto',
                )}
              >
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.value
                  if (isString(tab.label)) {
                    return (
                      <div
                        key={tab.value}
                        className={classNames(isActive && 'active')}
                        onClick={() => setActiveTab(tab.value)}
                      >
                        {tab.label}
                      </div>
                    )
                  }

                  const label = tab.label as ReactElement<any>
                  return cloneElement(label, {
                    onClick: () => setActiveTab(tab.value),
                    className: classNames(
                      isActive && 'active',
                      label.props.className,
                    ),
                    key: tab.value,
                  })
                })}
              </div>
              <div
                className={classNames(
                  activeTab === tab.value && 'pointer-events-auto',
                )}
              >
                {tab.content}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Tabs
