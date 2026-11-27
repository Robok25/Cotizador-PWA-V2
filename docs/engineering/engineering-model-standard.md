# Estándar maestro de modelos de ingeniería

**Propósito:** establecer una metodología repetible para documentar, validar e incorporar cada familia de conveyors al motor de ingeniería.

**Primer modelo objetivo:** Conveyor de Banda Modular.  
**Estado:** plantilla metodológica; no contiene dimensiones ni fórmulas mecánicas aprobadas.

## 1. Principios
- Cada familia tiene un modelo de ingeniería independiente.
- El motor general no contiene reglas geométricas particulares; ejecuta el modelo correspondiente.
- Ventas captura datos comerciales, no parámetros internos de fabricación.
- Las variables internas se calculan o consultan en catálogos autorizados.
- Toda regla incluye unidades, fuente, restricciones y caso de prueba.
- Un dato desconocido no se reemplaza por una suposición silenciosa.
- Mismas entradas, versión del modelo y catálogos deben producir resultados reproducibles.
- Cada resultado debe explicar cómo obtuvo dimensiones, cantidades y costos.
- El resultado indica si es preliminar, requiere revisión o está validado.

## 2. Expediente por familia de equipo

### 2.1 Identificación y alcance
| Campo | Descripción |
|---|---|
| family_id | Identificador estable de la familia |
| Nombre | Nombre legible |
| Versión del modelo | Versión de reglas y geometría |
| Configuración estándar | Ensamble y configuración CAD |
| Alcance | Configuraciones que puede resolver |
| Exclusiones | Casos que requieren ingeniería especial |
| Responsable técnico | Persona que valida |
| Estado | Borrador, revisión, validado u obsoleto |

### 2.2 Entradas comerciales
Para cada entrada: identificador, etiqueta mostrada a ventas, tipo de dato, unidad, obligatoriedad, validación, origen y variables/componentes afectados. Las unidades deben ser explícitas. No solicitar al vendedor datos de fabricación como factor K, kerf, tolerancias de corte o formatos comerciales de lámina.

### 2.3 Parámetros internos
Cada parámetro incluye identificador, descripción, unidad, tipo (constante estándar, variable calculada, selección de catálogo o configuración), valor o expresión validada, fuente técnica, restricciones, responsable y versión de aplicación.

### 2.4 Reglas de dimensionamiento
Cada regla debe documentar:
- Identificador y nombre.
- Entradas y salidas.
- Fórmula o procedimiento aprobado.
- Unidades de cada entrada y salida.
- Precondiciones, límites y casos especiales.
- Fuente técnica: plano, norma, fabricante, cálculo o criterio aprobado.
- Caso de prueba, resultado esperado y tolerancia.
- Estado: pendiente, propuesta, revisada o aprobada.

Una regla pendiente o propuesta no puede ejecutarse como regla de fabricación autorizada.

### 2.5 Inventario y despiece
Cada componente debe incluir:
- Identificador estable, código y nombre.
- Revisión de plano o referencia CAD.
- Clasificación: chapa, perfil, plástico, comercial, maquinado, conjunto comprado u otra clase aprobada.
- Material y especificación.
- Cantidad por equipo o expresión que determina la cantidad.
- Unidad de cantidad.
- Dimensiones nominales y unidad.
- Dimensiones fijas, variables o derivadas.
- Regla que genera geometría o cantidad.
- Proceso primario y secundarios.
- Fuente y estado de validación.

Una envolvente CAD (bounding box) es referencia geométrica; no equivale automáticamente a dimensión nominal, dimensión de corte o desarrollo plano.

### 2.6 Chapa, perfiles y desarrollos
Para chapa documentar por separado geometría terminada, espesor, material, radio interior, método de cálculo de doblez, factor K si está validado para material/espesor/herramental/proceso, desarrollo plano, orientación, formato comercial, kerf, separación, márgenes y nesting.

Para perfiles documentar tipo y sección, especificación, longitud requerida, longitud comercial, kerf, recorte de extremos, restricciones, optimización y sobrantes.

Distinguir el ancho desarrollado transversal de la longitud longitudinal de la pieza. Una envolvente rectangular puede servir para estimación preliminar, pero no sustituye la geometría del desarrollo plano para nesting definitivo.

