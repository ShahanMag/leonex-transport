import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const navigate = useNavigate();

  const settingsCards = [
    {
      title: 'Companies',
      description: 'Manage company records and details',
      icon: '🏢',
      color: 'bg-blue-500',
      path: '/companies',
    },
    {
      title: 'Drivers',
      description: 'Manage driver information and status',
      icon: '👤',
      color: 'bg-yellow-500',
      path: '/drivers',
    },
    {
      title: 'Users',
      description: 'Manage system users and permissions',
      icon: '👥',
      color: 'bg-purple-500',
      path: '/users',
    },
  ];

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Settings</h1>
        <p className="text-sm md:text-base text-gray-600 mt-2">
          Manage your system configuration and data
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsCards.map((card) => (
          <button
            key={card.path}
            onClick={() => navigate(card.path)}
            className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-200 p-6 text-left group hover:scale-105"
          >
            <div className={`${card.color} w-16 h-16 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <span className="text-3xl">{card.icon}</span>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{card.title}</h3>
            <p className="text-sm text-gray-600">{card.description}</p>
            <div className="mt-4 flex items-center text-blue-600 font-medium text-sm">
              <span>Manage</span>
              <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
