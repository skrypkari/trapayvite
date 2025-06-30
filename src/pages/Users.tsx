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
  MoreHorizontal,
  Edit3,
  Trash2,
  UserCheck,
  UserX,
  Building2,
  Globe,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Percent,
  Timer,
  BarChart3,
  X,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Activity,
  Wallet,
  Target,
  Award
} from 'lucide-react';
import { format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import Chart from 'react-apexcharts';
import CustomSelect from '../components/CustomSelect';
import DatePicker from '../components/DatePicker';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  useUsers, 
  useCreateUser, 
  useUpdateUser, 
  useDeleteUser, 
  useSuspendUser, 
  useActivateUser,
  type User,
  type AddUserFormData,
  type EditUserFormData,
  type UserFilters,
  validateUserData
} from '../hooks/useUsers';
import { 
  useAdmin,
  type MerchantStatisticsFilters 
} from '../hooks/useAdmin';
import { getGatewayInfo, GATEWAY_INFO } from '../utils/gatewayMapping';

// Merchant Statistics Modal Component
const MerchantStatisticsModal: React.FC<{
  user: User;
  onClose: () => void;
}> = ({ user, onClose }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year' | 'custom'>('month');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isStartDatePickerOpen, setIsStartDatePickerOpen] = useState(false);
  const [isEndDatePickerOpen, setIsEndDatePickerOpen] = useState(false);

  const { useMerchantStatistics } = useAdmin();

  // Build filters for API
  const filters: MerchantStatisticsFilters = useMemo(() => {
    const baseFilters: MerchantStatisticsFilters = {
      shopId: user.id,
      period: selectedPeriod,
    };

    if (selectedPeriod === 'custom' && startDate && endDate) {
      baseFilters.dateFrom = startDate.toISOString();
      baseFilters.dateTo = endDate.toISOString();
    }

    return baseFilters;
  }, [user.id, selectedPeriod, startDate, endDate]);

  const { data: statistics, isLoading, error } = useMerchantStatistics(filters);

  const periodOptions = [
    { value: 'week', label: 'Last 7 days' },
    { value: 'month', label: 'Last 30 days' },
    { value: 'quarter', label: 'Last 90 days' },
    { value: 'year', label: 'Last year' },
    { value: 'custom', label: 'Custom period' }
  ];

  // Chart configuration
  const chartOptions = {
    chart: {
      type: 'line' as const,
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      }
    },
    colors: ['#6936d3', '#22c55e', '#f97316'],
    stroke: {
      curve: 'smooth' as const,
      width: 3
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
      },
      labels: {
        style: {
          fontSize: '12px'
        }
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
        right: 20
      }
    },
    dataLabels: {
      enabled: false
    },
    legend: {
      position: 'bottom' as const,
      horizontalAlign: 'center' as const,
      fontSize: '12px',
      markers: {
        width: 8,
        height: 8
      }
    },
    responsive: [{
      breakpoint: 768,
      options: {
        chart: {
          height: 250
        },
        legend: {
          position: 'bottom' as const,
          fontSize: '10px'
        }
      }
    }]
  };

  const series = [
    {
      name: 'Turnover',
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
        className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto"
      >
        <div className="px-4 md:px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Merchant Statistics</h3>
                <p className="text-sm text-gray-500">{user.name} (@{user.username})</p>
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

        <div className="p-4 md:p-6 space-y-6">
          {/* Period Selection */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <CustomSelect
                value={selectedPeriod}
                onChange={(value) => setSelectedPeriod(value as typeof selectedPeriod)}
                options={periodOptions}
                placeholder="Select period"
                className="w-full sm:w-[200px]"
              />
            </div>
            
            {selectedPeriod === 'custom' && (
              <div className="flex gap-4">
                <div className="relative">
                  <button
                    onClick={() => setIsStartDatePickerOpen(true)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-left flex items-center space-x-3 hover:border-primary transition-all duration-200"
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
                <div className="relative">
                  <button
                    onClick={() => setIsEndDatePickerOpen(true)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-left flex items-center space-x-3 hover:border-primary transition-all duration-200"
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
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-600 mb-2">
                <AlertTriangle className="h-8 w-8 mx-auto" />
              </div>
              <p className="text-gray-600">Failed to load statistics. Please try again.</p>
            </div>
          ) : statistics ? (
            <>
              {/* Statistics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 md:p-4 border border-blue-200"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                    <span className="text-xs md:text-sm font-medium text-blue-700">Total Turnover</span>
                  </div>
                  <div className="text-lg md:text-xl font-bold text-blue-900">
                    ${statistics.totalTurnover.toLocaleString()}
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 md:p-4 border border-green-200"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                    <span className="text-xs md:text-sm font-medium text-green-700">Merchant Earnings</span>
                  </div>
                  <div className="text-lg md:text-xl font-bold text-green-900">
                    ${statistics.merchantEarnings.toLocaleString()}
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-3 md:p-4 border border-orange-200"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <ArrowUpRight className="h-4 w-4 md:h-5 md:w-5 text-orange-600" />
                    <span className="text-xs md:text-sm font-medium text-orange-700">Gateway Earnings</span>
                  </div>
                  <div className="text-lg md:text-xl font-bold text-orange-900">
                    ${statistics.gatewayEarnings.toLocaleString()}
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3 md:p-4 border border-purple-200"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <ArrowDownLeft className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
                    <span className="text-xs md:text-sm font-medium text-purple-700">Total Paid Out</span>
                  </div>
                  <div className="text-lg md:text-xl font-bold text-purple-900">
                    ${statistics.totalPaidOut.toLocaleString()}
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-3 md:p-4 border border-indigo-200"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Target className="h-4 w-4 md:h-5 md:w-5 text-indigo-600" />
                    <span className="text-xs md:text-sm font-medium text-indigo-700">Average Check</span>
                  </div>
                  <div className="text-lg md:text-xl font-bold text-indigo-900">
                    ${statistics.averageCheck.toFixed(2)}
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-3 md:p-4 border border-cyan-200"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Activity className="h-4 w-4 md:h-5 md:w-5 text-cyan-600" />
                    <span className="text-xs md:text-sm font-medium text-cyan-700">Total Payments</span>
                  </div>
                  <div className="text-lg md:text-xl font-bold text-cyan-900">
                    {statistics.totalPayments.toLocaleString()}
                  </div>
                </motion.div>
              </div>

              {/* Chart */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trends</h4>
                <div className="h-64 md:h-80">
                  <Chart
                    options={chartOptions}
                    series={series}
                    type="line"
                    height="100%"
                  />
                </div>
              </div>

              {/* Gateway Breakdown */}
              {statistics.gatewayBreakdown && statistics.gatewayBreakdown.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Gateway Breakdown</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {statistics.gatewayBreakdown.map((gateway, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 bg-gray-50 rounded-xl border border-gray-200"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-semibold text-gray-900">{gateway.gatewayDisplayName}</h5>
                          <span className="text-sm text-gray-500">{gateway.paymentsCount} payments</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-gray-500">Turnover</div>
                            <div className="font-semibold text-gray-900">${gateway.turnoverUSDT.toFixed(2)}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Commission</div>
                            <div className="font-semibold text-gray-900">${gateway.commissionUSDT.toFixed(2)}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Merchant Earnings</div>
                            <div className="font-semibold text-green-600">${gateway.merchantEarningsUSDT.toFixed(2)}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Commission Rate</div>
                            <div className="font-semibold text-gray-900">{gateway.averageCommissionRate}%</div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Period Info */}
              {statistics.periodInfo && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <Calendar className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900">Period Information</h4>
                      <div className="mt-2 text-sm text-blue-700 space-y-1">
                        <p>From: {format(new Date(statistics.periodInfo.from), 'PPP')}</p>
                        <p>To: {format(new Date(statistics.periodInfo.to), 'PPP')}</p>
                        <p>Period: {statistics.periodInfo.periodType} ({statistics.periodInfo.daysCount} days)</p>
                        <p>Conversion Rate: {statistics.conversionRate}%</p>
                        <p>Successful Payments: {statistics.successfulPayments} / {statistics.totalPayments}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// Add User Modal Component
const AddUserModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
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

  const createUserMutation = useCreateUser();

  const availableGateways = Object.values(GATEWAY_INFO).map(gateway => ({
    id: gateway.id,
    name: gateway.displayName,
    description: gateway.description
  }));

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
          commission: 10,
          payoutDelay: 5
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createUserMutation.mutateAsync(formData);
      toast.success('User created successfully!');
      onClose();
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
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user');
    }
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
                <h3 className="text-lg font-semibold text-gray-900">Add New User</h3>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500 p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Basic Information
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Brand Name *
                    </label>
                    <input
                      type="text"
                      value={formData.brandName}
                      onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                      placeholder="Enter brand name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username *
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                      placeholder="Enter username"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                      placeholder="Enter password"
                      required
                    />
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
                      placeholder="Enter Telegram ID"
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
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                      placeholder="https://example.com"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Payment Gateways */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Payment Gateways *
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableGateways.map((gateway) => (
                    <div key={gateway.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <input
                          type="checkbox"
                          id={`gateway-${gateway.id}`}
                          checked={formData.gateways.includes(gateway.id)}
                          onChange={() => handleGatewayToggle(gateway.id)}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor={`gateway-${gateway.id}`} className="flex-1">
                          <div className="font-medium text-gray-900">{gateway.name}</div>
                          <div className="text-sm text-gray-500">{gateway.description}</div>
                        </label>
                      </div>

                      {formData.gateways.includes(gateway.id) && (
                        <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-200">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Commission (%)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={formData.gatewaySettings[gateway.id]?.commission || 10}
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
                              value={formData.gatewaySettings[gateway.id]?.payoutDelay || 5}
                              onChange={(e) => handleGatewaySettingChange(gateway.id, 'payoutDelay', parseInt(e.target.value))}
                              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Wallet Settings */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Crypto Wallets (Optional)
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      USDT (Polygon)
                    </label>
                    <input
                      type="text"
                      value={formData.wallets?.usdtPolygonWallet || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        wallets: { ...formData.wallets, usdtPolygonWallet: e.target.value }
                      })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none font-mono text-sm"
                      placeholder="0x..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      USDT (TRC-20)
                    </label>
                    <input
                      type="text"
                      value={formData.wallets?.usdtTrcWallet || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        wallets: { ...formData.wallets, usdtTrcWallet: e.target.value }
                      })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none font-mono text-sm"
                      placeholder="TRX..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      USDT (ERC-20)
                    </label>
                    <input
                      type="text"
                      value={formData.wallets?.usdtErcWallet || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        wallets: { ...formData.wallets, usdtErcWallet: e.target.value }
                      })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none font-mono text-sm"
                      placeholder="0x..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      USDC (Polygon)
                    </label>
                    <input
                      type="text"
                      value={formData.wallets?.usdcPolygonWallet || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        wallets: { ...formData.wallets, usdcPolygonWallet: e.target.value }
                      })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none font-mono text-sm"
                      placeholder="0x..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800"
                  disabled={createUserMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createUserMutation.isPending || formData.gateways.length === 0}
                  className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {createUserMutation.isPending && <LoadingSpinner size="sm" />}
                  <span>{createUserMutation.isPending ? 'Creating...' : 'Create User'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Edit User Modal Component
const EditUserModal: React.FC<{
  user: User | null;
  onClose: () => void;
}> = ({ user, onClose }) => {
  const [formData, setFormData] = useState<EditUserFormData>({
    name: '',
    username: '',
    password: '',
    telegram: '',
    merchantUrl: '',
    paymentGateways: [],
    status: 'ACTIVE',
    gatewaySettings: {},
    wallets: {
      usdtPolygonWallet: '',
      usdtTrcWallet: '',
      usdtErcWallet: '',
      usdcPolygonWallet: ''
    }
  });

  const updateUserMutation = useUpdateUser();

  // Initialize form data when user changes
  React.useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        username: user.username,
        password: '',
        telegram: user.telegram,
        merchantUrl: user.shopUrl,
        paymentGateways: user.paymentGateways,
        status: user.status,
        gatewaySettings: user.gatewaySettings || {},
        wallets: user.wallets || {
          usdtPolygonWallet: '',
          usdtTrcWallet: '',
          usdtErcWallet: '',
          usdcPolygonWallet: ''
        }
      });
    }
  }, [user]);

  const availableGateways = Object.values(GATEWAY_INFO).map(gateway => ({
    id: gateway.id,
    name: gateway.displayName,
    description: gateway.description
  }));

  const handleGatewayToggle = (gatewayId: string) => {
    setFormData(prev => {
      const isSelected = prev.paymentGateways.includes(gatewayId);
      const newGateways = isSelected 
        ? prev.paymentGateways.filter(id => id !== gatewayId)
        : [...prev.paymentGateways, gatewayId];

      // Update gateway settings
      const newGatewaySettings = { ...prev.gatewaySettings };
      if (isSelected) {
        delete newGatewaySettings[gatewayId];
      } else {
        newGatewaySettings[gatewayId] = {
          commission: 10,
          payoutDelay: 5
        };
      }

      return {
        ...prev,
        paymentGateways: newGateways,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    const validationErrors = validateUserData(formData);
    if (validationErrors.length > 0) {
      toast.error(validationErrors[0].message);
      return;
    }

    try {
      await updateUserMutation.mutateAsync({ id: user.id, data: formData });
      toast.success('User updated successfully!');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user');
    }
  };

  if (!user) return null;

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
            <h3 className="text-lg font-semibold text-gray-900">Edit User</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Basic Information
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  placeholder="Enter brand name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  placeholder="Enter username"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password (leave empty to keep current)
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telegram ID
                </label>
                <input
                  type="text"
                  value={formData.telegram}
                  onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  placeholder="Enter Telegram ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <CustomSelect
                  value={formData.status}
                  onChange={(value) => setFormData({ ...formData, status: value as any })}
                  options={[
                    { value: 'ACTIVE', label: 'Active' },
                    { value: 'INACTIVE', label: 'Inactive' },
                    { value: 'SUSPENDED', label: 'Suspended' }
                  ]}
                  placeholder="Select status"
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
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  placeholder="https://example.com"
                  required
                />
              </div>
            </div>
          </div>

          {/* Payment Gateways */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Payment Gateways *
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableGateways.map((gateway) => (
                <div key={gateway.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <input
                      type="checkbox"
                      id={`gateway-${gateway.id}`}
                      checked={formData.paymentGateways.includes(gateway.id)}
                      onChange={() => handleGatewayToggle(gateway.id)}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <label htmlFor={`gateway-${gateway.id}`} className="flex-1">
                      <div className="font-medium text-gray-900">{gateway.name}</div>
                      <div className="text-sm text-gray-500">{gateway.description}</div>
                    </label>
                  </div>

                  {formData.paymentGateways.includes(gateway.id) && (
                    <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-200">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Commission (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={formData.gatewaySettings[gateway.id]?.commission || 10}
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
                          value={formData.gatewaySettings[gateway.id]?.payoutDelay || 5}
                          onChange={(e) => handleGatewaySettingChange(gateway.id, 'payoutDelay', parseInt(e.target.value))}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Wallet Settings */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Crypto Wallets (Optional)
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  USDT (Polygon)
                </label>
                <input
                  type="text"
                  value={formData.wallets?.usdtPolygonWallet || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    wallets: { ...formData.wallets, usdtPolygonWallet: e.target.value }
                  })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none font-mono text-sm"
                  placeholder="0x..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  USDT (TRC-20)
                </label>
                <input
                  type="text"
                  value={formData.wallets?.usdtTrcWallet || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    wallets: { ...formData.wallets, usdtTrcWallet: e.target.value }
                  })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none font-mono text-sm"
                  placeholder="TRX..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  USDT (ERC-20)
                </label>
                <input
                  type="text"
                  value={formData.wallets?.usdtErcWallet || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    wallets: { ...formData.wallets, usdtErcWallet: e.target.value }
                  })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none font-mono text-sm"
                  placeholder="0x..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  USDC (Polygon)
                </label>
                <input
                  type="text"
                  value={formData.wallets?.usdcPolygonWallet || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    wallets: { ...formData.wallets, usdcPolygonWallet: e.target.value }
                  })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none font-mono text-sm"
                  placeholder="0x..."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800"
              disabled={updateUserMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateUserMutation.isPending || formData.paymentGateways.length === 0}
              className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {updateUserMutation.isPending && <LoadingSpinner size="sm" />}
              <span>{updateUserMutation.isPending ? 'Updating...' : 'Update User'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// Main Users Component
const Users: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [statisticsUser, setStatisticsUser] = useState<User | null>(null);
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

  const { data: usersData, isLoading, error } = useUsers(filters);
  const deleteUserMutation = useDeleteUser();
  const suspendUserMutation = useSuspendUser();
  const activateUserMutation = useActivateUser();

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
      user.telegram.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [usersData?.users, searchTerm]);

  const handleDeleteUser = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUserMutation.mutateAsync(id);
        toast.success('User deleted successfully');
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete user');
      }
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

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-600 mb-2">
          <AlertTriangle className="h-8 w-8 mx-auto" />
        </div>
        <p className="text-gray-600">Failed to load users. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add User</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <CustomSelect
                value={statusFilter}
                onChange={setStatusFilter}
                options={statusOptions}
                placeholder="Filter by status"
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
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left p-4 text-sm font-medium text-gray-500">User</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-500">Gateways</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-500">Created</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">@{user.username}</div>
                          {user.telegram && (
                            <div className="text-xs text-gray-400">{user.telegram}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-lg ${
                        user.status === 'ACTIVE' ? 'bg-green-50 text-green-600' :
                        user.status === 'SUSPENDED' ? 'bg-red-50 text-red-600' :
                        'bg-yellow-50 text-yellow-600'
                      }`}>
                        {user.status === 'ACTIVE' && <CheckCircle2 className="h-4 w-4" />}
                        {user.status === 'SUSPENDED' && <XCircle className="h-4 w-4" />}
                        {user.status === 'PENDING' && <Clock className="h-4 w-4" />}
                        <span className="text-sm font-medium">{user.status}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {user.paymentGateways.slice(0, 3).map((gatewayId) => {
                          const gatewayInfo = getGatewayInfo(gatewayId);
                          return (
                            <span
                              key={gatewayId}
                              className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full"
                            >
                              {gatewayInfo ? gatewayInfo.displayName.split(' - ')[0] : `Gateway ${gatewayId}`}
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
                    <td className="p-4">
                      <span className="text-sm text-gray-600">
                        {format(new Date(user.createdAt), 'MMM d, yyyy')}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setStatisticsUser(user)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Statistics"
                        >
                          <BarChart3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingUser(user)}
                          className="p-2 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <div className="relative group">
                          <button className="p-2 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                            {user.status === 'ACTIVE' ? (
                              <button
                                onClick={() => handleSuspendUser(user.id)}
                                className="w-full px-4 py-2 text-left text-sm text-orange-600 hover:bg-orange-50 flex items-center space-x-2"
                              >
                                <UserX className="h-4 w-4" />
                                <span>Suspend</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleActivateUser(user.id)}
                                className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 flex items-center space-x-2"
                              >
                                <UserCheck className="h-4 w-4" />
                                <span>Activate</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
        {isAddModalOpen && (
          <AddUserModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
          />
        )}
        {editingUser && (
          <EditUserModal
            user={editingUser}
            onClose={() => setEditingUser(null)}
          />
        )}
        {statisticsUser && (
          <MerchantStatisticsModal
            user={statisticsUser}
            onClose={() => setStatisticsUser(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Users;