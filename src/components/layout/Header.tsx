import { useAuth } from '@/hooks/useAuth';
import { logOut } from '@/services/auth';
import { useNavigate, useLocation } from 'react-router-dom';

export function Header() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logOut();
    navigate('/login');
  };

  const isStatsPage = location.pathname === '/stats';

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
      <h1
        className="text-lg font-bold text-green-700 cursor-pointer"
        onClick={() => navigate('/')}
      >
        Focus Timer
      </h1>
      {user && (
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(isStatsPage ? '/' : '/stats')}
            className="text-sm text-green-600 hover:text-green-700 active:text-green-800 font-medium"
          >
            {isStatsPage ? 'Timer' : 'Stats'}
          </button>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-700 active:text-gray-900"
          >
            Logout
          </button>
        </div>
      )}
    </header>
  );
}
