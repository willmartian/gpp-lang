// The words every backend shares, made from what its driver can do.
//
// Queries are Testing Library's, spelled as Cognate words: a role name
// (Button, Heading, Checkbox…) takes the accessible name to its right and
// leaves an Element. Spec++ asks for exact names, as Testing Library does,
// unless you say Containing. Roles with no name, like Listitem, take only
// Containing, and look at the text inside them instead.
//
// Assertions are deferred. "Then I should Not See the Button "Save"" runs See
// before Not, so See can't just fail on the spot; it leaves an Expectation on
// the stack for Not to flip, and every Expectation left when the step ends is
// checked then. Likewise "the Checkbox "Terms" should be Checked": Checked
// runs first and leaves a Matcher, the Checkbox query lands on top of it, and
// the step's end pairs them up.
//
// A backend builds its vocabulary from queries(), actions() and checks(),
// with its own words in between, like the Playwright backend's Visit.

import type { Stack } from '../language/cognate.ts'
import { describe, type Env, SppError, unwrap } from '../language/cognate.ts'
import type { Context, Form } from '../language/types.ts'
import { article, called, formsFor, mistake, NumberType, oneOf, TableType, TextType, type } from '../language/types.ts'
import type { Action, Driver, Name, Query, QueryKind, State } from './driver.ts'

// Any driver: its members are methods, so one that needs more, like a page, fits.
type AnyDriver = Driver<Context, unknown>

// ---------------------------------------------------------------- values

export class Pattern {
  text: string
  regex: RegExp

  constructor(text: string) {
    this.text = text
    this.regex = new RegExp(escapeRegExp(text), 'i')
  }
  describe() {
    return `Containing ${JSON.stringify(this.text)}`
  }
}

// Containing the Button "Remove": something inside, for a role query to look for.
export class Holding {
  found: Found

  constructor(found: Found) {
    this.found = found
  }
  describe() {
    return `Containing ${this.found.describe()}`
  }
}

export class Scope {
  found: Found

  constructor(found: Found) {
    this.found = found
  }
  describe() {
    return `Within ${this.found.describe()}`
  }
}

// A driver's handle that remembers the words that made it, for error messages.
export class Found<H = unknown> {
  handle: H
  label: string

  constructor(handle: H, label: string) {
    this.handle = handle
    this.label = label
  }
  describe() {
    return this.label
  }
}

export class Matcher {
  label: string
  state: State
  negated: boolean

  constructor(label: string, state: State, negated = false) {
    this.label = label
    this.state = state
    this.negated = negated
  }
  negate() {
    return new Matcher(this.label, this.state, !this.negated)
  }
  against<C extends Context, H>(target: Found, ctx: C, driver: Driver<C, H>) {
    return new Expectation(`${target.label} ${this.describe()}`, (not) =>
      driver.expect(ctx, target.handle as H, this.state, this.negated !== not),
    )
  }
  describe() {
    return (this.negated ? 'Not ' : '') + this.label
  }
}

// check(not) runs the assertion, inverted when not is true.
export class Expectation {
  label: string
  check: (not: boolean) => Promise<void>

  constructor(label: string, check: (not: boolean) => Promise<void>) {
    this.label = label
    this.check = check
  }
  negate() {
    return new Expectation(`Not ${this.label}`, (not) => this.check(!not))
  }
  describe() {
    return this.label
  }
}

// ---------------------------------------------------------------- types

export const ElementType = type('Element', 'something on the page', (v): v is Found => v instanceof Found)
export const PatternType = type('Pattern', 'Containing "some text"', (v): v is Pattern => v instanceof Pattern)
export const NameType = oneOf<string | Pattern>('some text', TextType, PatternType)
export const HoldingType = type(
  'Holding',
  'Containing something on the page',
  (v): v is Holding => v instanceof Holding,
)
export const ScopeType = type('Scope', 'Within something', (v): v is Scope => v instanceof Scope)
export const MatcherType = type('Matcher', 'a check', (v): v is Matcher => v instanceof Matcher)
export const CheckType = type('Check', 'a check', (v): v is Expectation => v instanceof Expectation)

const QueryName = called(NameType, 'a "name" to look for')

// What a role is found by: a name, or what's inside it.
type Inside = string | Pattern | Holding
const RoleName = oneOf<Inside>('a "name" to look for', TextType, PatternType, HoldingType)
const Content = oneOf<Inside>('Containing "some text"', PatternType, HoldingType)

// The shared words run with whatever context their driver wants.
const form = formsFor<Context>()

// ---------------------------------------------------------------- helpers

export const nameOf = (v: string | Pattern): Name => (v instanceof Pattern ? v.regex : v)
export const say = (v: Inside) => (typeof v === 'string' ? JSON.stringify(v) : v.describe())

