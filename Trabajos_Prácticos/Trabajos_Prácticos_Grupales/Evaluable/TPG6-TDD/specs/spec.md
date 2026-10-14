# Especificación Técnica Ejecutable — Comprar Entradas
> **Cátedra:** Ingeniería y Calidad de Software (UTN - FRC) — Curso 4K1 — Grupo 11  
> **Trabajo Práctico:** TP N° 6 (TDD - Evaluable) sobre TP N° 2 (EcoHarmony Park)  
> **Metodología:** Spec-Driven Development (SDD) + Test-Driven Development (TDD)

---

## 0. Rol de este documento

Este documento **no repite** la User Story ni los criterios de aceptación: los referencia por su identificador para evitar versiones divergentes.

| Necesito saber... | Fuente única |
| :--- | :--- |
| La User Story oficial, las respuestas del PO que aplican, criterios de aceptación (CA-01..CA-14), reglas complementarias (RC-01..RC-06) y pruebas de usuario (PU-*) | `Documentación/ESPECIFICACION_USER_STORY.md` |
| Arquitectura, estados, DER, clases, puertos y secuencias | `Documentación/DISENO_TECNICO_Y_ARQUITECTURA.md` |
| Por qué se tomó cada decisión (ADR-01..ADR-28) | `Documentación/DECISIONES_DE_DISENO.md` |
| Convenciones de código y de tests | `Documentación/GUIA_DE_ESTILO.md` |

Lo que **sí** define este documento, porque es lo que se programa y se prueba:
1. El contrato del API REST (sección 1).
2. El contrato de errores (sección 2).
3. Los escenarios ejecutables con datos concretos (sección 3), que se convierten uno a uno en tests.

---

## 1. Contrato del API REST

Prefijo global: `/api`. Formato: JSON. Fechas de visita: `YYYY-MM-DD`. Importes: centavos enteros en ARS.

**Sesión simulada (ADR-19):** no hay endpoint de login. `MockSessionGuard` identifica al visitante con la variable `MOCK_SESSION_USER_ID` en todos los endpoints, salvo el webhook y el retorno de Mercado Pago. Si la variable no está definida, responde `401 UNAUTHENTICATED`. El usuario comprador nunca se toma del cuerpo del request.

### 1.1. `GET /api/session`
Devuelve el visitante de la sesión simulada, para mostrarlo en la interfaz.

**Response `200`:**
```json
{ "userId": "00000000-0000-4000-8000-000000000001", "name": "Visitante Demo", "email": "visitante@ecoharmony.local" }
```
**Errores:** `401 UNAUTHENTICATED`, `401 USER_NOT_REGISTERED`.

### 1.2. `GET /api/calendar/available-dates`
Devuelve las fechas en las que se puede comprar en este momento (ADR-23, ADR-26): desde hoy hasta el horizonte de un mes, sin días cerrados ni el día actual después de las 17:30. El frontend habilita en el calendario solo estas fechas.

**Response `200`:**
```json
{
  "from": "2026-10-14",
  "to": "2026-11-14",
  "availableDates": ["2026-10-14", "2026-10-15", "2026-10-16", "2026-10-17", "2026-10-18", "2026-10-20", "..."]
}
```
**Errores:** `401 UNAUTHENTICATED`.

### 1.3. `POST /api/purchases/quote`
Calcula los subtotales y el total de un conjunto de entradas **sin crear la compra** (ADR-26). Usa las mismas reglas de precio y descuento que la compra.

**Request:**
```json
{
  "tickets": [
    { "passType": "REGULAR", "visitorAge": 40 },
    { "passType": "REGULAR", "visitorAge": 2 }
  ]
}
```
**Response `200`:**
```json
{
  "tickets": [
    { "passType": "REGULAR", "visitorAge": 40, "listPrice": { "amountCents": 1000000, "currency": "ARS" }, "discountPercent": 0, "subtotal": { "amountCents": 1000000, "currency": "ARS" } },
    { "passType": "REGULAR", "visitorAge": 2, "listPrice": { "amountCents": 1000000, "currency": "ARS" }, "discountPercent": 100, "subtotal": { "amountCents": 0, "currency": "ARS" } }
  ],
  "total": { "amountCents": 1000000, "currency": "ARS" }
}
```
**Errores:** `400 VALIDATION_ERROR`, `401 UNAUTHENTICATED`, `422 INVALID_TICKET_QUANTITY`, `422 INVALID_VISITOR_AGE`.

