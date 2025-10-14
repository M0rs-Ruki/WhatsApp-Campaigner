import { useState, useEffect, useCallback } from 'react';
import type { ChangeEvent } from 'react';
import { format } from 'date-fns';
import { X, Plus, Eye, Edit2, DollarSign, Minus, Lock, Unlock, Trash2 } from 'lucide-react';
import { getUserRole } from '../utils/Auth';
import { UserRole } from '../constants/Roles';

interface Reseller {
  id: string;
  companyName: string;
  email: string;
  number: string;
  role: string;
  resellerCount: number;
  userCount: number;
  totalCampaigns: number;
  balance: number;
  status: 'active' | 'inactive' | 'deleted';
  createdAt: string;
  image: string;
}

interface ResellersData {
  totalResellers: number;
  resellers: Reseller[];
}

const ManageReseller = () => {
  const [resellersData, setResellersData] = useState<ResellersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddCreditModal, setShowAddCreditModal] = useState(false);
  const [showRemoveCreditModal, setShowRemoveCreditModal] = useState(false);
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Form data
  const [createFormData, setCreateFormData] = useState({
    companyName: '',
    email: '',
    password: '',
    number: '',
    role: 'reseller',
    balance: '',
    image: null as File | null
  });
  
  const [editFormData, setEditFormData] = useState({
    companyName: '',
    email: '',
    number: '',
    password: '',
    confirmPassword: ''
  });
  
  
  const [creditAmount, setCreditAmount] = useState('');
  const [debitAmount, setDebitAmount] = useState('');
  
  // Selected reseller
  const [selectedReseller, setSelectedReseller] = useState<Reseller | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
  const userRole = getUserRole();
  const isAdminOrReseller = userRole === UserRole.ADMIN || userRole === UserRole.RESELLER;

  // Fetch resellers data
  const fetchResellersData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/dashboard/manage-reseller`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setResellersData(result.data);
      } else {
        setError(result.message || 'Failed to load resellers data');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Resellers fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchResellersData();
  }, [fetchResellersData]);

  // Pagination calculations
  const totalPages = Math.ceil((resellersData?.totalResellers || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentResellers = resellersData?.resellers.slice(startIndex, endIndex) || [];

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

  // Get status badge
  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-green-500',
      inactive: 'bg-red-500',
      deleted: 'bg-gray-500'
    };
    return badges[status as keyof typeof badges] || 'bg-gray-500';
  };

  // Handle create reseller/user
  const handleCreateUser = async () => {
    if (!createFormData.companyName || !createFormData.email || !createFormData.password || 
        !createFormData.number || !createFormData.balance || !createFormData.image) {
      setError('All fields are required including image');
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('companyName', createFormData.companyName);
      formData.append('email', createFormData.email);
      formData.append('password', createFormData.password);
      formData.append('number', createFormData.number);
      formData.append('role', createFormData.role);
      formData.append('balance', createFormData.balance);
      if (createFormData.image) {
        formData.append('image', createFormData.image);
      }

      const response = await fetch(`${API_URL}/api/user/create`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess(`${createFormData.role === 'reseller' ? 'Reseller' : 'User'} created successfully!`);
        setShowCreateModal(false);
        setCreateFormData({
          companyName: '',
          email: '',
          password: '',
          number: '',
          role: 'reseller',
          balance: '',
          image: null
        });
        fetchResellersData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message || 'Failed to create user');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle update reseller
  const handleUpdateReseller = async () => {
    if (!selectedReseller) return;
  
    const hasProfileUpdate = editFormData.companyName || editFormData.email || editFormData.number;
    const hasPasswordUpdate = editFormData.password || editFormData.confirmPassword;
  
    if (!hasProfileUpdate && !hasPasswordUpdate) {
      setError('Please provide at least one field to update');
      return;
    }
  
    // Validate password if provided
    if (hasPasswordUpdate) {
      if (!editFormData.password || !editFormData.confirmPassword) {
        setError('Please fill in both password fields');
        return;
      }
  
      if (editFormData.password !== editFormData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
  
      if (editFormData.password.length < 3) {
        setError('Password must be at least 5 characters long');
        return;
      }
    }
  
    setActionLoading(true);
    setError('');
  
    try {
      let profileSuccess = false;
      let passwordSuccess = false;
  
      // Update profile if fields provided
      if (hasProfileUpdate) {
        const profileData: { companyName?: string; email?: string; number?: string } = {};
        if (editFormData.companyName) profileData.companyName = editFormData.companyName;
        if (editFormData.email) profileData.email = editFormData.email;
        if (editFormData.number) profileData.number = editFormData.number;
  
        const profileResponse = await fetch(`${API_URL}/api/user/update/${selectedReseller.id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(profileData),
        });
  
        const profileResult = await profileResponse.json();
  
        if (profileResponse.ok && profileResult.success) {
          profileSuccess = true;
        } else {
          setError(profileResult.message || 'Failed to update profile');
          setActionLoading(false);
          return;
        }
      }
  
      // Update password if fields provided
      if (hasPasswordUpdate) {
        const passwordResponse = await fetch(`${API_URL}/api/user/change-password/${selectedReseller.id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            password: editFormData.password,
            confirmPassword: editFormData.confirmPassword
          }),
        });
  
        const passwordResult = await passwordResponse.json();
  
        if (passwordResponse.ok && passwordResult.success) {
          passwordSuccess = true;
        } else {
          setError(passwordResult.message || 'Failed to change password');
          setActionLoading(false);
          return;
        }
      }
  
      // Set success message
      if (profileSuccess && passwordSuccess) {
        setSuccess('Profile and password updated successfully!');
      } else if (profileSuccess) {
        setSuccess('Profile updated successfully!');
      } else if (passwordSuccess) {
        setSuccess('Password changed successfully!');
      }
  
      setShowEditModal(false);
      setSelectedReseller(null);
      setEditFormData({ companyName: '', email: '', number: '', password: '', confirmPassword: '' });
      fetchResellersData();
      setTimeout(() => setSuccess(''), 3000);
  
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };  

  // Handle add credit
  const handleAddCredit = async () => {
    if (!selectedReseller || !creditAmount || parseFloat(creditAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/transaction/credit`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId: selectedReseller.id,
          amount: parseFloat(creditAmount)
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess(`₹${creditAmount} credited successfully!`);
        setShowAddCreditModal(false);
        setSelectedReseller(null);
        setCreditAmount('');
        fetchResellersData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message || 'Failed to add credit');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle remove credit
  const handleRemoveCredit = async () => {
    if (!selectedReseller || !debitAmount || parseFloat(debitAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/transaction/debit`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedReseller.id,
          amount: parseFloat(debitAmount)
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess(`₹${debitAmount} debited successfully!`);
        setShowRemoveCreditModal(false);
        setSelectedReseller(null);
        setDebitAmount('');
        fetchResellersData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message || 'Failed to remove credit');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle freeze/unfreeze
  const handleFreezeUnfreeze = async () => {
    if (!selectedReseller) return;

    setActionLoading(true);
    setError('');

    const endpoint = selectedReseller.status === 'active' ? 'freeze' : 'unfreeze';

    try {
      const response = await fetch(`${API_URL}/api/user/${endpoint}/${selectedReseller.id}`, {
        method: 'PUT',
        credentials: 'include',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess(result.message);
        setShowFreezeModal(false);
        setSelectedReseller(null);
        fetchResellersData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message || `Failed to ${endpoint} user`);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle delete
  const handleDeleteReseller = async () => {
    if (!selectedReseller) return;

    setActionLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/user/delete/${selectedReseller.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess('Reseller deleted successfully!');
        setShowDeleteModal(false);
        setSelectedReseller(null);
        fetchResellersData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message || 'Failed to delete reseller');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open modals
  const openViewModal = (reseller: Reseller) => {
    setSelectedReseller(reseller);
    setShowViewModal(true);
  };

  const openEditModal = (reseller: Reseller) => {
    setSelectedReseller(reseller);
    setEditFormData({
      companyName: reseller.companyName,
      email: reseller.email,
      number: reseller.number,
      password: '',
      confirmPassword: ''
    });
    setShowEditModal(true);
  };
  

  const openAddCreditModal = (reseller: Reseller) => {
    setSelectedReseller(reseller);
    setCreditAmount('');
    setShowAddCreditModal(true);
  };

  const openRemoveCreditModal = (reseller: Reseller) => {
    setSelectedReseller(reseller);
    setDebitAmount('');
    setShowRemoveCreditModal(true);
  };

  const openFreezeModal = (reseller: Reseller) => {
    setSelectedReseller(reseller);
    setShowFreezeModal(true);
  };

  const openDeleteModal = (reseller: Reseller) => {
    setSelectedReseller(reseller);
    setShowDeleteModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="p-8 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl">
          <p className="text-xl font-semibold text-black">Loading Resellers...</p>
        </div>
      </div>
    );
  }

  if (!isAdminOrReseller) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-100/60 backdrop-blur-md rounded-xl border border-red-300 shadow-lg">
          <p className="text-red-700 font-semibold">Access Denied. Only Admin and Reseller can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl">
        <h2 className="text-3xl font-bold text-black">LIST OF ALL RESELLERS</h2>
        
        {/* Add New Reseller Button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-500/80 backdrop-blur-md text-white font-bold rounded-xl border border-white/30 shadow-lg hover:bg-blue-600/80 transition-all"
        >
          <Plus className="w-5 h-5" />
          ADD NEW RESELLER
        </button>
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

      {/* Resellers Table */}
      <div className="p-6 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-white/60">
                <th className="text-left py-4 px-4 text-sm font-bold text-black uppercase">ID</th>
                <th className="text-left py-4 px-4 text-sm font-bold text-black uppercase">Fullname</th>
                <th className="text-left py-4 px-4 text-sm font-bold text-black uppercase">Username</th>
                <th className="text-left py-4 px-4 text-sm font-bold text-black uppercase">Email ID</th>
                <th className="text-left py-4 px-4 text-sm font-bold text-black uppercase">Credit</th>
                <th className="text-left py-4 px-4 text-sm font-bold text-black uppercase">Status</th>
                <th className="text-left py-4 px-4 text-sm font-bold text-black uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentResellers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-black opacity-70">
                    <p className="text-lg font-semibold">No resellers available</p>
                  </td>
                </tr>
              ) : (
                currentResellers.map((reseller) => (
                  <tr 
                    key={reseller.id} 
                    className="border-b border-white/30 hover:bg-white/20 transition-all"
                  >
                    <td className="py-4 px-4 text-black font-semibold text-sm max-w-[100px] truncate">
                      {reseller.id}
                    </td>
                    <td className="py-4 px-4 text-black font-semibold">
                      {reseller.companyName}
                    </td>
                    <td className="py-4 px-4 text-black font-semibold">
                      {reseller.number}
                    </td>
                    <td className="py-4 px-4 text-black font-semibold">
                      {reseller.email}
                    </td>
                    <td className="py-4 px-4 text-black font-bold text-lg">
                      ₹{reseller.balance}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 text-white text-xs font-bold rounded-full ${getStatusBadge(reseller.status)}`}>
                        {reseller.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* View Details */}
                        <button
                          onClick={() => openViewModal(reseller)}
                          className="p-2 bg-cyan-500/60 backdrop-blur-sm rounded-lg hover:bg-cyan-600/60 transition-all"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-white" />
                        </button>
                        
                        {/* Edit Reseller */}
                        <button
                          onClick={() => openEditModal(reseller)}
                          className="p-2 bg-blue-500/60 backdrop-blur-sm rounded-lg hover:bg-blue-600/60 transition-all"
                          title="Edit Reseller"
                        >
                          <Edit2 className="w-4 h-4 text-white" />
                        </button>
                        
                        {/* Add Credit */}
                        <button
                          onClick={() => openAddCreditModal(reseller)}
                          className="p-2 bg-yellow-500/60 backdrop-blur-sm rounded-lg hover:bg-yellow-600/60 transition-all"
                          title="Add Credit"
                        >
                          <DollarSign className="w-4 h-4 text-white" />
                        </button>
                        
                        {/* Remove Credit */}
                        <button
                          onClick={() => openRemoveCreditModal(reseller)}
                          className="p-2 bg-gray-700/60 backdrop-blur-sm rounded-lg hover:bg-gray-800/60 transition-all"
                          title="Remove Credit"
                        >
                          <Minus className="w-4 h-4 text-white" />
                        </button>
                        
                        {/* Freeze/Unfreeze */}
                        <button
                          onClick={() => openFreezeModal(reseller)}
                          className={`p-2 backdrop-blur-sm rounded-lg transition-all ${
                            reseller.status === 'active'
                              ? 'bg-red-500/60 hover:bg-red-600/60'
                              : 'bg-green-500/60 hover:bg-green-600/60'
                          }`}
                          title={reseller.status === 'active' ? 'Freeze User' : 'Unfreeze User'}
                        >
                          {reseller.status === 'active' ? (
                            <Lock className="w-4 h-4 text-white" />
                          ) : (
                            <Unlock className="w-4 h-4 text-white" />
                          )}
                        </button>
                        
                        {/* Delete */}
                        <button
                          onClick={() => openDeleteModal(reseller)}
                          className="p-2 bg-red-600/60 backdrop-blur-sm rounded-lg hover:bg-red-700/60 transition-all"
                          title="Delete Reseller"
                        >
                          <Trash2 className="w-4 h-4 text-white" />
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

      {/* Pagination Info and Controls */}
      {resellersData && resellersData.totalResellers > 0 && (
        <>
          <div className="text-sm text-black font-semibold p-4 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl">
            Showing {startIndex + 1} to {Math.min(endIndex, resellersData.totalResellers)} of {resellersData.totalResellers} entries
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white/60 backdrop-blur-sm rounded-lg border border-white/80 font-semibold text-black hover:bg-white/80 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Previous
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
                        ? 'bg-blue-500 text-white border-blue-600 shadow-lg'
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
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Create Reseller/User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl border-2 border-blue-500 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-black">Add New Reseller/User</h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateFormData({
                      companyName: '',
                      email: '',
                      password: '',
                      number: '',
                      role: 'reseller',
                      balance: '',
                      image: null
                    });
                    setError('');
                  }}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-all"
                >
                  <X className="w-6 h-6 text-black" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-black mb-2">Company Name *</label>
                  <input
                    type="text"
                    value={createFormData.companyName}
                    onChange={(e) => setCreateFormData({ ...createFormData, companyName: e.target.value })}
                    className="w-full px-4 py-3 bg-white/60 border-2 border-gray-300 rounded-xl text-black focus:outline-none focus:border-blue-500"
                    placeholder="Enter company name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-black mb-2">Email *</label>
                  <input
                    type="email"
                    value={createFormData.email}
                    onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-white/60 border-2 border-gray-300 rounded-xl text-black focus:outline-none focus:border-blue-500"
                    placeholder="example@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-black mb-2">Password *</label>
                  <input
                    type="password"
                    value={createFormData.password}
                    onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                    className="w-full px-4 py-3 bg-white/60 border-2 border-gray-300 rounded-xl text-black focus:outline-none focus:border-blue-500"
                    placeholder="Enter password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-black mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    value={createFormData.number}
                    onChange={(e) => setCreateFormData({ ...createFormData, number: e.target.value })}
                    maxLength={10}
                    className="w-full px-4 py-3 bg-white/60 border-2 border-gray-300 rounded-xl text-black focus:outline-none focus:border-blue-500"
                    placeholder="Enter 10-digit number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-black mb-2">Role *</label>
                  <select
                    value={createFormData.role}
                    onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value })}
                    className="w-full px-4 py-3 bg-white/60 border-2 border-gray-300 rounded-xl text-black font-semibold focus:outline-none focus:border-blue-500"
                  >
                    <option value="reseller">reseller</option>
                    <option value="user">user</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-black mb-2">Initial Balance *</label>
                  <input
                    type="number"
                    value={createFormData.balance}
                    onChange={(e) => setCreateFormData({ ...createFormData, balance: e.target.value })}
                    className="w-full px-4 py-3 bg-white/60 border-2 border-gray-300 rounded-xl text-black focus:outline-none focus:border-blue-500"
                    placeholder="Enter initial balance"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-black mb-2">Profile Image *</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setCreateFormData({ ...createFormData, image: file });
                      }
                    }}
                    className="w-full px-4 py-3 bg-white/60 border-2 border-gray-300 rounded-xl text-black file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-500 file:text-white file:font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleCreateUser}
                    disabled={actionLoading}
                    className="flex-1 px-6 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-all disabled:opacity-50"
                  >
                    {actionLoading ? 'Creating...' : 'Create User'}
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setCreateFormData({
                        companyName: '',
                        email: '',
                        password: '',
                        number: '',
                        role: 'reseller',
                        balance: '',
                        image: null
                      });
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

      {/* View Details Modal */}
      {showViewModal && selectedReseller && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl border-2 border-green-500 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-3xl font-bold text-black">Reseller Details</h3>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedReseller(null);
                  }}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-all"
                >
                  <X className="w-6 h-6 text-black" />
                </button>
              </div>

              <div className="space-y-5">
                {/* Profile Image Section */}
                {selectedReseller.image && (
                  <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-400 shadow-lg">
                    <h4 className="text-lg font-bold text-blue-800 mb-3 flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-600 animate-pulse"></div>
                      Profile Image
                    </h4>
                    <div className="flex justify-center">
                      <div className="relative">
                        <img 
                          src={selectedReseller.image} 
                          alt={selectedReseller.companyName}
                          className="w-40 h-40 object-cover rounded-full border-4 border-blue-500 shadow-xl"
                          onError={(e) => {
                            e.currentTarget.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(selectedReseller.companyName) + '&background=3b82f6&color=fff&size=256';
                          }}
                        />
                        <div className="absolute -bottom-2 -right-2 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full border-2 border-white">
                          {selectedReseller.role.toUpperCase()}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-3 text-center break-all">
                      <span className="font-bold">Image URL:</span> {selectedReseller.image}
                    </p>
                  </div>
                )}

                {/* Basic Information */}
                <div className="p-5 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border-2 border-green-400 shadow-lg">
                  <h4 className="text-lg font-bold text-green-800 mb-4 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-600 animate-pulse"></div>
                    Basic Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs font-bold text-green-700 uppercase">User ID</span>
                      <p className="text-black font-mono text-sm break-all mt-1 bg-white px-3 py-2 rounded-lg">{selectedReseller.id}</p>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-green-700 uppercase">Company Name</span>
                      <p className="text-black font-bold text-lg mt-1">{selectedReseller.companyName}</p>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-green-700 uppercase">Email</span>
                      <p className="text-black font-semibold break-all mt-1">{selectedReseller.email}</p>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-green-700 uppercase">Phone Number</span>
                      <p className="text-black font-semibold mt-1">+91 {selectedReseller.number}</p>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-green-700 uppercase">Status</span>
                      <p className="mt-1">
                        <span className={`px-3 py-1 text-white text-xs font-bold rounded-full ${getStatusBadge(selectedReseller.status)}`}>
                          {selectedReseller.status.toUpperCase()}
                        </span>
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-green-700 uppercase">Member Since</span>
                      <p className="text-black font-semibold mt-1">{formatDate(selectedReseller.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Account Statistics */}
                <div className="p-5 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border-2 border-purple-400 shadow-lg">
                  <h4 className="text-lg font-bold text-purple-800 mb-4 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-600 animate-pulse"></div>
                    Account Statistics
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-white rounded-xl shadow-md border-2 border-green-200 hover:scale-105 transition-transform">
                      <p className="text-4xl font-bold text-green-600">₹{selectedReseller.balance}</p>
                      <p className="text-xs text-gray-700 font-bold mt-2 uppercase">Balance</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-xl shadow-md border-2 border-blue-200 hover:scale-105 transition-transform">
                      <p className="text-4xl font-bold text-blue-600">{selectedReseller.resellerCount}</p>
                      <p className="text-xs text-gray-700 font-bold mt-2 uppercase">Resellers</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-xl shadow-md border-2 border-yellow-200 hover:scale-105 transition-transform">
                      <p className="text-4xl font-bold text-yellow-600">{selectedReseller.userCount}</p>
                      <p className="text-xs text-gray-700 font-bold mt-2 uppercase">Users</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-xl shadow-md border-2 border-purple-200 hover:scale-105 transition-transform">
                      <p className="text-4xl font-bold text-purple-600">{selectedReseller.totalCampaigns}</p>
                      <p className="text-xs text-gray-700 font-bold mt-2 uppercase">Campaigns</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="mt-6">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedReseller(null);
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


      {/* Edit Reseller Modal */}
      {showEditModal && selectedReseller && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl border-2 border-blue-500 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-black">Edit Reseller</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedReseller(null);
                    setEditFormData({ companyName: '', email: '', number: '', password: '', confirmPassword: '' });
                    setError('');
                  }}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-all"
                >
                  <X className="w-6 h-6 text-black" />
                </button>
              </div>

              {/* ERROR MESSAGE INSIDE MODAL */}
              {error && (
                <div className="mb-4 p-3 bg-red-100 rounded-lg border border-red-300">
                  <p className="text-red-700 font-semibold text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                {/* PROFILE SECTION */}
                <div className="p-4 bg-gray-50 rounded-xl">
                  <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase">Profile Information</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-bold text-black mb-2">Company Name</label>
                      <input
                        type="text"
                        value={editFormData.companyName}
                        onChange={(e) => setEditFormData({ ...editFormData, companyName: e.target.value })}
                        className="w-full px-4 py-3 bg-white/60 border-2 border-gray-300 rounded-xl text-black focus:outline-none focus:border-blue-500"
                        placeholder="Enter company name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-black mb-2">Email</label>
                      <input
                        type="email"
                        value={editFormData.email}
                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                        className="w-full px-4 py-3 bg-white/60 border-2 border-gray-300 rounded-xl text-black focus:outline-none focus:border-blue-500"
                        placeholder="example@company.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-black mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={editFormData.number}
                        onChange={(e) => setEditFormData({ ...editFormData, number: e.target.value })}
                        maxLength={10}
                        className="w-full px-4 py-3 bg-white/60 border-2 border-gray-300 rounded-xl text-black focus:outline-none focus:border-blue-500"
                        placeholder="Enter 10-digit number"
                      />
                    </div>
                  </div>
                </div>

                {/* PASSWORD SECTION */}
                <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-300">
                  <h4 className="text-sm font-bold text-blue-700 mb-2 uppercase">Change Password</h4>
                  <p className="text-xs text-gray-600 mb-3">Leave blank if you don't want to change password</p>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-bold text-black mb-2">New Password</label>
                      <input
                        type="password"
                        value={editFormData.password}
                        onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                        className="w-full px-4 py-3 bg-white/60 border-2 border-gray-300 rounded-xl text-black focus:outline-none focus:border-blue-500"
                        placeholder="Enter new password (min 5 characters)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-black mb-2">Confirm New Password</label>
                      <input
                        type="password"
                        value={editFormData.confirmPassword}
                        onChange={(e) => setEditFormData({ ...editFormData, confirmPassword: e.target.value })}
                        className="w-full px-4 py-3 bg-white/60 border-2 border-gray-300 rounded-xl text-black focus:outline-none focus:border-blue-500"
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600">* Leave fields empty that you don't want to update</p>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleUpdateReseller}
                    disabled={actionLoading}
                    className="flex-1 px-6 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-all disabled:opacity-50"
                  >
                    {actionLoading ? 'Updating...' : 'Update Reseller'}
                  </button>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedReseller(null);
                      setEditFormData({ companyName: '', email: '', number: '', password: '', confirmPassword: '' });
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


      {/* Add Credit Modal */}
      {showAddCreditModal && selectedReseller && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl border-2 border-yellow-500 shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-black">Add Credit</h3>
                <button
                  onClick={() => {
                    setShowAddCreditModal(false);
                    setSelectedReseller(null);
                    setCreditAmount('');
                    setError('');
                  }}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-all"
                >
                  <X className="w-6 h-6 text-black" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 rounded-xl">
                  <p className="text-sm font-bold text-gray-600">Reseller: <span className="text-black">{selectedReseller.companyName}</span></p>
                  <p className="text-sm font-bold text-gray-600 mt-2">Current Balance: <span className="text-green-600 text-lg">₹{selectedReseller.balance}</span></p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-black mb-2">Amount to Credit *</label>
                  <input
                    type="number"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    className="w-full px-4 py-3 bg-white/60 border-2 border-gray-300 rounded-xl text-black focus:outline-none focus:border-yellow-500"
                    placeholder="Enter amount"
                    min="0"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleAddCredit}
                    disabled={actionLoading}
                    className="flex-1 px-6 py-3 bg-yellow-500 text-white font-bold rounded-xl hover:bg-yellow-600 transition-all disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Add Credit'}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddCreditModal(false);
                      setSelectedReseller(null);
                      setCreditAmount('');
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

      {/* Remove Credit Modal */}
      {showRemoveCreditModal && selectedReseller && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl border-2 border-gray-700 shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-black">Remove Credit</h3>
                <button
                  onClick={() => {
                    setShowRemoveCreditModal(false);
                    setSelectedReseller(null);
                    setDebitAmount('');
                    setError('');
                  }}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-all"
                >
                  <X className="w-6 h-6 text-black" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-red-50 rounded-xl">
                  <p className="text-sm font-bold text-gray-600">Reseller: <span className="text-black">{selectedReseller.companyName}</span></p>
                  <p className="text-sm font-bold text-gray-600 mt-2">Current Balance: <span className="text-green-600 text-lg">₹{selectedReseller.balance}</span></p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-black mb-2">Amount to Debit *</label>
                  <input
                    type="number"
                    value={debitAmount}
                    onChange={(e) => setDebitAmount(e.target.value)}
                    className="w-full px-4 py-3 bg-white/60 border-2 border-gray-300 rounded-xl text-black focus:outline-none focus:border-red-500"
                    placeholder="Enter amount"
                    min="0"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleRemoveCredit}
                    disabled={actionLoading}
                    className="flex-1 px-6 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Remove Credit'}
                  </button>
                  <button
                    onClick={() => {
                      setShowRemoveCreditModal(false);
                      setSelectedReseller(null);
                      setDebitAmount('');
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

      {/* Freeze/Unfreeze Confirmation Modal */}
      {showFreezeModal && selectedReseller && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl border-2 border-red-500 shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-black mb-4">
                {selectedReseller.status === 'active' ? 'Freeze User' : 'Unfreeze User'}
              </h3>
              <p className="text-black mb-6">
                Are you sure you want to {selectedReseller.status === 'active' ? 'freeze' : 'unfreeze'}{' '}
                <span className="font-bold">{selectedReseller.companyName}</span>?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleFreezeUnfreeze}
                  disabled={actionLoading}
                  className={`flex-1 px-6 py-3 text-white font-bold rounded-xl transition-all disabled:opacity-50 ${
                    selectedReseller.status === 'active'
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-green-500 hover:bg-green-600'
                  }`}
                >
                  {actionLoading ? 'Processing...' : `Yes, ${selectedReseller.status === 'active' ? 'Freeze' : 'Unfreeze'}`}
                </button>
                <button
                  onClick={() => {
                    setShowFreezeModal(false);
                    setSelectedReseller(null);
                  }}
                  className="flex-1 px-6 py-3 bg-gray-300 text-black font-bold rounded-xl hover:bg-gray-400 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedReseller && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl border-2 border-red-500 shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-black mb-4">Delete Reseller</h3>
              <p className="text-black mb-6">
                Are you sure you want to delete <span className="font-bold">{selectedReseller.companyName}</span>? 
                This will soft delete the user.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteReseller}
                  disabled={actionLoading}
                  className="flex-1 px-6 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all disabled:opacity-50"
                >
                  {actionLoading ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedReseller(null);
                  }}
                  className="flex-1 px-6 py-3 bg-gray-300 text-black font-bold rounded-xl hover:bg-gray-400 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageReseller;

