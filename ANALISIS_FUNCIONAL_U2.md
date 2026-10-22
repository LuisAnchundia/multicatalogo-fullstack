# Análisis funcional de MultiCatálogo — Unidad 2

**Estudiante:** Luis Anchundia

**Asignatura:** FRAMEWORK PROGRAMACIÓN WEB

**Fecha:** 22 de octubre de 2026

## Punto de partida

MultiCatálogo ya tenía una SPA en React y una API Go/Fiber con PostgreSQL y Redis. Había catálogo, inicio de sesión, checkout transaccional, red de tres niveles y cálculo de comisiones. El pedido se guardaba, pero faltaban las pantallas y rutas para consultarlo y administrarlo. Los productos y usuarios solo se cargaban desde el script inicial.

La red usa `usuarios.parent_id`; **no existe** una tabla `referidos`. La sesión usa un token propio firmado con HMAC, **no un JWT estándar**. El seed contiene ocho usuarios (un administrador y siete clientes), no solo dos. Estas diferencias importan porque el plan inicial describía una estructura que no coincidía con el repositorio.

## Brechas funcionales atendidas en este avance

| Necesidad | Resultado en el proyecto |
|---|---|
| Incorporar clientes | Registro público con contraseña cifrada, código de referido opcional y rol cliente por defecto. |
| Hacer crecer la red | Cada cuenta nueva guarda su `parent_id` según el código del patrocinador; cada usuario consulta su propia red. |
| Administrar el catálogo | Alta, edición y activación/desactivación de productos por administrador; el catálogo público muestra solo activos. |
| Consultar pedidos | Historial y detalle propio para el cliente; listado, filtro y cambios de estado para el administrador. |
| Cancelar pedidos | La cancelación de un pedido pendiente devuelve existencias y revierte comisiones dentro de una transacción. Se impide cancelar si las comisiones ya fueron liquidadas. |
| Auditar comisiones | Las filas de `comisiones` se insertan con el pedido; el trabajador posterior acredita el saldo sin duplicar filas. Cada usuario puede consultar su historial. |
| Registrar liquidaciones | El administrador marca como pagadas las comisiones pendientes acreditadas. Esta acción registra un pago administrativo; no hace una transferencia bancaria. |
| Consultar reportes | Resumen de ventas por fechas y listados de productos, usuarios y comisiones pendientes. |
| Operar con más datos | Paginación en listados administrativos, búsqueda de productos y control de roles en la API. |

## Arquitectura y seguridad

La API conserva el flujo controlador → repositorio y el servicio existente para caché y checkout. PostgreSQL mantiene pedidos y comisiones; Redis almacena lecturas del catálogo y de la red. La migración `db/002_backoffice.sql` se ejecuta al iniciar el backend y agrega los campos e índices que necesita el avance sin borrar los datos previos.

El servidor comprueba en cada petición autenticada que la cuenta siga activa y conserve el rol del token. Las rutas administrativas verifican además el rol `admin`. En pedidos y red, el ID del cliente sale del token, no de un parámetro elegido por el navegador.

## Límites de esta entrega

- El checkout sigue siendo una **simulación de compra**; no hay pasarela de pago ni movimiento bancario.
- Las liquidaciones son registros internos de comisiones. Se requiere un proceso contable y de pago externo para operar con dinero real.
- El árbol se consulta hasta tres niveles, como en el ejercicio original. No se implementó carga diferida ni expansión por nodo.
- Los rangos se calculan por referidos directos al mostrar la pantalla; no hay cierre mensual automático.
- Los reportes por periodo usan pedidos guardados; el saldo inicial del administrador sigue siendo un dato de demostración.

Estas limitaciones no impiden demostrar los avances de Unidad 2, pero conviene explicarlas al presentar el proyecto.
