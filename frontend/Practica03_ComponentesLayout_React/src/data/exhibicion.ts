// Artículos visuales: no forman parte del inventario ni de la API de compras.
export const productosExhibicion = [
  { nombre: 'Gel limpiador de avena', categoria: 'Limpieza', descripcion: 'Una opción suave para empezar la rutina diaria.', img: '/productos/gel-limpiador-avena.webp' },
  { nombre: 'Bálsamo labial de cacao', categoria: 'Cuidado labial', descripcion: 'Textura cremosa para cuidar los labios durante el día.', img: '/productos/balsamo-labial-cacao.webp' },
  { nombre: 'Aceite corporal de almendras', categoria: 'Cuidado corporal', descripcion: 'Un toque de suavidad para después de la ducha.', img: '/productos/aceite-corporal-almendras.webp' },
  { nombre: 'Bruma facial de rosas', categoria: 'Hidratación', descripcion: 'Frescura ligera para acompañar tu rutina facial.', img: '/productos/bruma-facial-rosas.webp' },
] as const;
