# Estándar de catálogos de materiales, compras y procesos

**Propósito:** que todos los modelos calculen materiales, compras, habilitado, fabricación y ensamble de forma consistente.

**Estado:** diseño de catálogo. No incluye precios, tarifas, tiempos ni parámetros de máquina aprobados.

## 1. Principios
- Separar artículo comprado, material consumido y proceso que lo transforma.
- Unidad de compra y unidad de consumo deben tener conversión explícita.
- Cada precio tiene moneda, proveedor/fuente, fecha de vigencia y condición fiscal cuando se conozca.
- Los costos históricos emitidos no cambian al actualizar catálogos.
- Métodos de costeo son configurables y versionados.
- No asumir tarifas ni tiempos estándar sin datos o evidencia.
- La optimización reporta consumo, compra, sobrantes y restricciones.

## 2. Catálogo de materiales
| Campo | Descripción |
|---|---|
| material_id | Identificador estable |
| Código / nombre | Identificación interna |
| Familia | Lámina, perfil, barra, plástico, etc. |
| Especificación | Norma, grado o aleación |
| Forma comercial | Hoja, placa, barra, tubo, rollo, pieza |
| Espesor / sección | Valor y unidad cuando aplique |
| Dimensiones comerciales | Formato o longitud |
| Unidad de compra | Hoja, tramo, kg, m, pieza, etc. |
| Unidad de consumo | mm, m, kg, pieza, m², etc. |
| Conversión | Regla explícita |
| Precio y moneda | Valor y divisa |
| Proveedor/fuente | Origen del precio |
| Vigencia | Fecha o periodo |
| Estado | Activo, inactivo o pendiente |

## 3. Componentes comerciales
Para bandas, sprockets, rodamientos, chumaceras, brackets, guías y tornillería:
- Código interno y descripción.
- Fabricante, serie/modelo y variante exacta.
- Dimensiones y compatibilidad.
- Unidad de compra y cantidad por empaque.
- Proveedor y referencia.
- Precio, moneda y vigencia.
- Plazo de suministro si se conoce.
- Sustitutos autorizados y compatibilidad.
- Estado de validación.

No seleccionar sustitutos automáticamente por similitud de nombre o dimensión.

## 4. Catálogo de procesos
Cada proceso debe definir:
- Identificador y nombre.
- Unidad de cobro: minuto, metro, operación, doblez, m², hora, lote, etc.
- Método de costeo: tarifa, tiempo por tarifa, consumo por precio u otro.
- Parámetros requeridos.
- Recursos, máquina y personal.
- Preparación y setup.
- Consumibles.
- Tiempo estándar solo cuando esté medido y aprobado.
- Tarifa, moneda y vigencia.
- Restricciones de capacidad, espesor, material o geometría.
- Fuente y estado.

Un proceso puede combinar preparación fija, operación variable y consumibles. No imponer una única unidad para todos.

## 5. Familias de procesos a contemplar
Lista inicial, no implica que todos apliquen a cada equipo:
- Corte láser de lámina y placa.
- Corte de perfiles, tubos y barras.
- Doblez y conformado.
- Rolado.
- Soldadura y preparación de juntas.
- Maquinado: torneado, fresado, barrenado, roscado.
- Desbarbado y limpieza.
- Satinado, pulido y acabado.
- Pintura y recubrimientos.
- Ensamble mecánico.
- Instalación de componentes.
- Inspección y pruebas.
- Empaque.
- Flete, instalación y puesta en marcha, cuando se coticen.

## 6. Optimización de chapa
El nesting debe considerar formato comercial, márgenes, zonas no utilizables, kerf, separación, orientaciones permitidas, veta/acabado, geometría real del desarrollo, cantidad, estrategia y sobrantes reutilizables/no reutilizables.

Una envolvente rectangular puede servir para estimación preliminar, pero no sustituye la geometría de desarrollo plano para nesting definitivo.

## 7. Optimización de perfiles y barras
Considerar tipo/sección, longitud comercial, longitudes requeridas, kerf, recorte de extremos, restricciones de corte, cantidades, combinación de cortes, número de tramos y sobrantes por tramo. Reportar el plan de corte, no solo el total de metros.

## 8. Costo por pieza y equipo
Cada componente puede acumular:
1. Material bruto.
2. Procesos primarios.
3. Procesos secundarios.
4. Componentes comprados.
5. Maquinado.
6. Acabados.
7. Ensamble.
8. Costos adicionales mediante regla explícita.

El costo del equipo debe desglosarse por materiales, compras, corte/habilitado, conformado, soldadura, maquinado, acabados, ensamble y otros conceptos configurados.

Indirectos, desperdicio, retrabajo y contingencia son políticas explícitas, no porcentajes ocultos.

## 9. Precios y control de cambios
Cada precio registra valor, moneda, unidad/empaque, proveedor/fuente, fecha, vigencia, impuestos incluidos/excluidos cuando se conozcan, usuario modificador e historial.

Si falta o venció un precio, el cálculo lo señala o aplica una política autorizada y visible. Nunca usar precio cero silenciosamente.

## 10. Carga inicial de datos
Los catálogos permiten registros incompletos en estado pendiente, pero no los tratan como tarifas validadas para una cotización definitiva. El objetivo es reutilizar catálogos comunes y evitar duplicar precios o reglas dentro de cada modelo de equipo.
