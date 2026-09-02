# ObraFlow — Plan de acción UX/UI para la landing

> Documento de diseño. Define a quién le hablamos, qué le prometemos, qué evidencia
> usamos y con qué sistema visual se construye la página.
> Entregable asociado: `apps/landing/index.html`.

---

## 1. Punto de partida: qué es realmente el producto

Lectura del código, no del pitch. ObraFlow es un **sistema de operaciones de trabajo en
terreno, multi-tenant**, con la Orden de Trabajo (OT) como objeto central.

| Capacidad | Dónde vive en el código | ¿Se puede prometer? |
|---|---|---|
| OT con código, tipo, prioridad, cliente, ubicación, contrato, cuadrilla | `WorkOrder` (`schema.prisma`) | Sí |
| Máquina de estados validada (7 estados) + historial por OT | `WO_STATUS_TRANSITIONS`, `WOStatusLog`, `changeStatus()` | Sí |
| Costeo acumulado: HH + Materiales + Subcontrato + Extras | `costHH/costMaterials/costSubcontract/costExtra/costTotal`, `rollupCostHH()`, `rollupCostMaterials()` | Sí |
| Horas extra a 1,5× | `timesheets.service.ts` → `(hn + he*1.5) * rate` | Sí |
| Cuadrillas propias y subcontratadas, con líder y vehículo | `Crew`, `Subcontractor`, `Vehicle` | Sí |
| Materiales con unidad, costo, stock y stock mínimo | `Material`, `InventoryMovement` | Sí |
| 5 roles con permisos validados en servidor | `UserRole` + `@Roles()` en los controllers | Sí |
| Portal de cliente separado, sólo lectura, sin costos | `client-portal.*` (select sin campos de costo) | Sí |
| Alertas diarias por mail: OT vencidas (08:00) y stock bajo (08:30) | `notifications.service.ts` (`@Cron`) | Sí |
| Planificación mensual en calendario | `PlanningPage.tsx` | Sí |
| Reportes + export CSV / PDF | `ReportsPage.tsx` (jspdf, html2canvas) | Sí |
| Límites por plan | `PLAN_LIMITS` | Sí (como capacidad, no como precio) |
| Evidencias fotográficas | modelo `Evidence` existe, **sin endpoint ni UI** | **No** |
| App nativa / offline | no existe | **No** |
| GPS de vehículos, firma en terreno, facturación electrónica | no existe | **No** |
| Precios públicos | Stripe existe, la página de billing fue removida del front | **No** — venta asistida |

**Conclusión de alcance:** la landing puede ser muy concreta en operación y costeo,
y tiene que ser explícita en lo que no hace. No se inventa ni una función.

---

## 2. Cliente objetivo

**ICP primario.** Empresa contratista de servicios técnicos y mantenimiento industrial
en LATAM (el seed es Chile: CLP, RUT, `America/Santiago`; la copy del producto usa
voseo rioplatense). Entre 10 y 150 personas, de 2 a 20 cuadrillas propias y
subcontratadas, facturando a clientes grandes: mineras, inmobiliarias, puertos,
retail, industria.

**Tres personas, tres intereses distintos:**

| Persona | Rol en el sistema | Lo que necesita ver en la landing |
|---|---|---|
| Dueño / Gerente de Operaciones — **decide y paga** | `ORG_ADMIN` | Que cada trabajo termine en un costo confiable y que el equipo lo use sin resistencia |
| Planificador / Supervisor — **usa todos los días** | `PLANNER`, `SUPERVISOR` | Que cargar una OT y asignarla sea rápido, y que el estado no dependa de llamar por teléfono |
| Cliente final — **no compra, pero se queja** | `ClientUser` | Que pueda mirar el avance sin pedirlo por mail |

**Los cuatro dolores reales que compramos:**

1. No se sabe cuánto costó de verdad cada trabajo hasta fin de mes, y a veces nunca.
2. Las OT se vencen sin que nadie avise.
3. El cliente llama para preguntar el estado, y hay que llamar a la cuadrilla para responderle.
4. Las horas y los materiales se transcriben a mano a una planilla, con errores.

**Expectativas del cliente frente a nosotros:** que sea simple (la comparación mental es
Excel + WhatsApp, no SAP), en español, que se entienda en una tarde, y que dé un número
de costo del que se pueda hablar con confianza frente al cliente final.

**Lo que podemos entregar hoy:** exactamente las filas "Sí" de la tabla §1. Ese es el
techo de la promesa. La landing no lo pasa.

---

## 3. Estrategia de mensaje

**Promesa central (una sola frase):**

> Cada orden de trabajo, con su estado y su costo real.

**Jerarquía de información en tres niveles.** Todo lo que se ve en la página cae en uno
de estos niveles, y el peso visual sigue estrictamente ese orden.

- **Nivel 1 — lo que tiene que quedar aunque el lector se vaya a los 8 segundos:**
  ObraFlow convierte la operación de terreno en dos cosas medibles: estado y costo.
  *Soporte visual:* H1 + ficha de OT real en el hero.
