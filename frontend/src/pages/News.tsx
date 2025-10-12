import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { X, Plus, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getUserRole } from '../utils/Auth';
import { UserRole } from '../constants/Roles';

interface NewsItem {
  id: string;
  title: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface NewsData {
  totalNews: number;
  news: NewsItem[];
}

const News = () => {
  const [newsData, setNewsData] = useState<NewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
  });
  
  // Selected news for edit/delete
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
  const userRole = getUserRole();
  const isAdmin = userRole === UserRole.ADMIN;

  // Fetch news data
  const fetchNewsData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/dashboard/news`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setNewsData(result.data);
      } else {
        setError(result.message || 'Failed to load news data');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('News fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchNewsData();
  }, [fetchNewsData]);

  // Pagination calculations
  const totalPages = Math.ceil((newsData?.totalNews || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentNews = newsData?.news.slice(startIndex, endIndex) || [];

  // Reset to page 1 when items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd-MMM-yyyy hh:mm a');
    } catch {
      return dateString;
    }
  };

  // Handle create news
  const handleCreateNews = async () => {
    if (!formData.title || !formData.description) {
      setError('Please fill in all fields');
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/news/create`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess('News created successfully!');
        setShowCreateModal(false);
        setFormData({ title: '', description: '', status: 'ACTIVE' });
        fetchNewsData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message || 'Failed to create news');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle update news
  const handleUpdateNews = async () => {
    if (!selectedNews || !formData.title || !formData.description) {
      setError('Please fill in all fields');
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/news/update/${selectedNews.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess('News updated successfully!');
        setShowEditModal(false);
        setSelectedNews(null);
        setFormData({ title: '', description: '', status: 'ACTIVE' });
        fetchNewsData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message || 'Failed to update news');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle delete news
  const handleDeleteNews = async () => {
    if (!selectedNews) return;

    setActionLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/news/delete/${selectedNews.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess('News deleted successfully!');
        setShowDeleteModal(false);
        setSelectedNews(null);
        fetchNewsData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message || 'Failed to delete news');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open edit modal
  const openEditModal = (news: NewsItem) => {
    setSelectedNews(news);
    setFormData({
      title: news.title,
      description: news.description,
      status: news.status,
    });
    setShowEditModal(true);
  };

  // Open delete modal
  const openDeleteModal = (news: NewsItem) => {
    setSelectedNews(news);
    setShowDeleteModal(true);
  };

  // Open description modal
  const openDescriptionModal = (news: NewsItem) => {
    setSelectedNews(news);
    setShowDescriptionModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="p-8 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl">
          <p className="text-xl font-semibold text-black">Loading News...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl">
        <h2 className="text-3xl font-bold text-black">List of All News</h2>
        
        {/* Create News Button - Only for Admin */}
        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-green-500/80 backdrop-blur-md text-white font-bold rounded-xl border border-white/30 shadow-lg hover:bg-green-600/80 transition-all"
          >
            <Plus className="w-5 h-5" />
            Create New News
          </button>
        )}
      </div>

      {/* Success Message */}
      {success && (
        <div className="p-4 bg-green-500/30 backdrop-blur-md rounded-xl border border-white/50 shadow-lg">
          <p className="text-black font-semibold">{success}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-100/60 backdrop-blur-md rounded-xl border border-red-300 shadow-lg">
          <p className="text-red-700 font-semibold">{error}</p>
        </div>
      )}

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

      {/* News Table */}
      <div className="p-6 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-white/60">
                <th className="text-left py-4 px-4 text-sm font-bold text-black uppercase">ID</th>
                <th className="text-left py-4 px-4 text-sm font-bold text-black uppercase">Date</th>
                <th className="text-left py-4 px-4 text-sm font-bold text-black uppercase">Title</th>
                <th className="text-left py-4 px-4 text-sm font-bold text-black uppercase">Description</th>
                <th className="text-left py-4 px-4 text-sm font-bold text-black uppercase">Status</th>
                <th className="text-left py-4 px-4 text-sm font-bold text-black uppercase">Created By</th>
                {isAdmin && (
                  <th className="text-left py-4 px-4 text-sm font-bold text-black uppercase">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {currentNews.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="py-12 text-center text-black opacity-70">
                    <p className="text-lg font-semibold">No news available</p>
                  </td>
                </tr>
              ) : (
                currentNews.map((news, index) => (
                  <tr 
                    key={news.id} 
                    className="border-b border-white/30 hover:bg-white/20 transition-all"
                  >
                    <td className="py-4 px-4 text-black font-semibold">
                      {startIndex + index + 1}
                    </td>
                    <td className="py-4 px-4 text-black font-semibold whitespace-nowrap">
                      <div className="text-xs">
                        <div>Created: {formatDate(news.createdAt)}</div>
                        <div className="text-gray-600 mt-1">Updated: {formatDate(news.updatedAt)}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-black font-semibold max-w-[200px]">
                      {news.title}
                    </td>
                    <td className="py-4 px-4 text-black font-semibold max-w-[400px]">
                      <div className="line-clamp-3">
                        {news.description}
                      </div>
                      <button
                        onClick={() => openDescriptionModal(news)}
                        className="text-green-600 font-bold text-sm mt-1 hover:underline"
                      >
                        Read More
                      </button>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 text-white text-xs font-bold rounded-full ${
                        news.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {news.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-black font-semibold">
                      {news.createdBy}
                    </td>
                    {isAdmin && (
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(news)}
                            className="p-2 bg-blue-500/60 backdrop-blur-sm rounded-lg hover:bg-blue-600/60 transition-all"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4 text-white" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(news)}
                            className="p-2 bg-red-500/60 backdrop-blur-sm rounded-lg hover:bg-red-600/60 transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Info and Controls */}
      {newsData && newsData.totalNews > 0 && (
        <>
          <div className="text-sm text-black font-semibold p-4 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl">
            Showing {startIndex + 1} to {Math.min(endIndex, newsData.totalNews)} of {newsData.totalNews} entries
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

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 font-bold rounded-lg border-2 transition-all ${
                    currentPage === page
                      ? 'bg-green-500 text-white border-green-600 shadow-lg'
                      : 'bg-white/60 text-black border-white/80 hover:bg-white/80'
                  }`}
                >
                  {page}
                </button>
              ))}

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

      {/* Create News Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl border-2 border-green-500 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-black">Create New News</h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ title: '', description: '', status: 'ACTIVE' });
                    setError('');
                  }}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-all"
                >
                  <X className="w-6 h-6 text-black" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-black mb-2">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 bg-white/60 border-2 border-gray-300 rounded-xl text-black focus:outline-none focus:border-green-500"
                    placeholder="Enter news title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-black mb-2">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-3 bg-white/60 border-2 border-gray-300 rounded-xl text-black focus:outline-none focus:border-green-500 resize-none"
                    placeholder="Enter news description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-black mb-2">Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                    className="w-full px-4 py-3 bg-white/60 border-2 border-gray-300 rounded-xl text-black font-semibold focus:outline-none focus:border-green-500"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleCreateNews}
                    disabled={actionLoading}
                    className="flex-1 px-6 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-all disabled:opacity-50"
                  >
                    {actionLoading ? 'Creating...' : 'Create News'}
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setFormData({ title: '', description: '', status: 'ACTIVE' });
                      setError('');
                    }}
                    className="flex-1 px-6 py-3 bg-gray-300 text-black font-bold rounded-xl hover:bg-gray-400 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit News Modal */}
      {showEditModal && selectedNews && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl border-2 border-blue-500 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-black">Edit News</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedNews(null);
                    setFormData({ title: '', description: '', status: 'ACTIVE' });
                    setError('');
                  }}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-all"
                >
                  <X className="w-6 h-6 text-black" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-black mb-2">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 bg-white/60 border-2 border-gray-300 rounded-xl text-black focus:outline-none focus:border-blue-500"
                    placeholder="Enter news title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-black mb-2">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-3 bg-white/60 border-2 border-gray-300 rounded-xl text-black focus:outline-none focus:border-blue-500 resize-none"
                    placeholder="Enter news description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-black mb-2">Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                    className="w-full px-4 py-3 bg-white/60 border-2 border-gray-300 rounded-xl text-black font-semibold focus:outline-none focus:border-blue-500"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleUpdateNews}
                    disabled={actionLoading}
                    className="flex-1 px-6 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-all disabled:opacity-50"
                  >
                    {actionLoading ? 'Updating...' : 'Update News'}
                  </button>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedNews(null);
                      setFormData({ title: '', description: '', status: 'ACTIVE' });
                      setError('');
                    }}
                    className="flex-1 px-6 py-3 bg-gray-300 text-black font-bold rounded-xl hover:bg-gray-400 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedNews && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl border-2 border-red-500 shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-black mb-4">Delete News</h3>
              <p className="text-black mb-6">
                Are you sure you want to delete this news? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteNews}
                  disabled={actionLoading}
                  className="flex-1 px-6 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all disabled:opacity-50"
                >
                  {actionLoading ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedNews(null);
                  }}
                  className="flex-1 px-6 py-3 bg-gray-300 text-black font-bold rounded-xl hover:bg-gray-400 transition-all"
                >
                  No, Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Description Modal */}
      {showDescriptionModal && selectedNews && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl border-2 border-green-500 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-black">{selectedNews.title}</h3>
                <button
                  onClick={() => {
                    setShowDescriptionModal(false);
                    setSelectedNews(null);
                  }}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-all"
                >
                  <X className="w-6 h-6 text-black" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-bold text-gray-600">Created: </span>
                  <span className="text-sm text-black">{formatDate(selectedNews.createdAt)}</span>
                </div>
                <div>
                  <span className="text-sm font-bold text-gray-600">Updated: </span>
                  <span className="text-sm text-black">{formatDate(selectedNews.updatedAt)}</span>
                </div>
                <div>
                  <span className="text-sm font-bold text-gray-600">Created By: </span>
                  <span className="text-sm text-black">{selectedNews.createdBy}</span>
                </div>
                <div>
                  <span className="text-sm font-bold text-gray-600">Status: </span>
                  <span className={`px-3 py-1 text-white text-xs font-bold rounded-full ${
                    selectedNews.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {selectedNews.status}
                  </span>
                </div>
              </div>
              <div className="mt-6">
                <h4 className="text-lg font-bold text-black mb-2">Description:</h4>
                <p className="text-black whitespace-pre-wrap">{selectedNews.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default News;
