import { Link, Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useSidebar } from '../context/SidebarContext';

export default function Layout() {
  const { pathname } = useLocation();
  const { isCollapsed, isOpen, closeSidebar } = useSidebar();
  const adminView = pathname === '/' || pathname.startsWith('/admin/');
  const offlineView = pathname === '/catalogo-guardado';

  return <div className={`mc-layout ${adminView ? 'mc-layout-admin' : 'mc-layout-store'}`}>
    <Sidebar isCollapsed={isCollapsed} isOpen={isOpen} onClose={closeSidebar} adminView={adminView} offlineView={offlineView} />
    <div className="mc-layout-body">
      <Navbar adminView={adminView} offlineView={offlineView} />
      <main key={pathname} id="contenido" className={`mc-main ${adminView ? 'mc-main-admin' : 'mc-main-store'}`}>
        <Outlet />
        {!adminView && <footer className="mc-footer">
          <Link to={offlineView ? '/catalogo-guardado' : '/tienda'} className="mc-footer-brand">MultiCatálogo</Link>
          <span>Cosmética y una comunidad que crece contigo.</span>
          <Link to={offlineView ? '/login' : '/mi-red'}>{offlineView ? 'Iniciar sesión →' : 'Mi red de referidos →'}</Link>
          <small className="mc-footer-credit">Hecho por Luis Alfredo Anchundia Cruz</small>
        </footer>}
      </main>
    </div>
  </div>;
}
