# Decisiones de Diseño y Glosario Técnico
**User Story:** Comprar Entradas (EcoHarmony Park)  
**Trabajo Práctico:** TP N° 6 (TDD - Evaluable) — Grupo 11, Curso 4K1  
**Propósito:** Cumplir con la salida exigida por la consigna del TP6, *"Documento que justifique las decisiones de diseño tomadas"*, y registrar el origen y el uso de cada concepto técnico incorporado al proyecto.

---

## 0. Cómo leer este documento

Cada decisión se registra como un **ADR** (*Architecture Decision Record*): un registro breve con el contexto que la motivó, la decisión tomada, las alternativas descartadas y sus consecuencias. Los ADR no se reescriben: si una decisión cambia, se agrega un ADR nuevo que **reemplaza** al anterior y se marca el anterior como `Reemplazado por ADR-XX`.

| Estado | Significado |
| :--- | :--- |
| `Aceptado` | Vigente. El código debe respetarlo. |
| `Reemplazado por ADR-XX` | Histórico. Ya no aplica. |

**Fuentes de verdad** (en orden de prioridad):
1. `Documentación/TP6.pdf` — definición oficial de la User Story, criterios de aceptación y pruebas de usuario.
2. `Documentación/FAQ_PO_TDD_EcoHarmony_Park.pdf` — respuestas del Product Owner a las preguntas frecuentes del dominio (ADR-18).
3. Indicaciones verbales de los docentes (registradas explícitamente en este documento).
4. `Documentación/TP2.pdf` — contexto del dominio (entrevista a Miguel Rodríguez).
5. `Documentación/ESPECIFICACION_USER_STORY.md` y `Documentación/DISENO_TECNICO_Y_ARQUITECTURA.md`.

---

## 1. Registro de Decisiones (ADR)

### ADR-01 — Arquitectura Hexagonal con mapeo Boundary-Control-Entity
* **Estado:** Aceptado.
* **Contexto:** El TP evalúa TDD. Para practicar Red-Green-Refactor con ciclos de milisegundos, las reglas de negocio no pueden depender de la base de datos, de Mercado Pago ni del servidor de correo.
* **Decisión:** Arquitectura Hexagonal (Puertos y Adaptadores). El dominio y los casos de uso solo conocen **interfaces (puertos)**; la infraestructura provee **adaptadores** concretos. El mapeo con BCE de la cátedra es: *Entity* = dominio, *Control* = casos de uso (Gestor), *Boundary* = controladores REST, adaptadores externos y pantallas React.
* **Alternativas descartadas:** Arquitectura en capas clásica de NestJS (servicios que usan TypeORM directamente): obliga a levantar base de datos o a mockear el ORM en cada test.
* **Consecuencias:** Más archivos (puerto + adaptador + doble de prueba por cada dependencia externa), a cambio de tests unitarios puros, deterministas y rápidos.

### ADR-02 — Stack tecnológico y política de versiones
* **Estado:** Aceptado.
* **Contexto:** Se busca trabajar con las últimas versiones estables. Al 13/10/2026 la última TypeScript publicada es 7.0.2, pero `ts-jest@29.4.14` declara `typescript >=4.3 <7` y `typescript-eslint@8.71.2` declara `typescript >=4.8.4 <6.1.0`.
* **Decisión:** Usar la **última versión estable que sea compatible con el resto del stack**. TypeScript queda fijado en `6.0.3` hasta que `ts-jest` y `typescript-eslint` soporten la versión 7. La tabla de versiones vigente está en `DISENO_TECNICO_Y_ARQUITECTURA.md`, sección 1.1.
* **Alternativas descartadas:** TypeScript 7: rompe la cadena de testing (`ts-jest`) y el linter.
* **Consecuencias:** Revisar esta decisión al iniciar cada fase consultando `npm view <paquete> peerDependencies`.
* **Hallazgos técnicos de la actualización (verificados en el Sprint 0):**
  1. **NestJS 12 y `nock` 15 se publican solo como ESM** (`"type": "module"`). El backend compila a CommonJS y Node 24 permite `require()` de módulos ESM de forma nativa, por eso la aplicación arranca sin cambios. Jest, en cambio, solo habilita ese soporte si Node se inicia con `--experimental-vm-modules`; por eso los scripts de test ejecutan `node --experimental-vm-modules node_modules/jest/bin/jest.js`. Sin esa opción los tests de integración y E2E fallan con `ERR_REQUIRE_ESM`.
  2. **TypeScript 6 exige `rootDir` explícito** cuando el directorio común de los fuentes no es la raíz (`TS5011`). `tsconfig.json` declara `rootDir: "."` (fuentes y tests, para `ts-jest` y ESLint) y `tsconfig.build.json` lo restringe a `./src` para el build.
  3. **`strict: true` con `strictPropertyInitialization: false`:** las clases decoradas de NestJS (DTOs de `class-validator` y entidades ORM) declaran propiedades que inicializa el framework, no el constructor.

### ADR-03 — Estados de la Compra
* **Estado:** Aceptado.
* **Contexto:** La User Story del TP6 no define estados; son una decisión de diseño del equipo. La versión previa de los documentos mezclaba `INICIADA`, `CANCELADA` y `EXPIRADA` de forma inconsistente.
* **Decisión:** La entidad `Purchase` tiene cinco estados:

| Estado | Significado | Tipo |
| :--- | :--- | :--- |
| `PENDIENTE_PAGO` | Compra válida con `TARJETA`, esperando el resultado de Mercado Pago. | Intermedio |
| `CONFIRMADA` | Pago con tarjeta aprobado. Entrada habilitada. | Final |
| `CONFIRMADA_PAGO_EN_BOLETERIA` | Compra válida con `EFECTIVO`. Se abona en boletería el día de la visita. | Final (en este incremento) |
| `RECHAZADA` | Mercado Pago rechazó el pago. | Final |
| `EXPIRADA` | Venció el plazo de pago sin un pago aprobado (ver ADR-04). | Final |

