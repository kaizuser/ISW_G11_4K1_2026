# Especificación Formal de User Story: Comprar Entradas
**Cátedra:** Ingeniería y Calidad de Software (UTN - FRC)  
**Trabajo Práctico:** TP N° 6 (TDD - Evaluable) sobre TP N° 2 (EcoHarmony Park)  
**Estimación Relativa:** 8 Story Points  
**Fuente oficial:** `Documentación/TP6.pdf` (definición de la User Story). Aclaraciones del Product Owner: `Documentación/FAQ_PO_TDD_EcoHarmony_Park.pdf` (en adelante, **FAQ**). Contexto del dominio: `Documentación/TP2.pdf`.

---

## 1. Declaración de la User Story

### 1.1. Texto oficial de la cátedra (TP6, transcripción literal)
> **Comprar entradas** — 8  
> COMO visitante QUIERO comprar una entrada PARA asegurar mi visita al parque

**Criterios de Aceptación (literal):**
1. Debe indicar la fecha de visita deseada, la cantidad de entradas requeridas, la edad de cada visitante y tipo de pase (VIP o regular).
2. La fecha de visita guiada puede ser del día actual o futuro.
3. Debe enviar un mensaje de confirmación vía mail
4. Debe redirigir a mercado pago al confirmar la compra si el pago es con tarjeta de crédito
5. La fecha de la visita debe estar dentro de los días en que el parque está abierto.
6. Debe seleccionar la forma de pago: efectivo en caso de querer pagar en boletería o con tarjeta
7. La cantidad de entradas requeridas no debe ser mayor a 10
8. Al finalizar la compra se debe informar la cantidad de entradas compradas y la fecha.
9. Se debe permitir la compra de entradas solo a usuarios registrados.

**Pruebas de usuario (literal):**
- Probar comprar una entrada indicando la fecha de visita dentro de los días disponibles, una cantidad de entradas menor a 10, la edad de todos los visitantes, el tipo de pase, la forma de pago con tarjeta mediante Mercado pago y recepción del mail de confirmación (pasa)
- Probar comprar entradas sin seleccionar forma de pago (falla)
- Probar comprar entradas ingresando una fecha de visita en la cual el parque se encuentra cerrado (falla)
- Probar comprar entradas ingresando una cantidad de entradas mayor a 10 (falla)

### 1.2. Frase Verbal Canónica refinada por el equipo
> **COMO** visitante registrado  
> **QUIERO** comprar una o varias entradas para una fecha determinada  
> **PARA** asegurar mi visita al parque EcoHarmony Park.

El refinamiento explicita lo que ya exigen los criterios oficiales 1 ("la cantidad de entradas requeridas") y 9 ("solo a usuarios registrados").

### 1.3. Respuestas del Product Owner que aplican a esta User Story
El FAQ responde preguntas de las dos User Stories del dominio ("Comprar entradas" e "Inscribirme a actividad"). Para esta User Story aplican las preguntas **1 a 8, 11, 17, 19 a 21 y 24 a 27**. Las preguntas 9, 12 a 16, 18, 22, 23 y 28 a 32 corresponden a "Inscribirme a actividad" y no se implementan en este incremento; las preguntas 5 y 18 se toman como referencia para el contenido del correo.

---

## 2. Supuestos, Indicaciones Docentes y Respuestas del PO

Las respuestas del FAQ cierran la mayoría de las zonas grises del enunciado. Lo que el FAQ no precisa lo define el equipo y se marca como **precisión del equipo**. Las decisiones técnicas que implementan cada punto están justificadas en `DECISIONES_DE_DISENO.md`.

