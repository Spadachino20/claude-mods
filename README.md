# claude-mods

Dos mods para Claude Code (app de escritorio y terminal).

## clawd-mascota

Clawd en pixel art, parado sobre el cuadro donde escribís, animado según lo que hace Claude:
respira cuando está quieto, se duerme con "zzz", piensa con una nube, teclea en una notebook,
lee un libro, se pone boina y bigote cuando estás diseñando, salta un "!" rojo cuando algo falla,
festeja al terminar y se pone triste si cancelás.

## pausa-activa

Mientras Claude trabaja se abre un panel con cuatro jueguitos retro, y se cierra solo cuando termina.
Hacé clic en el panel y elegí con el teclado:

1. **Paletas**: dos paletas y una pelota (↑ ↓).
2. **Bloques**: encajá piezas que caen (← → mover, ↑ girar, ↓ bajar, espacio dejar caer).
3. **Laberinto**: Clawd come puntitos esquivando bugs; el ◆ café te deja comértelos.
4. **Escalada**: Clawd sube escaleras saltando tazas de café para apagar un servidor en llamas.

`M` vuelve al menú, `R` reinicia después de un game over.

## Instalar

En una sesión de Claude Code en la terminal:

```
/plugin install clawd-mascota --marketplace Spadachino20/claude-mods
/plugin install pausa-activa --marketplace Spadachino20/claude-mods
```

Desde una shell:

```
claude plugin install clawd-mascota --marketplace Spadachino20/claude-mods
claude plugin install pausa-activa --marketplace Spadachino20/claude-mods
```

En la app de escritorio, donde `/plugin` no corre: clic en **+** al lado del cuadro de texto,
**Plugins**, **Add marketplace** con `Spadachino20/claude-mods`, y después **Add plugin**.

Clawd se dibuja en la app de escritorio y en VS Code; los juegos corren en la app de escritorio y en la terminal.

## Créditos

La geometría base de Clawd viene de [abderrahimghazali/clawd-pet](https://github.com/abderrahimghazali/clawd-pet)
(MIT, ver `clawd-mascota/LICENSE-clawd-pet`).
