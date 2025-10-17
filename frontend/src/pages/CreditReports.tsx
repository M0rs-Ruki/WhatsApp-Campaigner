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
  const API_URL = import.meta.env.VITE_API_URL;

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

  const getFilteredTransactions = () => {
    if (!transactionData) return [];
    
    let filtered = transactionData.transactions;
    
    if (startDate && endDate) {
      filtered = filtered.filter(transaction => {
        const transactionDate = new Date(transaction.createdAt);
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
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

  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd-MMM-yyyy hh:mm a');
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="p-6 sm:p-8 bg-white/40 backdrop-blur-lg rounded-xl sm:rounded-2xl border border-white/60 shadow-xl">
          <p className="text-base sm:text-xl font-semibold text-black">Loading Transactions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 sm:p-6">
        <div className="p-3 sm:p-4 bg-red-100/60 backdrop-blur-md rounded-lg sm:rounded-xl border border-red-300 shadow-lg">
          <p className="text-red-700 font-semibold text-sm sm:text-base">{error}</p>
        </div>
      </div>
    );
  }

  if (!transactionData) return null;

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Page Header with Balance - Mobile Optimized */}
      <div className="flex flex-row items-center justify-between gap-3 sm:gap-4 p-4 sm:p-5 md:p-6 bg-white/40 backdrop-blur-lg rounded-xl sm:rounded-2xl border border-white/60 shadow-xl">
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-black">Credit Reports</h2>
          <p className="text-xs sm:text-sm text-black opacity-70 mt-1">Last 100 transactions</p>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-green-500/30 backdrop-blur-md rounded-lg sm:rounded-xl border border-white/50">
          <ArrowUpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-black uppercase opacity-70">Current Balance</p>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">₹{transactionData.currentBalance}</p>
          </div>
        </div>
      </div>

      {/* Filters Section - Mobile Optimized */}
      <div className="p-3 sm:p-4 md:p-6 bg-white/40 backdrop-blur-lg rounded-xl sm:rounded-2xl border border-white/60 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-black flex-shrink-0" />
            <span className="text-xs sm:text-sm font-bold text-black">Duration:</span>
          </div>
          
          <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 bg-white/60 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl border sm:border-2 border-white/80">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-black text-xs sm:text-sm font-semibold focus:outline-none w-full xs:w-auto"
            />
            <span className="text-black font-bold text-center xs:inline hidden">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-black text-xs sm:text-sm font-semibold focus:outline-none w-full xs:w-auto"
            />
          </div>

          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
            className="px-3 sm:px-4 py-2 bg-green-500/60 backdrop-blur-md text-white text-sm font-semibold rounded-lg sm:rounded-xl border border-white/30 hover:bg-green-600/60 transition-all active:scale-95"
          >
            Reset
          </button>

          <div className="sm:ml-auto text-xs sm:text-sm text-black font-semibold">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredTransactions.length)} of {filteredTransactions.length}
          </div>
        </div>
      </div>

      {/* Transaction Table - Desktop View */}
      <div className="hidden md:block p-4 sm:p-5 md:p-6 bg-white/40 backdrop-blur-lg rounded-xl sm:rounded-2xl border border-white/60 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-white/60">
                <th className="text-left py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm font-bold text-black uppercase">ID</th>
                <th className="text-left py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm font-bold text-black uppercase">User/Campaign</th>
                <th className="text-left py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm font-bold text-black uppercase">Points</th>
                <th className="text-left py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm font-bold text-black uppercase">TXN Type</th>
                <th className="text-left py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm font-bold text-black uppercase">Created By</th>
                <th className="text-left py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm font-bold text-black uppercase">Created At</th>
              </tr>
            </thead>
            <tbody>
              {currentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 sm:py-12 text-center text-black opacity-70">
                    <p className="text-base sm:text-lg font-semibold">No transactions found</p>
                    <p className="text-xs sm:text-sm mt-2">Try adjusting your date filters</p>
                  </td>
                </tr>
              ) : (
                currentTransactions.map((transaction, index) => (
                  <tr 
                    key={transaction.transactionId} 
                    className="border-b border-white/30 hover:bg-white/20 transition-all"
                  >
                    <td className="py-3 sm:py-4 px-3 sm:px-4 text-black text-sm font-semibold">
                      {startIndex + index + 1}
                    </td>
                    <td className="py-3 sm:py-4 px-3 sm:px-4 text-black text-sm font-semibold max-w-[150px] sm:max-w-[200px] truncate">
                      {transaction.userOrCampaign}
                    </td>
                    <td className="py-3 sm:py-4 px-3 sm:px-4">
                      <span className={`font-bold text-sm ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'credit' ? '+' : '-'} {transaction.amount}
                      </span>
                    </td>
                    <td className="py-3 sm:py-4 px-3 sm:px-4">
                      {transaction.type === 'credit' ? (
                        <span className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full w-fit">
                          <ArrowDownCircle className="w-3 h-3" />
                          Credit
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 bg-yellow-500 text-white text-xs font-bold rounded-full w-fit">
                          <ArrowUpCircle className="w-3 h-3" />
                          Debit
                        </span>
                      )}
                    </td>
                    <td className="py-3 sm:py-4 px-3 sm:px-4 text-black text-sm font-semibold max-w-[150px] truncate">
                      {transaction.createdBy}
                    </td>
                    <td className="py-3 sm:py-4 px-3 sm:px-4 text-black text-sm font-semibold whitespace-nowrap">
                      {formatDate(transaction.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Cards - Mobile View */}
      <div className="md:hidden space-y-2.5">
        {currentTransactions.length === 0 ? (
          <div className="p-6 bg-white/40 backdrop-blur-lg rounded-xl border border-white/60 shadow-xl text-center">
            <p className="text-base font-semibold text-black opacity-70">No transactions found</p>
            <p className="text-xs text-black opacity-60 mt-2">Try adjusting your date filters</p>
          </div>
        ) : (
          currentTransactions.map((transaction, index) => (
            <div
              key={transaction.transactionId}
              className="p-2.5 bg-white/40 backdrop-blur-lg rounded-lg border border-white/60 shadow-lg"
            >
              {/* Top Row: ID + Type Badge + Amount */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-black opacity-70">#{startIndex + index + 1}</span>
                  {transaction.type === 'credit' ? (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded-full">
                      <ArrowDownCircle className="w-2.5 h-2.5" />
                      Credit
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-500 text-white text-[10px] font-bold rounded-full">
                      <ArrowUpCircle className="w-2.5 h-2.5" />
                      Debit
                    </span>
                  )}
                </div>
                <p className={`text-sm font-bold ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                  {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount}
                </p>
              </div>

              {/* User/Campaign Name */}
              <p className="text-xs font-bold text-black mb-1.5 truncate">{transaction.userOrCampaign}</p>

              {/* Created By + Date in One Row */}
              <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-white/30">
                <div>
                  <span className="text-black opacity-60">By: </span>
                  <span className="text-black font-semibold">{transaction.createdBy}</span>
                </div>
                <span className="text-black opacity-60">{format(new Date(transaction.createdAt), 'dd MMM, hh:mm a')}</span>
              </div>
            </div>
          ))
        )}
      </div>


      {/* Pagination - Mobile Optimized */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-4 bg-white/40 backdrop-blur-lg rounded-xl sm:rounded-2xl border border-white/60 shadow-xl">
          
          {/* Previous Button */}
          <button
            onClick={prevPage}
            disabled={currentPage === 1}
            className="p-1.5 sm:p-2 bg-white/60 backdrop-blur-sm rounded-lg border border-white/80 hover:bg-white/80 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1 sm:gap-2">
            {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 3) {
                pageNum = i + 1;
              } else if (currentPage <= 2) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 1) {
                pageNum = totalPages - 2 + i;
              } else {
                pageNum = currentPage - 1 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  className={`px-2.5 sm:px-4 py-1.5 sm:py-2 text-sm font-bold rounded-lg border-2 transition-all active:scale-95 ${
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
            className="p-1.5 sm:p-2 bg-white/60 backdrop-blur-sm rounded-lg border border-white/80 hover:bg-white/80 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
          </button>

          {/* Last Page (Mobile: Hidden, Desktop: Visible) */}
          {totalPages > 3 && currentPage < totalPages - 1 && (
            <>
              <span className="hidden sm:inline text-black font-bold">...</span>
              <button
                onClick={() => goToPage(totalPages)}
                className="hidden sm:block px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-bold bg-white/60 text-black border-2 border-white/80 rounded-lg hover:bg-white/80 transition-all"
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