1. **Calendario y horario del parque (FAQ 1 y 11):** el parque abre **todos los días de 8:30 a 19:00, excepto los lunes** y los días festivos **25 de diciembre y 1 de enero**. La fecha se evalúa en la zona horaria del parque (Córdoba, Argentina) (ADR-20).
2. **Tarifario (FAQ 6 y 21):** pase **REGULAR** $10.000 ARS y pase **VIP** $20.000 ARS. Para esta User Story, la única diferencia entre ambos pases es el precio. El precio vigente se copia en cada entrada al momento de la compra (ADR-20).
3. **Descuentos por edad (FAQ 7):** se aplican sobre el precio del pase elegido, ya sea REGULAR o VIP (ADR-21):
   * Hasta 3 años inclusive: **no pagan** (100% de descuento).
   * De 4 a 15 años inclusive: **50% de descuento**.
   * Desde 60 años inclusive: **50% de descuento**.
   * De 16 a 59 años: precio completo.
   * *Precisión del equipo:* una entrada gratuita **igual se emite y cuenta como entrada**, porque el parque necesita registrar que ese visitante asiste.
4. **Ventana de compra (FAQ 25 y 26)** (ADR-23):
   * **Horizonte:** la fecha de visita puede estar como máximo **un mes** después de hoy. *Precisión del equipo:* un mes es la misma fecha del mes siguiente; si esa fecha no existe, se toma el último día de ese mes (por ejemplo, desde el 31/01 el límite es el 28/02, o el 29/02 en años bisiestos).
   * **Compras para el mismo día:** se aceptan **hasta las 17:30 inclusive** (una hora y media antes del cierre).
5. **Límite de entradas por fecha (FAQ 27):** un usuario puede comprar **como máximo 10 entradas para una misma fecha de visita**, sumando una o varias compras. *Precisión del equipo:* cuentan las compras `PENDIENTE_PAGO`, `CONFIRMADA` y `CONFIRMADA_PAGO_EN_BOLETERIA`; las compras `RECHAZADA` y `EXPIRADA` no cuentan, porque no reservan entradas (ADR-22).
6. **Indicación docente — Código QR:** los docentes indicaron que **se debe enviar un código QR tanto para el pago en efectivo como con tarjeta**. El equipo define (ADR-07):
   * Se genera **un único QR por compra**, que identifica la compra mediante un código opaco; el correo detalla todas las entradas.
   * El comportamiento del escáner en el parque (fuera del alcance de esta User Story) depende del estado de la compra:
     * `CONFIRMADA` (tarjeta): el pago está acreditado y se habilita el acceso directo.
     * `CONFIRMADA_PAGO_EN_BOLETERIA` (efectivo): el personal de boletería cobra el monto pendiente antes de autorizar el ingreso.
7. **Correo de confirmación (FAQ 5, con FAQ 18 como referencia):** el PO admite simular el correo con una interfaz parecida a la de un cliente de correo, con un cuerpo que tenga datos representativos de la transacción y **un archivo adjunto**. El equipo usa Mailpit, que muestra los correos reales en una bandeja web. El correo incluye el número de orden, el detalle de cada visitante (tipo de pase, edad, precio, descuento y subtotal), el total, el código QR y un **comprobante PDF adjunto** (ADR-24). Para la demostración, el mismo correo puede enviarse a una bandeja real mediante el plan gratuito de Resend (ADR-27).
8. **Autenticación (FAQ 19):** el registro y el login no forman parte de esta User Story; el PO indica que se puede **comenzar con la sesión y el usuario simulados**. El sistema trabaja con una **sesión simulada de un único visitante fijo**, cargado como dato semilla. La regla "solo usuarios registrados" (criterio 9) se mantiene en el caso de uso: si la sesión simulada no identifica a un visitante registrado y activo, la compra se rechaza (ADR-19).
9. **Mercado Pago (FAQ 4):** el PO admite simular la pasarela, pero indica que es *"mejor si lo hacen desarrollado"*. El equipo mantiene la integración real con Checkout Pro en modo de prueba (ADR-05). Una pantalla simulada de Mercado Pago queda solo como plan de contingencia si el sandbox no está disponible el día de la demostración.
10. **Horarios y capacidad (FAQ 20):** la compra se efectúa por **fecha de visita (día calendario)**, no por franja horaria. No hay un máximo de visitantes por día.
11. **Vencimiento del pago:** una compra con tarjeta que no recibe un pago aprobado dentro del plazo configurado (15 minutos por defecto) pasa a `EXPIRADA` (ADR-04).
12. **Reglas de lógica elemental:** una compra debe tener al menos 1 entrada y la edad de cada visitante debe ser un entero mayor o igual a 0.

