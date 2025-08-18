import React, { useState, useMemo } from 'react';
import {
  Search,
  Calendar,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  Download,
  Wallet,
  CreditCard,
  Receipt,
  AlertCircle,
  Copy,
  DollarSign,
  TrendingUp,
  Globe,
  Building2,
  Bitcoin,
  Check,
  X,
  RotateCcw,
  AlertTriangle,
  Loader2,
  ExternalLink,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import CustomSelect from '../components/CustomSelect';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  useShopPayments, 
  useShopStatistics,
  type ShopPayment,
  type PaymentFilters 
} from '../hooks/useShop';
import { getGatewayDisplayName } from '../utils/gatewayMapping';

const PaymentDetailsModal: React.FC<{
  payment: ShopPayment;
  onClose: () => void;
}> = ({ payment, onClose }) => {
  const [showCopied, setShowCopied] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setShowCopied(id);
    setTimeout(() => setShowCopied(null), 2000);
  };

  const gatewayDisplayName = getGatewayDisplayName(payment.gateway);

  // Helper function to render field if value exists
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
      PAID: { 
        color: 'green', 
        icon: <CheckCircle2 className="h-5 w-5" />, 
        bg: 'from-green-500 to-emerald-600',
        text: 'Paid Successfully'
      },
      PENDING: { 
        color: 'yellow', 
        icon: <Clock className="h-5 w-5" />, 
        bg: 'from-yellow-500 to-orange-500',
        text: 'Awaiting Payment'
      },
      PROCESSING: { 
        color: 'blue', 
        icon: <Loader2 className="h-5 w-5 animate-spin" />, 
        bg: 'from-blue-500 to-indigo-600',
        text: 'Processing Payment'
      },
      FAILED: { 
        color: 'red', 
        icon: <AlertCircle className="h-5 w-5" />, 
        bg: 'from-red-500 to-rose-600',
        text: 'Payment Failed'
      },
      EXPIRED: { 
        color: 'gray', 
        icon: <XCircle className="h-5 w-5" />, 
        bg: 'from-gray-500 to-gray-600',
        text: 'Payment Expired'
      },
      REFUND: { 
        color: 'orange', 
        icon: <RotateCcw className="h-5 w-5" />, 
        bg: 'from-orange-500 to-amber-600',
        text: 'Payment Refunded'
      },
      CHARGEBACK: { 
        color: 'red', 
        icon: <AlertTriangle className="h-5 w-5" />, 
        bg: 'from-red-600 to-red-700',
        text: 'Chargeback Issued'
      }
    };

    const config = statusConfig[status.toUpperCase() as keyof typeof statusConfig] || statusConfig.PENDING;
    
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
        className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden"
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
                  <CreditCard className="h-8 w-8 text-white" />
                </motion.div>
                <div>
                  <motion.h3
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl font-bold text-white"
                  >
                    Payment Details
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-white/80 font-mono text-sm"
                  >
                    {payment.id}
                  </motion.p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
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
              {getStatusBadge(payment.status)}
            </motion.div>

            {/* Failure Message Alert */}
            {payment.status.toUpperCase() === 'FAILED' && payment.failure_message && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="relative overflow-hidden p-6 bg-gradient-to-r from-red-50 via-red-100 to-pink-50 border border-red-200 rounded-2xl shadow-lg"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-pink-500 rounded-t-2xl"></div>
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-red-500 rounded-xl text-white">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-red-900 mb-2">Payment Failed</h4>
                    <p className="text-red-700 leading-relaxed">{payment.failure_message}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Transaction URLs */}
            {payment.tx_urls && Array.isArray(payment.tx_urls) && payment.tx_urls.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="relative p-6 bg-gradient-to-r overflow-hidden from-blue-50 via-blue-100 to-indigo-50 border border-blue-200 rounded-2xl shadow-lg"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-t-2xl"></div>
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-blue-500 rounded-xl text-white">
                    <ExternalLink className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-blue-900 mb-4">Transaction URLs</h4>
                    <div className="space-y-3">
                      {payment.tx_urls.map((url: string, index: number) => (
                        <div key={index} className="flex items-center justify-between bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-blue-200">
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-700 hover:text-blue-800 break-all mr-3 underline font-medium"
                          >
                            {url}
                          </a>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleCopy(url, `tx-url-${index}`)}
                            className="p-2 text-blue-500 hover:text-blue-700 hover:bg-white rounded-lg transition-all duration-200 flex-shrink-0"
                          >
                            {showCopied === `tx-url-${index}` ? (
                              <Check className="h-5 w-5 text-green-500" />
                            ) : (
                              <Copy className="h-5 w-5" />
                            )}
                          </motion.button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Payment Information Grid with enhanced design */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Core Payment Info with special styling */}
              {renderField(
                'Payment ID', 
                payment.id, 
                true, 
                'payment-id', 
                <Receipt className="h-5 w-5" />,
                'md:col-span-2 lg:col-span-1 border-2 border-primary/20 shadow-lg'
              )}

              {renderField(
                'Gateway', 
                gatewayDisplayName, 
                false, 
                '', 
                <Wallet className="h-5 w-5" />
              )}

              {renderField(
                'Amount', 
                `${payment.amount.toFixed(2)} ${payment.currency}`, 
                false, 
                '', 
                <DollarSign className="h-5 w-5" />,
                'border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50'
              )}

              {payment.amountAfterGatewayCommissionUSDT && renderField(
                'Amount After Commission (USDT)', 
                `${payment.amountAfterGatewayCommissionUSDT.toFixed(2)} USDT`, 
                false, 
                '', 
                <DollarSign className="h-5 w-5" />,
                'border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100'
              )}

              {renderField('Created At', format(new Date(payment.created_at), 'dd.MM.yy HH:mm'), false, '', <Calendar className="h-4 w-4" />)}
              {payment.updated_at && renderField('Updated At', format(new Date(payment.updated_at), 'dd.MM.yy HH:mm'), false, '', <Calendar className="h-4 w-4" />)}

              {/* Customer Information */}
              {renderField('Customer Name', payment.customer_name, false, '', <Receipt className="h-4 w-4" />)}
              {renderField('Customer Email', payment.customer_email, true, 'customer-email', <Receipt className="h-4 w-4" />)}
              {renderField('Customer Country', payment.customer_country, false, '', <Globe className="h-4 w-4" />)}
              {renderField('Customer IP', payment.customer_ip, true, 'customer-ip', <Globe className="h-4 w-4" />)}
              {renderField('User Agent', payment.customer_ua, true, 'customer-ua', <Receipt className="h-4 w-4" />)}

              {/* Payment Method Information */}
              {(payment as any).remitter_iban && renderField('IBAN', (payment as any).remitter_iban, true, 'remitter-iban', <Building2 className="h-4 w-4" />)}
              {(payment as any).card_last4 && renderField('Card Last 4', `****${(payment as any).card_last4}`, false, '', <CreditCard className="h-4 w-4" />)}
              {(payment as any).payment_method && renderField('Payment Method', (payment as any).payment_method, false, '', <CreditCard className="h-4 w-4" />)}
              {renderField('Product Name', payment.product_name, false, '', <Receipt className="h-4 w-4" />)}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const Transactions: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [gatewayFilter, setGatewayFilter] = useState<string>('all');
  const [currencyFilter, setCurrencyFilter] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<ShopPayment | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20; // ✅ FIXED: Remove setPageSize since it's not used

  // ✅ NEW: Sort configuration
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // ✅ NEW: Handle sort change
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  // ✅ NEW: Get sort icon for sortable columns
  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortOrder === 'desc' 
      ? <ArrowDown className="h-4 w-4" />
      : <ArrowUp className="h-4 w-4" />;
  };

  // ✅ NEW: Get sort button classes
  const getSortButtonClasses = (field: string) => {
    const baseClasses = "flex items-center space-x-1 text-xs font-semibold text-gray-600 hover:text-gray-800 transition-colors duration-200";
    const activeClasses = sortField === field ? "text-primary" : "";
    return `${baseClasses} ${activeClasses}`;
  };

  // Build filters for API
  const filters: PaymentFilters = useMemo(() => {
    const apiFilters: PaymentFilters = {
      page: currentPage,
      limit: pageSize,
      sortBy: sortField,        // ✅ NEW: Add sort field
      sortOrder: sortOrder,     // ✅ NEW: Add sort order
    };

    if (statusFilter !== 'all') {
      apiFilters.status = statusFilter as any;
    }

    if (gatewayFilter !== 'all') {
      apiFilters.gateway = gatewayFilter;
    }

    if (currencyFilter !== 'all') { // ✅ NEW: Currency filter
      apiFilters.currency = currencyFilter;
    }

    return apiFilters;
  }, [currentPage, pageSize, statusFilter, gatewayFilter, currencyFilter, sortField, sortOrder]);

  const { data: paymentsData, isLoading, error } = useShopPayments(filters);
  const { data: statistics } = useShopStatistics('30d');

  // Filter payments by search term (client-side filtering for loaded data)
  const filteredPayments = useMemo(() => {
    if (!paymentsData?.payments) return [];
    
    if (!searchTerm) return paymentsData.payments;
    
    return paymentsData.payments.filter(payment => 
      payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.currency.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getGatewayDisplayName(payment.gateway).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [paymentsData?.payments, searchTerm]);

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'PAID', label: 'Paid', icon: <CheckCircle2 className="h-4 w-4 text-green-600" /> },
    { value: 'PENDING', label: 'Pending', icon: <Clock className="h-4 w-4 text-yellow-600" /> },
    { value: 'PROCESSING', label: 'Processing', icon: <Loader2 className="h-4 w-4 text-blue-600" /> },
    { value: 'FAILED', label: 'Failed', icon: <AlertCircle className="h-4 w-4 text-red-600" /> },
    { value: 'EXPIRED', label: 'Expired', icon: <XCircle className="h-4 w-4 text-gray-600" /> },
    { value: 'REFUND', label: 'Refunded', icon: <RotateCcw className="h-4 w-4 text-orange-600" /> },
    { value: 'CHARGEBACK', label: 'Chargeback', icon: <AlertTriangle className="h-4 w-4 text-red-700" /> },
  ];

  const gatewayOptions = [
    { value: 'all', label: 'All Gateways' },
    { value: '0001', label: 'Plisio' },
    { value: '0010', label: 'Rapyd' },
    { value: '0100', label: 'CoinToPay' },
    { value: '0101', label: 'CoinToPay2' },
    { value: '1000', label: 'Noda' },
    { value: '1001', label: 'KLYME_EU' },
    { value: '1010', label: 'KLYME_GB' },
    { value: '1100', label: 'KLYME_DE' },
    { value: '1111', label: 'MasterCard' },
  ];

  const currencyOptions = [
    { value: 'all', label: 'All Currencies' },
    { value: 'USD', label: 'USD' },
    { value: 'EUR', label: 'EUR' },
    { value: 'GBP', label: 'GBP' },
    { value: 'JPY', label: 'JPY' },
    { value: 'CAD', label: 'CAD' },
    { value: 'AUD', label: 'AUD' },
    { value: 'CHF', label: 'CHF' },
    { value: 'CNY', label: 'CNY' },
    { value: 'USDT', label: 'USDT' },
    { value: 'TON', label: 'TON' },
    { value: 'BTC', label: 'BTC' },
    { value: 'ETH', label: 'ETH' },
    { value: 'LTC', label: 'LTC' },
    { value: 'BCH', label: 'BCH' },
    { value: 'DOGE', label: 'DOGE' },
    { value: 'USDC', label: 'USDC' },
  ];

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-600 mb-2">
          <AlertCircle className="h-8 w-8 mx-auto" />
        </div>
        <p className="text-gray-600">Failed to load payments. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Payments</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage your payment history
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200 w-full sm:w-auto justify-center"
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </motion.button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-6">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl shadow-sm p-3 md:p-6 border border-gray-100 hover:border-primary/20 transition-all duration-200"
          >
            <div className="flex items-center space-x-3 md:space-x-4">
              <div className="p-2 md:p-3 bg-primary/10 rounded-xl flex-shrink-0">
                <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-500">Total Revenue</p>
                <p className="text-lg md:text-2xl font-semibold text-gray-900">
                  {(statistics.totalAmount || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl shadow-sm p-3 md:p-6 border border-gray-100 hover:border-primary/20 transition-all duration-200"
          >
            <div className="flex items-center space-x-3 md:space-x-4">
              <div className="p-2 md:p-3 bg-green-50 rounded-xl flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-500">Successful</p>
                <p className="text-lg md:text-2xl font-semibold text-gray-900">
                  {(statistics.successfulPayments || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl shadow-sm p-3 md:p-6 border border-gray-100 hover:border-primary/20 transition-all duration-200"
          >
            <div className="flex items-center space-x-3 md:space-x-4">
              <div className="p-2 md:p-3 bg-blue-50 rounded-xl flex-shrink-0">
                <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-500">Total Payments</p>
                <p className="text-lg md:text-2xl font-semibold text-gray-900">
                  {(statistics.totalPayments || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 md:p-6 border-b border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all duration-200"
                />
              </div>
            </div>
            {/* ✅ UPDATED: Added currency filter and changed grid to accommodate 3 filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <CustomSelect
                value={statusFilter}
                onChange={setStatusFilter}
                options={statusOptions}
                placeholder="Filter by status"
                className="w-full"
              />
              <CustomSelect
                value={gatewayFilter}
                onChange={setGatewayFilter}
                options={gatewayOptions}
                placeholder="Filter by gateway"
                className="w-full"
              />
              <CustomSelect
                value={currencyFilter}
                onChange={setCurrencyFilter}
                options={currencyOptions}
                placeholder="Filter by currency"
                className="w-full"
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
            <table className="w-full min-w-[1400px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                  <th className="text-left px-4 py-3">
                    <button 
                      onClick={() => handleSort('created_at')}
                      className={getSortButtonClasses('created_at')}
                    >
                      <Calendar className="h-3 w-3" />
                      <span>Date</span>
                      {getSortIcon('created_at')}
                    </button>
                  </th>
                  <th className="text-left px-4 py-3">
                    <div className="flex items-center space-x-1 text-xs font-semibold text-gray-600">
                      <Receipt className="h-3 w-3" />
                      <span>Payment ID</span>
                    </div>
                  </th>
                  <th className="text-left px-4 py-3">
                    <div className="flex items-center space-x-1 text-xs font-semibold text-gray-600">
                      <Wallet className="h-3 w-3" />
                      <span>Gateway</span>
                    </div>
                  </th>
                  <th className="text-left px-4 py-3">
                    <button 
                      onClick={() => handleSort('amount')}
                      className={getSortButtonClasses('amount')}
                    >
                      <DollarSign className="h-3 w-3" />
                      <span>Amount</span>
                      {getSortIcon('amount')}
                    </button>
                  </th>
                  <th className="text-left px-4 py-3">
                    <div className="flex items-center space-x-1 text-xs font-semibold text-gray-600">
                      <Globe className="h-3 w-3" />
                      <span>Currency</span>
                    </div>
                  </th>
                  <th className="text-left px-4 py-3">
                    <div className="flex items-center space-x-1 text-xs font-semibold text-gray-600">
                      <User className="h-3 w-3" />
                      <span>Customer</span>
                    </div>
                  </th>
                  <th className="text-left px-4 py-3">
                    <div className="flex items-center space-x-1 text-xs font-semibold text-gray-600">
                      <CreditCard className="h-3 w-3" />
                      <span>Payment Method</span>
                    </div>
                  </th>
                  <th className="text-left px-4 py-3">
                    <div className="flex items-center space-x-1 text-xs font-semibold text-gray-600">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Status</span>
                    </div>
                  </th>
                  <th className="text-right px-4 py-3">
                    <span className="text-xs font-semibold text-gray-600">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filteredPayments.map((payment: ShopPayment, index: number) => (
                  <motion.tr 
                    key={payment.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.01 }}
                    className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50/40 hover:to-indigo-50/40 transition-all duration-200 group"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 bg-blue-100 rounded-md group-hover:bg-blue-200 transition-colors duration-200">
                          <Calendar className="h-3 w-3 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-900">
                            {format(new Date(payment.created_at), 'dd.MM.yy')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {format(new Date(payment.created_at), 'HH:mm')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 bg-gray-100 rounded-md group-hover:bg-gray-200 transition-colors duration-200">
                          <Receipt className="h-3 w-3 text-gray-600" />
                        </div>
                        <span className="text-xs font-mono font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded border">
                          {payment.id.slice(0, 8)}...
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 bg-purple-100 rounded-md group-hover:bg-purple-200 transition-colors duration-200">
                          <Wallet className="h-3 w-3 text-purple-600" />
                        </div>
                        <span className="text-xs font-medium text-gray-900 bg-purple-100 px-2 py-1 rounded border border-purple-200">
                          {getGatewayDisplayName(payment.gateway)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 bg-emerald-100 rounded-md group-hover:bg-emerald-200 transition-colors duration-200">
                          <DollarSign className="h-3 w-3 text-emerald-600" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-gray-900">
                            {payment.amount.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 bg-indigo-100 rounded-md group-hover:bg-indigo-200 transition-colors duration-200">
                          <Globe className="h-3 w-3 text-indigo-600" />
                        </div>
                        <span className="text-xs font-medium text-gray-900 bg-indigo-100 px-2 py-1 rounded border border-indigo-200">
                          {payment.currency}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 bg-blue-100 rounded-md group-hover:bg-blue-200 transition-colors duration-200">
                          <User className="h-3 w-3 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-gray-900 truncate">
                            {payment.customer_name || 'Anonymous'}
                          </div>
                          {payment.customer_email && (
                            <div className="text-xs text-gray-500 truncate max-w-[100px]">
                              {payment.customer_email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        {/* Payment Method Display */}
                        {payment.gateway === '0001' ? (
                          // Plisio - Crypto
                          <>
                            <div className="p-1.5 bg-orange-100 rounded-md group-hover:bg-orange-200 transition-colors duration-200">
                              <Bitcoin className="h-3 w-3 text-orange-600" />
                            </div>
                            <span className="text-xs font-medium text-gray-900 bg-orange-100 px-2 py-1 rounded border border-orange-200">
                              Crypto
                            </span>
                          </>
                        ) : (payment as any).remitter_iban ? (
                          // Bank Transfer - IBAN
                          <>
                            <div className="p-1.5 bg-blue-100 rounded-md group-hover:bg-blue-200 transition-colors duration-200">
                              <Building2 className="h-3 w-3 text-blue-600" />
                            </div>
                            <span className="text-xs font-medium text-gray-900 bg-blue-100 px-2 py-1 rounded border border-blue-200">
                              {(payment as any).remitter_iban.length > 8 
                                ? `${(payment as any).remitter_iban.slice(0, 8)}...` 
                                : (payment as any).remitter_iban
                              }
                            </span>
                          </>
                        ) : (payment as any).card_last4 ? (
                          // Card Payment - Last 4 digits
                          <>
                            <div className="p-1.5 bg-green-100 rounded-md group-hover:bg-green-200 transition-colors duration-200">
                              <CreditCard className="h-3 w-3 text-green-600" />
                            </div>
                            <span className="text-xs font-medium text-gray-900 bg-green-100 px-2 py-1 rounded border border-green-200">
                              ****{(payment as any).card_last4}
                            </span>
                          </>
                        ) : (
                          // Default - Payment Method or N/A
                          <>
                            <div className="p-1.5 bg-gray-100 rounded-md group-hover:bg-gray-200 transition-colors duration-200">
                              <CreditCard className="h-3 w-3 text-gray-600" />
                            </div>
                            <span className="text-xs font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                              {(payment as any).payment_method || 'N/A'}
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-start">
                        {payment.status.toUpperCase() === 'PAID' && (
                          <div className="flex items-center space-x-1 text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full text-xs font-medium">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Paid</span>
                          </div>
                        )}
                        {payment.status.toUpperCase() === 'PENDING' && (
                          <div className="flex items-center space-x-1 text-amber-700 bg-amber-100 px-2 py-1 rounded-full text-xs font-medium">
                            <Clock className="h-3 w-3" />
                            <span>Pending</span>
                          </div>
                        )}
                        {payment.status.toUpperCase() === 'PROCESSING' && (
                          <div className="flex items-center space-x-1 text-blue-700 bg-blue-100 px-2 py-1 rounded-full text-xs font-medium">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Processing</span>
                          </div>
                        )}
                        {payment.status.toUpperCase() === 'FAILED' && (
                          <div className="flex items-center space-x-1 text-red-700 bg-red-100 px-2 py-1 rounded-full text-xs font-medium">
                            <AlertCircle className="h-3 w-3" />
                            <span>Failed</span>
                          </div>
                        )}
                        {payment.status.toUpperCase() === 'EXPIRED' && (
                          <div className="flex items-center space-x-1 text-gray-700 bg-gray-100 px-2 py-1 rounded-full text-xs font-medium">
                            <XCircle className="h-3 w-3" />
                            <span>Expired</span>
                          </div>
                        )}
                        {payment.status.toUpperCase() === 'REFUND' && (
                          <div className="flex items-center space-x-1 text-orange-700 bg-orange-100 px-2 py-1 rounded-full text-xs font-medium">
                            <RotateCcw className="h-3 w-3" />
                            <span>Refunded</span>
                          </div>
                        )}
                        {payment.status.toUpperCase() === 'CHARGEBACK' && (
                          <div className="flex items-center space-x-1 text-red-800 bg-red-200 px-2 py-1 rounded-full text-xs font-medium">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Chargeback</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedPayment(payment)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-gradient-to-r hover:from-blue-500 hover:to-indigo-600 rounded-lg transition-all duration-200 border border-gray-200 hover:border-blue-300"
                        >
                          <Eye className="h-4 w-4" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {(paymentsData as any)?.pagination && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {(((paymentsData as any).pagination.page - 1) * (paymentsData as any).pagination.limit) + 1} to{' '}
              {Math.min((paymentsData as any).pagination.page * (paymentsData as any).pagination.limit, (paymentsData as any).pagination.total)} of{' '}
              {(paymentsData as any).pagination.total} results
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
                Page {(paymentsData as any).pagination.page} of {(paymentsData as any).pagination.totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min((paymentsData as any).pagination.totalPages, currentPage + 1))}
                disabled={currentPage === (paymentsData as any).pagination.totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedPayment && (
          <PaymentDetailsModal
            payment={selectedPayment}
            onClose={() => setSelectedPayment(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Transactions;