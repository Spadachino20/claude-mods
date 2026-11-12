import type { Register } from 'claude-code'

const PANE = 'pausa-activa'

// El panel se abre cuando Claude arranca un turno y se cierra cuando termina.
// Solo el turno principal: los subagentes no lo abren ni lo cierran.
export const register: Register = on => {
  on('turn.start', async ($, e, next) => {
    if (!e.agentId) void $.ui.open({ id: PANE, title: 'Pausa activa', columns: 56 })
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    if (!e.agentId) void $.ui.close({ id: PANE })
    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Text } = $.ui.resolve(e)
    if (e.surface !== 'desktop' && e.surface !== 'terminal') {
      return <Text dimColor>Los juegos corren en la app de escritorio o en la terminal.</Text>
    }
    const { Client } = $.ui.resolve(e)
    return <Client key="juego" module="./juego.tsx" props={null} flexGrow={1} />
  })
}
