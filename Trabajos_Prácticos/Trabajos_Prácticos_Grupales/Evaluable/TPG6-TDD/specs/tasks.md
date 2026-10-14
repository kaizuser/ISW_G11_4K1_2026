# Test List, Trazabilidad y Tareas — Comprar Entradas
> **Cátedra:** Ingeniería y Calidad de Software (UTN - FRC) — Curso 4K1 — Grupo 11  
> **Metodología:** Spec-Driven Development (SDD) + Test-Driven Development (Kent Beck)  
> **Referencias:** criterios CA/RC y pruebas PU en `Documentación/ESPECIFICACION_USER_STORY.md`; escenarios E-* en `specs/spec.md`.

---

## 1. Test List (orden de implementación TDD)

En TDD la *Test List* se escribe **antes** de implementar y se recorre de lo simple a lo complejo, marcando cada ítem al completar su ciclo *Red → Green → Refactor* (⬜ pendiente, ✅ completado). Los casos nuevos que aparezcan durante el desarrollo se agregan al final de su sección.

### 1.1. Dominio puro — `test/unit/domain/`
| ID | Test | Escenario | Criterio | Archivo de test |
| :--- | :--- | :--- | :--- | :--- |
| ⬜ **T-DOM-01** | `Money` suma y multiplica centavos sin errores de redondeo | E-18, E-19 | CA-06 | `value-objects/money.spec.ts` |
| ⬜ **T-DOM-02** | `Money.applyDiscount` aplica 0%, 50% y 100% de forma exacta | E-40 | CA-12 | `value-objects/money.spec.ts` |
| ⬜ **T-DOM-03** | `AgeDiscountPolicy` devuelve 100% para 0 y 3 años, 50% para 4 y 15, 0% para 16 y 59, y 50% para 60 | E-40 | CA-12 | `services/age-discount-policy.spec.ts` |
| ⬜ **T-DOM-04** | `VisitDate` calcula el día de la semana ISO de una fecha de calendario sin depender de la zona horaria del proceso | E-10 | CA-04 | `value-objects/visit-date.spec.ts` |
| ⬜ **T-DOM-05** | `VisitDate` rechaza fechas inexistentes, compara anterioridad y suma un mes ajustando al último día del mes | E-05, E-06, E-44 | CA-03, CA-13 | `value-objects/visit-date.spec.ts` |
| ⬜ **T-DOM-06** | `BookingWindow` rechaza una fecha pasada con `VisitDateInPastError` y acepta la de hoy | E-05, E-06 | CA-03 | `value-objects/booking-window.spec.ts` |
| ⬜ **T-DOM-07** | `BookingWindow` acepta hasta la misma fecha del mes siguiente y rechaza el día posterior con `VisitDateBeyondHorizonError` | E-43 | CA-13 | `value-objects/booking-window.spec.ts` |
| ⬜ **T-DOM-08** | `BookingWindow` ajusta el horizonte al último día del mes cuando la fecha no existe (31/01 → 28/02) | E-44 | CA-13 | `value-objects/booking-window.spec.ts` |
| ⬜ **T-DOM-09** | `BookingWindow` acepta hoy a las 17:30 y lo rechaza a las 17:31 con `SameDayPurchaseClosedError`, sin afectar a mañana | E-45 | CA-14 | `value-objects/booking-window.spec.ts` |
| ⬜ **T-DOM-10** | `BookingWindow` enumera las fechas candidatas desde hoy (o desde mañana, pasado el corte) hasta el horizonte | E-50 | CA-13, CA-14 | `value-objects/booking-window.spec.ts` |
| ⬜ **T-DOM-11** | `Ticket` rechaza una edad negativa con `InvalidVisitorAgeError` | E-15 | CA-05 | `entities/ticket.spec.ts` |
| ⬜ **T-DOM-12** | `Ticket` acepta la edad 0 (valor límite) | E-16 | CA-05 | `entities/ticket.spec.ts` |
| ⬜ **T-DOM-13** | `Ticket` calcula su subtotal aplicando el descuento por edad sobre el precio de lista de `REGULAR` y de `VIP` | E-40, E-41 | CA-06, CA-12 | `entities/ticket.spec.ts` |
| ⬜ **T-DOM-14** | `Purchase` rechaza 0 entradas con `InvalidTicketQuantityError` | E-11 | CA-02 | `entities/purchase.spec.ts` |
| ⬜ **T-DOM-15** | `Purchase` acepta 1 entrada | E-12 | CA-02 | `entities/purchase.spec.ts` |
| ⬜ **T-DOM-16** | `Purchase` acepta 10 entradas (valor límite) | E-13 | CA-02 | `entities/purchase.spec.ts` |
| ⬜ **T-DOM-17** | `Purchase` rechaza 11 entradas con `InvalidTicketQuantityError` | E-14 | CA-02 | `entities/purchase.spec.ts` |
| ⬜ **T-DOM-18** | `Purchase` calcula el total como suma de los subtotales | E-19, E-42 | CA-06 | `entities/purchase.spec.ts` |
| ⬜ **T-DOM-19** | `Purchase` informa cantidad de entradas (incluidas las gratuitas) y fecha de visita | E-29, E-42 | CA-10, CA-12 | `entities/purchase.spec.ts` |
| ⬜ **T-DOM-20** | `Purchase.createForCash` nace `CONFIRMADA_PAGO_EN_BOLETERIA` con `accessCode` | E-26 | CA-09 | `entities/purchase.spec.ts` |
| ⬜ **T-DOM-21** | `Purchase.createForCard` nace `PENDIENTE_PAGO`, sin `accessCode`, con `expiresAt = ahora + plazo` | E-23 | CA-08, RC-03 | `entities/purchase.spec.ts` |
| ⬜ **T-DOM-22** | `confirmCardPayment` pasa a `CONFIRMADA`, registra el pago y asigna `accessCode` | E-30 | RC-01 | `entities/purchase.spec.ts` |
| ⬜ **T-DOM-23** | `rejectCardPayment` pasa a `RECHAZADA` y registra el motivo | E-31 | RC-02 | `entities/purchase.spec.ts` |
| ⬜ **T-DOM-24** | `isExpired(now)` y `expire(now)` pasan a `EXPIRADA` solo si venció el plazo | E-33 | RC-03 | `entities/purchase.spec.ts` |
| ⬜ **T-DOM-25** | Una compra en estado final rechaza toda transición | E-36 | RC-04 | `entities/purchase.spec.ts` |
| ⬜ **T-DOM-26** | `User.canPurchase()` es verdadero solo para usuarios activos con rol `VISITANTE` | E-01, E-03 | CA-01 | `entities/user.spec.ts` |