### 1.4. `POST /api/purchases`
Crea una compra de entradas para el visitante de la sesión simulada.

**Request:**
```json
{
  "visitDate": "2026-10-21",
  "tickets": [
    { "passType": "REGULAR", "visitorAge": 34 },
    { "passType": "VIP", "visitorAge": 8 }
  ],
  "paymentMethod": "TARJETA"
}
```

| Campo | Tipo | Validación de formato (DTO, `400`) | Regla de negocio (dominio, `422`) |
| :--- | :--- | :--- | :--- |
| `visitDate` | `string` | Requerido, formato `YYYY-MM-DD` y fecha de calendario existente | No pasada (CA-03); dentro del horizonte (CA-13); antes del corte si es hoy (CA-14); día abierto (CA-04) |
| `tickets` | `array` | Requerido, debe ser un arreglo | Entre 1 y 10 elementos (CA-02); no superar 10 para la fecha (CA-11) |
| `tickets[].passType` | `string` | Requerido, `REGULAR` o `VIP` (CA-05) | — |
| `tickets[].visitorAge` | `integer` | Requerido, número entero | Mayor o igual a 0 (CA-05); define el descuento (CA-12) |
| `paymentMethod` | `string` | Requerido, `EFECTIVO` o `TARJETA` (CA-07) | — |

Las reglas de rango (cantidad y edad) se validan **solo en el dominio**, para que tengan una única fuente de verdad probada en TDD.

**Response `201` — Tarjeta (CA-08, CA-10):**
```json
{
  "purchaseId": "6f1c2a4e-1b7d-4c55-9a2b-2f1e0c9d8a11",
  "visitDate": "2026-10-21",
  "ticketCount": 2,
  "tickets": [
    { "passType": "REGULAR", "visitorAge": 34, "listPrice": { "amountCents": 1000000, "currency": "ARS" }, "discountPercent": 0, "subtotal": { "amountCents": 1000000, "currency": "ARS" } },
    { "passType": "VIP", "visitorAge": 8, "listPrice": { "amountCents": 2000000, "currency": "ARS" }, "discountPercent": 50, "subtotal": { "amountCents": 1000000, "currency": "ARS" } }
  ],
  "total": { "amountCents": 2000000, "currency": "ARS" },
  "paymentMethod": "TARJETA",
  "status": "PENDIENTE_PAGO",
  "paymentUrl": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=...",
  "expiresAt": "2026-10-14T13:15:00.000Z"
}
```

**Response `201` — Efectivo (CA-09, CA-10):**
```json
{
  "purchaseId": "9b0e7d33-5c1a-4f0e-8d7e-3a2b1c0d9e88",
  "visitDate": "2026-10-21",
  "ticketCount": 1,
  "tickets": [
    { "passType": "REGULAR", "visitorAge": 34, "listPrice": { "amountCents": 1000000, "currency": "ARS" }, "discountPercent": 0, "subtotal": { "amountCents": 1000000, "currency": "ARS" } }
  ],
  "total": { "amountCents": 1000000, "currency": "ARS" },
  "paymentMethod": "EFECTIVO",
  "status": "CONFIRMADA_PAGO_EN_BOLETERIA"
}
```

**Errores:** `400 VALIDATION_ERROR`, `401 UNAUTHENTICATED`, `401 USER_NOT_REGISTERED`, `422 VISIT_DATE_IN_PAST`, `422 VISIT_DATE_BEYOND_HORIZON`, `422 SAME_DAY_PURCHASE_CLOSED`, `422 PARK_CLOSED`, `422 INVALID_TICKET_QUANTITY`, `422 INVALID_VISITOR_AGE`, `422 TICKET_LIMIT_PER_DATE_EXCEEDED`, `502 PAYMENT_GATEWAY_ERROR`.

