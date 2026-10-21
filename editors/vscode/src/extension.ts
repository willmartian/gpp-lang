// Starts Gherkin++'s language server for .gpp files, the ```gpp blocks in
// Markdown files, and the gpp`…` templates, Storybook play functions, in
// JavaScript and TypeScript. Running and debugging scenarios is Playwright's VS Code
// extension's job: Gherkin++'s generated tests map back to the .gpp files, so
// it puts its run and debug buttons beside each scenario.
//
// Which server: the one the gpp.path setting names; else the
// workspace's own node_modules/gpp-lang, so the editor agrees with the tests it
// runs, but only in a trusted workspace, since that's running the
// workspace's code; else the one bundled with this extension.

import fs from 'node:fs'
import path from 'node:path'
import type { ExtensionContext } from 'vscode'
import { window, workspace } from 'vscode'
import type { LanguageClientOptions, ServerOptions } from 'vscode-languageclient/node'
import { LanguageClient, TransportKind } from 'vscode-languageclient/node'

let client: LanguageClient | undefined

export async function activate(context: ExtensionContext): Promise<void> {
  const server = findServer(context)
  // The bundled server runs on VS Code's own Node; any other on gpp.node,
  // since it may be Gherkin++'s source, which needs a Node that runs TypeScript.
  const folder = workspace.workspaceFolders?.[0]
  const runtime = server.bundled
    ? undefined
    : resolveNode(workspace.getConfiguration('gpp', folder).get<string>('node'), folder?.uri.fsPath ?? '')
  const run = { module: server.module, args: server.args, transport: TransportKind.stdio, runtime }
  const serverOptions: ServerOptions = { run, debug: run }
  const clientOptions: LanguageClientOptions = {
    documentSelector: [
      { scheme: 'file', language: 'gpp' },
      { scheme: 'file', language: 'markdown' },
      ...['javascript', 'javascriptreact', 'typescript', 'typescriptreact'].map((language) => ({
        scheme: 'file',
        language,
      })),
    ],
    // gpp.config.ts says which files make up each project, and their backends.
    synchronize: {
      fileEvents: workspace.createFileSystemWatcher('**/{*.gpp,*.md,*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}}'),
    },
    // Loading gpp.config.ts runs it, so not in an untrusted workspace.
    initializationOptions: { trusted: workspace.isTrusted },
  }
  client = new LanguageClient('gpp', 'Gherkin++', serverOptions, clientOptions)
  await client.start()

  context.subscriptions.push(
    workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('gpp.path')) {
        window.showInformationMessage('Reload the window to use the new Gherkin++ language server.')
      }
    }),
  )
}

export function deactivate(): Thenable<void> | undefined {
  return client?.stop()
}

// gpp.node: a command on PATH, like "node", or a path, relative to the
// workspace folder, like a script that sets up the environment first.
function resolveNode(setting: string | undefined, root: string): string {
  if (!setting) return 'node'
  return setting.includes('/') || setting.includes('\\') ? path.resolve(root, setting) : setting
}

function findServer(context: ExtensionContext): { module: string; args: string[]; bundled: boolean } {
  const bundled = { module: context.asAbsolutePath('out/server.js'), args: [], bundled: true }
  if (!workspace.isTrusted) return bundled

  for (const folder of workspace.workspaceFolders ?? []) {
    const configured = workspace.getConfiguration('gpp', folder).get<string>('path')
    if (configured) return { module: path.resolve(folder.uri.fsPath, configured), args: ['lsp'], bundled: false }
  }
  for (const folder of workspace.workspaceFolders ?? []) {
    const local = path.join(folder.uri.fsPath, 'node_modules', 'gpp-lang', 'dist', 'bin', 'gpp-lang.js')
    if (fs.existsSync(local)) return { module: local, args: ['lsp'], bundled: false }
  }
  return bundled
}
