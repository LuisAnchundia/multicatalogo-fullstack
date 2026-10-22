import { Link, Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useSidebar } from '../context/SidebarContext';

export default function Layout() {
  const { pathname } = useLocation();
  const { isCollapsed, isOpen, closeSidebar } = useSidebar();
  const adminView = pathname === '/' || pathname.startsWith('/admin/');

  return <div className={`mc-layout ${adminView ? 'mc-layout-admin' : 'mc-layout-store'}`}>
    <Sidebar isCollapsed={isCollapsed} isOpen={isOpen} onClose={closeSidebar} adminView={adminView} />
    <div className="mc-layout-body">
      <Navbar adminView={adminView} />
      <main key={pathname} id="contenido" className={`mc-main ${adminView ? 'mc-main-admin' : 'mc-main-store'}`}>
        <Outlet />
        {!adminView && <footer className="mc-footer">
          <Link to="/tienda" className="mc-footer-brand">MultiCatálogo</Link>
          <span>Cosmética y una comunidad que crece contigo.</span>
          <Link to="/mi-red">Mi red de referidos →</Link>
        </footer>}
      </main>
    </div>
  </div>;
}
