import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError } from '../utils/toast';
import { userAPI } from '../services/api';
import Logo from '../assets/image.jpg';

export default function Login() {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.username || !formData.password) {
      showError('Please enter username and password');
      return;
    }

    setIsLoading(true);

    try {
      const response = await userAPI.login(formData);

      // Store token and user info in localStorage
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('username', response.data.user.username);
      localStorage.setItem('userRole', response.data.user.role);

      showSuccess('Login successful!');
      navigate('/');
    } catch (error) {
      showError(error.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src={Logo} alt="EESA" className="w-32 object-contain" />
        </div>

        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Welcome Back
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Sign in to EESA Transport System
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Username
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your username"
              disabled={isLoading}
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:bg-gray-400"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p className="font-semibold mb-1">Default Accounts:</p>
          <p>superadmin / 123456789</p>
          <p>admin / 123456789</p>
        </div>
      </div>
    </div>
  );
}
