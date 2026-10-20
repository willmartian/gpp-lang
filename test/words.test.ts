import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { analyze, leftovers, words as vocabulary } from '@gpp-lang/core'
import { discover, load } from '@gpp-lang/core/node'
import { listWords } from 'gpp-lang'

// The listing for some .gpp files, given as name → contents.
function listWordsOf(files: Record<string, string>) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gpp-words-'))
  for (const [name, src] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), src)
  const words = vocabulary()
  return listWords(words, analyze(discover([dir]).map(load), { words, settle: leftovers }), dir)
}

test('a built-in word is listed with what it does, its forms and an example', () => {
  const lines = listWordsOf({}).split('\n')
  const click = lines.indexOf('Click')
  assert.deepEqual(lines.slice(click, click + 4), [
    'Click',
    '  Clicks an element.',
    '  Element ->    takes something on the page',
    '  Example: When I Click the Button "Sign in"',
  ])
})

test('words that share a doc are listed together, under its group', () => {
  const lines = listWordsOf({}).split('\n')
  const each = lines.indexOf('Each, Every')
  assert.notEqual(each, -1)
  assert.ok(lines.indexOf('Lists:') < each)
  assert.match(lines.find((l) => l.startsWith('Roles: ')) ?? '', /^Roles: Alertdialog, Application, /)
})

test('a word with several forms lists each, with what it takes', () => {
  const lines = listWordsOf({}).split('\n')
  const press = lines.indexOf('Press')
  assert.deepEqual(lines.slice(press, press + 4), [
    'Press',
    '  Presses a key, on an element or on the page.',
    '  Text, Element ->    takes a "Key" to press, then something on the page',
    '  Text ->             takes a "Key" to press',
  ])
})

test("a project's Defines are listed with their forms and where they are", () => {
  const out = listWordsOf({ 'words.gpp': 'Define: Add Text (Item)\n  Fill the Field "Item" with Item' })
  assert.match(out, /Defined in this project\n\nAdd\n {2}Text \(Item\) -> {4}words\.gpp:1$/)
})

test("a Define's header is listed with the names it gives", () => {
  const out = listWordsOf({ 'words.gpp': 'Define: Move Text (Item) to Element\n  Fill Element with Item' })
  assert.match(out, /\nMove\n {2}Text \(Item\), Element -> {4}words\.gpp:1$/)
})

test('a noun is listed as leaving its type', () => {
  const out = listWordsOf({ 'words.gpp': 'Define: Cart\n  the Region "Cart"' })
  assert.match(out, /\nCart\n {2}-> Cart {4}words\.gpp:1$/)
})

test('a word with several Defines lists each, with where it is', () => {
  const out = listWordsOf({ 'words.gpp': 'Define: Go\n  Visit "/"\nDefine: Go Text (Where)\n  Visit Where' })
  assert.match(out, /\nGo\n {2}-> {4}words\.gpp:1\n {2}Text \(Where\) -> {4}words\.gpp:3$/)
})

test('with no Defines, the listing says so', () => {
  assert.match(listWordsOf({}), /Defined in this project\n\nNone yet\.$/)
})

test('step keywords are listed as the words they are', () => {
  const lines = listWordsOf({}).split('\n')
  const and = lines.indexOf('And, But')
  assert.deepEqual(lines.slice(and, and + 3), [
    'And, But',
    "  Starts a step like the one above it. A scenario can't start with one.",
    '  Step, Mode -> Mode    takes a step, then a Given, When or Then above it',
  ])
})
