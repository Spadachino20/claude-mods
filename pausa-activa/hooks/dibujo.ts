// Pixel art de los juegos: cada cuadro es un SVG que el panel muestra en la app de escritorio.
// Sprites de 8x8 (Clawd de 10x8) escritos como filas de letras; '.' es transparente.
import { EH, EW, FLOORS, LADDERS, MACHINE, SERVER } from './escalada'
import type { Esc } from './escalada'
import { LH, LW, MAP } from './laberinto'
import type { Lab } from './laberinto'

export type Pal = Record<string, string>
const T = 8

export function sprite(rows: readonly string[], pal: Pal, x: number, y: number, flip = false): string {
  let out = ''
  rows.forEach((row0, j) => {
    const row = flip ? [...row0].reverse().join('') : row0
    for (let i = 0; i < row.length; ) {
      const c = row[i]!
      const fill = pal[c]
      if (!fill) { i++; continue }
      let k = i
      while (row[k] === c) k++
      out += `<rect x="${x + i}" y="${y + j}" width="${k - i}" height="1" fill="${fill}"/>`
      i = k
    }
  })
  return out
}

export const frame = (w: number, h: number, scale: number, bg: string, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${Math.round(w * scale)}" height="${Math.round(h * scale)}" shape-rendering="crispEdges"><rect width="${w}" height="${h}" fill="${bg}"/>${body}</svg>`

// ---------- Clawd ----------
const CLAWD_BODY = [
  '..........',
  '.OOOOOOOO.',
  '.OOOOOOOO.',
  '.OOOOOOOO.',
  'OOOOOOOOOO',
  '.OOOOOOOO.',
]
const LEGS_A = ['.O.O..O.O.', '.O.O..O.O.']
const LEGS_B = ['.O.O..O.O.', '...O..O...']
const ORANGE = '#DE886D'

/** Clawd parado en la celda (cx, cy); mira hacia (dx, dy); `step` alterna las patas. */
export function clawd(cx: number, cy: number, dx = 0, dy = 0, step = false, color = ORANGE): string {
  const x = cx * T - 1
  const y = cy * T
  const eyes = `<rect x="${x + 3 + dx}" y="${y + 2 + dy}" width="1" height="2" fill="#000"/><rect x="${x + 6 + dx}" y="${y + 2 + dy}" width="1" height="2" fill="#000"/>`
  return sprite([...CLAWD_BODY, ...(step ? LEGS_B : LEGS_A)], { O: color }, x, y) + eyes
}

// ---------- Laberinto ----------
const BUG_A = [
  '.A....A.',
  '..A..A..',
  '.CCCCCC.',
  'CCWCCWCC',
  'CCKCCKCC',
  'ACCCCCCA',
  '.CCCCCC.',
  'A.A..A.A',
]
const BUG_B = [...BUG_A.slice(0, 7), '.A.AA.A.']
const BUG_COLORS = ['#6fd36a', '#b07cff', '#f4c542', '#4fa3ff']
const CUP_SMALL = [
  '..s..s..',
  '...s..s.',
  '.WWWWW..',
  '.WBBBWW.',
  '.WWWWW.W',
  '.WWWWWW.',
  '..WWW...',
  '........',
]

const isWall = (x: number, y: number) => y >= 0 && y < LH && x >= 0 && x < LW && MAP[y]![x] === '#'

// el laberinto no cambia: se arma una sola vez
const MAZE = (() => {
  let fill = ''
  let edge = ''
  MAP.forEach((row, y) => {
    for (let x = 0; x < LW; ) {
      if (row[x] !== '#') { x++; continue }
      let k = x
      while (row[k] === '#') k++
      fill += `<rect x="${x * T}" y="${y * T}" width="${(k - x) * T}" height="${T}" fill="#0b2530"/>`
      x = k
    }
    for (let x = 0; x < LW; x++) {
      if (!isWall(x, y)) continue
      const px = x * T, py = y * T
      if (y > 0 && !isWall(x, y - 1)) edge += `M${px} ${py + 0.5}h${T}`
      if (y < LH - 1 && !isWall(x, y + 1)) edge += `M${px} ${py + T - 0.5}h${T}`
      if (x > 0 && !isWall(x - 1, y)) edge += `M${px + 0.5} ${py}v${T}`
      if (x < LW - 1 && !isWall(x + 1, y)) edge += `M${px + T - 0.5} ${py}v${T}`
    }
  })
  const door = MAP.flatMap((row, y) => [...row].map((c, x) => (c === 'B' ? `<rect x="${x * T}" y="${y * T + 3}" width="${T}" height="2" fill="#3a4a55"/>` : ''))).join('')
  return `${fill}<path d="${edge}" stroke="#3fd0e0" stroke-width="1" fill="none"/>${door}`
})()

const DIRS = [[0, -1], [-1, 0], [0, 1], [1, 0]] as const

export function svgLab(l: Lab, t: number): string {
  let dots = ''
  let cups = ''
  l.dots.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] === '.') dots += `M${x * T + 3} ${y * T + 3}h2v2h-2z`
      else if (row[x] === 'o') cups += sprite(t % 8 < 4 ? CUP_SMALL : CUP_SMALL.map(r => r.replace(/s/g, '.')), { W: '#f3ede0', B: '#6b3e1e', s: '#cfd6dd' }, x * T, y * T)
    }
  })
  const scared = l.power > 0
  const blink = scared && l.power < 30 && t % 4 < 2
  const bugs = l.bugs
    .map((b, i) => {
      const pal: Pal = scared
        ? { C: blink ? '#e9ecff' : '#2c3cc4', A: blink ? '#c9ccff' : '#1b2690', W: '#ffffff', K: blink ? '#e9ecff' : '#2c3cc4' }
        : { C: BUG_COLORS[i]!, A: '#1d1d1d', W: '#ffffff', K: '#111111' }
      return sprite(t % 6 < 3 ? BUG_A : BUG_B, pal, b.x * T, b.y * T)
    })
    .join('')
  const [dx, dy] = DIRS[l.me.d]!
  const me = clawd(l.me.x, l.me.y, dx, dy, t % 4 < 2)
  return frame(LW * T, LH * T, 2.6, '#05080c', `${MAZE}<path d="${dots}" fill="#f2d7a0"/>${cups}${bugs}${me}`)
}

