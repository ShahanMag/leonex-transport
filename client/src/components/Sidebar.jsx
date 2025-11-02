import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/rental-transaction', label: 'New Rental', icon: '🚚', highlight: true },
    { path: '/companies', label: 'Companies', icon: '🏢' },
    { path: '/drivers', label: 'Drivers', icon: '👤' },
    { path: '/loads', label: 'Rentals', icon: '📦' },
    { path: '/payments', label: 'Payments', icon: '💰' },
    { path: '/reports', label: 'Reports', icon: '📈' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden bg-blue-700 text-white p-2 rounded-lg"
      >
        ☰
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-screen w-64 bg-gray-800 text-white shadow-xl
          transform transition-transform duration-300 ease-in-out z-40
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          md:relative md:translate-x-0
        `}
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-200">
          <Link to="/" className="flex items-center gap-3" onClick={() => setIsOpen(false)}>
            <img src="/leonex-logo.png" alt="Leonex" className="h-10 w-auto" />
            <span className="text-xl font-bold hidden sm:inline">Leonex</span>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200
                ${
                  isActive(item.path)
                    ? 'bg-white text-black shadow-lg'
                    : 'text-blue-100 hover:bg-blue-600 hover:text-white'
                }
              `}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
              {/* {item.highlight && (
                <span className="ml-auto text-xs bg-yellow-400 text-blue-700 px-2 py-1 rounded font-bold">
                  NEW
                </span>
              )} */}
            </Link>
          ))}
        </nav>

        {/* Footer Info */}
        <div className="px-4 py-4 border-t border-white">
          <p className="text-xs text-blue-200 text-center">
            Vehicle Rental Management System
          </p>
          <p className="text-xs text-blue-300 text-center mt-1">v2.1.0</p>
        </div>
      </aside>

      {/* Main Content Area - adjusted for sidebar */}
      <style>{`
        .sidebar-layout {
          display: flex;
          height: 100vh;
          overflow: hidden;
        }

        .sidebar-content {
          flex: 1;
          overflow-y-auto;
        }

        @media (max-width: 768px) {
          .sidebar-content {
            margin-left: 0;
          }
        }
      `}</style>
    </>
  );
}