* **Por qué no existe `INICIADA` como estado persistido:** la compra no "se crea validada" en el sentido de saltear validaciones; al contrario, **las validaciones son la condición para que la compra exista**. El visitante completa el formulario en el frontend (eso es la etapa "iniciada" del diagrama BCE: `opcComprarEntradas()` → `solicitarDatosCompra()`), y envía todos los datos en un único request. El formato del request (incluido el medio de pago) se valida al recibirlo; el caso de uso valida usuario, fecha, día de apertura y límite por fecha, y el agregado valida cantidad y edades al construirse (orden completo en ADR-25). Todo eso ocurre **antes de persistir**. Si alguna regla falla, la operación se rechaza con un error y **no se persiste ninguna compra** (no tendría sentido guardar compras inválidas). Si todo es válido, la compra nace directamente en `PENDIENTE_PAGO` (tarjeta) o en `CONFIRMADA_PAGO_EN_BOLETERIA` (efectivo). Un estado `INICIADA` persistido solo tendría sentido en un flujo de varios pasos con borrador guardado en servidor, que la User Story no pide.
* **Por qué no existe `CANCELADA`:** las cancelaciones están explícitamente fuera del alcance (`ESPECIFICACION_USER_STORY.md`, sección 3).
* **Consecuencias:** El DTE, el DER, el diagrama de clases y los enums del código usan exactamente estos cinco valores.

### ADR-04 — Expiración de compras pendientes de pago
* **Estado:** Aceptado.
* **Contexto:** La User Story no lo pide explícitamente, pero un sistema real no puede esperar indefinidamente a que el visitante pague. Una compra en `PENDIENTE_PAGO` sin resolución queda "colgada" para siempre.
* **Decisión:**
  1. Toda compra con tarjeta tiene un **vencimiento** `expiresAt = createdAt + PURCHASE_PAYMENT_TIMEOUT_MINUTES` (valor por defecto: 15 minutos, configurable).
  2. La preferencia de Mercado Pago se crea con el **mismo vencimiento** (`expires: true`, `expiration_date_to`), de modo que el visitante no puede pagar una preferencia vencida.
  3. Un proceso programado (`@nestjs/schedule`) busca compras `PENDIENTE_PAGO` vencidas. **Antes de expirar, consulta a Mercado Pago** si existe un pago para esa compra (reconciliación, ver ADR-06): si está aprobado la confirma, si está rechazado la rechaza, y si no hay pago la marca `EXPIRADA`.
  4. Una compra con un pago `in_process` (revisión manual de Mercado Pago) no se expira mientras ese pago siga en revisión.
* **Alternativas descartadas:** No expirar (deja datos inconsistentes); expirar sin consultar a Mercado Pago (podría expirar una compra que sí se pagó segundos antes).
* **Consecuencias:** Se agrega la columna `expires_at` y el estado `EXPIRADA`. La lógica de "¿está vencida?" vive en el dominio y se prueba con un `Clock` falso (ADR-12).

### ADR-05 — Integración con Mercado Pago lo más cercana posible a producción
* **Estado:** Aceptado.
* **Contexto:** El equipo decidió no simular Mercado Pago en la demostración: se usa **Checkout Pro** real en modo de prueba (sandbox). En los tests unitarios se usan dobles de prueba (ADR-16).
* **Decisión:**
  1. **Preferencia:** al confirmar una compra con tarjeta se crea una preferencia con los ítems, `external_reference = purchaseId` (para correlacionar el pago con la compra), `notification_url` (webhook), `back_urls` y vencimiento.
  2. **Solo tarjetas:** la User Story ofrece dos medios: `EFECTIVO` (boletería) y `TARJETA` (Mercado Pago). Checkout Pro permite además pagos en efectivo por cupón (Rapipago, Pago Fácil), que quedan pendientes por días. Se excluyen con `payment_methods.excluded_payment_types` para que `TARJETA` signifique exactamente tarjeta.
  3. **Webhook:** Mercado Pago notifica **solo el identificador del pago**, no su estado. El backend valida la firma (`x-signature`, ver "Firma HMAC" en el glosario; obligatoria porque el endpoint es público, ADR-06), consulta el pago a la API (`GET /v1/payments/{id}`), obtiene `status` y `external_reference`, y actualiza la compra.
  4. **Idempotencia:** Mercado Pago reintenta las notificaciones (cada 15 minutos si no recibe respuesta 200/201 a tiempo). Procesar dos veces la misma notificación no debe duplicar el email ni romper el estado: si la compra ya está en un estado final, la notificación se ignora y se responde 200.
  5. **Reconciliación:** además del webhook, cuando el navegador vuelve de Mercado Pago (`back_urls`, con `payment_id` en la URL) el backend consulta el estado del pago. Lo mismo hace el proceso de expiración (ADR-04). Así, si un webhook no llega, el sistema igual se entera.
* **Sobre los webhooks en modo de prueba (verificado en la documentación vigente al 13/10/2026):** los pagos de prueba **sí envían notificaciones reales** a una URL pública. La guía de compras de prueba indica: *"Si has configurado notificaciones, verifica que estás recibiendo las notificaciones correspondientes a la transacción de prueba"*, y la guía de webhooks indica que una *"URL de prueba que, junto con las credenciales de prueba,"* permite verificar las notificaciones *"previo a salir a producción"*. Una versión anterior de la documentación afirmaba lo contrario; ya no aplica. Condiciones:
  1. URL pública HTTPS (túnel, ADR-06); nunca `localhost`.
  2. URL registrada en *Tus integraciones > Webhooks > Modo pruebas*, con el evento `payment` marcado. Allí también se obtiene la **clave secreta** para validar `x-signature`.
  3. La preferencia se crea con las **credenciales de prueba**, y el pago lo realiza una **cuenta de prueba compradora** (distinta de la vendedora) con una **tarjeta de prueba**, en una ventana de incógnito.
  4. La `notification_url` definida en la preferencia tiene prioridad sobre la configurada en el panel.
  
  El **simulador** del panel es opcional: sirve para probar que el endpoint responde `200` antes de hacer un pago completo. La reconciliación se mantiene igual, porque en producción los webhooks también pueden retrasarse o perderse.
* **Validación de la firma con el SDK oficial:** el SDK `mercadopago` 3.6.x incluye `WebhookSignatureValidator` (verificado en su código fuente). Se usa ese validador en lugar de implementar el HMAC a mano:
  * Construye el manifiesto `id:{data.id};request-id:{x-request-id};ts:{ts};`, omitiendo los pares sin valor, y calcula HMAC SHA256 con la clave secreta.
  * **`data.id` se toma del query string** de la notificación (`?data.id=...&type=payment`), no del cuerpo JSON.
  * Compara en tiempo constante (`timingSafeEqual`) para evitar ataques de temporización.
  * Se configura `toleranceSeconds: 300` para rechazar notificaciones viejas reenviadas (*replay*). El validador acepta un reloj inyectable (`now`), lo que permite probarlo en TDD con `FixedClock`.
  * Mercado Pago responde a la notificación esperando `200` o `201` en menos de **22 segundos**; si no, reintenta cada 15 minutos. Por eso el endpoint responde rápido y nunca bloquea esperando el envío del correo.
