# ObraFlow — Investigación de mercado, identidad y decisiones de diseño

> Segunda pasada. El [plan de acción](PLAN-UX-LANDING.md) definió **qué decir** y en qué
> jerarquía. Este documento define **cómo suena y cómo se ve**, y de dónde sale cada
> decisión. Entregable: `apps/landing/index.html`.

---

## 1. Análisis competitivo

### 1.1 El competidor directo en el mercado natural

**Ordeniq** (Chile, opera en cinco países) es el competidor más cercano.

| | Ordeniq | ObraFlow |
|---|---|---|
| Titular | «Controla cada trabajo desde que se asigna hasta que tu cliente lo aprueba.» | «Cada orden de trabajo, con su estado y su costo real.» |
| Eje | **Control** y trazabilidad de la OT | **Costo** acumulado por OT |
| Bajada | «Centraliza órdenes de trabajo, técnicos, evidencias, insumos y cierres en un mismo flujo.» | El costo se arma solo mientras el trabajo avanza |
| Prueba | Capturas del producto rotuladas «real» | Ficha de OT reconstruida + números que cierran |
| Precio | No publicado, demo bajo pedido | No publicado, capacidad publicada |
| Métricas | Ninguna | Del sector, con fuente citada |

**Lectura.** Toda la categoría —Ordeniq, XCONTROL, Fixner, Eskuad, y arriba ServiceTitan,
Jobber, Fieldwire, Raken— vende lo mismo: *control*, *centralizar*, *trazabilidad*,
*un solo flujo*. Es una palabra gastada y además es apuesta de mesa: nadie compra un
sistema esperando perder control.

**Decisión de posicionamiento.** ObraFlow no compite en «control». Compite en **plata**:
es el único de la lista que puede mostrar el costo real de una orden desglosado en cuatro
componentes que se acumulan solos. El control es la consecuencia, no la promesa.
Por eso el titular termina en «su costo real» y esa es la única frase resaltada de la página.

### 1.2 Dónde son débiles y dónde somos débiles

- **Ellos ganan** en app móvil nativa, offline, evidencias fotográficas con GPS y firma
  del cliente en terreno. ObraFlow no tiene nada de eso, y por eso existe la sección
  «Lo que todavía no hace»: si el visitante necesita esas tres cosas, mejor que se vaya
  en el minuto dos y no en la reunión cuatro.
- **Nosotros ganamos** en costeo por OT, en tamaño (se entiende en una tarde) y en trato
  directo. Los tres están dichos explícitamente en la página.

---

## 2. Métricas: qué números usar y cuáles tirar

**Regla:** no se inventan métricas propias. Un producto sin clientes públicos que muestra
«98 % de entregas en tiempo» pierde credibilidad con el único lector que importa: el que
sabe del tema. En su lugar se citan datos del sector, con fuente, año y muestra.

Los tres que quedaron en la página, todos de **FMI + PlanGrid, «Construction Disconnected»
(2018), ~600 líderes de construcción**:

| Dato | Uso |
|---|---|
| **14 h/semana** por persona en retrabajo, conflictos y buscar información | Dimensiona el problema en la unidad que el gerente entiende: horas de su gente |
| **5,5 h/semana** sólo buscando datos del proyecto que ya existen | Precisa que el problema es de *registro*, no de esfuerzo |
| **52 %** del retrabajo global se origina en datos pobres y mala comunicación | Conecta el problema con la solución que vendemos |

Descartados a propósito: los US$ 177.500 M anuales y los US$ 31.000 M de retrabajo del
mismo estudio (cifras de EE.UU., irrelevantes para un contratista de Calama) y la caída
del 40 % de productividad 1970–2020 de McKinsey (verdadera pero demasiado macro para mover
a alguien).

