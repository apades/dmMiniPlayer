import AsyncLock from '@root/utils/AsyncLock'
import Events2 from '@root/utils/Events2'
import { PromisePool } from 'minimal-promise-pool'

type ThreadsManagerEvent<T> = {
  done: {
    key: string
    res: T
  }
  error: {
    key: string
    error: any
  }
  end: {
    key: string
    res: T
  }[]
}

type ThreadsTask<T> = {
  key: string
  fn: () => Promise<T>
}
type ThreadsTaskRes<T> = {
  key: string
  res: T
}

export default class ThreadsManager<Res> extends Events2<
  ThreadsManagerEvent<Res>
> {
  #waitingTasks: ThreadsTask<Res>[] = []
  #runningTasks: ThreadsTask<Res>[] = []
  #errTasks: ThreadsTask<Res>[] = []
  #doneTasks: ThreadsTaskRes<Res>[] = []

  asyncLock = new AsyncLock()

  constructor(public config: { maxThreads: number }) {
    super()
  }
  add(key: string, fn: () => Promise<Res>) {
    this.#waitingTasks.push({ key, fn })
  }

  async run() {
    while (true) {
      const task = this.#waitingTasks.shift()
      if (!task) {
        // this.emit('end', this.#doneTasks)
        continue
      }
      //   console.log('task', task)
      if (this.#runningTasks.length >= this.config.maxThreads) {
        await this.asyncLock.waiting()
      }

      this.#runTask(task)
    }
  }

  #runTask(task: ThreadsTask<Res>) {
    const { key, fn } = task
    this.#runningTasks.push(task)
    fn()
      .then((res) => {
        this.#doneTasks.push({ key, res })
        const index = this.#runningTasks.findIndex((t) => t.key === key)
        this.#runningTasks.splice(index, 1)
        this.emit('done', { key, res })
        this.asyncLock.ok()
      })
      .catch((err) => {
        this.#errTasks.push({ key, fn })
        const index = this.#runningTasks.findIndex((t) => t.key === key)
        this.#runningTasks.splice(index, 1)
        this.emit('error', { key, error: err })
        this.asyncLock.ok()
      })
    if (this.#runningTasks.length >= this.config.maxThreads) {
      this.asyncLock.reWaiting()
    }
  }
}

const threadsManager = new ThreadsManager({ maxThreads: 10 })

const pool = new PromisePool(10)

new Array(20).fill(0).forEach((_, i) => {
  const r = ~~(Math.random() * 1000)

  //   threadsManager.add(`task-${i}`, async () => {
  //     await new Promise((resolve) => setTimeout(resolve, r))
  //     return r
  //   })
  pool.run(async () => {
    await new Promise((resolve) => setTimeout(resolve, r))
    console.log('r', r)
    return r
  })
})

// threadsManager.run()
// threadsManager.on('done', ({ key, res }) => {
//   console.log(key, res)
// })

// threadsManager.on('end', (res) => {
//   console.log('end', res)
// })

// threadsManager.on('error', ({ key, error }) => {
//   console.log(key, error)
// })