---

## 3. Alcance del Sistema (Scope)

### Dentro del Alcance (In-Scope)
* Sesión simulada de un visitante registrado y exigencia de usuario registrado para comprar.
* Validación de fecha: igual o posterior a hoy, dentro del horizonte de un mes, antes del corte de las 17:30 si es para el mismo día, y en un día de apertura del parque.
* Control de volumen: entre 1 y 10 entradas por compra y como máximo 10 entradas por usuario para una misma fecha.
* Detalle de cada entrada: tipo de pase (`REGULAR` o `VIP`) y edad del visitante ($\ge 0$).
* Cálculo automático del subtotal de cada entrada (precio del pase con el descuento por edad) y del total.
* Cotización previa: el visitante ve los subtotales y el total antes de confirmar la compra.
* Selección de medio de pago:
  * **Efectivo en Boletería (`EFECTIVO`):** confirma inmediatamente la reserva con estado `CONFIRMADA_PAGO_EN_BOLETERIA` y envía el correo con el QR para el cobro en caja.
  * **Tarjeta (`TARJETA`):** genera una preferencia en Mercado Pago (Checkout Pro), coloca la compra en `PENDIENTE_PAGO` y redirige al visitante a la pasarela. Al recibir el pago aprobado (webhook o reconciliación) pasa a `CONFIRMADA` y envía el correo con el QR. Si el pago es rechazado pasa a `RECHAZADA` y se notifica por correo. Si vence el plazo sin pago pasa a `EXPIRADA`.
* Emisión y despacho de correos con el detalle de la compra, el QR y el comprobante PDF adjunto.
* Respuesta con resumen informativo al cliente (identificador de compra, fecha de visita, cantidad de entradas, subtotales, total y estado).

### Fuera del Alcance (Out-of-Scope)
* Registro de nuevos usuarios, login real y recuperación de contraseñas (FAQ 19).
* Cobro presencial en ventanilla, escaneo del QR en el ingreso e invalidación de reservas no abonadas en boletería.
* Gestión de cancelaciones, devoluciones o reprogramación de fechas.
* Administración (ABM) de tarifas, días de apertura y feriados.
* Control de cupos o capacidad diaria del parque (FAQ 20: no hay máximo de visitantes por día).

