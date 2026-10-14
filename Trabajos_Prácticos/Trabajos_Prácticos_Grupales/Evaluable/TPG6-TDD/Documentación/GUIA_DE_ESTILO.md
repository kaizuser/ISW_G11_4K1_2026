# Guía de Estilo de Código
**Proyecto:** EcoHarmony Park — User Story "Comprar Entradas" (TP N° 6, Grupo 11, Curso 4K1)  
**Lenguaje:** TypeScript (backend NestJS y frontend React)  
**Propósito:** La consigna del TP6 exige implementar la User Story *"utilizando el lenguaje y documento de estilos de código seleccionado"* por el grupo. Este documento es esa guía de estilo y es de cumplimiento obligatorio para todo el código del proyecto.

---

## 1. Herramientas que hacen cumplir la guía

Las reglas automatizables no se discuten en revisión: las aplican las herramientas.

| Herramienta | Alcance | Configuración | Comando |
| :--- | :--- | :--- | :--- |
| **Prettier** | Formato (comillas, comas, indentación, saltos de línea) | `backend/.prettierrc`: comillas simples, coma final en todo | `npm run format` |
| **ESLint + typescript-eslint** | Errores y malas prácticas en backend | `backend/eslint.config.mjs` (reglas *recommended type-checked*) | `npm run lint` |
| **Oxlint** | Errores y malas prácticas en frontend | `frontend/.oxlintrc.json` | `npm run lint` |
| **TypeScript estricto** | Tipado de código y tests | `strict: true` en `tsconfig.json` | `npm run typecheck` (el `build` excluye los tests) |

Un cambio no se considera terminado si alguno de estos comandos falla.

---

## 2. Idioma

| Elemento | Idioma | Ejemplo |
| :--- | :--- | :--- |
| Clases, interfaces, métodos, variables, archivos y carpetas | Inglés | `PurchaseTicketsUseCase`, `visitDate`, `purchase-tickets.use-case.ts` |
| Valores del lenguaje de negocio (enums del dominio y del API) | Español, tal como figuran en la User Story | `PassType.REGULAR`, `PaymentMethod.EFECTIVO`, `PurchaseStatus.PENDIENTE_PAGO` |
| Códigos de error del API | Inglés, `SCREAMING_SNAKE_CASE` | `PARK_CLOSED`, `INVALID_TICKET_QUANTITY` |
| Mensajes de error para el usuario y textos de la interfaz | Español neutro | `"El parque está cerrado los lunes, el 25 de diciembre y el 1 de enero."` |
| Comentarios en el código | Inglés, solo cuando explican el **porqué** | `// Mercado Pago retries every 15 minutes, so this must be idempotent.` |
| Documentación formal (`Documentación/`, `specs/`) | Español neutro | — |

Los valores de negocio se mantienen en español porque forman el **lenguaje ubicuo** compartido con el cliente: el visitante elige "EFECTIVO" o "TARJETA", y el código usa exactamente esas palabras.

---

## 3. Convenciones de Nombres

| Elemento | Convención | Ejemplo |
| :--- | :--- | :--- |
| Clases, interfaces, tipos, enums | `PascalCase` | `Purchase`, `PaymentGatewayPort`, `PassType` |
| Métodos, funciones, variables, propiedades | `camelCase` | `confirmCardPayment()`, `ticketCount` |
| Valores de enum y constantes globales | `SCREAMING_SNAKE_CASE` | `PENDIENTE_PAGO`, `MAX_TICKETS_PER_PURCHASE` |
| Archivos y carpetas | `kebab-case` con sufijo de rol | ver tabla 3.1 |
| Booleanos | Prefijo `is`, `has`, `can` | `isExpired()`, `canPurchase()` |
| Puertos | Sufijo `Port` | `EmailSenderPort` |
| Tokens de inyección de NestJS | Constante con el nombre del puerto | `PAYMENT_GATEWAY_PORT` |
| Errores de dominio | Sufijo `Error` | `ParkClosedError` |

No se usan abreviaturas (`purchase`, no `purch`; `quantity`, no `qty`), salvo las universales (`id`, `url`, `qr`, `pdf`).

### 3.1. Sufijos de archivo por rol

