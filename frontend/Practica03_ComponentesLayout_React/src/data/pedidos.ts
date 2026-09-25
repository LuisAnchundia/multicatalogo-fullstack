export interface PedidoConfirmado {
  numero: string;
  usuarioEmail: string;
  items: { nombre: string; cantidad: number; precio: number }[];
  total: number;
  cliente: { nombre: string; email: string; ciudad: string; direccion: string; telefono: string };
  metodoPago: string;
  fecha: string;
}