* **Pregunta abierta del spike (la documentación no la responde):** si las notificaciones originadas por la `notification_url` de la preferencia llevan `x-signature` igual que las configuradas en el panel. Decisión según el resultado:
  * **Si la llevan:** se envía `notification_url = ${PUBLIC_API_URL}/api/webhooks/mercadopago` en cada preferencia. Ventaja: acompaña automáticamente la URL del túnel, que cambia en cada ejecución.
  * **Si no la llevan:** no se envía `notification_url` y se usa solo la URL configurada en el panel, que sí está firmada. Para no reconfigurar el panel en cada ejecución, se usa un túnel con **dominio estable** (el plan gratuito de `ngrok` ofrece uno) en lugar del túnel rápido de `cloudflared`.
  * Nunca se acepta una notificación sin firma válida (RC-06).
* **Alternativas descartadas:** Simular el pago con un endpoint propio (no representa producción); depender solo del webhook (frágil); depender solo del retorno del navegador (el visitante puede cerrar la pestaña antes de volver).
* **Consecuencias:** `PaymentGatewayPort` expone tres operaciones: `createPreference(purchase)`, `getPayment(paymentId)` (webhook y retorno del navegador) y `findPaymentByReference(purchaseId)` (reconciliación previa a la expiración, ADR-04).

### ADR-06 — Túnel público para recibir webhooks y retornos en desarrollo
* **Estado:** Aceptado.
* **Contexto:** Mercado Pago está en internet y el backend corre en `localhost`, que solo existe dentro de la computadora del desarrollador. Mercado Pago no puede enviar un webhook a `localhost`, y su documentación indica explícitamente que **no se deben usar `localhost` ni `127.0.0.1` en `back_urls`**.
* **Decisión:** Usar un **túnel** con `cloudflared` (*Cloudflare Tunnel*, gratuito y sin cuenta para túneles rápidos): `cloudflared tunnel --url http://localhost:3000` genera una URL pública HTTPS (por ejemplo `https://xxxx.trycloudflare.com`) que reenvía las peticiones al backend local. Esa URL se configura en la variable `PUBLIC_API_URL`.
  * `notification_url = ${PUBLIC_API_URL}/api/webhooks/mercadopago`
  * `back_urls.* = ${PUBLIC_API_URL}/api/payments/return`. El backend reconcilia el pago y **redirige** (HTTP 302) al frontend (`FRONTEND_URL`, que sí puede ser `http://localhost:5173` porque esa redirección la ejecuta el navegador del visitante). Así alcanza con un solo túnel.
* **Alternativas descartadas** (justificación verificada en la documentación oficial el 14/10/2026):
  * **`ngrok` (plan gratuito):** muestra una **página intermedia de advertencia** (*interstitial page*) en los endpoints HTTP, que el visitante vería al volver de Mercado Pago por las `back_urls`; además requiere una cuenta por integrante y tiene cuota mensual (20.000 requests y 1 GB). Su ventaja es un dominio de desarrollo asignado a la cuenta, que no cambia entre ejecuciones; por eso queda como alternativa si el spike de la ADR-05 obliga a usar la URL del panel de Mercado Pago.
  * **Cloudflare Tunnel con nombre:** da una URL estable, pero requiere un dominio propio administrado en Cloudflare.
  * **Exponer puertos del router:** inseguro.
* **Límites del túnel rápido aceptados:** sin garantía de disponibilidad (Cloudflare lo destina a *"testing and development"*) y hasta 200 requests simultáneos por túnel, suficientes para una demostración.
* **Consecuencias:** La URL del túnel rápido cambia en cada ejecución; hay que actualizar `PUBLIC_API_URL` al iniciar la demo. La firma del webhook (ADR-05) es obligatoria porque el endpoint queda expuesto públicamente.

### ADR-07 — Un único código QR por compra, con código opaco
* **Estado:** Aceptado.
* **Contexto:** Los docentes indicaron verbalmente que **se debe enviar un código QR tanto para el pago en efectivo como con tarjeta** (no figura explícitamente en el TP6). El TP2 indica que las entradas *"serán verificadas al momento de ingresar al parque"*.
* **Decisión:**
  1. **Un QR por compra**, no uno por entrada: el email muestra un único QR y el detalle de todas las entradas (tipo de pase y edad). Enviar diez QR al mismo correo no aporta valor y complica la verificación.
  2. El QR contiene **solo un código opaco y no adivinable** (`accessCode`, 128 bits aleatorios codificados en base64url), **nunca datos personales ni importes**. El QR funciona como una llave: el sistema busca la compra con ese código. Si el QR contuviera los datos, cualquiera que lo leyera los vería, y la información quedaría desactualizada si la compra cambiara de estado.
  3. **Efectivo:** el QR se envía al confirmar la reserva (`CONFIRMADA_PAGO_EN_BOLETERIA`); al escanearlo, el personal ve que el monto está pendiente de cobro.
  4. **Tarjeta:** el QR se envía recién cuando el pago queda aprobado (`CONFIRMADA`).
  5. **Formato en el email:** imagen PNG embebida como **adjunto inline con CID** (`<img src="cid:qr-code">`). Gmail bloquea las imágenes `data:` en base64 dentro del cuerpo del correo.
* **Alternativas descartadas:** Un QR por entrada (ruido para el visitante); QR con datos de la compra (privacidad, obsolescencia); imagen `data:` base64 (no se ve en Gmail).
* **Consecuencias:** `accessCode` es único en la tabla `purchases`. El escaneo y la validación en el ingreso quedan fuera del alcance de esta User Story.

### ADR-08 — Autenticación: solo usuarios registrados, sin alta de usuarios
* **Estado:** Reemplazado por ADR-19.
* **Contexto:** El criterio de aceptación exige *"Se debe permitir la compra de entradas solo a usuarios registrados"*. La registración (*"debe registrarse en la aplicación, ingresando un mail y una contraseña"*, TP2) es otra User Story ("Registrar visitante") fuera de este incremento.
* **Decisión:** Los visitantes registrados se cargan como **datos semilla** (*seeds*) con contraseña hasheada (`bcrypt`). El endpoint `POST /api/auth/login` (email + contraseña) emite un **JWT**. El endpoint de compra exige el JWT; el identificador del usuario se toma **del token**, nunca del cuerpo del request (si viniera en el cuerpo, cualquiera podría comprar en nombre de otro).
* **Reglas:** sin token o con token inválido → `401`. Token válido de un usuario inexistente o inactivo → `401 USER_NOT_REGISTERED`. El caso de uso verifica el usuario contra `UserRepositoryPort` (regla CA-01 probada en TDD).
* **Alternativas descartadas:** Encabezado `X-User-Id` sin autenticación (no representa producción); implementar el alta de usuarios (otra User Story).
* **Consecuencias:** Se agregan `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt` y `bcrypt`.

