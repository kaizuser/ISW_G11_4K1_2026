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
│   └── Libros/
├── Informacion_Catedra/
│   └── Material_de_Apoyo/
│       ├── Guia_Trabajos_Practicos/
│       ├── Presentaciones_Clases/
│       └── Templates/
├── Producciones_Propias/
│   ├── Anotaciones_Clases/
│   ├── Ejercicios_Resueltos/
│   └── Resumenes/
├── README.md
└── Trabajos_Prácticos/
    ├── Trabajos_Investigación_Grupales/
    │   ├── TIG1-Expo_Investigacion_Despliegue/
    │   └── TIG2-Poster_Cientifico_FW_Lean-Agil_Desarrollo/
    └── Trabajos_Prácticos_Grupales/
        ├── TPG4-SCM-Herramientas_SCM/
        ├── TPG5-SCM-Uso_Repositorio/
        ├── TPG6-TDD/
        ├── TPG7-SCRUM-Ejercicio_Aplicacion/
        ├── TPG10-KANBAN-Ejercicio_Aplicacion/
        ├── TPG11-SCRUM-Dinamica_Retrospectiva/
        ├── TPG12-DESIGN_THINKING-Publicidad_IG/
        └── TPG13-SCRUM-Planificacion_Release_Sprint/
```

---

## Ítems de Configuración

| Ítems de configuración | Formato del Nombre (SCI) | Ubicación en el Repositorio |
|---|---|---|
| **Material Bibliográfico** | `BIB_LIBRO_<Nombre_Autor>.<ext>` | `Bibliografía/Libros/` |
| **Guía de Trabajos Prácticos** | `IC_GUIA_TP<N>_<Tema>.pdf` | `Informacion_Catedra/Material_de_Apoyo/Guia_Trabajos_Practicos/` |
| **Presentación de Clase** | `IC_PRES_C<N>_<Tema>.pdf` | `Informacion_Catedra/Material_de_Apoyo/Presentaciones_Clases/` |
| **Template / Plantilla** | `IC_TEMP_<Nombre_Plantilla>.<ext>` | `Informacion_Catedra/Material_de_Apoyo/Templates/` |
| **Anotación de Clase** | `PP_ANOT_C<N>_<Tema>.<ext>` | `Producciones_Propias/Anotaciones_Clases/` |
| **Ejercicio Resuelto** | `PP_EJ_<Tema>_<Autor>.<ext>` | `Producciones_Propias/Ejercicios_Resueltos/` |
| **Resumen Teórico** | `PP_RES_<Tema>_<Autor>.pdf` | `Producciones_Propias/Resumenes/` |
| **Artefacto de TPG**| `TPG<N>_ART_<Nombre>.<ext>` | `Trabajos_Prácticos/Trabajos_Prácticos_Grupales/TPG<N>-<Tema>/` |
| **Resolución Final de TPG** | `TPG<N>_RESOLUCION_<Tema>.<ext>` | `Trabajos_Prácticos/Trabajos_Prácticos_Grupales/TPG<N>-<Tema>/` |
| **Documentos de TGI**| `TIG<N>_ART_<Nombre>.<ext>` | `Trabajos_Prácticos/Trabajos_Investigación_Grupales/TIG<N>-<Tema>/` |
| **Entregable Final de TIG** | `TIG<N>_ENTREGABLE_<Tema>.<ext>` | `Trabajos_Prácticos/Trabajos_Investigación_Grupales/TIG<N>-<Tema>/` |

---

## Glosario

| Abreviatura | Significado |
|---|---|
| `BIB` | Bibliografía |
| `IC` | Información de Cátedra |
| `PP` | Producción Propia |
| `TP` | Trabajo Práctico (Genérico) |
| `TPG` | Trabajo Práctico Grupal |
| `TIG` | Trabajo de Investigación Grupal |
| `C` | Clase Teórica / Práctica |
| `ART` | Artefacto (Componente parcial de un trabajo) |
| `RES` | Resumen |
| `TEMP` | Template / Plantilla base |
| `ANOT` | Anotación |
| `EJ` | Ejercicio |
| `N` | Número secuencial identificador |

---

## Criterios de Línea Base y Versionado

Como equipo definimos que la **Línea Base** se establece luego de la entrega de cada trabajo práctico evaluable en cada instancia y, si corresponde, luego de su correspondiente corrección por parte de la cátedra.

Para mantener la trazabilidad de los hitos académicos, cada Línea Base se marcará mediante un **Tag de Git** en el repositorio utilizando una nomenclatura de versionado simplificado orientada a entregas: `v[MAJOR].[MINOR]`.

**Mecánica de Incremento:**
*   **MAJOR:** Se incrementa de forma entera con cada Trabajo Práctico (TPG o TIG) evaluable entregado. El valor `1` corresponde al estado inicial de planificación del repositorio (antes de cualquier entrega evaluable).
*   **MINOR:** Se incrementa exclusivamente con las correcciones, ajustes menores o *feedback* implementado sobre una versión mayor ya entregada/estable. Al incrementar el MAJOR, el MINOR se reinicia a `0`.

**Ejemplo de flujo del ciclo de vida:**
1.  `v1.0` → Repositorio inicial configurado.
2.  `v2.0` → Entrega oficial del Trabajo Práctico Grupal 4.
3.  `v2.1` → Correcciones aplicadas al TPG4 tras la revisión del profesor.
4.  `v3.0` → Entrega oficial del Trabajo Práctico Grupal 5.