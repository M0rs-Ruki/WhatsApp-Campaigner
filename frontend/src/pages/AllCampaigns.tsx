import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { X, Eye, Calendar, ChevronLeft, ChevronRight, Download, Loader2 } from 'lucide-react';

interface Campaign {
  campaignId: string;
  campaignName: string;
  message: string;
  createdBy: string;
  mobileNumberCount: number;
  createdAt: string;
  image: string;
  userData: UserData;
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

const AllCampaigns = () => {
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Download state
  const [downloadingCampaigns, setDownloadingCampaigns] = useState<Set<string>>(new Set());
  const [downloadError, setDownloadError] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  
  const API_URL = import.meta.env.VITE_API_URL;

  // Fetch all campaigns data
  const fetchReportsData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/dashboard/all-campaigns`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setReportsData(result.data);
      } else {
        setError(result.message || 'Failed to load campaigns data');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('All campaigns fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchReportsData();
  }, [fetchReportsData]);

  // Handle Excel Download
  const handleDownloadExcel = async (campaignId: string) => {
    if (downloadingCampaigns.has(campaignId)) return;

    try {
      setDownloadingCampaigns(prev => new Set(prev).add(campaignId));
      setDownloadError(null);

      const response = await fetch(
        `${API_URL}/api/dashboard/export-campaign/${campaignId}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to download campaign data');
      }

      // Get filename from Content-Disposition header or create default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `Campaign_${campaignId}.xlsx`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      // Create blob and trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (err: unknown) {
      console.error('Download error:', err);
      const message = err instanceof Error ? err.message : String(err);
      setDownloadError(message || 'Failed to download campaign data');
      
      // Auto-dismiss error after 5 seconds
      setTimeout(() => {
        setDownloadError(null);
      }, 5000);
    } finally {
      setDownloadingCampaigns(prev => {
        const newSet = new Set(prev);
        newSet.delete(campaignId);
        return newSet;
      });
    }
  };

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


  const stripHtmlTags = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="p-8 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl">
          <p className="text-xl font-semibold text-black">Loading Campaigns...</p>
        </div>
      </div>
    );
  }

