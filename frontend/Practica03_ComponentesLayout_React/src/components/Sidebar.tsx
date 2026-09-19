import { NavLink } from "react-router-dom";
import { IconDashboard, IconCatalogo, IconMiRed } from "./Icons";

interface SidebarProps {
  isCollapsed: boolean; // true => 80px de ancho, solo iconos
  isOpen: boolean;      // cajón abierto en móvil
  onClose: () => void;
}

// Las opciones del menú se definen en un arreglo para no repetir el mismo JSX tres veces.
const menu = [
  { to: "/", label: "Dashboard", Icon: IconDashboard },
  { to: "/catalogo", label: "Catálogo", Icon: IconCatalogo },
  { to: "/mi-red", label: "Mi Red", Icon: IconMiRed },
];

const Sidebar = ({ isCollapsed, isOpen, onClose }: SidebarProps) => {
  return (
    <>
      {/* Fondo oscuro: aparece solo en móvil cuando el menú está abierto */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
        />
      )}

      {/* Menú lateral: cajón fijo en móvil, estático y siempre visible en escritorio.
          En móvil mantiene los 256px para que el texto se lea; el colapso a 80px
          solo aplica de md hacia arriba. */}
      <aside
        className={`fixed md:static top-0 left-0 z-40 h-screen bg-slate-900 text-white flex flex-col
          transform transition-all duration-300 w-64
          ${isCollapsed ? "md:w-20" : "md:w-64"}
          ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        {/* Cabecera: el nombre completo se reemplaza por las iniciales al colapsar */}
        <div className="h-16 flex items-center border-b border-slate-700 px-6 md:px-0 md:justify-center">
          <span
            className={`text-2xl font-bold whitespace-nowrap ${
              isCollapsed ? "hidden md:hidden" : "md:block"
            }`}
          >
            MultiCatálogo
          </span>
          <span
            className={`text-2xl font-bold ${
              isCollapsed ? "hidden md:block" : "hidden"
            }`}
          >
            MC
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menu.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={onClose}
              // Cuando está colapsado el title sirve de tooltip, porque el texto no se ve
              title={isCollapsed ? label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-4 p-3 rounded transition ${
                  isCollapsed ? "md:justify-center md:gap-0" : ""
                } ${isActive ? "bg-indigo-600" : "hover:bg-slate-800"}`
              }
            >
              <Icon className="w-6 h-6 shrink-0" />
              <span
                className={`whitespace-nowrap ${isCollapsed ? "md:hidden" : ""}`}
              >
                {label}
              </span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
