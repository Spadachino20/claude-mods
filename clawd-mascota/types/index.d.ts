export type Mode =
  | 'idle' | 'sleep' | 'thinking' | 'typing' | 'reading'
  | 'designing' | 'alert' | 'done' | 'sad'

declare module 'claude-code' {
  interface PluginState {
    'clawd-mascota': { mode: Mode }
  }
}
