import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { useSidebar } from "../context/SidebarContext";

const Layout = () => {
  const { pathname } = useLocation();
  // El estado vive en el contexto para que el Navbar también pueda modificarlo
  const { isCollapsed, isOpen, closeSidebar } = useSidebar();

  return (
    <div className="flex h-dvh bg-slate-50">
      <Sidebar isCollapsed={isCollapsed} isOpen={isOpen} onClose={closeSidebar} />

      {/* Área de Contenido Principal */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Navbar />
        <main key={pathname} id="contenido" className={`flex-1 min-w-0 overflow-y-auto ${pathname === '/tienda' ? '' : 'p-4 md:p-8'}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