- **Nivel 2 — las tres pruebas de que la promesa es cierta:**
  (a) la cadena de estados no se rompe; (b) el costo se acumula solo; (c) el cliente mira sin llamar.
  *Soporte visual:* diagrama de estados, tabla de costos con números que cierran, panel del portal.
- **Nivel 3 — el detalle que da confianza a quien evalúa en serio:**
  roles y permisos, recursos, alertas automáticas, capacidad por plan, límites del producto.
  *Soporte visual:* tablas y bloques compactos, tipografía chica, sin ilustración.

**Regla anti-sobrecarga:** una sección = una afirmación + una sola pieza de evidencia.
Si una sección necesita dos piezas de evidencia, son dos secciones o sobra una.

**Tono y voz.** Español rioplatense sobrio, alineado con la copy que ya existe en el
producto (`Planificá, asigná y controlá`). Se prefieren sustantivos e infinitivos para
que la página también funcione en Chile y Perú; el voseo se reserva para los CTA de
trato directo. Nada de superlativos de software ("revolucionario", "potente",
"all-in-one"). Los números se dan sólo si salen del sistema.

**Decisión editorial de riesgo (deliberada):** incluir una sección corta titulada
*"Lo que todavía no hace"*. En venta asistida B2B, declarar el límite antes de la
llamada filtra a los que iban a rebotar igual y compra credibilidad con el resto.

---

## 4. Arquitectura de la página

Diez bloques. El orden replica la lógica con que un gerente de operaciones evalúa:
primero el objeto, después el control, después la plata, después la gente, después la
letra chica.

| # | Bloque | Afirmación única | Evidencia |
|---|---|---|---|
| 1 | Hero | Cada OT, con su estado y su costo real | Ficha de OT-000003 con costo que cierra |
| 2 | El punto de partida | El trabajo se hace; el registro casi nunca | Prosa corta, sin gráfico |
| 3 | Estados | Una OT sólo se mueve a donde puede moverse | Diagrama SVG de la máquina de estados real |
| 4 | Costo | El costo no se calcula, se acumula | Desglose HH + materiales con datos del seed |
| 5 | Roles | Cada uno ve y toca lo que le corresponde | Tabla de 5 roles |
| 6 | Portal del cliente | El cliente entra y mira, nada más | Panel "ve / no ve" |
| 7 | Recursos y alertas | Detrás de cada OT hay gente, equipos y stock | Lista de entidades + los dos cron reales |
| 8 | Capacidad | Se paga por tamaño de operación | Tres niveles con los límites de `PLAN_LIMITS` |
| 9 | Alcance | Lo que todavía no hace | Prosa corta, sin adorno |
| 10 | Cierre | Mirá la demo con datos cargados | CTA + credencial de demo |

**Ritmo visual.** El fondo alterna papel → papel → **invertido (estados)** → papel ×5 →
**invertido (cierre)**. Los dos únicos bloques oscuros son los dos momentos de mayor
carga: el mecanismo y la conversión. La saturación fuerte del sistema de estados sólo
aparece sobre fondo oscuro, que es donde esos colores rinden.

---

## 5. Sistema visual

Hereda el sistema del producto (`apps/web/tailwind.config.js`): amarillo de señalética
`#F5C518` sobre grafito `#111111`, Inter como cara de interfaz. La landing no inventa
una marca nueva; le agrega una cara de titulares y una de datos.

**Color — 6 valores nombrados**

| Token | Light | Dark | Uso |
|---|---|---|---|
| `--ink` | `#111111` | `#F1EFE9` | Texto principal |
| `--paper` | `#F6F5F2` | `#121210` | Fondo de página (gris cálido, sesgado hacia el acento) |
| `--surface` | `#FFFFFF` | `#1A1A17` | Superficies de evidencia |
| `--line` | `#E4E1D9` | `#2C2B26` | Hairlines |
| `--muted` | `#6F6B61` | `#A6A199` | Texto secundario |
| `--accent` | `#F5C518` | `#F5C518` | Acento de marca |
| `--accent-ink` | `#6E5200` | `#F5C518` | Acento **cuando es texto** |

**Reglas de contraste y saturación (no negociables):**

- El amarillo `#F5C518` **nunca es texto sobre fondo claro** (2,0:1). Sobre claro se
  usa `--accent-ink` `#6E5200` (6,7:1 sobre papel). Sobre oscuro sí se usa puro (10,5:1).
- Amarillo como fondo sólo con texto `#111111` encima (11,8:1).
- Superficie máxima del acento: reglas de 4 px, puntos, un botón. Nunca un bloque grande;
  el amarillo saturado a gran superficie fatiga y baja la jerarquía de todo lo demás.
- Los neutros son **cálidos** (matiz ~45°, saturación < 6 %), no grises puros: el gris
  neutro al lado de un amarillo saturado lee como error de calibración.
