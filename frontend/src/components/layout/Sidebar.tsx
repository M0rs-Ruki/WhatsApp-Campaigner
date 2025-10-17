import { Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { menuConfig, type MenuSection } from '../../constants/Roles';
import { getUserRole } from '../../utils/Auth';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const location = useLocation();
  const activeItem = location.pathname;
  const userRole = getUserRole();

  const getFilteredMenuSections = (): MenuSection[] => {
    if (!userRole) return [];

    return menuConfig
      .map(section => ({
        ...section,
        items: section.items.filter(item => 
          item.allowedRoles.includes(userRole)
        )
      }))
      .filter(section => section.items.length > 0);
  };

  const filteredMenuSections = getFilteredMenuSections();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar - Fixed on Desktop */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50
          w-64 sm:w-72 lg:w-64
          h-screen
          bg-white/20 backdrop-blur-xl border-r border-white/30
          p-3 sm:p-4
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          overflow-y-auto
          lg:flex-shrink-0
        `}
      >
        
        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          className="lg:hidden absolute top-4 right-4 p-2 rounded-lg bg-red-500/30 backdrop-blur-md border border-white/40 hover:bg-red-500/50 transition-all duration-300 z-10"
          aria-label="Close menu"
        >
          <X className="w-5 h-5 text-black" />
        </button>

        {/* Logo/Brand */}
        <div className="mb-6 sm:mb-8 p-3 sm:p-4 bg-green-500/30 backdrop-blur-md rounded-xl sm:rounded-2xl border border-white/40 shadow-lg">
          <h1 className="text-base sm:text-lg md:text-xl font-bold text-black leading-tight">
            WhatsApp Campaign
          </h1>
        </div>

        {/* Navigation Sections */}
        <nav className="space-y-4 sm:space-y-6 pb-6">
          {filteredMenuSections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              
              {/* Section Title */}
              {section.title && (
                <h2 className="text-xs font-bold text-black mb-2 sm:mb-3 px-2 uppercase tracking-wider opacity-70">
                  {section.title}
                </h2>
              )}

              {/* Menu Items */}
              <ul className="space-y-1.5 sm:space-y-2">
                {section.items.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={onClose}
                      className={`
                        block px-3 sm:px-4 py-2.5 sm:py-3 font-semibold text-sm sm:text-base text-black rounded-lg sm:rounded-xl transition-all duration-300
                        ${activeItem === item.path
                          ? 'bg-green-500/40 backdrop-blur-md border border-white/50 shadow-lg'
                          : 'bg-white/10 backdrop-blur-sm border border-transparent hover:bg-white/30 hover:backdrop-blur-md hover:border-white/40 hover:shadow-md active:scale-95'
                        }
                      `}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
