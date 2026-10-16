// What stories.ts's Vite plugin makes: the project's .spp files and Markdown,
// path → contents.
declare module 'virtual:spp-lang/defines' {
  const sources: Record<string, string>
  export default sources
}
