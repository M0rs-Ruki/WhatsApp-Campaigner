import { useState } from 'react';

interface MenuItem {
  label: string;
  path: string;
  icon?: string;
}

interface MenuSection {
  title?: string;
  items: MenuItem[];
}

const Sidebar = () => {
  const [activeItem, setActiveItem] = useState('/dashboard');

  const menuSections: MenuSection[] = [
    {
      items: [
        { label: 'Dashboard', path: '/dashboard' },
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
    <aside className="w-64 min-h-screen bg-white border-r-4 border-black p-4">
      
      {/* Logo/Brand */}
      <div className="mb-8 p-4 bg-yellow-300 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h1 className="text-2xl font-black">WhatsApp Campaign</h1>
      </div>

      {/* Navigation Sections */}
      <nav className="space-y-6">
        {menuSections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            
            {/* Section Title */}
            {section.title && (
              <h2 className="text-xs font-bold text-gray-600 mb-2 px-2">
                {section.title}
              </h2>
            )}

            {/* Menu Items */}
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.path}>
                  <a
                    href={item.path}
                    onClick={() => setActiveItem(item.path)}
                    className={`
                      block px-4 py-3 font-bold border-2 border-black
                      transition-all duration-200
                      ${activeItem === item.path
                        ? 'bg-blue-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-0'
                        : 'bg-white hover:bg-pink-300 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]'
                      }
                    `}
                  >
                    {item.label}
                  </a>
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
