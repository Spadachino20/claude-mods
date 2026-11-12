import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, Timer } from 'claude-code'

import type { Mode } from '../types'
import { H, SPRITES, W } from './sprites'

const mode = atom({ plugin: 'clawd-mascota', key: 'mode' } as const, 'idle')

// ---------- lógica de estados ----------
const DESIGN_PROMPT = /diseñ|design|\bui\b|\bux\b|interfaz|landing|logo|css|tipograf|paleta|figma|maquet/i
const DESIGN_SKILL = /design|impeccable|ui-ux|taste|redesign|brand|artifact/i
const DESIGN_FILE = /\.(css|scss|sass|less|html|svg|tsx|jsx|vue|svelte|astro|figma)$/i
const READ_TOOLS = /^(Read|Grep|Glob|WebFetch|WebSearch|ToolSearch|LS)$|read_page|get_page_text|find|screenshot|search/i
const WRITE_TOOLS = /^(Bash|PowerShell|Edit|Write|NotebookEdit|MultiEdit)$|javascript|form_input|type/i

let base: Mode = 'idle'
let designTurn = false
let revert: Timer | undefined
let nap: Timer | undefined

async function show($: EngineInterface, m: Mode, ms?: number) {
  revert?.cancel()
  nap?.cancel()
  await update($, mode, () => m)
  if (ms) revert = $.clock.after(ms, () => void show($, base))
  else if (m === 'idle') nap = $.clock.after(120_000, () => void update($, mode, () => 'sleep'))
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    base = 'idle'
    await show($, 'idle')
    return next(e)
  })

  on('prompt.submit', async ($, e, next) => {
    designTurn = DESIGN_PROMPT.test(e.text ?? '')
    return next(e)
  })

  on('turn.start', async ($, e, next) => {
    base = 'thinking'
    await show($, designTurn ? 'designing' : 'thinking')
    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    const input = (e as { input?: Record<string, unknown> }).input ?? {}
    const path = String(input.file_path ?? input.path ?? input.notebook_path ?? '')
    const skill = String(input.skill ?? '')
    if (e.tool === 'Skill' && DESIGN_SKILL.test(skill)) designTurn = true

    const m: Mode =
      designTurn || DESIGN_FILE.test(path) ? 'designing'
      : READ_TOOLS.test(e.tool) ? 'reading'
      : WRITE_TOOLS.test(e.tool) ? 'typing'
      : 'thinking'
    base = m
    await show($, m)

    const res = await next(e)
    if ('deny' in res && res.deny) await show($, 'sad', 3000)
    else if (res.isError) await show($, 'alert', 3000)
    return res
  })

  on('turn.complete', async ($, e, next) => {
    if (!e.agentId) {
      base = 'idle'
      designTurn = false
      await show($, e.isAborted ? 'sad' : 'done', 3500)
    }
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.surface === 'terminal' || e.props.hasSurvey) return next(e)
    const m = await read($, mode)
    const { Box, Svg } = $.ui.resolve(e)
    return (
      <Box justifyContent="flex-end" width="100%">
        <Svg source={SPRITES[m]} alt={`Clawd: ${m}`} width={W} height={H} isInteractive />
      </Box>
    )
  })
}
