# AGENTS.md — Guía Operativa para Agentes y Desarrolladores (TP6 - TDD)
> **Cátedra:** Ingeniería y Calidad de Software (UTN - FRC) — Ciclo 2026, Curso 4K1, Grupo 11  
> **Proyecto:** EcoHarmony Park — User Story "Comprar Entradas" (8 Story Points)

---

## 1. Propósito

Este archivo es la **constitución operativa** para cualquier agente de IA o persona que trabaje en esta carpeta. Define las reglas no negociables y dónde está cada fuente de verdad. No repite requerimientos: los referencia.

### Lectura obligatoria antes de proponer o escribir código (en este orden)
1. [Especificación de la User Story](Documentación/ESPECIFICACION_USER_STORY.md) — respuestas del PO que aplican, criterios CA, reglas RC y pruebas PU.
2. [Especificación técnica ejecutable](specs/spec.md) — contrato del API, errores y escenarios E-*.
3. [Test List y trazabilidad](specs/tasks.md) — qué test sigue y qué cubre.
4. [Plan de implementación](specs/plan.md) — fases y gates.
5. [Diseño técnico y arquitectura](Documentación/DISENO_TECNICO_Y_ARQUITECTURA.md) — estados, DER, clases, puertos y secuencias.
6. [Decisiones de diseño](Documentación/DECISIONES_DE_DISENO.md) — por qué se hizo cada cosa (ADR).
7. [Guía de estilo](Documentación/GUIA_DE_ESTILO.md) — nombres, estructura y estilo de tests.

La definición oficial de la User Story es la de `Documentación/TP6.pdf`. Las respuestas del Product Owner están en `Documentación/FAQ_PO_TDD_EcoHarmony_Park.pdf` (solo aplican las preguntas de "Comprar entradas", ver la sección 1.3 de la especificación). `Documentación/TP2.pdf` aporta el contexto del dominio. Orden de prioridad: TP6 → FAQ del PO → indicaciones docentes → TP2 → documentos del equipo. Si un documento contradice a una fuente de mayor prioridad, prevalece esa fuente y se corrige el documento con un ADR (ADR-18).

---

## 2. Reglas No Negociables

1. **TDD estricto (Red → Green → Refactor):**
   * Prohibido escribir código de producción sin un test que falle primero por la razón esperada.
   * Un test por vez, en el orden de la Test List (`specs/tasks.md`).
   * Dominio y casos de uso se prueban en memoria, sin Docker, base de datos ni red.
2. **Arquitectura:** `infrastructure → application → domain`. Nada de NestJS, TypeORM ni librerías externas en `src/domain/` (ADR-01).
3. **Costo cero:** PostgreSQL y Mailpit en Docker, sandbox de Mercado Pago, túnel `cloudflared` gratuito y, opcionalmente, plan gratuito de Resend para el correo real de la demo (ADR-27).
4. **Git:**
   * Rama de trabajo: `feature/TP6-TDD-ComprarEntradas`. Trabajo **solo local**.
   * **No hacer `git push`** ni operaciones remotas sin validación explícita del usuario.
   * **Un commit por fase del ciclo TDD** (`test:`, `feat:` y `refactor:` si hubo refactor), según `Documentación/GUIA_DE_ESTILO.md`, sección 8.
   * Mensajes en *Conventional Commits* (tipo en inglés y descripción en español, por ejemplo `feat: implementa suma de Money en centavos enteros`), sin atribuciones automáticas de IA. Esta convención aplica a `TPG6-TDD/` y reemplaza, solo para esta carpeta, el formato `<Legajo>_<Apellido>_<Descripción>` del resto del repositorio (ADR-28).
5. **Secretos:** los archivos `.env*` no se leen ni se versionan desde herramientas de IA. Las variables requeridas están en `Documentación/DISENO_TECNICO_Y_ARQUITECTURA.md`, sección 1.6.
6. **Idiomas:**
   * Código, identificadores y tests: inglés. Valores de negocio (`REGULAR`, `VIP`, `EFECTIVO`, `TARJETA`, estados de compra): español (ADR-17).
   * Documentación formal: español neutro.
   * Conversación con el usuario: español rioplatense con voseo.
7. **Sin requisitos inventados:** si algo no está en la especificación, se pregunta antes de implementarlo y la decisión se registra como ADR.

---

## 3. Mapeo Arquitectónico (Hexagonal + BCE)

| Capa | Rol BCE | Ubicación | Responsabilidad |
| :--- | :--- | :--- | :--- |
| Dominio | Entity | `backend/src/domain/` | Entidades, value objects, enums, errores y puertos. Reglas de negocio puras. |
| Aplicación | Control | `backend/src/application/use-cases/` | Casos de uso: orquestan el flujo usando puertos. |
| Infraestructura | Boundary (externo) | `backend/src/infrastructure/adapters/`, `persistence/` | Adaptadores de PostgreSQL, Mercado Pago, correo, QR y reloj. |
| Entrega HTTP | Boundary (API) | `backend/src/infrastructure/http/` | Controladores REST, DTOs, guards y filtro de errores. |
| Frontend | Boundary (UI) | `frontend/src/` | Web responsive *mobile-first*: sesión simulada, formulario de compra con calendario de fechas disponibles y cotización, redirección a Mercado Pago y resultado. |

---

## 4. Comandos

### Infraestructura (desde la raíz de `TPG6-TDD/`)
```bash
docker compose up -d        # PostgreSQL 18 (bases ecoharmony_db y ecoharmony_test) y Mailpit
docker compose ps           # Estado y salud de los contenedores
docker compose down         # Detener (agregar -v borra los datos)
```

### Backend (`backend/`)
```bash
npm test                    # Tests unitarios (TDD), sin dependencias externas
npm run test:watch          # Modo observador durante el ciclo TDD
npm run test:int            # Tests de integración (requiere Docker)
npm run test:e2e            # Tests end-to-end de la API
npm run test:cov            # Cobertura de los tests unitarios
npm run lint                # ESLint
npm run typecheck           # Tipos de código y tests
npm run build               # Compilación TypeScript
npm run start:dev           # API en http://localhost:3000
```

### Frontend (`frontend/`)
```bash
npm run dev                 # http://localhost:5173
npm run build               # Verificación de tipos y build
npm run lint                # Oxlint
```

### Túnel para Mercado Pago (solo para la prueba con sandbox real)
```bash
cloudflared tunnel --url http://localhost:3000   # copiar la URL https://*.trycloudflare.com en PUBLIC_API_URL
```

---

## 5. Definición de Terminado (por ítem de la Test List)
- [ ] El test se vio fallar antes de implementar.
- [ ] El test pasa y toda la suite sigue en verde.
- [ ] Se refactorizó con la suite en verde.
- [ ] `npm run lint`, `npm run typecheck` y `npm run build` sin errores.
- [ ] El ítem quedó marcado como ✅ en `specs/tasks.md`.
