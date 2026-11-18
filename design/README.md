# Símbolo "dos C" · Circular Campus

Propuesta de símbolo generada por código (SVG), no dibujada a mano: toda la
geometría está calculada, así que el logo queda centrado al píxel y escala sin
pérdida a cualquier tamaño.

## Idea

- **El anillo** del logo actual se gira a horizontal: las dos flechas dejan de
  estar arriba/abajo y pasan a estar a izquierda/derecha, de modo que el conjunto
  se lee como **dos «C» enfrentadas** (Circular Campus).
- **Trazo**: cada flecha se dibuja con **9 líneas finas concéntricas**, guiño al
  lenguaje gráfico del *Instituto de Lingua* de la Universidade de Vigo.
- **Remates**: no hay flechas macizas. Las propias líneas **convergen en una
  punta afilada** situada en el eje de la banda (centrada entre la línea de fuera
  y la de dentro), así la punta es continuación del trazo, no un añadido.
  Las dos puntas van en el mismo sentido (horario): arriba apuntando a la derecha
  y abajo apuntando a la izquierda.
- **Centro**: la **planta de tres lóbulos del escudo antiguo de la UVigo**,
  reinterpretada en macizo (sin líneas, sin cara), con el tronco ligeramente
  ensanchado en la base.
- **Base**: la **onda del escudo en azul institucional UVigo** (`#0067B1`).

## Paleta

| Elemento | Color |
|---|---|
| Anillo y puntas | `#1B6B3A` (verde del logo actual) |
| Planta | `#3C8F52` |
| Onda | `#0067B1` (azul UVigo) |

## Ficheros

`static/img/logos/`

| Fichero | Uso |
|---|---|
| `circular-campus-2c.svg` | versión principal, vectorial |
| `circular-campus-2c-compact.svg` | 4 líneas: favicon y tamaños pequeños (≤128 px) |
| `circular-campus-2c-mono.svg` | monocromo blanco (sobre foto o color) |
| `circular-campus-2c-verde.svg` | monocromo verde (una tinta) |
| `circular-campus-2c-1024.png` / `-512` / `-256` | exportes PNG |
| `circular-campus-2c-128/64/32.png` | favicons (variante compacta) |
| `circular-campus-2c-og-1200.png` | imagen para Open Graph |

`design/preview.png` es la lámina de presentación (color, sobre oscuro,
monocromo y pruebas de tamaño).

## Cómo regenerar

```bash
python3 design/build_logo.py          # escribe los SVG en static/img/logos
```

Los PNG se exportaron con [`@resvg/resvg-js`](https://www.npmjs.com/package/@resvg/resvg-js):

```bash
npx --yes @resvg/resvg-js  # o instalarlo aparte y usar el script de render
```

## Parámetros (arriba del script)

| Constante | Qué controla |
|---|---|
| `R_OUT`, `R_IN` | radio exterior / interior de la banda de líneas |
| `N_LINES`, `STROKE` | número de líneas y grosor |
| `GAP` | hueco entre las dos «C» |
| `TIP`, `TIP_EASE` | longitud de la punta y cómo de afilada converge |
| `LOBE_*`, `STEM`, `FILLET` | geometría de la planta (metaballs con unión suave) |
| `WAVE_*` | onda azul |

## Pendiente / ideas

- Lockup horizontal con el nombre («Circular Campus») en tipografía UVigo.
- Versión con punta de flecha con aletas si se quiere un aire más "flecha".
- Sustituir por esta marca el logo y el favicon del sitio.
