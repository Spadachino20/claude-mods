// Escalada: Clawd sube plataformas por escaleras para apagar el servidor en
// llamas de arriba, saltando las tazas de café que bajan rodando. Nivel original.
import type { Cell } from './laberinto'

export const EW = 24
export const EH = 16
// plataformas planas: fila y tramo que cubren; los huecos dejan caer las tazas
const FLOORS = [
  { y: 15, a: 0, b: 23 },
  { y: 12, a: 0, b: 20 },
  { y: 9, a: 3, b: 23 },
  { y: 6, a: 0, b: 20 },
  { y: 3, a: 3, b: 23 },
]
const LADDERS = [
  { x: 18, top: 12, bot: 15 },
  { x: 6, top: 9, bot: 12 },
  { x: 16, top: 6, bot: 9 },
  { x: 8, top: 3, bot: 6 },
]
const MACHINE = { x: 21, y: 2 }
const SERVER = { x: 4, y: 2 }
const START = { x: 2, y: 14 }

type Cup = { x: number; y: number; dir: number; jumped?: boolean }
export type Esc = {
  x: number
  y: number
  air: number // pasos que le quedan en el aire
  cups: Cup[]
  score: number
  lives: number
  level: number
  over: boolean
  won: number // ticks de festejo tras apagar el servidor
}

const floorAt = (x: number, y: number) => FLOORS.some(f => f.y === y && x >= f.a && x <= f.b)
const ladderAt = (x: number, y: number) => LADDERS.find(l => l.x === x && y >= l.top - 1 && y <= l.bot - 1)
const standing = (e: { x: number; y: number }) => floorAt(e.x, e.y + 1)

const reset = (e: Esc): Esc => ({ ...e, ...START, air: 0, cups: [], won: 0 })
export const newEsc = (): Esc => reset({ x: 0, y: 0, air: 0, cups: [], score: 0, lives: 3, level: 1, over: false, won: 0 })

export function keyEsc(e: Esc, k: string): Esc {
  if (e.over) return k === 'r' || k === 'return' ? newEsc() : e
  if (e.won) return e
  const lad = ladderAt(e.x, e.y)
  if (k === 'left' || k === 'a' || k === 'right' || k === 'd') {
    const dx = k === 'left' || k === 'a' ? -1 : 1
    const onRung = lad && !standing(e)
    if (onRung) return e // en mitad de la escalera no se camina
    return { ...e, x: Math.max(0, Math.min(EW - 1, e.x + dx)) }
  }
  if ((k === 'up' || k === 'w') && lad && e.y > lad.top - 1) return { ...e, y: e.y - 1 }
  if (k === 'down' || k === 's') {
    const below = ladderAt(e.x, e.y + 1)
    if (below && e.y < below.bot - 1) return { ...e, y: e.y + 1 }
  }
  if ((k === ' ' || k === 'space') && standing(e) && e.air === 0) return { ...e, y: e.y - 1, air: 3 }
  return e
}

function hurt(e: Esc): Esc {
  const lives = e.lives - 1
  return lives <= 0 ? { ...e, lives, over: true } : reset({ ...e, lives })
}

function rollCup(c: Cup): Cup | null {
  if (!floorAt(c.x, c.y + 1)) {
    // cae por el hueco; al aterrizar rueda para el otro lado
    const y = c.y + 1
    if (y >= EH) return null
    return floorAt(c.x, y + 1) ? { ...c, y, dir: -c.dir } : { ...c, y }
  }
  const x = c.x + c.dir
  return x < 0 || x >= EW ? null : { ...c, x }
}

export function stepEsc(e: Esc, t: number): Esc {
  if (e.over) return e
  if (e.won) return e.won === 1 ? reset({ ...e, level: e.level + 1 }) : { ...e, won: e.won - 1 }

  // Clawd: salto y gravedad, cada 2 ticks
  if (t % 2 === 0) {
    if (e.air > 0) e = { ...e, air: e.air - 1 }
    else if (!standing(e) && !ladderAt(e.x, e.y)) {
      e = { ...e, y: e.y + 1 }
      if (e.y >= EH) return hurt(e)
    }
  }

  // tazas: más rápidas y más seguidas en cada nivel
  const roll = Math.max(2, 4 - (e.level >> 1))
  if (t % roll === 0) {
    let cups = e.cups.map(rollCup).filter((c): c is Cup => c !== null)
    if (t % Math.max(24, 60 - e.level * 8) === 0) cups = [...cups, { ...MACHINE, dir: -1 }]
    e = { ...e, cups }
  }

  // saltar una taza da puntos; tocarla te cuesta una vida
  let score = e.score
  const cups = e.cups.map(c => {
    if (!c.jumped && e.air > 0 && c.x === e.x && c.y === e.y + 1) { score += 100; return { ...c, jumped: true } }
    return c
  })
  if (cups.some(c => c.x === e.x && c.y === e.y)) return hurt(e)
  e = { ...e, cups, score }

  if (e.x === SERVER.x && e.y === SERVER.y) return { ...e, score: e.score + 1000, won: 30 }
  return e
}

export function viewEsc(e: Esc, t: number): Cell[][] {
  return Array.from({ length: EH }, (_, y) =>
    Array.from({ length: EW }, (_, x): Cell => {
      if (x === e.x && y === e.y) return [e.won && t % 4 < 2 ? '▀▀' : '██', '#DE886D']
      if (e.cups.some(c => c.x === x && c.y === y)) return ['◖◗', '#f5f0e1']
      if (x === SERVER.x && y === SERVER.y) return ['▣▣', e.won ? '#5fd38d' : '#9aa5b1']
      if (x === SERVER.x && y === SERVER.y - 1 && !e.won) return [t % 6 < 3 ? '^^' : '^˄', t % 4 < 2 ? '#ff7a2f' : '#ffcf3f']
      if (x === MACHINE.x && y === MACHINE.y) return ['▓▓', '#6f4e37']
      if (x === MACHINE.x && y === MACHINE.y - 1) return [t % 10 < 5 ? ' ~' : '~ ', '#bbbbbb']
      if (floorAt(x, y)) return ['▀▀', '#b5653a']
      if (ladderAt(x, y) && !floorAt(x, y)) return ['╫╫', '#8fa3b8']
      return ['  ']
    }),
  )
}
