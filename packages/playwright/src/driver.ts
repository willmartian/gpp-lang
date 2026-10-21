/*
 * The driver that runs the language's words in a browser, with Playwright.
 *
 * Playwright's getBy* locators implement Testing Library's queries, and its
 * expect retries until a check passes, which is what the words ask of a driver.
 */

import type { Context, Driver } from '@gpp-lang/core'
import type { expect, Locator, Page } from '@playwright/test'

export interface BrowserContext extends Context {
  page: Page
  expect: typeof expect
}

type AriaRole = Parameters<Page['getByRole']>[0]

// ---------------------------------------------------------------- the driver

export const playwright: Driver<BrowserContext, Locator> = {
  find({ page }, root, query) {
    const r = root ?? page
    if (query.by === 'role') {
      const { name, text, has } = query
      let found = r.getByRole(query.role as AriaRole, name === undefined ? {} : { name, exact: true })
      if (text !== undefined) found = found.filter({ hasText: text })
      if (has) found = found.filter({ has })
      return found
    }
    const { name } = query
    switch (query.by) {
      case 'label':
        return r.getByLabel(name, { exact: true })
      case 'text':
        return query.loose ? r.getByText(name).first() : r.getByText(name, { exact: true })
      case 'placeholder':
        return r.getByPlaceholder(name, { exact: true })
      case 'alt':
        return r.getByAltText(name, { exact: true })
      case 'title':
        return r.getByTitle(name, { exact: true })
      case 'testId':
        return r.getByTestId(name)
    }
  },

  async act(_, target, action) {
    switch (action.do) {
      case 'click':
        return target.click()
      case 'double-click':
        return target.dblclick()
      case 'hover':
        return target.hover()
      case 'focus':
        return target.focus()
      case 'check':
        return target.check()
      case 'uncheck':
        return target.uncheck()
      case 'clear':
        return target.clear()
      case 'fill':
        return target.fill(action.text)
      case 'type':
        return target.pressSequentially(action.text)
      case 'select':
        await target.selectOption(action.text)
        return
      case 'press':
        return target.press(action.key)
    }
  },

  press({ page }, key) {
    return page.keyboard.press(key)
  },

  expect(ctx, target, state, not, once) {
    const e = not ? ctx.expect(target).not : ctx.expect(target)
    /** Checking once is a check that times out straight away; it still looks. */
    const o = once ? { timeout: 1 } : {}
    switch (state.is) {
      case 'visible':
        return e.toBeVisible(o)
      case 'hidden':
        return e.toBeHidden(o)
      case 'checked':
        return e.toBeChecked(o)
      case 'enabled':
        return e.toBeEnabled(o)
      case 'disabled':
        return e.toBeDisabled(o)
      case 'focused':
        return e.toBeFocused(o)
      case 'empty':
        return e.toBeEmpty(o)
      case 'value':
        return e.toHaveValue(state.text, o)
      case 'text':
        return e.toHaveText(state.text, o)
      case 'containing':
        return e.toContainText(state.text, o)
      case 'texts':
        return e.toHaveText(state.texts, o)
      case 'count':
        return e.toHaveCount(state.count, o)
    }
  },

  all(_, target) {
    return target.all()
  },

  /** expect.poll retries for as long as the project's expect timeout. */
  async retry(ctx, attempt) {
    let last: unknown
    const passes = async () => {
      try {
        await attempt()
        return true
      } catch (err) {
        last = err
        return false
      }
    }
    try {
      await ctx.expect.poll(passes).toBe(true)
    } catch (err) {
      throw last ?? err
    }
  },
}
