import { expect, test } from 'claude-code/testing'

import { fresh, lock, newTet, onKey, tick } from './juego.tsx'

const key = (s: ReturnType<typeof fresh>, k: string) => onKey(s, { key: k })

test('bloques: una fila completa se borra y suma puntos', () => {
  const t = newTet()
  t.board[17] = [1, 1, 1, 1, 1, 1, 1, 1, 0, 0]
  // una pieza O (2x2) justo en el hueco de la derecha, apoyada abajo
  const done = lock({ ...t, p: { k: 1, r: 0, x: 8, y: 16 } })
  expect(done.lines).toBe(1)
  expect(done.score).toBe(100)
  expect(done.board[17]!.filter(c => c !== 0).length).toBe(2)
})

test('bloques: espacio deja caer la pieza y aparece otra', () => {
  let s = key(fresh(), '2')
  expect(s.game).toBe('tet')
  s = key(s, ' ')
  expect(s.tet.board.flat().filter(c => c !== 0).length).toBe(4)
})

test('paletas: la pelota avanza y la paleta no se sale', () => {
  let s = key(fresh(), '1')
  const bx = s.pong.bx
  s = tick(tick(s))
  expect(s.pong.bx).not.toBe(bx)
  for (let i = 0; i < 30; i++) s = key(s, 'up')
  expect(s.pong.py).toBe(0)
})

import { MAP, newLab, stepLab } from './laberinto'
import { EW, newEsc, stepEsc } from './escalada'

test('laberinto: se puede llegar a todos los puntitos', () => {
  const W = MAP[0]!.length
  const seen = new Set<string>()
  const q: [number, number][] = [[9, 11]]
  while (q.length) {
    const [x0, y] = q.pop()!
    const x = ((x0 % W) + W) % W
    if (y < 0 || y >= MAP.length || MAP[y]![x] === '#' || seen.has(`${x},${y}`)) continue
    seen.add(`${x},${y}`)
    q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
  }
  const dots = MAP.flatMap((row, y) => [...row].map((c, x) => (/[.o]/.test(c) ? `${x},${y}` : null))).filter(Boolean)
  expect(dots.every(d => seen.has(d!))).toBe(true)
  let l = newLab()
  for (let t = 1; t <= 300; t++) l = stepLab(l, t)
  expect(l.score).toBeGreaterThan(0)
})

test('escalada: Clawd cae al suelo y las tazas aparecen y ruedan', () => {
  let e = newEsc()
  for (let t = 1; t <= 200; t++) e = stepEsc(e, t)
  expect(e.cups.length + (e.lives < 3 ? 1 : 0)).toBeGreaterThan(0)
  expect(e.x).toBeLessThan(EW)
})
