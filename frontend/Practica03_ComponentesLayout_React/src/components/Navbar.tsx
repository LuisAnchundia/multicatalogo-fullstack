import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import { IconCarrito, IconMenu, IconToggle, IconLogout } from './Icons';
import InstallButton from './InstallButton';

export default function Navbar({ adminView, offlineView = false }: { adminView: boolean; offlineView?: boolean }) {
  const { totalItems, totalPrice } = useCart();
  const { logout, user } = useAuth();
  const { isCollapsed, toggleCollapse, openSidebar } = useSidebar();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const titulo = offlineView ? 'Catálogo guardado' : pathname === '/tienda' ? 'Tienda' : pathname === '/catalogo' ? 'Catálogo' : pathname === '/mi-red' ? 'Mi Red' : pathname === '/mis-pedidos' ? 'Mis pedidos' : pathname.startsWith('/producto/') ? 'Detalle de producto' : pathname === '/carrito' ? 'Carrito' : pathname === '/checkout' ? 'Finalizar compra' : 'MultiCatálogo';

  function buscar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    navigate(`/catalogo${busqueda.trim() ? `?buscar=${encodeURIComponent(busqueda.trim())}` : ''}`);
  }

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return <header className={`mc-navbar ${adminView ? 'mc-navbar-admin' : 'mc-navbar-store'}`}>
    <div className="mc-nav-leading">
      <button type="button" onClick={openSidebar} aria-label="Abrir menú" className="mc-icon-button mc-mobile-menu"><IconMenu /></button>
      <button type="button" onClick={toggleCollapse} aria-label={isCollapsed ? 'Expandir menú' : 'Contraer menú'} title={isCollapsed ? 'Expandir menú' : 'Contraer menú'} className="mc-icon-button mc-collapse-button"><IconToggle /></button>
      {adminView ? <>
        <span className="mc-nav-context">Centro de operaciones</span>
      </> : <span className="mc-nav-section"><img className="mc-brand-mark" src="/favicon.svg" alt="" aria-hidden="true" />{titulo}</span>}
    </div>
    <div className="mc-nav-actions">
      {!adminView && !offlineView && <form onSubmit={buscar} role="search" className="mc-nav-search"><span aria-hidden="true">⌕</span><input aria-label="Buscar en la tienda" placeholder="Buscar cosméticos..." value={busqueda} onChange={e => setBusqueda(e.target.value)} /></form>}
      <InstallButton />
      {offlineView && <Link to="/login" className="mc-admin-store-shortcut">Iniciar sesión ↗</Link>}
      {adminView ? <Link to="/tienda" className="mc-admin-store-shortcut">Ir a la tienda ↗</Link> : null}
      {!offlineView && <Link to="/carrito" className="mc-cart-link" aria-label="Ver carrito"><IconCarrito className="w-5 h-5" /><span className="mc-cart-text">Carrito ({totalItems}){totalItems > 0 ? ` · $${totalPrice.toFixed(2)}` : ''}</span></Link>}
      {!offlineView && <div className="mc-user-menu">
        <button type="button" aria-label="Menú de usuario" aria-expanded={menuAbierto} onKeyDown={e => { if (e.key === 'Escape') setMenuAbierto(false); }} onClick={() => setMenuAbierto(v => !v)} className="mc-user-trigger">
          <span className="mc-user-avatar" aria-hidden="true">{user?.email.charAt(0).toUpperCase()}</span>
          <span className="mc-user-copy"><strong>{user?.email.split('@')[0]}</strong><small>{user?.rol === 'admin' ? 'Administrador' : 'Mi cuenta'}</small></span>
          <span aria-hidden="true">⌄</span>
        </button>
        {menuAbierto && <>
          <button type="button" aria-label="Cerrar menú de usuario" className="mc-menu-dismiss" onClick={() => setMenuAbierto(false)} />
          <div className="mc-menu-popover"><p>{user?.email}</p><button type="button" onClick={handleLogout}><IconLogout />Cerrar Sesión</button></div>
        </>}
      </div>}
    </div>
  </header>;
}
