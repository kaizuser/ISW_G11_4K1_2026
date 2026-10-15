# Guía de Estilo de Código
**Proyecto:** EcoHarmony Park — User Story "Comprar Entradas" (TP N° 6, Grupo 11, Curso 4K1)  
**Lenguaje:** TypeScript (backend Express y frontend React)  
**Propósito:** La consigna del TP6 exige implementar la User Story con el documento de estilo de código seleccionado por el grupo. Este es ese documento y su cumplimiento es obligatorio.

---

## 1. Herramientas

Las reglas automatizables las aplican las herramientas, no la revisión. Un cambio no está terminado si alguno de estos comandos falla.

| Herramienta | Qué controla | Comando |
| :--- | :--- | :--- |
| **Prettier** | Formato: comillas simples, coma final, indentación | `npm run format` |
| **ESLint + typescript-eslint** | Errores y malas prácticas (backend); Oxlint en el frontend | `npm run lint` |
| **TypeScript** con `strict: true` | Tipado de código y tests | `npm run typecheck` |
| **Vitest** | Tests | `npm test` |

---

## 2. Idioma

| Elemento | Idioma | Ejemplo |
| :--- | :--- | :--- |
| Código: clases, funciones, variables, archivos | Inglés | `purchaseTickets`, `visitDate`, `park-calendar.ts` |
| Valores de negocio (enums) | Español, como en la User Story | `PassType.REGULAR`, `PaymentMethod.EFECTIVO`, `PurchaseStatus.PENDIENTE_PAGO` |
| Códigos de error del API | Inglés, `SCREAMING_SNAKE_CASE` | `PARK_CLOSED` |
| Mensajes al usuario y textos de la interfaz | Español neutro | `"El parque está cerrado los lunes, el 25 de diciembre y el 1 de enero."` |
| Comentarios | Inglés, solo para explicar el **porqué** | `// Parsed as a calendar date to avoid UTC shifting the weekday.` |
| Documentación | Español neutro | — |

Los valores de negocio quedan en español porque son el lenguaje compartido con el cliente: el visitante elige "EFECTIVO" o "TARJETA" y el código usa esas mismas palabras.

---

## 3. Nombres

| Elemento | Convención | Ejemplo |
| :--- | :--- | :--- |
| Clases, interfaces, tipos, enums | `PascalCase` | `Purchase`, `PaymentGateway` |
| Funciones, variables, propiedades | `camelCase` | `discountPercentFor()`, `ticketCount` |
| Valores de enum y constantes globales | `SCREAMING_SNAKE_CASE` | `PENDIENTE_PAGO`, `MAX_TICKETS_PER_DATE` |
| Archivos y carpetas | `kebab-case` | `park-calendar.ts`, `purchase-tickets.ts` |
| Booleanos | Prefijo `is`, `has`, `can` | `isOpenOn()`, `isFinal()` |
| Implementaciones de prueba | Prefijo según su función | `FixedClock`, `FakePaymentGateway`, `SpyEmailSender` |
| Tests | Sufijo `.spec.ts` (unitarios) y `.e2e-spec.ts` (end-to-end) | `pricing.spec.ts` |

Sin abreviaturas (`quantity`, no `qty`), salvo las universales (`id`, `url`, `qr`, `pdf`).

---

## 4. Estructura y Dependencias

La estructura de carpetas está en `DISENO_Y_DECISIONES.md`, sección 3.

**Regla de dependencias:** `routes → services → domain`. Nunca al revés.
* `domain/` no importa nada de afuera: ni Express, ni Zod, ni `infra/`, ni librerías.
* `services/` recibe lo externo (reloj, repositorio, pago, correo) como parámetro; nunca lo crea.
* Solo `server.ts` crea las implementaciones reales y las conecta con `createApp(deps)`.

---

## 5. Reglas de TypeScript

