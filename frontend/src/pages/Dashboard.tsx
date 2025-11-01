import { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Marquee from "react-fast-marquee";
import {
  Wallet,
  Users,
  Settings,
  TrendingUp,
  Calendar,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";
import { getUserRole } from "../utils/Auth";
import { UserRole } from "../constants/Roles";

interface DashboardData {
  companyName: string;
  image: string;
  role: string;
  balance: number;
  totalReseller: number;
  totalUsers: number;
  totalCampaigns: number;
  totalMessages: number;
  monthlyStats: Array<{
    month: string;
    totalMessages: number;
    cumulativeMessages: number;
  }>;
  topFiveCampaigns: Array<{
    _id: string;
    campaignName: string;
    numberCount: number;
    status: string;
    createdAt: string;
  }>;
  latestNews: {
    title: string;
    description: string;
    status: string;
    createdAt: string;
  };
}

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [chartHeight, setChartHeight] = useState(400);

  const API_URL = import.meta.env.VITE_API_URL;
  const userRole = getUserRole();

  // Dynamic chart height based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setChartHeight(250); // Mobile
      } else if (window.innerWidth < 1024) {
        setChartHeight(300); // Tablet
      } else {
        setChartHeight(400); // Desktop
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial call

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/dashboard/home`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setDashboardData(result.data);
      } else {
        setError(result.message || "Failed to load dashboard data");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Filter data by date range
  const getFilteredChartData = () => {
    if (!dashboardData) return [];

    let data = dashboardData.monthlyStats;

    if (startDate && endDate) {
      data = data.filter((item) => {
        const itemDate = new Date(item.month);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return itemDate >= start && itemDate <= end;
      });
    }

    return data;
  };

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 backdrop-blur-md p-3 sm:p-4 rounded-lg sm:rounded-xl border border-green-500 sm:border-2 shadow-xl">
          <p className="font-bold text-black text-xs sm:text-sm">
            {payload[0].payload.month}
          </p>
          <p className="text-green-600 font-semibold text-xs sm:text-sm">
            Campaigns: {payload[0].value}
          </p>
          <p className="text-black font-semibold text-xs sm:text-sm">
            People: {payload[0].payload.cumulativeMessages}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="p-6 sm:p-8 bg-white/40 backdrop-blur-lg rounded-xl sm:rounded-2xl border border-white/60 shadow-xl">
          <p className="text-base sm:text-xl font-semibold text-black">
            Loading Dashboard...
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

  if (!dashboardData) return null;

  const filteredData = getFilteredChartData();

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Latest News Ticker - Mobile Optimized */}
      {dashboardData.latestNews ? (
        <div className="bg-gradient-to-r from-red-500 to-orange-500 backdrop-blur-md rounded-lg sm:rounded-xl border border-white/30 shadow-lg overflow-hidden">
          <Marquee pauseOnHover gradient={false} speed={50}>
            <div className="flex items-center gap-4 sm:gap-8 py-2 sm:py-3 px-3 sm:px-4">
              <span className="text-white font-bold text-sm sm:text-base md:text-lg">
                🔔 {dashboardData.latestNews.title}
              </span>
              <span className="text-white font-semibold text-sm sm:text-base md:text-lg">
                • {dashboardData.latestNews.description}
              </span>
              <span className="text-white font-semibold text-xs sm:text-sm md:text-base opacity-80">
                📅{" "}
                {new Date(
                  dashboardData.latestNews.createdAt
                ).toLocaleDateString("en-IN")}
              </span>
            </div>
          </Marquee>
        </div>
      ) : (
        <div className="bg-yellow-500/80 backdrop-blur-md rounded-lg sm:rounded-xl border border-white/30 shadow-lg p-3 sm:p-4">
          <p className="text-white font-bold text-center text-sm sm:text-base">
            ⚠️ No news available at the moment
          </p>
        </div>
      )}

      {/* Stats Cards Grid - Fully Responsive */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {/* Available Balance */}
        <div className="p-4 sm:p-5 md:p-6 bg-white/40 backdrop-blur-lg rounded-xl sm:rounded-2xl border border-white/60 shadow-xl hover:shadow-2xl transition-all">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 bg-green-500/30 backdrop-blur-sm rounded-lg sm:rounded-xl flex-shrink-0">
              <Wallet className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-black uppercase opacity-70 truncate">
                Available Balance
              </p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-black mt-0.5 sm:mt-1">
                ₹{dashboardData.balance}
              </p>
            </div>
          </div>
        </div>

        {/* Total Resellers - Only for Admin/Reseller */}
        {(userRole === UserRole.ADMIN || userRole === UserRole.RESELLER) && (
          <div className="p-4 sm:p-5 md:p-6 bg-white/40 backdrop-blur-lg rounded-xl sm:rounded-2xl border border-white/60 shadow-xl hover:shadow-2xl transition-all">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-blue-500/30 backdrop-blur-sm rounded-lg sm:rounded-xl flex-shrink-0">
                <Settings className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-black uppercase opacity-70 truncate">
                  Total Resellers
                </p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-black mt-0.5 sm:mt-1">
                  {dashboardData.totalReseller}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Total Users - Only for Admin/Reseller */}
        {(userRole === UserRole.ADMIN || userRole === UserRole.RESELLER) && (
          <div className="p-4 sm:p-5 md:p-6 bg-white/40 backdrop-blur-lg rounded-xl sm:rounded-2xl border border-white/60 shadow-xl hover:shadow-2xl transition-all">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-yellow-500/30 backdrop-blur-sm rounded-lg sm:rounded-xl flex-shrink-0">
                <Users className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-yellow-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-black uppercase opacity-70 truncate">
                  Total Users
                </p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-black mt-0.5 sm:mt-1">
                  {dashboardData.totalUsers}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Total Campaigns */}
        <div className="p-4 sm:p-5 md:p-6 bg-white/40 backdrop-blur-lg rounded-xl sm:rounded-2xl border border-white/60 shadow-xl hover:shadow-2xl transition-all">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 bg-purple-500/30 backdrop-blur-sm rounded-lg sm:rounded-xl flex-shrink-0">
              <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-purple-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-black uppercase opacity-70 truncate">
                Total Campaigns
              </p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-black mt-0.5 sm:mt-1">
                {dashboardData.totalCampaigns}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid - Chart + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Chart Section - Mobile Optimized */}
        <div className="lg:col-span-2 p-4 sm:p-5 md:p-6 bg-white/40 backdrop-blur-lg rounded-xl sm:rounded-2xl border border-white/60 shadow-xl">
          {/* Chart Header with Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-black">
              Day Wise Usage Graph
            </h3>

            {/* Control Buttons - Stacked on mobile */}
            <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 sm:gap-3">
              {/* Date Range Inputs - Full width on mobile */}
              <div className="flex items-center gap-1 sm:gap-2 bg-white/60 backdrop-blur-sm px-2 sm:px-3 py-2 rounded-lg sm:rounded-xl border border-white/80">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-black flex-shrink-0" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent text-black text-xs sm:text-sm focus:outline-none w-full min-w-0"
                />
                <span className="text-black text-xs sm:text-sm">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent text-black text-xs sm:text-sm focus:outline-none w-full min-w-0"
                />
              </div>

              {/* Zoom Controls - Horizontal on mobile */}
              <div className="flex items-center gap-2 justify-center xs:justify-start">
                <button
                  onClick={() =>
                    setZoomLevel((prev) => Math.min(prev + 0.2, 2))
                  }
                  className="p-2 bg-white/60 backdrop-blur-sm rounded-lg border border-white/80 hover:bg-white/80 active:scale-95 transition-all"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3 h-3 sm:w-4 sm:h-4 text-black" />
                </button>
                <button
                  onClick={() =>
                    setZoomLevel((prev) => Math.max(prev - 0.2, 0.5))
                  }
                  className="p-2 bg-white/60 backdrop-blur-sm rounded-lg border border-white/80 hover:bg-white/80 active:scale-95 transition-all"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3 h-3 sm:w-4 sm:h-4 text-black" />
                </button>
                <button
                  onClick={() => setZoomLevel(1)}
                  className="p-2 bg-white/60 backdrop-blur-sm rounded-lg border border-white/80 hover:bg-white/80 active:scale-95 transition-all"
                  title="Reset"
                >
                  <Maximize2 className="w-3 h-3 sm:w-4 sm:h-4 text-black" />
                </button>
              </div>
            </div>
          </div>

          {/* Recharts Line Chart - Fully Responsive */}
          <div className="w-full overflow-x-auto -mx-2 sm:mx-0">
            <div
              className="min-w-[300px]"
              style={{
                transform:
                  window.innerWidth >= 640 ? `scale(${zoomLevel})` : "scale(1)",
                transformOrigin: "top left",
              }}
            >
              <ResponsiveContainer width="100%" height={chartHeight}>
                <LineChart
                  data={filteredData}
                  margin={{
                    top: 5,
                    right: window.innerWidth < 640 ? 10 : 30,
                    left: window.innerWidth < 640 ? -10 : 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(0,0,0,0.1)"
                  />
                  <XAxis
                    dataKey="month"
                    stroke="#000"
                    style={{
                      fontSize: window.innerWidth < 640 ? "10px" : "12px",
                      fontWeight: "600",
                    }}
                    angle={window.innerWidth < 640 ? -45 : 0}
                    textAnchor={window.innerWidth < 640 ? "end" : "middle"}
                    height={window.innerWidth < 640 ? 60 : 30}
                  />
                  <YAxis
                    stroke="#000"
                    style={{
                      fontSize: window.innerWidth < 640 ? "10px" : "12px",
                      fontWeight: "600",
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{
                      fontSize: window.innerWidth < 640 ? "10px" : "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="totalMessages"
                    stroke="#22c55e"
                    strokeWidth={window.innerWidth < 640 ? 2 : 3}
                    dot={{
                      fill: "#22c55e",
                      r: window.innerWidth < 640 ? 3 : 5,
                    }}
                    activeDot={{ r: window.innerWidth < 640 ? 5 : 8 }}
                    name="Total Messages"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Last 5 Campaign Status Table - Mobile Card Layout */}
        <div className="p-4 sm:p-5 md:p-6 bg-white/40 backdrop-blur-lg rounded-xl sm:rounded-2xl border border-white/60 shadow-xl">
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-black mb-3 sm:mb-4">
            Last 5 Campaign Status
          </h3>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-white/60">
                  <th className="text-left py-2 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm font-bold text-black uppercase">
                    SN
                  </th>
                  <th className="text-left py-2 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm font-bold text-black uppercase">
                    Campaign
                  </th>
                  <th className="text-left py-2 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm font-bold text-black uppercase">
                    Messages
                  </th>
                  <th className="text-left py-2 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm font-bold text-black uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.topFiveCampaigns.map((campaign, index) => (
                  <tr
                    key={campaign._id}
                    className="border-b border-white/30 hover:bg-white/20 transition-all"
                  >
                    <td className="py-2 sm:py-3 px-1 sm:px-2 text-black font-semibold text-xs sm:text-sm">
                      {index + 1}
                    </td>
                    <td className="py-2 sm:py-3 px-1 sm:px-2 text-black font-semibold text-xs sm:text-sm truncate max-w-[80px] sm:max-w-[120px]">
                      {campaign.campaignName}
                    </td>
                    <td className="py-2 sm:py-3 px-1 sm:px-2 text-black font-semibold text-xs sm:text-sm text-center">
                      {campaign.numberCount}
                    </td>
                    <td className="py-2 sm:py-3 px-1 sm:px-2">
                      <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                        {campaign.status || "None"}
                      </span>
                    </td>
                  </tr>
                ))}
                {dashboardData.topFiveCampaigns.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-6 text-center text-black opacity-70 text-sm"
                    >
                      No campaigns yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Compact List View */}
          <div className="sm:hidden space-y-2">
            {dashboardData.topFiveCampaigns.map((campaign, index) => (
              <div
                key={campaign._id}
                className="p-2.5 bg-white/30 backdrop-blur-sm rounded-lg border border-white/50 hover:bg-white/40 transition-all"
              >
                {/* Top Row: Number + Status */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-black font-bold text-xs">
                    #{index + 1}
                  </span>
                </div>

                {/* Campaign Name */}
                <p className="text-black font-bold text-sm mb-1.5 truncate">
                  {campaign.campaignName}
                </p>

                {/* Messages Count */}
                <div className="flex items-center justify-between">
                  <span className="text-black text-xs font-medium opacity-70">
                    Messages:
                  </span>
                  <span className="text-black text-xs font-bold">
                    {campaign.numberCount}
                  </span>
                </div>
              </div>
            ))}
            {dashboardData.topFiveCampaigns.length === 0 && (
              <div className="py-6 text-center text-black opacity-70 text-sm">
                No campaigns yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
