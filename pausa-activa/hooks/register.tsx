import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

const PANE = 'pausa-activa'
// el último cuadro de pixel art que mandó el juego (SVG); vacío en el menú
const frame = atom({ plugin: 'pausa-activa', key: 'frame' } as const, '')

// El panel se abre cuando Claude arranca un turno y se cierra cuando termina.
// Solo el turno principal: los subagentes no lo abren ni lo cierran.
export const register: Register = on => {
  on('turn.start', async ($, e, next) => {
    if (!e.agentId) {
      await update($, frame, () => '')
      void $.ui.open({ id: PANE, title: 'Pausa activa', columns: 56 })
    }
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    if (!e.agentId) void $.ui.close({ id: PANE })
    return next(e)
  })

  on('ui.message', async ($, e, next) => {
    const svg = (e.data as { svg?: unknown } | null)?.svg
    if (e.requestId === PANE && typeof svg === 'string') await update($, frame, () => svg)
    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Text } = $.ui.resolve(e)
    if (e.surface === 'desktop') {
      const { Box, Client, Svg } = $.ui.resolve(e)
      const svg = await read($, frame)
      return (
        <Box flexDirection="column">
          <Client key="juego" module="./juego.tsx" props={{ surface: 'desktop' }} />
          {svg ? <Svg source={svg} alt="Pantalla del juego" /> : null}
        </Box>
      )
    }
    if (e.surface === 'terminal') {
      const { Client } = $.ui.resolve(e)
      return <Client key="juego" module="./juego.tsx" props={{ surface: 'terminal' }} flexGrow={1} />
    }
    return <Text dimColor>Los juegos corren en la app de escritorio o en la terminal.</Text>
  })
}
