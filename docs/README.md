# ConveyorQuote — documentación del proyecto

Esta carpeta contiene la especificación funcional y técnica que guía el desarrollo. Distingue entre decisiones aprobadas, propuestas pendientes y datos técnicos todavía no proporcionados.

## Índice
- [Estándar de modelos de ingeniería](engineering/engineering-model-standard.md)
- [Modelo de cotizaciones y ciclo de vida](architecture/quotation-domain-model.md)
- [Estándar de materiales, procesos y costos](costing/cost-catalog-standard.md)

## Reglas
1. Ninguna dimensión, fórmula, material, tolerancia, tiempo, precio o capacidad se considera aprobado sin fuente y validación.
2. Cada familia de conveyor tiene su propio modelo; el motor general ejecuta los modelos y normaliza resultados.
3. Captura comercial, parámetros internos, costos y cotización emitida son conceptos distintos.
4. Esta documentación describe el diseño objetivo; no implica que todas las funciones estén implementadas.
5. Las decisiones deben rastrearse a fuente, responsable, versión y estado.

## Estado
Documentación inicial. El primer modelo será el Conveyor de Banda Modular. Sus reglas mecánicas y datos de fabricación se completarán con ensamble, planos, BOM y criterios validados.