- Los colores semánticos de estado son los del código y **no cuentan como acento**:
  `#8E9196` `#1E88E5` `#F5C518` `#FB8C00` `#43A047` `#111111` `#E53935`. Sobre fondo
  oscuro se aclaran (`#B8BBC0` `#6BB6F7` `#FFAE47` `#71C97C` `#FF8079`) para no bajar de
  4,5:1. Sobre fondo claro van como píldora: fondo teñido + texto oscurecido del mismo matiz.

**Tipografía — 3 roles**

- **Titulares: Archivo** 700/800, tracking −0,03 em. Grotesca industrial, ancha, de
  señalética. Deliberadamente distinta de Inter para que el titular no lea como interfaz.
- **Texto: Inter** 400/500/600 — la misma del producto. Continuidad landing → app.
- **Datos: IBM Plex Mono** 400/500 — códigos de OT, montos, unidades, etiquetas de sección.
  Es la cara de la evidencia: todo lo que sale del sistema se ve como que sale del sistema.
- Escala: 13 / 15 / 17 / 21 / 28 / 40 / 60 px. Lectura a 66 caracteres. `text-wrap: balance`
  en titulares. `tabular-nums` en toda columna de números.

**Layout.** Columna única de 1080 px, contenido de lectura a 66ch alineado a la izquierda
de esa columna, y las piezas de evidencia rompiendo al ancho completo. Sin grillas de
tarjetas idénticas: borde, relleno y sombra se gastan por rol — sólo la evidencia recibe
superficie blanca y hairline; el texto va directo sobre el papel. Las etiquetas de sección
en mono nombran la entidad real del modelo de datos (`ORDEN DE TRABAJO`, `ESTADOS`,
`COSTO`, `ROLES`, `PORTAL`, `RECURSOS`, `CAPACIDAD`, `ALCANCE`): son información, no
decoración — por eso **no** se numeran, porque las secciones no son una secuencia.

**Movimiento.** Mínimo y funcional: sombra de la barra al hacer scroll, estados de hover,
foco visible en teclado. Nada aparece por scroll: la página en reposo se lee entera.
`prefers-reduced-motion` respetado.

---

## 6. Reglas de contenido

1. **Cero lorem y cero dato inventado.** Todos los nombres, materiales, tarifas y
   códigos salen de `apps/api/prisma/seed.ts`.
2. **Los números cierran.** El costo del hero es el mismo que el del desglose de la
   sección 4: HH $690.000 + Materiales $126.000 + Subcontrato $0 + Extras $25.000 =
   **$841.000**. Un lector que sume tiene que llegar al mismo total.
3. **Todo dato de ejemplo se declara como ejemplo**, con pie de figura.
4. **Sin métricas de marketing sin fuente.** Se retiran los "98 % de entregas en tiempo"
   y "50+ empresas" que hoy figuran en `LoginPage.tsx`: no hay de dónde sacarlos.

---

## 7. Decisiones abiertas (a completar antes de publicar)

| # | Decisión | Estado |
|---|---|---|
| 1 | URL de producción de la app | **Pendiente.** La landing tiene una única constante `APP_URL` al final del archivo; mientras esté vacía, los CTA llevan al bloque de cierre |
| 2 | Precio de los planes | **Pendiente.** Se muestran los límites reales de `PLAN_LIMITS` como capacidad y el CTA es "Pedir una cotización", coherente con la venta asistida actual (la página de billing fue removida del front) |
| 3 | Mail de contacto | **Pendiente.** Placeholder `hola@obraflow.app` |
| 4 | Contraseña de demo | Se publica el usuario `admin@demo.com`, no la contraseña: la pantalla de login ya tiene el botón "Usar demo" que la completa |
| 5 | Logos de clientes / testimonios | Fuera de alcance hasta tener permiso escrito de los clientes reales |

---

## 8. Plan de ejecución

- [x] **Fase 1 — Auditoría.** Modelo de datos, endpoints, guards, crons, front y seed leídos; tabla de capacidades §1 cerrada.
- [x] **Fase 2 — Estrategia.** ICP, personas, dolores, promesa y jerarquía de tres niveles definidas.
- [x] **Fase 3 — Sistema visual.** Tokens de color con contrastes verificados, tres caras tipográficas, reglas de saturación.
- [x] **Fase 4 — Arquitectura y copy.** Diez bloques, una afirmación y una evidencia por bloque.
- [x] **Fase 5 — Construcción.** `apps/landing/index.html`: HTML estático, sin dependencias, con tema claro y oscuro, diagrama SVG hecho a mano y accesibilidad de foco.
- [ ] **Fase 6 — Cierre.** Completar las cinco decisiones abiertas de §7, apuntar `APP_URL`, y publicar (sirve como estático o desde `apps/api/public`).

### Siguientes pasos sugeridos (fuera del alcance de este entregable)

1. Reemplazar las métricas sin fuente de `LoginPage.tsx` por las mismas afirmaciones verificables de la landing.
2. Instrumentar: un evento por CTA (`demo`, `cotizacion`, `contacto`) para saber qué bloque convierte.
3. Cuando exista carga de evidencias fotográficas (el modelo `Evidence` ya está), moverla de §9 "Alcance" al bloque 7.
