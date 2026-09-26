import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createSingleFlightCache } from './single-flight.js'

describe('createSingleFlightCache', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('reuses a value until the ttl elapses', async () => {
    const cache = createSingleFlightCache<number>({ ttlMs: 1000 })
    const load = vi.fn(async () => 1)

    await cache.get('a', load)
    await cache.get('a', load)
    expect(load).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(1000)
    await expect(cache.get('a', load)).resolves.toBe(1)
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('shares one load across concurrent callers', async () => {
    const cache = createSingleFlightCache<number>({ ttlMs: 1000 })
    let resolve: (value: number) => void = () => {}
    const load = vi.fn(
      () =>
        new Promise<number>((done) => {
          resolve = done
        }),
    )

    const first = cache.get('a', load)
    const second = cache.get('a', load)
    expect(load).toHaveBeenCalledTimes(1)

    resolve(7)
    await expect(first).resolves.toBe(7)
    await expect(second).resolves.toBe(7)
  })

  it('does not cache a rejected load, and concurrent callers share that failure', async () => {
    const cache = createSingleFlightCache<number>({ ttlMs: 1000 })
    const load = vi.fn(async () => {
      throw new Error('disk')
    })

    const first = cache.get('a', load)
    const second = cache.get('a', load)
    await expect(first).rejects.toThrow('disk')
    await expect(second).rejects.toThrow('disk')
    expect(load).toHaveBeenCalledTimes(1)

    load.mockResolvedValueOnce(2)
    await expect(cache.get('a', load)).resolves.toBe(2)
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('skips storing when store() returns false, but still coalesces the in-flight load', async () => {
    const cache = createSingleFlightCache<number | null>({
      ttlMs: 1000,
      store: (value) => value !== null,
    })
    let resolve: (value: number | null) => void = () => {}
    const load = vi.fn(
      () =>
        new Promise<number | null>((done) => {
          resolve = done
        }),
    )

    const first = cache.get('missing', load)
    const second = cache.get('missing', load)
    expect(load).toHaveBeenCalledTimes(1)
    resolve(null)
    await first
    await second

    const again = vi.fn(async () => null)
    await cache.get('missing', again)
    expect(load).toHaveBeenCalledTimes(1)
    expect(again).toHaveBeenCalledTimes(1)
  })

  it('does not let an older in-flight load overwrite a value stored after invalidate', async () => {
    const cache = createSingleFlightCache<number>({ ttlMs: 1000 })
    let resolveStale: (value: number) => void = () => {}
    const stale = cache.get(
      'a',
      () =>
        new Promise<number>((done) => {
          resolveStale = done
        }),
    )

    cache.invalidate('a')

    let resolveFresh: (value: number) => void = () => {}
    const fresh = cache.get(
      'a',
      () =>
        new Promise<number>((done) => {
          resolveFresh = done
        }),
    )

    resolveFresh(2)
    await expect(fresh).resolves.toBe(2)

    resolveStale(1)
    await expect(stale).resolves.toBe(1)

    const later = vi.fn(async () => 3)
    await expect(cache.get('a', later)).resolves.toBe(2)
    expect(later).not.toHaveBeenCalled()
  })

  it('keeps keys independent', async () => {
    const cache = createSingleFlightCache<string>({ ttlMs: 1000 })
    await cache.get('a', async () => 'A')
    await cache.get('b', async () => 'B')
    cache.invalidate('a')

    const loadA = vi.fn(async () => 'A2')
    const loadB = vi.fn(async () => 'B2')
    await expect(cache.get('a', loadA)).resolves.toBe('A2')
    await expect(cache.get('b', loadB)).resolves.toBe('B')
    expect(loadB).not.toHaveBeenCalled()
  })
})
