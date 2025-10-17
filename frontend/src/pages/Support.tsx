import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Phone, 
  User, 
  Shield, 
  HelpCircle, 
  MessageSquare, 
  ExternalLink,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface CreatorData {
  companyName: string;
  email: string;
  number: string;
  role: string;
  status: string;
  image?: string;
}

const Support = () => {
  const navigate = useNavigate();
  const [creatorData, setCreatorData] = useState<CreatorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_URL = import.meta.env.VITE_API_URL;

  // Fetch creator/support data
  useEffect(() => {
    const fetchSupportData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/dashboard/support`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const result = await response.json();

        if (response.ok && result.success) {
          setCreatorData(result.data);
        } else {
          setError(result.message || 'Failed to load support information');
        }
      } catch (err) {
        setError('Network error. Please try again.');
        console.error('Support fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSupportData();
  }, [API_URL]);

  // Get status badge color
  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-green-500',
      inactive: 'bg-red-500',
      deleted: 'bg-gray-500'
    };
    return badges[status.toLowerCase() as keyof typeof badges] || 'bg-gray-500';
  };

  // Get role badge color
  const getRoleBadge = (role: string) => {
    const badges = {
      admin: 'bg-purple-500',
      reseller: 'bg-blue-500',
      user: 'bg-green-500'
    };
    return badges[role.toLowerCase() as keyof typeof badges] || 'bg-gray-500';
  };

  // Navigate to complaints page
  const goToComplaints = () => {
    navigate('/complaints');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="p-8 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl">
          <p className="text-xl font-semibold text-black">Loading Support Information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="p-6 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-500 rounded-xl">
            <HelpCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-black">Support & Help</h2>
            <p className="text-sm text-gray-600 mt-1">Get assistance from your creator or platform support</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-100/60 backdrop-blur-md rounded-xl border border-red-300 shadow-lg">
          <p className="text-red-700 font-semibold">{error}</p>
        </div>
      )}

      {/* Section 1: Creator/Reseller Contact */}
      {creatorData && (
        <div className="bg-white/60 backdrop-blur-lg rounded-2xl border border-white/80 shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-500 rounded-xl">
              <User className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-black">Your Creator/Account Manager</h3>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border-2 border-blue-300 shadow-lg p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Creator Image */}
              <div className="flex-shrink-0">
                {creatorData.image ? (
                  <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-blue-500 shadow-xl">
                    <img 
                      src={creatorData.image} 
                      alt={creatorData.companyName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.innerHTML = `
                          <div class="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-4xl font-bold">
                            ${creatorData.companyName.charAt(0)}
                          </div>
                        `;
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-white text-5xl font-bold shadow-xl border-4 border-blue-500">
                    {creatorData.companyName.charAt(0)}
                  </div>
                )}
              </div>

              {/* Creator Details */}
              <div className="flex-1 space-y-4">
                {/* Name and Badges */}
                <div>
                  <h4 className="text-2xl font-bold text-gray-800 mb-2">{creatorData.companyName}</h4>
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-3 py-1 ${getRoleBadge(creatorData.role)} text-white text-xs font-bold rounded-full uppercase shadow-sm`}>
                      {creatorData.role}
                    </span>
                    <span className={`px-3 py-1 ${getStatusBadge(creatorData.status)} text-white text-xs font-bold rounded-full uppercase shadow-sm`}>
                      {creatorData.status}
                    </span>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-3">
                  {/* Email */}
                  <a
                    href={`mailto:${creatorData.email}`}
                    className="flex items-center gap-3 p-3 bg-white/80 rounded-xl hover:bg-white transition-all border-2 border-blue-200 shadow-sm group"
                  >
                    <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-all">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 font-bold uppercase">Email</p>
                      <p className="text-sm font-semibold text-gray-800">{creatorData.email}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-all" />
                  </a>

                  {/* Phone */}
                  <a
                    href={`tel:${creatorData.number}`}
                    className="flex items-center gap-3 p-3 bg-white/80 rounded-xl hover:bg-white transition-all border-2 border-green-200 shadow-sm group"
                  >
                    <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-all">
                      <Phone className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 font-bold uppercase">Phone</p>
                      <p className="text-sm font-semibold text-gray-800">{creatorData.number}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-green-600 transition-all" />
                  </a>
                </div>

                {/* Instructions */}
                <div className="bg-blue-100 border-l-4 border-blue-500 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-blue-800 mb-1">Need Help?</p>
                      <p className="text-xs text-gray-700 leading-relaxed">
                        Contact your {creatorData.role.toLowerCase()} for account-related queries, credits, campaign issues, or any assistance with the platform.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 2: Platform Support */}
      <div className="bg-white/60 backdrop-blur-lg rounded-2xl border border-white/80 shadow-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-purple-500 rounded-xl">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-black">Platform Support</h3>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-300 shadow-lg p-6 space-y-6">
          {/* Support Contact Info */}
          <div>
            <h4 className="text-lg font-bold text-purple-800 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Contact Platform Support
            </h4>
            
            <div className="space-y-3">
              {/* Platform Email */}
              <a
                href="mailto:support@prominds.digital"
                className="flex items-center gap-3 p-4 bg-white rounded-xl hover:bg-gray-50 transition-all border-2 border-purple-200 shadow-sm group"
              >
                <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-all">
                  <Mail className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-bold uppercase">Platform Email</p>
                  <p className="text-base font-bold text-gray-800">support@prominds.digital</p>
                  <p className="text-xs text-gray-600 mt-1">For technical and platform-related issues</p>
                </div>
                <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-all" />
              </a>

              {/* Platform Phone */}
              <a
                href="tel:+919876543210"
                className="flex items-center gap-3 p-4 bg-white rounded-xl hover:bg-gray-50 transition-all border-2 border-green-200 shadow-sm group"
              >
                <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-all">
                  <Phone className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-bold uppercase">Support Hotline</p>
                  <p className="text-base font-bold text-gray-800">+91 98765 43210</p>
                  <p className="text-xs text-gray-600 mt-1">Available Mon-Sat, 9 AM - 6 PM</p>
                </div>
                <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-all" />
              </a>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t-2 border-purple-200"></div>

          {/* Submit Complaint Section */}
          <div>
            <h4 className="text-lg font-bold text-purple-800 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Submit a Complaint
            </h4>

            <div className="bg-white rounded-xl p-5 border-2 border-purple-200 space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-bold text-gray-800 mb-1">File a Formal Complaint</p>
                  <p className="text-sm text-gray-600 leading-relaxed mb-3">
                    For issues requiring formal documentation and tracking, you can submit a complaint through our complaints system. Your complaint will be reviewed by the admin team and you'll receive updates on its status.
                  </p>
                  <button
                    onClick={goToComplaints}
                    className="flex items-center gap-2 px-5 py-3 bg-green-500/80 backdrop-blur-md text-white font-bold rounded-xl hover:bg-green-600/80 transition-all shadow-lg border border-white/30"
                  >
                    <MessageSquare className="w-5 h-5" />
                    Go to Complaints Page
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-purple-100 border-l-4 border-purple-500 p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-purple-800 mb-1">When to Contact Platform Support?</p>
                <ul className="text-xs text-gray-700 leading-relaxed space-y-1 ml-4 list-disc">
                  <li>Technical issues with the platform</li>
                  <li>Login or authentication problems</li>
                  <li>Bug reports or feature requests</li>
                  <li>Issues not resolved by your {creatorData?.role.toLowerCase()}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Help Tips */}
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl border-2 border-yellow-300 shadow-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-yellow-500 rounded-lg">
            <HelpCircle className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-yellow-800">Quick Help Tips</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 border-2 border-yellow-200">
            <p className="font-bold text-gray-800 mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Account & Credits
            </p>
            <p className="text-sm text-gray-600">Contact your {creatorData?.role.toLowerCase() || 'creator'} for balance, credits, or account status issues.</p>
          </div>

          <div className="bg-white rounded-xl p-4 border-2 border-yellow-200">
            <p className="font-bold text-gray-800 mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Technical Issues
            </p>
            <p className="text-sm text-gray-600">Reach out to platform support for bugs, errors, or technical problems.</p>
          </div>

          <div className="bg-white rounded-xl p-4 border-2 border-yellow-200">
            <p className="font-bold text-gray-800 mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Campaign Help
            </p>
            <p className="text-sm text-gray-600">Check the Documentation page for guides on creating and managing campaigns.</p>
          </div>

          <div className="bg-white rounded-xl p-4 border-2 border-yellow-200">
            <p className="font-bold text-gray-800 mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Formal Complaints
            </p>
            <p className="text-sm text-gray-600">Use the Complaints section (Others menu) for issues requiring formal tracking.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;
