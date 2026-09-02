# ObraFlow — Movimiento, color y fotografía (v5)

> Cuarta y quinta pasada. Cierra la serie: [plan](PLAN-UX-LANDING.md) ·
> [investigación](INVESTIGACION-Y-IDENTIDAD.md) · [decisiones de forma](DECISIONES-v3.md).
> Entregable: `apps/landing/index.html`.

---

## 1. Movimiento: tres capas, cada una con su motivo

**Regla de fondo:** ninguna animación decora. Si no dice algo, no está.

### Capa 1 · Entrada — la ve todo el mundo

Keyframes CSS normales, resueltos en poco más de un segundo.

| Elemento | Movimiento | Qué dice |
|---|---|---|
| Foto del banner | Ken Burns de 1,11 a 1, y después deriva lenta de 24 s en bucle | La faena no está congelada |
| Velo de oscurecimiento | Entra en 1 s, antes que el texto | El titular nunca se lee sobre la foto pelada |
| Filete amarillo · titular · bajada · botones | Se destapan de abajo hacia arriba (`clip-path` + desplazamiento de 44 px), escalonados a 0 / 120 / 280 / 430 ms | Orden de lectura, marcado con el tiempo |

### Capa 2 · Revelado por scroll — nativo de CSS

`animation-timeline: view()` y `scroll(root)`. Sin librerías y sin IntersectionObserver.

| Elemento | Movimiento |
|---|---|
| Bloques y encabezados | Se destapan con máscara: 44 px de recorrido y `clip-path` de abajo hacia arriba |
| Grupos (números, columnas, planes, bitácora) | Cinco rangos de entrada distintos: la cascada se ve |
| Ficha de la orden | Entra con perspectiva: rota 9° sobre el eje X y se endereza |
| Vía del ciclo | Se dibuja de izquierda a derecha con `stroke-dashoffset` |
| Nodos del ciclo | Aparecen en secuencia con un rebote del 45 %, siguiendo el recorrido |
| Subrayado del costo total | Se traza de izquierda a derecha |
| Banda fotográfica | Paralaje del 16 % |
| Barra superior | Gana fondo sólido y filete en los primeros 96 px |
| **Barra de progreso** | Filete amarillo bajo la barra que se llena con el avance de la página |

### Capa 3 · Dos bucles que no paran

| Elemento | Movimiento | Qué dice |
|---|---|---|
| Punto de estado de la ficha | Latido de 2,6 s: el halo amarillo se expande y se apaga | **Esa orden está corriendo ahora** |
| Punto sobre la vía del ciclo | Recorre Pendiente → Asignada → En ejecución cada 5,5 s, con estela | **El sistema está vivo y las órdenes avanzan** |

### Números que se cuentan

Los tres del sector (14 h · 5,5 h · 52 %) y los cinco de la suma del costo cuentan hacia
arriba al entrar en pantalla. En la sección del costo eso *es* el argumento: el costo se
acumula, y el número lo hace delante del lector.

Son 30 líneas de JavaScript con `IntersectionObserver`. **El valor final ya está escrito
en el HTML**: si el script no corre, los números se ven igual, sólo que quietos.

### Accesibilidad y degradación

- Las tres capas viven dentro de `@media (prefers-reduced-motion: no-preference)`.
  Con movimiento reducido, la página queda estática y completa.
- El revelado por scroll va dentro de `@supports (animation-timeline: view())`. Donde no
  hay soporte —Firefox estable, tras un flag— **el contenido ya está visible**. Nunca
  existe el caso de la sección invisible porque el observador no disparó.
- Soporte de la técnica: Chrome y Edge 115+, Safari 26+. Cerca del 84 % del tráfico.

---

## 2. Fotografía en color, elegida por su color

Se abandonó el monocromo. Pero el problema que resolvía el monocromo seguía existiendo:
la ropa de trabajo trae verdes, naranjas y azules que le pelean al amarillo de marca.

**La solución no fue apagar la foto: fue elegir la foto.** Las tres imágenes tienen ropa
y cascos de **alta visibilidad amarilla dominante**. El amarillo de seguridad de una obra
y el amarillo de ObraFlow son el mismo amarillo, así que ahora la fotografía **refuerza
la marca en vez de competirle**.

| Imagen | Dónde | Color dominante |
|---|---|---|
| Planta industrial con cuadrillas | Banner de entrada | Cascos amarillos y naranjas sobre acero gris |
| Cuadrilla sobre andamio | Banda a sangre | Chalecos de alta visibilidad amarillos |
| Equipo revisando un plano | «Quiénes están atrás» | Chalecos amarillos, interior neutro |

Tratamiento: `saturate(1.06)` y un toque de contraste. Nada más. En el banner se suma un
degradado de oscurecimiento que garantiza más de 12:1 en el titular.

---

## 3. El amarillo, con protagonismo

Antes aparecía cuatro veces. Ahora tiene ocho apariciones, **todas con un motivo**, y una
grande. La disciplina no cambió: el amarillo no se reparte, se apunta.

| Dónde | Qué señala |
|---|---|
| **La sección del costo, campo completo** | El argumento central de la página. Negro sobre amarillo, 11,6:1 |
| Botón negro sobre ese campo | El CTA del medio, aprendido de la competencia: no alcanza con tenerlo arriba y abajo |
| Filete de entrada sobre el titular | Firma de marca en el primer segundo |
| Reglas de los tres números del sector | Los datos que sostienen el problema |
| **Tramo recorrido de la vía del ciclo** | Lo que la orden ya avanzó. El resto de la vía queda gris: el amarillo **es** el progreso |
| Punto de estado y punto viajero | Lo que está vivo |
| Barra de progreso de lectura | Dónde está parado el lector |
| Filete del plan del medio y filetes al pasar el mouse | Dónde mirar primero |

Regla que no se movió: **el amarillo nunca es texto sobre fondo claro** (2,0:1). Sobre
claro va `#6B5000`; sobre el campo amarillo el texto es `#120E00` y `#5A4700`.

---

## 4. Qué se tomó de la competencia

Se revisó [Appenate](https://www.appenate.com/es/software-de-gestion-de-construccion/),
que compite en el mismo rubro.

- **Tomado:** repiten el llamado a la acción a lo largo de toda la página, no sólo en las
  puntas. Se agregó un CTA en el medio, sobre el campo amarillo.
- **Rechazado:** su prueba es escala («75.000 usuarios en más de 60 países»), testimonios
  y sellos de G2 y Capterra. No tenemos nada de eso y **inventarlo sería exactamente lo
  que este proyecto decidió no hacer**. Nuestra prueba sigue siendo otra: datos del sector
  con fuente, números que cierran y la bitácora real del repositorio.
- **Confirmado:** ellos encabezan con «capaz de funcionar sin conexión». Es justo lo que
  ObraFlow no hace, y es la mejor razón para dejar esa limitación escrita en el cierre.

---

## 5. Pendientes

| # | Qué | Dónde |
|---|---|---|
| 1 | `APP_URL` de producción | Constante única al final del HTML |
| 2 | Precio de los planes | Sección Planes |
| 3 | Mail de contacto real | `hola@obraflow.app` |
| 4 | Número de WhatsApp | `https://wa.me/` sigue sin número: ese botón no lleva a ningún lado |
| 5 | Bitácora automática desde `git log` | Hoy los tres cambios están escritos a mano |
| 6 | Logos de clientes y testimonios | Cuando haya permiso escrito |