| Rol | Sufijo | Ejemplo |
| :--- | :--- | :--- |
| Entidad / agregado de dominio | `.ts` (nombre del concepto) | `purchase.ts`, `ticket.ts` |
| Value object | `.ts` | `money.ts`, `visit-date.ts`, `booking-window.ts` |
| Servicio de dominio | `.ts` (nombre de la regla) | `age-discount-policy.ts` |
| Enum | `.enum.ts` | `purchase-status.enum.ts` |
| Error de dominio | `.error.ts` | `park-closed.error.ts` |
| Puerto | `.port.ts` | `payment-gateway.port.ts` |
| Caso de uso | `.use-case.ts` | `purchase-tickets.use-case.ts` |
| Adaptador | `.adapter.ts` o `.repository.ts` | `mercado-pago.adapter.ts`, `typeorm-purchase.repository.ts` |
| Entidad ORM | `.orm-entity.ts` | `purchase.orm-entity.ts` |
| Controlador / DTO / módulo | `.controller.ts` / `.dto.ts` / `.module.ts` | `purchases.controller.ts`, `create-purchase.dto.ts` |
| Test unitario / integración / E2E | `.spec.ts` / `.int-spec.ts` / `.e2e-spec.ts` | `purchase.spec.ts` |
| Doble de prueba | Prefijo del tipo de doble | `in-memory-purchase.repository.ts`, `fake-payment-gateway.ts`, `spy-email-sender.ts` |

---

## 4. Estructura de Carpetas (backend)

```text
backend/
├── src/
│   ├── domain/              # Entidades, value objects, enums, errores y puertos. Sin imports de NestJS, TypeORM ni librerías externas.
│   │   ├── entities/
│   │   ├── value-objects/
│   │   ├── services/        # Reglas del dominio sin estado propio (AgeDiscountPolicy).
│   │   ├── enums/
│   │   ├── errors/
│   │   └── ports/
│   ├── application/         # Casos de uso. Dependen solo de domain/.
│   │   └── use-cases/
│   └── infrastructure/      # Adaptadores, persistencia, HTTP y configuración de NestJS.
│       ├── adapters/
│       ├── persistence/     # Entidades ORM, mappers, migraciones y seeds.
│       ├── http/            # Controladores, DTOs, guards y filtros de excepciones.
│       └── config/
└── test/
    ├── unit/                # Espeja src/domain y src/application.
    ├── integration/
    ├── e2e/
    ├── doubles/             # Dobles de prueba compartidos.
    └── builders/            # Test Data Builders.
```

**Regla de dependencias:** `infrastructure → application → domain`. Nunca al revés. Un import de `@nestjs/*` o `typeorm` dentro de `src/domain/` es un error de diseño.

---

## 5. Reglas de TypeScript

1. `strict: true`. Prohibido `any`; si un tipo es desconocido se usa `unknown` y se valida.
2. Propiedades del dominio `private readonly` siempre que sea posible; se exponen con *getters*.
3. Los constructores de entidades son privados; se crean con métodos de fábrica estáticos que validan invariantes (`Purchase.createForCash(...)`). No puede existir un objeto de dominio inválido.
4. Enums de TypeScript con valores de texto explícitos (`REGULAR = 'REGULAR'`), nunca numéricos.
5. Importes siempre con `Money` (centavos enteros). Prohibido `number` para dinero.
6. Fechas de visita siempre con `VisitDate`. Prohibido `new Date()` en dominio y aplicación: el tiempo se obtiene de `ClockPort`.
7. `async/await` en lugar de `.then()`. Toda promesa se espera o se retorna (la regla `no-floating-promises` lo controla).
8. Funciones cortas con una sola responsabilidad; si un método necesita un comentario para explicar **qué** hace, se divide o se renombra.

---

## 6. Manejo de Errores

* Las reglas de negocio violadas lanzan **errores de dominio** que extienden de `DomainError` y tienen un `code` estable (`PARK_CLOSED`, `VISIT_DATE_IN_PAST`, etc.).
* El dominio no conoce códigos HTTP. Un filtro de excepciones de NestJS traduce cada `code` al estado HTTP definido en `specs/spec.md`.
* No se capturan errores para ignorarlos. La única excepción documentada es el envío de correo (ADR-09), que registra la falla y continúa.

---

## 7. Estilo de Tests

1. **Estructura AAA** (*Arrange, Act, Assert*), separada por una línea en blanco.
2. **Un comportamiento por test.** Varios `expect` están permitidos solo si verifican el mismo comportamiento.
3. **Nombres que describen comportamiento**, en inglés, con el formato `should <resultado> when <condición>`:
   ```ts
   describe('Purchase', () => {
     it('should reject the purchase when it has more than 10 tickets', () => { /* ... */ });
   });
   ```