### 3.1. Requisitos de la interfaz (FAQ 2, 3, 17 y 24)
* **Aplicación web responsive pensada para celulares** (*mobile-first*), usable también en computadora.
* **Calendario de fecha de visita:** los días en que no se puede comprar (lunes, feriados, fechas pasadas, fechas fuera del horizonte y el día actual después de las 17:30) se muestran **deshabilitados** y no se pueden seleccionar.
* **Paleta de colores:** `#386641`, `#6A994E`, `#A7C957`, `#F2E8CF` y `#BC4749` ([coolors.co](https://coolors.co/palette/386641-6a994e-a7c957-f2e8cf-bc4749)).
* **Tipografía:** Lato.
* **Logo:** lo diseña el equipo y lo envía al PO para su validación.

---

## 4. Criterios de Aceptación Detallados (CA)

| CA | Criterio | Origen |
| :--- | :--- | :--- |
| **CA-01 (Usuario registrado)** | Solo usuarios registrados pueden comprar entradas. Si no hay sesión, o la sesión no corresponde a un visitante registrado y activo, se rechaza la solicitud. | TP6 criterio 9; FAQ 19 |
| **CA-02 (Rango por compra)** | La cantidad de entradas de una compra debe estar entre 1 y 10 inclusive. | TP6 criterio 7 (y supuesto 12) |
| **CA-03 (Fecha actual o futura)** | La fecha de visita debe ser igual o posterior a la fecha actual del parque (`fechaVisita >= hoy`). | TP6 criterio 2 |
| **CA-04 (Días de apertura)** | La fecha de visita debe corresponder a un día de apertura: de martes a domingo, excepto el 25 de diciembre y el 1 de enero. | TP6 criterio 5; FAQ 1 |
| **CA-05 (Datos por entrada)** | Cada entrada debe especificar obligatoriamente un tipo de pase válido (`REGULAR` o `VIP`) y una edad válida (entero $\ge 0$). | TP6 criterio 1 (y supuesto 12) |
| **CA-06 (Tarifas y total)** | El subtotal de cada entrada es el precio vigente de su tipo de pase con el descuento por edad aplicado (CA-12). El total es la suma de los subtotales. | Contexto TP2 ("el sistema mostrará el monto total"); FAQ 6 |
| **CA-07 (Medio de pago obligatorio)** | Se debe seleccionar obligatoriamente una forma de pago válida (`EFECTIVO` o `TARJETA`). | TP6 criterio 6 |
| **CA-08 (Integración con la pasarela)** | Si el pago es con `TARJETA`, el sistema crea la preferencia de pago en Mercado Pago y devuelve la URL para redirigir al visitante. | TP6 criterio 4; FAQ 4 |
| **CA-09 (Correo de confirmación)** | Toda compra `CONFIRMADA` o `CONFIRMADA_PAGO_EN_BOLETERIA` despacha un correo con el número de orden, el detalle de cada entrada con su subtotal, el total, el código QR y el comprobante PDF adjunto. | TP6 criterio 3; indicación docente; FAQ 5 |
| **CA-10 (Resumen al usuario)** | Al completarse la solicitud, el sistema retorna un resumen que incluye el identificador de la compra, la fecha de visita y la cantidad de entradas. | TP6 criterio 8 |
| **CA-11 (Límite por fecha)** | Un usuario no puede superar las 10 entradas para una misma fecha de visita, sumando sus compras `PENDIENTE_PAGO`, `CONFIRMADA` y `CONFIRMADA_PAGO_EN_BOLETERIA`. | FAQ 27 |
| **CA-12 (Descuento por edad)** | Hasta 3 años inclusive la entrada es gratuita; de 4 a 15 años y desde 60 años tiene 50% de descuento; de 16 a 59 años se paga el precio completo. | FAQ 7 |
| **CA-13 (Horizonte de compra)** | La fecha de visita no puede ser posterior a la misma fecha del mes siguiente a hoy (o al último día de ese mes si la fecha no existe). | FAQ 25 |
| **CA-14 (Corte para el mismo día)** | Una compra para el día actual solo se acepta hasta las 17:30 inclusive, hora del parque. | FAQ 26 |

### 4.1. Reglas complementarias del flujo con tarjeta (RC)
Reglas del equipo que completan el ciclo de vida del pago con tarjeta (ver `DISENO_TECNICO_Y_ARQUITECTURA.md`, sección 3):

| RC | Regla |
| :--- | :--- |
| **RC-01 (Pago aprobado)** | Una compra `PENDIENTE_PAGO` con pago aprobado pasa a `CONFIRMADA` y dispara el correo de CA-09. |
| **RC-02 (Pago rechazado)** | Una compra `PENDIENTE_PAGO` con pago rechazado pasa a `RECHAZADA` y se notifica por correo sin QR ni comprobante. |
| **RC-03 (Vencimiento)** | Una compra `PENDIENTE_PAGO` sin pago aprobado al vencer el plazo pasa a `EXPIRADA`. |
| **RC-04 (Idempotencia)** | Una notificación de pago repetida sobre una compra en estado final no cambia su estado ni reenvía correos. |
| **RC-05 (Correo no transaccional)** | Si el envío del correo falla, la compra no se revierte; el envío queda pendiente de reintento. |
| **RC-06 (Origen verificado)** | Una notificación de pago solo se procesa si su firma demuestra que la envió Mercado Pago; si no, se rechaza sin modificar ninguna compra. |

---

## 5. Pruebas de Usuario (Criterios de Aceptación Verificables)

Precios de referencia: REGULAR $10.000 y VIP $20.000 (supuesto 2). Salvo indicación, los visitantes tienen entre 16 y 59 años (precio completo).

### 5.1. Pruebas de Usuario Oficiales (Enunciado de la Cátedra)

| ID | Prueba de Usuario | Condiciones de Entrada | Resultado Esperado | CA | Clasificación |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PU-OF-01** | Compra válida con Tarjeta | Sesión de un usuario registrado, fecha dentro de los días disponibles, cantidad < 10, edad de todos los visitantes, tipo de pase, pago con tarjeta vía Mercado Pago | Redirección a Mercado Pago; tras el pago aprobado, compra `CONFIRMADA` y recepción del correo de confirmación con QR y comprobante PDF | CA-01..CA-14, RC-01 | **PASA** |
| **PU-OF-02** | Compra sin medio de pago | Entradas válidas pero sin seleccionar forma de pago | Rechazo de la operación con error de validación | CA-07 | **FALLA** |
| **PU-OF-03** | Compra con parque cerrado | Fecha de visita en lunes, 25 de diciembre o 1 de enero | Rechazo de la operación con mensaje de parque cerrado | CA-04 | **FALLA** |
| **PU-OF-04** | Cantidad mayor al límite | Cantidad de entradas mayor a 10 (ej: 11) | Rechazo de la operación por límite excedido | CA-02 | **FALLA** |

---

### 5.2. Pruebas de Usuario Extendidas (Derivadas de los Supuestos y del FAQ)

| ID | Prueba de Usuario | Condiciones de Entrada | Justificación / Criterio Asociado | Clasificación |
| :--- | :--- | :--- | :--- | :--- |
| **PU-EXT-01** | Compra válida en Efectivo | Usuario registrado, miércoles futuro, 1 entrada Regular, pago Efectivo | Compra `CONFIRMADA_PAGO_EN_BOLETERIA` por $10.000 y correo con QR y comprobante (CA-07, CA-09, CA-10) | **PASA** |
| **PU-EXT-02** | Usuario no registrado | Sin sesión, o sesión simulada de un usuario inexistente o inactivo | Exigencia de usuario registrado (CA-01) | **FALLA** |
| **PU-EXT-03** | Cantidad menor a 1 entrada | Lista de entradas vacía (0 entradas) | Límite inferior del rango de entradas (CA-02) | **FALLA** |
| **PU-EXT-04** | Fecha en el pasado | Fecha de visita anterior a la fecha actual del parque | Exigencia de fecha actual o futura (CA-03) | **FALLA** |
| **PU-EXT-05** | Edad de visitante inválida | Entrada con edad negativa (ej: -1) | Integridad de los datos del visitante (CA-05) | **FALLA** |
| **PU-EXT-06** | Límite superior exacto | 10 entradas, día abierto, sin compras previas para esa fecha, pago Efectivo | Valor límite del rango (CA-02, CA-11) | **PASA** |
| **PU-EXT-07** | Total mixto | 2 entradas Regular y 1 VIP | Total = $40.000 (CA-06) | **PASA** |
| **PU-EXT-08** | Pago con tarjeta rechazado | Compra con tarjeta; Mercado Pago informa pago rechazado | Compra `RECHAZADA` y correo de aviso sin QR (RC-02) | **FALLA** |
| **PU-EXT-09** | Pago con tarjeta vencido | Compra con tarjeta sin pago al vencer el plazo | Compra `EXPIRADA` (RC-03) | **FALLA** |
| **PU-EXT-10** | Tipo de pase inválido | Entrada con tipo de pase distinto de `REGULAR` o `VIP` | Integridad de los datos de la entrada (CA-05) | **FALLA** |
| **PU-EXT-11** | Descuentos por edad | Regular de 40 años, Regular de 2 años, VIP de 10 años y VIP de 65 años | Subtotales $10.000, $0, $10.000 y $10.000; total $30.000; 4 entradas emitidas (CA-06, CA-12) | **PASA** |
| **PU-EXT-12** | Límite acumulado por fecha | El usuario ya tiene 7 entradas activas para la fecha y pide 4 más | Rechazo por superar 10 entradas para esa fecha (CA-11) | **FALLA** |
| **PU-EXT-13** | Fecha fuera del horizonte | Fecha de visita posterior a un mes desde hoy | Rechazo por fecha fuera del horizonte de compra (CA-13) | **FALLA** |
| **PU-EXT-14** | Compra para hoy después del corte | Compra para el día actual a las 17:31 | Rechazo por horario de compra para el mismo día vencido (CA-14) | **FALLA** |