### ADR-09 — El email no forma parte de la transacción de compra
* **Estado:** Aceptado.
* **Contexto:** La User Story exige *"Debe enviar un mensaje de confirmación vía mail"*. El servidor de correo es un sistema externo que puede fallar.
* **Decisión:** La compra se persiste primero y su resultado es definitivo. El envío del email es un **efecto secundario**: si falla, la compra **no se revierte**. Se aplica una versión simplificada del patrón **Outbox**: la compra registra el estado de su notificación (`notificationStatus`: `PENDING`, `SENT`, `FAILED`; es un dato técnico, por eso va en inglés), y un proceso programado reintenta los envíos fallidos.
* **Por qué:** revertir una compra pagada porque el correo falló sería peor para el visitante (pagó y no tiene entrada). La User Story se cumple garantizando la entrega con reintentos, no atándola a la transacción.
* **Consecuencias:** El caso de uso responde con éxito aunque el email falle; el test unitario lo verifica con un `EmailSenderPort` falso que lanza error.

### ADR-10 — Contrato de errores
* **Estado:** Reemplazado por ADR-25.
* **Decisión:** Se separan dos familias de error:
  1. **Formato del request** (validación de DTO con `class-validator`): falta un campo, tipo incorrecto, valor fuera del enum, fecha mal formada. Responde `400 VALIDATION_ERROR` con **la lista completa** de errores.
  2. **Reglas de negocio** (dominio y caso de uso): el request está bien formado pero el negocio lo rechaza. Responde con un código propio y se **detiene en la primera regla violada**.
* **Orden de evaluación de reglas de negocio:** usuario registrado → fecha no pasada → día de apertura → cantidad de entradas → edades. Las tres primeras las verifica el caso de uso (dependen de puertos: usuarios, reloj y calendario); cantidad y edades son invariantes del agregado `Purchase` y se verifican al crearlo. Todas viven en el dominio o en la aplicación (no solo en el DTO) para que se prueben en TDD.
* La tabla completa de códigos y estados HTTP está en `specs/spec.md`.

### ADR-11 — Tarifas y calendario de apertura como datos semilla
* **Estado:** Reemplazado por ADR-20.
* **Contexto:** La especificación pide un tarifario configurable y un calendario de días de apertura. El foco de la User Story está en **aplicar correctamente** esas reglas, no en administrarlas.
* **Decisión:** Las tablas `rates` y `operating_days` se cargan con datos semilla (`REGULAR` $5.000, `VIP` $10.000; abierto lunes, miércoles, viernes, sábado y domingo). El dominio las consume a través de `RatesProviderPort` y `OperatingCalendarPort`. No hay ABM de tarifas ni de días.
* **Consecuencias:** Cambiar un precio o un día de apertura no requiere tocar código. El precio se copia en cada entrada al momento de la compra (`unitPrice`), así un cambio de tarifa posterior no altera compras ya realizadas.

### ADR-12 — Fecha de visita como fecha de calendario y zona horaria del parque
* **Estado:** Aceptado.
* **Contexto:** En JavaScript, `new Date("2026-10-13")` se interpreta como medianoche **UTC**; en Córdoba (UTC-3) eso es el día anterior a las 21:00, y `getDay()` devuelve el día de la semana equivocado. Un martes abierto podría verse como lunes cerrado, y viceversa.
* **Decisión:**
  1. La fecha de visita es un **value object** `VisitDate` (año, mes, día) sin hora; el día de la semana se calcula sobre la fecha de calendario, independiente de la zona horaria del servidor.
  2. "Hoy" se obtiene de un puerto `ClockPort` en la zona horaria del parque (`PARK_TIMEZONE=America/Argentina/Cordoba`).
  3. En los tests se inyecta un reloj fijo (`FixedClock`), lo que hace los tests deterministas.
* **Consecuencias:** Se agrega un test explícito: el servidor en UTC no debe aceptar un lunes. La ADR-23 extiende `ClockPort` con la hora actual del parque.

### ADR-13 — Dinero en unidades enteras
* **Estado:** Aceptado.
* **Contexto:** Los números de punto flotante no representan exactamente valores decimales (`0.1 + 0.2 !== 0.3`), y TypeORM devuelve las columnas `decimal` como `string`.
* **Decisión:** Los importes se modelan con un value object `Money` que guarda **centavos como entero** (`5000 ARS = 500000 centavos`). En PostgreSQL se usan columnas `integer` (`*_cents`).
* **Consecuencias:** No hay errores de redondeo y las sumas son exactas. La conversión a pesos se hace solo al mostrar.

### ADR-14 — Cantidad de entradas y datos por visitante
* **Estado:** Reemplazado por ADR-22.
* **Decisión:** La cantidad de entradas es **la longitud de la lista de entradas** enviada, y cada entrada trae `passType` y `visitorAge`. Se exige entre 1 y 10 entradas inclusive y edad entera mayor o igual a 0. El límite máximo de 10 lo define la User Story; el mínimo de 1 y la edad no negativa son reglas de lógica elemental (una compra sin entradas o una edad negativa no tienen sentido).
* **Consecuencia:** No se pide nombre del titular (`holderName`) porque la User Story no lo requiere.

### ADR-15 — Correo electrónico con Mailpit
* **Estado:** Aceptado.
* **Decisión:** El único adaptador de correo real es `NodemailerEmailAdapter` apuntando a **Mailpit** (servidor SMTP local en Docker, interfaz web en `http://localhost:8025`). Se descarta Resend: su plan gratuito sin dominio verificado solo envía al email del dueño de la cuenta, y agrega una dependencia que no aporta a la evaluación.
* **Consecuencias:** Si en el futuro se necesitan correos reales, basta con apuntar el mismo adaptador SMTP a un proveedor real (variables `SMTP_*`), sin tocar el dominio.

### ADR-16 — Estrategia de pruebas y ubicación de los tests
* **Estado:** Aceptado.
* **Decisión:** Tres niveles, cada uno con su comando:

| Nivel | Carpeta y sufijo | Comando | Dependencias |
| :--- | :--- | :--- | :--- |
| Unitario (TDD) | `backend/test/unit/**/*.spec.ts` | `npm test` | Ninguna (dobles en memoria) |
| Integración | `backend/test/integration/**/*.int-spec.ts` | `npm run test:int` | PostgreSQL y Mailpit en Docker; HTTP de Mercado Pago grabado con `nock` |
| End-to-end | `backend/test/e2e/**/*.e2e-spec.ts` | `npm run test:e2e` | Aplicación Nest completa con `supertest` |

