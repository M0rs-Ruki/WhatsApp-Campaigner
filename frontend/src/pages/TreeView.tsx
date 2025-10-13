import { useState, useEffect, useCallback } from 'react';
import { ChevronRight, ChevronDown, User, Users, ShieldCheck, X } from 'lucide-react';
import { getUserRole } from '../utils/Auth';
import { UserRole } from '../constants/Roles';

interface TreeNode {
  id: string;
  companyName: string;
  email: string;
  number: string;
  role: string;
  balance: number;
  totalCampaigns: number;
  status: string;
  directResellers: number;
  directUsers: number;
  level: number;
  children: TreeNode[];
}

interface TreeData {
  totalCount: number;
  tree: TreeNode;
}

const TreeView = () => {
  const [treeData, setTreeData] = useState<TreeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
  const userRole = getUserRole();
  const isAdminOrReseller = userRole === UserRole.ADMIN || userRole === UserRole.RESELLER;

  // Fetch tree data
  const fetchTreeData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/dashboard/tree-view`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setTreeData(result.data);
        // Expand root node by default
        if (result.data.tree) {
          setExpandedNodes(new Set([result.data.tree.id]));
        }
      } else {
        setError(result.message || 'Failed to load tree data');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Tree fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchTreeData();
  }, [fetchTreeData]);

  // Toggle node expansion
  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  // Get role icon and color
  const getRoleStyle = (role: string) => {
    const styles = {
      admin: {
        icon: ShieldCheck,
        color: 'text-blue-600',
        bgColor: 'bg-blue-500/20',
        borderColor: 'border-blue-500'
      },
      reseller: {
        icon: Users,
        color: 'text-green-600',
        bgColor: 'bg-green-500/20',
        borderColor: 'border-green-500'
      },
      user: {
        icon: User,
        color: 'text-orange-600',
        bgColor: 'bg-orange-500/20',
        borderColor: 'border-orange-500'
      }
    };
    return styles[role as keyof typeof styles] || styles.user;
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

  // Open details modal
  const openDetailsModal = (node: TreeNode) => {
    setSelectedNode(node);
    setShowDetailsModal(true);
  };

  // Render tree node recursively
  const renderTreeNode = (node: TreeNode, isLast: boolean = false, prefix: string = '') => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const roleStyle = getRoleStyle(node.role);
    const RoleIcon = roleStyle.icon;

    return (
      <div key={node.id} className="relative">
        {/* Node Content */}
        <div className={`flex items-center gap-2 ${prefix ? 'ml-8' : ''}`}>
          {/* Tree Lines */}
          {prefix && (
            <div className="absolute left-0 top-0 bottom-0 w-8 flex items-center">
              <div className={`w-full h-px bg-gray-300 ${isLast ? 'w-1/2' : ''}`}></div>
            </div>
          )}
          
          {/* Expand/Collapse Button */}
          {hasChildren ? (
            <button
              onClick={() => toggleNode(node.id)}
              className="z-10 p-1 hover:bg-gray-200 rounded-lg transition-all"
            >
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-black" />
              ) : (
                <ChevronRight className="w-5 h-5 text-black" />
              )}
            </button>
          ) : (
            <div className="w-7"></div>
          )}

          {/* Node Card */}
          <div
            onClick={() => openDetailsModal(node)}
            className={`flex-1 flex items-center gap-3 p-3 ${roleStyle.bgColor} backdrop-blur-lg rounded-xl border-2 ${roleStyle.borderColor} shadow-lg hover:shadow-xl transition-all cursor-pointer group`}
          >
            {/* Role Icon */}
            <div className={`p-2 ${roleStyle.bgColor} rounded-lg`}>
              <RoleIcon className={`w-5 h-5 ${roleStyle.color}`} />
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-bold text-black">{node.companyName}</p>
                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${roleStyle.color} ${roleStyle.bgColor} uppercase`}>
                  {node.role}
                </span>
                {node.level <= 3 && (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-gray-200 text-gray-700">
                    L{node.level}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 font-semibold mt-1">
                Balance: <span className="text-green-600 font-bold">₹{node.balance}</span>
                {hasChildren && (
                  <span className="ml-3 text-gray-500">
                    ({node.children.length} {node.children.length === 1 ? 'child' : 'children'})
                  </span>
                )}
              </p>
            </div>

            {/* Hover Indicator */}
            <div className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors">
              Click for details
            </div>
          </div>
        </div>

        {/* Vertical Line for Children */}
        {hasChildren && isExpanded && (
          <div className="absolute left-3.5 top-12 bottom-0 w-px bg-gray-300"></div>
        )}

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="mt-2 space-y-2">
            {node.children.map((child, index) => 
              renderTreeNode(
                child, 
                index === node.children.length - 1,
                prefix + '  '
              )
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="p-8 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl">
          <p className="text-xl font-semibold text-black">Loading Network Tree...</p>
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

  if (error) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-100/60 backdrop-blur-md rounded-xl border border-red-300 shadow-lg">
          <p className="text-red-700 font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  if (!treeData) return null;

  return (
    <div className="space-y-6">
      
      {/* Page Header with Summary */}
      <div className="p-6 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-black">Network Tree View</h2>
            <p className="text-sm text-gray-600 mt-1">Your complete network hierarchy</p>
          </div>
          
          {/* Total Count Card */}
          <div className="p-4 bg-gradient-to-r from-blue-500/20 to-green-500/20 backdrop-blur-md rounded-xl border-2 border-white/60 shadow-lg">
            <p className="text-sm font-bold text-black uppercase opacity-70">Total Network</p>
            <p className="text-4xl font-bold text-black mt-1">{treeData.totalCount}</p>
            <p className="text-xs text-gray-600 mt-1">Total members in your network</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl">
        <p className="text-sm font-bold text-black mb-3">Legend:</p>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-semibold text-black">Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" />
            <span className="text-sm font-semibold text-black">Reseller</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-semibold text-black">User</span>
          </div>
          <div className="flex items-center gap-2">
            <ChevronRight className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-semibold text-black">Click to expand/collapse</span>
          </div>
        </div>
      </div>

      {/* Tree Structure */}
      <div className="p-6 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl">
        <div className="space-y-2">
          {renderTreeNode(treeData.tree)}
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedNode && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl border-2 border-green-500 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-black">Member Details</h3>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedNode(null);
                  }}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-all"
                >
                  <X className="w-6 h-6 text-black" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Role Badge */}
                <div className="flex items-center gap-3">
                  {(() => {
                    const roleStyle = getRoleStyle(selectedNode.role);
                    const RoleIcon = roleStyle.icon;
                    return (
                      <>
                        <div className={`p-3 ${roleStyle.bgColor} rounded-xl`}>
                          <RoleIcon className={`w-8 h-8 ${roleStyle.color}`} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-600">Role</p>
                          <p className={`text-xl font-bold ${roleStyle.color} uppercase`}>
                            {selectedNode.role}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
                  <div>
                    <span className="text-sm font-bold text-gray-600">User ID:</span>
                    <p className="text-black font-semibold break-all text-sm">{selectedNode.id}</p>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-600">Company Name:</span>
                    <p className="text-black font-semibold">{selectedNode.companyName}</p>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-600">Email:</span>
                    <p className="text-black font-semibold break-all text-sm">{selectedNode.email}</p>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-600">Phone Number:</span>
                    <p className="text-black font-semibold">{selectedNode.number}</p>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-600">Balance:</span>
                    <p className="text-green-600 font-bold text-xl">₹{selectedNode.balance}</p>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-600">Total Campaigns:</span>
                    <p className="text-black font-semibold">{selectedNode.totalCampaigns}</p>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-600">Status:</span>
                    <p>
                      <span className={`px-3 py-1 text-white text-xs font-bold rounded-full ${getStatusBadge(selectedNode.status)}`}>
                        {selectedNode.status.toUpperCase()}
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-600">Level:</span>
                    <p className="text-black font-semibold">Level {selectedNode.level}</p>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-600">Direct Resellers:</span>
                    <p className="text-green-600 font-bold text-lg">{selectedNode.directResellers}</p>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-600">Direct Users:</span>
                    <p className="text-orange-600 font-bold text-lg">{selectedNode.directUsers}</p>
                  </div>
                </div>

                {/* Network Summary */}
                <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-300">
                  <p className="text-sm font-bold text-blue-700 mb-2">Network Summary:</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{selectedNode.directResellers}</p>
                      <p className="text-xs text-gray-600">Resellers</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">{selectedNode.directUsers}</p>
                      <p className="text-xs text-gray-600">Users</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{selectedNode.children.length}</p>
                      <p className="text-xs text-gray-600">Total Direct</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="mt-6">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedNode(null);
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
    </div>
  );
};

export default TreeView;
