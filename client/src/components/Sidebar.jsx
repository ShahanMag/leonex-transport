import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Logo from "../assets/image.jpg";
import { showSuccess } from "../utils/toast";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  const navGroups = [
    {
      items: [
        { path: "/", label: "Dashboard", icon: "📊" },
        {
          path: "/rental-transaction",
          label: "New Rental",
          icon: "🚚",
          highlight: true,
        },
        { path: "/loads", label: "Rentals", icon: "📦" },
        { path: "/payments", label: "Payments", icon: "💰" },
        { path: "/reports", label: "Reports", icon: "📈" },
        { path: "/settings", label: "Settings", icon: "⚙️" },
      ],
    },
    {
      heading: "Financial",
      items: [
        { path: "/income-expense", label: "Income & Expense", icon: "💵" },
        { path: "/income-expense/report", label: "I&E Report", icon: "📊" },
      ],
    },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("username");
    showSuccess("Logged out successfully");
    navigate("/login");
  };

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
          flex flex-col
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          md:relative md:translate-x-0
        `}
      >
        {/* Logo Section */}
        <div className="border-b border-gray-700">
          <Link
            to="/"
            className="flex items-center justify-center rounded-lg"
            onClick={() => setIsOpen(false)}
          >
            <img
              src={Logo}
              alt="EESA"
              className="w-full h-24"
            />
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto min-h-0">
          {navGroups.map((group, gi) => (
            <div key={gi}>
              {group.heading && (
                <p className="mt-4 mb-1 px-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
                  {group.heading}
                </p>
              )}
              {group.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-200 text-sm
                    ${
                      isActive(item.path)
                        ? "bg-white text-gray-800 shadow-lg"
                        : "text-blue-100 hover:bg-blue-600 hover:text-white"
                    }
                  `}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer Info */}
        <div className="px-4 py-3 border-t border-gray-700 flex-shrink-0">
          {username && (
            <div className="mb-2">
              <p className="text-xs text-gray-300 text-center mb-2">
                👤 {username}
              </p>
              <button
                onClick={handleLogout}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          )}
          <p className="text-xs text-gray-400 text-center">
            Vehicle Rental Management
          </p>
          <p className="text-xs text-gray-500 text-center mt-0.5">v2.1.0</p>
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
