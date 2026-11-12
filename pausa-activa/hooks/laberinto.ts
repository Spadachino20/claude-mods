// Laberinto: Clawd come puntitos mientras lo persiguen cuatro bugs.
// Un café (◆) le da unos segundos para comérselos. Mapa original.
export type Cell = [string, string?] // dos caracteres y su color

export const MAP = [
  '###################',
  '#o...#.......#...o#',
  '#.##.#.#####.#.##.#',
  '#.#.............#.#',
  '#.#.###.# #.###.#.#',
  '#.......# #.......#',
  '###.#.### ###.#.###',
  '   .#...BBB...#.   ',
  '###.#.#######.#.###',
  '#.......#.#.......#',
  '#.#####.#.#.#####.#',
  '#...#.........#...#',
  '#.#.#.###.###.#.#.#',
  '#o#.....#.#.....#o#',
  '###################',
]
export const LW = MAP[0]!.length
export const LH = MAP.length
const START = { x: 9, y: 11 }
const HOME = [{ x: 9, y: 7 }, { x: 8, y: 7 }, { x: 10, y: 7 }, { x: 9, y: 5 }]
const BUG_COLORS = ['#7bd389', '#b07cff', '#f4d35e', '#5fa8ff']
const DIRS = [[0, -1], [-1, 0], [0, 1], [1, 0]] as const // arriba, izq, abajo, der

type P = { x: number; y: number }
type Bug = P & { d: number; out: number }
export type Lab = {
  dots: string[] // filas con '.', 'o' o ' '
  me: P & { d: number; want: number }
  bugs: Bug[]
  power: number // ticks de café que quedan
  score: number
  lives: number
  level: number
  over: boolean
}

const wall = (x: number, y: number) => {
  if (y < 0 || y >= LH) return true
  const c = MAP[y]![((x % LW) + LW) % LW]!
  return c === '#'
}
const wrap = (x: number) => ((x % LW) + LW) % LW
const step = (p: P, d: number): P => ({ x: wrap(p.x + DIRS[d]![0]), y: p.y + DIRS[d]![1] })
const open = (p: P, d: number) => { const n = step(p, d); return !wall(n.x, n.y) }
const dist = (a: P, b: P) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y)

const place = (l: Lab): Lab => ({
  ...l,
  me: { ...START, d: 1, want: 1 },
  bugs: HOME.map((h, i) => ({ ...h, d: 0, out: i * 25 })),
  power: 0,
})
export const newLab = (): Lab =>
  place({ dots: MAP.map(r => r.replace(/[#B]/g, ' ')), me: { ...START, d: 1, want: 1 }, bugs: [], power: 0, score: 0, lives: 3, level: 1, over: false })

export function keyLab(l: Lab, k: string): Lab {
  if (l.over) return k === 'r' || k === 'return' ? newLab() : l
  const d = k === 'up' || k === 'w' ? 0 : k === 'left' || k === 'a' ? 1 : k === 'down' || k === 's' ? 2 : k === 'right' || k === 'd' ? 3 : -1
  return d < 0 ? l : { ...l, me: { ...l.me, want: d } }
}

// a dónde apunta cada bug: cada uno persigue a su manera
function target(i: number, b: Bug, me: Lab['me']): P {
  if (i === 0) return me
  if (i === 1) return { x: me.x + DIRS[me.d]![0] * 3, y: me.y + DIRS[me.d]![1] * 3 }
  if (i === 2) return { x: Math.floor(Math.random() * LW), y: Math.floor(Math.random() * LH) }
  return dist(b, me) > 6 ? me : { x: 0, y: LH } // el tímido se acerca y huye
}

function moveBug(b: Bug, i: number, l: Lab): Bug {
  if (b.out > 0) return { ...b, out: b.out - 1 }
  const back = (b.d + 2) % 4
  const opts = [0, 1, 2, 3].filter(d => d !== back && open(b, d))
  const choices = opts.length ? opts : [back]
  let d: number
  if (l.power > 0) d = choices[Math.floor(Math.random() * choices.length)]!
  else {
    const t = target(i, b, l.me)
    d = choices.reduce((best, c) => (dist(step(b, c), t) < dist(step(b, best), t) ? c : best))
  }
  return { ...step(b, d), d, out: 0 }
}

function collide(l: Lab): Lab {
  for (let i = 0; i < l.bugs.length; i++) {
    const b = l.bugs[i]!
    if (b.x !== l.me.x || b.y !== l.me.y) continue
    if (l.power > 0) {
      const bugs = l.bugs.map((o, j) => (j === i ? { ...HOME[0]!, d: 0, out: 20 } : o))
      l = { ...l, bugs, score: l.score + 200 }
    } else {
      const lives = l.lives - 1
      return lives <= 0 ? { ...l, lives, over: true } : place({ ...l, lives })
    }
  }
  return l
}

export function stepLab(l: Lab, t: number): Lab {
  if (l.over) return l
  const fast = Math.max(2, 4 - l.level)
  if (t % 3 === 0) {
    let { me } = l
    if (open(me, me.want)) me = { ...me, d: me.want }
    if (open(me, me.d)) me = { ...me, ...step(me, me.d) }
    let { dots, score, power } = l
    const c = dots[me.y]![me.x]
    if (c === '.' || c === 'o') {
      dots = dots.map((row, y) => (y === me.y ? row.slice(0, me.x) + ' ' + row.slice(me.x + 1) : row))
      score += c === 'o' ? 50 : 10
      if (c === 'o') power = 120
    }
    l = collide({ ...l, me, dots, score, power })
    if (!l.dots.some(r => /[.o]/.test(r))) return place({ ...newLab(), score: l.score, lives: l.lives, level: l.level + 1 })
  }
  const bugEvery = l.power > 0 ? 6 : fast + 1
  if (t % bugEvery === 0) l = collide({ ...l, bugs: l.bugs.map((b, i) => moveBug(b, i, l)) })
  return l.power > 0 ? { ...l, power: l.power - 1 } : l
}

export function viewLab(l: Lab, t: number): Cell[][] {
  return MAP.map((row, y) =>
    [...row].map((c, x): Cell => {
      if (l.me.x === x && l.me.y === y) return ['██', '#DE886D']
      const bi = l.bugs.findIndex(b => b.x === x && b.y === y)
      if (bi >= 0) {
        if (l.power > 0) return ['▚▞', l.power < 30 && t % 4 < 2 ? '#ffffff' : '#4a5a9a']
        return ['▚▞', BUG_COLORS[bi]]
      }
      if (c === '#') return ['██', '#2a6f73']
      if (c === 'B') return ['──', '#555']
      const d = l.dots[y]![x]
      if (d === '.') return [' ·', '#e8d8b0']
      if (d === 'o') return [t % 8 < 4 ? '◆ ' : '◇ ', '#c8813c']
      return ['  ']
    }),
  )
}
