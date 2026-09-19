import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useSidebar } from "../context/SidebarContext";
import { IconCarrito, IconMenu, IconToggle, IconLogout } from "./Icons";

const Navbar = () => {
  const { totalItems } = useCart();
  const { logout, userEmail } = useAuth();
  const { isCollapsed, toggleCollapse, openSidebar } = useSidebar();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0">
      <div className="flex items-center gap-2 md:gap-3">
        {/* Botón hamburguesa: abre el cajón, solo en móvil */}
        <button
          onClick={openSidebar}
          aria-label="Abrir menú"
          className="md:hidden p-2 rounded hover:bg-slate-100 transition text-slate-600"
        >
          <IconMenu />
        </button>

        {/* Botón Toggle: contrae o expande el sidebar, solo en escritorio */}
        <button
          onClick={toggleCollapse}
          aria-label={isCollapsed ? "Expandir menú" : "Contraer menú"}
          title={isCollapsed ? "Expandir menú" : "Contraer menú"}
          className="hidden md:block p-2 rounded hover:bg-slate-100 transition text-slate-600"
        >
          <IconToggle
            className={`w-6 h-6 transition-transform duration-300 ${
              isCollapsed ? "" : "rotate-180"
            }`}
          />
        </button>

        <h2 className="text-slate-600 font-medium text-sm sm:text-base md:text-lg">
          Panel de Administración
        </h2>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
        <Link
          to="/carrito"
          className="relative p-2 hover:bg-slate-100 rounded-full transition text-slate-600"
          aria-label="Ver carrito"
        >
          <IconCarrito />
          {totalItems > 0 && (
            <span className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
              {totalItems}
            </span>
          )}
        </Link>

        {/* Menú de usuario por clic: en pantallas táctiles el hover no funciona bien */}
        <div className="relative">
          <button
            onClick={() => setMenuAbierto((prev) => !prev)}
            className="flex items-center gap-3"
          >
            <span className="hidden sm:block text-sm text-slate-500">
              {userEmail}
            </span>
            <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border border-slate-300">
              <img
                src="https://fastly.picsum.photos/id/64/4326/2884.jpg?hmac=9_SzX666YRpR_fOyYStXpfSiJ_edO3ghlSRnH2w09Kg"
                alt="Avatar del usuario"
                className="w-full h-full object-cover"
              />
            </div>
          </button>

          {menuAbierto && (
            <>
              {/* Capa invisible: al hacer clic fuera se cierra el menú */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuAbierto(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden">
                <p className="sm:hidden px-4 py-2 text-xs text-slate-500 border-b border-slate-100 truncate">
                  {userEmail}
                </p>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-red-600 font-semibold hover:bg-red-50 transition-colors"
                >
                  <IconLogout />
                  Cerrar Sesión
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
