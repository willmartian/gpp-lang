/*
 * What Render renders here: a function that makes an element, as the plain
 * DOM editor's do.
 */
import { afterEach } from 'vitest'
import { renderWith } from '../../src/index.ts'

renderWith((ui: unknown) => {
  if (typeof ui !== 'function') throw new Error(`Render was given ${typeof ui}, not a function that makes an element`)
  const element: unknown = ui()
  if (!(element instanceof HTMLElement)) throw new Error('Render was given a function that made no element')
  document.body.append(element)
})

afterEach(() => document.body.replaceChildren())
