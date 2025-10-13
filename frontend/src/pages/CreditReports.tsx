import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Transaction {
  transactionId: string;
  userOrCampaign: string;
  amount: number;
  type: 'credit' | 'debit';
  createdBy: string;
  createdAt: string;
  status: string;
  balanceBefore: number;
  balanceAfter: number;
}

interface TransactionData {
  currentBalance: number;
  totalTransactions: number;
  transactions: Transaction[];
}

const CreditReports = () => {
  const [transactionData, setTransactionData] = useState<TransactionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const ITEMS_PER_PAGE = 10;
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  // Fetch transaction data
  const fetchTransactionData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/dashboard/transaction`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setTransactionData(result.data);
      } else {
        setError(result.message || 'Failed to load transaction data');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Transaction fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchTransactionData();
  }, [fetchTransactionData]);

  // Filter transactions by date range
  const getFilteredTransactions = () => {
    if (!transactionData) return [];
    
    let filtered = transactionData.transactions;
    
    if (startDate && endDate) {
      filtered = filtered.filter(transaction => {
        const transactionDate = new Date(transaction.createdAt);
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include end of day
        return transactionDate >= start && transactionDate <= end;
      });
    }
    
    return filtered;
  };

  const filteredTransactions = getFilteredTransactions();
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate]);

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd-MMM-yyyy hh:mm a');
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="p-8 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl">
          <p className="text-xl font-semibold text-black">Loading Transactions...</p>
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

  if (!transactionData) return null;

  return (
    <div className="space-y-6">
      
      {/* Page Header with Balance */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl">
        <div>
          <h2 className="text-3xl font-bold text-black">Credit Reports</h2>
          <p className="text-sm text-black opacity-70 mt-1">Last 100 transactions</p>
        </div>
        
        <div className="flex items-center gap-3 p-4 bg-green-500/30 backdrop-blur-md rounded-xl border border-white/50">
          <ArrowUpCircle className="w-6 h-6 text-green-600" />
          <div>
            <p className="text-xs font-bold text-black uppercase opacity-70">Current Balance</p>
            <p className="text-2xl font-bold text-green-600">₹{transactionData.currentBalance}</p>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="p-6 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-black" />
            <span className="text-sm font-bold text-black">Duration:</span>
          </div>
          
          <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-xl border-2 border-white/80">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-black text-sm font-semibold focus:outline-none"
            />
            <span className="text-black font-bold">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-black text-sm font-semibold focus:outline-none"
            />
          </div>

          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
            className="px-4 py-2 bg-green-500/60 backdrop-blur-md text-white font-semibold rounded-xl border border-white/30 hover:bg-green-600/60 transition-all"
          >
            Reset
          </button>

          <div className="ml-auto text-sm text-black font-semibold">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredTransactions.length)} of {filteredTransactions.length} entries
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="p-6 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-white/60">
                <th className="text-left py-4 px-4 text-sm font-bold text-black uppercase">ID</th>
                <th className="text-left py-4 px-4 text-sm font-bold text-black uppercase">User/Campaign</th>
                <th className="text-left py-4 px-4 text-sm font-bold text-black uppercase">Points</th>
                <th className="text-left py-4 px-4 text-sm font-bold text-black uppercase">TXN Type</th>
                <th className="text-left py-4 px-4 text-sm font-bold text-black uppercase">Created By</th>
                <th className="text-left py-4 px-4 text-sm font-bold text-black uppercase">Created At</th>
              </tr>
            </thead>
            <tbody>
              {currentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-black opacity-70">
                    <p className="text-lg font-semibold">No transactions found</p>
                    <p className="text-sm mt-2">Try adjusting your date filters</p>
                  </td>
                </tr>
              ) : (
                currentTransactions.map((transaction, index) => (
                  <tr 
                    key={transaction.transactionId} 
                    className="border-b border-white/30 hover:bg-white/20 transition-all"
                  >
                    <td className="py-4 px-4 text-black font-semibold">
                      {startIndex + index + 1}
                    </td>
                    <td className="py-4 px-4 text-black font-semibold max-w-[200px] truncate">
                      {transaction.userOrCampaign}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`font-bold ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'credit' ? '+' : '-'} {transaction.amount}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {transaction.type === 'credit' ? (
                        <span className="flex items-center gap-2 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full w-fit">
                          <ArrowDownCircle className="w-3 h-3" />
                          Credit
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 px-3 py-1 bg-yellow-500 text-white text-xs font-bold rounded-full w-fit">
                          <ArrowUpCircle className="w-3 h-3" />
                          Debit
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-black font-semibold max-w-[180px] truncate">
                      {transaction.createdBy}
                    </td>
                    <td className="py-4 px-4 text-black font-semibold whitespace-nowrap">
                      {formatDate(transaction.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 p-4 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-xl">
          
          {/* Previous Button */}
          <button
            onClick={prevPage}
            disabled={currentPage === 1}
            className="p-2 bg-white/60 backdrop-blur-sm rounded-lg border border-white/80 hover:bg-white/80 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5 text-black" />
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-2">
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
                  onClick={() => goToPage(pageNum)}
                  className={`px-4 py-2 font-bold rounded-lg border-2 transition-all ${
                    currentPage === pageNum
                      ? 'bg-green-500 text-white border-green-600 shadow-lg'
                      : 'bg-white/60 text-black border-white/80 hover:bg-white/80'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          <button
            onClick={nextPage}
            disabled={currentPage === totalPages}
            className="p-2 bg-white/60 backdrop-blur-sm rounded-lg border border-white/80 hover:bg-white/80 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5 text-black" />
          </button>

          {/* Go to Last Page */}
          {totalPages > 5 && currentPage < totalPages - 2 && (
            <>
              <span className="text-black font-bold">...</span>
              <button
                onClick={() => goToPage(totalPages)}
                className="px-4 py-2 font-bold bg-white/60 text-black border-2 border-white/80 rounded-lg hover:bg-white/80 transition-all"
              >
                {totalPages}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CreditReports;