* **Dobles de prueba:** *fakes* en memoria para repositorios, *stubs* para la pasarela de pago y *spies* para el envío de correos.
* **Base de datos de tests:** base separada `ecoharmony_test`, creada automáticamente por el contenedor de PostgreSQL. El esquema se gestiona con **migraciones** de TypeORM (`synchronize: false`).
* **Cobertura:** el objetivo es cubrir el 100% de las reglas de negocio y criterios de aceptación, no un porcentaje de líneas.

### ADR-17 — Idioma del código y del lenguaje de negocio
* **Estado:** Aceptado.
* **Decisión:** Identificadores (clases, métodos, variables, archivos) en **inglés**. Los **valores del lenguaje de negocio** que aparecen en la User Story y en el contrato del API se mantienen en **español**, tal como los usa el cliente: `REGULAR`, `VIP`, `EFECTIVO`, `TARJETA` y los estados de la compra. Los códigos de error del API, en inglés. Documentación formal, en español neutro. El detalle está en `GUIA_DE_ESTILO.md`.

### ADR-18 — El FAQ del Product Owner como fuente de requerimientos
* **Estado:** Aceptado.
* **Contexto:** La cátedra publicó `FAQ_PO_TDD_EcoHarmony_Park.pdf` con las respuestas de los Product Owners a las dudas del dominio. Varias respuestas contradicen supuestos que el equipo había tomado en el Sprint 0 (días de apertura, precios, alcance del límite de 10 entradas y autenticación) y otras agregan reglas nuevas (descuentos por edad, horizonte de compra, corte horario, adjunto del correo y requisitos de la interfaz).
* **Decisión:**
  1. El FAQ es la **segunda fuente de verdad**, después del TP6 y antes de las indicaciones verbales y del TP2. Si un supuesto del equipo contradice al FAQ, prevalece el FAQ y el supuesto se corrige con un ADR que reemplaza al anterior.
  2. Solo se aplican las respuestas que corresponden a "Comprar entradas". La lista de preguntas aplicables está en `ESPECIFICACION_USER_STORY.md`, sección 1.3.
  3. Lo que el FAQ no precisa (por ejemplo, qué compras cuentan para el límite de 10 o cómo se interpreta "un mes") lo define el equipo y se marca como **precisión del equipo** en la especificación.
  4. **Mercado Pago (FAQ 4):** el PO admite una pantalla simulada, pero prefiere la integración desarrollada. Se mantiene la ADR-05. Una pasarela simulada solo se implementaría como plan de contingencia, detrás del mismo `PaymentGatewayPort`, sin tocar el dominio.
* **Consecuencias:** Se reemplazan las ADR-08, ADR-10, ADR-11 y ADR-14 y se agregan las ADR-19 a ADR-26. La ADR-27 (Resend) se agregó después, a pedido del equipo.

### ADR-19 — Sesión simulada con un visitante fijo
* **Estado:** Aceptado. Reemplaza a ADR-08.
* **Contexto:** El FAQ 19 indica que el registro y el login no forman parte de esta User Story: *"pueden comenzar con la sesión y el usuario mockeados"*. El criterio 9 del TP6 ("solo usuarios registrados") sigue vigente.
* **Decisión:**
  1. **Sin login:** no hay endpoint de autenticación, ni JWT, ni contraseñas.
  2. **Un único visitante fijo:** se carga como dato semilla (`visitante@ecoharmony.local`, activo, rol `VISITANTE`) con un identificador conocido. La variable `MOCK_SESSION_USER_ID` define qué usuario representa la sesión.
  3. **`MockSessionGuard`** (infraestructura HTTP) toma ese identificador y lo deja disponible para los controladores. Si la variable no está definida, responde `401 UNAUTHENTICATED`. El identificador nunca viaja en el cuerpo del request.
  4. **La regla de negocio no cambia:** el caso de uso verifica el usuario contra `UserRepositoryPort` y rechaza con `USER_NOT_REGISTERED` si no existe o está inactivo (CA-01, probado en TDD).
  5. El frontend muestra el nombre del visitante de la sesión simulada y no tiene pantalla de login.
* **Alternativas descartadas:** Mantener el login con JWT de la ADR-08 (agrega dependencias y tests fuera del foco de la User Story); varios usuarios simulados con selector (no aporta a ningún criterio).
* **Consecuencias:** Se quitan `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt` y `bcrypt`, y las variables `JWT_*`. Si en el futuro se implementa la User Story "Registrar visitante", basta con reemplazar `MockSessionGuard` por un guard real, sin tocar el caso de uso.

### ADR-20 — Tarifas, días de apertura y feriados como datos semilla
* **Estado:** Aceptado. Reemplaza a ADR-11.
* **Contexto:** El FAQ 1 define que el parque abre todos los días excepto los lunes, el 25 de diciembre y el 1 de enero, y el FAQ 6 fija los precios: VIP $20.000 y regular $10.000. Los supuestos anteriores (cerrado martes y jueves; $5.000 y $10.000) quedan sin efecto.
* **Decisión:**
  1. Tabla `rates`: `REGULAR` = 1.000.000 centavos ($10.000) y `VIP` = 2.000.000 centavos ($20.000).
  2. Tabla `operating_days`: abierto de martes a domingo; lunes cerrado.
  3. Tabla `closed_dates` (feriados recurrentes, por mes y día): 25/12 y 01/01. Se modela como recurrente porque el FAQ los define como fechas fijas de cada año.
  4. `OperatingCalendarPort.isOpenOn(visitDate)` recibe la **fecha completa**, no solo el día de la semana, y combina ambas tablas.
  5. No hay ABM de tarifas, días ni feriados.
* **Consecuencias:** Cambiar un precio, un día o un feriado no requiere tocar código. El precio de lista se copia en cada entrada al momento de la compra (`listPrice`), así un cambio de tarifa posterior no altera compras ya realizadas.

