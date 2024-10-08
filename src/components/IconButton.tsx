import { ComponentProps, CSSProperties, FC } from 'react'
import { IconButton as MuiIconButton } from '@mui/material'

type MuiIconButtonProps = ComponentProps<typeof MuiIconButton>
type Props = Omit<MuiIconButtonProps, 'size'> & {
  size: number
}

const IconButton: FC<Props> = (props) => {
  const { size, ..._props } = props
  const style: CSSProperties = {
    padding: 0,
    ...(props.style ?? {}),
    width: size,
    height: size,
  }

  return <MuiIconButton {..._props} style={style} />
}

export default IconButton