1. Prohibido `any`. Si un tipo es desconocido se usa `unknown` y se valida.
2. Enums con valores de texto explícitos (`REGULAR = 'REGULAR'`), nunca numéricos.
3. Las entidades se crean con métodos de fábrica que validan sus reglas (`Purchase.createForCash(...)`): no puede existir una compra inválida.
4. Importes en **pesos enteros** (`number` entero).
5. Fechas de visita como texto `YYYY-MM-DD`. Prohibido `new Date()` en `domain/` y `services/`: la fecha y hora actuales se obtienen del `Clock`.
6. `async/await` en lugar de `.then()`. Toda promesa se espera o se retorna.
7. Funciones cortas con una sola responsabilidad. Si una función necesita un comentario para explicar **qué** hace, se divide o se renombra.

---

## 6. Manejo de Errores

* Una regla de negocio violada lanza un `DomainError` con un `code` estable (`PARK_CLOSED`, `VISIT_DATE_IN_PAST`, etc.).
* El dominio no conoce códigos HTTP. Un middleware de errores de Express traduce cada `code` al estado HTTP definido en `DISENO_Y_DECISIONES.md` (D-12).
* No se capturan errores para ignorarlos. Única excepción: el envío del correo, que registra la falla y continúa (D-05).

---

## 7. Estilo de Tests

1. **Estructura AAA** (*Arrange, Act, Assert*), separada por una línea en blanco.
2. **Un comportamiento por test.** Varios `expect` solo si verifican el mismo comportamiento.
3. **Nombres en inglés** con el formato `should <resultado> when <condición>`.
4. **Trazabilidad:** el `describe` indica el criterio que verifica.
   ```ts
   describe('CA-02 ticket quantity', () => {
     it('should reject the purchase when it has more than 10 tickets', () => { /* ... */ });
   });
   ```
5. **Datos evidentes:** nombres que se entienden sin leer el código (`aMonday`, `elevenTickets`). Los requests se arman con **Test Data Builders** (`aPurchaseRequest().withTickets(11).build()`).
6. **Tests aislados y deterministas:** sin depender del orden, sin red, sin `new Date()` (se usa `FixedClock`), sin esperas.
7. Se prueba a través de la **interfaz pública**, nunca métodos privados.

---

## 8. Commits y Ramas

* Rama de trabajo: `feature/TP6-TDD-ComprarEntradas`.
* Los commits que modifican `TPG6-TDD/` usan **Conventional Commits**; el resto del repositorio mantiene el formato `<Legajo>_<Apellido>_<Descripción>` del Plan de Gestión de Configuración (TPG4).
* El tipo va en inglés y la descripción en español, en tercera persona del presente. Sin atribuciones automáticas de herramientas de IA.
* **Un commit por fase del ciclo TDD**, para que el historial demuestre que cada test se escribió antes que su código:
  * `test:` el test nuevo falla por la razón esperada (rojo).
  * `feat:` el código mínimo que lo hace pasar (verde).
  * `refactor:` mejora sin cambio de comportamiento, solo si la hubo.
  * `chore:`, `docs:`, `build:` para configuración, documentación y dependencias.
  ```text
  test: agrega descuento del 50% para menores de 15 años (CA-12)
  feat: implementa descuento del 50% para menores de 15 años (CA-12)
  refactor: extrae las franjas de edad a constantes (CA-12)
  ```

---

## 9. Interfaz (frontend)

La identidad visual la define el PO (FAQ 3).

| Token de Tailwind | Color | Uso |
| :--- | :--- | :--- |
| `forest` | `#386641` | Encabezado, botón principal, títulos |
| `leaf` | `#6A994E` | Estados activos, enlaces, foco |
| `lime` | `#A7C957` | Acentos, fechas seleccionadas |
| `cream` | `#F2E8CF` | Fondo general y tarjetas |
| `berry` | `#BC4749` | Errores y rechazos |

1. **Colores solo por token** (`bg-forest`, `text-berry`); prohibidos los hexadecimales sueltos.
2. **Contraste** WCAG AA en todo texto. El color nunca es la única señal: un error también lleva texto.
3. **Tipografía** Lato (`@fontsource/lato`): 400 para texto, 700 para títulos y botones.
4. **Mobile-first:** los estilos sin prefijo son los del celular (desde 360 px); `md:` y `lg:` solo amplían. Áreas táctiles de al menos 44 × 44 px.
5. **Formatos:** importes como `$ 10.000` y fechas como `dd/mm/aaaa`.
6. **Componentes:** las páginas llaman al API; los componentes solo reciben datos por props y no usan `fetch`.