### 1.2. Casos de uso con dobles de prueba — `test/unit/application/`
| ID | Test | Escenario | Criterio | Archivo de test |
| :--- | :--- | :--- | :--- | :--- |
| ⬜ **T-APP-01** | Falla con `USER_NOT_REGISTERED` si el usuario no existe y no persiste nada | E-02 | CA-01 | `purchase-tickets.use-case.spec.ts` |
| ⬜ **T-APP-02** | Falla con `USER_NOT_REGISTERED` si el usuario está inactivo | E-03 | CA-01 | `purchase-tickets.use-case.spec.ts` |
| ⬜ **T-APP-03** | Falla con `VISIT_DATE_IN_PAST` si la fecha es anterior a hoy | E-06 | CA-03 | `purchase-tickets.use-case.spec.ts` |
| ⬜ **T-APP-04** | Acepta la fecha de hoy antes del corte | E-05 | CA-03 | `purchase-tickets.use-case.spec.ts` |
| ⬜ **T-APP-05** | Falla con `VISIT_DATE_BEYOND_HORIZON` después del horizonte, antes de evaluar el día de apertura | E-43, E-44 | CA-13 | `purchase-tickets.use-case.spec.ts` |
| ⬜ **T-APP-06** | Falla con `SAME_DAY_PURCHASE_CLOSED` para hoy después de las 17:30 | E-45 | CA-14 | `purchase-tickets.use-case.spec.ts` |
| ⬜ **T-APP-07** | Falla con `PARK_CLOSED` los lunes | E-08 | CA-04 | `purchase-tickets.use-case.spec.ts` |
| ⬜ **T-APP-08** | Falla con `PARK_CLOSED` el 25 de diciembre y el 1 de enero | E-39 | CA-04 | `purchase-tickets.use-case.spec.ts` |
| ⬜ **T-APP-09** | Acepta de martes a domingo | E-07 | CA-04 | `purchase-tickets.use-case.spec.ts` |
| ⬜ **T-APP-10** | Copia en cada entrada el precio de lista vigente y aplica el descuento por edad | E-20, E-42 | CA-06, CA-12 | `purchase-tickets.use-case.spec.ts` |
| ⬜ **T-APP-11** | Acepta hasta completar 10 entradas activas para la fecha y falla con `TICKET_LIMIT_PER_DATE_EXCEEDED` si las supera, sin persistir nada | E-46 | CA-11 | `purchase-tickets.use-case.spec.ts` |
| ⬜ **T-APP-12** | Las compras `RECHAZADA` y `EXPIRADA` no cuentan para el límite por fecha | E-47 | CA-11 | `purchase-tickets.use-case.spec.ts` |
| ⬜ **T-APP-13** | Las entradas de otra fecha o de otro usuario no cuentan para el límite | E-48 | CA-11 | `purchase-tickets.use-case.spec.ts` |
| ⬜ **T-APP-14** | Efectivo: persiste `CONFIRMADA_PAGO_EN_BOLETERIA` y envía un correo con el detalle, los subtotales, el total, el QR del `accessCode` y el comprobante PDF | E-26, E-27, E-29 | CA-07, CA-09, CA-10 | `purchase-tickets.use-case.spec.ts` |
| ⬜ **T-APP-15** | Efectivo: si el correo falla, la compra se persiste y queda `notificationStatus = FAILED` | E-28 | RC-05 | `purchase-tickets.use-case.spec.ts` |
| ⬜ **T-APP-16** | Tarjeta: crea la preferencia (referencia, total con descuentos, vencimiento), persiste `PENDIENTE_PAGO`, devuelve `paymentUrl` y no envía correo | E-23, E-25 | CA-08 | `purchase-tickets.use-case.spec.ts` |
| ⬜ **T-APP-17** | Tarjeta: si la pasarela falla, lanza `PaymentGatewayError` y no persiste nada | E-24 | CA-08 | `purchase-tickets.use-case.spec.ts` |
| ⬜ **T-APP-18** | Notificación `approved`: confirma la compra y envía el correo con QR y comprobante | E-30 | RC-01, CA-09 | `process-payment-notification.use-case.spec.ts` |
| ⬜ **T-APP-19** | Notificación `rejected`: rechaza la compra y envía aviso sin QR ni comprobante | E-31 | RC-02 | `process-payment-notification.use-case.spec.ts` |
| ⬜ **T-APP-20** | Notificación repetida sobre una compra final: sin cambios ni correos | E-32 | RC-04 | `process-payment-notification.use-case.spec.ts` |
| ⬜ **T-APP-21** | Notificación de un pago sin compra asociada: se ignora sin error | — | RC-04 | `process-payment-notification.use-case.spec.ts` |
| ⬜ **T-APP-22** | Expiración sin pago: la compra pasa a `EXPIRADA` | E-33 | RC-03 | `expire-pending-purchases.use-case.spec.ts` |
| ⬜ **T-APP-23** | Expiración con pago `approved`: la compra se confirma y se envía el correo con QR y comprobante (reconciliación) | E-34 | RC-01, RC-03, CA-09 | `expire-pending-purchases.use-case.spec.ts` |
| ⬜ **T-APP-24** | Expiración con pago `in_process`: la compra sigue pendiente | E-35 | RC-03 | `expire-pending-purchases.use-case.spec.ts` |
| ⬜ **T-APP-25** | Expiración con pago `rejected`: la compra se rechaza y se envía el aviso sin QR (reconciliación) | E-38 | RC-02, RC-03 | `expire-pending-purchases.use-case.spec.ts` |
| ⬜ **T-APP-26** | Reintento de correos fallidos: pasa a `SENT` al reenviar con éxito | — | RC-05 | `retry-failed-notifications.use-case.spec.ts` |
| ⬜ **T-APP-27** | Consulta de compra: devuelve la propia y responde `PURCHASE_NOT_FOUND` para una ajena | — | CA-10 | `get-purchase.use-case.spec.ts` |
| ⬜ **T-APP-28** | Cotización: devuelve subtotales y total con descuentos sin persistir nada | E-51 | CA-06, CA-12 | `quote-purchase.use-case.spec.ts` |
| ⬜ **T-APP-29** | Fechas disponibles: combina `BookingWindow` con el calendario de apertura | E-50 | CA-04, CA-13, CA-14 | `get-available-visit-dates.use-case.spec.ts` |
| ⬜ **T-APP-30** | Sesión: devuelve el visitante de la sesión simulada o falla con `USER_NOT_REGISTERED` | E-52 | CA-01 | `get-session-user.use-case.spec.ts` |

