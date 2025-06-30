import React, { useState, useEffect } from 'react';
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
  Edit3,
  Trash2,
  MoreHorizontal,
  User as UserIcon,
  Building2,
  DollarSign,
  TrendingUp,
  Activity,
  BarChart3,
  X,
  Calendar,
  Wallet,
  CreditCard,
  Target,
  Award,
  ArrowUpRight,
  ArrowDownLeft,
  Percent,
  Timer,
  Copy,
  Check
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { format } from 'date-fns';
import Chart from 'react-apexcharts';
import { toast } from 'sonner';
import CustomSelect from '../components/CustomSelect';
import LoadingSpinner from '../components/LoadingSpinner';
import DatePicker from '../components/DatePicker';
import { 
  useGetUsers, 
  useCreateUser, 
  useUpdateUser, 
  useDeleteUser,
  type User,
  type AddUserFormData,
  type EditUserFormData,
  type UserFilters,
  type GatewaySettings,
  validateUserData
} from '../hooks/useUsers';
import { api } from '../lib/api';
import { getGatewayInfo, GATEWAY_INFO } from '../utils/gatewayMapping';

// Merchant Statistics Types
interface MerchantStatistics {
  totalTurnover: number;
  merchantEarnings: number;
  gatewayEarnings: number;
  totalPaidOut: number;
  averageCheck: number;
  totalPayments: number;
  successfulPayments: number;
  conversionRate: number;
  gatewayBreakdown: {
    gateway: string;
    gatewayDisplayName: string;
    paymentsCount: number;
    turnoverUSDT: number;
    commissionUSDT: number;
    merchantEarningsUSDT: number;
    averageCommissionRate: number;
  }[];
  dailyData: {
    date: string;
    turnover: number;
    merchantEarnings: number;
    gatewayEarnings: number;
    paymentsCount: number;
  }[];
  periodInfo: {
    from: string;
    to: string;
    periodType: string;
    daysCount: number;
  };
}

interface MerchantStatisticsResponse {
  success: boolean;
  result: MerchantStatistics;
}

