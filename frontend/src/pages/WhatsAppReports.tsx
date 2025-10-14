import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { X, Eye, Calendar, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Campaign {
  campaignId: string;
  campaignName: string;
  message: string;
  createdBy: string;
  mobileNumberCount: number;
  createdAt: string;
  image: string;
}

interface UserData {
  companyName: string;
  email: string;
  number: string;
  role: string;
  status: string;
  createdAt: string;
}

interface ReportsData {
  totalCampaigns: number;
  campaigns: Campaign[];
}

const WhatsAppReports = () => {
  const navigate = useNavigate();
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  // Fetch reports data
  const fetchReportsData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/dashboard/whatsapp-reports`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setReportsData(result.data);
        setUserData(result.userData);
      } else {
        setError(result.message || 'Failed to load reports data');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Reports fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchReportsData();
  }, [fetchReportsData]);

  // Filter campaigns by date range
  const getFilteredCampaigns = () => {
    if (!reportsData) return [];
    
    let filtered = reportsData.campaigns;
    
    if (startDate && endDate) {
      filtered = filtered.filter(campaign => {
        const campaignDate = new Date(campaign.createdAt);
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return campaignDate >= start && campaignDate <= end;
      });
    }
    
    return filtered;
  };

  const filteredCampaigns = getFilteredCampaigns();
  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCampaigns = filteredCampaigns.slice(startIndex, endIndex);

  // Reset to page 1 when items per page or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage, startDate, endDate]);

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd-MMM-yyyy hh:mm a');
    } catch {
      return dateString;
    }
  };

  // Truncate message
  const truncateMessage = (message: string, maxLength: number = 100) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-green-500',
      inactive: 'bg-red-500',
      deleted: 'bg-gray-500'
    };
    return badges[status.toLowerCase() as keyof typeof badges] || 'bg-gray-500';
  };

  // Open details modal
  const openDetailsModal = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setShowDetailsModal(true);
  };

  // Navigate to Send WhatsApp page
  const handleAddCampaign = () => {
    navigate('/send-whatsapp');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="p-8 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl">
          <p className="text-xl font-semibold text-black">Loading Reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl">
        <div>
          <h2 className="text-3xl font-bold text-black">WhatsApp Campaign Reports</h2>
          <p className="text-sm text-gray-600 mt-1">View all your sent campaigns</p>
        </div>
        
        {/* Add Campaign Button */}
        <button
          onClick={handleAddCampaign}
          className="flex items-center gap-2 px-6 py-3 bg-green-500/80 backdrop-blur-md text-white font-bold rounded-xl border border-white/30 shadow-lg hover:bg-green-600/80 transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Campaign
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-100/60 backdrop-blur-md rounded-xl border border-red-300 shadow-lg">
          <p className="text-red-700 font-semibold">{error}</p>
        </div>
      )}

      {/* Date Filter Section */}
      <div className="p-6 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-black" />
            <span className="text-sm font-bold text-black">Filter by Date:</span>
          </div>
          
          <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-xl border-2 border-white/80">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-black text-sm font-semibold focus:outline-none"
            />
            <span className="text-black font-bold">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-black text-sm font-semibold focus:outline-none"
            />
          </div>

          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
            className="px-4 py-2 bg-blue-500/60 backdrop-blur-md text-white font-semibold rounded-xl border border-white/30 hover:bg-blue-600/60 transition-all"
          >
            Reset Filter
          </button>

          <div className="ml-auto text-sm text-black font-semibold">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredCampaigns.length)} of {filteredCampaigns.length} campaigns
          </div>
        </div>
      </div>

      {/* Show Entries Selector */}
      <div className="flex items-center gap-3 p-4 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl">
        <span className="text-sm font-bold text-black">SHOW</span>
        <select
          value={itemsPerPage}
          onChange={(e) => setItemsPerPage(Number(e.target.value))}
          className="px-3 py-2 bg-white/60 backdrop-blur-sm border-2 border-white/80 rounded-xl text-black font-semibold focus:outline-none focus:border-green-500"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>
        <span className="text-sm font-bold text-black">ENTRIES</span>
      </div>

      {/* Campaigns Table */}
      <div className="p-6 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-white/60">
                <th className="text-left py-4 px-4 text-sm font-bold text-black uppercase">ID</th>
                <th className="text-left py-4 px-4 text-sm font-bold text-black uppercase">Campaign Name</th>
                <th className="text-left py-4 px-4 text-sm font-bold text-black uppercase">Message</th>
                <th className="text-left py-4 px-4 text-sm font-bold text-black uppercase">Created By</th>
                <th className="text-left py-4 px-4 text-sm font-bold text-black uppercase">Mobile Numbers</th>
                <th className="text-left py-4 px-4 text-sm font-bold text-black uppercase">Created At</th>
                <th className="text-left py-4 px-4 text-sm font-bold text-black uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-black opacity-70">
                    <p className="text-lg font-semibold">No campaigns found</p>
                    <p className="text-sm mt-2">Try adjusting your date filters</p>
                  </td>
                </tr>
              ) : (
                currentCampaigns.map((campaign, index) => (
                  <tr 
                    key={campaign.campaignId} 
                    className="border-b border-white/30 hover:bg-white/20 transition-all"
                  >
                    <td className="py-4 px-4 text-black font-semibold">
                      {startIndex + index + 1}
                    </td>
                    <td className="py-4 px-4 text-black font-semibold max-w-[200px]">
                      {campaign.campaignName}
                    </td>
                    <td className="py-4 px-4 text-black font-semibold max-w-[300px]">
                      <div className="line-clamp-2">
                        {truncateMessage(campaign.message, 80)}
                      </div>
                      {campaign.message.length > 80 && (
                        <button
                          onClick={() => openDetailsModal(campaign)}
                          className="text-green-600 font-bold text-sm mt-1 hover:underline"
                        >
                          Read More
                        </button>
                      )}
                    </td>
                    <td className="py-4 px-4 text-black font-semibold">
                      {campaign.createdBy}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="px-3 py-1 bg-blue-500 text-white text-sm font-bold rounded-full">
                        {campaign.mobileNumberCount}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-black font-semibold whitespace-nowrap text-sm">
                      {formatDate(campaign.createdAt)}
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => openDetailsModal(campaign)}
                        className="p-2 bg-green-500/60 backdrop-blur-sm rounded-lg hover:bg-green-600/60 transition-all"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4 text-white" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {filteredCampaigns.length > 0 && (
        <>
          <div className="text-sm text-black font-semibold p-4 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredCampaigns.length)} of {filteredCampaigns.length} entries
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white/60 backdrop-blur-sm rounded-lg border border-white/80 font-semibold text-black hover:bg-white/80 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-4 py-2 font-bold rounded-lg border-2 transition-all ${
                      currentPage === pageNum
                        ? 'bg-green-500 text-white border-green-600 shadow-lg'
                        : 'bg-white/60 text-black border-white/80 hover:bg-white/80'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white/60 backdrop-blur-sm rounded-lg border border-white/80 font-semibold text-black hover:bg-white/80 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Campaign Details Modal */}
      {showDetailsModal && selectedCampaign && userData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl border-2 border-green-500 shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-3xl font-bold text-black">Campaign Details</h3>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedCampaign(null);
                  }}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-all"
                >
                  <X className="w-6 h-6 text-black" />
                </button>
              </div>

              <div className="space-y-5">
                {/* USER DETAILS SECTION */}
                <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-400 shadow-lg">
                  <h4 className="text-xl font-bold text-blue-800 mb-4 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-600 animate-pulse"></div>
                    User Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-xs font-bold text-blue-700 uppercase">Company Name</span>
                      <p className="text-black font-bold text-lg mt-1">{userData.companyName}</p>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-blue-700 uppercase">Email</span>
                      <p className="text-black font-semibold break-all mt-1">{userData.email}</p>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-blue-700 uppercase">Phone</span>
                      <p className="text-black font-semibold mt-1">{userData.number}</p>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-blue-700 uppercase">Role</span>
                      <p className="text-black font-semibold uppercase mt-1">{userData.role}</p>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-blue-700 uppercase">Status</span>
                      <p className="mt-1">
                        <span className={`px-3 py-1 text-white text-xs font-bold rounded-full ${getStatusBadge(userData.status)}`}>
                          {userData.status.toUpperCase()}
                        </span>
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-blue-700 uppercase">Member Since</span>
                      <p className="text-black font-semibold text-sm mt-1">{formatDate(userData.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {/* CAMPAIGN DETAILS SECTION */}
                <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border-2 border-green-400 shadow-lg">
                  <h4 className="text-xl font-bold text-green-800 mb-4 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-600 animate-pulse"></div>
                    Campaign Information
                  </h4>
                  
                  {/* Campaign Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                    <div className="col-span-2 md:col-span-1">
                      <span className="text-xs font-bold text-green-700 uppercase">Campaign ID</span>
                      <p className="text-black font-mono text-sm break-all mt-1 bg-white px-3 py-2 rounded-lg">{selectedCampaign.campaignId}</p>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-green-700 uppercase">Campaign Name</span>
                      <p className="text-black font-bold text-lg mt-1">{selectedCampaign.campaignName}</p>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-green-700 uppercase">Created By</span>
                      <p className="text-black font-semibold mt-1">{selectedCampaign.createdBy}</p>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-green-700 uppercase">Recipients</span>
                      <p className="text-blue-600 font-bold text-2xl mt-1">{selectedCampaign.mobileNumberCount}</p>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-green-700 uppercase">Created At</span>
                      <p className="text-black font-semibold text-sm mt-1">{formatDate(selectedCampaign.createdAt)}</p>
                    </div>
                  </div>

                  {/* Campaign Media */}
                  {selectedCampaign.image && (
                    <div className="mb-5">
                      <span className="text-sm font-bold text-green-800 mb-3 block">📷 Campaign Media</span>
                      <div className="bg-white p-4 rounded-xl border-2 border-green-300 shadow-md">
                        <img 
                          src={selectedCampaign.image} 
                          alt="Campaign media"
                          className="w-full max-h-[400px] object-contain rounded-lg shadow-lg"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/600x400?text=Image+Not+Available';
                          }}
                        />
                        <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-600 break-all">
                            <span className="font-bold">📎 URL:</span> {selectedCampaign.image}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Campaign Message */}
                  <div>
                    <span className="text-sm font-bold text-green-800 mb-3 block">💬 Campaign Message</span>
                    <div className="bg-white p-5 rounded-xl border-2 border-green-300 shadow-md">
                      <p className="text-black text-base leading-relaxed whitespace-pre-wrap">{selectedCampaign.message}</p>
                    </div>
                  </div>
                </div>

                {/* STATS SUMMARY */}
                <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border-2 border-purple-400 shadow-lg">
                  <h4 className="text-xl font-bold text-purple-800 mb-4 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-600 animate-pulse"></div>
                    Campaign Statistics
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-5 bg-white rounded-xl shadow-md border-2 border-blue-200 hover:scale-105 transition-transform">
                      <p className="text-5xl font-bold text-blue-600">{selectedCampaign.mobileNumberCount}</p>
                      <p className="text-sm text-gray-700 font-bold mt-2 uppercase">Total Recipients</p>
                    </div>
                    <div className="text-center p-5 bg-white rounded-xl shadow-md border-2 border-green-200 hover:scale-105 transition-transform">
                      <p className="text-5xl font-bold text-green-600">{selectedCampaign.message.length}</p>
                      <p className="text-sm text-gray-700 font-bold mt-2 uppercase">Characters</p>
                    </div>
                    <div className="text-center p-5 bg-white rounded-xl shadow-md border-2 border-purple-200 hover:scale-105 transition-transform">
                      <p className="text-5xl font-bold text-purple-600">
                        {Math.ceil(selectedCampaign.message.length / 160)}
                      </p>
                      <p className="text-sm text-gray-700 font-bold mt-2 uppercase">SMS Parts</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="mt-6">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedCampaign(null);
                  }}
                  className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-lg rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default WhatsAppReports;