### ADR-21 — Descuentos por edad como regla del dominio
* **Estado:** Aceptado.
* **Contexto:** El FAQ 7 define: *"Menores o iguales a 3 años: No pagan. Menores o iguales a 15 años: 50% off. Mayores o iguales a 60 años: 50% off."* Es una regla de negocio central del cálculo del total, por lo que debe nacer de tests.
* **Decisión:**
  1. **`AgeDiscountPolicy`** (dominio puro) devuelve el porcentaje de descuento para una edad, evaluando las franjas en orden: `edad <= 3` → 100; `edad <= 15` → 50; `edad >= 60` → 50; resto → 0.
  2. El descuento se aplica sobre el precio del pase elegido, sea `REGULAR` o `VIP`.
  3. **`Ticket`** guarda `listPrice` (precio del pase), `discountPercent` y calcula `subtotal()`. `Purchase.total()` suma los subtotales.
  4. **`Money.applyDiscount(percent)`** calcula `cents * (100 - percent) / 100` en enteros. Con los precios vigentes el resultado siempre es exacto; si algún día no lo fuera, se redondea al centavo más cercano.
  5. Una entrada gratuita **se emite igual**, cuenta para los límites de cantidad y figura en el correo, porque el parque necesita registrar que ese visitante asiste.
  6. Las franjas son constantes del dominio, no datos semilla: cambiarlas es cambiar una regla de negocio y debe pasar por sus tests.
* **Alternativas descartadas:** Descuentos en una tabla configurable (agrega un ABM implícito que la User Story no pide); calcular el descuento en el frontend (duplica la regla fuera del dominio).
* **Consecuencias:** Valores límite obligatorios en la Test List: 0, 3, 4, 15, 16, 59 y 60 años.

### ADR-22 — Cantidad de entradas, límite por fecha y datos por visitante
* **Estado:** Aceptado. Reemplaza a ADR-14.
* **Contexto:** El FAQ 27 aclara que el límite de 10 no es por transacción: *"Solo puede comprar 10 entradas para una fecha específica, ya sea en una o varias transacciones."*
* **Decisión:**
  1. **Rango por compra (CA-02):** la cantidad es la longitud de la lista de entradas y debe estar entre 1 y 10. Es un invariante del agregado `Purchase`.
  2. **Límite por fecha (CA-11):** el caso de uso suma las entradas que el usuario ya tiene para esa fecha en compras `PENDIENTE_PAGO`, `CONFIRMADA` y `CONFIRMADA_PAGO_EN_BOLETERIA` (`PurchaseRepositoryPort.countActiveTickets(userId, visitDate)`). Si esas entradas más las pedidas superan 10, rechaza con `TICKET_LIMIT_PER_DATE_EXCEEDED`. Las compras `RECHAZADA` y `EXPIRADA` no cuentan.
  3. **Concurrencia:** dos compras simultáneas del mismo usuario para la misma fecha podrían pasar la verificación a la vez y superar el límite. Por eso la verificación y el guardado se ejecutan dentro de `PurchaseRepositoryPort.runExclusively(userId, visitDate, work)`. El adaptador de PostgreSQL abre una transacción y toma un **bloqueo consultivo** (`pg_advisory_xact_lock`) sobre la clave usuario + fecha; el doble en memoria ejecuta el trabajo directamente.
  4. **Datos por visitante:** cada entrada trae `passType` y `visitorAge` (entero mayor o igual a 0). No se pide el nombre del visitante, porque la User Story no lo requiere.
* **Alternativas descartadas:** Contar solo compras confirmadas (una compra pendiente de pago permitiría superar el límite mientras se paga); bloqueo optimista con reintentos (más complejo para el volumen de este sistema).
* **Consecuencias:** Una compra con tarjeta que expira libera sus entradas para el límite. El bloqueo se verifica con un test de integración que lanza dos compras concurrentes.

### ADR-23 — Ventana de compra: horizonte de un mes y corte de las 17:30
* **Estado:** Aceptado. Complementa a ADR-12.
* **Contexto:** El FAQ 25 limita la anticipación: *"Se pueden comprar las entradas con no más de un mes de anticipación."* El FAQ 26 limita las compras para el mismo día: *"Hasta 1 hora y media antes del cierre, es decir: hasta las 17:30"*. El parque abre de 8:30 a 19:00 (FAQ 11).
* **Decisión:**
  1. **`ClockPort`** expone `now()` (instante, para vencimientos) y `parkNow()` (fecha de calendario y hora en la zona del parque).
  2. **`BookingWindow`** (value object del dominio) se construye con `parkNow()` y concentra las reglas temporales:
     * Fecha no pasada (CA-03).
     * **Horizonte (CA-13):** la fecha de visita no puede ser posterior a `hoy + 1 mes`. Un mes es la misma fecha del mes siguiente; si no existe, el último día de ese mes (desde el 31/01, el límite es el 28/02).
     * **Corte del mismo día (CA-14):** si la fecha de visita es hoy, la hora actual del parque debe ser menor o igual a las 17:30. El corte se define como cierre del parque (19:00) menos 90 minutos.
  3. `BookingWindow` también enumera las fechas candidatas, que el endpoint de fechas disponibles filtra con el calendario de apertura (ADR-26). Así el backend y el calendario del frontend usan la misma regla.
* **Alternativas descartadas:** "Un mes" como 30 días fijos (no coincide con la forma en que una persona lee el calendario); validar el corte solo en el frontend (el backend es la autoridad).
* **Consecuencias:** Los tests usan `FixedClock` con fecha y hora; se agregan valores límite a las 17:30 y 17:31 y para fin de mes.

### ADR-24 — Correo con detalle completo y comprobante PDF adjunto
* **Estado:** Aceptado. Complementa a ADR-07 y ADR-15.
* **Contexto:** El FAQ 5 admite simular el correo con *"una interfaz parecida al visualizar un mail y que su cuerpo tenga datos representativos de la transacción. Con un archivo adjunto."* El FAQ 18 (de la otra User Story) sugiere como contenido el número de orden, el detalle de visitantes, el QR, los subtotales y el total.
* **Decisión:**
  1. **Interfaz de correo:** Mailpit (ADR-15) ya muestra los correos reales en una bandeja web, con cuerpo HTML y adjuntos. Cumple lo que pide el PO sin construir una pantalla simulada.
  2. **Cuerpo:** número de orden (`purchaseId`), fecha de visita, medio de pago y estado, una tabla con cada entrada (tipo de pase, edad, precio de lista, descuento y subtotal), el total y el QR inline (ADR-07).
  3. **Adjunto:** comprobante `comprobante-<purchaseId>.pdf` con los mismos datos y el QR, generado en memoria por `ReceiptGeneratorPort` (adaptador `PdfKitReceiptGenerator` con `pdfkit`; doble `FakeReceiptGenerator`).
  4. El aviso de pago rechazado no lleva QR ni comprobante.
