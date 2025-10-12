import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { X, Plus, Eye, Edit2, Trash2, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { getUserRole } from '../utils/Auth';
import { UserRole } from '../constants/Roles';

interface Complaint {
    complaintId: string;
    subject: string;
    description: string;
    status: 'pending' | 'in-progress' | 'resolved' | 'closed';
    createdBy: string;
    createdAt: string;
    adminResponse: string | null;
    resolvedBy: string | null;
    resolvedAt: string | null;
    updatedAt: string;
}

interface ComplaintsData {
    totalComplaints: number;
    statusBreakdown: {
        pending: number;
        inProgress: number;
        resolved: number;
        closed: number;
    };
    complaints: Complaint[];
}

const Complaints = () => {
    const [complaintsData, setComplaintsData] = useState<ComplaintsData | null>(null);
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
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Form data
    const [createFormData, setCreateFormData] = useState({
        subject: '',
        description: ''
    });

    const [editFormData, setEditFormData] = useState({
        status: 'pending' as 'pending' | 'in-progress' | 'resolved' | 'closed',
        adminResponse: ''
    });

    // Selected complaint
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    const userRole = getUserRole();
    const isAdmin = userRole === UserRole.ADMIN;

    // Get current user's company name from localStorage
    const getCurrentUserName = (): string => {
        const userStr = localStorage.getItem('user');
        if (!userStr) return '';
        try {
            const user = JSON.parse(userStr);
            return user.companyName || user.email || '';
        } catch {
            return '';
        }
    };

    const currentUserName = getCurrentUserName();

    // Fetch complaints data
    const fetchComplaintsData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/api/dashboard/complaints`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setComplaintsData(result.data);
            } else {
                setError(result.message || 'Failed to load complaints data');
            }
        } catch (err) {
            setError('Network error. Please try again.');
            console.error('Complaints fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [API_URL]);

    useEffect(() => {
        fetchComplaintsData();
    }, [fetchComplaintsData]);

    // Pagination calculations
    const totalPages = Math.ceil((complaintsData?.totalComplaints || 0) / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentComplaints = complaintsData?.complaints.slice(startIndex, endIndex) || [];

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

    // Get status badge color
    const getStatusBadge = (status: string) => {
        const badges = {
            pending: 'bg-orange-500',
            'in-progress': 'bg-blue-500',
            resolved: 'bg-green-500',
            closed: 'bg-red-500'
        };
        return badges[status as keyof typeof badges] || 'bg-gray-500';
    };

    // Handle create complaint
    const handleCreateComplaint = async () => {
        if (!createFormData.subject || !createFormData.description) {
            setError('Please fill in all fields');
            return;
        }

        // Validate subject word count (1-30 words)
        const subjectWordCount = createFormData.subject.trim().split(/\s+/).length;
        if (subjectWordCount < 1 || subjectWordCount > 30) {
            setError('Subject must be between 1 and 30 words');
            return;
        }

        setActionLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_URL}/api/complaints/create`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(createFormData),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setSuccess('Complaint created successfully!');
                setShowCreateModal(false);
                setCreateFormData({ subject: '', description: '' });
                fetchComplaintsData();
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(result.message || 'Failed to create complaint');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    // Handle update complaint (Admin only)
    const handleUpdateComplaint = async () => {
        if (!selectedComplaint) return;

        setActionLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_URL}/api/complaints/update/${selectedComplaint.complaintId}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(editFormData),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setSuccess('Complaint updated successfully!');
                setShowEditModal(false);
                setSelectedComplaint(null);
                setEditFormData({ status: 'pending', adminResponse: '' });
                fetchComplaintsData();
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(result.message || 'Failed to update complaint');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    // Handle delete complaint
    const handleDeleteComplaint = async () => {
        if (!selectedComplaint) return;

        setActionLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_URL}/api/complaints/delete/${selectedComplaint.complaintId}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setSuccess('Complaint deleted successfully!');
                setShowDeleteModal(false);
                setSelectedComplaint(null);
                fetchComplaintsData();
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(result.message || 'Failed to delete complaint');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    // Open view modal
    const openViewModal = (complaint: Complaint) => {
        setSelectedComplaint(complaint);
        setShowViewModal(true);
    };

    // Open edit modal
    const openEditModal = (complaint: Complaint) => {
        setSelectedComplaint(complaint);
        setEditFormData({
            status: complaint.status,
            adminResponse: complaint.adminResponse || ''
        });
        setShowEditModal(true);
    };

    // Open delete modal
    const openDeleteModal = (complaint: Complaint) => {
        setSelectedComplaint(complaint);
        setShowDeleteModal(true);
    };

    // Check if current user can delete this complaint
    const canDelete = (complaint: Complaint): boolean => {
        return isAdmin || complaint.createdBy === currentUserName;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="p-8 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl">
                    <p className="text-xl font-semibold text-black">Loading Complaints...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* Page Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl">
                <h2 className="text-3xl font-bold text-black">List of All Complaints</h2>

                {/* Create Complaint Button - Everyone can create */}
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-green-500/80 backdrop-blur-md text-white font-bold rounded-xl border border-white/30 shadow-lg hover:bg-green-600/80 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    Add Complaint
                </button>
            </div>

            {/* Status Summary Cards */}
            {complaintsData && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-orange-500/20 backdrop-blur-lg rounded-xl border border-white/60 shadow-lg">
                        <p className="text-sm font-bold text-black uppercase opacity-70">Pending</p>
                        <p className="text-3xl font-bold text-orange-600 mt-1">{complaintsData.statusBreakdown.pending}</p>
                    </div>
                    <div className="p-4 bg-blue-500/20 backdrop-blur-lg rounded-xl border border-white/60 shadow-lg">
                        <p className="text-sm font-bold text-black uppercase opacity-70">In Progress</p>
                        <p className="text-3xl font-bold text-blue-600 mt-1">{complaintsData.statusBreakdown.inProgress}</p>
                    </div>
                    <div className="p-4 bg-green-500/20 backdrop-blur-lg rounded-xl border border-white/60 shadow-lg">
                        <p className="text-sm font-bold text-black uppercase opacity-70">Resolved</p>
                        <p className="text-3xl font-bold text-green-600 mt-1">{complaintsData.statusBreakdown.resolved}</p>
                    </div>
                    <div className="p-4 bg-red-500/20 backdrop-blur-lg rounded-xl border border-white/60 shadow-lg">
                        <p className="text-sm font-bold text-black uppercase opacity-70">Closed</p>
                        <p className="text-3xl font-bold text-red-600 mt-1">{complaintsData.statusBreakdown.closed}</p>
                    </div>
                </div>
            )}

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

            {/* Complaints Table */}
            <div className="p-6 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b-2 border-white/60">
                                <th className="text-left py-4 px-4 text-sm font-bold text-black uppercase">ID</th>
                                <th className="text-left py-4 px-4 text-sm font-bold text-black uppercase">Created At</th>
                                <th className="text-left py-4 px-4 text-sm font-bold text-black uppercase">User/Reseller</th>
                                <th className="text-left py-4 px-4 text-sm font-bold text-black uppercase">Subject</th>
                                <th className="text-left py-4 px-4 text-sm font-bold text-black uppercase">Description</th>
                                <th className="text-left py-4 px-4 text-sm font-bold text-black uppercase">Status</th>
                                <th className="text-left py-4 px-4 text-sm font-bold text-black uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentComplaints.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-black opacity-70">
                                        <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p className="text-lg font-semibold">No complaints available</p>
                                    </td>
                                </tr>
                            ) : (
                                currentComplaints.map((complaint, index) => (
                                    <tr
                                        key={complaint.complaintId}
                                        className="border-b border-white/30 hover:bg-white/20 transition-all"
                                    >
                                        <td className="py-4 px-4 text-black font-semibold">
                                            {startIndex + index + 1}
                                        </td>
                                        <td className="py-4 px-4 text-black font-semibold whitespace-nowrap text-sm">
                                            {formatDate(complaint.createdAt)}
                                        </td>
                                        <td className="py-4 px-4 text-black font-semibold">
                                            {complaint.createdBy}
                                        </td>
                                        <td className="py-4 px-4 text-black font-semibold max-w-[200px]">
                                            {complaint.subject}
                                        </td>
                                        <td className="py-4 px-4 text-black font-semibold max-w-[300px]">
                                            <div className="line-clamp-2">
                                                {complaint.description}
                                            </div>
                                            <button
                                                onClick={() => openViewModal(complaint)}
                                                className="text-green-600 font-bold text-sm mt-1 hover:underline"
                                            >
                                                Read More
                                            </button>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className={`px-3 py-1 text-white text-xs font-bold rounded-full ${getStatusBadge(complaint.status)}`}>
                                                {complaint.status.toUpperCase().replace('-', ' ')}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => openViewModal(complaint)}
                                                    className="p-2 bg-green-500/60 backdrop-blur-sm rounded-lg hover:bg-green-600/60 transition-all"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4 text-white" />
                                                </button>
                                                {isAdmin && (
                                                    <button
                                                        onClick={() => openEditModal(complaint)}
                                                        className="p-2 bg-blue-500/60 backdrop-blur-sm rounded-lg hover:bg-blue-600/60 transition-all"
                                                        title="Edit"
                                                    >
                                                        <Edit2 className="w-4 h-4 text-white" />
                                                    </button>
                                                )}
                                                {canDelete(complaint) && (
                                                    <button
                                                        onClick={() => openDeleteModal(complaint)}
                                                        className="p-2 bg-red-500/60 backdrop-blur-sm rounded-lg hover:bg-red-600/60 transition-all"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-white" />
                                                    </button>
                                                )}
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
            {complaintsData && complaintsData.totalComplaints > 0 && (
                <>
                    <div className="text-sm text-black font-semibold p-4 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl">
                        Showing {startIndex + 1} to {Math.min(endIndex, complaintsData.totalComplaints)} of {complaintsData.totalComplaints} entries
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
                                        className={`px-4 py-2 font-bold rounded-lg border-2 transition-all ${currentPage === pageNum
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

            {/* Create Complaint Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white/90 backdrop-blur-xl rounded-2xl border-2 border-green-500 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-bold text-black">Create New Complaint</h3>
                                <button
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setCreateFormData({ subject: '', description: '' });
                                        setError('');
                                    }}
                                    className="p-2 hover:bg-gray-200 rounded-lg transition-all"
                                >
                                    <X className="w-6 h-6 text-black" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-black mb-2">
                                        Subject * <span className="text-xs font-normal text-gray-600">(1-30 words)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={createFormData.subject}
                                        onChange={(e) => setCreateFormData({ ...createFormData, subject: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/60 border-2 border-gray-300 rounded-xl text-black focus:outline-none focus:border-green-500"
                                        placeholder="Enter complaint subject"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-black mb-2">Description *</label>
                                    <textarea
                                        value={createFormData.description}
                                        onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                                        rows={6}
                                        className="w-full px-4 py-3 bg-white/60 border-2 border-gray-300 rounded-xl text-black focus:outline-none focus:border-green-500 resize-none"
                                        placeholder="Describe your complaint in detail"
                                    />
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={handleCreateComplaint}
                                        disabled={actionLoading}
                                        className="flex-1 px-6 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-all disabled:opacity-50"
                                    >
                                        {actionLoading ? 'Creating...' : 'Create Complaint'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowCreateModal(false);
                                            setCreateFormData({ subject: '', description: '' });
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

            {/* View Complaint Modal */}
            {showViewModal && selectedComplaint && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white/90 backdrop-blur-xl rounded-2xl border-2 border-green-500 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-2xl font-bold text-black">Complaint Details</h3>
                                <button
                                    onClick={() => {
                                        setShowViewModal(false);
                                        setSelectedComplaint(null);
                                    }}
                                    className="p-2 hover:bg-gray-200 rounded-lg transition-all"
                                >
                                    <X className="w-6 h-6 text-black" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Basic Info Grid */}
                                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
                                    <div>
                                        <span className="text-sm font-bold text-gray-600">Created By:</span>
                                        <p className="text-black font-semibold">{selectedComplaint.createdBy}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-bold text-gray-600">Status:</span>
                                        <p>
                                            <span className={`px-3 py-1 text-white text-xs font-bold rounded-full ${getStatusBadge(selectedComplaint.status)}`}>
                                                {selectedComplaint.status.toUpperCase().replace('-', ' ')}
                                            </span>
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-bold text-gray-600">Created At:</span>
                                        <p className="text-black text-sm">{formatDate(selectedComplaint.createdAt)}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-bold text-gray-600">Updated At:</span>
                                        <p className="text-black text-sm">{formatDate(selectedComplaint.updatedAt)}</p>
                                    </div>
                                </div>

                                {/* Subject */}
                                <div className="p-4 bg-white border-2 border-gray-200 rounded-xl">
                                    <h4 className="text-sm font-bold text-gray-600 mb-2">SUBJECT:</h4>
                                    <p className="text-black font-semibold text-lg">{selectedComplaint.subject}</p>
                                </div>

                                {/* Description */}
                                <div className="p-4 bg-white border-2 border-gray-200 rounded-xl">
                                    <h4 className="text-sm font-bold text-gray-600 mb-2">DESCRIPTION:</h4>
                                    <p className="text-black whitespace-pre-wrap">{selectedComplaint.description}</p>
                                </div>

                                {/* Admin Response - Only show if exists */}
                                {selectedComplaint.adminResponse && (
                                    <div className="p-4 bg-green-50 border-2 border-green-300 rounded-xl">
                                        <h4 className="text-sm font-bold text-green-700 mb-2 flex items-center gap-2">
                                            <AlertCircle className="w-5 h-5" />
                                            ADMIN RESPONSE:
                                        </h4>
                                        <p className="text-black whitespace-pre-wrap font-medium">
                                            {selectedComplaint.adminResponse}
                                        </p>
                                    </div>
                                )}

                                {/* Resolution Info - Only show if resolved/closed */}
                                {(selectedComplaint.status === 'resolved' || selectedComplaint.status === 'closed') && (
                                    <div className="p-4 bg-blue-50 border-2 border-blue-300 rounded-xl">
                                        <h4 className="text-sm font-bold text-blue-700 mb-3">RESOLUTION DETAILS:</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            {selectedComplaint.resolvedBy && (
                                                <div>
                                                    <span className="text-sm font-bold text-gray-600">Resolved By:</span>
                                                    <p className="text-black font-semibold">{selectedComplaint.resolvedBy}</p>
                                                </div>
                                            )}
                                            {selectedComplaint.resolvedAt && (
                                                <div>
                                                    <span className="text-sm font-bold text-gray-600">Resolved At:</span>
                                                    <p className="text-black font-semibold">{formatDate(selectedComplaint.resolvedAt)}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Show message if no admin response yet */}
                                {!selectedComplaint.adminResponse && selectedComplaint.status === 'pending' && (
                                    <div className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded-xl">
                                        <p className="text-yellow-800 font-semibold text-center">
                                            ⏳ Waiting for admin response...
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Close Button */}
                            <div className="mt-6">
                                <button
                                    onClick={() => {
                                        setShowViewModal(false);
                                        setSelectedComplaint(null);
                                    }}
                                    className="w-full px-6 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-all"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* Edit Complaint Modal (Admin Only) */}
            {showEditModal && selectedComplaint && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white/90 backdrop-blur-xl rounded-2xl border-2 border-blue-500 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-bold text-black">Update Complaint</h3>
                                <button
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setSelectedComplaint(null);
                                        setEditFormData({ status: 'pending', adminResponse: '' });
                                        setError('');
                                    }}
                                    className="p-2 hover:bg-gray-200 rounded-lg transition-all"
                                >
                                    <X className="w-6 h-6 text-black" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Read-only info */}
                                <div className="bg-gray-100 p-4 rounded-xl">
                                    <p className="text-sm font-bold text-gray-600">Created By: <span className="text-black">{selectedComplaint.createdBy}</span></p>
                                    <p className="text-sm font-bold text-gray-600 mt-1">Subject: <span className="text-black">{selectedComplaint.subject}</span></p>
                                    <p className="text-sm font-bold text-gray-600 mt-1">Description: <span className="text-black">{selectedComplaint.description}</span></p>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-black mb-2">Status *</label>
                                    <select
                                        value={editFormData.status}
                                        onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as Complaint['status'] })}
                                        className="w-full px-4 py-3 bg-white/60 border-2 border-gray-300 rounded-xl text-black font-semibold focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="in-progress">In Progress</option>
                                        <option value="resolved">Resolved</option>
                                        <option value="closed">Closed</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-black mb-2">Admin Response</label>
                                    <textarea
                                        value={editFormData.adminResponse}
                                        onChange={(e) => setEditFormData({ ...editFormData, adminResponse: e.target.value })}
                                        rows={5}
                                        className="w-full px-4 py-3 bg-white/60 border-2 border-gray-300 rounded-xl text-black focus:outline-none focus:border-blue-500 resize-none"
                                        placeholder="Enter admin response..."
                                    />
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={handleUpdateComplaint}
                                        disabled={actionLoading}
                                        className="flex-1 px-6 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-all disabled:opacity-50"
                                    >
                                        {actionLoading ? 'Updating...' : 'Update Complaint'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowEditModal(false);
                                            setSelectedComplaint(null);
                                            setEditFormData({ status: 'pending', adminResponse: '' });
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
            {showDeleteModal && selectedComplaint && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white/90 backdrop-blur-xl rounded-2xl border-2 border-red-500 shadow-2xl w-full max-w-md">
                        <div className="p-6">
                            <h3 className="text-2xl font-bold text-black mb-4">Delete Complaint</h3>
                            <p className="text-black mb-6">
                                Are you sure you want to delete this complaint? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleDeleteComplaint}
                                    disabled={actionLoading}
                                    className="flex-1 px-6 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all disabled:opacity-50"
                                >
                                    {actionLoading ? 'Deleting...' : 'Yes, Delete'}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setSelectedComplaint(null);
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
        </div>
    );
};

export default Complaints;
