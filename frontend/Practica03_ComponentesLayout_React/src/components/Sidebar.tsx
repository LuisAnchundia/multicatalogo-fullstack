import { NavLink } from 'react-router-dom';
import { IconDashboard, IconCatalogo, IconMiRed, IconCarrito } from './Icons';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isCollapsed: boolean;
  isOpen: boolean;
  onClose: () => void;
  adminView: boolean;
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

export default function Sidebar({ isCollapsed, isOpen, onClose, adminView }: SidebarProps) {
  const { user } = useAuth();
  return <>
    {isOpen && <button type="button" aria-label="Cerrar menú" className="mc-drawer-backdrop" onClick={onClose} />}
    <aside className={`mc-sidebar ${adminView ? 'mc-sidebar-admin' : 'mc-sidebar-store'} ${isCollapsed ? 'mc-sidebar-collapsed' : ''} ${isOpen ? 'mc-sidebar-open' : ''}`}>
      <div className="mc-sidebar-brand">
        <span className="mc-brand-mark" aria-hidden="true">✦</span>
        <span className="mc-sidebar-brand-text">MultiCatálogo <small>{adminView ? 'Admin Hub' : 'Tienda y red'}</small></span>
      </div>
      <button type="button" onClick={onClose} className="mc-sidebar-close">Cerrar menú ×</button>
      <nav aria-label="Navegación principal" className="mc-sidebar-nav">
        {menu.filter(item => !item.soloAdmin || user?.rol === 'admin').map(({ to, label, Icon }) => <NavLink
          key={to} to={to} end={to === '/'} aria-label={label} onClick={onClose} title={isCollapsed ? label : undefined}
          className={({ isActive }) => `mc-sidebar-link ${isActive ? 'is-active' : ''}`}>
          <Icon className="mc-sidebar-icon" />
          <span className="mc-sidebar-label">{label}</span>
        </NavLink>)}
      </nav>
      <div className="mc-sidebar-bottom">
        <span className="mc-sidebar-role">{user?.rol === 'admin' ? 'Administrador' : 'Mi cuenta'}</span>
        {adminView && <NavLink to="/tienda" onClick={onClose} className="mc-sidebar-store-link">↗ <span className="mc-sidebar-label">Volver a la tienda</span></NavLink>}
      </div>
    </aside>
  </>;
}
