import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';

interface UserData {
  _id: string;
  email: string;
  role: string;
  companyName: string;
  image?: string;
}

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

const Header = ({ onToggleSidebar, isSidebarOpen }: HeaderProps) => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserData(user);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  const handleLogout = async () => {
    const API_URL = import.meta.env.VITE_API_URL;

    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      localStorage.removeItem('user');
      navigate('/');
    }
  };

  return (
    <header className="w-full bg-white/30 backdrop-blur-xl border-b border-white/30 sticky top-0 z-50 shadow-lg">
      <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 py-3 md:py-4">
        
        {/* Left Side - Hamburger + Title */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile Hamburger Menu */}
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg bg-white/40 backdrop-blur-md border border-white/50 hover:bg-white/60 transition-all duration-300 active:scale-95"
            aria-label="Toggle menu"
          >
            {isSidebarOpen ? (
              <X className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
            ) : (
              <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
            )}
          </button>

          {/* Page Title */}
          <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-black">
            Dashboard
          </h1>
        </div>

        {/* Right Side - Profile & Logout */}
        <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
          
          {/* User Info Card (Hidden on mobile, visible on large screens) */}
          <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-white/40 backdrop-blur-md rounded-xl border border-white/50">
            <div className="text-right">
              <p className="text-xs font-semibold text-gray-600 uppercase">Welcome Back</p>
              <p className="text-sm font-bold text-black">{userData?.companyName || 'User'}</p>
            </div>
          </div>

          {/* Profile Picture */}
          <button
            onClick={() => navigate('/manage-business')}
            className="relative group flex-shrink-0"
            title="View Profile"
          >
            {userData?.image ? (
              <img
                src={userData.image}
                alt={userData.companyName || 'Profile'}
                className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full object-cover border-2 sm:border-4 border-green-500 shadow-xl hover:scale-110 hover:border-green-600 transition-all duration-300 cursor-pointer"
                onError={(e) => {
                  e.currentTarget.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(userData.companyName || 'User') + '&background=10b981&color=fff&size=128';
                }}
              />
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold text-base sm:text-lg md:text-xl shadow-xl hover:scale-110 transition-all duration-300 cursor-pointer border-2 sm:border-4 border-green-500">
                {userData?.companyName?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            
            {/* Hover Tooltip - Hidden on mobile */}
            <div className="hidden md:block absolute -bottom-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap pointer-events-none">
              Click to view profile
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-black rotate-45"></div>
            </div>
          </button>

          {/* Logout Button */}
          <button 
            onClick={handleLogout}
            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-gradient-to-r from-red-500 to-red-600 backdrop-blur-md rounded-lg md:rounded-xl border border-red-400 md:border-2 font-bold text-white text-sm sm:text-base hover:from-red-600 hover:to-red-700 hover:shadow-xl hover:scale-105 transition-all duration-300 active:scale-95"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