**Fuentes**
- FMI + PlanGrid, *Construction Disconnected* (2018) — [informe](http://pg.plangrid.com/rs/572-JSV-775/images/Construction_Disconnected.pdf) · [resumen Autodesk](https://www.autodesk.com/blogs/construction/construction-disconnected-fmi-report/)
- McKinsey, *The construction productivity imperative* — [artículo](https://www.mckinsey.com/capabilities/operations/our-insights/the-construction-productivity-imperative)

---

## 3. Cómo se demuestra que hay personas atrás

La investigación de conversión B2B 2026 coincide en algo: **el contenido crudo y
verificable convierte mejor que el pulido y genérico**; el stock y el mockup brillante
debilitan la confianza. Cuatro dispositivos, todos verificables:

1. **Bitácora real.** La sección «Quiénes están atrás» lista los últimos tres cambios
   tomados del historial del repositorio, con fecha y tipo (`feat` / `fix`). No es un
   changelog escrito para la web. Es el mejor argumento de que el producto está vivo, y
   ningún competidor de la lista lo hace.
2. **Trato directo declarado.** «No hay un formulario que cae en un CRM. Escribís y
   contesta la persona que escribió el código.» Con mail y WhatsApp —canal por defecto
   del B2B en la región— en lugar de un formulario de captura.
3. **Marcas de resaltador.** Tres anotaciones a mano alzada sobre el texto ya escrito,
   como las hace un supervisor sobre una hoja impresa. Firma humana, no adorno.
4. **Alcance declarado.** Decir qué no hace, y sellarlo. Nadie automatiza esa decisión.

**Lo que deliberadamente NO se hizo:** no se puso una foto de perfil ni un nombre inventado
como «fundador». Una cara falsa destruye exactamente lo que estas cuatro cosas construyen.
Las fotos son de cuadrillas reales de banco de imágenes, presentadas como lo que son
(«Para quién está hecho»), nunca como «nuestro equipo».

---

## 4. Identidad visual

### 4.1 Concepto

**«Documento de faena».** El objeto central del producto es la orden de trabajo, y en la
región ese objeto tiene un cuerpo físico conocido: el **talonario numerado en triplicado**
—original a la oficina, copia al cliente, copia a la cuadrilla—. ObraFlow reemplaza ese
talonario. Entonces la landing se comporta como una hoja que ya salió a terreno: tiene
perforación, tiene sello, tiene marcas de resaltador y tiene fotos de la obra.

Ninguno de estos recursos es genérico; todos salen del mundo del cliente. Es la diferencia
entre una identidad y una plantilla.

### 4.2 Tipografía

Tres caras, tres trabajos. Ninguna es la elección segura del sector.

| Rol | Cara | Por qué |
|---|---|---|
| Titulares | **Bricolage Grotesque** 700/800 | Grotesca humanista con irregularidades deliberadas: se lee dibujada por alguien, no generada. Sostiene el argumento de que hay personas atrás desde la primera línea |
| Texto | **Hanken Grotesk** 400–700 | Grotesca cálida y muy legible en párrafo largo. Reemplaza a Inter, que es la cara por defecto de todo el software y no comunica nada |
| Datos y etiquetas | **Azeret Mono** 400/500 | Monoespaciada geométrica y técnica. Todo lo que sale del sistema —códigos de OT, montos, horarios de cron, etiquetas de sección— se ve como que sale del sistema |

Escala: 10,5 / 13 / 14,5 / 16 / 18 / 21 / 26 / 40 / 52 px. Lectura a 64 caracteres.
`text-wrap: balance` en titulares, `tabular-nums` en toda columna de números.

### 4.3 Color

Hereda la marca del producto (`#F5C518` sobre grafito) y le agrega un papel cálido.

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--paper` | `#F4F2EC` | `#131210` | Fondo |
| `--paper-2` | `#EBE7DC` | `#191712` | Banda alterna (la hoja de abajo del talonario) |
| `--ink` | `#141310` | `#F0EDE4` | Texto |
| `--muted` | `#5F5A50` | `#CFC9BE` | Texto secundario (6,3:1 / 11:1) |
| `--accent` | `#F5C518` | `#F5C518` | Marca |
| `--accent-ink` | `#6B5000` | `#F5C518` | Acento **cuando es texto** (6,8:1) |
| duotono | `#16150F` → `#EFE9D8` | igual | Fotografía |

**Reglas de contraste y saturación (las mismas que en el plan, ampliadas):**

- `#F5C518` nunca es texto sobre claro (2,0:1). Sobre claro va `--accent-ink`.
- El amarillo aparece en cuatro lugares y en ninguno más: la regla de 3 px del eyebrow,
  la barra superior de la ficha de OT, un botón, y las etiquetas de foto. Superficie total
  bajo el 2 % de la página.
- Los neutros son cálidos (matiz ~45°, saturación < 7 %). Un gris neutro al lado de un
  amarillo saturado lee como error de calibración.
- Los colores de estado son los del producto y no cuentan como acento. Sobre oscuro se
  aclaran para no bajar de 4,5:1.
- **Las fotos no aportan color.** Todas pasan por duotono grafito→hueso, lo que resuelve
  dos problemas de una: unifica material de banco heterogéneo y elimina los verdes y
  naranjas de la ropa de trabajo, que competirían con el amarillo de marca.

### 4.4 Fotografía

Cuatro imágenes, todas de **Pexels** (licencia libre, uso comercial, sin atribución
obligatoria — se acredita igual en el pie), recortadas al aspecto exacto de su lugar y
**empotradas como data URI** (≈ 620 KB en total) para que la página sea un archivo único
sin dependencias externas.

| Imagen | Dónde | Qué hace |
|---|---|---|
| Planta industrial con cuadrillas y andamios | Banda a sangre bajo el hero | Plano de situación: dónde pasa esto |
| Equipo con cascos sobre un plano | «El punto de partida» | La decisión se toma acá; el dato queda en papel |
| Seis operarios de cuadrilla | «Quiénes están atrás» | Para quién está hecho, sin disfrazarlo de foto propia |
| Dos operarios en obra | Cierre | Cara humana junto al CTA |

Técnica de duotono: `mix-blend-mode: multiply` sobre fondo del tono alto + capa
`lighten` con el tono bajo. Sin filtros SVG, sin dependencias, funciona en ambos temas.

### 4.5 Librería

Una sola, y elegida por lo que significa, no por lo que hace:

**`rough-notation` 0.5.1** (3,8 kB gzip, MIT, desde cdnjs). Dibuja anotaciones a mano
alzada sobre el texto. Se usa exactamente tres veces —el titular, el costo total y la
frase de quién contesta— y sólo en pantallas ≥ 920 px. Con `prefers-reduced-motion` se
dibuja sin animar. El texto se lee entero sin ellas: la marca señala, no informa.

Descartadas: Tailwind CDN, GSAP, AOS, Framer, cualquier framework. La página son 618 KB
de los cuales 620 KB son las fotos; el resto es HTML, CSS y 60 líneas de JavaScript.

---

## 5. Qué cambió respecto de la primera versión

| | v1 | v2 |
|---|---|---|
| Tipografía | Archivo + Inter + IBM Plex Mono | Bricolage Grotesque + Hanken Grotesk + Azeret Mono |
| Fondo | Gris frío neutro | Papel cálido con banda alterna y perforación |
| Imágenes | Ninguna | Cuatro fotos duotono empotradas |
| Métricas | Ninguna | Tres del sector, con fuente citada |
| Personas | Ausentes | Sección propia con bitácora real del repositorio y contacto directo |
| Posicionamiento | Implícito | Explícito contra la categoría: costo, no control |
| Librerías | Ninguna | `rough-notation` (marcas a mano) |
| Sello | — | Uno, sobre el alcance declarado |

---

## 6. Pendientes antes de publicar

Los mismos cinco del plan, más dos que agrega esta versión:

| # | Qué | Dónde |
|---|---|---|
| 1 | `APP_URL` de producción | Constante única al final del HTML |
| 2 | Precio de los planes | Sección Capacidad |
| 3 | Mail de contacto real | `hola@obraflow.app` (placeholder) |
| 4 | **Número de WhatsApp** | `https://wa.me/` sin número — el botón está muerto hasta completarlo |
| 5 | **Bitácora automática** | Hoy los tres cambios están escritos a mano en el HTML. Conviene generarlos del `git log` en el build para que no envejezcan |
| 6 | Logos de clientes / testimonios | Cuando haya permiso escrito |
| 7 | Métricas propias | Cuando haya suficientes organizaciones para publicar un número honesto, se suman a las tres del sector |
