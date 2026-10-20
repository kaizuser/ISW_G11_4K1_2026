# Especificación de la User Story: Comprar Entradas
**Cátedra:** Ingeniería y Calidad de Software (UTN - FRC)  
**Trabajo Práctico:** TP N° 6 (TDD - Evaluable) sobre TP N° 2 (EcoHarmony Park)  
**Estimación:** 8 Story Points  
**Fuentes:** `TP6.pdf` (User Story oficial) y `FAQ_PO_TDD_EcoHarmony_Park.pdf` (en adelante, **FAQ**). Las decisiones técnicas que implementan esta especificación están en `DISENO_Y_DECISIONES.md` (referencias `D-XX`).

---

## 1. User Story

### 1.1. Texto oficial (TP6, transcripción literal)
> **Comprar entradas** — 8  
> COMO visitante QUIERO comprar una entrada PARA asegurar mi visita al parque

**Criterios de aceptación:**
1. Debe indicar la fecha de visita deseada, la cantidad de entradas requeridas, la edad de cada visitante y tipo de pase (VIP o regular).
2. La fecha de visita guiada puede ser del día actual o futuro.
3. Debe enviar un mensaje de confirmación vía mail
4. Debe redirigir a mercado pago al confirmar la compra si el pago es con tarjeta de crédito
5. La fecha de la visita debe estar dentro de los días en que el parque está abierto.
6. Debe seleccionar la forma de pago: efectivo en caso de querer pagar en boletería o con tarjeta
7. La cantidad de entradas requeridas no debe ser mayor a 10
8. Al finalizar la compra se debe informar la cantidad de entradas compradas y la fecha.
9. Se debe permitir la compra de entradas solo a usuarios registrados.

**Pruebas de usuario:**
- Probar comprar una entrada indicando la fecha de visita dentro de los días disponibles, una cantidad de entradas menor a 10, la edad de todos los visitantes, el tipo de pase, la forma de pago con tarjeta mediante Mercado pago y recepción del mail de confirmación (pasa)
- Probar comprar entradas sin seleccionar forma de pago (falla)
- Probar comprar entradas ingresando una fecha de visita en la cual el parque se encuentra cerrado (falla)
- Probar comprar entradas ingresando una cantidad de entradas mayor a 10 (falla)

### 1.2. Respuestas del FAQ que aplican
Aplican las preguntas **1 a 8, 11, 17, 19 a 21 y 24 a 27**. El resto corresponde a "Inscribirme a actividad"; la 18 se toma solo como referencia para el contenido del correo.

---

## 2. Reglas del Dominio

Lo que el FAQ no precisa lo define el equipo y se marca como *precisión del equipo*.

1. **Apertura del parque (FAQ 1 y 11):** todos los días de 8:30 a 19:00, excepto los lunes, el 25 de diciembre y el 1 de enero. Las fechas se evalúan en la zona horaria del parque (Córdoba).
2. **Precios (FAQ 6 y 21):** pase **REGULAR** $10.000 y pase **VIP** $20.000. La única diferencia entre pases es el precio.
3. **Descuentos por edad (FAQ 7),** sobre el precio del pase elegido:
   * Hasta 3 años inclusive: gratis.
   * De 4 a 15 años: 50%.
   * Desde 60 años: 50%.
   * De 16 a 59 años: precio completo.
   * *Precisión del equipo:* una entrada gratuita igual se emite y cuenta para los límites.
4. **Ventana de compra (FAQ 25 y 26):**
   * La fecha de visita es hoy o posterior, y como máximo **un mes** después de hoy. *Precisión del equipo:* un mes es la misma fecha del mes siguiente o, si no existe, el último día de ese mes (desde el 31/01, el límite es el 28/02).
   * Para el mismo día se puede comprar **hasta las 17:30 inclusive**.