### 2.7 Componentes comerciales y maquinados
Componentes comerciales: fabricante, familia/modelo, variante exacta, unidad de compra, cantidad por equipo, compatibilidad, proveedor, precio y vigencia.

Piezas maquinadas: material, bruto requerido, dimensiones terminadas, sobrematerial cuando aplique, operaciones, tolerancias, acabado y método de costeo. No inferir tolerancias desde un modelo 3D sin documentación.

### 2.8 Procesos de fabricación
Cada pieza puede tener una ruta de procesos. Documentar secuencia, cantidad, unidad de costeo, tiempo estándar o tarifa, recursos, preparación, consumibles, acabado, inspección y fuente de los tiempos.

## 3. Estados de información

Cada dato puede ser:
- unknown: desconocido.
- provided: proporcionado por cliente o usuario.
- catalog: obtenido de un catálogo identificado.
- calculated: calculado por una regla aprobada.
- assumed: hipótesis explícita que requiere autorización o confirmación.
- validated: revisado y aprobado por responsable.

## 4. Estados del resultado
- preliminary: estimación preliminar con hipótesis y advertencias visibles.
- technical_review: requiere revisión técnica.
- validated: cumple reglas y validaciones autorizadas.
- blocked: faltan datos críticos, se exceden límites o existe incompatibilidad.

Un resultado bloqueado no se presenta como cotización validada. Las hipótesis no pueden ocultarse dentro del cálculo.

## 5. Salida normalizada
Todo modelo entrega:
- Identificación del equipo y versión del modelo.
- Entradas originales y unidades.
- Parámetros calculados con trazabilidad.
- Componentes y cantidades.
- Materiales y abastecimiento.
- Rutas y cantidades de procesos.
- Costos por categoría, si hay datos suficientes.
- Advertencias, hipótesis explícitas y datos pendientes.
- Estado y motivos de bloqueo.
- Referencias a reglas y catálogos utilizados.

## 6. Validación
Cada familia tendrá casos de prueba versionados:
1. Configuración estándar de referencia.
2. Variación de cada dimensión comercial principal.
3. Variación de selección de componentes.
4. Límites mínimos y máximos autorizados.
5. Casos incompatibles o fuera de alcance.
6. Comparación de dimensiones y piezas contra CAD/planos.
7. Comparación de cantidades contra BOM validada.
8. Comparación de materiales y procesos contra fabricación real.
9. Comparación del costo estimado contra costo real.

Cada prueba registra entradas, versión, resultado esperado/obtenido, tolerancia, evidencia y responsable.

## 7. Flujo para incorporar una familia
1. Recibir ensamble CAD, piezas, planos y BOM.
2. Identificar configuraciones, supresiones y componentes externos.
3. Conciliar BOM CAD con BOM de fabricación.
4. Clasificar piezas y resolver pendientes.
5. Identificar entradas comerciales.
6. Construir mapa de dependencias paramétricas.
7. Documentar reglas y fuentes.
8. Definir materiales, abastecimiento y procesos.
9. Implementar el módulo aislado.
10. Ejecutar pruebas.
11. Validar con ingeniería y fabricación.
12. Publicar una versión aprobada.

## 8. Ficha de componente reutilizable
| Campo | Valor inicial |
|---|---|
| ID / código | Pendiente |
| Nombre | Pendiente |
| Revisión CAD/plano | Pendiente |
| Cantidad por equipo | Pendiente |
| Clasificación | Pendiente |
| Material | Pendiente |
| Espesor / sección | No aplica o pendiente |
| Dimensiones nominales | Pendiente |
| Dimensiones variables | Pendiente |
| Regla de cantidad/geometría | Pendiente |
| Proceso primario/secundarios | Pendiente |
| Compra o fabricación | Pendiente |
| Fuente | Pendiente |
| Responsable | Pendiente |
| Estado | Pendiente de información |

## 9. Primer modelo
El ensamble de referencia previamente identificado es PC-1743-PM-E-00. La información de STEP es preliminar hasta contrastarla con archivos nativos, planos y BOM de fabricación. No se fijan pitch, recorrido, dimensiones nominales, holguras, factores de doblez, tiempos ni precios sin fuente técnica y validación.
