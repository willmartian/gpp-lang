// What preset.ts's Vite plugin makes: the project's .gpp files and Markdown,
// path → contents.
declare module 'virtual:gpp-lang/defines' {
  const sources: Record<string, string>
  export default sources
}
