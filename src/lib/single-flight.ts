// 同一个 key 上：未过期就直接返回内存里的值；过期或未命中时，并发调用共享同一次 load。
// 适合「读多写少、加载会在 await 处让出事件循环」的读路径。同步 CPU 工作不会在这里被合并，
// 因为 Node 要等当前同步代码跑完才会处理下一个请求。

export interface SingleFlightCache<T> {
  get(key: string, load: () => Promise<T>): Promise<T>
  invalidate(key: string): void
}

export function createSingleFlightCache<T>(options: {
  ttlMs: number
  // 返回 false 时本次结果不写入缓存。在途的并发调用仍然共享这一次 load。
  store?: (value: T) => boolean
}): SingleFlightCache<T> {
  const shouldStore = options.store ?? (() => true)
  const values = new Map<string, { value: T; expiresAt: number }>()
  const inflight = new Map<string, Promise<T>>()
  const generations = new Map<string, number>()

  function generation(key: string): number {
    return generations.get(key) ?? 0
  }

  return {
    get(key, load) {
      const hit = values.get(key)
      if (hit && hit.expiresAt > Date.now()) {
        return Promise.resolve(hit.value)
      }

      const pending = inflight.get(key)
      if (pending) return pending

      const seen = generation(key)
      // async 包一层：load() 同步抛出的错误也会变成 rejection，而不是从 get() 里直接抛出去。
      const promise: Promise<T> = (async () => load())()
        .then((value) => {
          // invalidate 会把 generation 加一。这里对上号才回填，避免旧的在途加载把新数据盖掉。
          if (generation(key) === seen && shouldStore(value)) {
            values.set(key, { value, expiresAt: Date.now() + options.ttlMs })
          }
          return value
        })
        .finally(() => {
          if (inflight.get(key) === promise) inflight.delete(key)
        })

      inflight.set(key, promise)
      return promise
    },

    invalidate(key) {
      values.delete(key)
      generations.set(key, generation(key) + 1)
      // 摘掉在途记录，让失效之后的新请求自己再读一次，而不是继续等旧结果。
      inflight.delete(key)
    },
  }
}
