import { Outlet, NavLink } from 'react-router-dom';
import { BookOpen, Briefcase, Users, MessageCircle, LogOut, Film } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Layout() {
  const { user, logout } = useAuthStore();

  const navItems = [
    { path: '/learning', icon: BookOpen, label: 'Обучение' },
    { path: '/workspace', icon: Briefcase, label: 'Рабочее пространство' },
    { path: '/community', icon: Users, label: 'Сообщество' },
    { path: '/leisure', icon: Film, label: 'Досуг' },
    { path: '/chat', icon: MessageCircle, label: 'Чаты' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: '250px',
        background: '#fff',
        borderRight: '1px solid #e0e0e0',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <h1 style={{ marginBottom: '30px', fontSize: '24px', fontWeight: 'bold' }}>
          Platformа
        </h1>
        
        <nav style={{ flex: 1 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  marginBottom: '8px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  color: isActive ? '#6366f1' : '#333',
                  background: isActive ? '#eef2ff' : 'transparent',
                  fontWeight: isActive ? '600' : '400'
                })}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div style={{ padding: '12px', borderTop: '1px solid #e0e0e0' }}>
          <div style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '600' }}>
            {user?.name}
          </div>
          <button
            onClick={logout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              padding: '8px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#666',
              fontSize: '14px'
            }}
          >
            <LogOut size={16} />
            <span>Выйти</span>
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '30px', overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
