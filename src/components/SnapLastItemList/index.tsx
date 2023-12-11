import {
  forwardRef,
  useEffect,
  useRef,
  type DetailedHTMLProps,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import classNames from 'classnames'
import { useScroll } from 'ahooks'

type Props = { children: ReactNode } & DetailedHTMLProps<
  HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
>
const SnapLastItemList = forwardRef<HTMLDivElement, Props>((props, ref) => {
  const listRef = useRef<HTMLDivElement>()
  let pos = useScroll(listRef.current)
  // ! window的缩放屏幕和mac奇妙的会导致scrollTop不对，少了0.几
  let isEnd = !listRef.current
    ? false
    : ~~(pos?.top + listRef.current?.offsetHeight) + 3 >=
      listRef.current?.scrollHeight

  useEffect(() => {
    if (typeof ref === 'object' && ref !== null) {
      ref.current = listRef.current
    } else if (typeof ref === 'function') {
      ref(listRef.current)
    }
  }, [ref])

  return (
    <div
      {...props}
      className={classNames(
        'snap-container overflow-x-hidden overflow-y-auto snap-proximity snap-y',
        props.className
      )}
      ref={listRef}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `.snap-container > *:last-child{
        ${
          isEnd
            ? `
        scroll-margin-block-end: 5rem;
        scroll-snap-align: end;`
            : ``
        }
      }`,
        }}
      ></style>
      {props.children}
    </div>
  )
})

export default SnapLastItemList
