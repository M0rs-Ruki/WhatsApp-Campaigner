import { useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const API_URL = import.meta.env.VITE_API_URL;

    try {
      // Call backend logout to clear cookie
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include', // Important: Include cookies in request
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      // Clear localStorage
      localStorage.removeItem('user');
      
      // Redirect to login
      navigate('/');
    }
  };

  return (
    <header className="w-full bg-white/30 backdrop-blur-xl border-b border-white/30 sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 py-4">
        
        {/* Page Title */}
        <div>
          <h1 className="text-3xl font-bold text-black">Dashboard</h1>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-4">
          
          {/* Credits Display */}
          <div className="px-5 py-2 bg-green-500/30 backdrop-blur-md rounded-xl border border-white/40 font-bold text-black shadow-lg">
            Credits: <span className="text-xl">1,250</span>
          </div>

          {/* User Profile Button */}
          <button 
            onClick={() => navigate('/manage-business')}
            className="px-6 py-2 bg-white/40 backdrop-blur-md rounded-xl border border-white/50 font-semibold text-black hover:bg-white/60 hover:shadow-lg transition-all">
            Profile
          </button>

          {/* Logout Button */}
          <button 
            onClick={handleLogout}
            className="px-6 py-2 bg-green-500/40 backdrop-blur-md rounded-xl border border-white/50 font-semibold text-black hover:bg-green-500/60 hover:shadow-lg transition-all"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
