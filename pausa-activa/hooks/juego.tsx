// Los dos juegos corren acá, en el hilo de dibujo, con su propio reloj y teclado.
import type { ClientKeyEvent, ClientModule, ClientSurface } from 'claude-code'

import { keyEsc, newEsc, stepEsc, viewEsc } from './escalada'
import type { Esc } from './escalada'
import { keyLab, newLab, stepLab, viewLab } from './laberinto'
import type { Cell, Lab } from './laberinto'

const TICK = 50 // ms

// ---------- Paletas ----------
const PW = 36
const PH = 14
const PAD = 4
type Pong = { py: number; cy: number; bx: number; by: number; vx: number; vy: number; me: number; cpu: number }
const newBall = (p: Pong, dir: number): Pong => ({ ...p, bx: PW >> 1, by: PH >> 1, vx: dir, vy: Math.random() < 0.5 ? -1 : 1 })
const newPong = (): Pong => newBall({ py: 5, cy: 5, bx: 0, by: 0, vx: 1, vy: 1, me: 0, cpu: 0 }, 1)

const hit = (paddleY: number, y: number) => y >= paddleY && y < paddleY + PAD
const bounceVy = (paddleY: number, y: number) => (y === paddleY ? -1 : y === paddleY + PAD - 1 ? 1 : Math.random() < 0.5 ? -1 : 1)

function stepPong(p: Pong, t: number): Pong {
  let q = p
  // la CPU sigue la pelota un poco más lento que vos
  if (t % 3 === 0 && q.vx > 0) {
    const mid = q.cy + (PAD >> 1)
    q = { ...q, cy: clamp(q.cy + Math.sign(q.by - mid), 0, PH - PAD) }
  }
  if (t % 2 !== 0) return q
  let { bx, by, vx, vy } = q
  let ny = by + vy
  if (ny < 0 || ny >= PH) { vy = -vy; ny = by + vy }
  let nx = bx + vx
  if (nx === 1 && hit(q.py, ny)) { vx = 1; vy = bounceVy(q.py, ny); nx = bx + vx }
  else if (nx === PW - 2 && hit(q.cy, ny)) { vx = -1; vy = bounceVy(q.cy, ny); nx = bx + vx }
  if (nx < 0) return newBall({ ...q, cpu: q.cpu + 1 }, 1)
  if (nx >= PW) return newBall({ ...q, me: q.me + 1 }, -1)
  return { ...q, bx: nx, by: ny, vx, vy }
}

// ---------- Bloques ----------
const BW = 10
const BH = 18
const SHAPES = [
  { s: 4, c: [[0, 1], [1, 1], [2, 1], [3, 1]], col: '#4dd0e1' },
  { s: 2, c: [[0, 0], [1, 0], [0, 1], [1, 1]], col: '#ffd54f' },
  { s: 3, c: [[1, 0], [0, 1], [1, 1], [2, 1]], col: '#ba68c8' },
  { s: 3, c: [[1, 0], [2, 0], [0, 1], [1, 1]], col: '#81c784' },
  { s: 3, c: [[0, 0], [1, 0], [1, 1], [2, 1]], col: '#e57373' },
  { s: 3, c: [[0, 0], [0, 1], [1, 1], [2, 1]], col: '#64b5f6' },
  { s: 3, c: [[2, 0], [0, 1], [1, 1], [2, 1]], col: '#ffb74d' },
] as const
type Piece = { k: number; r: number; x: number; y: number }
type Tet = { board: number[][]; p: Piece; next: number; score: number; lines: number; over: boolean }

const rnd = () => Math.floor(Math.random() * SHAPES.length)
const cells = (p: Piece): [number, number][] => {
  const sh = SHAPES[p.k]!
  return sh.c.map(([x0, y0]) => {
    let x: number = x0, y: number = y0
    for (let i = 0; i < p.r % 4; i++) [x, y] = [sh.s - 1 - y, x]
    return [p.x + x, p.y + y]
  })
}
const fits = (b: number[][], p: Piece) =>
  cells(p).every(([x, y]) => x >= 0 && x < BW && y < BH && (y < 0 || b[y]![x] === 0))
const spawn = (k: number): Piece => ({ k, r: 0, x: 3, y: 0 })
export const newTet = (): Tet => ({ board: Array.from({ length: BH }, () => Array(BW).fill(0)), p: spawn(rnd()), next: rnd(), score: 0, lines: 0, over: false })

