// The language's words. Every backend has them all, on a driver of its own
// (driver.ts), which a step finds in its context, so the words are made once,
// and the checker reads the same ones that run.
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
// A template plays on one page, already open, so its words have no Visit,
// Reload, Back, At or Titled, and say why when used.

import type { Stack } from '../language/cognate.ts'
import { core, describe, Env, SppError, unwrap } from '../language/cognate.ts'
import type { Context, Doc, Form } from '../language/types.ts'
import { article, called, formsFor, mistake, NumberType, oneOf, TableType, TextType, type } from '../language/types.ts'
import type { Action, AnyDriver, Name, Query, QueryKind, State } from './driver.ts'

// The driver a step runs with: its context's.
function driverOf(ctx: Context): AnyDriver {
  if (!ctx.driver) throw new Error('These words ran without a driver: a backend gives one in their context')
  return ctx.driver
}

// What every word drives: whatever driver the step's context has.
const driver: AnyDriver = {
  find: (ctx, root, query) => driverOf(ctx).find(ctx, root, query),
  act: (ctx, target, action) => driverOf(ctx).act(ctx, target, action),
  press: (ctx, key) => driverOf(ctx).press(ctx, key),
  expect: (ctx, target, state, not, once) => driverOf(ctx).expect(ctx, target, state, not, once),
  all: (ctx, target) => driverOf(ctx).all(ctx, target),
  retry: (ctx, attempt) => driverOf(ctx).retry(ctx, attempt),
  visit: (ctx, where) => driverOf(ctx).visit(ctx, where),
  reload: (ctx) => driverOf(ctx).reload(ctx),
  back: (ctx) => driverOf(ctx).back(ctx),
  expectPage: (ctx, state, not) => driverOf(ctx).expectPage(ctx, state, not),
}

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
  against(target: Found, ctx: Context) {
    return new Expectation(`${target.label} ${this.describe()}`, (not) =>
      driver.expect(ctx, target.handle, this.state, this.negated !== not),
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
const QUERY_WORDS: [QueryKind, Omit<Doc, 'group'>, ...string[]][] = [
  [
    'label',
    {
      summary: 'Finds a form control by its label.',
      examples: ['When I Fill the Field "Email" with "will@example.com"', 'When I Check the Label "Remember me"'],
    },
    'Field',
    'Label',
  ],
  [
    'text',
    { summary: 'Finds an element by its text.', examples: ['When I Click the Text "Forgot your password?"'] },
    'Text',
  ],
  [
    'placeholder',
    {
      summary: 'Finds a form control by its placeholder.',
      examples: ['When I Fill the Placeholder "Search" with "kale"'],
    },
    'Placeholder',
  ],
  [
    'alt',
    { summary: 'Finds an image by its alt text.', examples: ['Then I should See the Alt "Company logo"'] },
    'Alt',
  ],
  ['title', { summary: 'Finds an element by its title.', examples: ['When I Hover the Title "Settings"'] }, 'Title'],
  [
    'testId',
    {
      summary: 'Finds an element by its test id. A last resort: it stands out in review.',
      examples: ['When I Click the TestId "chart-bar-3"'],
    },
    'TestId',
  ],
]

// Every ARIA role that makes sense to query by name, as a word.
export const ARIA_ROLES: readonly string[] =
  `alert alertdialog application article banner blockquote button caption cell checkbox
  code columnheader combobox complementary contentinfo definition deletion dialog directory document
  emphasis feed figure form generic grid gridcell group heading img insertion link list listbox
  listitem log main marquee math meter menu menubar menuitem menuitemcheckbox menuitemradio navigation
  none note option paragraph presentation progressbar radio radiogroup region row rowgroup rowheader
  scrollbar search searchbox separator slider spinbutton status strong subscript superscript switch
  tab table tablist tabpanel term textbox time timer toolbar tooltip tree treegrid treeitem`.split(/\s+/)

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

// Finding things: a word for each role and query, then Containing and Within.
function queries(env: Env): Env {
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

  for (const r of ARIA_ROLES) env.word(cap(r), ...role(r))
  const roles = ARIA_ROLES.filter((r) => !UNNAMED_ROLES.has(r)).map(cap)
  const unnamed = ARIA_ROLES.filter((r) => UNNAMED_ROLES.has(r)).map(cap)
  env.doc(
    {
      group: 'Finding',
      title: 'Roles',
      summary: 'Finds an element by its ARIA role and accessible name, which must match exactly.',
      examples: [
        'When I Click the Button "Sign in"',
        'Then I should See the Heading "Welcome back"',
        'Then the Dialog should be Visible',
      ],
    },
    ...roles,
  )
  env.doc(
    {
      group: 'Finding',
      title: 'Roles with no name',
      summary: "Finds an element by its ARIA role and the text inside it. These roles aren't named by their content.",
      examples: [
        'When I Click the Button "Destroy" Within the Listitem Containing "feed the cat"',
        'Then the Alert Containing "Saved" should be Visible',
      ],
    },
    ...unnamed,
  )
  for (const [kind, doc, ...words] of QUERY_WORDS) {
    // Synonyms share their forms, and so describe what they found the same way.
    const forms = named(words[0], (name) => ({ by: kind, name }))
    for (const word of words) env.word(word, ...forms)
    env.doc({ group: 'Finding', ...doc }, ...words)
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
  return env
    .word('Within', within)
    .word('In', within)
    .doc(
      {
        group: 'Finding',
        summary: 'Matches part of a name or text, ignoring case, or an element with another inside it.',
        examples: [
          'When I Click the Button "Remove" Within the Row Containing "Kale"',
          'Then I should See the Row Containing the Button "Undo"',
        ],
      },
      'Containing',
    )
    .doc(
      {
        group: 'Finding',
        summary: 'Looks inside another element.',
        examples: [
          'When I Click the Link "Help" Within the Navigation',
          'When I Click the Button "Close" In the Dialog',
        ],
      },
      'Within',
      'In',
    )
}

// ---------------------------------------------------------------- actions

// The actions that take only the thing they act on.
type BareAction = Exclude<Action, { text: string } | { key: string }>['do']

const ACTION_WORDS: [BareAction, string, summary: string, example: string][] = [
  ['click', 'Click', 'Clicks an element.', 'When I Click the Button "Sign in"'],
  ['double-click', 'Double-click', 'Double-clicks an element.', 'When I Double-click the Text "buy milk"'],
  ['hover', 'Hover', 'Moves the mouse over an element.', 'When I Hover the Button "Share"'],
  ['focus', 'Focus', 'Focuses an element.', 'When I Focus the Field "Email"'],
  ['check', 'Check', 'Checks a checkbox or radio button.', 'When I Check the Checkbox "Terms"'],
  ['uncheck', 'Uncheck', 'Unchecks a checkbox.', 'When I Uncheck the Checkbox "Newsletter"'],
  ['clear', 'Clear', 'Empties a field.', 'When I Clear the Field "Search"'],
]

// Doing things.
function actions(env: Env): Env {
  const act = (ctx: Context, found: Found, action: Action) => driver.act(ctx, found.handle, action)

  for (const [action, word, summary, example] of ACTION_WORDS)
    env
      .word(
        word,
        form([ElementType], (ctx, found) => act(ctx, found, { do: action })),
      )
      .doc({ group: 'Doing', summary, examples: [example] }, word)
  const fill = eitherOrder((ctx, found, text) => act(ctx, found, { do: 'fill', text }))
  // a table of label | value rows
  fill.push(
    form([TableType], async (ctx, rows) => {
      for (const [label, value] of rows)
        await driver.act(ctx, driver.find(ctx, null, { by: 'label', name: label }), { do: 'fill', text: value })
    }),
  )
  env.word('Fill', ...fill).doc(
    {
      group: 'Doing',
      summary: 'Fills a field, replacing what was in it. Given a table, fills each field by its label.',
      examples: [
        'When I Fill the Field "Email" with "will@example.com"',
        'When I Fill "hunter2" into the Field "Password"',
        'When I Fill in the form:\n  | Email    | will@example.com |\n  | Password | hunter2          |',
      ],
    },
    'Fill',
  )
  env.word('Type', ...eitherOrder((ctx, found, text) => act(ctx, found, { do: 'type', text }))).doc(
    {
      group: 'Doing',
      summary: 'Types into a field one key at a time, as a person would.',
      examples: ['When I Type "kale" into the Field "Search"'],
    },
    'Type',
  )
  env.word('Select', ...eitherOrder((ctx, found, text) => act(ctx, found, { do: 'select', text }))).doc(
    {
      group: 'Doing',
      summary: 'Chooses an option in a select box.',
      examples: ['When I Select "Blue" in the Combobox "Colour"'],
    },
    'Select',
  )
  const Key = called(TextType, 'a "Key" to press')
  env.word(
    'Press',
    form([Key, ElementType], (ctx, key, found) => act(ctx, found, { do: 'press', key })),
    form([Key], (ctx, key) => driver.press(ctx, key)),
  )
  env.doc(
    {
      group: 'Doing',
      summary: 'Presses a key, on an element or on the page.',
      examples: ['When I Press "Enter"', 'When I Press "Escape" in the Dialog'],
    },
    'Press',
  )
  return env
}

// ---------------------------------------------------------------- checks

type TextState = Extract<State, { text: Name }>['is']
type BareState = Exclude<State['is'], TextState | 'texts' | 'count'>

const STATE_WORDS: [BareState, string, summary: string, example: string][] = [
  ['visible', 'Visible', 'Checks an element is visible.', 'Then the Dialog "Cookies" should be Visible'],
  ['hidden', 'Hidden', 'Checks an element is hidden, or not there.', 'Then the Dialog "Cookies" should be Hidden'],
  [
    'checked',
    'Checked',
    'Checks a checkbox or radio button is checked.',
    'Then the Checkbox "Terms" should be Checked',
  ],
  ['enabled', 'Enabled', 'Checks an element is enabled.', 'Then the Button "Save" should be Enabled'],
  ['disabled', 'Disabled', 'Checks an element is disabled.', 'Then the Button "Save" should be Disabled'],
  ['focused', 'Focused', 'Checks an element has focus.', 'Then the Field "Email" should be Focused'],
  ['empty', 'Empty', 'Checks an element has no text, or a field no value.', 'Then the Field "Search" should be Empty'],
]

// The states that take some text, like Value "eggs".
const TEXT_STATE_WORDS: [TextState, string, Omit<Doc, 'group'>][] = [
  [
    'value',
    'Value',
    {
      summary: "Checks a field's value.",
      examples: ['Then the Field "Email" should have the Value "will@example.com"'],
    },
  ],
  [
    'text',
    'Read',
    {
      summary: "Checks an element's whole text. Given a table, checks what everything found reads, in order.",
      examples: [
        'Then the Status should Read "2 items left"',
        'Then the Listitem should Read:\n  | buy some cheese |\n  | feed the cat    |',
      ],
    },
  ],
  [
    'containing',
    'Contain',
    { summary: "Checks part of an element's text.", examples: ['Then the Alert should Contain "saved"'] },
  ],
]

// Checking things: See, a word for each state, and Not.
function checks(env: Env): Env {
  const visible = new Matcher('Visible', { is: 'visible' })
  const see = [
    form([ElementType], CheckType, (ctx, found) => visible.against(found, ctx)),
    form([NameType], CheckType, (ctx, text) => {
      const handle = driver.find(ctx, null, { by: 'text', name: nameOf(text), loose: true })
      return visible.against(new Found(handle, `the text ${say(text)}`), ctx)
    }),
  ]
  env.word('See', ...see).doc(
    {
      group: 'Checking',
      summary: 'Checks an element is visible, or some text anywhere on the page.',
      examples: ['Then I should See the Heading "Welcome back"', 'Then I should See "Saved"'],
    },
    'See',
  )
  for (const [is, word, summary, example] of STATE_WORDS)
    env
      .word(
        word,
        form([], MatcherType, () => new Matcher(word, { is })),
      )
      .doc({ group: 'Checking', summary, examples: [example] }, word)
  for (const [is, word, doc] of TEXT_STATE_WORDS) {
    const forms = [form([NameType], MatcherType, (_, v) => new Matcher(`${word} ${say(v)}`, { is, text: nameOf(v) }))]
    // Read given a table: what everything found reads, in order, one row each.
    if (is === 'text')
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
    env.word(word, ...forms).doc({ group: 'Checking', ...doc }, word)
  }
  env
    .word(
      'Count',
      form([called(NumberType, 'how many there should be'), ElementType], CheckType, (ctx, count, found) =>
        new Matcher(`Count ${count}`, { is: 'count', count }).against(found, ctx),
      ),
    )
    .doc(
      {
        group: 'Lists',
        summary: 'Checks how many elements a query finds.',
        examples: ['Then I should Count 3 Row Within the Table'],
      },
      'Count',
    )
  for (const [quantifier, doc, ...words] of QUANTIFIER_WORDS) {
    const quantified = form([ElementType, MatcherType], CheckType, (ctx, found, matcher) =>
      quantify(quantifier, words[0], found, matcher, ctx),
    )
    for (const word of words) env.word(word, quantified)
    env.doc({ group: 'Lists', ...doc }, ...words)
  }
  return env
    .word(
      'Not',
      form([MatcherType], MatcherType, (_, m) => m.negate()),
      form([CheckType], CheckType, (_, c) => c.negate()),
    )
    .doc(
      {
        group: 'Checking',
        summary: 'Turns a check around.',
        examples: ['Then I should Not See the Button "Delete"', 'Then the Checkbox "Terms" should Not be Checked'],
      },
      'Not',
    )
}

// Each and No check everything a query finds, the way Inform 7 says "if each
// door is open" and "if no door is open". Each wants at least one, since a
// check of nothing would pass whatever the page showed, and every one to
// pass. No wants none to pass, and passes for none at all, like Not See.
// Not makes them "not every one" and "at least one".
type Quantifier = 'each' | 'no'

const QUANTIFIER_WORDS: [Quantifier, Omit<Doc, 'group'>, ...string[]][] = [
  [
    'each',
    {
      summary: 'Checks every element a query finds. Fails if it finds none.',
      examples: ['Then Each Checkbox "Bought" should be Checked'],
    },
    'Each',
    'Every',
  ],
  [
    'no',
    {
      summary: 'Checks no element a query finds passes. Passes if it finds none.',
      examples: ['Then No Checkbox "Bought" should be Checked'],
    },
    'No',
    'None',
  ],
]

// The states a matcher checks of everything found together, not of each.
const TOGETHER: readonly State['is'][] = ['texts', 'count']

function quantify(quantifier: Quantifier, word: string, found: Found, matcher: Matcher, ctx: Context): Expectation {
  // Each Checkbox "Bought" Checked, as it was written.
  const label = `${word} ${found.label.replace(/^the /, '')} ${matcher.describe()}`
  if (TOGETHER.includes(matcher.state.is)) {
    if (quantifier === 'each') return matcher.against(found, ctx)
    throw new SppError(`${word} checks each thing found, but ${matcher.describe()} checks them all together`)
  }
  const each = quantifier === 'each'
  return new Expectation(label, (not) =>
    driver.retry(ctx, async () => {
      const all = await driver.all(ctx, found.handle)
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

// The end of a step: it checks whatever assertions the step left behind.
// Anything else left over is a sentence with no verb, which is almost always
// a mistake worth saying so.
export async function settle(stack: Stack, ctx: Context): Promise<void> {
  const pending: Expectation[] = []
  while (stack.length) {
    // A noun's value is checked as what it is underneath.
    const v = unwrap(stack.pop())
    const under = unwrap(stack.at(-1))
    if (v instanceof Expectation) pending.push(v)
    else if (v instanceof Found && under instanceof Matcher) {
      stack.pop()
      pending.push(under.against(v, ctx))
    } else if (v instanceof Matcher) {
      throw new SppError(unchecked(v.describe()))
    } else {
      throw new SppError(unused([v, ...stack.reverse()].map(describe)))
    }
  }
  // Checked in reading order: the stack holds them right to left.
  for (const e of pending.reverse()) await e.check(false)
}

// ---------------------------------------------------------------- the page

const Path = called(TextType, 'a "/path" or URL')
const PAGE_WORDS = ['Visit', 'Reload', 'Back', 'At', 'Titled']

// Going somewhere on the page.
function navigation(env: Env): Env {
  return env
    .word(
      'Visit',
      form([Path], (ctx, where) => driver.visit(ctx, where)),
    )
    .word(
      'Reload',
      form([], (ctx) => driver.reload(ctx)),
    )
    .word(
      'Back',
      form([], (ctx) => driver.back(ctx)),
    )
    .doc({ group: 'Doing', summary: 'Goes to a path on the app, or a URL.', examples: ['Given I Visit "/"'] }, 'Visit')
    .doc({ group: 'Doing', summary: 'Reloads the page.', examples: ['When I Reload the page'] }, 'Reload')
    .doc(
      { group: 'Doing', summary: "Goes back, as the browser's back button does.", examples: ['When I go Back'] },
      'Back',
    )
}

// Checks on the page itself.
function pageChecks(env: Env): Env {
  return env
    .word(
      'At',
      form(
        [Path],
        CheckType,
        (ctx, where) =>
          new Expectation(`At ${JSON.stringify(where)}`, (not) => driver.expectPage(ctx, { is: 'at', where }, not)),
      ),
    )
    .word(
      'Titled',
      form(
        [NameType],
        CheckType,
        (ctx, title) =>
          new Expectation(`Titled ${say(title)}`, (not) =>
            driver.expectPage(ctx, { is: 'titled', title: nameOf(title) }, not),
          ),
      ),
    )
    .doc(
      {
        group: 'Checking',
        summary: "Checks the page's path, or its whole URL.",
        examples: ['Then I should be At "/dashboard"'],
      },
      'At',
    )
    .doc(
      {
        group: 'Checking',
        summary: "Checks the page's title.",
        examples: ['Then the page should be Titled "Dashboard"'],
      },
      'Titled',
    )
}

// ---------------------------------------------------------------- the vocabulary

const vocabularies = new Map<boolean, Env>()

// Every word, as .spp files and Markdown have them, or as a template does,
// where the page's words say why there are none. Made once, since they're the
// same wherever they run.
export function words({ template = false }: { template?: boolean } = {}): Env {
  const known = vocabularies.get(template)
  if (known) return known
  const env = queries(new Env(core()))
  if (!template) navigation(env)
  actions(env)
  checks(env)
  if (!template) pageChecks(env)
  else
    for (const word of PAGE_WORDS)
      env.word(
        word,
        mistake([], () => `A template plays on one page, already open, so it has no ${word}`),
      )
  vocabularies.set(template, env)
  return env
}
