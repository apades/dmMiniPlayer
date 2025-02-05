export function resizeDocPIPWindow(
  docPIPWindow: Window | undefined,
  size: Partial<{ width: number; height: number }>,
) {
  if (!docPIPWindow) return
  const [borX, borY] = getDocPIPBorderSize(docPIPWindow)
  const [width, height] = [
    size.width || docPIPWindow.innerWidth + borX,
    size.height || docPIPWindow.innerHeight + borY,
  ]

  docPIPWindow.resizeTo(width, height)
}

export function getDocPIPBorderSize(docPIPWindow: Window | undefined) {
  if (!docPIPWindow) return [0, 0]
  return [
    docPIPWindow.outerWidth - docPIPWindow.innerWidth,
    docPIPWindow.outerHeight - docPIPWindow.innerHeight,
  ]
}
