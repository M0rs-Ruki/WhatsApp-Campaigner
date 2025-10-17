const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-white/30 backdrop-blur-xl border-t border-white/30 mt-auto">
      <div className="px-3 sm:px-4 md:px-6 py-4 sm:py-5 md:py-6">
        
        {/* Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 mb-4 sm:mb-5 md:mb-6">
          
          {/* Company Info */}
          <div className="p-4 sm:p-5 md:p-6 bg-white/40 backdrop-blur-md rounded-xl sm:rounded-2xl border border-white/50 shadow-lg">
            <h3 className="text-lg sm:text-xl font-bold text-black mb-1 sm:mb-2">
              WhatsApp Campaigner
            </h3>
            <p className="font-medium text-sm sm:text-base text-black opacity-80">
              Powerful messaging at your fingertips
            </p>
          </div>

          {/* Quick Links */}
          <div className="p-4 sm:p-5 md:p-6 bg-green-500/20 backdrop-blur-md rounded-xl sm:rounded-2xl border border-white/50 shadow-lg">
            <h4 className="text-base sm:text-lg font-bold text-black mb-2 sm:mb-3">
              Quick Links
            </h4>
            <ul className="space-y-1.5 sm:space-y-2">
              <li>
                <a href="/docs" className="font-semibold text-sm sm:text-base text-black hover:underline transition-all">
                  Documentation
                </a>
              </li>
              <li>
                <a href="/support" className="font-semibold text-sm sm:text-base text-black hover:underline transition-all">
                  Support
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="p-4 sm:p-5 md:p-6 bg-white/40 backdrop-blur-md rounded-xl sm:rounded-2xl border border-white/50 shadow-lg sm:col-span-2 lg:col-span-1">
            <h4 className="text-base sm:text-lg font-bold text-black mb-2 sm:mb-3">
              Contact
            </h4>
            <p className="font-semibold text-sm sm:text-base text-black break-all">
              support@example.com
            </p>
            <p className="font-semibold text-sm sm:text-base text-black">
              +91 1234567890
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center py-3 sm:py-4 border-t border-white/20">
          <p className="font-semibold text-xs sm:text-sm md:text-base text-black">
            © {currentYear} WhatsApp Campaigner. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
