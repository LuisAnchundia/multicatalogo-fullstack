# Verificación — Práctica 03, Tema 5

## Revisión inicial

El repositorio estaba en `97191ba`. No había modificaciones pendientes en archivos
rastreados. Solo aparecían `Guia_Practica_Tema5_leccion.md` y `leccion.md` sin seguimiento;
ambos eran idénticos al documento adjunto. Se conservaron.
El código todavía correspondía a la base anterior al Tema 5.
No se puede atribuir autoría a código previo únicamente por el estado de Git.

## Comprobaciones ejecutadas

| Comprobación | Resultado |
|---|---|
| `npm ci` | Instalación completa |
| `npm run lint` | 0 errores; 3 warnings de Fast Refresh en los contextos, permitidos por la guía |
| `npm run build` | TypeScript y bundle Vite correctos |
| `go build ./...` | Correcto |
| `go vet ./...` | Correcto |
| `npm run test:e2e` | 9 pruebas aprobadas en Chromium |
| Revisión visual | Dashboard y tienda en escritorio; carrito, checkout y red en móvil |

## Correspondencia con la lista final de la guía

| Escenario | Evidencia |
|---|---|
| 1. Login admin | Dashboard, cuatro enlaces y rol admin |
| 2. Login cliente | Tienda, dos enlaces y rol cliente |
| 3. Rutas restringidas | Cliente redirigido desde `/` y `/mi-red`; sin sesión va a login |
| 4. Tienda | Hero de al menos un viewport, cinco categorías y cuatro destacados |
| 5. Catálogo | Búsqueda, categoría en URL, estado vacío y navegación Atrás |
| 6. Detalle | Miniaturas, diálogo, flechas, Escape, restitución del foco y producto inexistente |
| 7. Persistencia | Recarga conserva la cantidad y el total |
| 8. Checkout | Formulario validado, pedido numerado, resumen y carrito vaciado |
| 9. Red | Árbol de tres niveles, Diana en nivel 3 y comisiones |
| 10. KPIs | 7 referidos, 4090 en ventas, 319,50 en comisiones, Plata |
| 11–12. Aislamiento | Cambio admin → cliente → admin conserva cada carrito |
| 13. CTA cliente | Sin acceso al plan multinivel y enlace final al catálogo |
| 14. Navbar | Título y badge dependientes del perfil |

También se probaron JSON y credenciales inválidos en la API, carrito almacenado dañado,
acceso directo a checkout vacío y confirmación, protección del pedido de otra cuenta,
cancelación al abandonar el checkout y ausencia de desbordamiento horizontal en móvil de 390 px.

Las pruebas son reproducibles en `frontend/Practica03_ComponentesLayout_React/tests/flujos.spec.ts`.
No sustituyen una garantía de ausencia absoluta de errores en cualquier navegador o entorno.
Las imágenes conservan las URLs de Picsum de la guía y requieren conexión a Internet.

## Límites de la práctica

El login usa la API Go real, con las dos cuentas y tokens ficticios de la guía.
El catálogo frontend y la red son mocks. No se añadieron PostgreSQL, JWT real ni pasarela de pago.
El carrito persiste por usuario y la sesión durante la pestaña. Los pedidos no tienen historial
permanente ni se envían a un servidor; la confirmación se transporta en el estado de navegación.