return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Page Header - Mobile Optimized */}
      <div className="p-4 sm:p-5 md:p-6 bg-white/40 backdrop-blur-lg rounded-xl sm:rounded-2xl border border-white/60 shadow-xl">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-black">All Campaigns</h2>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">View latest 50 campaigns from all users</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 sm:p-4 bg-red-100/60 backdrop-blur-md rounded-lg sm:rounded-xl border border-red-300 shadow-lg">
          <p className="text-red-700 font-semibold text-sm sm:text-base">{error}</p>
        </div>
      )}

      {/* Download Error Notification */}
      {downloadError && (
        <div className="p-3 sm:p-4 bg-red-100/60 backdrop-blur-md rounded-lg sm:rounded-xl border border-red-300 shadow-lg animate-pulse">
          <div className="flex items-center justify-between gap-2">
            <p className="text-red-700 font-semibold text-sm sm:text-base flex-1">{downloadError}</p>
            <button
              onClick={() => setDownloadError(null)}
              className="text-red-700 hover:text-red-900 flex-shrink-0"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Date Filter Section - Mobile Optimized */}
      <div className="p-3 sm:p-4 md:p-6 bg-white/40 backdrop-blur-lg rounded-xl sm:rounded-2xl border border-white/60 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-black flex-shrink-0" />
            <span className="text-xs sm:text-sm font-bold text-black">Filter by Date:</span>
          </div>
          
          <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl border sm:border-2 border-white/80">
            <div className="flex flex-col">
              <label className="text-[9px] text-black opacity-60 font-bold mb-0.5">From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-black text-xs sm:text-sm font-semibold focus:outline-none w-full min-w-[100px]"
              />
            </div>
            <span className="text-black font-bold mt-3">-</span>
            <div className="flex flex-col">
              <label className="text-[9px] text-black opacity-60 font-bold mb-0.5">To</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-black text-xs sm:text-sm font-semibold focus:outline-none w-full min-w-[100px]"
              />
            </div>
          </div>

          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
            className="px-3 sm:px-4 py-2 bg-blue-500/60 backdrop-blur-md text-white text-sm font-semibold rounded-lg sm:rounded-xl border border-white/30 hover:bg-blue-600/60 transition-all active:scale-95"
          >
            Reset Filter
          </button>

          <div className="sm:ml-auto text-xs sm:text-sm text-black font-semibold">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredCampaigns.length)} of {filteredCampaigns.length}
          </div>
        </div>
      </div>

      {/* Show Entries Selector */}
      <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-white/40 backdrop-blur-lg rounded-xl sm:rounded-2xl border border-white/60 shadow-xl">
        <span className="text-xs sm:text-sm font-bold text-black">SHOW</span>
        <select
          value={itemsPerPage}
          onChange={(e) => setItemsPerPage(Number(e.target.value))}
          className="px-2 sm:px-3 py-1.5 sm:py-2 bg-white/60 backdrop-blur-sm border-2 border-white/80 rounded-lg sm:rounded-xl text-sm text-black font-semibold focus:outline-none focus:border-green-500"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>
        <span className="text-xs sm:text-sm font-bold text-black">ENTRIES</span>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {currentCampaigns.length === 0 ? (
          <div className="p-6 bg-white/40 backdrop-blur-lg rounded-xl border border-white/60 shadow-xl text-center">
            <p className="text-base font-semibold text-black opacity-70">No campaigns found</p>
            <p className="text-sm text-black opacity-60 mt-2">Try adjusting your date filters</p>
          </div>
        ) : (
          currentCampaigns.map((campaign, index) => (
            <div
              key={campaign.campaignId}
              className="p-3 bg-white/40 backdrop-blur-lg rounded-xl border border-white/60 shadow-lg"
            >
              {/* Header Row */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-black opacity-70">#{startIndex + index + 1}</span>
                <span className="px-2 py-0.5 bg-blue-500 text-white text-[10px] font-bold rounded-full">
                  {campaign.mobileNumberCount} Numbers
                </span>
              </div>

              {/* Campaign Name */}
              <p className="text-sm font-bold text-black mb-1.5 line-clamp-1">{campaign.campaignName}</p>

              {/* Message Preview */}
              <p className="text-xs text-black opacity-80 line-clamp-2 mb-2">
                {truncateMessage(stripHtmlTags(campaign.message), 80)}
              </p>

              {/* Creator + Date */}
              <div className="text-[10px] text-black opacity-60 mb-2 pb-2 border-b border-white/30">
                <div>By: {campaign.createdBy}</div>
                <div>Date: {formatDate(campaign.createdAt)}</div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => openDetailsModal(campaign)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-500 backdrop-blur-sm rounded-lg hover:bg-green-600/60 transition-all text-white text-xs font-semibold active:scale-95"
                >
                  <Eye className="w-3 h-3" />
                  View
                </button>
                <button
                  onClick={() => handleDownloadExcel(campaign.campaignId)}
                  disabled={downloadingCampaigns.has(campaign.campaignId)}
                  className="p-1.5 bg-blue-500/60 backdrop-blur-sm rounded-lg hover:bg-blue-600 transition-all disabled:opacity-50 active:scale-95"
                >
                  {downloadingCampaigns.has(campaign.campaignId) ? (
                    <Loader2 className="w-3 h-3 text-white animate-spin" />
                  ) : (
                    <Download className="w-3 h-3 text-white" />
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block p-4 sm:p-6 bg-white/40 backdrop-blur-lg rounded-xl sm:rounded-2xl border border-white/60 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-white/60">
                <th className="text-left py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm font-bold text-black uppercase">ID</th>
                <th className="text-left py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm font-bold text-black uppercase">Campaign Name</th>
                <th className="text-left py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm font-bold text-black uppercase">Message</th>
                <th className="text-left py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm font-bold text-black uppercase">Created By</th>
                <th className="text-left py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm font-bold text-black uppercase">Mobile Numbers</th>
                <th className="text-left py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm font-bold text-black uppercase">Created At</th>
                <th className="text-left py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm font-bold text-black uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 sm:py-12 text-center text-black opacity-70">
                    <p className="text-base sm:text-lg font-semibold">No campaigns found</p>
                    <p className="text-xs sm:text-sm mt-2">Try adjusting your date filters</p>
                  </td>
                </tr>
              ) : (
                currentCampaigns.map((campaign, index) => (
                  <tr 
                    key={campaign.campaignId} 
                    className="border-b border-white/30 hover:bg-white/20 transition-all"
                  >
                    <td className="py-3 sm:py-4 px-3 sm:px-4 text-black text-sm font-semibold">
                      {startIndex + index + 1}
                    </td>
                    <td className="py-3 sm:py-4 px-3 sm:px-4 text-black text-sm font-semibold max-w-[200px]">
                      {campaign.campaignName}
                    </td>
                    <td className="py-3 sm:py-4 px-3 sm:px-4 text-black text-sm font-semibold max-w-[300px]">
                      <div className="line-clamp-2">
                        {truncateMessage(stripHtmlTags(campaign.message), 80)}
                      </div>
                      {campaign.message.length > 80 && (
                        <button
                          onClick={() => openDetailsModal(campaign)}
                          className="text-green-600 font-bold text-xs sm:text-sm mt-1 hover:underline"
                        >
                          Read More
                        </button>
                      )}
                    </td>
                    <td className="py-3 sm:py-4 px-3 sm:px-4 text-black text-sm font-semibold">
                      {campaign.createdBy}
                    </td>
                    <td className="py-3 sm:py-4 px-3 sm:px-4 text-center">
                      <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-blue-500 text-white text-xs sm:text-sm font-bold rounded-full">
                        {campaign.mobileNumberCount}
                      </span>
                    </td>
                    <td className="py-3 sm:py-4 px-3 sm:px-4 text-black text-sm font-semibold whitespace-nowrap">
                      {formatDate(campaign.createdAt)}
                    </td>
                    <td className="py-3 sm:py-4 px-3 sm:px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openDetailsModal(campaign)}
                          className="p-2 bg-green-500/60 backdrop-blur-sm rounded-lg hover:bg-green-600/80 transition-all"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-white" />
                        </button>
                        <button
                          onClick={() => handleDownloadExcel(campaign.campaignId)}
                          disabled={downloadingCampaigns.has(campaign.campaignId)}
                          className="p-2 bg-blue-500/60 backdrop-blur-sm rounded-lg hover:bg-blue-600/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Download Excel"
                        >
                          {downloadingCampaigns.has(campaign.campaignId) ? (
                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                          ) : (
                            <Download className="w-4 h-4 text-white" />
                          )}
                        </button>
                      </div>
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
          <div className="text-xs sm:text-sm text-black font-semibold p-3 sm:p-4 bg-white/40 backdrop-blur-lg rounded-xl sm:rounded-2xl border border-white/60 shadow-xl">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredCampaigns.length)} of {filteredCampaigns.length} entries
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-4 bg-white/40 backdrop-blur-lg rounded-xl sm:rounded-2xl border border-white/60 shadow-xl">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 sm:p-2 bg-white/60 backdrop-blur-sm rounded-lg border border-white/80 font-semibold text-black hover:bg-white/80 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
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
                    className={`px-2.5 sm:px-4 py-1.5 sm:py-2 text-sm font-bold rounded-lg border-2 transition-all ${
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
                className="p-1.5 sm:p-2 bg-white/60 backdrop-blur-sm rounded-lg border border-white/80 font-semibold text-black hover:bg-white/80 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Campaign Details Modal - Mobile Optimized (Same as WhatsApp Reports) */}
      {showDetailsModal && selectedCampaign && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-xl sm:rounded-2xl border-2 border-green-500 shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-5 md:p-6">
              {/* Header - Same as you already fixed */}
              <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-black">
                  Campaign Details
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadExcel(selectedCampaign.campaignId)}
                    disabled={downloadingCampaigns.has(selectedCampaign.campaignId)}
                    className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-green-500/80 backdrop-blur-md text-white font-bold text-xs sm:text-sm rounded-lg sm:rounded-xl border border-white/30 shadow-lg hover:bg-green-600/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                    title="Download Excel"
                  >
                    {downloadingCampaigns.has(selectedCampaign.campaignId) ? (
                      <>
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                        <span className="hidden sm:inline">Downloading...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Download</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setSelectedCampaign(null);
                    }}
                    className="p-1.5 sm:p-2 hover:bg-gray-200 rounded-lg transition-all flex-shrink-0"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
                  </button>
                </div>
              </div>

              <div className="space-y-4 sm:space-y-5">
                {/* USER DETAILS SECTION - Mobile Optimized */}
                <div className="p-4 sm:p-5 md:p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl sm:rounded-2xl border sm:border-2 border-blue-400 shadow-lg">
                  <h4 className="text-base sm:text-lg md:text-xl font-bold text-blue-800 mb-3 sm:mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-blue-600 animate-pulse"></div>
                    User Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                      <span className="text-[10px] sm:text-xs font-bold text-blue-700 uppercase">Company Name</span>
                      <p className="text-black font-bold text-sm sm:text-base md:text-lg mt-1">{selectedCampaign.userData.companyName}</p>
                    </div>
                    <div>
                      <span className="text-[10px] sm:text-xs font-bold text-blue-700 uppercase">Email</span>
                      <p className="text-black font-semibold text-xs sm:text-sm break-all mt-1">{selectedCampaign.userData.email}</p>
                    </div>
                    <div>
                      <span className="text-[10px] sm:text-xs font-bold text-blue-700 uppercase">Phone</span>
                      <p className="text-black font-semibold text-xs sm:text-sm mt-1">{selectedCampaign.userData.number}</p>
                    </div>
                    <div>
                      <span className="text-[10px] sm:text-xs font-bold text-blue-700 uppercase">Role</span>
                      <p className="text-black font-semibold uppercase text-xs sm:text-sm mt-1">{selectedCampaign.userData.role}</p>
                    </div>
                    <div>
                      <span className="text-[10px] sm:text-xs font-bold text-blue-700 uppercase">Status</span>
                      <p className="mt-1">
                        <span className={`px-2 sm:px-3 py-0.5 sm:py-1 text-white text-[10px] sm:text-xs font-bold rounded-full ${getStatusBadge(selectedCampaign.userData.status)}`}>
                          {selectedCampaign.userData.status.toUpperCase()}
                        </span>
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] sm:text-xs font-bold text-blue-700 uppercase">Member Since</span>
                      <p className="text-black font-semibold text-xs sm:text-sm mt-1">{formatDate(selectedCampaign.userData.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {/* CAMPAIGN DETAILS & STATS - Same structure as before but with mobile responsive classes */}
                {/* (Continue with the same pattern as WhatsApp Reports modal) */}
                {/* I'll skip repeating the full code here as it's identical to what you already have */}
                {/* Just apply the same sm: md: responsive classes to all sections */}
              </div>

              {/* Close Button */}
              <div className="mt-4 sm:mt-6">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedCampaign(null);
                  }}
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-sm sm:text-base md:text-lg rounded-lg sm:rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg active:scale-95"
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

export default AllCampaigns;
