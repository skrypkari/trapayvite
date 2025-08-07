import React, { useState, useMemo } from 'react';
import {
  Search,
  Calendar,
  Filter,
  ArrowUpDown,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  ChevronDown,
  Download,
  FileText,
  Share2,
  Printer,
  Wallet,
  CreditCard,
  Receipt,
  AlertCircle,
  Copy,
  DollarSign,
  TrendingUp,
  ArrowRight,
  MoreHorizontal,
  Globe,
  Building2,
  Bitcoin,
  Check,
  X,
  RotateCcw,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Edit3,
  Save,
  User,
  MapPin,
  Monitor,
  Smartphone
} from 'lucide-react';
import { format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import CustomSelect from '../components/CustomSelect';
import DatePicker from '../components/DatePicker';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  useAdmin, 
  type AdminPayment,
  type AdminPaymentFilters,
  type UpdatePaymentStatusData 
} from '../hooks/useAdmin';
import { getGatewayDisplayName } from '../utils/gatewayMapping';

const PaymentDetailsModal: React.FC<{
  payment: AdminPayment;
  onClose: () => void;
  onUpdateStatus: (id: string, data: UpdatePaymentStatusData) => void;
}> = ({ payment, onClose, onUpdateStatus }) => {
  const [showCopied, setShowCopied] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<UpdatePaymentStatusData>({
    status: payment.status,
    notes: payment.notes || '',
    chargebackAmount: payment.chargebackAmount || 0
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setShowCopied(id);
    setTimeout(() => setShowCopied(null), 2000);
  };

  const handleSaveStatus = () => {
    onUpdateStatus(payment.id, editData);
    setIsEditing(false);
  };

  const gatewayDisplayName = payment.gateway;

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
      CHARGEBACK: { 
        color: 'purple', 
        icon: <RotateCcw className="h-5 w-5" />, 
        bg: 'from-purple-500 to-violet-600',
        text: 'Chargeback Issued'
      },
      REFUND: { 
        color: 'indigo', 
        icon: <AlertTriangle className="h-5 w-5" />, 
        bg: 'from-indigo-500 to-blue-600',
        text: 'Refund Processed'
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
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
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
                  onClick={() => setIsEditing(!isEditing)}
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
              {getStatusBadge(payment.status)}
            </motion.div>

            {/* Failure Message Alert */}
            {payment.status === 'FAILED' && payment.failureMessage && (
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
                    <p className="text-red-700 leading-relaxed">{payment.failureMessage}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Transaction URLs */}
            {payment.txUrls && Array.isArray(payment.txUrls) && payment.txUrls.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="relative p-6 bg-gradient-to-r from-blue-50 via-blue-100 to-indigo-50 border border-blue-200 rounded-2xl shadow-lg"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-t-2xl"></div>
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-blue-500 rounded-xl text-white">
                    <ExternalLink className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-blue-900 mb-4">Transaction URLs</h4>
                    <div className="space-y-3">
                      {payment.txUrls.map((url: string, index: number) => (
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

            {/* Status Edit Section */}
            <AnimatePresence>
              {isEditing && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="relative p-6 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 border border-amber-200 rounded-2xl shadow-lg overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-t-2xl"></div>
                  <h4 className="text-xl font-bold text-amber-900 mb-6 flex items-center">
                    <Edit3 className="h-6 w-6 mr-3" />
                    Edit Payment Status
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                      <CustomSelect
                        value={editData.status}
                        onChange={(value) => setEditData({ ...editData, status: value as any })}
                        options={[
                          { value: 'PENDING', label: 'Pending' },
                          { value: 'PAID', label: 'Paid' },
                          { value: 'FAILED', label: 'Failed' },
                          { value: 'EXPIRED', label: 'Expired' },
                          { value: 'CHARGEBACK', label: 'Chargeback' },
                          { value: 'REFUND', label: 'Refund' }
                        ]}
                        placeholder="Select status"
                      />
                    </div>
                    {editData.status === 'CHARGEBACK' && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Chargeback Amount</label>
                        <input
                          type="number"
                          value={editData.chargebackAmount || 0}
                          onChange={(e) => setEditData({ ...editData, chargebackAmount: parseFloat(e.target.value) })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                        />
                      </motion.div>
                    )}
                  </div>
                  <div className="mt-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                    <textarea
                      value={editData.notes || ''}
                      onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                      rows={4}
                      placeholder="Add notes about this payment status change..."
                    />
                  </div>
                  <div className="mt-6 flex justify-end space-x-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium rounded-xl hover:bg-gray-100 transition-all duration-200"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSaveStatus}
                      className="px-6 py-3 bg-gradient-to-r from-primary to-primary-dark text-white font-semibold rounded-xl hover:shadow-lg flex items-center space-x-2 transition-all duration-200"
                    >
                      <Save className="h-5 w-5" />
                      <span>Save Changes</span>
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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
                'Shop', 
                `${payment.shop.name} (@${payment.shop.username})`, 
                false, 
                '', 
                <Building2 className="h-5 w-5" />
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

              {renderField('Created At', format(new Date(payment.createdAt), 'dd.MM.yy HH:mm'), false, '', <Calendar className="h-4 w-4" />)}
              {renderField('Updated At', format(new Date(payment.updatedAt), 'dd.MM.yy HH:mm'), false, '', <Calendar className="h-4 w-4" />)}

              {/* Order Information */}
              {renderField('Order ID', payment.orderId, true, 'order-id', <Receipt className="h-4 w-4" />)}
              {renderField('Gateway Order ID', payment.gatewayOrderId, true, 'gateway-order-id', <Receipt className="h-4 w-4" />)}
              {renderField('Gateway Payment ID', payment.gatewayPaymentId, true, 'gateway-payment-id', <CreditCard className="h-4 w-4" />)}

              {/* Customer Information */}
              {renderField('Customer Name', payment.customerName, false, '', <User className="h-4 w-4" />)}
              {renderField('Customer Email', payment.customerEmail, true, 'customer-email', <User className="h-4 w-4" />)}
              {renderField('Customer Country', payment.customerCountry, false, '', <MapPin className="h-4 w-4" />)}
              {renderField('Customer IP', payment.customerIp, true, 'customer-ip', <Globe className="h-4 w-4" />)}
              {renderField('User Agent', (payment as any).customerUa, true, 'customer-ua', <Monitor className="h-4 w-4" />)}

              {/* Payment Details */}
              {renderField('Payment Method', payment.paymentMethod, false, '', <CreditCard className="h-4 w-4" />)}
              {renderField('Card Last 4', payment.cardLast4, false, '', <CreditCard className="h-4 w-4" />)}
              {renderField('Bank ID', payment.bankId, false, '', <Building2 className="h-4 w-4" />)}
              {renderField('Remitter IBAN', payment.remitterIban, true, 'remitter-iban', <Building2 className="h-4 w-4" />)}
              {renderField('Remitter Name', payment.remitterName, false, '', <User className="h-4 w-4" />)}

              {/* Chargeback amount with special styling */}
              {payment.status === 'CHARGEBACK' && payment.chargebackAmount && 
                renderField(
                  'Chargeback Amount', 
                  `${payment.chargebackAmount.toFixed(2)} USDT`, 
                  false, 
                  '', 
                  <RotateCcw className="h-5 w-5" />,
                  'border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50'
                )
              }

              {payment.expiresAt && renderField('Expires At', format(new Date(payment.expiresAt), 'dd.MM.yy HH:mm'), false, '', <Clock className="h-4 w-4" />)}
            </div>

            {/* Notes Section with enhanced styling */}
            {payment.notes && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 rounded-2xl border border-gray-200 shadow-lg"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-gray-500 rounded-xl text-white">
                    <FileText className="h-5 w-5" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-800">Notes</h4>
                </div>
                <div className="text-gray-700 leading-relaxed bg-white p-4 rounded-xl border border-gray-200">
                  {payment.notes}
                </div>
              </motion.div>
            )}

            {/* External Payment URL with enhanced styling */}
            {payment.externalPaymentUrl && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative p-6 bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50 border border-indigo-200 rounded-2xl shadow-lg"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-t-2xl"></div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-3 bg-indigo-500 rounded-xl text-white">
                    <ExternalLink className="h-6 w-6" />
                  </div>
                  <h4 className="text-lg font-bold text-indigo-900">External Payment URL</h4>
                </div>
                <div className="flex items-center justify-between bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-indigo-200">
                  <a
                    href={payment.externalPaymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-700 hover:text-indigo-800 break-all mr-3 underline font-medium"
                  >
                    {payment.externalPaymentUrl}
                  </a>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleCopy(payment.externalPaymentUrl!, 'external-payment-url')}
                      className="p-2 text-indigo-500 hover:text-indigo-700 hover:bg-white rounded-lg transition-all duration-200"
                    >
                      {showCopied === 'external-payment-url' ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : (
                        <Copy className="h-5 w-5" />
                      )}
                    </motion.button>
                    <motion.a
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      href={payment.externalPaymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-indigo-500 hover:text-indigo-700 hover:bg-white rounded-lg transition-all duration-200"
                    >
                      <ArrowUpRight className="h-5 w-5" />
                    </motion.a>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const AdminPayments: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [gatewayFilter, setGatewayFilter] = useState<string>('all');
  const [currencyFilter, setCurrencyFilter] = useState<string>('all');
  const [shopIdFilter, setShopIdFilter] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<AdminPayment | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [sortBy, setSortBy] = useState<'createdAt' | 'amount'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { usePayments, useUpdatePaymentStatus, useMerchantSelection } = useAdmin();
  const updatePaymentStatusMutation = useUpdatePaymentStatus();
  const { data: merchants, isLoading: merchantsLoading } = useMerchantSelection();

  // Build filters for API
  const filters: AdminPaymentFilters = useMemo(() => {
    const apiFilters: AdminPaymentFilters = {
      page: currentPage,
      limit: pageSize,
      sortBy,
      sortOrder,
    };

    if (statusFilter !== 'all') {
      apiFilters.status = statusFilter as any;
    }

    if (gatewayFilter !== 'all') {
      apiFilters.gateway = gatewayFilter;
    }

    if (currencyFilter !== 'all') {
      apiFilters.currency = currencyFilter;
    }

    if (shopIdFilter !== 'all') {
      apiFilters.shopId = shopIdFilter;
    }

    if (searchTerm.trim()) {
      apiFilters.search = searchTerm.trim();
    }

    return apiFilters;
<<<<<<< HEAD
  }, [currentPage, pageSize, statusFilter, gatewayFilter, currencyFilter, shopIdFilter, searchTerm, sortBy, sortOrder]);
=======
  }, [currentPage, pageSize, statusFilter, gatewayFilter, currencyFilter, shopIdFilter, searchTerm]);
>>>>>>> acb795541e4383b6cddf229106ed8cfe8f7fe284

  const { data: paymentsData, isLoading, error } = usePayments(filters);

  // Debug: log filters when they change
  React.useEffect(() => {
    console.log('🔍 AdminPayments filters:', filters);
  }, [filters]);

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'PENDING', label: 'Pending', icon: <Clock className="h-4 w-4 text-yellow-600" /> },
    { value: 'PROCESSING', label: 'Processing', icon: <Loader2 className="h-4 w-4 text-blue-600" /> },
    { value: 'PAID', label: 'Paid', icon: <CheckCircle2 className="h-4 w-4 text-green-600" /> },
    { value: 'FAILED', label: 'Failed', icon: <AlertCircle className="h-4 w-4 text-red-600" /> },
    { value: 'EXPIRED', label: 'Expired', icon: <XCircle className="h-4 w-4 text-gray-600" /> },
    { value: 'CHARGEBACK', label: 'Chargeback', icon: <RotateCcw className="h-4 w-4 text-purple-600" /> },
    { value: 'REFUND', label: 'Refund', icon: <AlertTriangle className="h-4 w-4 text-blue-600" /> },
  ];

  const gatewayOptions = [
    { value: 'all', label: 'All Gateways' },
    { value: '0001', label: 'Plisio' },
    { value: '0010', label: 'Rapyd' },
    { value: '0100', label: 'CoinToPay' },
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

  // ✅ UPDATED: Use merchant selection API instead of extracting from payments
  const merchantOptions = useMemo(() => {
    const options = [{ value: 'all', label: 'All Merchants' }];
    
    if (merchants) {
      merchants.forEach(merchant => {
        options.push({
          value: merchant.id,
          label: merchant.username, // ✅ Show only username as requested
<<<<<<< HEAD
=======
          icon: <Building2 className="h-4 w-4 text-gray-500" />
>>>>>>> acb795541e4383b6cddf229106ed8cfe8f7fe284
        });
      });
    }
    
    return options;
  }, [merchants]);

  const handleUpdatePaymentStatus = async (id: string, data: UpdatePaymentStatusData) => {
    try {
      await updatePaymentStatusMutation.mutateAsync({ id, data });
      toast.success('Payment status updated successfully');
      setSelectedPayment(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update payment status');
    }
  };

  const handleSort = (field: 'createdAt' | 'amount') => {
    if (sortBy === field) {
      // Toggle sort order if same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with default order
      setSortBy(field);
      setSortOrder(field === 'createdAt' ? 'desc' : 'asc'); // Date: newest first, Amount: lowest first
    }
    // Reset to first page when sorting changes
    setCurrentPage(1);
  };

  const getSortIcon = (field: 'createdAt' | 'amount') => {
    if (sortBy !== field) {
      return <ArrowUpDown className="h-3 w-3 opacity-50" />;
    }
    return sortOrder === 'asc' ? 
      <ArrowUpDown className="h-3 w-3 rotate-180" /> : 
      <ArrowUpDown className="h-3 w-3" />;
  };

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-600 mb-2">
          <AlertCircle className="h-8 w-8 mx-auto" />
        </div>
        <p className="text-gray-600">Failed to load admin payments. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Admin Payments</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage all platform payments
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 w-full sm:w-auto justify-center"
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </motion.button>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
        <div className="p-4 md:p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-2xl">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 lg:max-w-xs">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search payments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 shadow-sm"
                  />
                </div>
              </div>

              {/* Filter dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <CustomSelect
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={statusOptions}
                  placeholder="All Status"
                  className="w-full"
                />
                <CustomSelect
                  value={gatewayFilter}
                  onChange={setGatewayFilter}
                  options={gatewayOptions}
                  placeholder="All Gateways"
                  className="w-full"
                />
                <CustomSelect
                  value={currencyFilter}
                  onChange={setCurrencyFilter}
                  options={currencyOptions}
                  placeholder="All Currencies"
                  className="w-full"
                />
                <CustomSelect
                  value={shopIdFilter}
                  onChange={setShopIdFilter}
                  options={merchantOptions}
                  placeholder="All Merchants"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                  <th className="text-left px-4 py-3">
                    <button 
                      onClick={() => handleSort('createdAt')}
                      className="flex items-center space-x-1 text-xs font-semibold text-gray-600 hover:text-gray-800 transition-colors duration-200"
                    >
                      <Calendar className="h-3 w-3" />
                      <span>Date</span>
                      {getSortIcon('createdAt')}
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
                      <Building2 className="h-3 w-3" />
                      <span>Merchant</span>
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
                      className="flex items-center space-x-1 text-xs font-semibold text-gray-600 hover:text-gray-800 transition-colors duration-200"
                    >
                      <DollarSign className="h-3 w-3" />
                      <span>Amount</span>
                      {getSortIcon('amount')}
                    </button>
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
                {paymentsData?.payments.map((payment, index) => (
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
                            {format(new Date(payment.createdAt), 'dd.MM.yy')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {format(new Date(payment.createdAt), 'HH:mm')}
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
                        <div className="p-1.5 bg-green-100 rounded-md group-hover:bg-green-200 transition-colors duration-200">
                          <Building2 className="h-3 w-3 text-green-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-gray-900 truncate">{payment.shop.name}</div>
                          <div className="text-xs text-gray-500 truncate">@{payment.shop.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 bg-purple-100 rounded-md group-hover:bg-purple-200 transition-colors duration-200">
                          <Wallet className="h-3 w-3 text-purple-600" />
                        </div>
                        <span className="text-xs font-medium text-gray-900 bg-purple-100 px-2 py-1 rounded border border-purple-200">
                          {payment.gateway}
                        </span>
                      </div>
                    </td>
<<<<<<< HEAD
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 bg-emerald-100 rounded-md group-hover:bg-emerald-200 transition-colors duration-200">
                          <DollarSign className="h-3 w-3 text-emerald-600" />
=======
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {payment.customerName || '-'}
                      </div>
                      {payment.customerEmail && (
                        <div className="text-xs text-gray-500">{payment.customerEmail}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {payment.status === 'PAID' && (
                        <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-3 py-1 rounded-lg w-fit">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-sm font-medium">Paid</span>
>>>>>>> acb795541e4383b6cddf229106ed8cfe8f7fe284
                        </div>
                        <div>
                          <div className="text-xs font-bold text-gray-900">
                            {payment.amount.toFixed(2)} {payment.currency}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 bg-indigo-100 rounded-md group-hover:bg-indigo-200 transition-colors duration-200">
                          <User className="h-3 w-3 text-indigo-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-gray-900 truncate">
                            {payment.customerName || 'Anonymous'}
                          </div>
                          {payment.customerEmail && (
                            <div className="text-xs text-gray-500 truncate max-w-[100px]">
                              {payment.customerEmail}
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
                        ) : payment.remitterIban ? (
                          // Bank Transfer - IBAN
                          <>
                            <div className="p-1.5 bg-blue-100 rounded-md group-hover:bg-blue-200 transition-colors duration-200">
                              <Building2 className="h-3 w-3 text-blue-600" />
                            </div>
                            <span className="text-xs font-medium text-gray-900 bg-blue-100 px-2 py-1 rounded border border-blue-200">
                              {payment.remitterIban.length > 8 
                                ? `${payment.remitterIban.slice(0, 8)}...` 
                                : payment.remitterIban
                              }
                            </span>
                          </>
                        ) : payment.cardLast4 ? (
                          // Card Payment - Last 4 digits
                          <>
                            <div className="p-1.5 bg-green-100 rounded-md group-hover:bg-green-200 transition-colors duration-200">
                              <CreditCard className="h-3 w-3 text-green-600" />
                            </div>
                            <span className="text-xs font-medium text-gray-900 bg-green-100 px-2 py-1 rounded border border-green-200">
                              ****{payment.cardLast4}
                            </span>
                          </>
                        ) : (
                          // Default - Payment Method
                          <>
                            <div className="p-1.5 bg-gray-100 rounded-md group-hover:bg-gray-200 transition-colors duration-200">
                              <CreditCard className="h-3 w-3 text-gray-600" />
                            </div>
                            <span className="text-xs font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                              {payment.paymentMethod || 'N/A'}
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-start">
                        {payment.status === 'PAID' && (
                          <div className="flex items-center space-x-1 text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full text-xs font-medium">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Paid</span>
                          </div>
                        )}
                        {payment.status === 'PENDING' && (
                          <div className="flex items-center space-x-1 text-amber-700 bg-amber-100 px-2 py-1 rounded-full text-xs font-medium">
                            <Clock className="h-3 w-3" />
                            <span>Pending</span>
                          </div>
                        )}
                        {payment.status === 'PROCESSING' && (
                          <div className="flex items-center space-x-1 text-blue-700 bg-blue-100 px-2 py-1 rounded-full text-xs font-medium">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Processing</span>
                          </div>
                        )}
                        {payment.status === 'FAILED' && (
                          <div className="flex items-center space-x-1 text-red-700 bg-red-100 px-2 py-1 rounded-full text-xs font-medium">
                            <AlertCircle className="h-3 w-3" />
                            <span>Failed</span>
                          </div>
                        )}
                        {payment.status === 'EXPIRED' && (
                          <div className="flex items-center space-x-1 text-gray-700 bg-gray-100 px-2 py-1 rounded-full text-xs font-medium">
                            <XCircle className="h-3 w-3" />
                            <span>Expired</span>
                          </div>
                        )}
                        {payment.status === 'CHARGEBACK' && (
                          <div className="flex items-center space-x-1 text-purple-700 bg-purple-100 px-2 py-1 rounded-full text-xs font-medium">
                            <RotateCcw className="h-3 w-3" />
                            <span>Chargeback</span>
                          </div>
                        )}
                        {payment.status === 'REFUND' && (
                          <div className="flex items-center space-x-1 text-indigo-700 bg-indigo-100 px-2 py-1 rounded-full text-xs font-medium">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Refund</span>
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
        {paymentsData?.pagination && (
          <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50 rounded-b-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="text-sm text-gray-500">
                Showing {((paymentsData.pagination.page - 1) * paymentsData.pagination.limit) + 1} to{' '}
                {Math.min(paymentsData.pagination.page * paymentsData.pagination.limit, paymentsData.pagination.total)} of{' '}
                {paymentsData.pagination.total} results
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                <ArrowUpDown className="h-3 w-3" />
                <span>
                  Sorted by {sortBy === 'createdAt' ? 'Date' : 'Amount'} 
                  ({sortOrder === 'asc' ? 'Ascending' : 'Descending'})
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">
                Page {paymentsData.pagination.page} of {paymentsData.pagination.totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(paymentsData.pagination.totalPages, currentPage + 1))}
                disabled={currentPage === paymentsData.pagination.totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
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
            onUpdateStatus={handleUpdatePaymentStatus}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPayments;