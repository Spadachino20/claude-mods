export type Frame = string

declare module 'claude-code' {
  interface PluginState {
    'pausa-activa': { frame: Frame }
  }
}