* **Alternativas descartadas:** Adjuntar solo la imagen del QR (ya viaja inline y no aporta un documento de la transacción); un modal simulado en el frontend (el correo real en Mailpit es más representativo).
* **Consecuencias:** Se agrega la dependencia `pdfkit`. El test de integración del correo verifica en Mailpit el adjunto PDF además del QR inline.

### ADR-25 — Contrato de errores
* **Estado:** Aceptado. Reemplaza a ADR-10.
* **Decisión:** Se mantienen las dos familias de error de la ADR-10:
  1. **Formato del request** (validación de DTO con `class-validator`): falta un campo, tipo incorrecto, valor fuera del enum o fecha mal formada. Responde `400 VALIDATION_ERROR` con **la lista completa** de errores.
  2. **Reglas de negocio** (dominio y caso de uso): el request está bien formado pero el negocio lo rechaza. Responde con un código propio y se **detiene en la primera regla violada**.
* **Orden de evaluación de reglas de negocio:** usuario registrado → fecha no pasada → horizonte → corte del mismo día → día de apertura → cantidad por compra → edades → límite por fecha.
  * Las cuatro reglas de fecha las verifica el caso de uso con `BookingWindow` y `OperatingCalendarPort`.
  * Cantidad y edades son invariantes del agregado `Purchase` y se verifican al crearlo.
  * El límite por fecha va al final porque necesita la cantidad ya validada y una consulta al repositorio.
* La tabla completa de códigos y estados HTTP está en `specs/spec.md`.

### ADR-26 — Interfaz web responsive con la identidad visual del PO
* **Estado:** Aceptado.
* **Contexto:** El FAQ pide una app mobile, aceptando una web responsive (FAQ 24); fija la paleta y la tipografía (FAQ 3); pide que el calendario deshabilite los días cerrados (FAQ 2) y que el logo lo diseñe el equipo (FAQ 17).
* **Decisión:**
  1. **Mobile-first:** los estilos base se diseñan para pantallas de 360 px y se amplían con los *breakpoints* de Tailwind.
  2. **Paleta como tokens de Tailwind 4** (`@theme`): `forest` `#386641`, `leaf` `#6A994E`, `lime` `#A7C957`, `cream` `#F2E8CF` y `berry` `#BC4749`. Las combinaciones de texto y fondo deben cumplir contraste WCAG AA.
  3. **Tipografía Lato** autoalojada con `@fontsource/lato`, sin depender de un CDN durante la demostración.
  4. **Calendario con `react-day-picker`:** el input nativo de fecha no permite deshabilitar días arbitrarios. Las fechas habilitadas las entrega el backend (`GET /api/calendar/available-dates`), que aplica `BookingWindow` y el calendario de apertura; el frontend no duplica reglas.
  5. **Cotización previa:** los subtotales y el total se obtienen de `POST /api/purchases/quote`, que usa las mismas reglas de precio y descuento del dominio.
  6. **Logo:** lo diseña el equipo y se envía al PO para su validación antes de la demostración.
* **Consecuencias:** Se agregan `react-day-picker` y `@fontsource/lato` al frontend, y dos endpoints de solo lectura al backend.

### ADR-27 — Resend como destino opcional de correo real
* **Estado:** Aceptado. Complementa a ADR-15.
* **Contexto:** La ADR-15 dejó a Mailpit como único destino del correo mientras se armaba el entorno. Para la demostración, el pago se prueba contra el sandbox real de Mercado Pago (ADR-05); del mismo modo, conviene comprobar que el correo de confirmación llega a una bandeja real. Resend tiene un plan gratuito y acepta envíos por **SMTP** (host `smtp.resend.com`, puerto 465 con TLS implícito, usuario `resend` y la API key como contraseña).
* **Decisión:**
  1. **Dos destinos para el mismo adaptador:** `NodemailerEmailAdapter` envía por SMTP a Mailpit (tests y desarrollo) o a Resend (demostración con correo real). Se elige solo con las variables `SMTP_*`; no hay dependencia ni adaptador nuevo, y el dominio no cambia.
  2. **Mailpit sigue siendo el valor por defecto** y el único destino de los tests de integración. Los tests nunca envían correos reales.
  3. **Sin dominio propio:** Resend solo permite enviar desde su remitente de prueba (`onboarding@resend.dev`) y al email del dueño de la cuenta. Por eso el email del visitante de la sesión simulada se configura con `MOCK_SESSION_USER_EMAIL`: en la demostración se usa el email de la cuenta de Resend.
  4. La API key de Resend es un secreto: vive solo en el `.env`, nunca en el código ni en el repositorio.
* **Alternativas descartadas:** SDK `resend` (agrega una dependencia y un adaptador para lo mismo que ya hace SMTP); un dominio verificado (requiere un dominio propio, fuera del alcance del TP).
* **Consecuencias:** El adaptador lee `SMTP_SECURE`, `SMTP_USER` y `SMTP_PASS` además de `SMTP_HOST` y `SMTP_PORT`. La prueba manual PU-OF-01 verifica la recepción en Mailpit y, opcionalmente, en la bandeja real.

### ADR-28 — Convención de commits propia de TPG6-TDD
* **Estado:** Aceptado.
* **Contexto:** El Plan de Gestión de Configuración del grupo (TPG4) define el formato `<Legajo>_<Apellido>_<Descripción breve del cambio>` para los commits del repositorio, pensado para ítems de configuración documentales (trabajos prácticos, resúmenes, bibliografía). TPG6-TDD es, en cambio, un proyecto de software cuyo objeto de evaluación es el proceso TDD: el historial de Git es la evidencia más objetiva de que cada test se escribió y se vio fallar antes que el código que lo satisface.
* **Decisión:**
  1. Los commits que modifican `TPG6-TDD/` usan **Conventional Commits** (`test:`, `feat:`, `refactor:`, `docs:`, `chore:`, `build:`), según `GUIA_DE_ESTILO.md`, sección 8. El tipo va en inglés, porque es la palabra clave del estándar; la descripción va en español, igual que la documentación formal y el resto del historial del repositorio.
  2. **Un commit por fase del ciclo TDD:** `test:` en *Red*, `feat:` en *Green* y `refactor:` solo si hubo mejora de diseño.
  3. El resto del repositorio mantiene la convención del Plan de Gestión de Configuración.
* **Por qué:** el tipo de cada commit identifica la fase del ciclo y permite auditar el orden Red → Green → Refactor de cada ítem de la Test List directamente desde el historial; además es la convención estándar de la industria para proyectos de software, compatible con herramientas de *changelog* y revisión.
* **Alternativas descartadas:** Un commit por ciclo completo (pierde la evidencia de que el test falló primero); el formato del Plan de Gestión de Configuración (no expresa la fase del ciclo TDD).
* **Consecuencias:** La autoría de cada commit se sigue identificando con el usuario de Git de cada integrante. Cerca de 80 commits para la Test List completa.