### 1.5. `GET /api/purchases/:id`
Devuelve el resumen de una compra **del visitante de la sesión**. Una compra de otro usuario responde `404` (no se revela su existencia).

**Response `200`:** misma forma que la respuesta de `POST /api/purchases`, sin `paymentUrl` ni `expiresAt` y con el estado actual (por ejemplo, `CONFIRMADA`).

**Errores:** `401 UNAUTHENTICATED`, `404 PURCHASE_NOT_FOUND`.

### 1.6. `POST /api/webhooks/mercadopago`
Recibe notificaciones de Mercado Pago (ADR-05). Público, protegido por firma.

* Encabezados requeridos: `x-signature` (`ts=<timestamp>,v1=<hmac>`) y `x-request-id`.
* Query string: `?data.id=<paymentId>&type=payment`. El `data.id` que se firma es el del **query string** (ADR-05).
* Cuerpo de referencia: `{ "action": "payment.created", "type": "payment", "data": { "id": "<paymentId>" } }`.
* La firma se valida con `WebhookSignatureValidator` del SDK oficial y una tolerancia de 300 segundos.
* Notificaciones de otro `type` se ignoran con `200`.
* Responde en menos de 22 segundos: Mercado Pago reintenta cada 15 minutos si no recibe `200`/`201`.

**Responses:** `200` (procesada, ignorada o duplicada), `401 INVALID_SIGNATURE`.

### 1.7. `GET /api/payments/return`
Destino de las `back_urls` de Mercado Pago (ADR-06). Lee `payment_id` y `external_reference` del query string que agrega Mercado Pago, reconcilia el pago y redirige al frontend.

**Response:** `302` a `${FRONTEND_URL}/compras/<external_reference>/resultado`.

---

## 2. Contrato de Errores

Todas las respuestas de error tienen la misma forma:
```json
{
  "statusCode": 422,
  "code": "PARK_CLOSED",
  "message": "El parque está cerrado los lunes, el 25 de diciembre y el 1 de enero.",
  "details": []
}
```
`details` solo se completa en `VALIDATION_ERROR`, con un elemento por campo inválido (`{ "field": "paymentMethod", "message": "..." }`).

| Código | HTTP | Origen | Cuándo | Criterio |
| :--- | :--- | :--- | :--- | :--- |
| `VALIDATION_ERROR` | 400 | DTO | Falta un campo, tipo incorrecto, valor fuera de enum o fecha mal formada. Se informan **todos** los campos inválidos. | CA-05, CA-07 |
| `UNAUTHENTICATED` | 401 | `MockSessionGuard` | No hay sesión simulada configurada (`MOCK_SESSION_USER_ID` sin definir). | CA-01 |
| `USER_NOT_REGISTERED` | 401 | Caso de uso | El usuario de la sesión no existe, está inactivo o no tiene rol `VISITANTE`. | CA-01 |
| `VISIT_DATE_IN_PAST` | 422 | Caso de uso | `visitDate` anterior a hoy en la zona horaria del parque. | CA-03 |
| `VISIT_DATE_BEYOND_HORIZON` | 422 | Caso de uso | `visitDate` posterior a la misma fecha del mes siguiente (o al último día de ese mes). | CA-13 |
| `SAME_DAY_PURCHASE_CLOSED` | 422 | Caso de uso | `visitDate` es hoy y la hora del parque es posterior a las 17:30. | CA-14 |
| `PARK_CLOSED` | 422 | Caso de uso | `visitDate` cae lunes, 25 de diciembre o 1 de enero (o un día configurado como cerrado). | CA-04 |
| `INVALID_TICKET_QUANTITY` | 422 | Dominio | 0 entradas o más de 10 en la compra. | CA-02 |
| `INVALID_VISITOR_AGE` | 422 | Dominio | Alguna edad menor a 0. | CA-05 |
| `TICKET_LIMIT_PER_DATE_EXCEEDED` | 422 | Caso de uso | Las entradas activas del usuario para la fecha más las pedidas superan 10. El mensaje informa cuántas puede comprar todavía. | CA-11 |
| `PURCHASE_NOT_FOUND` | 404 | Caso de uso | La compra no existe o pertenece a otro usuario. | CA-10 |
| `INVALID_SIGNATURE` | 401 | Webhook | `x-signature` ausente o que no coincide. | RC-06 |
| `PAYMENT_GATEWAY_ERROR` | 502 | Adaptador | Mercado Pago no responde o responde con error al crear la preferencia. No se persiste la compra. | CA-08 |

