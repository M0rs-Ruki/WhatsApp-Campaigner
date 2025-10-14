import { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Marquee from 'react-fast-marquee';
import { Wallet, Users, Settings, TrendingUp, Calendar, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { getUserRole } from '../utils/Auth';
import { UserRole } from '../constants/Roles';

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
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);
  
  const API_URL = import.meta.env.VITE_API_URL;
  const userRole = getUserRole();

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/dashboard/home`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setDashboardData(result.data);
      } else {
        setError(result.message || 'Failed to load dashboard data');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Dashboard fetch error:', err);
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
      data = data.filter(item => {
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
        <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl border-2 border-green-500 shadow-xl">
          <p className="font-bold text-black">{payload[0].payload.month}</p>
          <p className="text-green-600 font-semibold">
            Campaigns: {payload[0].value}
          </p>
          <p className="text-black font-semibold">
            People Targeted: {payload[0].payload.cumulativeMessages}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="p-8 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl">
          <p className="text-xl font-semibold text-black">Loading Dashboard...</p>
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

  if (!dashboardData) return null;

  const filteredData = getFilteredChartData();

  return (
    <div className="space-y-6">
      
      {/* ✅ UPDATED: Dynamic Latest News Ticker */}
      {/* ✅ SAFE VERSION - Shows news or message */}
      {dashboardData.latestNews ? (
        <div className="bg-gradient-to-r from-red-500 to-orange-500 backdrop-blur-md rounded-xl border border-white/30 shadow-lg overflow-hidden">
          <Marquee pauseOnHover gradient={false} speed={50}>
            <div className="flex items-center gap-8 py-3 px-4">
              <span className="text-white font-bold text-lg">
                🔔 {dashboardData.latestNews.title}
              </span>
              <span className="text-white font-semibold text-lg">
                • {dashboardData.latestNews.description}
              </span>
              <span className="text-white font-semibold text-base opacity-80">
                📅 {new Date(dashboardData.latestNews.createdAt).toLocaleDateString('en-IN')}
              </span>
            </div>
          </Marquee>
        </div>
      ) : (
        <div className="bg-yellow-500/80 backdrop-blur-md rounded-xl border border-white/30 shadow-lg p-4">
          <p className="text-white font-bold text-center">
            ⚠️ No news available at the moment
          </p>
        </div>
      )}



      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Available Balance */}
        <div className="p-6 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl hover:shadow-2xl transition-all">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-green-500/30 backdrop-blur-sm rounded-xl">
              <Wallet className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-black uppercase opacity-70">Available Balance</p>
              <p className="text-3xl font-bold text-black mt-1">₹{dashboardData.balance}</p>
            </div>
          </div>
        </div>

        {/* Total Resellers - Only show for Admin/Reseller */}
        {(userRole === UserRole.ADMIN || userRole === UserRole.RESELLER) && (
          <div className="p-6 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl hover:shadow-2xl transition-all">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-blue-500/30 backdrop-blur-sm rounded-xl">
                <Settings className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-black uppercase opacity-70">Total Resellers</p>
                <p className="text-3xl font-bold text-black mt-1">{dashboardData.totalReseller}</p>
              </div>
            </div>
          </div>
        )}

        {/* Total Users - Only show for Admin/Reseller */}
        {(userRole === UserRole.ADMIN || userRole === UserRole.RESELLER) && (
          <div className="p-6 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl hover:shadow-2xl transition-all">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-yellow-500/30 backdrop-blur-sm rounded-xl">
                <Users className="w-8 h-8 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-black uppercase opacity-70">Total Users</p>
                <p className="text-3xl font-bold text-black mt-1">{dashboardData.totalUsers}</p>
              </div>
            </div>
          </div>
        )}

        {/* Total Campaigns */}
        <div className="p-6 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl hover:shadow-2xl transition-all">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-purple-500/30 backdrop-blur-sm rounded-xl">
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-black uppercase opacity-70">Total Campaigns</p>
              <p className="text-3xl font-bold text-black mt-1">{dashboardData.totalCampaigns}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart Section - Takes 2 columns */}
        <div className="lg:col-span-2 p-6 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl">
          
          {/* Chart Header with Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h3 className="text-2xl font-bold text-black">Day Wise Usage Graph</h3>
            
            <div className="flex items-center gap-3">
              {/* Date Range Inputs */}
              <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-3 py-2 rounded-xl border border-white/80">
                <Calendar className="w-4 h-4 text-black" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent text-black text-sm focus:outline-none"
                />
                <span className="text-black">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent text-black text-sm focus:outline-none"
                />
              </div>

              {/* Zoom Controls */}
              <button
                onClick={() => setZoomLevel(prev => Math.min(prev + 0.2, 2))}
                className="p-2 bg-white/60 backdrop-blur-sm rounded-lg border border-white/80 hover:bg-white/80 transition-all"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4 text-black" />
              </button>
              <button
                onClick={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.5))}
                className="p-2 bg-white/60 backdrop-blur-sm rounded-lg border border-white/80 hover:bg-white/80 transition-all"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4 text-black" />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="p-2 bg-white/60 backdrop-blur-sm rounded-lg border border-white/80 hover:bg-white/80 transition-all"
                title="Reset"
              >
                <Maximize2 className="w-4 h-4 text-black" />
              </button>
            </div>
          </div>

          {/* Recharts Line Chart */}
          <div style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={filteredData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                <XAxis 
                  dataKey="month" 
                  stroke="#000"
                  style={{ fontSize: '12px', fontWeight: '600' }}
                />
                <YAxis 
                  stroke="#000"
                  style={{ fontSize: '12px', fontWeight: '600' }}
                  label={{ value: 'Campaigns', angle: -90, position: 'insideLeft', style: { fill: '#000' } }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="totalMessages" 
                  stroke="#22c55e" 
                  strokeWidth={3}
                  dot={{ fill: '#22c55e', r: 5 }}
                  activeDot={{ r: 8 }}
                  name="Total Messages"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Last 5 Campaign Status Table */}
        <div className="p-6 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl">
          <h3 className="text-2xl font-bold text-black mb-4">Last 5 Campaign Status</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-white/60">
                  <th className="text-left py-3 px-2 text-sm font-bold text-black uppercase">SN</th>
                  <th className="text-left py-3 px-2 text-sm font-bold text-black uppercase">Campaign</th>
                  <th className="text-left py-3 px-2 text-sm font-bold text-black uppercase">Messages</th>
                  <th className="text-left py-3 px-2 text-sm font-bold text-black uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.topFiveCampaigns.map((campaign, index) => (
                  <tr key={campaign._id} className="border-b border-white/30 hover:bg-white/20 transition-all">
                    <td className="py-3 px-2 text-black font-semibold">{index + 1}</td>
                    <td className="py-3 px-2 text-black font-semibold truncate max-w-[120px]">
                      {campaign.campaignName}
                    </td>
                    <td className="py-3 px-2 text-black font-semibold">{campaign.numberCount}</td>
                    <td className="py-3 px-2">
                      <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                        SENT
                      </span>
                    </td>
                  </tr>
                ))}
                {dashboardData.topFiveCampaigns.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-black opacity-70">
                      No campaigns yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