---

## 2. Glosario de Conceptos Técnicos

| Concepto | Qué es | De dónde sale | Cómo se usa en este proyecto |
| :--- | :--- | :--- | :--- |
| **Puerto (Port)** | Interfaz que define lo que el dominio necesita del exterior. | Arquitectura Hexagonal (Alistair Cockburn). | `src/domain/ports/`: repositorios, pasarela de pago, correo, QR, reloj. |
| **Adaptador (Adapter)** | Implementación concreta de un puerto con una tecnología. | Arquitectura Hexagonal. | `src/infrastructure/adapters/`: TypeORM, Mercado Pago, Nodemailer, `qrcode`. |
| **Doble de prueba** | Objeto que reemplaza una dependencia real en un test (*fake*, *stub*, *spy*, *mock*). | Gerard Meszaros, *xUnit Test Patterns*. | `test/doubles/`: repositorios en memoria, pasarela falsa, correo espía. |
| **Data Mapper** | Patrón que separa los objetos de dominio de las tablas de la base de datos. | Martin Fowler, *Patterns of Enterprise Application Architecture*. | Entidades ORM en infraestructura y *mappers* hacia el dominio. |
| **Value Object** | Objeto definido por su valor, inmutable y sin identidad. | Domain-Driven Design (Eric Evans). | `Money`, `VisitDate`, `BookingWindow`. |
| **Preferencia (Preference)** | Orden de pago creada en Mercado Pago con ítems, importes y URLs. | API de Checkout Pro. | La crea `MercadoPagoAdapter`; su `init_point` es la URL de pago. |
| **`external_reference`** | Campo libre de la preferencia que Mercado Pago devuelve con cada pago. | API de Checkout Pro. | Contiene el `purchaseId` para correlacionar pago y compra. |
| **`back_urls`** | URLs a las que Mercado Pago redirige el navegador al terminar el pago. | API de Checkout Pro. | Apuntan a `/api/payments/return` por el túnel (ADR-06). |
| **Webhook** | Llamada HTTP que un sistema externo hace a nuestro servidor para avisar un evento. | Patrón de integración por eventos. | `POST /api/webhooks/mercadopago` recibe avisos de pagos. |
| **Firma HMAC (`x-signature`)** | Código que demuestra que el webhook lo envió Mercado Pago y no un tercero. Se calcula con HMAC SHA256 sobre `id:{data.id};request-id:{x-request-id};ts:{ts};` usando la clave secreta. | Documentación de webhooks de Mercado Pago. | Se valida antes de procesar cualquier notificación. |
| **Idempotencia** | Propiedad de una operación que produce el mismo resultado aunque se ejecute varias veces. | Diseño de sistemas distribuidos. | Webhooks duplicados no cambian el estado ni reenvían correos. |
| **Reconciliación** | Consultar activamente el estado real de un pago en lugar de esperar el aviso. | Práctica estándar de integraciones de pago. | Al volver el navegador y antes de expirar una compra. |
| **Túnel (Cloudflare Tunnel)** | Programa que crea una URL pública HTTPS que reenvía el tráfico a un puerto local. | `cloudflared` de Cloudflare. | Permite que Mercado Pago llegue al backend local (ADR-06). |
| **Outbox (simplificado)** | Registrar las notificaciones pendientes junto con el dato de negocio y enviarlas después, con reintentos. | Patrón *Transactional Outbox* (Chris Richardson). | `notificationStatus` de la compra y reintento programado (ADR-09). |
| **CID (Content-ID)** | Identificador de un adjunto que permite mostrarlo dentro del HTML del correo. | Estándar MIME (RFC 2392). | El QR se adjunta con `cid` y se muestra con `<img src="cid:qr-code">`. |
| **Sesión simulada (*mock session*)** | Sesión fija que representa a un usuario sin pasar por un login real. | FAQ 19 del PO. | `MockSessionGuard` toma el usuario de `MOCK_SESSION_USER_ID` (ADR-19). |
| **Bloqueo consultivo (*advisory lock*)** | Bloqueo de PostgreSQL sobre una clave elegida por la aplicación, liberado al terminar la transacción. | Documentación de PostgreSQL (`pg_advisory_xact_lock`). | Serializa las compras de un mismo usuario para una misma fecha (ADR-22). |
| **Cotización** | Cálculo de subtotales y total sin crear la compra. | Práctica estándar de comercio electrónico. | `POST /api/purchases/quote` (ADR-26). |
| **Seed (datos semilla)** | Datos iniciales cargados automáticamente en la base. | Práctica estándar de bases de datos. | Usuario de la sesión simulada, tarifas, días de apertura y feriados. |
| **Migración** | Script versionado que modifica el esquema de la base de datos. | TypeORM. | Crea las tablas; reemplaza a `synchronize`. |
| **Clock (reloj inyectable)** | Puerto que entrega la fecha actual, para poder fijarla en los tests. | Patrón de testabilidad de dependencias temporales. | `ClockPort` y `FixedClock` (ADR-12). |
| **Mailpit** | Servidor SMTP de pruebas que captura los correos y los muestra en una interfaz web. | Proyecto `axllent/mailpit`. | Contenedor Docker; los correos se ven en `http://localhost:8025`. |
| **Resend** | Servicio de envío de correos con plan gratuito y acceso por SMTP o API. | resend.com. | Destino opcional para que el correo de la demostración llegue a una bandeja real (ADR-27). |

---

## 3. Referencias
* Mercado Pago Developers — [Realizar compras de prueba](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/integration-test/test-purchases).
* Mercado Pago Developers — [Configurar URLs de retorno](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/configure-back-urls).
* Mercado Pago Developers — [Webhooks](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/notifications/webhooks).
* Nodemailer — [Attachments (CID embedded images)](https://nodemailer.com/message/attachments).
* Resend — [Send emails with SMTP](https://resend.com/docs/send-with-smtp).
* Cloudflare — [Quick Tunnels](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/).
* ngrok — [Pricing](https://ngrok.com/pricing).
* PostgreSQL — [Advisory Lock Functions](https://www.postgresql.org/docs/current/functions-admin.html#FUNCTIONS-ADVISORY-LOCKS).
* Product Owners de la cátedra — `Documentación/FAQ_PO_TDD_EcoHarmony_Park.pdf`.
* Kent Beck — *Test-Driven Development: By Example*.
* Martin Fowler — *Patterns of Enterprise Application Architecture*.
