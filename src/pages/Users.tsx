import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Plus,
  User as UserIcon,
  Building2,
  Calendar,
  Globe,
  Mail,
  Settings,
  MoreHorizontal,
  Edit3,
  Trash2,
  Shield,
  Activity,
  DollarSign,
  Percent,
  Timer,
  Wallet,
  Copy,
  Check,
  X,
  BarChart3,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import Chart from 'react-apexcharts';
import CustomSelect from '../components/CustomSelect';
import DatePicker from '../components/DatePicker';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  useGetUsers, 
  useUser, 
  useCreateUser, 
  useUpdateUser, 
  useDeleteUser,
  useSuspendUser,
  useActivateUser,
  type User,
  type UserFilters,
  type AddUserFormData,
  type EditUserFormData,
  type GatewaySettings,
  validateUserData
} from '../hooks/useUsers';
import { 
  useAdmin,
  type MerchantStatisticsFilters 
} from '../hooks/useAdmin';
import { getGatewayInfo, GATEWAY_INFO, convertGatewayIdsToNames } from '../utils/gatewayMapping';

const MerchantAnalyticsModal: React.FC<{
  user: User;
  onClose: () => void;
}> = ({ user, onClose }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isStartDatePickerOpen, setIsStartDatePickerOpen] = useState(false);
  const [isEndDatePickerOpen, setIsEndDatePickerOpen] = useState(false);

  const { useMerchantStatistics } = useAdmin();

  // Build filters for API
  const filters: MerchantStatisticsFilters = useMemo(() => {
    const baseFilters: MerchantStatisticsFilters = {
      shopId: user.id,
      period: selectedPeriod as any
    };

    // Add custom date range if period is custom
    if (selectedPeriod === 'custom' && startDate && endDate) {
      baseFilters.dateFrom = startDate.toISOString();
      baseFilters.dateTo = endDate.toISOString();
    }

    return baseFilters;
  }, [user.id, selectedPeriod, startDate, endDate]);

  const { data: statistics, isLoading, error } = useMerchantStatistics(filters);

  const periodOptions = [
    { value: 'month', label: 'This Month' },
    { value: 'week', label: 'This Week' },
    { value: 'year', label: 'This Year' },
    { value: 'all', label: 'All Time' },
    { value: 'custom', label: 'Custom Range' }
  ];

  // Chart configuration for revenue analytics
  const chartOptions = {
    chart: {
      type: 'area',
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      }
    },
    colors: ['#6936d3', '#10b981', '#f59e0b'],
    stroke: {
      curve: 'smooth',
      width: 2
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [50, 100]
      }
    },
    xaxis: {
      categories: statistics?.dailyData?.map(item => 
        format(new Date(item.date), 'MMM d')
      ) || [],
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      }
    },
    yaxis: {
      labels: {
        formatter: (value: number) => `$${value.toFixed(0)}`,
        style: {
          fontSize: '12px'
        }
      }
    },
    grid: {
      strokeDashArray: 4,
      padding: {
        left: 20,
        bottom: 0
      }
    },
    dataLabels: {
      enabled: false
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right'
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          height: 200
        }
      }
    }]
  };

  const series = [
    {
      name: 'Total Turnover',
      data: statistics?.dailyData?.map(item => item.turnover) || []
    },
    {
      name: 'Merchant Earnings',
      data: statistics?.dailyData?.map(item => item.merchantEarnings) || []
    },
    {
      name: 'Gateway Earnings',
      data: statistics?.dailyData?.map(item => item.gatewayEarnings) || []
    }
  ];

  // Check if custom period is selected and dates are required
  const isCustomPeriodValid = selectedPeriod !== 'custom' || (startDate && endDate);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-6xl min-h-[90vh] max-h-[90vh] overflow-y-auto"
      >
        <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Merchant Analytics</h3>
                <p className="text-sm text-gray-500">{user.name} (@{user.username})</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                {/* Custom Date Range Pickers */}
                {selectedPeriod === 'custom' && (
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <button
                        onClick={() => setIsStartDatePickerOpen(true)}
                        className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-left flex items-center space-x-2 hover:border-primary transition-all duration-200 text-sm"
                      >
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className={startDate ? 'text-gray-900' : 'text-gray-500'}>
                          {startDate ? format(startDate, 'MMM d, yyyy') : 'Start date'}
                        </span>
                      </button>
                      <AnimatePresence>
                        {isStartDatePickerOpen && (
                          <DatePicker
                            value={startDate}
                            onChange={(date) => {
                              setStartDate(date);
                              setIsStartDatePickerOpen(false);
                            }}
                            onClose={() => setIsStartDatePickerOpen(false)}
                          />
                        )}
                      </AnimatePresence>
                    </div>
                    
                    <span className="text-gray-400">to</span>
                    
                    <div className="relative">
                      <button
                        onClick={() => setIsEndDatePickerOpen(true)}
                        className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-left flex items-center space-x-2 hover:border-primary transition-all duration-200 text-sm"
                      >
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className={endDate ? 'text-gray-900' : 'text-gray-500'}>
                          {endDate ? format(endDate, 'MMM d, yyyy') : 'End date'}
                        </span>
                      </button>
                      <AnimatePresence>
                        {isEndDatePickerOpen && (
                          <DatePicker
                            value={endDate}
                            onChange={(date) => {
                              setEndDate(date);
                              setIsEndDatePickerOpen(false);
                            }}
                            onClose={() => setIsEndDatePickerOpen(false)}
                          />
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
                <CustomSelect
                  value={selectedPeriod}
                  onChange={setSelectedPeriod}
                  options={periodOptions}
                  placeholder="Select period"
                  className="w-[180px]"
                />
              </div>
              
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Show message if custom period is selected but dates are not set */}
          {selectedPeriod === 'custom' && !isCustomPeriodValid && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900">Select Date Range</h4>
                  <p className="text-sm text-blue-700">Please select both start and end dates to view custom period analytics.</p>
                </div>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </div>
              <p className="text-red-500 text-sm">Failed to load merchant statistics</p>
            </div>
          ) : !isCustomPeriodValid ? null : statistics ? (
            <>
              {/* Overview Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:border-primary/20 transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-50 rounded-xl">
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Turnover</p>
                      <p className="text-xl font-semibold text-gray-900">
                        {statistics.totalTurnover.toLocaleString()} USDT
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:border-primary/20 transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-50 rounded-xl">
                      <Wallet className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Merchant Earnings</p>
                      <p className="text-xl font-semibold text-gray-900">
                        {statistics.merchantEarnings.toLocaleString()} USDT
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:border-primary/20 transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-50 rounded-xl">
                      <Activity className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Payments</p>
                      <p className="text-xl font-semibold text-gray-900">
                        {statistics.totalPayments.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:border-primary/20 transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-50 rounded-xl">
                      <TrendingUp className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Conversion Rate</p>
                      <p className="text-xl font-semibold text-gray-900">
                        {statistics.conversionRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Revenue Chart */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Revenue Analytics</h3>
                    <p className="text-sm text-gray-500">Daily breakdown of earnings and turnover</p>
                  </div>
                </div>
                <div className="h-64">
                  <Chart
                    options={chartOptions}
                    series={series}
                    type="area"
                    height="100%"
                  />
                </div>
              </div>

              {/* Gateway Performance */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Gateway Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {statistics.gatewayBreakdown.map((gateway, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{gateway.gatewayDisplayName}</h4>
                          <p className="text-sm text-gray-500">{gateway.paymentsCount} payments</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-lg font-bold text-blue-900">
                            {gateway.turnoverUSDT.toLocaleString()}
                          </div>
                          <div className="text-xs text-blue-700">Turnover USDT</div>
                        </div>
                        
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-lg font-bold text-green-900">
                            {gateway.merchantEarningsUSDT.toLocaleString()}
                          </div>
                          <div className="text-xs text-green-700">Earnings USDT</div>
                        </div>
                        
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <div className="text-lg font-bold text-orange-900">
                            {gateway.averageCommissionRate}%
                          </div>
                          <div className="text-xs text-orange-700">Commission</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-green-50 rounded-xl">
                      <ArrowDownLeft className="h-5 w-5 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Payouts</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Total Paid Out</span>
                      <span className="text-sm font-medium text-gray-900">
                        {statistics.totalPaidOut.toLocaleString()} USDT
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Pending Payout</span>
                      <span className="text-sm font-medium text-orange-600">
                        {(statistics.merchantEarnings - statistics.totalPaidOut).toLocaleString()} USDT
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-blue-50 rounded-xl">
                      <Activity className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Performance</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Average Check</span>
                      <span className="text-sm font-medium text-gray-900">
                        {statistics.averageCheck.toFixed(2)} USDT
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Success Rate</span>
                      <span className="text-sm font-medium text-green-600">
                        {((statistics.successfulPayments / statistics.totalPayments) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-purple-50 rounded-xl">
                      <Percent className="h-5 w-5 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Commissions</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Gateway Earnings</span>
                      <span className="text-sm font-medium text-gray-900">
                        {statistics.gatewayEarnings.toLocaleString()} USDT
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Avg Commission</span>
                      <span className="text-sm font-medium text-purple-600">
                        {((statistics.gatewayEarnings / statistics.totalTurnover) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Period Information */}
              {statistics.periodInfo && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <span className="text-gray-500">Period:</span>
                      <span className="font-medium text-gray-900">
                        {format(new Date(statistics.periodInfo.from), 'MMM d, yyyy')} - {format(new Date(statistics.periodInfo.to), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-gray-500">Duration:</span>
                      <span className="font-medium text-gray-900">
                        {statistics.periodInfo.daysCount} days
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm">No statistics available for this period</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const UserDetailsModal: React.FC<{
  user: User;
  onClose: () => void;
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
  onSuspend: (id: string) => void;
  onActivate: (id: string) => void;
}> = ({ user, onClose, onEdit, onDelete, onSuspend, onActivate }) => {
  const [showCopied, setShowCopied] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setShowCopied(id);
    setTimeout(() => setShowCopied(null), 2000);
  };

  const handleAction = async (action: 'edit' | 'delete' | 'suspend' | 'activate') => {
    switch (action) {
      case 'edit':
        onEdit(user);
        break;
      case 'delete':
        if (window.confirm('Are you sure you want to delete this user?')) {
          onDelete(user.id);
        }
        break;
      case 'suspend':
        if (window.confirm('Are you sure you want to suspend this user?')) {
          onSuspend(user.id);
        }
        break;
      case 'activate':
        onActivate(user.id);
        break;
    }
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <UserIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                <p className="text-sm text-gray-500">@{user.username}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="text-sm font-medium text-gray-500 mb-1">Brand Name</div>
                <div className="text-sm text-gray-900">{user.name}</div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="text-sm font-medium text-gray-500 mb-1">Username</div>
                <div className="text-sm text-gray-900">@{user.username}</div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="text-sm font-medium text-gray-500 mb-1">Telegram</div>
                <div className="text-sm text-gray-900">{user.telegram || 'Not set'}</div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="text-sm font-medium text-gray-500 mb-1">Status</div>
                <div className="mt-1">
                  {user.status === 'ACTIVE' && (
                    <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-3 py-1 rounded-lg w-fit">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm font-medium">Active</span>
                    </div>
                  )}
                  {user.status === 'SUSPENDED' && (
                    <div className="flex items-center space-x-2 text-red-600 bg-red-50 px-3 py-1 rounded-lg w-fit">
                      <XCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Suspended</span>
                    </div>
                  )}
                  {user.status === 'PENDING' && (
                    <div className="flex items-center space-x-2 text-yellow-600 bg-yellow-50 px-3 py-1 rounded-lg w-fit">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm font-medium">Pending</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="text-sm font-medium text-gray-500 mb-1">Merchant URL</div>
                <div className="text-sm text-gray-900 break-all">{user.shopUrl}</div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="text-sm font-medium text-gray-500 mb-1">Created At</div>
                <div className="text-sm text-gray-900">
                  {format(new Date(user.createdAt), 'PPpp')}
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="text-sm font-medium text-gray-500 mb-1">Public Key</div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-900 font-mono break-all mr-2">
                    {user.publicKey.slice(0, 20)}...
                  </div>
                  <button
                    onClick={() => handleCopy(user.publicKey, 'public-key')}
                    className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                  >
                    {showCopied === 'public-key' ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Gateways */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Payment Gateways</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user.paymentGateways.map((gatewayId) => {
                const gatewayInfo = getGatewayInfo(gatewayId);
                const settings = user.gatewaySettings?.[gatewayId];
                
                return (
                  <div key={gatewayId} className="p-4 border border-gray-200 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h5 className="font-medium text-gray-900">
                          {gatewayInfo ? gatewayInfo.displayName : `Gateway ${gatewayId}`}
                        </h5>
                        <p className="text-sm text-gray-500">
                          {gatewayInfo ? gatewayInfo.description : 'Payment gateway'}
                        </p>
                      </div>
                    </div>
                    
                    {settings && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center justify-center mb-1">
                            <Percent className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="text-lg font-bold text-blue-900">{settings.commission}%</div>
                          <div className="text-xs text-blue-700">Commission</div>
                        </div>
                        
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <div className="flex items-center justify-center mb-1">
                            <Timer className="h-4 w-4 text-orange-600" />
                          </div>
                          <div className="text-lg font-bold text-orange-900">T+{settings.payoutDelay}</div>
                          <div className="text-xs text-orange-700">Payout</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Wallet Information */}
          {user.wallets && Object.keys(user.wallets).length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Crypto Wallets</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(user.wallets).map(([walletType, address]) => {
                  if (!address) return null;
                  
                  const walletLabels: Record<string, { label: string; icon: string }> = {
                    usdtPolygonWallet: { label: 'USDT (Polygon)', icon: '🔷' },
                    usdtTrcWallet: { label: 'USDT (TRC-20)', icon: '🔴' },
                    usdtErcWallet: { label: 'USDT (ERC-20)', icon: '⚫' },
                    usdcPolygonWallet: { label: 'USDC (Polygon)', icon: '🔵' }
                  };
                  
                  const walletInfo = walletLabels[walletType];
                  if (!walletInfo) return null;
                  
                  return (
                    <div key={walletType} className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{walletInfo.icon}</span>
                          <span className="font-medium text-gray-900">{walletInfo.label}</span>
                        </div>
                        <button
                          onClick={() => handleCopy(address, walletType)}
                          className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          {showCopied === walletType ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <div className="text-sm font-mono text-gray-600 break-all">
                        {address}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Actions</h4>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleAction('edit')}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center space-x-2"
              >
                <Edit3 className="h-4 w-4" />
                <span>Edit User</span>
              </button>
              
              {user.status === 'ACTIVE' ? (
                <button
                  onClick={() => handleAction('suspend')}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center space-x-2"
                >
                  <Shield className="h-4 w-4" />
                  <span>Suspend</span>
                </button>
              ) : (
                <button
                  onClick={() => handleAction('activate')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Activate</span>
                </button>
              )}
              
              <button
                onClick={() => handleAction('delete')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const AddUserModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddUserFormData) => void;
  isLoading: boolean;
}> = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<AddUserFormData>({
    brandName: '',
    username: '',
    password: '',
    telegramId: '',
    merchantUrl: '',
    gateways: [],
    gatewaySettings: {},
    wallets: {
      usdtPolygonWallet: '',
      usdtTrcWallet: '',
      usdtErcWallet: '',
      usdcPolygonWallet: ''
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const availableGateways = Object.values(GATEWAY_INFO);

  const handleGatewayToggle = (gatewayId: string) => {
    setFormData(prev => {
      const isSelected = prev.gateways.includes(gatewayId);
      const newGateways = isSelected 
        ? prev.gateways.filter(id => id !== gatewayId)
        : [...prev.gateways, gatewayId];
      
      // Update gateway settings
      const newGatewaySettings = { ...prev.gatewaySettings };
      if (isSelected) {
        delete newGatewaySettings[gatewayId];
      } else {
        newGatewaySettings[gatewayId] = {
          commission: 2.5,
          payoutDelay: 7
        };
      }
      
      return {
        ...prev,
        gateways: newGateways,
        gatewaySettings: newGatewaySettings
      };
    });
  };

  const handleGatewaySettingChange = (gatewayId: string, field: 'commission' | 'payoutDelay', value: number) => {
    setFormData(prev => ({
      ...prev,
      gatewaySettings: {
        ...prev.gatewaySettings,
        [gatewayId]: {
          ...prev.gatewaySettings[gatewayId],
          [field]: value
        }
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateUserData({
      name: formData.brandName,
      username: formData.username,
      password: formData.password,
      telegram: formData.telegramId,
      merchantUrl: formData.merchantUrl,
      paymentGateways: formData.gateways,
      status: 'ACTIVE',
      gatewaySettings: formData.gatewaySettings,
      wallets: formData.wallets
    });
    
    if (validationErrors.length > 0) {
      const errorMap: Record<string, string> = {};
      validationErrors.forEach(error => {
        errorMap[error.field] = error.message;
      });
      setErrors(errorMap);
      return;
    }
    
    setErrors({});
    onSubmit(formData);
  };

  const handleClose = () => {
    setFormData({
      brandName: '',
      username: '',
      password: '',
      telegramId: '',
      merchantUrl: '',
      gateways: [],
      gatewaySettings: {},
      wallets: {
        usdtPolygonWallet: '',
        usdtTrcWallet: '',
        usdtErcWallet: '',
        usdcPolygonWallet: ''
      }
    });
    setErrors({});
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Add New User</h3>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-500 p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Basic Information</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Brand Name *
                    </label>
                    <input
                      type="text"
                      value={formData.brandName}
                      onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                      className={`w-full px-4 py-2.5 rounded-lg border ${errors.name ? 'border-red-300' : 'border-gray-300'} focus:ring-2 focus:ring-primary focus:border-primary outline-none`}
                      placeholder="Enter brand name"
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username *
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className={`w-full px-4 py-2.5 rounded-lg border ${errors.username ? 'border-red-300' : 'border-gray-300'} focus:ring-2 focus:ring-primary focus:border-primary outline-none`}
                      placeholder="Enter username"
                    />
                    {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className={`w-full px-4 py-2.5 rounded-lg border ${errors.password ? 'border-red-300' : 'border-gray-300'} focus:ring-2 focus:ring-primary focus:border-primary outline-none`}
                      placeholder="Enter password"
                    />
                    {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telegram ID
                    </label>
                    <input
                      type="text"
                      value={formData.telegramId}
                      onChange={(e) => setFormData({ ...formData, telegramId: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                      placeholder="@username"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Merchant URL *
                    </label>
                    <input
                      type="url"
                      value={formData.merchantUrl}
                      onChange={(e) => setFormData({ ...formData, merchantUrl: e.target.value })}
                      className={`w-full px-4 py-2.5 rounded-lg border ${errors.merchantUrl ? 'border-red-300' : 'border-gray-300'} focus:ring-2 focus:ring-primary focus:border-primary outline-none`}
                      placeholder="https://example.com"
                    />
                    {errors.merchantUrl && <p className="mt-1 text-sm text-red-600">{errors.merchantUrl}</p>}
                  </div>
                </div>
              </div>

              {/* Payment Gateways */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Payment Gateways</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableGateways.map((gateway) => (
                    <div key={gateway.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h5 className="font-medium text-gray-900">{gateway.displayName}</h5>
                          <p className="text-sm text-gray-500">{gateway.description}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.gateways.includes(gateway.id)}
                          onChange={() => handleGatewayToggle(gateway.id)}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                      </div>
                      
                      {formData.gateways.includes(gateway.id) && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Commission (%)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={formData.gatewaySettings[gateway.id]?.commission || 0}
                              onChange={(e) => handleGatewaySettingChange(gateway.id, 'commission', parseFloat(e.target.value))}
                              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Payout Delay (days)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="365"
                              value={formData.gatewaySettings[gateway.id]?.payoutDelay || 0}
                              onChange={(e) => handleGatewaySettingChange(gateway.id, 'payoutDelay', parseInt(e.target.value))}
                              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {errors.paymentGateways && <p className="text-sm text-red-600">{errors.paymentGateways}</p>}
              </div>

              {/* Crypto Wallets */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Crypto Wallets (Optional)</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      🔷 USDT (Polygon)
                    </label>
                    <input
                      type="text"
                      value={formData.wallets?.usdtPolygonWallet || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        wallets: { ...formData.wallets, usdtPolygonWallet: e.target.value }
                      })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none font-mono text-sm"
                      placeholder="0x1234567890abcdef..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      🔴 USDT (TRC-20)
                    </label>
                    <input
                      type="text"
                      value={formData.wallets?.usdtTrcWallet || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        wallets: { ...formData.wallets, usdtTrcWallet: e.target.value }
                      })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none font-mono text-sm"
                      placeholder="TRX1234567890abcdef..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ⚫ USDT (ERC-20)
                    </label>
                    <input
                      type="text"
                      value={formData.wallets?.usdtErcWallet || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        wallets: { ...formData.wallets, usdtErcWallet: e.target.value }
                      })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none font-mono text-sm"
                      placeholder="0xabcdef1234567890..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      🔵 USDC (Polygon)
                    </label>
                    <input
                      type="text"
                      value={formData.wallets?.usdcPolygonWallet || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        wallets: { ...formData.wallets, usdcPolygonWallet: e.target.value }
                      })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none font-mono text-sm"
                      placeholder="0xfedcba0987654321..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isLoading && <LoadingSpinner size="sm" />}
                  <span>{isLoading ? 'Creating...' : 'Create User'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const Users: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUserForAnalytics, setSelectedUserForAnalytics] = useState<User | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  // Build filters for API
  const filters: UserFilters = useMemo(() => {
    const apiFilters: UserFilters = {
      page: currentPage,
      limit: pageSize,
    };

    if (statusFilter !== 'all') {
      apiFilters.status = statusFilter as any;
    }

    return apiFilters;
  }, [currentPage, pageSize, statusFilter]);

  const { data: usersData, isLoading, error } = useGetUsers(filters);
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();
  const suspendUserMutation = useSuspendUser();
  const activateUserMutation = useActivateUser();

  console.log('🔍 Users data from hook:', usersData);
  console.log('🔍 Is loading:', isLoading);
  console.log('🔍 Error:', error);

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'ACTIVE', label: 'Active', icon: <CheckCircle2 className="h-4 w-4 text-green-600" /> },
    { value: 'SUSPENDED', label: 'Suspended', icon: <XCircle className="h-4 w-4 text-red-600" /> },
    { value: 'PENDING', label: 'Pending', icon: <Clock className="h-4 w-4 text-yellow-600" /> }
  ];

  // Filter users by search term (client-side filtering for loaded data)
  const filteredUsers = useMemo(() => {
    if (!usersData?.users) return [];
    
    if (!searchTerm) return usersData.users;
    
    return usersData.users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.telegram.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.shopUrl.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [usersData?.users, searchTerm]);

  const handleCreateUser = async (data: AddUserFormData) => {
    try {
      await createUserMutation.mutateAsync(data);
      toast.success('User created successfully!');
      setIsAddModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user');
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await deleteUserMutation.mutateAsync(id);
      toast.success('User deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user');
    }
  };

  const handleSuspendUser = async (id: string) => {
    try {
      await suspendUserMutation.mutateAsync(id);
      toast.success('User suspended successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to suspend user');
    }
  };

  const handleActivateUser = async (id: string) => {
    try {
      await activateUserMutation.mutateAsync(id);
      toast.success('User activated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to activate user');
    }
  };

  const handleEditUser = (user: User) => {
    // TODO: Implement edit user modal
    console.log('Edit user:', user);
    toast.info('Edit user functionality coming soon');
  };

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-600 mb-2">
          <AlertTriangle className="h-8 w-8 mx-auto" />
        </div>
        <p className="text-gray-600">Failed to load users. Please try again.</p>
        <p className="text-sm text-gray-500 mt-2">Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Users</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage platform users and their settings
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200 w-full sm:w-auto justify-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </motion.button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 md:p-6 border-b border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all duration-200"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <CustomSelect
                value={statusFilter}
                onChange={setStatusFilter}
                options={statusOptions}
                placeholder="Filter by status"
                className="w-[180px]"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-6 py-4">
                    <span className="text-sm font-medium text-gray-500">User</span>
                  </th>
                  <th className="text-left px-6 py-4">
                    <span className="text-sm font-medium text-gray-500">Status</span>
                  </th>
                  <th className="text-left px-6 py-4">
                    <span className="text-sm font-medium text-gray-500">Gateways</span>
                  </th>
                  <th className="text-left px-6 py-4">
                    <span className="text-sm font-medium text-gray-500">Created</span>
                  </th>
                  <th className="text-right px-6 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <UserIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.status === 'ACTIVE' && (
                        <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-3 py-1 rounded-lg w-fit">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-sm font-medium">Active</span>
                        </div>
                      )}
                      {user.status === 'SUSPENDED' && (
                        <div className="flex items-center space-x-2 text-red-600 bg-red-50 px-3 py-1 rounded-lg w-fit">
                          <XCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Suspended</span>
                        </div>
                      )}
                      {user.status === 'PENDING' && (
                        <div className="flex items-center space-x-2 text-yellow-600 bg-yellow-50 px-3 py-1 rounded-lg w-fit">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm font-medium">Pending</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {user.paymentGateways.slice(0, 3).map((gatewayId) => {
                          const gatewayInfo = getGatewayInfo(gatewayId);
                          return (
                            <span
                              key={gatewayId}
                              className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full"
                            >
                              {gatewayInfo ? gatewayInfo.name : gatewayId}
                            </span>
                          );
                        })}
                        {user.paymentGateways.length > 3 && (
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                            +{user.paymentGateways.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">
                        {format(new Date(user.createdAt), 'MMM d, yyyy')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setSelectedUserForAnalytics(user)}
                          className="p-2 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg transition-all duration-200"
                          title="View Analytics"
                        >
                          <BarChart3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="p-2 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg transition-all duration-200"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserIcon className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">No users found</p>
            <p className="text-gray-400 text-xs mt-1">
              {searchTerm ? 'Try adjusting your search criteria' : 'Create your first user to get started'}
            </p>
          </div>
        )}

        {/* Pagination */}
        {usersData?.pagination && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {((usersData.pagination.page - 1) * usersData.pagination.limit) + 1} to{' '}
              {Math.min(usersData.pagination.page * usersData.pagination.limit, usersData.pagination.total)} of{' '}
              {usersData.pagination.total} results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">
                Page {usersData.pagination.page} of {usersData.pagination.totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(usersData.pagination.totalPages, currentPage + 1))}
                disabled={currentPage === usersData.pagination.totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedUser && (
          <UserDetailsModal
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            onSuspend={handleSuspendUser}
            onActivate={handleActivateUser}
          />
        )}
        {selectedUserForAnalytics && (
          <MerchantAnalyticsModal
            user={selectedUserForAnalytics}
            onClose={() => setSelectedUserForAnalytics(null)}
          />
        )}
        <AddUserModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleCreateUser}
          isLoading={createUserMutation.isPending}
        />
      </AnimatePresence>
    </div>
  );
};

export default Users;