export function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const cap = (s: string) => s[0].toUpperCase() + s.slice(1)

// Verbs that take a thing and some text accept them in either order, so
// "Fill the Field "Email" with "a@b"" and "Fill "a@b" into the Field "Email""
// both work.
function eitherOrder(act: (ctx: Context, found: Found, text: string) => Promise<unknown>): Form[] {
  return [
    form([ElementType, TextType], (ctx, found, text) => act(ctx, found, text)),
    form([TextType, ElementType], (ctx, text, found) => act(ctx, found, text)),
  ]
}

// ---------------------------------------------------------------- queries

// The word for each kind of query that isn't by role.
const QUERY_WORDS: [QueryKind, ...string[]][] = [
  ['label', 'Field', 'Label'],
  ['text', 'Text'],
  ['placeholder', 'Placeholder'],
  ['alt', 'Alt'],
  ['title', 'Title'],
  ['testId', 'TestId'],
]

// Roles with no name to find them by: ARIA names neither from their content
// nor, usually, from an author's label. Most are roles ARIA forbids naming;
// the rest, like listitem, are ones ARIA hasn't settled (w3c/aria#1800).
// Containing finds them by the text inside instead, and an exact name is a
// mistake. Every other role is found by its name, which is what a screen
// reader says.
export const UNNAMED_ROLES: ReadonlySet<string> = new Set([
  // naming prohibited
  'caption',
  'code',
  'deletion',
  'emphasis',
  'generic',
  'insertion',
  'none',
  'paragraph',
  'presentation',
  'strong',
  'subscript',
  'superscript',
  // named by an author, but rarely
  'alert',
  'article',
  'blockquote',
  'definition',
  'listitem',
  'log',
  'marquee',
  'note',
  'status',
  'term',
  'time',
  'timer',
])

// Finding things: a word for each role and query the driver has, then
// Containing and Within.
export function queries(env: Env, driver: AnyDriver): Env {
  env.kind(ElementType)

  // What a query finds, within a Scope if one came after it, described by
  // the words that found it.
  const found = (ctx: Context, word: string, query: Query, by: Inside | null, scope?: Scope) => {
    const label = [`the ${word}`, by === null ? [] : say(by), scope ? `within ${scope.found.label}` : []].flat()
    return new Found(driver.find(ctx, scope?.found.handle ?? null, query), label.join(' '))
  }

  // A query by name: role words take the name to their right.
  const named = (word: string, query: (name: Name) => Query): Form[] => [
    form([QueryName, ScopeType], ElementType, (ctx, name, scope) => found(ctx, word, query(nameOf(name)), name, scope)),
    form([QueryName], ElementType, (ctx, name) => found(ctx, word, query(nameOf(name)), name)),
  ]

  // A role is found by its name, or by what's inside it, or with nothing
  // after it, as every element with that role. A role with no name is found
  // only by what's inside it, and given a name, says why that won't do.
  const role = (role: string): Form[] => {
    const word = cap(role)
    const unnamed = UNNAMED_ROLES.has(role)
    const takes = unnamed
      ? called(Content, `Containing "some text" (${article(word)} has no name to match exactly)`)
      : RoleName
    const query = (by: Inside | null): Query => {
      if (by === null) return { by: 'role', role }
      if (by instanceof Holding) return { by: 'role', role, has: by.found.handle }
      return unnamed ? { by: 'role', role, text: nameOf(by) } : { by: 'role', role, name: nameOf(by) }
    }
    const forms = [
      form([takes, ScopeType], ElementType, (ctx, by, scope) => found(ctx, word, query(by), by, scope)),
      form([takes], ElementType, (ctx, by) => found(ctx, word, query(by), by)),
    ]
    if (unnamed) forms.push(mistake([TextType], ([name]) => `${word} expected ${takes.phrase}, but got ${name}`))
    forms.push(
      form([ScopeType], ElementType, (ctx, scope) => found(ctx, word, query(null), null, scope)),
      form([], ElementType, (ctx) => found(ctx, word, query(null), null)),
    )
    return forms
  }

  for (const r of driver.roles) env.word(cap(r), ...role(r))
  for (const [kind, ...words] of QUERY_WORDS) {
    if (!driver.queries.includes(kind)) continue
    // Synonyms share their forms, and so describe what they found the same way.
    const forms = named(words[0], (name) => ({ by: kind, name }))
    for (const word of words) env.word(word, ...forms)
  }
  env.word(
    'Containing',
    form([TextType], PatternType, (_, text) => new Pattern(text)),
    form([called(ElementType, 'something on the page')], HoldingType, (_, found) => new Holding(found)),
  )

  const within = form(
    [called(ElementType, 'something on the page to look inside')],
    ScopeType,
    (_, found) => new Scope(found),
  )
  return env.word('Within', within).word('In', within)
}

