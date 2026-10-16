// A post editor, in plain DOM, for the stories to test.

export interface EditorArgs {
  title: string
  tags: string[]
  onSave: (title: string) => void
}

export function editor({ title, tags, onSave }: EditorArgs): HTMLElement {
  const form = document.createElement('form')
  form.innerHTML = `
    <h1>Edit post</h1>
    <label>Title <input name="title"></label>
    <ul aria-label="Tags"></ul>
    <button type="submit">Save</button>
    <button type="button">Delete</button>
    <p role="status"></p>
  `
  const field = form.querySelector('input')
  const list = form.querySelector('ul')
  const status = form.querySelector('[role="status"]')
  const remove = form.querySelector('button[type="button"]')
  if (!field || !list || !status || !remove) throw new Error('The editor is missing a part')

  field.value = title
  for (const tag of tags) list.append(Object.assign(document.createElement('li'), { textContent: tag }))

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    form.querySelector('[role="alert"]')?.remove()
    const typed = field.value.trim()
    if (!typed) {
      form.append(Object.assign(document.createElement('p'), { role: 'alert', textContent: 'Give it a title' }))
      return
    }
    // A moment later, as a request would be.
    setTimeout(() => {
      status.textContent = 'Draft saved'
      onSave(typed)
    }, 100)
  })

  // The confirmation opens in a portal, outside the story's canvas.
  remove.addEventListener('click', () => {
    const dialog = document.createElement('div')
    dialog.setAttribute('role', 'dialog')
    dialog.setAttribute('aria-label', 'Delete post?')
    dialog.innerHTML = '<p>This cannot be undone.</p><button type="button">Cancel</button>'
    dialog.querySelector('button')?.addEventListener('click', () => dialog.remove())
    document.body.append(dialog)
  })

  return form
}