### 1.3. Adaptadores — `test/unit/infrastructure/` y `test/integration/`
| ID | Test | Escenario | Criterio | Archivo de test |
| :--- | :--- | :--- | :--- | :--- |
| ⬜ **T-INF-01** | `SystemClock.parkNow()` devuelve la fecha y la hora de Córdoba aunque el proceso esté en UTC | E-09 | CA-03, CA-14 | `unit/infrastructure/system-clock.spec.ts` |
| ⬜ **T-INF-02** | El adaptador de firma (sobre `WebhookSignatureValidator` del SDK) acepta firmas válidas y rechaza alteradas, ausentes o fuera de la tolerancia de 300 s, usando `data.id` del query string y un reloj fijo | E-37 | RC-06 | `unit/infrastructure/mercado-pago-signature.spec.ts` |
| ⬜ **T-INF-03** | `CryptoAccessCodeGenerator` genera códigos únicos y seguros para URL | — | CA-09 | `unit/infrastructure/crypto-access-code-generator.spec.ts` |
| ⬜ **T-INF-04** | `QrCodeAdapter` genera un PNG que decodifica al contenido original | E-27 | CA-09 | `integration/qr-code.adapter.int-spec.ts` |
| ⬜ **T-INF-05** | `PdfKitReceiptGenerator` genera un PDF válido que incluye el número de orden, las entradas y el total | E-27 | CA-09 | `integration/pdfkit-receipt.generator.int-spec.ts` |
| ⬜ **T-INF-06** | `TypeOrmPurchaseRepository` guarda y recupera una compra con sus entradas (precio de lista, descuento y subtotal) | — | CA-10, CA-12 | `integration/typeorm-purchase.repository.int-spec.ts` |
| ⬜ **T-INF-07** | `countActiveTickets` suma solo las compras activas del usuario para la fecha | E-46, E-47, E-48 | CA-11 | `integration/typeorm-purchase.repository.int-spec.ts` |
| ⬜ **T-INF-08** | `runExclusively` serializa dos compras concurrentes del mismo usuario y fecha | E-49 | CA-11 | `integration/typeorm-purchase.repository.int-spec.ts` |
| ⬜ **T-INF-09** | Repositorios de usuarios, tarifas y calendario leen los datos semilla (lunes, 25/12 y 01/01 cerrados) | E-01, E-08, E-18, E-39 | CA-01, CA-04, CA-06 | `integration/typeorm-seeds.int-spec.ts` |
| ⬜ **T-INF-10** | `MercadoPagoAdapter.createPreference` envía referencia, ítems, vencimiento, URLs y exclusiones (HTTP grabado con `nock`) | E-23 | CA-08 | `integration/mercado-pago.adapter.int-spec.ts` |
| ⬜ **T-INF-11** | `MercadoPagoAdapter` interpreta pagos `approved`, `rejected` e `in_process` | E-30, E-31, E-35 | RC-01..RC-03 | `integration/mercado-pago.adapter.int-spec.ts` |
| ⬜ **T-INF-12** | `NodemailerEmailAdapter` entrega a Mailpit un HTML con el QR inline CID y el comprobante PDF adjunto | E-27 | CA-09 | `integration/nodemailer-email.adapter.int-spec.ts` |

