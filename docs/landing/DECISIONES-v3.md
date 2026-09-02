# ObraFlow — Landing v3: qué se sacó y por qué

> Tercera pasada, sobre feedback directo. El [plan](PLAN-UX-LANDING.md) fijó qué decir;
> la [investigación](INVESTIGACION-Y-IDENTIDAD.md) fijó el posicionamiento y las fuentes.
> Este documento fija **la forma**, y sobre todo lo que se eliminó.
> Entregable: `apps/landing/index.html`.

---

## 1. El pedido

Cinco cosas, textuales:

1. Versión clara, punto uno.
2. Una imagen apenas entrás, a modo de banner, con el texto encima y contraste garantizado.
3. Que emane seguridad, como entrar a la página de Apple.
4. Está demasiado cargada: descomprimir sin ser repetitivo, y acortar mucho.
5. Desclaudificar: eliminar los patrones que delatan una página hecha con IA. En
   particular las tarjetas con borde de color, y el modo oscuro casi negro que cuesta leer.

---

## 2. Inventario de patrones eliminados

Lo que sigue es la lista de lo que se sacó. Ninguno de estos elementos volvió disfrazado
de otra cosa: se eliminaron de raíz.

| Patrón | Dónde estaba | Por qué se fue |
|---|---|---|
| Franja de bullets mono en mayúsculas con cuadraditos amarillos (`▪ DATOS CARGADOS ▪ SIN INSTALACIÓN`) | Bajo el hero | Es la firma más reconocible de una landing generada. No aportaba información que no estuviera en el resto |
| Píldoras de estado con fondo teñido y texto del mismo matiz (`Crítica`, `En ejecución`) | Ficha de OT | Badge de librería de componentes. Ahora el estado es un punto de 8 px y texto plano; la prioridad es una fila más de la ficha |
| Cajas con borde de color y barra lateral de color | Diagrama de estados | Ídem. El diagrama pasó a ser una vía horizontal con nodos: sin una sola caja |
| Barra amarilla arriba de la tarjeta | Ficha de OT | El patrón «accent bar sobre card redondeada» |
| Listas con íconos de tilde y cruz | Sección portal | Se reemplazaron por dos párrafos: qué ve y qué no ve |
| Anotaciones a mano alzada (`rough-notation`) | Tres lugares | Contradicen la calma que pide una página que quiere transmitir seguridad. La librería se sacó entera: la página ya no carga JavaScript externo |
| Sello de goma rotado | Sección alcance | Recurso decorativo. El alcance ahora se dice en tres líneas dentro del cierre |
| Línea de perforación punteada entre secciones | Toda la página | El cambio de sección ahora lo hace el espacio y el tono de fondo |
| Etiquetas de sección en mono, mayúsculas y con guion amarillo | Todas las secciones | Ocho repeticiones del mismo gesto. Los títulos se explican solos |
| Modo oscuro casi negro | Toda la página | Reemplazado por una única versión clara |
| Fotografía en duotono a dos colores | Cuatro imágenes | Reemplazada por monocromo limpio: menos «tratada», más documental |
| Tres familias tipográficas | Toda la página | Ver §4 |

---

## 3. Estructura: de trece bloques a nueve

Se eliminó toda redundancia, no información. Cada tema quedó dicho una sola vez.

| v2 | v3 |
|---|---|
| Hero + banda de faena (2 bloques) | **Banner de entrada** con la foto a sangre y el texto encima (1) |
| Punto de partida + 3 métricas | **El problema, medido** (1) |
| Ficha de OT en el hero | **La orden** (1) — la ficha pasó a ser una sección propia, con aire |
| Costo con dos tablas de detalle + fórmula | **El costo** (1) — una sola línea tipográfica de cuatro sumandos |
| Estados | **El ciclo** (1) — rediseñado |
| Roles + Portal + Recursos + Alertas (4 bloques) | **Cada uno ve lo suyo** (1) — tres columnas: tu equipo, tu cliente, el sistema |
| Quiénes están atrás | **Un equipo chico** (1) + banda fotográfica |
| Capacidad | **Planes** (1) |
| Alcance + Cierre (2 bloques) | **Cierre** (1) — el alcance entró como párrafo antes del CTA |

**Lo que se sacrificó a propósito:** las dos tablas de detalle de costo (partes de horas
línea por línea y materiales línea por línea). Probaban lo mismo que prueba la suma, con
diez veces más tinta. Si hace falta ese nivel de detalle, es material de la demo, no de
la landing.

---

## 4. Tipografía: una sola familia

**Hanken Grotesk**, pesos 400 a 800. Nada más.

El apilado display + texto + monoespaciada es el reflejo automático de cualquier página
generada. Usar una sola familia y dejar que el **peso, el tamaño y el espacio** hagan la
jerarquía es más difícil y se nota: es exactamente lo que hace Apple con San Francisco.

- Titular del banner: 72 px, peso 700, tracking −0,042 em.
- Títulos de sección: hasta 46 px, peso 700.
- Bajada: 21 px, peso 400, color secundario.
- Texto: 17 px con interlínea 1,66.
- Los números no van en monoespaciada: van en la misma familia con `tabular-nums`.

---

