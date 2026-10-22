import { describe, expect, it } from 'vitest'
import { runTasks } from './preload'

/* ===========================================================================
   THE PROGRESS ACCOUNTING.

   The bar on the boot screen is only worth showing if it is true, so the one
   piece of logic worth testing is the counter behind it: it must reach the
   total, it must count a task that FAILED (a missing picture is still a
   finished task), and it must never reject.
   =========================================================================== */

describe('runTasks', () => {
  it('counts every task, successful or not', async () => {
    const seen: number[] = []
    await runTasks(
      [Promise.resolve('a'), Promise.reject(new Error('missing file')), Promise.resolve('c')],
      (p) => seen.push(p.done),
    )
    expect(seen).toEqual([0, 1, 2, 3])
  })

  it('never rejects, even when every task fails', async () => {
    const seen: number[] = []
    await expect(
      runTasks(
        [Promise.reject(new Error('one')), Promise.reject(new Error('two'))],
        (p) => seen.push(p.done),
      ),
    ).resolves.toBeUndefined()
    expect(seen.at(-1)).toBe(2)
  })

  it('reports an empty plan as already finished', async () => {
    const seen: number[] = []
    await runTasks([], (p) => seen.push(p.done))
    expect(seen).toEqual([0])
  })
})
