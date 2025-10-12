import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import SendWhatsapp from './pages/SendWhatsapp';
import ManageBusinessPage from './pages/ManageBusiness';
import DashboardPage from './pages/Dashboard';
import CreditReportsPage from './pages/CreditReports';
import NewsPage from './pages/News';




const AddCredits = () => <div><h2 className="text-2xl font-bold text-black">Add Credits</h2></div>;
const ManageReseller = () => <div><h2 className="text-2xl font-bold text-black">Manage Resellers</h2></div>;
const ManageUsers = () => <div><h2 className="text-2xl font-bold text-black">Manage Users</h2></div>;
const CreditReports = () => <div><h2 className="text-2xl font-bold text-black">Credit Reports</h2></div>;
const WhatsAppReport = () => <div><h2 className="text-2xl font-bold text-black">WhatsApp Reports</h2></div>;
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
                  <DashboardPage />
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
                <DashboardLayout><CreditReportsPage /></DashboardLayout>
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
                <DashboardLayout><NewsPage /></DashboardLayout>
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
