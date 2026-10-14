# Trabajo Práctico Evaluable N° 6: Test-Driven Development (TDD)
**Universidad Tecnológica Nacional – Facultad Regional Córdoba**  
**Cátedra:** Ingeniería y Calidad de Software (2026)  
**Curso:** 4K1  
**Grupo:** 11  
**User Story Asignada:** *Comprar Entradas* (8 Story Points - Grupo Impar)  
**Dominio de Aplicación:** EcoHarmony Park (Trabajo Práctico N° 2)

---

## 1. Contexto y Propósito

El trabajo aplica **Desarrollo Guiado por Pruebas (TDD)** para diseñar, construir y asegurar la calidad de la User Story **"Comprar Entradas"**. Cada regla de negocio, criterio de aceptación y caso de error se cubre con pruebas automatizadas escritas **antes** del código de producción, siguiendo el ciclo **Red-Green-Refactor**.

> **COMO** visitante **QUIERO** comprar una entrada **PARA** asegurar mi visita al parque.  
> — Definición oficial: `Documentación/TP6.pdf`

Los criterios de aceptación, las respuestas del Product Owner (`Documentación/FAQ_PO_TDD_EcoHarmony_Park.pdf`), los supuestos y las pruebas de usuario están en [`Documentación/ESPECIFICACION_USER_STORY.md`](Documentación/ESPECIFICACION_USER_STORY.md).

---

## 2. Mapa de Documentación

| Documento | Contenido |
| :--- | :--- |
| [`Documentación/ESPECIFICACION_USER_STORY.md`](Documentación/ESPECIFICACION_USER_STORY.md) | User Story oficial, supuestos, alcance, criterios (CA, RC) y pruebas de usuario (PU). |
| [`Documentación/DISENO_TECNICO_Y_ARQUITECTURA.md`](Documentación/DISENO_TECNICO_Y_ARQUITECTURA.md) | Stack y versiones, estados (DTE), DER, clases, puertos, secuencias BCE y estrategia de pruebas. |
| [`Documentación/DECISIONES_DE_DISENO.md`](Documentación/DECISIONES_DE_DISENO.md) | Justificación de cada decisión de diseño (ADR) y glosario técnico. |
| [`Documentación/GUIA_DE_ESTILO.md`](Documentación/GUIA_DE_ESTILO.md) | Guía de estilo de código del grupo. |
| [`specs/spec.md`](specs/spec.md) | Contrato del API, contrato de errores y escenarios ejecutables. |
| [`specs/plan.md`](specs/plan.md) | Fases de implementación y disciplina TDD. |
| [`specs/tasks.md`](specs/tasks.md) | Test List, matriz de trazabilidad y tareas. |
| [`AGENTS.md`](AGENTS.md) | Reglas operativas para agentes de IA y desarrolladores. |

---

## 3. Estructura del Proyecto

```text
TPG6-TDD/
├── Documentación/             # Enunciados (TP2, TP6), FAQ del PO, especificación, diseño, decisiones y guía de estilo
├── specs/                     # Especificación técnica, plan y Test List (SDD)
├── backend/                   # API NestJS + TypeScript + TypeORM + Jest
│   ├── src/                   # domain/, application/, infrastructure/
│   └── test/                  # unit/, integration/, e2e/, doubles/, builders/
├── frontend/                  # React + Vite + Tailwind CSS
├── docker/postgres/init/      # Creación de la base de datos de tests
├── docker-compose.yml         # PostgreSQL 18 y Mailpit
├── .env.example               # Plantilla de variables de entorno
├── AGENTS.md
└── README.md
```

---

## 4. Stack Tecnológico (Costo $0)

* **Backend:** NestJS 12 sobre Node.js 24 y TypeScript 6.
* **Base de datos:** PostgreSQL 18 con TypeORM (patrón Data Mapper y migraciones).
* **Testing:** Jest, Supertest y Nock.
* **Pagos:** SDK oficial de Mercado Pago (Checkout Pro) en modo de prueba.
* **QR y comprobante:** `qrcode` y `pdfkit`, generados en memoria; el QR va inline y el comprobante PDF como adjunto del correo.
* **Correo:** Nodemailer + Mailpit (servidor SMTP local con interfaz web); opcionalmente Resend (plan gratuito, por SMTP) para recibir el correo en una bandeja real.
* **Sesión:** visitante fijo simulado, sin login (FAQ 19 del PO).
* **Frontend:** React 19 + Vite 8 + Tailwind CSS 4, web responsive *mobile-first* con la paleta del PO y tipografía Lato.

Versiones exactas y justificación: [`Documentación/DISENO_TECNICO_Y_ARQUITECTURA.md`](Documentación/DISENO_TECNICO_Y_ARQUITECTURA.md), sección 1.1.

---

## 5. Guía de Ejecución

### Prerrequisitos
* [Node.js](https://nodejs.org/) 24 LTS.
* [Docker Desktop](https://www.docker.com/) en ejecución.
* Archivo `.env` en la raíz de `TPG6-TDD/`, creado a partir de `.env.example`.

### Paso 1: Levantar la infraestructura (desde la raíz de `TPG6-TDD/`)
```bash
docker compose up -d
```
* **PostgreSQL:** `localhost:5440` (bases `ecoharmony_db` y `ecoharmony_test`). Se usa el puerto 5440 y no el 5432 habitual para no chocar con un PostgreSQL instalado localmente.
* **Mailpit:** `http://localhost:8025` (bandeja de entrada de los correos generados).

### Paso 2: Ejecutar las pruebas (desde `backend/`)
```bash
cd backend
npm install
npm test              # Unitarias (TDD), sin dependencias externas
npm run test:int      # Integración (requiere el Paso 1)
npm run test:e2e      # End-to-end de la API
npm run test:cov      # Reporte de cobertura
```

### Paso 3: Iniciar el backend
```bash
npm run start:dev     # http://localhost:3000
```

### Paso 4: Iniciar el frontend (desde `frontend/`)
```bash
cd ../frontend
npm install
npm run dev           # http://localhost:5173
```

### Paso 5 (opcional): Pago real con el sandbox de Mercado Pago
Requiere un túnel público para que Mercado Pago alcance el backend local (ver ADR-06 en `DECISIONES_DE_DISENO.md`):
```bash
cloudflared tunnel --url http://localhost:3000
```
Copiar la URL `https://*.trycloudflare.com` en `PUBLIC_API_URL` del `.env` y reiniciar el backend. Las tarjetas de prueba están en `DISENO_TECNICO_Y_ARQUITECTURA.md`, sección 1.4.

### Paso 6 (opcional): Correo real con Resend
En el `.env`, reemplazar el bloque de Mailpit por el bloque comentado de Resend (API key en `SMTP_PASS`) y poner en `MOCK_SESSION_USER_EMAIL` el email de la cuenta de Resend. Reiniciar el backend. Detalle en ADR-27 (`DECISIONES_DE_DISENO.md`) y en la sección 1.6 del diseño técnico.