export function lock(t: Tet): Tet {
  const board = t.board.map(row => [...row])
  for (const [x, y] of cells(t.p)) if (y >= 0) board[y]![x] = t.p.k + 1
  const kept = board.filter(row => row.some(c => c === 0))
  const n = BH - kept.length
  while (kept.length < BH) kept.unshift(Array(BW).fill(0))
  const lines = t.lines + n
  const p = spawn(t.next)
  return { board: kept, p, next: rnd(), lines, score: t.score + [0, 100, 300, 500, 800][n]! * (1 + (t.lines / 10 | 0)), over: !fits(kept, p) }
}
const move = (t: Tet, dx: number, dy: number, dr = 0): Tet => {
  const p = { ...t.p, x: t.p.x + dx, y: t.p.y + dy, r: t.p.r + dr }
  if (fits(t.board, p)) return { ...t, p }
  if (dr) for (const kick of [-1, 1, -2, 2]) { const k = { ...p, x: p.x + kick }; if (fits(t.board, k)) return { ...t, p: k } }
  return dy > 0 ? lock(t) : t
}
const drop = (t: Tet): Tet => { let p = t.p; while (fits(t.board, { ...p, y: p.y + 1 })) p = { ...p, y: p.y + 1 }; return lock({ ...t, p }) }

// ---------- el módulo ----------
type S = { game: 'menu' | 'pong' | 'tet' | 'lab' | 'esc'; pong: Pong; tet: Tet; lab: Lab; esc: Esc; t: number }
export const fresh = (): S => ({ game: 'menu', pong: newPong(), tet: newTet(), lab: newLab(), esc: newEsc(), t: 0 })
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

export function onKey(s: S, e: ClientKeyEvent): S {
  const k = e.key.toLowerCase()
  if (k === '1') return { ...s, game: 'pong', pong: newPong() }
  if (k === '2') return { ...s, game: 'tet', tet: newTet() }
  if (k === '3') return { ...s, game: 'lab', lab: newLab() }
  if (k === '4') return { ...s, game: 'esc', esc: newEsc() }
  if (k === 'm' || k === 'q') return { ...s, game: 'menu' }
  if (s.game === 'lab') return { ...s, lab: keyLab(s.lab, k) }
  if (s.game === 'esc') return { ...s, esc: keyEsc(s.esc, k) }
  if (s.game === 'pong') {
    const d = k === 'up' || k === 'w' ? -1 : k === 'down' || k === 's' ? 1 : 0
    return d ? { ...s, pong: { ...s.pong, py: clamp(s.pong.py + d, 0, PH - PAD) } } : s
  }
  if (s.game === 'tet') {
    if (s.tet.over) return k === 'r' || k === 'return' ? { ...s, tet: newTet() } : s
    if (k === 'left' || k === 'a') return { ...s, tet: move(s.tet, -1, 0) }
    if (k === 'right' || k === 'd') return { ...s, tet: move(s.tet, 1, 0) }
    if (k === 'down' || k === 's') return { ...s, tet: move(s.tet, 0, 1) }
    if (k === 'up' || k === 'w') return { ...s, tet: move(s.tet, 0, 0, 1) }
    if (k === ' ' || k === 'space') return { ...s, tet: drop(s.tet) }
  }
  return s
}

export function tick(s: S): S {
  const t = s.t + 1
  if (s.game === 'pong') return { ...s, t, pong: stepPong(s.pong, t) }
  if (s.game === 'lab') return { ...s, t, lab: stepLab(s.lab, t) }
  if (s.game === 'esc') return { ...s, t, esc: stepEsc(s.esc, t) }
  if (s.game === 'tet' && !s.tet.over) {
    const every = Math.max(2, 10 - (s.tet.lines / 10 | 0))
    return { ...s, t, tet: t % every === 0 ? move(s.tet, 0, 1) : s.tet }
  }
  return s
}

