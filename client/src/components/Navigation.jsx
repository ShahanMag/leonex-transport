import { Link } from 'react-router-dom';
import { useState } from 'react';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/rental-transaction', label: 'New Rental' },
    { path: '/companies', label: 'Companies' },
    { path: '/drivers', label: 'Drivers' },
    { path: '/loads', label: 'Rentals' },
    { path: '/payments', label: 'Payments' },
    { path: '/reports', label: 'Reports' },
  ];

  return (
    <nav className="bg-blue-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <img src="/Logo2.png" alt="EESA Transport" className="h-10 w-auto" />
          <span className="text-xl font-bold hidden sm:inline">EESA</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="hover:bg-blue-800 px-3 py-2 rounded transition"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMenu}
          className="md:hidden text-2xl"
        >
          ☰
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-blue-800">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="block px-4 py-2 hover:bg-blue-700 transition"
              onClick={() => setIsMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
