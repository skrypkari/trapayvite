import React, { useState, useMemo } from 'react';
import {
  Search,
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
  Edit3,
  Trash2,
  Shield,
  Activity,
  DollarSign,
  Percent,
  Wallet,
  Copy,
  Check,
  X,
  BarChart3,
  TrendingUp,
  ArrowDownLeft,
  CreditCard,
  AlertCircle,
  Lock,
  Save
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
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useSuspendUser,
  useActivateUser,
  type User,
  type UserFilters,
  type AddUserFormData,
  type EditUserFormData,
  validateUserData
} from '../hooks/useUsers';
import {
  useAdmin,
  type MerchantStatisticsFilters
} from '../hooks/useAdmin';
import { getGatewayInfo, GATEWAY_INFO } from '../utils/gatewayMapping';

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
      type: 'area' as const,
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      }
    },
    colors: ['#6936d3', '#10b981', '#f59e0b'],
    stroke: {
      curve: 'smooth' as const,
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
        format(new Date(item.date), 'dd.MM')
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
      position: 'top' as const,
      horizontalAlign: 'right' as const
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
                          {startDate ? format(startDate, 'dd.MM.yy') : 'Start date'}
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
                          {endDate ? format(endDate, 'dd.MM.yy') : 'End date'}
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
                        {format(new Date(statistics.periodInfo.from), 'dd.MM.yy')} - {format(new Date(statistics.periodInfo.to), 'dd.MM.yy')}
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

  // Helper function to render field with enhanced styling
  const renderField = (label: string, value: any, copyable = false, copyId?: string, icon?: React.ReactNode, className?: string) => {
    if (value === null || value === undefined || value === '') return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`group relative p-5 bg-gradient-to-br from-white via-gray-50 to-white rounded-2xl border border-gray-200 hover:border-primary/30 hover:shadow-lg transition-all duration-300 ${className || ''}`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-3">
            {icon && (
              <div className="p-2 bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl text-primary group-hover:scale-110 transition-transform duration-200">
                {icon}
              </div>
            )}
            <div className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors duration-200">
              {label}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-base text-gray-900 break-all mr-3 font-medium">
              {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
            </div>
            {copyable && copyId && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleCopy(value.toString(), copyId)}
                className="p-2.5 text-gray-400 hover:text-primary hover:bg-white rounded-xl transition-all duration-200 flex-shrink-0 shadow-sm border border-gray-200 hover:border-primary/30"
              >
                {showCopied === copyId ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: {
        icon: <CheckCircle2 className="h-5 w-5" />,
        bg: 'from-green-500 to-emerald-600',
        text: 'Active User'
      },
      SUSPENDED: {
        icon: <XCircle className="h-5 w-5" />,
        bg: 'from-red-500 to-rose-600',
        text: 'Suspended'
      },
      PENDING: {
        icon: <Clock className="h-5 w-5" />,
        bg: 'from-yellow-500 to-orange-500',
        text: 'Pending Approval'
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;

    return (
      <div className={`inline-flex items-center px-4 py-2 bg-gradient-to-r ${config.bg} text-white rounded-xl shadow-lg`}>
        {config.icon}
        <span className="ml-2 font-semibold">{config.text}</span>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden"
      >
        {/* Enhanced Header */}
        <div className="relative px-8 py-6 bg-gradient-to-r from-primary via-primary-dark to-purple-700 text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30"
                >
                  <UserIcon className="h-8 w-8 text-white" />
                </motion.div>
                <div>
                  <motion.h3
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl font-bold text-white"
                  >
                    {user.name}
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-white/80 font-mono text-sm"
                  >
                    @{user.username}
                  </motion.p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAction('edit')}
                  className="p-3 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200 backdrop-blur-sm"
                >
                  <Edit3 className="h-5 w-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="p-3 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200 backdrop-blur-sm"
                >
                  <X className="h-6 w-6" />
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
          <div className="p-8 space-y-8">
            {/* Status Banner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              {getStatusBadge(user.status)}
            </motion.div>

            {/* Basic Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {renderField('Brand Name', user.name, false, '', <Building2 className="h-5 w-5" />, 'border-2 border-primary/20')}
              {renderField('Username', `@${user.username}`, false, '', <UserIcon className="h-5 w-5" />)}
              {renderField('Telegram', user.telegram || 'Not set', false, '', <Mail className="h-5 w-5" />)}
              {renderField('Merchant URL', user.shopUrl, true, 'shop-url', <Globe className="h-5 w-5" />)}
              {renderField('Created At', format(new Date(user.createdAt), 'dd.MM.yy HH:mm'), false, '', <Calendar className="h-5 w-5" />)}
              {renderField('Public Key', `${user.publicKey.slice(0, 20)}...`, true, 'public-key', <Shield className="h-5 w-5" />)}
            </div>

            {/* Payment Gateways Section */}
            <div className="space-y-4">
              <h4 className="text-xl font-bold text-gray-900 flex items-center">
                <Wallet className="h-6 w-6 mr-3 text-primary" />
                Payment Gateways
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {user.paymentGateways.map((gatewayId) => {
                  const gatewayInfo = getGatewayInfo(gatewayId);
                  const settings = user.gatewaySettings?.[gatewayId];

                  return (
                    <motion.div
                      key={gatewayId}
                      whileHover={{ scale: 1.02 }}
                      className="p-6 border-2 border-gray-200 rounded-2xl bg-gradient-to-br from-white to-gray-50 hover:border-primary/30 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h5 className="text-lg font-bold text-gray-900">
                            {gatewayInfo ? gatewayInfo.name : `Gateway ${gatewayId}`}
                          </h5>
                          <p className="text-sm text-gray-600">
                            {gatewayInfo ? gatewayInfo.description : 'Payment gateway'}
                          </p>
                        </div>
                        <div className="p-3 bg-primary/10 rounded-xl">
                          <Wallet className="h-6 w-6 text-primary" />
                        </div>
                      </div>

                      {settings && (
                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-primary">{settings.commission}%</div>
                              <div className="text-sm text-gray-600">Commission</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">{settings.payoutDelay || 0}d</div>
                              <div className="text-sm text-gray-600">Payout Delay</div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-200">
                            <div className="text-center">
                              <div className="text-lg font-semibold text-gray-900">${settings.minAmount || 0}</div>
                              <div className="text-xs text-gray-500">Min Amount</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-semibold text-gray-900">${settings.maxAmount || 0}</div>
                              <div className="text-xs text-gray-500">Max Amount</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Crypto Wallets Section */}
            {user.wallets && Object.keys(user.wallets).length > 0 && (
              <div className="space-y-4">
                <h4 className="text-xl font-bold text-gray-900 flex items-center">
                  <Wallet className="h-6 w-6 mr-3 text-primary" />
                  Crypto Wallets
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(user.wallets).map(([walletType, address]) => {
                    if (!address) return null;

                    const walletLabels: Record<string, { label: string; icon: string; gradient: string }> = {
                      usdtPolygonWallet: { label: 'USDT (Polygon)', icon: '🔷', gradient: 'from-blue-500 to-indigo-600' },
                      usdtTrcWallet: { label: 'USDT (TRC-20)', icon: '🔴', gradient: 'from-red-500 to-rose-600' },
                      usdtErcWallet: { label: 'USDT (ERC-20)', icon: '⚫', gradient: 'from-gray-700 to-gray-900' },
                      usdcPolygonWallet: { label: 'USDC (Polygon)', icon: '🔵', gradient: 'from-blue-600 to-cyan-600' }
                    };

                    const walletInfo = walletLabels[walletType];
                    if (!walletInfo) return null;

                    return (
                      <motion.div
                        key={walletType}
                        whileHover={{ scale: 1.02 }}
                        className="p-6 bg-gradient-to-br from-white to-gray-50 rounded-2xl border-2 border-gray-200 hover:border-primary/30 hover:shadow-lg transition-all duration-300"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className={`p-3 bg-gradient-to-r ${walletInfo.gradient} rounded-xl text-white`}>
                              <span className="text-xl">{walletInfo.icon}</span>
                            </div>
                            <div>
                              <h5 className="font-bold text-gray-900">{walletInfo.label}</h5>
                              <p className="text-sm text-gray-600">Cryptocurrency Wallet</p>
                            </div>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleCopy(address, walletType)}
                            className="p-3 text-gray-400 hover:text-primary hover:bg-white rounded-xl transition-all duration-200 shadow-sm border border-gray-200 hover:border-primary/30"
                          >
                            {showCopied === walletType ? (
                              <Check className="h-5 w-5 text-green-500" />
                            ) : (
                              <Copy className="h-5 w-5" />
                            )}
                          </motion.button>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                          <div className="text-sm font-mono text-gray-600 break-all">
                            {address}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="border-t-2 border-gray-200 pt-8">
              <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Settings className="h-6 w-6 mr-3 text-primary" />
                Actions
              </h4>
              <div className="flex flex-wrap gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAction('edit')}
                  className="px-6 py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-3 font-semibold"
                >
                  <Edit3 className="h-5 w-5" />
                  <span>Edit User</span>
                </motion.button>

                {user.status === 'ACTIVE' ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAction('suspend')}
                    className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-3 font-semibold"
                  >
                    <Shield className="h-5 w-5" />
                    <span>Suspend</span>
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAction('activate')}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-3 font-semibold"
                  >
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Activate</span>
                  </motion.button>
                )}

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAction('delete')}
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-3 font-semibold"
                >
                  <Trash2 className="h-5 w-5" />
                  <span>Delete</span>
                </motion.button>
              </div>
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

  const walletTypes = [
    { key: 'usdtPolygonWallet', label: 'USDT (Polygon)', icon: '🔷', color: 'blue' },
    { key: 'usdtTrcWallet', label: 'USDT (TRC-20)', icon: '🔴', color: 'red' },
    { key: 'usdtErcWallet', label: 'USDT (ERC-20)', icon: '⚫', color: 'gray' },
    { key: 'usdcPolygonWallet', label: 'USDC (Polygon)', icon: '🔵', color: 'cyan' }
  ];

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
        const gatewaySettings: any = {
          commission: 2.5,
          minAmount: 0,
          maxAmount: 100000,
          payoutDelay: 0
        };
        
        // ✅ NEW: Добавляем поле customer для шлюза 1110 (Amer)
        if (gatewayId === '1110') {
          gatewaySettings.customer = '';
        }
        
        newGatewaySettings[gatewayId] = gatewaySettings;
      }

      return {
        ...prev,
        gateways: newGateways,
        gatewaySettings: newGatewaySettings
      };
    });
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

  const renderField = (label: string, icon: React.ReactNode, children: React.ReactNode, error?: string) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <label className="flex items-center space-x-3 text-sm font-semibold text-gray-700">
        <div className="p-2 bg-primary/10 rounded-xl text-primary">
          {icon}
        </div>
        <span>{label}</span>
      </label>
      {children}
      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-red-600 flex items-center space-x-2"
        >
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </motion.p>
      )}
    </motion.div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"

        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden"
          >
            {/* Enhanced Header */}
            <div className="relative px-8 py-6 bg-gradient-to-r from-primary via-primary-dark to-purple-700 text-white">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30"
                    >
                      <Plus className="h-8 w-8 text-white" />
                    </motion.div>
                    <div>
                      <motion.h3
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-2xl font-bold text-white"
                      >
                        Add New User
                      </motion.h3>
                      <motion.p
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-white/80"
                      >
                        Create a new merchant account
                      </motion.p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleClose}
                    className="p-3 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200 backdrop-blur-sm"
                  >
                    <X className="h-6 w-6" />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Scrollable Form Content */}
            <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
              <form onSubmit={handleSubmit} className="p-8 space-y-8">
                {/* Basic Information Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-6"
                >
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <UserIcon className="h-6 w-6 text-primary" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900">Basic Information</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderField(
                      'Brand Name *',
                      <Building2 className="h-5 w-5" />,
                      <input
                        type="text"
                        value={formData.brandName}
                        onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                        className={`w-full px-4 py-3 border-2 ${errors.name ? 'border-red-300' : 'border-gray-200'} rounded-xl focus:border-primary focus:ring-0 transition-colors text-gray-900 bg-white hover:border-gray-300`}
                        placeholder="Enter brand name"
                      />,
                      errors.name
                    )}

                    {renderField(
                      'Username *',
                      <UserIcon className="h-5 w-5" />,
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className={`w-full px-4 py-3 border-2 ${errors.username ? 'border-red-300' : 'border-gray-200'} rounded-xl focus:border-primary focus:ring-0 transition-colors text-gray-900 bg-white hover:border-gray-300`}
                        placeholder="Enter username"
                      />,
                      errors.username
                    )}

                    {renderField(
                      'Password *',
                      <Shield className="h-5 w-5" />,
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className={`w-full px-4 py-3 border-2 ${errors.password ? 'border-red-300' : 'border-gray-200'} rounded-xl focus:border-primary focus:ring-0 transition-colors text-gray-900 bg-white hover:border-gray-300`}
                        placeholder="Enter password"
                      />,
                      errors.password
                    )}

                    {renderField(
                      'Telegram ID',
                      <Mail className="h-5 w-5" />,
                      <input
                        type="text"
                        value={formData.telegramId}
                        onChange={(e) => setFormData({ ...formData, telegramId: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 transition-colors text-gray-900 bg-white hover:border-gray-300"
                        placeholder="@username"
                      />
                    )}

                    <div className="md:col-span-2">
                      {renderField(
                        'Merchant URL *',
                        <Globe className="h-5 w-5" />,
                        <input
                          type="url"
                          value={formData.merchantUrl}
                          onChange={(e) => setFormData({ ...formData, merchantUrl: e.target.value })}
                          className={`w-full px-4 py-3 border-2 ${errors.merchantUrl ? 'border-red-300' : 'border-gray-200'} rounded-xl focus:border-primary focus:ring-0 transition-colors text-gray-900 bg-white hover:border-gray-300`}
                          placeholder="https://example.com"
                        />,
                        errors.merchantUrl
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Payment Gateways Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-6"
                >
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <CreditCard className="h-6 w-6 text-primary" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900">Payment Gateways</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {availableGateways.map((gateway) => {
                      const isEnabled = formData.gateways.includes(gateway.id);

                      return (
                        <motion.div
                          key={gateway.id}
                          whileHover={{ scale: 1.02 }}
                          className={`p-6 border-2 rounded-2xl transition-all duration-300 ${isEnabled
                              ? 'border-primary bg-gradient-to-br from-primary/5 to-primary/10'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className={`p-3 rounded-xl ${isEnabled ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}>
                                <Wallet className="h-5 w-5" />
                              </div>
                              <div>
                                <h5 className="font-bold text-gray-900">{gateway.displayName}</h5>
                                <p className="text-sm text-gray-600">{gateway.description}</p>
                              </div>
                            </div>
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleGatewayToggle(gateway.id)}
                              className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${isEnabled ? 'bg-primary' : 'bg-gray-200'
                                }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isEnabled ? 'translate-x-6' : 'translate-x-0'
                                  }`}
                              />
                            </motion.button>
                          </div>

                          {isEnabled && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="space-y-4"
                            >
                              <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Commission Rate (%)
                                  </label>
                                  <input
                                    type="number"
                                    value={formData.gatewaySettings[gateway.id]?.commission || 0}
                                    onChange={(e) => {
                                      const commission = parseFloat(e.target.value) || 0;
                                      setFormData(prev => ({
                                        ...prev,
                                        gatewaySettings: {
                                          ...prev.gatewaySettings,
                                          [gateway.id]: {
                                            ...prev.gatewaySettings[gateway.id],
                                            commission,
                                            minAmount: prev.gatewaySettings[gateway.id]?.minAmount || 0,
                                            maxAmount: prev.gatewaySettings[gateway.id]?.maxAmount || 0,
                                            payoutDelay: prev.gatewaySettings[gateway.id]?.payoutDelay || 0
                                          }
                                        }
                                      }));
                                    }}
                                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 transition-colors"
                                    placeholder="0"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Min Amount (USDT)
                                    </label>
                                    <input
                                      type="number"
                                      value={formData.gatewaySettings[gateway.id]?.minAmount || 0}
                                      onChange={(e) => {
                                        const minAmount = parseFloat(e.target.value) || 0;
                                        setFormData(prev => ({
                                          ...prev,
                                          gatewaySettings: {
                                            ...prev.gatewaySettings,
                                            [gateway.id]: {
                                              ...prev.gatewaySettings[gateway.id],
                                              commission: prev.gatewaySettings[gateway.id]?.commission || 0,
                                              minAmount,
                                              maxAmount: prev.gatewaySettings[gateway.id]?.maxAmount || 0,
                                              payoutDelay: prev.gatewaySettings[gateway.id]?.payoutDelay || 0
                                            }
                                          }
                                        }));
                                      }}
                                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 transition-colors"
                                      placeholder="0"
                                      min="0"
                                      step="0.01"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Max Amount (USDT)
                                    </label>
                                    <input
                                      type="number"
                                      value={formData.gatewaySettings[gateway.id]?.maxAmount || 0}
                                      onChange={(e) => {
                                        const maxAmount = parseFloat(e.target.value) || 0;
                                        setFormData(prev => ({
                                          ...prev,
                                          gatewaySettings: {
                                            ...prev.gatewaySettings,
                                            [gateway.id]: {
                                              ...prev.gatewaySettings[gateway.id],
                                              commission: prev.gatewaySettings[gateway.id]?.commission || 0,
                                              minAmount: prev.gatewaySettings[gateway.id]?.minAmount || 0,
                                              maxAmount,
                                              payoutDelay: prev.gatewaySettings[gateway.id]?.payoutDelay || 0
                                            }
                                          }
                                        }));
                                      }}
                                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 transition-colors"
                                      placeholder="0"
                                      min="0"
                                      step="0.01"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Clock className="h-4 w-4 inline-block mr-1" />
                                    Payout Delay (days)
                                  </label>
                                  <input
                                    type="number"
                                    value={formData.gatewaySettings[gateway.id]?.payoutDelay || 0}
                                    onChange={(e) => {
                                      const payoutDelay = parseFloat(e.target.value) || 0;
                                      setFormData(prev => ({
                                        ...prev,
                                        gatewaySettings: {
                                          ...prev.gatewaySettings,
                                          [gateway.id]: {
                                            ...prev.gatewaySettings[gateway.id],
                                            commission: prev.gatewaySettings[gateway.id]?.commission || 0,
                                            minAmount: prev.gatewaySettings[gateway.id]?.minAmount || 0,
                                            maxAmount: prev.gatewaySettings[gateway.id]?.maxAmount || 0,
                                            payoutDelay
                                          }
                                        }
                                      }));
                                    }}
                                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 transition-colors"
                                    placeholder="0"
                                    min="0"
                                    step="1"
                                  />
                                </div>

                                {/* ✅ NEW: Дополнительное поле customer для шлюза 1110 (Amer) */}
                                {gateway.id === '1110' && (
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      <UserIcon className="h-4 w-4 inline-block mr-1" />
                                      Customer ID
                                    </label>
                                    <input
                                      type="text"
                                      value={formData.gatewaySettings[gateway.id]?.customer || ''}
                                      onChange={(e) => {
                                        const customer = e.target.value;
                                        setFormData(prev => ({
                                          ...prev,
                                          gatewaySettings: {
                                            ...prev.gatewaySettings,
                                            [gateway.id]: {
                                              ...prev.gatewaySettings[gateway.id],
                                              commission: prev.gatewaySettings[gateway.id]?.commission || 0,
                                              minAmount: prev.gatewaySettings[gateway.id]?.minAmount || 0,
                                              maxAmount: prev.gatewaySettings[gateway.id]?.maxAmount || 0,
                                              payoutDelay: prev.gatewaySettings[gateway.id]?.payoutDelay || 0,
                                              customer
                                            }
                                          }
                                        }));
                                      }}
                                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 transition-colors"
                                      placeholder="Enter customer ID"
                                    />
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                  {errors.paymentGateways && <p className="text-sm text-red-600">{errors.paymentGateways}</p>}
                </motion.div>

                {/* Crypto Wallets Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-6"
                >
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <Wallet className="h-6 w-6 text-primary" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900">Crypto Wallets (Optional)</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {walletTypes.map((wallet) => (
                      <motion.div
                        key={wallet.key}
                        whileHover={{ scale: 1.02 }}
                        className="p-6 bg-gradient-to-br from-white to-gray-50 rounded-2xl border-2 border-gray-200 hover:border-primary/30 transition-all duration-300"
                      >
                        <div className="flex items-center space-x-3 mb-4">
                          <div className={`p-3 bg-gradient-to-r ${wallet.color === 'blue' ? 'from-blue-500 to-indigo-600' :
                              wallet.color === 'red' ? 'from-red-500 to-rose-600' :
                                wallet.color === 'gray' ? 'from-gray-700 to-gray-900' :
                                  'from-blue-600 to-cyan-600'
                            } rounded-xl text-white`}>
                            <span className="text-xl">{wallet.icon}</span>
                          </div>
                          <div>
                            <h5 className="font-bold text-gray-900">{wallet.label}</h5>
                            <p className="text-sm text-gray-600">Wallet Address</p>
                          </div>
                        </div>
                        <input
                          type="text"
                          value={formData.wallets?.[wallet.key as keyof typeof formData.wallets] || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            wallets: { ...formData.wallets, [wallet.key]: e.target.value }
                          })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 transition-colors text-gray-900 bg-white hover:border-gray-300 font-mono text-sm"
                          placeholder="Enter wallet address"
                        />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Action Buttons */}
                <div className="border-t-2 border-gray-200 pt-8">
                  <div className="flex justify-end space-x-4">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleClose}
                      disabled={isLoading}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-200 flex items-center space-x-3 font-semibold disabled:opacity-50"
                    >
                      <X className="h-5 w-5" />
                      <span>Cancel</span>
                    </motion.button>

                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      whileHover={!isLoading ? { scale: 1.05 } : {}}
                      whileTap={!isLoading ? { scale: 0.95 } : {}}
                      className="px-8 py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <LoadingSpinner size="sm" />
                          <span>Creating...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-5 w-5" />
                          <span>Create User</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const EditUserModal: React.FC<{
  user: User;
  onClose: () => void;
  onSubmit: (data: EditUserFormData) => void;
  isLoading: boolean;
}> = ({ user, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<EditUserFormData>({
    name: user.name,
    username: user.username,
    password: '', // ✅ NEW: Добавляем поле пароля
    telegram: user.telegram || '',
    merchantUrl: user.shopUrl,
    paymentGateways: user.paymentGateways,
    status: user.status === 'PENDING' ? 'INACTIVE' : user.status,
    gatewaySettings: user.gatewaySettings || {} as any,
    wallets: {
      usdtPolygonWallet: user.wallets?.usdtPolygonWallet || '',
      usdtTrcWallet: user.wallets?.usdtTrcWallet || '',
      usdtErcWallet: user.wallets?.usdtErcWallet || '',
      usdcPolygonWallet: user.wallets?.usdcPolygonWallet || ''
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const availableGateways = Object.values(GATEWAY_INFO);

  const walletTypes = [
    { key: 'usdtPolygonWallet', label: 'USDT (Polygon)', icon: '🔷', color: 'blue' },
    { key: 'usdtTrcWallet', label: 'USDT (TRC-20)', icon: '🔴', color: 'red' },
    { key: 'usdtErcWallet', label: 'USDT (ERC-20)', icon: '⚫', color: 'gray' },
    { key: 'usdcPolygonWallet', label: 'USDC (Polygon)', icon: '🔵', color: 'cyan' }
  ];

  const handleGatewayToggle = (gatewayId: string) => {
    console.log('🔍 handleGatewayToggle called with gatewayId:', gatewayId);

    setFormData(prev => {
      console.log('🔍 Previous formData:', prev);

      const isSelected = prev.paymentGateways.includes(gatewayId);
      console.log('🔍 Gateway isSelected:', isSelected);

      const newGateways = isSelected
        ? prev.paymentGateways.filter((id: string) => id !== gatewayId)
        : [...prev.paymentGateways, gatewayId];

      console.log('🔍 New gateways array:', newGateways);

      // Update gateway settings
      const newGatewaySettings = { ...prev.gatewaySettings };
      if (isSelected) {
        delete newGatewaySettings[gatewayId];
        console.log('🔍 Removed gateway settings for:', gatewayId);
      } else {
        const gatewaySettings: any = {
          commission: 2.5,
          minAmount: 0,
          maxAmount: 100000,
          payoutDelay: 0
        };
        
        // ✅ NEW: Добавляем поле customer для шлюза 1110 (Amer)
        if (gatewayId === '1110') {
          gatewaySettings.customer = '';
        }
        
        newGatewaySettings[gatewayId] = gatewaySettings;
        console.log('🔍 Added gateway settings for:', gatewayId);
      }

      const newFormData = {
        ...prev,
        paymentGateways: newGateways,
        gatewaySettings: newGatewaySettings as any
      };

      console.log('🔍 New formData:', newFormData);

      return newFormData;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔍 EditUserModal handleSubmit called');
    console.log('🔍 Form data being submitted:', formData);
    console.log('🔍 Payment gateways:', formData.paymentGateways);
    console.log('🔍 Gateway settings:', formData.gatewaySettings);
    setErrors({});
    onSubmit(formData);
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  const renderField = (label: string, icon: React.ReactNode, children: React.ReactNode, error?: string) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <label className="flex items-center space-x-3 text-sm font-semibold text-gray-700">
        <div className="p-2 bg-primary/10 rounded-xl text-primary">
          {icon}
        </div>
        <span>{label}</span>
      </label>
      {children}
      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-red-600 flex items-center space-x-2"
        >
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </motion.p>
      )}
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"

    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden"
      >
        {/* Enhanced Header */}
        <div className="relative px-8 py-6 bg-gradient-to-r from-primary via-primary-dark to-purple-700 text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30"
                >
                  <Edit3 className="h-8 w-8 text-white" />
                </motion.div>
                <div>
                  <motion.h3
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl font-bold text-white"
                  >
                    Edit User - {user.name}
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-white/80"
                  >
                    Modify user settings and configuration
                  </motion.p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClose}
                className="p-3 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200 backdrop-blur-sm"
              >
                <X className="h-6 w-6" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Scrollable Form Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Basic Information Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <UserIcon className="h-6 w-6 text-primary" />
                </div>
                <h4 className="text-xl font-bold text-gray-900">Basic Information</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderField(
                  'Brand Name *',
                  <Building2 className="h-5 w-5" />,
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-4 py-3 border-2 ${errors.name ? 'border-red-300' : 'border-gray-200'} rounded-xl focus:border-primary focus:ring-0 transition-colors text-gray-900 bg-white hover:border-gray-300`}
                    placeholder="Enter brand name"
                  />,
                  errors.name
                )}

                {renderField(
                  'Username *',
                  <UserIcon className="h-5 w-5" />,
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className={`w-full px-4 py-3 border-2 ${errors.username ? 'border-red-300' : 'border-gray-200'} rounded-xl focus:border-primary focus:ring-0 transition-colors text-gray-900 bg-white hover:border-gray-300`}
                    placeholder="Enter username"
                  />,
                  errors.username
                )}

                {renderField(
                  'New Password',
                  <Lock className="h-5 w-5" />,
                  <input
                    type="password"
                    value={formData.password || ''}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`w-full px-4 py-3 border-2 ${errors.password ? 'border-red-300' : 'border-gray-200'} rounded-xl focus:border-primary focus:ring-0 transition-colors text-gray-900 bg-white hover:border-gray-300`}
                    placeholder="Leave empty to keep current password"
                  />,
                  errors.password
                )}

                {renderField(
                  'Telegram ID',
                  <Mail className="h-5 w-5" />,
                  <input
                    type="text"
                    value={formData.telegram}
                    onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 transition-colors text-gray-900 bg-white hover:border-gray-300"
                    placeholder="@username"
                  />
                )}

                <div className="md:col-span-2">
                  {renderField(
                    'Merchant URL *',
                    <Globe className="h-5 w-5" />,
                    <input
                      type="url"
                      value={formData.merchantUrl}
                      onChange={(e) => setFormData({ ...formData, merchantUrl: e.target.value })}
                      className={`w-full px-4 py-3 border-2 ${errors.merchantUrl ? 'border-red-300' : 'border-gray-200'} rounded-xl focus:border-primary focus:ring-0 transition-colors text-gray-900 bg-white hover:border-gray-300`}
                      placeholder="https://example.com"
                    />,
                    errors.merchantUrl
                  )}
                </div>

                {renderField(
                  'Status',
                  <Shield className="h-5 w-5" />,
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 transition-colors text-gray-900 bg-white hover:border-gray-300"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                )}
              </div>
            </motion.div>

            {/* Payment Gateways Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <h4 className="text-xl font-bold text-gray-900">Payment Gateways</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {availableGateways.map((gateway) => {
                  const isEnabled = formData.paymentGateways.includes(gateway.id);

                  return (
                    <motion.div
                      key={gateway.id}
                      whileHover={{ scale: 1.02 }}
                      className={`p-6 border-2 rounded-2xl transition-all duration-300 ${isEnabled
                          ? 'border-primary bg-gradient-to-br from-primary/5 to-primary/10'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`p-3 rounded-xl ${isEnabled ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}>
                            <Wallet className="h-5 w-5" />
                          </div>
                          <div>
                            <h5 className="font-bold text-gray-900">{gateway.displayName}</h5>
                            <p className="text-sm text-gray-600">{gateway.description}</p>
                          </div>
                        </div>
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleGatewayToggle(gateway.id)}
                          className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${isEnabled ? 'bg-primary' : 'bg-gray-200'
                            }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isEnabled ? 'translate-x-6' : 'translate-x-0'
                              }`}
                          />
                        </motion.button>
                      </div>

                      {isEnabled && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="space-y-4"
                        >
                          <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-4">
                            <div className='grid grid-cols-2 gap-3'>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Commission Rate (%)
                                </label>
                                <input
                                  type="number"
                                  value={formData.gatewaySettings[gateway.id]?.commission || 0}
                                  onChange={(e) => {
                                    const commission = parseFloat(e.target.value) || 0;
                                    setFormData(prev => ({
                                      ...prev,
                                      gatewaySettings: {
                                        ...prev.gatewaySettings,
                                        [gateway.id]: {
                                          ...prev.gatewaySettings[gateway.id],
                                          commission
                                        }
                                      }
                                    }));
                                  }}
                                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 transition-colors"
                                  placeholder="0"
                                  min="0"
                                  max="100"
                                  step="0.01"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  <Clock className="h-4 w-4 inline-block mr-1" />
                                  Payout Delay (days)
                                </label>
                                <input
                                  type="number"
                                  value={formData.gatewaySettings[gateway.id]?.payoutDelay || 0}
                                  onChange={(e) => {
                                    const payoutDelay = parseFloat(e.target.value) || 0;
                                    setFormData(prev => ({
                                      ...prev,
                                      gatewaySettings: {
                                        ...prev.gatewaySettings,
                                        [gateway.id]: {
                                          ...prev.gatewaySettings[gateway.id],
                                          payoutDelay
                                        }
                                      }
                                    }));
                                  }}
                                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 transition-colors"
                                  placeholder="0"
                                  min="0"
                                  step="1"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Min Amount (USDT)
                                </label>
                                <input
                                  type="number"
                                  value={formData.gatewaySettings[gateway.id]?.minAmount || 0}
                                  onChange={(e) => {
                                    const minAmount = parseFloat(e.target.value) || 0;
                                    setFormData(prev => ({
                                      ...prev,
                                      gatewaySettings: {
                                        ...prev.gatewaySettings,
                                        [gateway.id]: {
                                          ...prev.gatewaySettings[gateway.id],
                                          minAmount
                                        }
                                      }
                                    }));
                                  }}
                                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 transition-colors"
                                  placeholder="0"
                                  min="0"
                                  step="0.01"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Max Amount (USDT)
                                </label>
                                <input
                                  type="number"
                                  value={formData.gatewaySettings[gateway.id]?.maxAmount || 0}
                                  onChange={(e) => {
                                    const maxAmount = parseFloat(e.target.value) || 0;
                                    setFormData(prev => ({
                                      ...prev,
                                      gatewaySettings: {
                                        ...prev.gatewaySettings,
                                        [gateway.id]: {
                                          ...prev.gatewaySettings[gateway.id],
                                          maxAmount
                                        }
                                      }
                                    }));
                                  }}
                                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 transition-colors"
                                  placeholder="0"
                                  min="0"
                                  step="0.01"
                                />
                              </div>
                            </div>

                            {/* ✅ NEW: Дополнительное поле customer для шлюза 1110 (Amer) */}
                            {gateway.id === '1110' && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  <UserIcon className="h-4 w-4 inline-block mr-1" />
                                  Customer ID
                                </label>
                                <input
                                  type="text"
                                  value={formData.gatewaySettings[gateway.id]?.customer || ''}
                                  onChange={(e) => {
                                    const customer = e.target.value;
                                    setFormData(prev => ({
                                      ...prev,
                                      gatewaySettings: {
                                        ...prev.gatewaySettings,
                                        [gateway.id]: {
                                          ...prev.gatewaySettings[gateway.id],
                                          customer
                                        }
                                      }
                                    }));
                                  }}
                                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 transition-colors"
                                  placeholder="Enter customer ID"
                                />
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Crypto Wallets Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Wallet className="h-6 w-6 text-primary" />
                </div>
                <h4 className="text-xl font-bold text-gray-900">Crypto Wallets (Optional)</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {walletTypes.map((wallet) => (
                  <motion.div
                    key={wallet.key}
                    whileHover={{ scale: 1.02 }}
                    className="p-6 bg-gradient-to-br from-white to-gray-50 rounded-2xl border-2 border-gray-200 hover:border-primary/30 transition-all duration-300"
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <div className={`p-3 bg-gradient-to-r ${wallet.color === 'blue' ? 'from-blue-500 to-indigo-600' :
                          wallet.color === 'red' ? 'from-red-500 to-rose-600' :
                            wallet.color === 'gray' ? 'from-gray-700 to-gray-900' :
                              'from-blue-600 to-cyan-600'
                        } rounded-xl text-white`}>
                        <span className="text-xl">{wallet.icon}</span>
                      </div>
                      <div>
                        <h5 className="font-bold text-gray-900">{wallet.label}</h5>
                        <p className="text-sm text-gray-600">Wallet Address</p>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={formData.wallets?.[wallet.key as keyof typeof formData.wallets] || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        wallets: { ...formData.wallets, [wallet.key]: e.target.value }
                      })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 transition-colors text-gray-900 bg-white hover:border-gray-300 font-mono text-sm"
                      placeholder="Enter wallet address"
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Action Buttons */}
            <div className="border-t-2 border-gray-200 pt-8">
              <div className="flex justify-end space-x-4">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClose}
                  disabled={isLoading}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-200 flex items-center space-x-3 font-semibold disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                  <span>Cancel</span>
                </motion.button>

                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={!isLoading ? { scale: 1.05 } : {}}
                  whileTap={!isLoading ? { scale: 0.95 } : {}}
                  className="px-8 py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      <span>Update User</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

const Users: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUserForAnalytics, setSelectedUserForAnalytics] = useState<User | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
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

  const { data: usersData, isLoading, error } = useGetUsers(filters) as {
    data?: {
      users: User[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    };
    isLoading: boolean;
    error: any;
  };
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
    setEditingUser(user);
    setSelectedUser(null); // Закрываем модальное окно деталей
  };

  const handleUpdateUser = async (data: EditUserFormData) => {
    if (!editingUser) return;

    console.log('🔍 handleUpdateUser called with data:', data);
    console.log('🔍 editingUser:', editingUser);

    try {
      console.log('🔍 Calling updateUserMutation.mutateAsync...');
      await updateUserMutation.mutateAsync({ id: editingUser.id, data });
      console.log('✅ updateUserMutation completed successfully');
      toast.success('User updated successfully!');
      setEditingUser(null);
    } catch (error: any) {
      console.error('❌ updateUserMutation failed:', error);
      toast.error(error.message || 'Failed to update user');
    }
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
                        {format(new Date(user.createdAt), 'dd.MM.yy')}
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
        {editingUser && (
          <EditUserModal
            user={editingUser}
            onClose={() => setEditingUser(null)}
            onSubmit={handleUpdateUser}
            isLoading={updateUserMutation.isPending}
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