4. **Trazabilidad:** el `describe` de cada regla incluye el criterio que verifica: `describe('CA-02 ticket quantity', ...)`.
5. **Datos evidentes:** valores que se entienden sin leer el código de producción (`aMonday`, `aTuesday`, `elevenTickets`). Los objetos complejos se arman con **Test Data Builders** (`aPurchaseRequest().withTickets(11).build()`).
6. **Tests aislados y deterministas:** sin orden de ejecución, sin red en unitarios, sin `new Date()` (se usa `FixedClock`), sin `sleep`.
7. Se prueba a través de la **interfaz pública** del objeto, nunca sus métodos privados.

---

## 8. Commits y Ramas

* Rama de trabajo: `feature/TP6-TDD-ComprarEntradas`.
* **Alcance de esta convención (ADR-28):** el repositorio del grupo usa, para el resto de sus ítems de configuración, el formato `<Legajo>_<Apellido>_<Descripción>` definido en el Plan de Gestión de Configuración (TPG4). La carpeta `TPG6-TDD/` es un proyecto de software desarrollado con TDD y adopta una convención propia, orientada a evidenciar el ciclo *Red → Green → Refactor* que evalúa este trabajo práctico. Todo commit que modifique `TPG6-TDD/` usa la convención de esta sección.
* Mensajes en formato **Conventional Commits** (`<tipo>: <descripción>`), sin atribuciones automáticas de herramientas de IA. El **tipo** va en inglés, porque es la palabra clave del estándar; la **descripción** va en español neutro, en tercera persona del presente (`agrega`, `implementa`, `extrae`), igual que la documentación formal:
  * `test: ...` para un test en rojo (*Red*).
  * `feat: ...` para el código mínimo que lo pone en verde (*Green*).
  * `refactor: ...` para la mejora de diseño sin cambio de comportamiento (*Refactor*).
  * `chore:`, `docs:`, `build:` para configuración, documentación y dependencias.
* **Granularidad (acordada por el equipo): un commit por fase del ciclo TDD.** Cada ítem de la Test List produce un commit `test:` (el test falla por la razón esperada), un commit `feat:` (la suite queda en verde) y, solo si hubo mejora de diseño, un commit `refactor:` (la suite sigue en verde). Así el historial demuestra que cada test se escribió antes que su código.
* La descripción nombra el comportamiento y, cuando corresponde, el ítem de la Test List. Ejemplo de un ciclo completo:
  ```text
  test: agrega suma de Money en centavos enteros (T-DOM-01)
  feat: implementa suma de Money en centavos enteros (T-DOM-01)
  refactor: extrae la validación de centavos enteros en Money (T-DOM-01)
  ```

---

## 9. Estilo de la Interfaz (frontend)

La identidad visual la define el PO (FAQ 3) y su aplicación técnica está en ADR-26.

| Token de Tailwind | Color | Uso recomendado |
| :--- | :--- | :--- |
| `forest` | `#386641` | Encabezado, botón principal, títulos |
| `leaf` | `#6A994E` | Estados activos, enlaces, foco |
| `lime` | `#A7C957` | Acentos, fechas seleccionadas, etiquetas |
| `cream` | `#F2E8CF` | Fondo general y tarjetas |
| `berry` | `#BC4749` | Errores, mensajes de rechazo y acciones destructivas |

1. **Colores solo por token:** se usan las clases generadas por `@theme` (`bg-forest`, `text-berry`); prohibidos los valores hexadecimales sueltos en los componentes.
2. **Contraste:** toda combinación de texto y fondo cumple WCAG AA (4,5:1 para texto normal). El color nunca es la única señal: un error también lleva texto.
3. **Tipografía:** Lato (`@fontsource/lato`) en toda la interfaz; pesos 400 para texto y 700 para títulos y botones.
4. **Mobile-first:** los estilos sin prefijo son los del celular (desde 360 px); los prefijos `md:` y `lg:` solo amplían el diseño. Las áreas táctiles miden al menos 44 × 44 px.
5. **Textos de la interfaz:** español neutro, con importes en formato `$ 10.000` y fechas en formato `dd/mm/aaaa`.
6. **Componentes:** patrón contenedor-presentacional. Los contenedores llaman al API; los componentes de presentación solo reciben datos por props y no conocen `fetch`.