### 1.4. API REST — `test/e2e/`
| ID | Test | Escenario | Criterio | Archivo de test |
| :--- | :--- | :--- | :--- | :--- |
| ⬜ **T-API-01** | `GET /api/session` devuelve el visitante de la sesión simulada | E-52 | CA-01 | `session.e2e-spec.ts` |
| ⬜ **T-API-02** | `POST /api/purchases` sin sesión simulada responde `401 UNAUTHENTICATED` | E-04 | CA-01 | `purchases.e2e-spec.ts` |
| ⬜ **T-API-03** | `POST /api/purchases` con efectivo responde `201` con el resumen y los subtotales | E-26, E-29 | CA-07, CA-10 | `purchases.e2e-spec.ts` |
| ⬜ **T-API-04** | `POST /api/purchases` con tarjeta responde `201` con `paymentUrl` | E-23 | CA-08 | `purchases.e2e-spec.ts` |
| ⬜ **T-API-05** | Sin `paymentMethod` responde `400 VALIDATION_ERROR` señalando el campo | E-21 | CA-07 | `purchases.e2e-spec.ts` |
| ⬜ **T-API-06** | `paymentMethod` o `passType` fuera de enum responde `400 VALIDATION_ERROR` | E-17, E-22 | CA-05, CA-07 | `purchases.e2e-spec.ts` |
| ⬜ **T-API-07** | Fecha en lunes responde `422 PARK_CLOSED` | E-08 | CA-04 | `purchases.e2e-spec.ts` |
| ⬜ **T-API-08** | 11 entradas responde `422 INVALID_TICKET_QUANTITY` | E-14 | CA-02 | `purchases.e2e-spec.ts` |
| ⬜ **T-API-09** | Fecha fuera del horizonte responde `422 VISIT_DATE_BEYOND_HORIZON` | E-43 | CA-13 | `purchases.e2e-spec.ts` |
| ⬜ **T-API-10** | Superar 10 entradas para la fecha responde `422 TICKET_LIMIT_PER_DATE_EXCEEDED` | E-46 | CA-11 | `purchases.e2e-spec.ts` |
| ⬜ **T-API-11** | `GET /api/purchases/:id` responde `200` para la propia y `404` para inexistente o ajena | — | CA-10 | `purchases.e2e-spec.ts` |
| ⬜ **T-API-12** | `POST /api/purchases/quote` responde `200` con subtotales y total | E-51 | CA-06, CA-12 | `purchases.e2e-spec.ts` |
| ⬜ **T-API-13** | `GET /api/calendar/available-dates` responde `200` con la ventana y sin lunes | E-50 | CA-04, CA-13 | `calendar.e2e-spec.ts` |
| ⬜ **T-API-14** | `POST /api/webhooks/mercadopago` responde `200` con firma válida y `401 INVALID_SIGNATURE` sin ella | E-37 | RC-06 | `webhooks.e2e-spec.ts` |
| ⬜ **T-API-15** | `GET /api/payments/return` reconcilia y redirige con `302` al frontend | — | RC-01 | `payments-return.e2e-spec.ts` |