// ---------- Escalada ----------
const PLANK = ['LLLLLLLL', 'MMMMMMMM', 'MDMMMMDM', 'MMMMMMMM', 'DDDDDDDD']
const PLANK_PAL = { L: '#e8a96f', M: '#b8652f', D: '#6a3216' }
const CUP = [
  '........',
  '..WWWW..',
  '.WBBBBW.',
  '.WWWWWWW',
  '.WWWWW.W',
  '.WWWWWW.',
  '..WWWW..',
  '........',
]
const MACH = [
  '.GGGGGG.',
  '.GRGGgG.',
  '.GGGGGG.',
  '.GDDDDG.',
  '.GD..DG.',
  '.GDccDG.',
  '.GGGGGG.',
  'GGGGGGGG',
]
const STEAM_A = ['........', '........', '..s.....', '...s..s.', '..s..s..', '...s.s..', '....s...', '........']
const STEAM_B = ['........', '...s....', '..s..s..', '...s..s.', '..s.s...', '...s....', '........', '........']
const SRV = [
  'SSSSSSSS',
  'SaSSbSSS',
  'SSSSSSSS',
  'SbSSSaSS',
  'SSSSSSSS',
  'SaSSbSSS',
  'SSSSSSSS',
  'S.S..S.S',
]
const FIRE = [
  '...R....',
  '..RR..R.',
  '..RYR.RR',
  '.RYYRRYR',
  '.RYWYYYR',
  'RYYWWYYR',
  'RYWWWWYR',
  '.RYYYYR.',
]

// escaleras y plataformas tampoco cambian
const LEVEL = (() => {
  let s = ''
  for (const l of LADDERS) {
    const top = (l.top - 1) * T, bot = l.bot * T
    s += `<rect x="${l.x * T + 1}" y="${top}" width="1" height="${bot - top}" fill="#9fb3c8"/><rect x="${l.x * T + 6}" y="${top}" width="1" height="${bot - top}" fill="#9fb3c8"/>`
    for (let y = top + 2; y < bot; y += 3) s += `<rect x="${l.x * T + 1}" y="${y}" width="6" height="1" fill="#9fb3c8"/>`
  }
  // un tablón como patrón repetido: una sola figura por plataforma
  s += `<defs><pattern id="tablon" width="${T}" height="5" patternUnits="userSpaceOnUse">${sprite(PLANK, PLANK_PAL, 0, 0)}</pattern></defs>`
  for (const f of FLOORS) s += `<rect x="${f.a * T}" y="${f.y * T}" width="${(f.b - f.a + 1) * T}" height="5" fill="url(#tablon)"/>`
  return s
})()

export function svgEsc(e: Esc, t: number): string {
  const won = e.won > 0
  const lights = won ? { a: '#3cff7a', b: '#3cff7a' } : { a: '#ff4a3c', b: t % 6 < 3 ? '#ffc23c' : '#7a5a1a' }
  const server = sprite(SRV, { S: '#7d8792', ...lights }, SERVER.x * T, SERVER.y * T)
  const fire = won ? '' : sprite(FIRE, { R: '#ff5a1f', Y: '#ffc531', W: '#fff3b0' }, SERVER.x * T, (SERVER.y - 1) * T, t % 6 < 3)
  const mach = sprite(MACH, { G: '#4a4f57', R: '#ff4040', g: '#3cff7a', D: '#1c1f24', c: '#6b3e1e' }, MACHINE.x * T, MACHINE.y * T)
  const steam = sprite(t % 10 < 5 ? STEAM_A : STEAM_B, { s: '#c9d1d9' }, MACHINE.x * T, (MACHINE.y - 1) * T)
  const cups = e.cups.map(c => sprite(CUP, { W: '#f3ede0', B: '#6b3e1e' }, c.x * T, c.y * T, c.x % 2 === 0)).join('')
  const me = clawd(e.x, e.y, 0, e.air > 0 ? -1 : 0, e.air > 0 || t % 4 < 2, won && t % 4 < 2 ? '#ffd0b8' : ORANGE)
  return frame(EW * T, EH * T, 2, '#0b0e14', `${LEVEL}${server}${fire}${mach}${steam}${cups}${me}`)
}