**Orden de evaluación de reglas de negocio** (se detiene en la primera violada, ADR-25): `USER_NOT_REGISTERED` → `VISIT_DATE_IN_PAST` → `VISIT_DATE_BEYOND_HORIZON` → `SAME_DAY_PURCHASE_CLOSED` → `PARK_CLOSED` → `INVALID_TICKET_QUANTITY` → `INVALID_VISITOR_AGE` → `TICKET_LIMIT_PER_DATE_EXCEEDED`.

---

## 3. Escenarios Ejecutables

Cada escenario se implementa como un test (ver `specs/tasks.md`). Datos de referencia:

* **Ahora (reloj fijo):** miércoles `2026-10-14` a las 10:00, zona `America/Argentina/Cordoba`, salvo que el escenario indique otro reloj.
* **Fechas:** ayer `2026-10-13` (martes); jueves `2026-10-15`; viernes `2026-10-16`; sábado `2026-10-17`; domingo `2026-10-18`; lunes `2026-10-19`; martes `2026-10-20`; miércoles `2026-10-21`; horizonte `2026-11-14` (sábado); fuera del horizonte `2026-11-15` (domingo).
* **Tarifas:** `REGULAR` = 1000000 centavos ($10.000); `VIP` = 2000000 centavos ($20.000).
* **Usuarios semilla:** `visitante@ecoharmony.local` (activo, `VISITANTE`, usuario de la sesión simulada; su email se toma de `MOCK_SESSION_USER_EMAIL`, ADR-27); `inactivo@ecoharmony.local` (inactivo).
* Salvo indicación, las entradas son de visitantes de 34 años (precio completo).

### 3.1. Usuario registrado (CA-01)
* **E-01:** Dado un usuario activo con rol `VISITANTE`, cuando compra, entonces la compra se crea.
* **E-02:** Dado un identificador de usuario inexistente, cuando compra, entonces falla con `USER_NOT_REGISTERED` y no se persiste ninguna compra.
* **E-03:** Dado un usuario inactivo, cuando compra, entonces falla con `USER_NOT_REGISTERED`.
* **E-04:** Dada la aplicación sin `MOCK_SESSION_USER_ID`, cuando se llama a `POST /api/purchases`, entonces responde `401 UNAUTHENTICATED`.

### 3.2. Fecha de visita (CA-03, CA-04)
* **E-05:** Dado hoy `2026-10-14` (miércoles, abierto) a las 10:00, cuando la fecha de visita es `2026-10-14`, entonces se acepta (el día actual es válido).
* **E-06:** Cuando la fecha de visita es `2026-10-13`, entonces falla con `VISIT_DATE_IN_PAST`.
* **E-07:** Cuando la fecha de visita es martes `2026-10-20`, miércoles `2026-10-21`, jueves `2026-10-15`, viernes `2026-10-16`, sábado `2026-10-17` o domingo `2026-10-18`, entonces se acepta.
* **E-08:** Cuando la fecha de visita es lunes `2026-10-19`, entonces falla con `PARK_CLOSED`.
* **E-09 (zona horaria, ADR-12):** Dado el servidor en UTC y el instante `2026-10-15T01:30:00Z`, entonces `parkNow()` devuelve la fecha `2026-10-14` y la hora 22:30 (en Córdoba todavía es miércoles).
* **E-10 (zona horaria, ADR-12):** El día de la semana de `2026-10-19` es lunes independientemente de la zona horaria del proceso.
* **E-39 (feriados, ADR-20):** Dado el reloj en `2026-12-20` a las 10:00, cuando la fecha de visita es `2026-12-25` o `2027-01-01`, entonces falla con `PARK_CLOSED`; cuando es `2026-12-26`, se acepta.

