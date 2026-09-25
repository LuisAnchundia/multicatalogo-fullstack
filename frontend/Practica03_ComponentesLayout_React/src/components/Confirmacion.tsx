// src/components/Confirmacion.tsx
// Pantalla de confirmación de pedido (Tema 5):
// - Lee los datos del pedido enviados desde Checkout (location.state)
// - Muestra el número de pedido y el resumen
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { PedidoConfirmado } from '../data/pedidos';

const Confirmacion = () => {
  const location = useLocation();
  const { user } = useAuth();
  const pedido = (location.state as { pedido?: PedidoConfirmado } | null)?.pedido;

  // Si no hay datos de pedido (acceso directo a la URL), mostramos un mensaje genérico
  if (!pedido || pedido.usuarioEmail !== user?.email) {
    return (
      <div className="bg-white p-10 rounded-lg border border-slate-200 text-center">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">No hay un pedido para mostrar</h1>
        <p className="text-slate-500 mb-6">Completa una compra para consultar su confirmación.</p>
        <Link
          to="/tienda"
          className="inline-block bg-indigo-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
        >
          Volver a la Tienda
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-green-600 text-white p-8 text-center">
          <div className="text-5xl mb-3">✓</div>
          <h1 className="text-2xl font-bold">¡Pedido confirmado!</h1>
          <p className="text-green-100 mt-1">
            Número de pedido: <span className="font-mono font-bold">{pedido.numero}</span>
          </p>
        </div>

        <div className="p-8">
          <p className="mb-6 text-sm text-slate-600">Pedido de demostración. No se ha realizado ningún cobro.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-sm break-words">
            <div>
              <p className="text-slate-500">Cliente</p>
              <p className="font-semibold text-slate-800">{pedido.cliente.nombre}</p>
            </div>
            <div>
              <p className="text-slate-500">Fecha</p>
              <p className="font-semibold text-slate-800">{pedido.fecha}</p>
            </div>
            <div>
              <p className="text-slate-500">Correo</p>
              <p className="font-semibold text-slate-800">{pedido.cliente.email}</p>
            </div>
            <div>
              <p className="text-slate-500">Ciudad</p>
              <p className="font-semibold text-slate-800">{pedido.cliente.ciudad}</p>
            </div>
          </div>
          <p className="mb-2 text-sm text-slate-600">Dirección: {pedido.cliente.direccion}</p>
          <p className="mb-2 text-sm text-slate-600">Teléfono: {pedido.cliente.telefono}</p>
          <p className="mb-6 text-sm text-slate-600">Método de pago: {pedido.metodoPago}</p>
          <h2 className="font-bold text-slate-800 mb-3">Detalle del pedido</h2>
          <div className="space-y-2 border-b border-slate-100 pb-4 mb-4">
            {pedido.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-slate-600">
                  {item.nombre} × {item.cantidad}
                </span>
                <span className="font-semibold">
                  ${(item.precio * item.cantidad).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center mb-8">
            <span className="font-bold text-slate-800">Total del pedido</span>
            <span className="text-2xl font-bold text-green-600">
              ${pedido.total.toFixed(2)}
            </span>
          </div>

          <div className="flex gap-4">
            <Link
              to="/tienda"
              className="flex-1 text-center bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition"
            >
              Seguir Comprando
            </Link>
            <Link
              to="/catalogo"
              className="flex-1 text-center border border-slate-300 text-slate-700 font-semibold py-3 rounded-lg hover:bg-slate-50 transition"
            >
              Ver Catálogo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Confirmacion;
