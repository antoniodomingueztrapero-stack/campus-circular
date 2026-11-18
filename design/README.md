# Símbolo "dos C" · Circular Campus

Propuesta de símbolo generada por código (SVG), no dibujada a mano: toda la
geometría está calculada, así que el logo queda centrado al píxel y escala sin
pérdida a cualquier tamaño.

## Idea

- **El anillo** del logo actual se gira a horizontal: las dos flechas pasan de
  estar arriba/abajo a estar a izquierda/derecha, de modo que el conjunto se lee
  como **dos «C» enfrentadas** (Circular Campus).
- **Trazo**: cada C se dibuja con **líneas finas concéntricas**, guiño al lenguaje
  gráfico del *Instituto de Lingua* de la Universidade de Vigo.
- **Flechas**: cada C termina en una flecha **angulosa**, no en una punta
  redondeada. La flecha es un contorno con **púas y muesca trasera** repetido en
  **chevrones concéntricos** (como en la referencia que pasó el usuario) y las
  líneas del anillo **mueren exactamente en la muesca**, sin costura visible.
  Las dos flechas giran en sentido horario: arriba apunta a la derecha y abajo a
  la izquierda.
- **Centro**: el **árbol del escudo antiguo de la UVigo**: tres lóbulos redondos
  con el hueco abierto hacia el tronco y tronco ensanchado en la base.
- **Base**: la **onda del escudo en azul institucional UVigo** (`#0067B1`).

## Paleta

| Elemento | Color |
|---|---|
| Anillo y flechas | `#1B6B3A` (verde del logo actual) |
| Árbol | `#3C8F52` |
| Onda | `#0067B1` (azul UVigo) |

## Ficheros

`static/img/logos/`

| Fichero | Uso |
|---|---|
| `circular-campus-2c.svg` | versión principal, vectorial |
| `circular-campus-2c-compact.svg` | 6 líneas: favicon y tamaños pequeños (≤128 px) |
| `circular-campus-2c-mono.svg` | monocromo blanco (sobre foto o color) |
| `circular-campus-2c-verde.svg` | monocromo verde (una tinta) |
| `circular-campus-2c-1024/512/256.png` | exportes PNG |
| `circular-campus-2c-128/64/32.png` | favicons (variante compacta) |
| `circular-campus-2c-og-1200.png` | imagen para Open Graph |

`design/preview.png` es la lámina de presentación (color, sobre oscuro,
monocromo y pruebas de tamaño).

## Cómo regenerar

```bash
python3 design/build_logo.py          # escribe los SVG en static/img/logos
```

Los PNG se exportaron con [`@resvg/resvg-js`](https://www.npmjs.com/package/@resvg/resvg-js).

## Parámetros (arriba del script)

| Constante | Qué controla |
|---|---|
| `R_OUT`, `R_IN` | radio exterior / interior de la banda de líneas |
| `N_LINES`, `STROKE` | número de líneas y grosor |
| `GAP_BACK` | largo de la flecha (grados entre la punta y el corte de la banda) |
| `GAP_FRONT` | hueco entre la punta y el arranque de la otra C |
| `ARROW_BARB` | cuánto sobresalen las púas por fuera de la banda |
| `ARROW_NOTCH` | profundidad de la muesca trasera |
| `STROKE_EFFECTIVE` | separación entre los chevrones interiores |
| `LOBE_*`, `STEM`, `FILLET` | geometría del árbol (metaballs con unión suave) |
| `CUT_TOP`, `CUT_L`, `CUT_R`, `CUT_DEPTH` | hueco de cada lóbulo |
| `WAVE_*` | onda azul |

## Pendiente / ideas

- Lockup horizontal con el nombre («Circular Campus») en tipografía UVigo.
- Sustituir por esta marca el logo y el favicon del sitio.
