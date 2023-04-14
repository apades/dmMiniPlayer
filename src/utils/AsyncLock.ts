export default class AsyncLock {
  // eslint-disable-next-line @typescript-eslint/ban-types
  checkingAsyncQueue: Function[] = []
  isOk = false

  waiting = () => {
    if (this.isOk) return
    return new Promise((resolve) => {
      this.checkingAsyncQueue.push(resolve)
    })
  }
  ok = () => {
    this.isOk = true
    this.checkingAsyncQueue.forEach((fn) => fn())
    this.checkingAsyncQueue.length = 0
  }

  reWaiting = () => {
    this.isOk = false
  }
}
