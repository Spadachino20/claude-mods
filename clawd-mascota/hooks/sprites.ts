// Clawd de frente, siempre con la misma silueta (geometría base de
// github.com/abderrahimghazali/clawd-pet, MIT, ver LICENSE-clawd-pet).
// Grilla 15x16: torso 11x7, brazos 2x2, cuatro patas 1x2, ojos 1x2.
// Nada se estira ni se escala: todo se mueve de a un píxel con steps(1).
import type { Mode } from '../types'

export const W = 105
export const H = 88

const O = '#DE886D'
const K = '#000'
const r = (x: number, y: number, w: number, h: number, fill: string, cls = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${cls ? ` class="${cls}"` : ''}/>`

const CSS = `*{shape-rendering:crispEdges}
g,rect{transform-box:fill-box;transform-origin:center}
.up{animation:up 1.6s steps(1) infinite}
.blink{animation:blink 4s steps(1) infinite}
@keyframes up{0%{transform:translateY(0)}50%{transform:translateY(-1px)}}
@keyframes blink{0%{opacity:1}94%{opacity:0}100%{opacity:1}}
@keyframes tap{0%{transform:translateY(0)}50%{transform:translateY(1px)}}
@keyframes hop{0%{transform:translateY(0)}30%{transform:translateY(-2px)}60%{transform:translateY(0)}}
@keyframes shake{0%{transform:translateX(0)}25%{transform:translateX(-1px)}50%{transform:translateX(1px)}75%{transform:translateX(0)}}
@keyframes pop{0%{transform:scale(0)}25%{transform:scale(1.4)}50%{transform:scale(1)}}`

type Pose = {
  eyes?: string // ojos en vez de los normales
  arms?: string // brazos en vez de los normales
  body?: string // clase del cuerpo (por defecto respira)
  under?: string // detrás de Clawd
  over?: string // delante de Clawd
  extra?: string // CSS propio
}

const EYES = `<g class="blink">${r(4, 8, 1, 2, K)}${r(10, 8, 1, 2, K)}</g>`
const ARMS = r(0, 9, 2, 2, O) + r(13, 9, 2, 2, O)
const LEGS = r(3, 13, 1, 2, O) + r(5, 13, 1, 2, O) + r(9, 13, 1, 2, O) + r(11, 13, 1, 2, O)

const clawd = (p: Pose) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -9 30 25" width="${W}" height="${H}">
<style>${CSS}${p.extra ?? ''}</style>
${r(3, 15, 9, 1, 'rgba(0,0,0,.45)')}
${p.under ?? ''}
${LEGS}
<g class="${p.body ?? 'up'}">${r(2, 6, 11, 7, O)}${p.arms ?? ARMS}${p.eyes ?? EYES}</g>
${p.over ?? ''}
</svg>`

// una Z de píxeles de tamaño s (3 o 4)
const Z = '#9db4d6'
const z = (x: number, y: number, s: number, cls: string) =>
  `<g class="${cls}">${r(x, y, s, 1, Z)}${s === 4 ? r(x + 2, y + 1, 1, 1, Z) + r(x + 1, y + 2, 1, 1, Z) : r(x + 1, y + 1, 1, 1, Z)}${r(x, y + s - 1, s, 1, Z)}</g>`

export const SPRITES: Record<Mode, string> = {
  idle: clawd({}),

  sleep: clawd({
    eyes: r(3, 9, 2, 1, K) + r(10, 9, 2, 1, K),
    body: 'breath',
    over: z(14, 3, 3, 'z1') + z(17, -1, 3, 'z2') + z(20, -6, 4, 'z3'),
    extra: `.breath{animation:up 3s steps(1) infinite}
.z1,.z2,.z3{opacity:0;animation:zz 3s steps(1) infinite}
.z2{animation-name:zz2}.z3{animation-name:zz3}
@keyframes zz{0%{opacity:0}10%{opacity:1}85%{opacity:0}}
@keyframes zz2{0%{opacity:0}35%{opacity:1}85%{opacity:0}}
@keyframes zz3{0%{opacity:0}60%{opacity:1}85%{opacity:0}}`,
  }),

  thinking: clawd({
    eyes: `<g class="look">${r(4, 7, 1, 2, K)}${r(10, 7, 1, 2, K)}</g>`,
    over: `${r(14, 4, 1, 1, '#eee')}${r(15, 2, 2, 1, '#eee')}${r(15, -4, 9, 5, '#eee')}${r(16, -5, 7, 7, '#eee')}
${r(17, -2, 1, 1, '#333', 'd1')}${r(19, -2, 1, 1, '#333', 'd2')}${r(21, -2, 1, 1, '#333', 'd3')}`,
    extra: `.look{animation:look 2.4s steps(1) infinite}
@keyframes look{0%{transform:translateX(0)}50%{transform:translateX(1px)}}
.d1,.d2,.d3{animation:dot 1.2s steps(1) infinite}.d2{animation-delay:.4s}.d3{animation-delay:.8s}
@keyframes dot{0%{opacity:1}33%{opacity:.15}}`,
  }),

  typing: clawd({
    eyes: `<g class="blink">${r(4, 9, 1, 1, K)}${r(10, 9, 1, 1, K)}</g>`,
    arms: `<g class="tl">${r(0, 10, 2, 2, O)}</g><g class="tr">${r(13, 10, 2, 2, O)}</g>`,
    body: '',
    over: `${r(3, 10, 9, 4, '#5a5a5a')}${r(3, 10, 9, 1, '#7a7a7a')}${r(7, 11, 1, 1, '#aaa')}${r(1, 14, 13, 1, '#8d8d8d')}
${r(0, 6, 1, 1, '#6fd3ff', 'k1')}${r(14, 7, 1, 1, '#6fd3ff', 'k2')}${r(-1, 9, 1, 1, '#39ff6a', 'k2')}${r(16, 10, 1, 1, '#39ff6a', 'k1')}`,
    extra: `.tl{animation:tap .2s steps(1) infinite}.tr{animation:tap .2s steps(1) .1s infinite}
.k1,.k2{animation:dot .4s steps(1) infinite}.k2{animation-delay:.2s}
@keyframes dot{0%{opacity:1}50%{opacity:0}}`,
  }),

  reading: clawd({
    eyes: `<g class="scan">${r(4, 9, 1, 1, K)}${r(10, 9, 1, 1, K)}</g>`,
    arms: r(1, 10, 2, 2, O) + r(12, 10, 2, 2, O),
    over: `${r(3, 10, 4, 4, '#f4f1e8')}${r(8, 10, 4, 4, '#e9e4d4')}${r(7, 10, 1, 4, '#8b4513')}
${r(4, 11, 2, 1, '#aaa')}${r(4, 12, 2, 1, '#aaa')}${r(9, 11, 2, 1, '#aaa')}${r(9, 12, 1, 1, '#aaa')}`,
    extra: `.scan{animation:sc 1s steps(1) infinite}
@keyframes sc{0%{transform:translateX(-1px)}50%{transform:translateX(0)}}`,
  }),

  designing: clawd({
    arms: `${r(0, 9, 2, 2, O)}<g class="br">${r(13, 9, 2, 2, O)}${r(15, 7, 1, 3, '#8b4513')}${r(15, 6, 1, 1, '#ff4444')}</g>`,
    under: `${r(17, 3, 7, 9, '#8b4513')}${r(18, 4, 5, 7, '#fff')}${r(18, 12, 1, 3, '#8b4513')}${r(22, 12, 1, 3, '#8b4513')}
${r(18, 5, 2, 2, '#ff4444', 'p1')}${r(20, 7, 2, 1, '#4488ff', 'p2')}${r(19, 8, 3, 2, '#f1c40f', 'p3')}${r(21, 5, 1, 1, '#2ecc71', 'p4')}`,
    over: `<g class="up">${r(2, 5, 11, 1, '#1d2045')}${r(3, 4, 10, 1, '#23264a')}${r(5, 3, 8, 1, '#23264a')}${r(12, 4, 3, 1, '#23264a')}${r(8, 2, 1, 1, '#23264a')}
${r(5, 11, 5, 1, K)}${r(4, 10, 1, 1, K)}${r(10, 10, 1, 1, K)}</g>`,
    extra: `.br{animation:tap .5s steps(1) infinite}
.p1,.p2,.p3,.p4{animation:paint 4s steps(1) infinite}.p2{animation-delay:1s}.p3{animation-delay:2s}.p4{animation-delay:3s}
@keyframes paint{0%{opacity:0}25%{opacity:1}}`,
  }),

  alert: clawd({
    eyes: r(4, 7, 1, 3, K) + r(10, 7, 1, 3, K),
    arms: r(0, 7, 2, 2, O) + r(13, 7, 2, 2, O),
    body: 'shk',
    over: `<g class="bang">${r(6, -6, 3, 7, '#e0201b')}${r(5, -5, 1, 5, '#e0201b')}${r(9, -5, 1, 5, '#e0201b')}${r(6, 2, 3, 2, '#e0201b')}</g>`,
    extra: `.shk{animation:shake .3s steps(1) 3}
.bang{transform-origin:center bottom;animation:pop .4s steps(1) both}`,
  }),

  done: clawd({
    arms: r(0, 4, 2, 2, O) + r(1, 6, 1, 1, O) + r(13, 4, 2, 2, O) + r(13, 6, 1, 1, O),
    body: 'hop',
    over: `${r(-2, 1, 1, 1, '#f9d71c', 's1')}${r(16, 0, 1, 1, '#f9d71c', 's2')}${r(-3, 6, 1, 1, '#5be3ff', 's2')}${r(18, 5, 1, 1, '#ff7ad9', 's1')}${r(7, 0, 1, 1, '#f9d71c', 's2')}`,
    extra: `.hop{animation:hop .6s steps(1) infinite}
.s1,.s2{animation:dot .4s steps(1) infinite}.s2{animation-delay:.2s}
@keyframes dot{0%{opacity:1}50%{opacity:0}}`,
  }),

  sad: clawd({
    eyes: r(4, 9, 1, 1, K) + r(10, 9, 1, 1, K) + r(3, 8, 2, 1, K) + r(10, 8, 2, 1, K),
    arms: r(0, 11, 2, 2, O) + r(13, 11, 2, 2, O),
    body: '',
    over: r(4, 10, 1, 1, '#5bb5ff', 'tear'),
    extra: `.tear{animation:tear 1.2s steps(1) infinite}
@keyframes tear{0%{transform:translateY(0)}33%{transform:translateY(1px)}66%{transform:translateY(2px);opacity:1}100%{opacity:0}}`,
  }),
}
