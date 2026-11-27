# Modelo de dominio de cotizaciones

**Propósito:** definir cómo administrar cotizaciones, equipos, sesiones, revisiones y documentos sin mezclar información entre usuarios.

**Estado:** especificación objetivo; no implica que todas las entidades o flujos estén implementados.

## 1. Principios
1. Cada cotización en preparación pertenece a un usuario responsable y tiene un espacio de trabajo independiente.
2. Una cotización puede contener varios equipos y cada equipo una cantidad comercial.
3. Cada equipo conserva entradas, resultados de ingeniería, costos y versión del modelo.
4. La cotización consolida importes y aplica ajustes comerciales a nivel de documento.
5. La cotización emitida conserva una fotografía inmutable de datos, reglas y precios.
6. Las correcciones posteriores generan una revisión nueva.
7. El aislamiento se aplica en servidor y base de datos mediante autorización y RLS, no solo con filtros de interfaz.
8. Los consecutivos se asignan mediante operación transaccional de servidor.

## 2. Entidades conceptuales

### Empresa
Contenedor lógico de usuarios, clientes, catálogos, configuración, cotizaciones y consecutivos. La primera instalación puede usar una empresa, pero el diseño debe permitir varias sin compartir datos accidentalmente.

### Usuario y membresía
Identidad autenticada y relación con empresa, rol y permisos. El propietario global de la plataforma es distinto del administrador operativo de una empresa.

Roles objetivo:
- owner: autoridad sobre producto, código y configuración global.
- admin: usuarios, clientes, catálogos, costos y operación de empresa.
- engineering: modelos técnicos y validación.
- sales: captura, consulta y ajustes comerciales autorizados.

La matriz definitiva debe implementarse en servidor. Ocultar pantallas no es autorización.

### Cliente
Registro asociado a empresa. Vendedores pueden crear/editar según permisos, sin eliminar; administración gestiona ciclo de vida. Las cotizaciones emitidas guardan snapshot de los datos del cliente utilizados.

### Cotización de trabajo
Contenedor persistente de una cotización no emitida. Incluye propietario, empresa, cliente, moneda, estado, fechas, notas y equipos. Debe recuperarse después de cerrar navegador o perder conexión.

### Equipo cotizado
Instancia de una familia de equipo dentro de la cotización. Contiene familia, cantidad comercial, captura, versión del modelo, estado de cálculo, resultados, advertencias y costo. Cada equipo se calcula por separado.

### Resultado de ingeniería
Snapshot de entradas, parámetros derivados, componentes, cantidades, procesos, advertencias y trazabilidad. Se vincula a una versión inmutable del modelo y a versiones de catálogos.

### Ajuste comercial
Margen o markup explícitamente identificado, límites de autorización, gastos adicionales, condiciones, entrega, tasa y tratamiento de impuestos. Conserva el método y valores aplicados.

### Cotización emitida
Registro definitivo con consecutivo, revisión, snapshot de cliente, partidas, costos/precios, condiciones, emisor, fecha y PDF asociado.

### Documento y auditoría
Documento PDF vinculado a una revisión. Auditoría registra cambios sensibles: roles, precios, cálculos, aprobaciones, emisión, revisión, cancelación y permisos.

## 3. Estados propuestos
- draft: captura en proceso.
- calculating: cálculo solicitado/en ejecución.
- needs_information: faltan datos para completar estimación.
- technical_review: requiere validación de ingeniería.
- commercial_review: requiere autorización comercial.
- ready_to_issue: cumple condiciones para emisión.
- issued: emitida y congelada.
- cancelled: cancelada, conservando historial.

Las transiciones deben ser controladas por servidor. No pasar a ready_to_issue con equipos bloqueados, precios obligatorios ausentes, advertencias críticas o autorizaciones pendientes.

## 4. Flujo de trabajo
1. Vendedor crea workspace.
2. Servidor asocia workspace al usuario y empresa.
3. Vendedor selecciona o crea cliente.
4. Agrega equipos, familia y cantidad.
5. Cada equipo conserva su captura.
6. Motor ejecuta modelo de ingeniería correspondiente.
7. Motor de costos calcula y reporta pendientes/advertencias.
8. Vendedor revisa equipos y aplica ajustes comerciales autorizados.
9. Ingeniería o administración revisa cuando corresponda.
10. Se genera vista previa.
11. Servidor valida permisos, estados, precios y disponibilidad del consecutivo.
12. En una transacción reserva consecutivo, congela snapshot y registra emisión.
13. Se genera y almacena PDF asociado a revisión.
14. Workspace se cierra o archiva según política de retención.

No calcular el consecutivo en el navegador leyendo el último folio y sumando uno. Protegerlo con restricción única y operación transaccional del servidor.

## 5. Revisiones
- Una cotización emitida nunca se modifica en sitio.
- Una corrección crea una revisión vinculada a la original.
- Cada revisión registra motivo, autor, fecha y diferencias.
- Un cambio de ingeniería puede requerir recalcular equipos.
- Un cambio de precio no modifica snapshots anteriores.
- La política de folio para revisiones debe definirse según la política comercial.

## 6. Aislamiento y concurrencia
- Cada workspace tiene propietario y empresa.
- Consultas y mutaciones verifican pertenencia y rol en servidor/RLS.
- UUID no sustituye autorización.
- Cálculos se asocian al workspace y equipo.
- No usar estado global compartido entre usuarios.
- Controlar concurrencia para evitar que dos pestañas sobrescriban cambios.
- Emisión y asignación de folio deben ser transaccionales e idempotentes ante reintentos.
- Limpiar un workspace solo afecta ese workspace y respeta retención y auditoría.

## 7. Snapshot y reproducibilidad
Al emitir conservar:
- Datos de cliente utilizados.
- Captura comercial de cada equipo.
- Versión del modelo de ingeniería.
- Entradas y resultados técnicos.
- Versiones de catálogos y precios.
- Métodos de costeo y parámetros internos relevantes.
- Costos por categoría y equipo.
- Ajustes, margen/markup, impuestos y totales.
- Condiciones comerciales.
- Emisor y fecha.
- Identificador/checksum del PDF cuando se implemente.

## 8. Permisos objetivo
| Acción | Vendedor | Ingeniería | Administrador | Propietario |
|---|---:|---:|---:|---:|
| Crear cotización | Sí | Según política | Sí | Sí |
| Editar borradores propios | Sí | Según asignación | Sí | Sí |
| Ver cotizaciones ajenas | No por defecto | Según asignación | Sí | Sí |
| Ver detalle técnico | No por defecto | Sí | Según permiso | Sí |
| Modificar modelos | No | Sí | Permiso explícito | Sí |
| Modificar catálogos/precios | No | Según permiso | Sí | Sí |
| Administrar usuarios de empresa | No | No | Sí | Sí |
| Administrar plataforma global | No | No | No | Sí |

Esta matriz es una base; debe detallarse antes de implementar RLS definitiva.

## 9. Decisiones pendientes
- Política de consecutivos y revisiones.
- Monedas y tipo de cambio.
- Vigencia y actualización de precios.
- Aprobación de margen y descuentos.
- Tratamiento fiscal según operación.
- Retención de borradores, PDFs y auditoría.
- Cancelación y reemisión.
- Reasignación de cotizaciones entre vendedores.