### 3.3. Cantidad y datos de entradas (CA-02, CA-05)
* **E-11:** Con 0 entradas, falla con `INVALID_TICKET_QUANTITY`.
* **E-12:** Con 1 entrada, se acepta.
* **E-13:** Con 10 entradas, se acepta (valor límite).
* **E-14:** Con 11 entradas, falla con `INVALID_TICKET_QUANTITY`.
* **E-15:** Con una entrada de edad `-1`, falla con `INVALID_VISITOR_AGE`.
* **E-16:** Con una entrada de edad `0`, se acepta (valor límite).
* **E-17:** Con `passType` = `"PREMIUM"`, la API responde `400 VALIDATION_ERROR`.

### 3.4. Tarifas, descuentos y total (CA-06, CA-12)
* **E-18:** 1 `REGULAR` de 34 años → subtotal y total 1000000 centavos.
* **E-19:** 2 `REGULAR` + 1 `VIP`, todos de 34 años → total 4000000 centavos.
* **E-20:** El precio de lista de cada entrada es el vigente al momento de la compra; un cambio posterior de tarifa no modifica la compra.
* **E-40 (franjas de edad sobre `REGULAR`):** edades 0 y 3 → descuento 100%, subtotal 0; edades 4 y 15 → descuento 50%, subtotal 500000; edades 16 y 59 → descuento 0%, subtotal 1000000; edad 60 → descuento 50%, subtotal 500000.
* **E-41 (descuento sobre `VIP`):** 1 `VIP` de 8 años → descuento 50%, subtotal 1000000.
* **E-42 (familia):** `REGULAR` de 40 años, `REGULAR` de 2 años, `VIP` de 10 años y `VIP` de 65 años → subtotales 1000000, 0, 1000000 y 1000000; total 3000000; `ticketCount` = 4.

### 3.5. Ventana de compra (CA-13, CA-14)
* **E-43 (horizonte):** Cuando la fecha de visita es `2026-11-14`, se acepta; cuando es `2026-11-15`, falla con `VISIT_DATE_BEYOND_HORIZON`.
* **E-44 (fin de mes):** Dado el reloj en `2027-01-31` a las 10:00, cuando la fecha de visita es `2027-02-28`, se acepta; cuando es `2027-03-01`, falla con `VISIT_DATE_BEYOND_HORIZON` (el horizonte se evalúa antes que el día de apertura).
* **E-45 (corte del mismo día):** Dado el reloj en `2026-10-14` a las 17:30, la fecha `2026-10-14` se acepta. A las 17:31, la fecha `2026-10-14` falla con `SAME_DAY_PURCHASE_CLOSED` y la fecha `2026-10-15` se acepta.

### 3.6. Límite de entradas por fecha (CA-11)
* **E-46:** Dado que el usuario ya tiene, para `2026-10-17`, una compra `CONFIRMADA` con 4 entradas y una `PENDIENTE_PAGO` con 3, cuando pide 3 entradas más para esa fecha, entonces se acepta (total 10); cuando pide 4, falla con `TICKET_LIMIT_PER_DATE_EXCEEDED` y no se persiste ninguna compra.
* **E-47:** Dado que el usuario tiene, para `2026-10-17`, una compra `RECHAZADA` con 5 entradas y una `EXPIRADA` con 5, cuando pide 10 entradas para esa fecha, entonces se acepta.
* **E-48:** Las entradas del usuario para otra fecha (10 para `2026-10-16`) y las de otro usuario para la misma fecha no cuentan para el límite de `2026-10-17`.
* **E-49 (concurrencia, ADR-22):** Dadas dos compras simultáneas del mismo usuario para `2026-10-17` con 6 entradas cada una, entonces una se acepta y la otra falla con `TICKET_LIMIT_PER_DATE_EXCEEDED`.

