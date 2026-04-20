import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { to: '/', label: 'Overview', end: true },
  { to: '/users', label: 'Users' },
  { to: '/billing', label: 'Billing' },
  { to: '/settings', label: 'Settings' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-badge">AO</span>
          <div>
            <h1>Admin Ops</h1>
            <p>TrainerOS</p>
          </div>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p>{user?.email}</p>
          <button className="secondary-btn" onClick={logout} type="button">
            Sign out
          </button>
        </div>
      </aside>

      <main className="content-area">
        <header className="topbar">
          <div>
            <h2>Admin Panel</h2>
            <p>Secure controls for platform operations.</p>
          </div>
        </header>

        <section className="page-body">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
