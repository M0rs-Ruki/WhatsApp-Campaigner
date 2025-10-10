const Footer = () => {
    const currentYear = new Date().getFullYear();
  
    return (
      <footer className="w-full bg-white border-t-4 border-black mt-auto">
        <div className="px-6 py-6">
          
          {/* Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            
            {/* Company Info */}
            <div className="p-4 bg-purple-300 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-xl font-black mb-2">WhatsApp Campaigner</h3>
              <p className="font-semibold">Powerful messaging at your fingertips</p>
            </div>
  
            {/* Quick Links */}
            <div className="p-4 bg-blue-300 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h4 className="text-lg font-black mb-2">Quick Links</h4>
              <ul className="space-y-1">
                <li><a href="/docs" className="font-bold underline hover:no-underline">Documentation</a></li>
                <li><a href="/support" className="font-bold underline hover:no-underline">Support</a></li>
                <li><a href="/api" className="font-bold underline hover:no-underline">API</a></li>
              </ul>
            </div>
  
            {/* Contact */}
            <div className="p-4 bg-pink-300 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h4 className="text-lg font-black mb-2">Contact</h4>
              <p className="font-semibold">support@example.com</p>
              <p className="font-semibold">+91 1234567890</p>
            </div>
          </div>
  
          {/* Copyright */}
          <div className="text-center py-4 border-t-3 border-black">
            <p className="font-bold">© {currentYear} WhatsApp Campaigner. All rights reserved.</p>
          </div>
        </div>
      </footer>
    );
  };
  
  export default Footer;
  