## 5. Color: una sola versión, clara

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#FFFFFF` | Fondo |
| `--bg-2` | `#F5F3EF` | Banda alterna, cálida |
| `--ink` | `#191713` | Texto (13,9:1) |
| `--muted` | `#6E6A60` | Secundario (5,4:1) |
| `--faint` | `#7A7568` | Pies y notas (4,6:1) |
| `--accent` | `#F5C518` | Marca |
| `--accent-ink` | `#6B5000` | Acento cuando es texto (7,5:1) |

**El amarillo aparece cuatro veces en toda la página** y en ningún lugar más: el logotipo,
el botón primario (dos instancias), el punto de estado de la ficha y el subrayado del
costo total. Nada más. Esa es la diferencia entre una marca y un tema de color.

**Los dos bloques oscuros** —el banner de entrada y el cierre— usan `#141310` con texto
`#F3F1EB` y un degradado de oscurecimiento sobre la foto que garantiza más de 12:1 en el
titular. No son «modo oscuro»: son dos anclas que abren y cierran una página clara.

---

## 6. El diagrama, rediseñado

Antes: siete cajas con borde de color sobre fondo negro. Ahora: una **vía horizontal**
con cinco nodos y los verbos de transición debajo de la línea.

- El nodo relleno de amarillo es el único estado destacado: el que está corriendo.
- El nodo negro sólido es el terminal: facturada.
- La pausa y la cancelación cuelgan en punteado, sin caja y sin color.
- Un renglón al costado dice lo que el dibujo no puede: «completada y facturada ya no se cancelan».

Cero cajas, cero relleno de color, y la misma información.

---

## 7. Peso y dependencias

- **Un solo archivo HTML.** Las dos fotografías van empotradas como data URI.
- **Cero librerías.** No hay JavaScript externo. El único script son ocho líneas para
  apuntar los botones a `APP_URL`.
- Única dependencia de red: la hoja de Google Fonts, con pila de reemplazo declarada
  (`-apple-system`, `Segoe UI`, `Roboto`).

---

## 8. Pendientes

Los mismos de siempre, sin novedades:

| # | Qué | Dónde |
|---|---|---|
| 1 | `APP_URL` de producción | Constante única al final del HTML |
| 2 | Precio de los planes | Sección Planes |
| 3 | Mail de contacto real | `hola@obraflow.app` |
| 4 | Número de WhatsApp | `https://wa.me/` está sin número: el botón no lleva a ningún lado |
| 5 | Bitácora automática desde `git log` | Hoy los tres cambios están escritos a mano |
| 6 | Logos de clientes | Cuando haya permiso escrito |

---

## 9. Movimiento (v4)

Dos capas, ningún framework, **cero JavaScript de animación**. El único script de la
página siguen siendo las ocho líneas que apuntan los botones a `APP_URL`.

### Capa 1 — Entrada (la ve todo el mundo)

Keyframes CSS normales, orquestados en menos de un segundo:

| Elemento | Movimiento |
|---|---|
| Foto del banner | Ken Burns: escala 1,07 → 1 en 1,6 s |
| Velo de oscurecimiento | Aparece en 0,9 s, así el titular nunca se lee sobre la foto pelada |
| Titular · bajada · botones | Suben 20 px con opacidad, escalonados a 100 / 220 / 330 ms |
| Barra superior | Sube 12 px |
| Punto de estado de la ficha | Respiración de 3,4 s: el halo amarillo se expande y se apaga, porque esa orden está corriendo |

### Capa 2 — Revelado por scroll (nativo)

`animation-timeline: view()` y `scroll(root)`: **animaciones de scroll nativas de CSS**,
sin IntersectionObserver y sin librería.

| Elemento | Movimiento |
|---|---|
| Encabezados y bloques | Suben 20 px con opacidad al entrar |
| Grupos (números, columnas, planes, bitácora) | Escalonados con cuatro rangos de entrada distintos |
| Vía del diagrama de estados | Se dibuja de izquierda a derecha con `stroke-dashoffset` |
| Nodos del diagrama | Aparecen en secuencia, uno detrás del otro, siguiendo el recorrido |
| Subrayado del costo total | Se dibuja de izquierda a derecha |
| Banda fotográfica | Paralaje suave del 7 % |
| Barra superior | Gana fondo sólido y filete en los primeros 96 px de scroll |

### Por qué así y no con una librería

1. **Peso.** Una librería de scroll pesa entre 25 y 60 kB. Esto pesa cero: son
   declaraciones CSS que corren en el compositor del navegador, fuera del hilo principal.
2. **Degradación limpia.** Todo va dentro de `@supports (animation-timeline: view())`.
   Donde no hay soporte —hoy Firefox estable, que lo tiene tras un flag— **el contenido
   simplemente ya está visible**. No existe el caso clásico de la sección que quedó
   invisible porque el observador nunca disparó.
3. **Estado de reposo correcto.** Lo que está en pantalla al cargar se ve completo: el
   progreso de la animación se calcula por la posición del elemento, no por un evento.
4. **Accesibilidad.** Las dos capas viven dentro de `@media (prefers-reduced-motion:
   no-preference)`. Con movimiento reducido activado la página es exactamente la v3.

Soporte de la técnica al momento de escribir esto: Chrome y Edge 115+, Safari 26+,
Firefox tras flag. Alrededor del 84 % del tráfico global.