// ---------------------------------------------------------------- actions

// The actions that take only the thing they act on.
type BareAction = Exclude<Action, { text: string } | { key: string }>['do']

const ACTION_WORDS: [BareAction, string][] = [
  ['click', 'Click'],
  ['double-click', 'Double-click'],
  ['hover', 'Hover'],
  ['focus', 'Focus'],
  ['check', 'Check'],
  ['uncheck', 'Uncheck'],
  ['clear', 'Clear'],
]

// Doing things, as far as the driver can.
export function actions(env: Env, driver: AnyDriver): Env {
  const can = (a: Action['do']) => driver.actions.includes(a)
  const act = (ctx: Context, found: Found, action: Action) => driver.act(ctx, found.handle, action)

  for (const [action, word] of ACTION_WORDS) {
    if (can(action))
      env.word(
        word,
        form([ElementType], (ctx, found) => act(ctx, found, { do: action })),
      )
  }
  if (can('fill')) {
    const fill = eitherOrder((ctx, found, text) => act(ctx, found, { do: 'fill', text }))
    // a table of label | value rows
    if (driver.queries.includes('label'))
      fill.push(
        form([TableType], async (ctx, rows) => {
          for (const [label, value] of rows)
            await driver.act(ctx, driver.find(ctx, null, { by: 'label', name: label }), { do: 'fill', text: value })
        }),
      )
    env.word('Fill', ...fill)
  }
  if (can('type')) env.word('Type', ...eitherOrder((ctx, found, text) => act(ctx, found, { do: 'type', text })))
  if (can('select')) env.word('Select', ...eitherOrder((ctx, found, text) => act(ctx, found, { do: 'select', text })))
  if (can('press')) {
    const Key = called(TextType, 'a "Key" to press')
    env.word(
      'Press',
      form([Key, ElementType], (ctx, key, found) => act(ctx, found, { do: 'press', key })),
      form([Key], (ctx, key) => driver.press(ctx, key)),
    )
  }
  return env
}

// ---------------------------------------------------------------- checks

type TextState = Extract<State, { text: Name }>['is']
type BareState = Exclude<State['is'], TextState | 'texts' | 'count'>

const STATE_WORDS: [BareState, string][] = [
  ['visible', 'Visible'],
  ['hidden', 'Hidden'],
  ['checked', 'Checked'],
  ['enabled', 'Enabled'],
  ['disabled', 'Disabled'],
  ['focused', 'Focused'],
  ['empty', 'Empty'],
]

// The states that take some text, like Value "eggs".
const TEXT_STATE_WORDS: [TextState, string][] = [
  ['value', 'Value'],
  ['text', 'Read'],
  ['containing', 'Contain'],
]

// Checking things: See, a word for each state the driver can check, and Not.
export function checks(env: Env, driver: AnyDriver): Env {
  const can = (s: State['is']) => driver.states.includes(s)

  if (can('visible')) {
    const visible = new Matcher('Visible', { is: 'visible' })
    const see = [form([ElementType], CheckType, (ctx, found) => visible.against(found, ctx, driver))]
    if (driver.queries.includes('text'))
      see.push(
        form([NameType], CheckType, (ctx, text) => {
          const handle = driver.find(ctx, null, { by: 'text', name: nameOf(text), loose: true })
          return visible.against(new Found(handle, `the text ${say(text)}`), ctx, driver)
        }),
      )
    env.word('See', ...see)
  }
  for (const [is, word] of STATE_WORDS) {
    if (can(is))
      env.word(
        word,
        form([], MatcherType, () => new Matcher(word, { is })),
      )
  }
  for (const [is, word] of TEXT_STATE_WORDS) {
    if (!can(is)) continue
    const forms = [form([NameType], MatcherType, (_, v) => new Matcher(`${word} ${say(v)}`, { is, text: nameOf(v) }))]
    // Read given a table: what everything found reads, in order, one row each.
    if (is === 'text' && can('texts'))
      forms.push(
        form([called(TableType, 'a table of one column')], MatcherType, (_, rows) => {
          const texts = rows.map((row) => {
            if (row.length !== 1)
              throw new SppError(`${word} expected a table of one column, but a row has ${row.length}`)
            return row[0]
          })
          return new Matcher(`${word} ${texts.map((t) => JSON.stringify(t)).join(', ')}`, { is: 'texts', texts })
        }),
      )
    env.word(word, ...forms)
  }
  if (can('count'))
    env.word(
      'Count',
      form([called(NumberType, 'how many there should be'), ElementType], CheckType, (ctx, count, found) =>
        new Matcher(`Count ${count}`, { is: 'count', count }).against(found, ctx, driver),
      ),
    )
  for (const [quantifier, ...words] of QUANTIFIER_WORDS) {
    const quantified = form([ElementType, MatcherType], CheckType, (ctx, found, matcher) =>
      quantify(quantifier, words[0], found, matcher, ctx, driver),
    )
    for (const word of words) env.word(word, quantified)
  }
  return env.word(
    'Not',
    form([MatcherType], MatcherType, (_, m) => m.negate()),
    form([CheckType], CheckType, (_, c) => c.negate()),
  )
}