const Juego: ClientModule<null, S> = (_props, surface: ClientSurface<S>) => {
  const { Box, Text, Button } = surface.elements
  if (surface.state === undefined) {
    surface.setState(fresh())
    surface.every(TICK, () => { const s = surface.state; if (s && s.game !== 'menu') surface.setState(tick(s)) })
    surface.onKey(e => { const s = surface.state; if (s) surface.setState(onKey(s, e)) })
  }
  const s = surface.state ?? fresh()
  const go = (game: S['game']) => surface.setState({ ...fresh(), game })

  // una grilla de celdas de dos caracteres, juntando las del mismo color
  const paint = (grid: Cell[][]) =>
    grid.map((row, y) => {
      const runs: Cell[] = []
      for (const [txt, col] of row) {
        const last = runs[runs.length - 1]
        if (last && last[1] === col) last[0] += txt
        else runs.push([txt, col])
      }
      return (
        <Text mono key={`r${y}`}>
          {runs.map(([txt, col]) => (col ? <Text color={col}>{txt}</Text> : txt))}
        </Text>
      )
    })
  const game = (title: string, stats: string, grid: Cell[][], over: boolean, help: string) => (
    <Box flexDirection="column" padding={1}>
      <Text mono bold>
        <Text color="#DE886D">{title}</Text>  {stats}
      </Text>
      <Box flexDirection="column" borderStyle="round">{paint(grid)}</Box>
      {over ? <Text bold color="#e0201b">GAME OVER · R para jugar de nuevo</Text> : <Text dimColor>{help}</Text>}
    </Box>
  )

  if (s.game === 'lab') {
    const l = s.lab
    return game('LABERINTO', `Puntos ${l.score}  Vidas ${'♥'.repeat(Math.max(0, l.lives))}  Nivel ${l.level}`, viewLab(l, s.t), l.over,
      'Flechas: mover · ◆ café: comete los bugs · M menú')
  }
  if (s.game === 'esc') {
    const e = s.esc
    return game('ESCALADA', `Puntos ${e.score}  Vidas ${'♥'.repeat(Math.max(0, e.lives))}  Nivel ${e.level}`, viewEsc(e, s.t), e.over,
      e.won ? '¡Servidor apagado! Siguiente nivel…' : '← → caminar · ↑ ↓ escaleras · espacio saltar · M menú')
  }

  if (s.game === 'menu') {
    return (
      <Box flexDirection="column" gap={1} padding={1}>
        <Text bold color="#DE886D">PAUSA ACTIVA</Text>
        <Text dimColor>Claude está trabajando. Hacé clic acá y jugá con el teclado.</Text>
        <Box flexDirection="row" gap={2}>
          <Button key="pong" label="1  Paletas" variant="primary" onPress={() => go('pong')} />
          <Button key="tet" label="2  Bloques" onPress={() => go('tet')} />
        </Box>
        <Box flexDirection="row" gap={2}>
          <Button key="lab" label="3  Laberinto" onPress={() => go('lab')} />
          <Button key="esc" label="4  Escalada" onPress={() => go('esc')} />
        </Box>
        <Text dimColor>M vuelve al menú</Text>
      </Box>
    )
  }

  if (s.game === 'pong') {
    const p = s.pong
    const rows = Array.from({ length: PH }, (_, y) => {
      let line = ''
      for (let x = 0; x < PW; x++) {
        line += (x === 1 && hit(p.py, y)) || (x === PW - 2 && hit(p.cy, y)) ? '█'
          : x === p.bx && y === p.by ? '■'
          : x === PW >> 1 && y % 2 === 0 ? '┊'
          : ' '
      }
      return <Text mono key={`r${y}`}>{line}</Text>
    })
    return (
      <Box flexDirection="column" padding={1}>
        <Text mono bold>{`  VOS ${String(p.me).padStart(2)}        PALETAS        CPU ${String(p.cpu).padStart(2)}`}</Text>
        <Box flexDirection="column" borderStyle="round">{rows}</Box>
        <Text dimColor>↑ ↓ mover · M menú</Text>
      </Box>
    )
  }

  const t = s.tet
  const live = new Map(cells(t.p).map(([x, y]) => [`${x},${y}`, t.p.k + 1]))
  const rows = t.board.map((row, y) => (
    <Text mono key={`r${y}`}>
      {row.map((c, x) => {
        const v = live.get(`${x},${y}`) ?? c
        return v ? <Text color={SHAPES[v - 1]!.col}>██</Text> : <Text dimColor> ·</Text>
      })}
    </Text>
  ))
  const nx = SHAPES[t.next]!
  const preview = [0, 1].map(y => (
    <Text mono key={`n${y}`}>
      {[0, 1, 2, 3].map(x => (nx.c.some(([a, b]) => a === x && b === y) ? <Text color={nx.col}>██</Text> : '  '))}
    </Text>
  ))
  return (
    <Box flexDirection="row" gap={2} padding={1}>
      <Box flexDirection="column" borderStyle="round">{rows}</Box>
      <Box flexDirection="column" gap={1}>
        <Text bold color="#DE886D">BLOQUES</Text>
        <Box flexDirection="column"><Text dimColor>Siguiente</Text>{preview}</Box>
        <Text mono>{`Puntos ${t.score}`}</Text>
        <Text mono>{`Líneas ${t.lines}`}</Text>
        {t.over && <Text bold color="#e0201b">GAME OVER · R</Text>}
        <Text dimColor>← → mover{'\n'}↑ girar · ↓ bajar{'\n'}espacio: caer{'\n'}M menú</Text>
      </Box>
    </Box>
  )
}

export default Juego
