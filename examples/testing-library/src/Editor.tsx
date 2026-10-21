// A post editor, in React, for the tests to test.

import type { FormEvent } from 'react'
import { useState } from 'react'

export interface EditorProps {
  title: string
  tags: string[]
  onSave: (title: string) => void
}

export function Editor({ title, tags, onSave }: EditorProps) {
  const [typed, setTyped] = useState(title)
  const [status, setStatus] = useState('')
  const [missing, setMissing] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const save = (event: FormEvent) => {
    event.preventDefault()
    setMissing(!typed.trim())
    if (!typed.trim()) return
    // A moment later, as a request would be.
    setTimeout(() => {
      setStatus('Draft saved')
      onSave(typed.trim())
    }, 100)
  }

  return (
    <form onSubmit={save}>
      <h1>Edit post</h1>
      <label>
        Title <input name="title" value={typed} onChange={(e) => setTyped(e.target.value)} />
      </label>
      <ul aria-label="Tags">
        {tags.map((tag) => (
          <li key={tag}>{tag}</li>
        ))}
      </ul>
      <button type="submit">Save</button>
      <button type="button" onClick={() => setConfirming(true)}>
        Delete
      </button>
      <p role="status">{status}</p>
      {missing && <p role="alert">Give it a title</p>}
      {confirming && (
        <div role="dialog" aria-label="Delete post?">
          <p>This cannot be undone.</p>
          <button type="button" onClick={() => setConfirming(false)}>
            Cancel
          </button>
        </div>
      )}
    </form>
  )
}
