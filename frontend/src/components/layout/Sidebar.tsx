import { Link, useLocation } from 'react-router-dom';
import { menuConfig, type MenuSection } from '../../constants/Roles';
// import { type MenuItem } from '../../constants/Roles';
import { getUserRole } from '../../utils/Auth';

const Sidebar = () => {
  const location = useLocation();
  const activeItem = location.pathname;
  const userRole = getUserRole();

  // Filter menu items based on user role
  const getFilteredMenuSections = (): MenuSection[] => {
    if (!userRole) return [];

    return menuConfig
      .map(section => ({
        ...section,
        items: section.items.filter(item => 
          item.allowedRoles.includes(userRole)
        )
      }))
      .filter(section => section.items.length > 0); // Remove empty sections
  };

  const filteredMenuSections = getFilteredMenuSections();

  return (
    <aside className="w-64 min-h-screen bg-white/20 backdrop-blur-xl border-r border-white/30 p-4">
      
      {/* Logo/Brand with Glass Effect */}
      <div className="mb-8 p-4 bg-green-500/30 backdrop-blur-md rounded-2xl border border-white/40 shadow-lg">
        <h1 className="text-xl font-bold text-black">WhatsApp Campaign</h1>
      </div>

      {/* Navigation Sections */}
      <nav className="space-y-6">
        {filteredMenuSections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            
            {/* Section Title */}
            {section.title && (
              <h2 className="text-xs font-bold text-black mb-3 px-2 uppercase tracking-wider opacity-70">
                {section.title}
              </h2>
            )}

            {/* Menu Items */}
            <ul className="space-y-2">
              {section.items.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`
                      block px-4 py-3 font-semibold text-black rounded-xl transition-all duration-300
                      ${activeItem === item.path
                        ? 'bg-green-500/40 backdrop-blur-md border border-white/50 shadow-lg'
                        : 'bg-white/10 backdrop-blur-sm border border-transparent hover:bg-white/30 hover:backdrop-blur-md hover:border-white/40 hover:shadow-md'
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
  );
};

export default Sidebar;