---

## 2. Matriz de Trazabilidad

### 2.1. Criterios → Tests
| Criterio | Tests |
| :--- | :--- |
| **CA-01** Usuario registrado | T-DOM-26, T-APP-01, T-APP-02, T-APP-30, T-INF-09, T-API-01, T-API-02 |
| **CA-02** Rango por compra | T-DOM-14, T-DOM-15, T-DOM-16, T-DOM-17, T-API-08 |
| **CA-03** Fecha actual o futura | T-DOM-05, T-DOM-06, T-APP-03, T-APP-04, T-INF-01 |
| **CA-04** Días de apertura | T-DOM-04, T-APP-07, T-APP-08, T-APP-09, T-APP-29, T-INF-09, T-API-07, T-API-13 |
| **CA-05** Datos por entrada | T-DOM-11, T-DOM-12, T-API-06 |
| **CA-06** Tarifas y total | T-DOM-01, T-DOM-13, T-DOM-18, T-APP-10, T-APP-28, T-INF-09, T-API-12 |
| **CA-07** Medio de pago obligatorio | T-APP-14, T-API-03, T-API-05, T-API-06 |
| **CA-08** Integración con Mercado Pago | T-DOM-21, T-APP-16, T-APP-17, T-INF-10, T-API-04 |
| **CA-09** Correo de confirmación | T-DOM-20, T-APP-14, T-APP-18, T-APP-23, T-INF-03, T-INF-04, T-INF-05, T-INF-12 |
| **CA-10** Resumen al usuario | T-DOM-19, T-APP-14, T-APP-27, T-INF-06, T-API-03, T-API-11 |
| **CA-11** Límite por fecha | T-APP-11, T-APP-12, T-APP-13, T-INF-07, T-INF-08, T-API-10 |
| **CA-12** Descuento por edad | T-DOM-02, T-DOM-03, T-DOM-13, T-DOM-19, T-APP-10, T-APP-28, T-INF-06, T-API-12 |
| **CA-13** Horizonte de compra | T-DOM-05, T-DOM-07, T-DOM-08, T-DOM-10, T-APP-05, T-APP-29, T-API-09, T-API-13 |
| **CA-14** Corte para el mismo día | T-DOM-09, T-DOM-10, T-APP-06, T-APP-29, T-INF-01 |
| **RC-01** Pago aprobado | T-DOM-22, T-APP-18, T-APP-23, T-INF-11, T-API-15 |
| **RC-02** Pago rechazado | T-DOM-23, T-APP-19, T-APP-25, T-INF-11 |
| **RC-03** Vencimiento | T-DOM-21, T-DOM-24, T-APP-22, T-APP-23, T-APP-24, T-APP-25 |
| **RC-04** Idempotencia | T-DOM-25, T-APP-20, T-APP-21 |
| **RC-05** Correo no transaccional | T-APP-15, T-APP-26 |
| **RC-06** Origen verificado | T-INF-02, T-API-14 |