### 3.7. Medio de pago (CA-07, CA-08)
* **E-21:** Sin `paymentMethod`, la API responde `400 VALIDATION_ERROR` con el campo `paymentMethod` en `details`.
* **E-22:** Con `paymentMethod` = `"BITCOIN"`, la API responde `400 VALIDATION_ERROR`.
* **E-23:** Con `TARJETA`, se crea una preferencia con `external_reference` igual al `purchaseId`, el total con descuentos aplicados y el vencimiento; la compra queda `PENDIENTE_PAGO` con `expiresAt = ahora + 15 min` y la respuesta incluye `paymentUrl`.
* **E-24:** Con `TARJETA`, si la pasarela falla, se responde `PAYMENT_GATEWAY_ERROR` y no se persiste ninguna compra.
* **E-25:** Con `TARJETA`, **no** se envía ningún correo al crear la compra.

### 3.8. Efectivo y correo (CA-09, RC-05)
* **E-26:** Con `EFECTIVO`, la compra queda `CONFIRMADA_PAGO_EN_BOLETERIA`, con `accessCode` asignado.
* **E-27:** Con `EFECTIVO`, se envía un correo al email del usuario con el número de orden, el detalle de cada entrada (tipo de pase, edad, precio de lista, descuento y subtotal), el total, un QR cuyo contenido es el `accessCode` y el adjunto `comprobante-<purchaseId>.pdf`.
* **E-28:** Con `EFECTIVO`, si el envío del correo falla, la compra igual se persiste, la respuesta es exitosa y `notificationStatus = FAILED`.

### 3.9. Resumen (CA-10)
* **E-29:** La respuesta de una compra exitosa incluye `purchaseId`, `visitDate` y `ticketCount`.

### 3.10. Ciclo de vida del pago con tarjeta (RC-01..RC-04, RC-06)
* **E-30:** Dada una compra `PENDIENTE_PAGO`, cuando llega un pago `approved` con su `external_reference`, entonces pasa a `CONFIRMADA`, registra `mpPaymentId`, asigna `accessCode` y envía el correo con QR y comprobante.
* **E-31:** Dada una compra `PENDIENTE_PAGO`, cuando llega un pago `rejected`, entonces pasa a `RECHAZADA`, registra el motivo y envía un correo de aviso sin QR ni comprobante.
* **E-32:** Dada una compra `CONFIRMADA`, cuando llega de nuevo la misma notificación, entonces no cambia y no se envía otro correo.
* **E-33:** Dada una compra `PENDIENTE_PAGO` con `expiresAt` cumplido y sin pagos en Mercado Pago, cuando corre la expiración, entonces pasa a `EXPIRADA`.
* **E-34:** Dada una compra `PENDIENTE_PAGO` vencida pero con un pago `approved` en Mercado Pago, cuando corre la expiración, entonces pasa a `CONFIRMADA` y envía el correo con QR y comprobante (reconciliación).
* **E-35:** Dada una compra `PENDIENTE_PAGO` vencida con un pago `in_process`, cuando corre la expiración, entonces sigue `PENDIENTE_PAGO`.
* **E-36:** Una compra en estado final no admite transiciones (`confirmCardPayment`, `rejectCardPayment` y `expire` lanzan error si la compra no está `PENDIENTE_PAGO`).
* **E-37:** Un webhook con firma inválida, sin firma o con un `ts` de más de 300 segundos de antigüedad responde `401 INVALID_SIGNATURE` y no modifica ninguna compra.
* **E-38:** Dada una compra `PENDIENTE_PAGO` vencida con un pago `rejected` en Mercado Pago, cuando corre la expiración, entonces pasa a `RECHAZADA` y envía el aviso sin QR (reconciliación).

### 3.11. Endpoints de apoyo a la interfaz (ADR-19, ADR-26)
* **E-50 (fechas disponibles):** A las 10:00 del `2026-10-14`, `GET /api/calendar/available-dates` devuelve `from = 2026-10-14` y `to = 2026-11-14`; incluye `2026-10-14` y excluye los lunes `2026-10-19`, `2026-10-26`, `2026-11-02` y `2026-11-09`. A las 17:31 del mismo día, excluye `2026-10-14`.
* **E-51 (cotización):** `POST /api/purchases/quote` con las entradas de E-42 devuelve los mismos subtotales y el total 3000000, y no persiste ninguna compra.
* **E-52 (sesión):** `GET /api/session` devuelve el identificador, el nombre y el email del visitante de la sesión simulada.
