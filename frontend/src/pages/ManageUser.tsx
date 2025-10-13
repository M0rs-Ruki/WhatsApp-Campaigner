import { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { format } from 'date-fns';
import { X, Plus, Eye, Edit2, DollarSign, Minus, Lock, Unlock, Trash2 } from 'lucide-react';
import { getUserRole } from '../utils/Auth';
import { UserRole } from '../constants/Roles';

interface User {
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
}

interface UsersData {
  totalUsers: number;
  users: User[];
}

const ManageUser = () => {
  const [usersData, setUsersData] = useState<UsersData | null>(null);
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
    role: 'user', // Default to "user"
    balance: '',
    image: null as File | null
  });
  
  const [editFormData, setEditFormData] = useState({
    companyName: '',
    email: '',
    number: ''
  });
  
  const [creditAmount, setCreditAmount] = useState('');
  const [debitAmount, setDebitAmount] = useState('');
  
  // Selected user
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
  const userRole = getUserRole();
  const isAdminOrReseller = userRole === UserRole.ADMIN || userRole === UserRole.RESELLER;

  // Fetch users data
  const fetchUsersData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/dashboard/manage-user`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setUsersData(result.data);
      } else {
        setError(result.message || 'Failed to load users data');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Users fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchUsersData();
  }, [fetchUsersData]);

  // Pagination calculations
  const totalPages = Math.ceil((usersData?.totalUsers || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = usersData?.users.slice(startIndex, endIndex) || [];

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

  // Handle create user
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
          role: 'user',
          balance: '',
          image: null
        });
        fetchUsersData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message || 'Failed to create user');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle update user
  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    if (!editFormData.companyName && !editFormData.email && !editFormData.number) {
      setError('Please provide at least one field to update');
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/user/update/${selectedUser.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess('User updated successfully!');
        setShowEditModal(false);
        setSelectedUser(null);
        setEditFormData({ companyName: '', email: '', number: '' });
        fetchUsersData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message || 'Failed to update user');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle add credit
  const handleAddCredit = async () => {
    if (!selectedUser || !creditAmount || parseFloat(creditAmount) <= 0) {
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
          receiverId: selectedUser.id,
          amount: parseFloat(creditAmount)
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess(`₹${creditAmount} credited successfully!`);
        setShowAddCreditModal(false);
        setSelectedUser(null);
        setCreditAmount('');
        fetchUsersData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message || 'Failed to add credit');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle remove credit
  const handleRemoveCredit = async () => {
    if (!selectedUser || !debitAmount || parseFloat(debitAmount) <= 0) {
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
          userId: selectedUser.id,
          amount: parseFloat(debitAmount)
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess(`₹${debitAmount} debited successfully!`);
        setShowRemoveCreditModal(false);
        setSelectedUser(null);
        setDebitAmount('');
        fetchUsersData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message || 'Failed to remove credit');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle freeze/unfreeze
  const handleFreezeUnfreeze = async () => {
    if (!selectedUser) return;

    setActionLoading(true);
    setError('');

    const endpoint = selectedUser.status === 'active' ? 'freeze' : 'unfreeze';

    try {
      const response = await fetch(`${API_URL}/api/user/${endpoint}/${selectedUser.id}`, {
        method: 'PUT',
        credentials: 'include',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess(result.message);
        setShowFreezeModal(false);
        setSelectedUser(null);
        fetchUsersData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message || `Failed to ${endpoint} user`);
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle delete
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setActionLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/user/delete/${selectedUser.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess('User deleted successfully!');
        setShowDeleteModal(false);
        setSelectedUser(null);
        fetchUsersData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message || 'Failed to delete user');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open modals
  const openViewModal = (user: User) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      companyName: user.companyName,
      email: user.email,
      number: user.number
    });
    setShowEditModal(true);
  };

  const openAddCreditModal = (user: User) => {
    setSelectedUser(user);
    setCreditAmount('');
    setShowAddCreditModal(true);
  };

  const openRemoveCreditModal = (user: User) => {
    setSelectedUser(user);
    setDebitAmount('');
    setShowRemoveCreditModal(true);
  };

  const openFreezeModal = (user: User) => {
    setSelectedUser(user);
    setShowFreezeModal(true);
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="p-8 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl">
          <p className="text-xl font-semibold text-black">Loading Users...</p>
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
        <h2 className="text-3xl font-bold text-black">LIST OF ALL USERS</h2>
        
        {/* Add New User Button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-500/80 backdrop-blur-md text-white font-bold rounded-xl border border-white/30 shadow-lg hover:bg-blue-600/80 transition-all"
        >
          <Plus className="w-5 h-5" />
          ADD NEW USER
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

      {/* Users Table */}
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
              {currentUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-black opacity-70">
                    <p className="text-lg font-semibold">No users available</p>
                  </td>
                </tr>
              ) : (
                currentUsers.map((user) => (
                  <tr 
                    key={user.id} 
                    className="border-b border-white/30 hover:bg-white/20 transition-all"
                  >
                    <td className="py-4 px-4 text-black font-semibold text-sm max-w-[100px] truncate">
                      {user.id}
                    </td>
                    <td className="py-4 px-4 text-black font-semibold">
                      {user.companyName}
                    </td>
                    <td className="py-4 px-4 text-black font-semibold">
                      {user.number}
                    </td>
                    <td className="py-4 px-4 text-black font-semibold">
                      {user.email}
                    </td>
                    <td className="py-4 px-4 text-black font-bold text-lg">
                      ₹{user.balance}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 text-white text-xs font-bold rounded-full ${getStatusBadge(user.status)}`}>
                        {user.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* View Details */}
                        <button
                          onClick={() => openViewModal(user)}
                          className="p-2 bg-cyan-500/60 backdrop-blur-sm rounded-lg hover:bg-cyan-600/60 transition-all"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-white" />
                        </button>
                        
                        {/* Edit User */}
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-2 bg-blue-500/60 backdrop-blur-sm rounded-lg hover:bg-blue-600/60 transition-all"
                          title="Edit User"
                        >
                          <Edit2 className="w-4 h-4 text-white" />
                        </button>
                        
                        {/* Add Credit */}
                        <button
                          onClick={() => openAddCreditModal(user)}
                          className="p-2 bg-yellow-500/60 backdrop-blur-sm rounded-lg hover:bg-yellow-600/60 transition-all"
                          title="Add Credit"
                        >
                          <DollarSign className="w-4 h-4 text-white" />
                        </button>
                        
                        {/* Remove Credit */}
                        <button
                          onClick={() => openRemoveCreditModal(user)}
                          className="p-2 bg-gray-700/60 backdrop-blur-sm rounded-lg hover:bg-gray-800/60 transition-all"
                          title="Remove Credit"
                        >
                          <Minus className="w-4 h-4 text-white" />
                        </button>
                        
                        {/* Freeze/Unfreeze */}
                        <button
                          onClick={() => openFreezeModal(user)}
                          className={`p-2 backdrop-blur-sm rounded-lg transition-all ${
                            user.status === 'active'
                              ? 'bg-red-500/60 hover:bg-red-600/60'
                              : 'bg-green-500/60 hover:bg-green-600/60'
                          }`}
                          title={user.status === 'active' ? 'Freeze User' : 'Unfreeze User'}
                        >
                          {user.status === 'active' ? (
                            <Lock className="w-4 h-4 text-white" />
                          ) : (
                            <Unlock className="w-4 h-4 text-white" />
                          )}
                        </button>
                        
                        {/* Delete */}
                        <button
                          onClick={() => openDeleteModal(user)}
                          className="p-2 bg-red-600/60 backdrop-blur-sm rounded-lg hover:bg-red-700/60 transition-all"
                          title="Delete User"
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

      {/* Pagination - Same as ManageReseller */}
      {usersData && usersData.totalUsers > 0 && (
        <>
          <div className="text-sm text-black font-semibold p-4 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl">
            Showing {startIndex + 1} to {Math.min(endIndex, usersData.totalUsers)} of {usersData.totalUsers} entries
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
                let pageNum;
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

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl border-2 border-blue-500 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-black">Add New User</h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateFormData({
                      companyName: '',
                      email: '',
                      password: '',
                      number: '',
                      role: 'user',
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
                    <option value="user">user</option>
                    <option value="reseller">reseller</option>
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
                        role: 'user',
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
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl border-2 border-green-500 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-black">User Details</h3>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedUser(null);
                  }}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-all"
                >
                  <X className="w-6 h-6 text-black" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
                  <div>
                    <span className="text-sm font-bold text-gray-600">User ID:</span>
                    <p className="text-black font-semibold break-all">{selectedUser.id}</p>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-600">Company Name:</span>
                    <p className="text-black font-semibold">{selectedUser.companyName}</p>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-600">Email:</span>
                    <p className="text-black font-semibold">{selectedUser.email}</p>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-600">Phone Number:</span>
                    <p className="text-black font-semibold">{selectedUser.number}</p>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-600">Role:</span>
                    <p className="text-black font-semibold uppercase">{selectedUser.role}</p>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-600">Balance:</span>
                    <p className="text-green-600 font-bold text-xl">₹{selectedUser.balance}</p>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-600">Total Resellers:</span>
                    <p className="text-black font-semibold">{selectedUser.resellerCount}</p>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-600">Total Users:</span>
                    <p className="text-black font-semibold">{selectedUser.userCount}</p>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-600">Total Campaigns:</span>
                    <p className="text-black font-semibold">{selectedUser.totalCampaigns}</p>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-600">Status:</span>
                    <p>
                      <span className={`px-3 py-1 text-white text-xs font-bold rounded-full ${getStatusBadge(selectedUser.status)}`}>
                        {selectedUser.status.toUpperCase()}
                      </span>
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm font-bold text-gray-600">Created At:</span>
                    <p className="text-black font-semibold">{formatDate(selectedUser.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl border-2 border-blue-500 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-black">Edit User</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                    setEditFormData({ companyName: '', email: '', number: '' });
                    setError('');
                  }}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-all"
                >
                  <X className="w-6 h-6 text-black" />
                </button>
              </div>

              <div className="space-y-4">
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

                <p className="text-sm text-gray-600">* Leave fields empty that you don't want to update</p>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleUpdateUser}
                    disabled={actionLoading}
                    className="flex-1 px-6 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-all disabled:opacity-50"
                  >
                    {actionLoading ? 'Updating...' : 'Update User'}
                  </button>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedUser(null);
                      setEditFormData({ companyName: '', email: '', number: '' });
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
      {showAddCreditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl border-2 border-yellow-500 shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-black">Add Credit</h3>
                <button
                  onClick={() => {
                    setShowAddCreditModal(false);
                    setSelectedUser(null);
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
                  <p className="text-sm font-bold text-gray-600">User: <span className="text-black">{selectedUser.companyName}</span></p>
                  <p className="text-sm font-bold text-gray-600 mt-2">Current Balance: <span className="text-green-600 text-lg">₹{selectedUser.balance}</span></p>
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
                      setSelectedUser(null);
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
      {showRemoveCreditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl border-2 border-gray-700 shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-black">Remove Credit</h3>
                <button
                  onClick={() => {
                    setShowRemoveCreditModal(false);
                    setSelectedUser(null);
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
                  <p className="text-sm font-bold text-gray-600">User: <span className="text-black">{selectedUser.companyName}</span></p>
                  <p className="text-sm font-bold text-gray-600 mt-2">Current Balance: <span className="text-green-600 text-lg">₹{selectedUser.balance}</span></p>
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
                      setSelectedUser(null);
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
      {showFreezeModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl border-2 border-red-500 shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-black mb-4">
                {selectedUser.status === 'active' ? 'Freeze User' : 'Unfreeze User'}
              </h3>
              <p className="text-black mb-6">
                Are you sure you want to {selectedUser.status === 'active' ? 'freeze' : 'unfreeze'}{' '}
                <span className="font-bold">{selectedUser.companyName}</span>?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleFreezeUnfreeze}
                  disabled={actionLoading}
                  className={`flex-1 px-6 py-3 text-white font-bold rounded-xl transition-all disabled:opacity-50 ${
                    selectedUser.status === 'active'
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-green-500 hover:bg-green-600'
                  }`}
                >
                  {actionLoading ? 'Processing...' : `Yes, ${selectedUser.status === 'active' ? 'Freeze' : 'Unfreeze'}`}
                </button>
                <button
                  onClick={() => {
                    setShowFreezeModal(false);
                    setSelectedUser(null);
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
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl border-2 border-red-500 shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-black mb-4">Delete User</h3>
              <p className="text-black mb-6">
                Are you sure you want to delete <span className="font-bold">{selectedUser.companyName}</span>? 
                This will soft delete the user.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteUser}
                  disabled={actionLoading}
                  className="flex-1 px-6 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all disabled:opacity-50"
                >
                  {actionLoading ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedUser(null);
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

export default ManageUser;