### 2.2. Pruebas de Usuario → Tests
| Prueba de usuario | Resultado esperado | Tests automatizados | Verificación manual |
| :--- | :--- | :--- | :--- |
| **PU-OF-01** Compra válida con tarjeta | PASA | T-APP-16, T-APP-18, T-INF-10, T-INF-12, T-API-04 | Sí (sandbox real, túnel, Mailpit y bandeja real vía Resend) |
| **PU-OF-02** Sin medio de pago | FALLA | T-API-05 | Sí |
| **PU-OF-03** Parque cerrado | FALLA | T-DOM-04, T-APP-07, T-APP-08, T-API-07 | Sí (el calendario no permite elegir el día) |
| **PU-OF-04** Más de 10 entradas | FALLA | T-DOM-17, T-API-08 | Sí |
| **PU-EXT-01** Compra válida en efectivo | PASA | T-DOM-20, T-APP-14, T-API-03 | Sí |
| **PU-EXT-02** Usuario no registrado | FALLA | T-DOM-26, T-APP-01, T-APP-02, T-API-02 | — |
| **PU-EXT-03** 0 entradas | FALLA | T-DOM-14 | — |
| **PU-EXT-04** Fecha en el pasado | FALLA | T-DOM-06, T-APP-03 | — |
| **PU-EXT-05** Edad negativa | FALLA | T-DOM-11 | — |
| **PU-EXT-06** 10 entradas | PASA | T-DOM-16, T-APP-11 | — |
| **PU-EXT-07** Total mixto | PASA | T-DOM-18 | — |
| **PU-EXT-08** Pago rechazado | FALLA | T-DOM-23, T-APP-19 | Sí (titular `OTHE`) |
| **PU-EXT-09** Pago vencido | FALLA | T-DOM-24, T-APP-22 | — |
| **PU-EXT-10** Tipo de pase inválido | FALLA | T-API-06 | — |
| **PU-EXT-11** Descuentos por edad | PASA | T-DOM-03, T-DOM-13, T-APP-10, T-API-12 | Sí |
| **PU-EXT-12** Límite acumulado por fecha | FALLA | T-APP-11, T-INF-07, T-API-10 | Sí |
| **PU-EXT-13** Fecha fuera del horizonte | FALLA | T-DOM-07, T-APP-05, T-API-09 | — |
| **PU-EXT-14** Compra para hoy después del corte | FALLA | T-DOM-09, T-APP-06 | — |

---

## 3. Tareas Operativas

