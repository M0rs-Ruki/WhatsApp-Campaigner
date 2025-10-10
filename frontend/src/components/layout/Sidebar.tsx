
import { Link, useLocation } from 'react-router-dom';

interface MenuItem {
  label: string;
  path: string;
}

interface MenuSection {
  title?: string;
  items: MenuItem[];
}

const Sidebar = () => {
  const location = useLocation();
  const activeItem = location.pathname;

  const menuSections: MenuSection[] = [
    {
      items: [
        { label: 'Dashboard', path: '/home' },
        { label: 'Send Whatsapp', path: '/send-whatsapp' },
        { label: 'Credits', path: '/credits' },
      ]
    },
    {
      title: 'RESELLERS & USERS',
      items: [
        { label: 'Manage Reseller', path: '/manage-reseller' },
        { label: 'Manage Users', path: '/manage-users' },
      ]
    },
    {
      title: 'REPORTS',
      items: [
        { label: 'Credit Reports', path: '/credit-reports' },
        { label: 'WhatsApp Report', path: '/whatsapp-report' },
      ]
    },
    {
      title: 'OTHERS',
      items: [
        { label: 'News', path: '/news' },
        { label: 'Tree View', path: '/tree-view' },
        { label: 'Complaints', path: '/complaints' },
        { label: 'Manage Business', path: '/manage-business' },
      ]
    },
  ];

  return (
    <aside className="w-64 min-h-screen bg-white/20 backdrop-blur-xl border-r border-white/30 p-4">
      
      {/* Logo/Brand with Glass Effect */}
      <div className="mb-8 p-4 bg-green-500/30 backdrop-blur-md rounded-2xl border border-white/40 shadow-lg">
        <h1 className="text-xl font-bold text-black">WhatsApp Campaign</h1>
      </div>

      {/* Navigation Sections */}
      <nav className="space-y-6">
        {menuSections.map((section, sectionIndex) => (
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