5. **Límite de entradas (TP6 y FAQ 27):** entre 1 y 10 entradas por compra, y como máximo **10 entradas por usuario para una misma fecha**, sumando todas sus compras. *Precisión del equipo:* cuentan las compras `PENDIENTE_PAGO`, `CONFIRMADA` y `CONFIRMADA_PAGO_EN_BOLETERIA`; las `RECHAZADA` no.
6. **Sesión (FAQ 19):** no hay registro ni login; el sistema trabaja con un visitante fijo simulado. La regla "solo usuarios registrados" se mantiene: si la sesión no corresponde a un usuario registrado, la compra se rechaza.
7. **Mercado Pago (FAQ 4):** la pasarela se simula con una pantalla propia, parecida a la de Mercado Pago, que permite aprobar o rechazar el pago.
8. **Correo (FAQ 5):** el envío se simula con una bandeja de correo dentro de la aplicación. El mensaje muestra los datos de la compra, un código QR y un comprobante PDF adjunto.
9. **Código QR (indicación docente):** se envía un QR tanto para el pago en efectivo como con tarjeta. Un único QR por compra.
10. **Capacidad (FAQ 20):** no hay máximo de visitantes por día. La compra es por día calendario, no por franja horaria.
11. **Lógica elemental:** la edad de cada visitante es un entero mayor o igual a 0.

---

## 3. Alcance

**Dentro del alcance:**
* Validación de usuario, fecha, cantidad y datos de cada entrada según las reglas de la sección 2.
* Cálculo de subtotales con descuento por edad y del total, visible antes de confirmar (cotización).
* Pago en **efectivo**: la compra queda confirmada para pagar en boletería y se envía el correo.
* Pago con **tarjeta**: la compra queda pendiente y se redirige a la pantalla simulada de Mercado Pago. Si el pago se aprueba, se confirma y se envía el correo; si se rechaza, se notifica el rechazo.
* Resumen final con identificador, fecha de visita, cantidad de entradas, total y estado.

**Fuera del alcance:**
* Registro, login y recuperación de contraseña (FAQ 19).
* Integración real con Mercado Pago y envío real de correos.
* Cobro en boletería, escaneo del QR en el ingreso, cancelaciones y devoluciones.
* Administración de precios, días de apertura y feriados.

**Interfaz (FAQ 2, 3, 17 y 24):** web responsive *mobile-first*; calendario que deshabilita los días no disponibles (lunes, feriados, fechas pasadas, fuera del horizonte y hoy después de las 17:30); paleta `#386641`, `#6A994E`, `#A7C957`, `#F2E8CF`, `#BC4749`; tipografía Lato; logo diseñado por el equipo y validado por el PO.

---

## 4. Criterios de Aceptación Detallados

| CA | Criterio | Origen |
| :--- | :--- | :--- |
| **CA-01** Usuario registrado | Solo un usuario registrado puede comprar. | TP6 c.9; FAQ 19 |
| **CA-02** Cantidad por compra | Entre 1 y 10 entradas inclusive. | TP6 c.7 |
| **CA-03** Fecha actual o futura | La fecha de visita es igual o posterior a hoy (hora del parque). | TP6 c.2 |
| **CA-04** Días de apertura | La fecha de visita no es lunes, 25/12 ni 01/01. | TP6 c.5; FAQ 1 |
| **CA-05** Datos por entrada | Cada entrada tiene tipo de pase (`REGULAR` o `VIP`) y edad entera mayor o igual a 0. | TP6 c.1 |
| **CA-06** Total | El subtotal de cada entrada es su precio con el descuento por edad; el total es la suma. | FAQ 6 |
| **CA-07** Medio de pago | Es obligatorio elegir `EFECTIVO` o `TARJETA`. | TP6 c.6 |
| **CA-08** Redirección a Mercado Pago | Con `TARJETA`, la compra queda `PENDIENTE_PAGO` y se devuelve la URL de la pantalla de pago simulada. | TP6 c.4; FAQ 4 |
| **CA-09** Correo de confirmación | Toda compra `CONFIRMADA` o `CONFIRMADA_PAGO_EN_BOLETERIA` envía un correo con número de orden, detalle de entradas con subtotales, total, QR y comprobante PDF. | TP6 c.3; FAQ 5 |
| **CA-10** Resumen | Al finalizar se informa el identificador, la fecha de visita y la cantidad de entradas. | TP6 c.8 |
| **CA-11** Límite por fecha | Un usuario no supera 10 entradas para una misma fecha sumando sus compras activas. | FAQ 27 |
| **CA-12** Descuento por edad | Gratis hasta 3 años; 50% de 4 a 15 y desde 60; precio completo de 16 a 59. | FAQ 7 |
| **CA-13** Horizonte | La fecha de visita no supera un mes desde hoy. | FAQ 25 |
| **CA-14** Corte del mismo día | Para hoy, solo se compra hasta las 17:30 inclusive. | FAQ 26 |

