import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import SendWhatsapp from './pages/SendWhatsapp';
import ManageBusinessPage from './pages/ManageBusiness';


// Dashboard Pages
const Dashboard = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="p-6 bg-white/30 backdrop-blur-lg rounded-xl border border-white/50 shadow-xl">
        <h3 className="text-sm font-semibold text-black uppercase opacity-70">Total Messages</h3>
        <p className="text-4xl font-bold text-black mt-2">12,450</p>
      </div>
      <div className="p-6 bg-green-500/20 backdrop-blur-lg rounded-xl border border-white/50 shadow-xl">
        <h3 className="text-sm font-semibold text-black uppercase opacity-70">Delivered</h3>
        <p className="text-4xl font-bold text-black mt-2">11,890</p>
      </div>
      <div className="p-6 bg-white/40 backdrop-blur-lg rounded-xl border border-green-200/50 shadow-xl">
        <h3 className="text-sm font-semibold text-black uppercase opacity-70">Credits Left</h3>
        <p className="text-4xl font-bold text-black mt-2">1,250</p>
      </div>
    </div>
  </div>
);

const AddCredits = () => <div><h2 className="text-2xl font-bold text-black">Add Credits</h2></div>;
const Credits = () => <div><h2 className="text-2xl font-bold text-black">Credits Management</h2></div>;
const ManageReseller = () => <div><h2 className="text-2xl font-bold text-black">Manage Resellers</h2></div>;
const ManageUsers = () => <div><h2 className="text-2xl font-bold text-black">Manage Users</h2></div>;
const CreditReports = () => <div><h2 className="text-2xl font-bold text-black">Credit Reports</h2></div>;
const WhatsAppReport = () => <div><h2 className="text-2xl font-bold text-black">WhatsApp Reports</h2></div>;
const News = () => <div><h2 className="text-2xl font-bold text-black">News</h2></div>;
const TreeView = () => <div><h2 className="text-2xl font-bold text-black">Tree View</h2></div>;
const Complaints = () => <div><h2 className="text-2xl font-bold text-black">Complaints</h2></div>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route - Login */}
        <Route path="/" element={<Login />} />

        {/* Protected Routes - Dashboard */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </div>
            </ProtectedRoute>
          }
        />

        <Route
          path="/send-whatsapp"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
                <DashboardLayout><SendWhatsapp /></DashboardLayout>
              </div>
            </ProtectedRoute>
          }
        />

        <Route
          path="/credits"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
                <DashboardLayout><Credits /></DashboardLayout>
              </div>
            </ProtectedRoute>
          }
        />

        <Route
          path="/add-credits"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
                <DashboardLayout><AddCredits /></DashboardLayout>
              </div>
            </ProtectedRoute>
          }
        />

        <Route
          path="/manage-reseller"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
                <DashboardLayout><ManageReseller /></DashboardLayout>
              </div>
            </ProtectedRoute>
          }
        />

        <Route
          path="/manage-users"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
                <DashboardLayout><ManageUsers /></DashboardLayout>
              </div>
            </ProtectedRoute>
          }
        />

        <Route
          path="/credit-reports"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
                <DashboardLayout><CreditReports /></DashboardLayout>
              </div>
            </ProtectedRoute>
          }
        />

        <Route
          path="/whatsapp-report"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
                <DashboardLayout><WhatsAppReport /></DashboardLayout>
              </div>
            </ProtectedRoute>
          }
        />

        <Route
          path="/news"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
                <DashboardLayout><News /></DashboardLayout>
              </div>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tree-view"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
                <DashboardLayout><TreeView /></DashboardLayout>
              </div>
            </ProtectedRoute>
          }
        />

        <Route
          path="/complaints"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
                <DashboardLayout><Complaints /></DashboardLayout>
              </div>
            </ProtectedRoute>
          }
        />

        <Route
          path="/manage-business"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
                <DashboardLayout><ManageBusinessPage /></DashboardLayout>
              </div>
            </ProtectedRoute>
          }
        />

        {/* 404 Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
