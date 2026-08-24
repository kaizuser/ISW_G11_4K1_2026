<div align="center">
  
**Grupo 11 4K1**

_Gestión de Configuración del Software_

</div>

---

| Apellido y Nombre | Legajo |
| :--- | :---: |
| Peschiutta, Franco Agustín | 400831 |
| Pinelli, Franco Agustín | 401881 |
| Díaz Ahumada, Ignacio Daniel | 402212 |
| Villegas, Axel Rene | 403655 |
| Alvarez, Lucas David | 402650 |
| Leon, Laila Aylin | 403626 |
| Roch, Gaston | 75313 |
| Romero Justo, Milton Jesus | 68396 |
| Rosciszewski, Haziel | 407655 |
| Novello, Pedro | 75198 |
| Diaz, Emiliano | 95255 |
| Borghetti, Giuliana Agustina | 403741 |
| Chiesa, Thiago | 93310 |
| Allende, Tomas | 400738 |

---

## Organización del Repositorio

```text
ISW_G11_4K1_2026/
├── Bibliografía/
├── Informacion_Catedra/
│   └── Material_de_Apoyo/
│       ├── Guia_TrabajosPracticos/
│       ├── Presentaciones_Clases/
│       └── Templates/
├── Producciones_Propias/
│   ├── Anotaciones_Clase/
│   ├── Resúmenes/
│   └── Ejercicios_Resueltos/
├── README.md
└── Trabajos_Prácticos/
    ├── Trabajos_Investigacion_Grupales/
    │   └── TIG<NN>-<Nombre_TP>/
    └── Trabajos_Prácticos_Grupales/
        └── TPG<NN>-<Tema_Principal>-<Nombre_Actividad>/
```

---

## Ítems de Configuración

| Nombre del Ítem de Configuración | Regla de Nombrado | Ubicación dentro del Repositorio | Tipo de Ítem [Clase / Cátedra / Propia] |
|---|---|---|---|
| **Plan de Gestión de Configuración** | `GRUPO11_Plan_De_Gestion_De_Configuración.pdf` | `Trabajos_Prácticos/Trabajos_Prácticos_Grupales/TPG4-SCM-Herramientas_SCM/` | Producción Propia |
| **Guía de Trabajos Prácticos** | `GRUPO11_Guia_De_TP.pdf` | `Informacion_Catedra/Material_de_Apoyo/Guia_Trabajos_Practicos/` | Cátedra |
| **Presentaciones clase** | `GRUPO11_<NN>_<Nombre_Presentacion>.pdf/pptx` | `Informacion_Catedra/Material_de_Apoyo/Presentaciones_Clases/` | Cátedra |
| **Ejercicios Resueltos** | `GRUPO11_EJ_<NombreEjercicio>_<Apellido>_<NroParcial>.pdf/docx` | `Producciones_Propias/Ejercicios_Resueltos/` | Producción Propia |
| **Notas de clase** | `GRUPO11_Nota_Clase<YYYYMMDD><Apellido>.pdf/docx` | `Producciones_Propias/Anotaciones_Clases/` | Clase / Producción Propia |
| **Template** | `GRUPO11_<Nombre_Template>.pdf/docx` | `Informacion_Catedra/Material_de_Apoyo/Templates/` | Cátedra |
| **Resumen** | `GRUPO11_Resumen_Parcial<NN>_<Apellido>.pdf` | `Producciones_Propias/Resumenes/` | Producción Propia |
| **Programa Materia** | `GRUPO11_Planificación_ISW.pdf` | `Informacion_Catedra/` | Cátedra |
| **Trabajos Investigación Grupales** | `GRUPO11_Trabajo_Investigacion_Grupal_Nro_<NN>.pdf/docx` | `Trabajos_Prácticos/Trabajos_Investigación_Grupales/` | Producción Propia |
| **Trabajos Prácticos Grupales** | `GRUPO11_Trabajo_Practico_Grupal_Nro_<NN>.pdf/docx` | `Trabajos_Prácticos/Trabajos_Prácticos_Grupales/` | Producción Propia |
| **Cronograma** | `GRUPO11_Cronograma.pdf` | `Informacion_Catedra/` | Cátedra |
| **Libros Cátedra** | `GRUPO11_LC_<Libro_Autor>.pdf` | `Bibliografía/Libros/` | Cátedra |
| **Artefactos Trabajos Prácticos Grupales** | `GRUPO11_<NombreArtefacto>_<Nro_TP>.<Extensión>` | `Trabajos_Prácticos/Trabajos_Prácticos_Grupales/` | Producción Propia |

---

## Convenciones de Nombrado

| Sigla | Significado |
|---|---|
| `<NN>` | Número cardinal comenzando en 00. |
| `<YYYYMMDD>` | Fecha en formato numérico (Año-Mes-Día). |
| `<Apellido>` | Apellido del autor del ítem de configuración. |
| `<Nombre_presentacion>` | Nombre de la presentación con formato adaptado. |
| `<Nombre_Template>` | Nombre del template con formato adaptado. |
| `<Nombre_TP>` | Nombre del trabajo práctico de investigación con formato adaptado. |
| `<Tema_Principal>-<Nombre_Actividad>` | Nombre del trabajo práctico grupal con formato adaptado. |
| `<NombreEjercicio>` | Identificador del ejercicio. |
| `<NombreArtefacto>` | Nombre del artefacto asociado a un trabajo práctico. Ej: `Historia_De_Usuario` |
| `<Extensión>` | Nombre de la extensión de un artefacto. Ej: `py`/`pdf` |
| `<Libro_Autor>` | Nombre del libro/material de la cátedra y el apellido del o los autores. |
| `<Nro_TP>` | Número cardinal asociado al trabajo práctico al que hace referencia. |

---

## Criterios de Línea Base y Versionado

Como equipo definimos que la **Línea Base** se establece luego de la corrección de:

2 (dos) Trabajos Practicos Grupales.

1 (un) Trabajo de Investigación Grupal.

1 (un) Parcial.

Para mantener la trazabilidad de los hitos académicos, cada Línea Base se marcará mediante un **Tag de Git** en el repositorio utilizando una nomenclatura de versionado simplificado orientada a entregas.

**Mecánica de Incremento:**
Se incrementa de forma entera con cada Trabajo Práctico (TPG o TIG) evaluable entregado. El valor `1` corresponde al estado inicial de planificación del repositorio (antes de cualquier entrega evaluable).

---

**CONVENCIÓN DE MENSAJES DE COMMIT**

Con el propósito de asegurar la consistencia entre contribuciones y garantizar la trazabilidad de la autoría, todo mensaje de commit deberá estructurarse de acuerdo con la siguiente guía de formato:

`<Legajo>_<Apellido>_<Descripción breve del cambio>`
