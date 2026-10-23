import { NavLink } from 'react-router-dom';
import { IconDashboard, IconCatalogo, IconMiRed, IconCarrito } from './Icons';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isCollapsed: boolean;
  isOpen: boolean;
  onClose: () => void;
  adminView: boolean;
  offlineView: boolean;
}

const menu = [
  { to: '/', label: 'Dashboard', Icon: IconDashboard, soloAdmin: true },
  { to: '/tienda', label: 'Tienda', Icon: IconCarrito },
  { to: '/catalogo', label: 'Catálogo', Icon: IconCatalogo },
  { to: '/mi-red', label: 'Mi Red', Icon: IconMiRed },
  { to: '/mis-pedidos', label: 'Mis pedidos', Icon: IconCarrito },
  { to: '/admin/productos', label: 'Productos', Icon: IconCatalogo, soloAdmin: true },
  { to: '/admin/usuarios', label: 'Usuarios', Icon: IconDashboard, soloAdmin: true },
  { to: '/admin/pedidos', label: 'Pedidos', Icon: IconCarrito, soloAdmin: true },
  { to: '/admin/liquidaciones', label: 'Liquidaciones', Icon: IconMiRed, soloAdmin: true },
];

export default function Sidebar({ isCollapsed, isOpen, onClose, adminView, offlineView }: SidebarProps) {
  const { user } = useAuth();
  const visibleMenu = offlineView ? [{ to: '/catalogo-guardado', label: 'Catálogo', Icon: IconCatalogo }] : menu.filter(item => !item.soloAdmin || user?.rol === 'admin');
  return <>
    {isOpen && <button type="button" aria-label="Cerrar menú" className="mc-drawer-backdrop" onClick={onClose} />}
    <aside className={`mc-sidebar ${adminView ? 'mc-sidebar-admin' : 'mc-sidebar-store'} ${isCollapsed ? 'mc-sidebar-collapsed' : ''} ${isOpen ? 'mc-sidebar-open' : ''}`}>
      <div className="mc-sidebar-brand">
        <img className="mc-brand-mark" src="/favicon.svg" alt="" aria-hidden="true" />
        <span className="mc-sidebar-brand-text">MultiCatálogo
          <small>{adminView ? 'Admin Hub' : offlineView ? 'Consulta sin conexión' : 'Tienda y red'}</small>
          <span className="mc-sidebar-author">Luis Alfredo Anchundia Cruz</span>
        </span>
      </div>
      <button type="button" onClick={onClose} className="mc-sidebar-close">Cerrar menú ×</button>
      <nav aria-label="Navegación principal" className="mc-sidebar-nav">
        {visibleMenu.map(({ to, label, Icon }) => <NavLink
          key={to} to={to} end={to === '/'} aria-label={label} onClick={onClose} title={isCollapsed ? label : undefined}
          className={({ isActive }) => `mc-sidebar-link ${isActive ? 'is-active' : ''}`}>
          <Icon className="mc-sidebar-icon" />
          <span className="mc-sidebar-label">{label}</span>
        </NavLink>)}
      </nav>
      <div className="mc-sidebar-bottom">
        <span className="mc-sidebar-role">{offlineView ? 'Solo consulta' : user?.rol === 'admin' ? 'Administrador' : 'Mi cuenta'}</span>
        {offlineView && <NavLink to="/login" onClick={onClose} className="mc-sidebar-store-link">↗ <span className="mc-sidebar-label">Iniciar sesión</span></NavLink>}
        {adminView && <NavLink to="/tienda" onClick={onClose} className="mc-sidebar-store-link">↗ <span className="mc-sidebar-label">Volver a la tienda</span></NavLink>}
      </div>
    </aside>
  </>;
}
