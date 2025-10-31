import { useState, useEffect, useCallback } from "react";
import {
  ChevronRight,
  ChevronDown,
  User,
  Users,
  ShieldCheck,
  X,
} from "lucide-react";
import { getUserRole } from "../utils/Auth";
import { UserRole } from "../constants/Roles";

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
  const [error, setError] = useState("");
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
  const userRole = getUserRole();
  const isAdminOrReseller =
    userRole === UserRole.ADMIN || userRole === UserRole.RESELLER;

  // Fetch tree data
  const fetchTreeData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/dashboard/tree-view`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
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
        setError(result.message || "Failed to load tree data");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Tree fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchTreeData();
  }, [fetchTreeData]);

  // Toggle node expansion
  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
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
        color: "text-blue-600",
        bgColor: "bg-blue-500/20",
        borderColor: "border-blue-500",
      },
      reseller: {
        icon: Users,
        color: "text-green-600",
        bgColor: "bg-green-500/20",
        borderColor: "border-green-500",
      },
      user: {
        icon: User,
        color: "text-orange-600",
        bgColor: "bg-orange-500/20",
        borderColor: "border-orange-500",
      },
    };
    return styles[role as keyof typeof styles] || styles.user;
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const badges = {
      active: "bg-green-500",
      inactive: "bg-red-500",
      deleted: "bg-gray-500",
    };
    return badges[status as keyof typeof badges] || "bg-gray-500";
  };

  // Open details modal
  const openDetailsModal = (node: TreeNode) => {
    setSelectedNode(node);
    setShowDetailsModal(true);
  };

  // Render tree node recursively - Mobile Optimized
  // Render tree node recursively - COMPACT VERSION
  const renderTreeNode = (node: TreeNode, depth: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const roleStyle = getRoleStyle(node.role);
    const RoleIcon = roleStyle.icon;

    // Separate users and resellers
    const userChildren =
      node.children?.filter((child) => child.role === "user") || [];
    const resellerChildren =
      node.children?.filter((child) => child.role === "reseller") || [];

    // Indentation multiplier - SMALLER
    const indentClass =
      depth === 0
        ? ""
        : depth === 1
        ? "ml-3 sm:ml-4"
        : depth === 2
        ? "ml-6 sm:ml-8"
        : "ml-9 sm:ml-12";

    return (
      <div key={node.id} className="relative">
        {/* Main Node Card - COMPACT */}
        <div className={`flex items-start gap-1.5 sm:gap-2 ${indentClass}`}>
          {/* Tree Branch Lines */}
          {depth > 0 && (
            <div className="relative flex items-center">
              <div className="absolute -left-1.5 sm:-left-2 top-2.5 sm:top-3 w-1.5 sm:w-2 h-px bg-gray-400"></div>
            </div>
          )}

          {/* Expand/Collapse Button - SMALL */}
          {hasChildren ? (
            <button
              onClick={() => toggleNode(node.id)}
              className="z-10 p-1 hover:bg-gray-200 rounded-lg transition-all flex-shrink-0"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-black" />
              ) : (
                <ChevronRight className="w-4 h-4 text-black" />
              )}
            </button>
          ) : (
            <div className="w-5 flex-shrink-0"></div>
          )}

          {/* Node Card - COMPACT */}
          <div
            onClick={() => openDetailsModal(node)}
            className={`flex-1 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 p-2 sm:p-2.5 ${roleStyle.bgColor} backdrop-blur-lg rounded-lg sm:rounded-xl border sm:border-2 ${roleStyle.borderColor} shadow-md hover:shadow-lg transition-all cursor-pointer group`}
          >
            {/* Role Icon + Basic Info */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div
                className={`p-1 sm:p-1.5 ${roleStyle.bgColor} rounded-lg flex-shrink-0`}
              >
                <RoleIcon
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${roleStyle.color}`}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                  <p className="font-bold text-black text-xs sm:text-sm truncate">
                    {node.companyName}
                  </p>
                  <span
                    className={`px-1.5 py-0.5 text-[9px] sm:text-xs font-bold rounded-full ${roleStyle.color} ${roleStyle.bgColor} uppercase`}
                  >
                    {node.role}
                  </span>
                  {node.level <= 3 && (
                    <span className="px-1.5 py-0.5 text-[9px] sm:text-xs font-bold rounded-full bg-gray-200 text-gray-700">
                      L{node.level}
                    </span>
                  )}
                </div>
                <p className="text-[10px] sm:text-xs text-gray-600 font-semibold mt-0.5">
                  ₹{node.balance}
                  {hasChildren && (
                    <span className="ml-1.5 sm:ml-2 text-gray-500">
                      ({node.children.length})
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Children - NESTED & COMPACT */}
        {hasChildren && isExpanded && (
          <div
            className={`mt-1.5 sm:mt-2 space-y-1.5 sm:space-y-2 relative ${indentClass}`}
          >
            {/* Vertical line */}
            <div className="absolute -left-1.5 sm:-left-2 top-0 bottom-0 w-px bg-gray-300"></div>

            {/* Users Section */}
            {userChildren.length > 0 && (
              <div>
                <div className="ml-1.5 sm:ml-2 mb-1.5 px-2 sm:px-2.5 py-0.5 bg-orange-500/20 rounded-lg border border-orange-300 inline-block">
                  <p className="text-[10px] sm:text-xs font-bold text-orange-700 uppercase">
                    Users ({userChildren.length})
                  </p>
                </div>
                <div className="space-y-1 sm:space-y-1.5">
                  {userChildren.map((child) =>
                    renderTreeNode(child, depth + 1)
                  )}
                </div>
              </div>
            )}

            {/* Resellers Section */}
            {resellerChildren.length > 0 && (
              <div>
                <div className="ml-1.5 sm:ml-2 mb-1.5 px-2 sm:px-2.5 py-0.5 bg-green-500/20 rounded-lg border border-green-300 inline-block">
                  <p className="text-[10px] sm:text-xs font-bold text-green-700 uppercase">
                    Resellers ({resellerChildren.length})
                  </p>
                </div>
                <div className="space-y-1 sm:space-y-1.5">
                  {resellerChildren.map((child) =>
                    renderTreeNode(child, depth + 1)
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="p-6 sm:p-8 bg-white/40 backdrop-blur-lg rounded-xl sm:rounded-2xl border border-white/60 shadow-xl">
          <p className="text-base sm:text-xl font-semibold text-black">
            Loading Network Tree...
          </p>
        </div>
      </div>
    );
  }

  if (!isAdminOrReseller) {
    return (
      <div className="p-3 sm:p-6">
        <div className="p-3 sm:p-4 bg-red-100/60 backdrop-blur-md rounded-lg sm:rounded-xl border border-red-300 shadow-lg">
          <p className="text-red-700 font-semibold text-sm sm:text-base">
            Access Denied. Only Admin and Reseller can access this page.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 sm:p-6">
        <div className="p-3 sm:p-4 bg-red-100/60 backdrop-blur-md rounded-lg sm:rounded-xl border border-red-300 shadow-lg">
          <p className="text-red-700 font-semibold text-sm sm:text-base">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!treeData) return null;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header with Summary - Mobile Optimized */}
      <div className="p-4 sm:p-5 md:p-6 bg-white/40 backdrop-blur-lg rounded-xl sm:rounded-2xl border border-white/60 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-black text-center">
              Network Tree View
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 text-center">
              Your complete network hierarchy
            </p>
          </div>

          {/* Total Count Card */}
          <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-500/20 to-green-500/20 backdrop-blur-md rounded-lg sm:rounded-xl border sm:border-2 border-white/60 shadow-lg">
            <p className="text-xs sm:text-sm font-bold text-black uppercase opacity-70 text-center">
              Total Network
            </p>
            <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-black mt-0.5 sm:mt-1 text-center">
              {treeData.totalCount}
            </p>
            <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5 sm:mt-1 text-center">
              Total members in your network
            </p>
          </div>
        </div>
      </div>

      {/* Legend - Mobile Optimized */}
      <div className="p-3 sm:p-4 bg-white/40 backdrop-blur-lg rounded-xl sm:rounded-2xl border border-white/60 shadow-xl">
        <p className="text-xs sm:text-sm font-bold text-black mb-2 sm:mb-3">
          Legend:
        </p>
        <div className="flex flex-row flex-wrap gap-2 sm:gap-4 justify-start">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-black">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-black">
              Reseller
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <User className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-black">
              User
            </span>
          </div>
        </div>
      </div>

      {/* Tree Structure - Mobile Optimized */}
      <div className="p-3 sm:p-4 md:p-6 bg-white/40 backdrop-blur-lg rounded-xl sm:rounded-2xl border border-white/60 shadow-xl overflow-x-auto">
        <div className="space-y-1.5 sm:space-y-2 min-w-[280px]">
          {renderTreeNode(treeData.tree)}
        </div>
      </div>

      {/* Details Modal - Mobile Optimized */}
      {showDetailsModal && selectedNode && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-xl sm:rounded-2xl border sm:border-2 border-green-500 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-5 md:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-black">
                  Member Details
                </h3>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedNode(null);
                  }}
                  className="p-1.5 sm:p-2 hover:bg-gray-200 rounded-lg transition-all flex-shrink-0"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
                </button>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {/* Role Badge */}
                <div className="flex items-center gap-2 sm:gap-3">
                  {(() => {
                    const roleStyle = getRoleStyle(selectedNode.role);
                    const RoleIcon = roleStyle.icon;
                    return (
                      <>
                        <div
                          className={`p-2 sm:p-3 ${roleStyle.bgColor} rounded-lg sm:rounded-xl flex-shrink-0`}
                        >
                          <RoleIcon
                            className={`w-6 h-6 sm:w-8 sm:h-8 ${roleStyle.color}`}
                          />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-gray-600">
                            Role
                          </p>
                          <p
                            className={`text-base sm:text-lg md:text-xl font-bold ${roleStyle.color} uppercase`}
                          >
                            {selectedNode.role}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Details Grid - Mobile Responsive */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl">
                  <div className="col-span-1 sm:col-span-2">
                    <span className="text-xs sm:text-sm font-bold text-gray-600">
                      User ID:
                    </span>
                    <p className="text-black font-semibold break-all text-xs sm:text-sm">
                      {selectedNode.id}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-gray-600">
                      Company Name:
                    </span>
                    <p className="text-black font-semibold text-sm sm:text-base">
                      {selectedNode.companyName}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-gray-600">
                      Phone Number:
                    </span>
                    <p className="text-black font-semibold text-sm sm:text-base">
                      {selectedNode.number}
                    </p>
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <span className="text-xs sm:text-sm font-bold text-gray-600">
                      Email:
                    </span>
                    <p className="text-black font-semibold break-all text-xs sm:text-sm">
                      {selectedNode.email}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-gray-600">
                      Balance:
                    </span>
                    <p className="text-green-600 font-bold text-lg sm:text-xl">
                      ₹{selectedNode.balance}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-gray-600">
                      Total Campaigns:
                    </span>
                    <p className="text-black font-semibold text-sm sm:text-base">
                      {selectedNode.totalCampaigns}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-gray-600">
                      Status:
                    </span>
                    <p>
                      <span
                        className={`px-2 sm:px-3 py-0.5 sm:py-1 text-white text-xs font-bold rounded-full ${getStatusBadge(
                          selectedNode.status
                        )}`}
                      >
                        {selectedNode.status.toUpperCase()}
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-gray-600">
                      Level:
                    </span>
                    <p className="text-black font-semibold text-sm sm:text-base">
                      Level {selectedNode.level}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-gray-600">
                      Direct Resellers:
                    </span>
                    <p className="text-green-600 font-bold text-base sm:text-lg">
                      {selectedNode.directResellers}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-gray-600">
                      Direct Users:
                    </span>
                    <p className="text-orange-600 font-bold text-base sm:text-lg">
                      {selectedNode.directUsers}
                    </p>
                  </div>
                </div>

                {/* Network Summary - Mobile Grid */}
                <div className="p-3 sm:p-4 bg-blue-50 rounded-lg sm:rounded-xl border sm:border-2 border-blue-300">
                  <p className="text-xs sm:text-sm font-bold text-blue-700 mb-2">
                    Network Summary:
                  </p>
                  <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    <div className="text-center">
                      <p className="text-xl sm:text-2xl font-bold text-blue-600">
                        {selectedNode.directResellers}
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-600">
                        Resellers
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl sm:text-2xl font-bold text-orange-600">
                        {selectedNode.directUsers}
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-600">
                        Users
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl sm:text-2xl font-bold text-green-600">
                        {selectedNode.children.length}
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-600">
                        Total Direct
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Close Button - Full Width on Mobile */}
              <div className="mt-4 sm:mt-6">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedNode(null);
                  }}
                  className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-green-500 text-white text-sm sm:text-base font-bold rounded-lg sm:rounded-xl hover:bg-green-600 transition-all active:scale-95"
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
