import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import SendWhatsapp from './pages/SendWhatsapp';
import ManageBusinessPage from './pages/ManageBusiness';
import DashboardPage from './pages/Dashboard';
import CreditReportsPage from './pages/CreditReports';
import NewsPage from './pages/News';
import ComplaintsPage from './pages/Complaints';
import ManageResellerPage from './pages/ManageReseller';
import ManageUserPage from './pages/ManageUser';
import TreeViewPage from './pages/TreeView';
import WhatsAppReportsPage from './pages/WhatsAppReports';
import AllCampaignPage from './pages/AllCampaigns';
import DocumentationPage from './pages/Documentation';




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
          path="/manage-reseller"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
                <DashboardLayout><ManageResellerPage /></DashboardLayout>
              </div>
            </ProtectedRoute>
          }
        />

        <Route
          path="/manage-users"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
                <DashboardLayout><ManageUserPage /></DashboardLayout>
              </div>
            </ProtectedRoute>
          }
        />


        <Route
          path="/whatsapp-report"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
                <DashboardLayout><WhatsAppReportsPage /></DashboardLayout>
              </div>
            </ProtectedRoute>
          }
        />

        <Route
          path='/all-campaign'
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
                <DashboardLayout><AllCampaignPage /></DashboardLayout>
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
                <DashboardLayout><TreeViewPage /></DashboardLayout>
              </div>
            </ProtectedRoute>
          }
        />

        <Route
          path="/complaints"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
                <DashboardLayout><ComplaintsPage /></DashboardLayout>
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

        <Route
          path= "/docs"
          element={
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
              <DashboardLayout><DocumentationPage /></DashboardLayout>
            </div>
          }
        />

        <Route
          path= "/support"
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