### Bloque A: Sprint 0 — Documentación y Entorno
- [x] **A.1**: Alinear `ESPECIFICACION_USER_STORY.md` con el TP6 (texto literal, mapeo de criterios, reglas complementarias y nuevas pruebas extendidas).
- [x] **A.2**: Actualizar `DISENO_TECNICO_Y_ARQUITECTURA.md` (versiones, estados, DER, clases, puertos, secuencias, variables de entorno y tarjetas de prueba oficiales).
- [x] **A.3**: Crear `DECISIONES_DE_DISENO.md` (ADR y glosario) y `GUIA_DE_ESTILO.md`.
- [x] **A.4**: Reescribir `specs/spec.md`, `specs/plan.md` y `specs/tasks.md`.
- [x] **A.5**: Reemplazar `AGENT.md` por `AGENTS.md` con enlaces relativos.
- [x] **A.6**: Eliminar `Documentación/PLAN_DE_IMPLEMENTACION.md` (duplicado de `specs/plan.md`) y corregir el `README.md`.
- [x] **A.7**: Agregar `.gitignore` en la raíz de `TPG6-TDD/` y en `backend/`.
- [x] **A.8**: `docker-compose.yml`: PostgreSQL 18, Mailpit fijado en `v1.31.5` y creación automática de la base de tests. *(Verificado: PostgreSQL 18.6 healthy, bases `ecoharmony_db` y `ecoharmony_test` creadas, Mailpit recibe correo SMTP con QR inline CID.)*
- [x] **A.9**: Backend: actualizar dependencias a las últimas versiones compatibles, agregar las de autenticación, tareas programadas y `nock`; configurar Jest por niveles; `strict: true`.
- [x] **A.10**: Frontend: actualizar dependencias.
- [x] **A.11**: Actualizar `.env.example` con las variables de `DISENO_TECNICO_Y_ARQUITECTURA.md` §1.6, incluidas `MOCK_SESSION_USER_ID`, `MOCK_SESSION_USER_EMAIL`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` y el bloque comentado de Resend, y sin las variables `JWT_*` (**manual**: el archivo está protegido para las herramientas de IA).
- [ ] **A.12**: Spike de Mercado Pago con la cuenta del equipo (ver `plan.md`, Fase 0).
- [x] **A.13**: Acordar en equipo la granularidad de commits por ciclo TDD. *(Acordado: un commit por fase con Conventional Commits, ADR-28 y `GUIA_DE_ESTILO.md` §8.)*
- [x] **A.14**: Incorporar el FAQ del PO (`FAQ_PO_TDD_EcoHarmony_Park.pdf`): especificación, ADR-18 a ADR-26, contrato del API, escenarios, Test List, diseño y guía de estilo.
- [x] **A.15**: Backend: quitar las dependencias de autenticación que ya no se usan (`@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcrypt` y sus tipos) y agregar `pdfkit` 0.20.x con `@types/pdfkit` 0.17.x (ADR-19, ADR-24). *(Verificado: `typecheck`, `lint`, `test` y `build` sin errores; `pdfkit` genera un documento `%PDF-`; `npm audit --omit=dev` sin vulnerabilidades.)*
- [x] **A.16**: Frontend: agregar `react-day-picker` 10.x y `@fontsource/lato` 5.x (ADR-26). *(Verificado: `lint` y `build` sin errores; 0 vulnerabilidades.)*
- [ ] **A.17**: Diseñar el logo y enviarlo al PO para su validación (FAQ 17).
- [ ] **A.18**: Crear la cuenta gratuita de Resend y su API key, y probar un envío SMTP a la bandeja del dueño de la cuenta (ADR-27).

### Bloque B: Dominio Puro
- [ ] **B.1**: Recorrer `T-DOM-01..T-DOM-26` con ciclos Red-Green-Refactor.
- [ ] **B.2**: Refactor final del dominio (inmutabilidad, encapsulamiento, nombres).

### Bloque C: Casos de Uso
- [ ] **C.1**: Definir los puertos en `src/domain/ports/` a medida que los tests los necesiten.
- [ ] **C.2**: Implementar los dobles de prueba en `test/doubles/` y los builders en `test/builders/`.
- [ ] **C.3**: Recorrer `T-APP-01..T-APP-30`.

### Bloque D: Infraestructura
- [ ] **D.1**: Entidades ORM, mappers, migraciones y seeds (usuario de la sesión simulada, tarifas, días de apertura y feriados).
- [ ] **D.2**: Recorrer `T-INF-01..T-INF-12`.

### Bloque E: API REST
- [ ] **E.1**: Sesión simulada (`MockSessionGuard`), controladores, DTOs, filtro de excepciones y tareas programadas.
- [ ] **E.2**: Recorrer `T-API-01..T-API-15`.

### Bloque F: Frontend
- [ ] **F.1**: Identidad visual: paleta como tokens de Tailwind, tipografía Lato y diseño *mobile-first*.
- [ ] **F.2**: Cliente HTTP (`fetch`) y encabezado con el visitante de la sesión simulada.
- [ ] **F.3**: Calendario que solo habilita las fechas de `GET /api/calendar/available-dates`.
- [ ] **F.4**: Formulario de entradas (tipo de pase y edad, de 1 a 10) con subtotales y total de `POST /api/purchases/quote`.
- [ ] **F.5**: Redirección a Checkout Pro y pantalla de resultado.

### Bloque G: Aceptación y Cierre
- [ ] **G.1**: Ejecutar todas las suites en verde.
- [ ] **G.2**: Ejecutar manualmente PU-OF-01..04, PU-EXT-01, PU-EXT-08, PU-EXT-11 y PU-EXT-12 con el sandbox real y registrar la evidencia.
- [ ] **G.3**: Actualizar el `README.md` con instrucciones finales.
- [ ] **G.4**: Validación del usuario antes de cualquier operación de Git remota.
