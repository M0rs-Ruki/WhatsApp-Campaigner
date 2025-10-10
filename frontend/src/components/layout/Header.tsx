const Header = () => {
  return (
    <header className="w-full bg-white border-b-4 border-black">
      <div className="flex items-center justify-between px-6 py-4">
        
        {/* Page Title */}
        <div>
          <h1 className="text-3xl font-black">Dashboard</h1>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-4">
          
          {/* Credits Display */}
          <div className="px-4 py-2 bg-green-300 border-3 border-black font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            Credits: <span className="text-xl">1,250</span>
          </div>

          {/* User Profile */}
          <button className="px-6 py-2 bg-yellow-300 border-3 border-black font-bold hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
            Profile
          </button>

          {/* Logout Button */}
          <button className="px-6 py-2 bg-red-400 border-3 border-black font-bold hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