### 4.1. Reglas del pago con tarjeta

| RC | Regla |
| :--- | :--- |
| **RC-01** Pago aprobado | Una compra `PENDIENTE_PAGO` con pago aprobado pasa a `CONFIRMADA` y envía el correo de CA-09. |
| **RC-02** Pago rechazado | Una compra `PENDIENTE_PAGO` con pago rechazado pasa a `RECHAZADA` y envía un aviso sin QR ni comprobante. |
| **RC-03** Estado final | Una compra en estado final no cambia de estado aunque se informe otro resultado de pago. |
| **RC-04** Correo no transaccional | Si el envío del correo falla, la compra no se revierte. |

---

## 5. Pruebas de Usuario

Precios de referencia: REGULAR $10.000 y VIP $20.000. Salvo indicación, los visitantes tienen entre 16 y 59 años.

### 5.1. Oficiales (TP6)

| ID | Prueba | Condiciones | Resultado esperado | CA | Resultado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PU-OF-01** | Compra válida con tarjeta | Usuario registrado, día abierto, menos de 10 entradas con edad y pase, pago con tarjeta | Redirección a la pantalla de Mercado Pago; al aprobar, compra `CONFIRMADA` y correo visible en la bandeja con QR y PDF | CA-01 a CA-10, RC-01 | **PASA** |
| **PU-OF-02** | Sin medio de pago | Entradas válidas sin forma de pago | Rechazo por validación | CA-07 | **FALLA** |
| **PU-OF-03** | Parque cerrado | Fecha en lunes, 25/12 o 01/01 | Rechazo por parque cerrado | CA-04 | **FALLA** |
| **PU-OF-04** | Más de 10 entradas | 11 entradas o mas | Rechazo por cantidad | CA-02 | **FALLA** |

### 5.2. Extendidas (FAQ y precisiones del equipo)

| ID | Prueba | Condiciones | Resultado esperado | Resultado |
| :--- | :--- | :--- | :--- | :--- |
| **PU-EXT-01** | Compra en efectivo | 1 entrada REGULAR, día abierto, efectivo | `CONFIRMADA_PAGO_EN_BOLETERIA` por $10.000 y correo con QR y PDF (CA-09, CA-10) | **PASA** |
| **PU-EXT-02** | Usuario no registrado | Sesión de un usuario inexistente | Rechazo (CA-01) | **FALLA** |
| **PU-EXT-03** | Cero entradas | Lista de entradas vacía | Rechazo (CA-02) | **FALLA** |
| **PU-EXT-04** | Fecha pasada | Fecha anterior a hoy | Rechazo (CA-03) | **FALLA** |
| **PU-EXT-05** | Edad inválida | Edad -1 | Rechazo (CA-05) | **FALLA** |
| **PU-EXT-06** | Límite exacto | 10 entradas, sin compras previas para la fecha | Compra aceptada (CA-02, CA-11) | **PASA** |
| **PU-EXT-07** | Total mixto | 2 REGULAR y 1 VIP | Total $40.000 (CA-06) | **PASA** |
| **PU-EXT-08** | Pago rechazado | Tarjeta; se rechaza en la pantalla de Mercado Pago | Compra `RECHAZADA` y aviso sin QR (RC-02) | **FALLA** |
| **PU-EXT-09** | Descuentos por edad | REGULAR de 40, REGULAR de 2, VIP de 10 y VIP de 65 años | Subtotales $10.000, $0, $10.000 y $10.000; total $30.000 (CA-12) | **PASA** |
| **PU-EXT-10** | Límite acumulado | 7 entradas activas para la fecha y pide 4 más | Rechazo (CA-11) | **FALLA** |
| **PU-EXT-11** | Fuera del horizonte | Fecha posterior a un mes desde hoy | Rechazo (CA-13) | **FALLA** |
| **PU-EXT-12** | Hoy después del corte | Compra para hoy a las 17:31 | Rechazo (CA-14) | **FALLA** |