const MerchantStatisticsModal: React.FC<{
  user: User;
  onClose: () => void;
}> = ({ user, onClose }) => {
  const [statistics, setStatistics] = useState<MerchantStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('month');
  const [customDateFrom, setCustomDateFrom] = useState<Date | null>(null);
  const [customDateTo, setCustomDateTo] = useState<Date | null>(null);
  const [isFromDatePickerOpen, setIsFromDatePickerOpen] = useState(false);
  const [isToDatePickerOpen, setIsToDatePickerOpen] = useState(false);
  const [showCopied, setShowCopied] = useState<string | null>(null);

  const periodOptions = [
    { value: 'week', label: 'Last 7 days' },
    { value: 'month', label: 'Last 30 days' },
    { value: 'quarter', label: 'Last 90 days' },
    { value: 'year', label: 'Last year' },
    { value: 'custom', label: 'Custom period' }
  ];

  const fetchStatistics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('shopId', user.id);
      params.append('period', period);

      if (period === 'custom' && customDateFrom && customDateTo) {
        params.append('dateFrom', customDateFrom.toISOString());
        params.append('dateTo', customDateTo.toISOString());
      }

      const response = await api.get<MerchantStatisticsResponse>(
        `/admin/merchant-statistics?${params.toString()}`
      );

      if (response.success) {
        setStatistics(response.result);
      } else {
        throw new Error('Failed to fetch statistics');
      }
    } catch (err: any) {
      console.error('Failed to fetch merchant statistics:', err);
      setError(err.message || 'Failed to load statistics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, [user.id, period, customDateFrom, customDateTo]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setShowCopied(id);
    setTimeout(() => setShowCopied(null), 2000);
  };

  // Chart configuration for daily data
  const chartOptions = {
    chart: {
      type: 'area',
      toolbar: { show: false },
      zoom: { enabled: false }
    },
    colors: ['#6936d3', '#22c55e', '#f97316'],
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
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { show: true }
    },
    yaxis: {
      labels: {
        formatter: (value: number) => `$${value.toFixed(0)}`,
        style: { fontSize: '12px' }
      }
    },
    grid: {
      strokeDashArray: 4,
      padding: { left: 20, bottom: 0 }
    },
    dataLabels: { enabled: false },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'left'
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: { height: 200 },
        legend: { position: 'bottom' }
      }
    }]
  };

  const chartSeries = [
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Merchant Statistics</h3>
                <p className="text-sm text-gray-500">{user.name} (@{user.username})</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <CustomSelect
                  value={period}
                  onChange={setPeriod}
                  options={periodOptions}
                  placeholder="Select period"
                  className="w-[160px]"
                />
                {period === 'custom' && (
                  <>
                    <div className="relative">
                      <button
                        onClick={() => setIsFromDatePickerOpen(true)}
                        className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:border-primary transition-colors"
                      >
                        {customDateFrom ? format(customDateFrom, 'MMM d') : 'From'}
                      </button>
                      <AnimatePresence>
                        {isFromDatePickerOpen && (
                          <DatePicker
                            value={customDateFrom}
                            onChange={(date) => {
                              setCustomDateFrom(date);
                              setIsFromDatePickerOpen(false);
                            }}
                            onClose={() => setIsFromDatePickerOpen(false)}
                          />
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setIsToDatePickerOpen(true)}
                        className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:border-primary transition-colors"
                      >
                        {customDateTo ? format(customDateTo, 'MMM d') : 'To'}
                      </button>
                      <AnimatePresence>
                        {isToDatePickerOpen && (
                          <DatePicker
                            value={customDateTo}
                            onChange={(date) => {
                              setCustomDateTo(date);
                              setIsToDatePickerOpen(false);
                            }}
                            onClose={() => setIsToDatePickerOpen(false)}
                          />
                        )}
                      </AnimatePresence>
                    </div>
                  </>
                )}
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

        <div className="p-4 md:p-6 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchStatistics}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
              >
                Try Again
              </button>
            </div>
          ) : statistics ? (
            <>
              {/* Statistics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 md:p-4 border border-green-200"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                    <span className="text-xs md:text-sm font-medium text-green-700">Total Turnover</span>
                  </div>
                  <div className="text-lg md:text-xl font-bold text-green-900">
                    ${statistics.totalTurnover.toLocaleString()}
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 md:p-4 border border-blue-200"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Wallet className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                    <span className="text-xs md:text-sm font-medium text-blue-700">Merchant Earnings</span>
                  </div>
                  <div className="text-lg md:text-xl font-bold text-blue-900">
                    ${statistics.merchantEarnings.toLocaleString()}
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-3 md:p-4 border border-orange-200"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Building2 className="h-4 w-4 md:h-5 md:w-5 text-orange-600" />
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
                    <CreditCard className="h-4 w-4 md:h-5 md:w-5 text-indigo-600" />
                    <span className="text-xs md:text-sm font-medium text-indigo-700">Average Check</span>
                  </div>
                  <div className="text-lg md:text-xl font-bold text-indigo-900">
                    ${statistics.averageCheck.toFixed(2)}
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-3 md:p-4 border border-teal-200"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Activity className="h-4 w-4 md:h-5 md:w-5 text-teal-600" />
                    <span className="text-xs md:text-sm font-medium text-teal-700">Total Payments</span>
                  </div>
                  <div className="text-lg md:text-xl font-bold text-teal-900">
                    {statistics.totalPayments.toLocaleString()}
                  </div>
                </motion.div>
              </div>

              {/* Chart */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Daily Performance</h4>
                <div className="h-64 md:h-80">
                  <Chart
                    options={chartOptions}
                    series={chartSeries}
                    type="area"
                    height="100%"
                  />
                </div>
              </div>

              {/* Gateway Breakdown */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Gateway Breakdown</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {statistics.gatewayBreakdown.map((gateway, index) => (
                    <motion.div
                      key={gateway.gateway}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-gray-50 rounded-xl border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-gray-900">{gateway.gatewayDisplayName}</h5>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                          {gateway.averageCommissionRate}%
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Payments:</span>
                          <span className="font-medium">{gateway.paymentsCount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Turnover:</span>
                          <span className="font-medium">${gateway.turnoverUSDT.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Commission:</span>
                          <span className="font-medium text-orange-600">${gateway.commissionUSDT.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Merchant Earnings:</span>
                          <span className="font-medium text-green-600">${gateway.merchantEarningsUSDT.toFixed(2)}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Period Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                      Period: {format(new Date(statistics.periodInfo.from), 'MMM d, yyyy')} - {format(new Date(statistics.periodInfo.to), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="text-sm text-blue-700">
                    {statistics.periodInfo.daysCount} days • {statistics.periodInfo.periodType}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </motion.div>
    </motion.div>
  );
};

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

  const [errors, setErrors] = useState<string[]>([]);
  const createUserMutation = useCreateUser();

  const availableGateways = Object.values(GATEWAY_INFO).map(gateway => ({
    id: gateway.id,
    name: gateway.displayName,
    description: gateway.description
  }));

  const handleGatewayToggle = (gatewayId: string) => {
    const isSelected = formData.gateways.includes(gatewayId);
    
    if (isSelected) {
      // Remove gateway and its settings
      const newGateways = formData.gateways.filter(id => id !== gatewayId);
      const newSettings = { ...formData.gatewaySettings };
      delete newSettings[gatewayId];
      
      setFormData({
        ...formData,
        gateways: newGateways,
        gatewaySettings: newSettings
      });
    } else {
      // Add gateway with default settings
      setFormData({
        ...formData,
        gateways: [...formData.gateways, gatewayId],
        gatewaySettings: {
          ...formData.gatewaySettings,
          [gatewayId]: {
            commission: 10,
            payoutDelay: 5
          }
        }
      });
    }
  };

  const handleGatewaySettingChange = (gatewayId: string, field: 'commission' | 'payoutDelay', value: number) => {
    setFormData({
      ...formData,
      gatewaySettings: {
        ...formData.gatewaySettings,
        [gatewayId]: {
          ...formData.gatewaySettings[gatewayId],
          [field]: value
        }
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    try {
      await createUserMutation.mutateAsync(formData);
      toast.success('User created successfully!');
      onClose();
      // Reset form
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
      console.error('Create user error:', error);
      if (error.message) {
        setErrors([error.message]);
      } else {
        setErrors(['Failed to create user. Please try again.']);
      }
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
              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-red-900">Please fix the following errors:</h4>
                      <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                        {errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

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
                </div>

                <div>
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

              {/* Gateway Selection */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Payment Gateways *
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableGateways.map((gateway) => (
                    <div
                      key={gateway.id}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.gateways.includes(gateway.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleGatewayToggle(gateway.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900">{gateway.name}</h5>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          formData.gateways.includes(gateway.id)
                            ? 'border-primary bg-primary'
                            : 'border-gray-300'
                        }`}>
                          {formData.gateways.includes(gateway.id) && (
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{gateway.description}</p>
                      
                      {formData.gateways.includes(gateway.id) && (
                        <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Commission (%)
                            </label>
                            <input
                              type="number"
                              value={formData.gatewaySettings[gateway.id]?.commission || 10}
                              onChange={(e) => handleGatewaySettingChange(gateway.id, 'commission', parseFloat(e.target.value))}
                              className="w-full px-3 py-2 text-sm rounded border border-gray-300 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                              min="0"
                              max="100"
                              step="0.1"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Payout Delay (days)
                            </label>
                            <input
                              type="number"
                              value={formData.gatewaySettings[gateway.id]?.payoutDelay || 5}
                              onChange={(e) => handleGatewaySettingChange(gateway.id, 'payoutDelay', parseInt(e.target.value))}
                              className="w-full px-3 py-2 text-sm rounded border border-gray-300 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                              min="0"
                              max="365"
                              onClick={(e) => e.stopPropagation()}
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

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
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

  const [errors, setErrors] = useState<string[]>([]);
  const updateUserMutation = useUpdateUser();

  const availableGateways = Object.values(GATEWAY_INFO).map(gateway => ({
    id: gateway.id,
    name: gateway.displayName,
    description: gateway.description
  }));

  useEffect(() => {
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

  const handleGatewayToggle = (gatewayId: string) => {
    const isSelected = formData.paymentGateways.includes(gatewayId);
    
    if (isSelected) {
      // Remove gateway and its settings
      const newGateways = formData.paymentGateways.filter(id => id !== gatewayId);
      const newSettings = { ...formData.gatewaySettings };
      delete newSettings[gatewayId];
      
      setFormData({
        ...formData,
        paymentGateways: newGateways,
        gatewaySettings: newSettings
      });
    } else {
      // Add gateway with default settings
      setFormData({
        ...formData,
        paymentGateways: [...formData.paymentGateways, gatewayId],
        gatewaySettings: {
          ...formData.gatewaySettings,
          [gatewayId]: {
            commission: 10,
            payoutDelay: 5
          }
        }
      });
    }
  };

  const handleGatewaySettingChange = (gatewayId: string, field: 'commission' | 'payoutDelay', value: number) => {
    setFormData({
      ...formData,
      gatewaySettings: {
        ...formData.gatewaySettings,
        [gatewayId]: {
          ...formData.gatewaySettings[gatewayId],
          [field]: value
        }
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setErrors([]);

    const validationErrors = validateUserData(formData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors.map(error => error.message));
      return;
    }

    try {
      await updateUserMutation.mutateAsync({ id: user.id, data: formData });
      toast.success('User updated successfully!');
      onClose();
    } catch (error: any) {
      console.error('Update user error:', error);
      if (error.message) {
        setErrors([error.message]);
      } else {
        setErrors(['Failed to update user. Please try again.']);
      }
    }
  };

  if (!user) return null;

  return (
    <AnimatePresence>
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
            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-red-900">Please fix the following errors:</h4>
                    <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <CustomSelect
                    value={formData.status}
                    onChange={(value) => setFormData({ ...formData, status: value as any })}
                    options={[
                      { value: 'ACTIVE', label: 'Active', icon: <CheckCircle2 className="h-4 w-4 text-green-600" /> },
                      { value: 'INACTIVE', label: 'Inactive', icon: <Clock className="h-4 w-4 text-yellow-600" /> },
                      { value: 'SUSPENDED', label: 'Suspended', icon: <XCircle className="h-4 w-4 text-red-600" /> }
                    ]}
                    placeholder="Select status"
                  />
                </div>
              </div>
            </div>

            {/* Gateway Selection */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Payment Gateways *
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableGateways.map((gateway) => (
                  <div
                    key={gateway.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.paymentGateways.includes(gateway.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleGatewayToggle(gateway.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-gray-900">{gateway.name}</h5>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        formData.paymentGateways.includes(gateway.id)
                          ? 'border-primary bg-primary'
                          : 'border-gray-300'
                      }`}>
                        {formData.paymentGateways.includes(gateway.id) && (
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{gateway.description}</p>
                    
                    {formData.paymentGateways.includes(gateway.id) && (
                      <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Commission (%)
                          </label>
                          <input
                            type="number"
                            value={formData.gatewaySettings[gateway.id]?.commission || 10}
                            onChange={(e) => handleGatewaySettingChange(gateway.id, 'commission', parseFloat(e.target.value))}
                            className="w-full px-3 py-2 text-sm rounded border border-gray-300 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                            min="0"
                            max="100"
                            step="0.1"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Payout Delay (days)
                          </label>
                          <input
                            type="number"
                            value={formData.gatewaySettings[gateway.id]?.payoutDelay || 5}
                            onChange={(e) => handleGatewaySettingChange(gateway.id, 'payoutDelay', parseInt(e.target.value))}
                            className="w-full px-3 py-2 text-sm rounded border border-gray-300 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                            min="0"
                            max="365"
                            onClick={(e) => e.stopPropagation()}
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

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
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
    </AnimatePresence>
  );
};

const Users: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [statisticsUser, setStatisticsUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  const filters: UserFilters = {
    page: currentPage,
    limit: pageSize,
    status: statusFilter !== 'all' ? statusFilter as any : undefined,
  };

  const { data: usersData, isLoading, error } = useGetUsers(filters);
  const deleteUserMutation = useDeleteUser();

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'ACTIVE', label: 'Active', icon: <CheckCircle2 className="h-4 w-4 text-green-600" /> },
    { value: 'SUSPENDED', label: 'Suspended', icon: <XCircle className="h-4 w-4 text-red-600" /> },
    { value: 'PENDING', label: 'Pending', icon: <Clock className="h-4 w-4 text-yellow-600" /> }
  ];

  const handleDeleteUser = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await deleteUserMutation.mutateAsync(id);
        toast.success('User deleted successfully');
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete user');
      }
    }
  };

  // Filter users by search term (client-side filtering for loaded data)
  const filteredUsers = usersData?.users?.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.telegram.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

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
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Users</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage user accounts and permissions
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
                className="w-full sm:w-[180px]"
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
                    <button className="flex items-center space-x-2 text-sm font-medium text-gray-500">
                      <span>User</span>
                      <ArrowUpDown className="h-4 w-4" />
                    </button>
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
                  <th className="text-right px-6 py-4">
                    <span className="text-sm font-medium text-gray-500">Actions</span>
                  </th>
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
                          {user.telegram && (
                            <div className="text-xs text-gray-400">{user.telegram}</div>
                          )}
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
                              {gatewayInfo ? gatewayInfo.id : gatewayId}
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
                          onClick={() => setStatisticsUser(user)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                          title="View Statistics"
                        >
                          <BarChart3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingUser(user)}
                          className="p-2 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg transition-all duration-200"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
          <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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