// Each and No check everything a query finds, the way Inform 7 says "if each
// door is open" and "if no door is open". Each wants at least one, since a
// check of nothing would pass whatever the page showed, and every one to
// pass. No wants none to pass, and passes for none at all, like Not See.
// Not makes them "not every one" and "at least one".
type Quantifier = 'each' | 'no'

const QUANTIFIER_WORDS: [Quantifier, ...string[]][] = [
  ['each', 'Each', 'Every'],
  ['no', 'No', 'None'],
]

// The states a matcher checks of everything found together, not of each.
const TOGETHER: readonly State['is'][] = ['texts', 'count']

function quantify<C extends Context, H>(
  quantifier: Quantifier,
  word: string,
  found: Found,
  matcher: Matcher,
  ctx: C,
  driver: Driver<C, H>,
): Expectation {
  // Each Checkbox "Bought" Checked, as it was written.
  const label = `${word} ${found.label.replace(/^the /, '')} ${matcher.describe()}`
  if (TOGETHER.includes(matcher.state.is)) {
    if (quantifier === 'each') return matcher.against(found, ctx, driver)
    throw new SppError(`${word} checks each thing found, but ${matcher.describe()} checks them all together`)
  }
  const each = quantifier === 'each'
  return new Expectation(label, (not) =>
    driver.retry(ctx, async () => {
      const all = await driver.all(ctx, found.handle as H)
      // Whether each one passes the matcher, checked once: retry repeats it.
      const passes: boolean[] = []
      for (const handle of all)
        passes.push(
          await driver.expect(ctx, handle, matcher.state, matcher.negated, true).then(
            () => true,
            () => false,
          ),
        )
      const wrong = passes.findIndex((p) => p !== each)
      const of = `number ${wrong + 1} of ${all.length}`
      if (!not) {
        if (each && !all.length) throw new SppError(`${label}, but there was nothing to check`)
        // The one that's wrong is the opposite of the matcher, for Each.
        if (wrong >= 0) throw new SppError(`${label}, but ${of} is ${(each ? matcher.negate() : matcher).describe()}`)
      } else if (wrong < 0) {
        const n = all.length
        const which = each ? 'every one' : 'none'
        const but = n ? `${which} of the ${n} found is ${matcher.describe()}` : 'there was nothing to check'
        throw new SppError(`Not ${label}, but ${but}`)
      }
    }),
  )
}

// ---------------------------------------------------------------- the end of a step

// What's wrong with a step that leaves these behind, said the same way by
// leftovers and settle.
const unchecked = (matcher: string) => `Nothing to check is ${matcher}. Put what should be ${matcher} before it.`
const unused = (values: string[]) => `Nothing used ${values.join(', ')}. Is the step missing a verb?`

// settle's rule, for the checker: what settle would say about a step that
// leaves values of these types, or null if it would be happy.
export function leftovers(stack: readonly { name: string; shown: string }[]): string | null {
  const rest = [...stack]
  for (let v = rest.pop(); v; v = rest.pop()) {
    if (v.name === CheckType.name) continue
    if (v.name === ElementType.name && rest.at(-1)?.name === MatcherType.name) {
      rest.pop()
      continue
    }
    if (v.name === MatcherType.name) return unchecked(v.shown)
    return unused([v, ...rest.reverse()].map((x) => x.shown))
  }
  return null
}

// A settle for a driver: it checks whatever assertions a step left behind.
// Anything else left over is a sentence with no verb, which is almost always
// a mistake worth saying so.
export function settler<C extends Context, H>(driver: Driver<C, H>) {
  return async function settle(stack: Stack, ctx: C): Promise<void> {
    const pending: Expectation[] = []
    while (stack.length) {
      // A noun's value is checked as what it is underneath.
      const v = unwrap(stack.pop())
      const under = unwrap(stack.at(-1))
      if (v instanceof Expectation) pending.push(v)
      else if (v instanceof Found && under instanceof Matcher) {
        stack.pop()
        pending.push(under.against(v, ctx, driver))
      } else if (v instanceof Matcher) {
        throw new SppError(unchecked(v.describe()))
      } else {
        throw new SppError(unused([v, ...stack.reverse()].map(describe)))
      }
    }
    // Checked in reading order: the stack holds them right to left.
    for (const e of pending.reverse()) await e.check(false)
  }
}
