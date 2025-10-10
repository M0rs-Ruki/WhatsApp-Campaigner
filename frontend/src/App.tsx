import DashboardLayout from './components/layout/Layout';

function App() {
  return (
    <DashboardLayout>
      
      {/* Dashboard Content */}
      <div className="space-y-6">
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-lg font-black text-gray-600">Total Messages</h3>
            <p className="text-4xl font-black mt-2">12,450</p>
          </div>

          <div className="p-6 bg-green-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-lg font-black text-gray-600">Delivered</h3>
            <p className="text-4xl font-black mt-2">11,890</p>
          </div>

          <div className="p-6 bg-yellow-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-lg font-black text-gray-600">Credits Left</h3>
            <p className="text-4xl font-black mt-2">1,250</p>
          </div>
        </div>

        {/* Action Button Example */}
        <button className="px-8 py-4 bg-blue-400 border-4 border-black font-black text-lg shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
          Send New Campaign
        </button>
      </div>
      
    </DashboardLayout>
  );
}

export default App;
