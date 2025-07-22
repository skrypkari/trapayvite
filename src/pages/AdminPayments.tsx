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
  const renderField = (label: string, value: any, copyable = false, copyId?: string, icon?: React.ReactNode) => {
    if (value === null || value === undefined || value === '') return null;
    
    return (
      <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-sm transition-all duration-200">
        <div className="flex items-center space-x-2 mb-2">
          {icon && <div className="text-gray-500">{icon}</div>}
          <div className="text-sm font-medium text-gray-700">{label}</div>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-900 break-all mr-2 font-mono">
            {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
          </div>
          {copyable && copyId && (
            <button
              onClick={() => handleCopy(value.toString(), copyId)}
              className="p-1.5 text-gray-400 hover:text-primary hover:bg-white rounded-lg transition-colors flex-shrink-0 shadow-sm"
            >
              {showCopied === copyId ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </div>
    );
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto"
      >
        <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Payment Details</h3>
                <p className="text-sm text-gray-500 font-mono">{payment.id}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="p-2 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Edit3 className="h-5 w-5" />
              </button>
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
          {/* Show failure message if payment failed */}
          {payment.status === 'FAILED' && payment.failureMessage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl"
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-red-900">Failure Reason</h4>
                  <p className="mt-1 text-sm text-red-700">{payment.failureMessage}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Show transaction URLs if available */}
          {payment.txUrls && Array.isArray(payment.txUrls) && payment.txUrls.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl"
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <ExternalLink className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Transaction URLs</h4>
                  <div className="space-y-2">
                    {payment.txUrls.map((url: string, index: number) => (
                      <div key={index} className="flex items-center justify-between bg-white rounded-lg p-2">
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-700 hover:text-blue-800 break-all mr-2 underline"
                        >
                          {url}
                        </a>
                        <button
                          onClick={() => handleCopy(url, `tx-url-${index}`)}
                          className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors flex-shrink-0"
                        >
                          {showCopied === `tx-url-${index}` ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Status Edit Section */}
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl"
            >
              <h4 className="text-lg font-semibold text-yellow-900 mb-4">Edit Payment Status</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <CustomSelect
                    value={editData.status}
                    onChange={(value) => setEditData({ ...editData, status: value as any })}
                    options={[
                      { value: 'PENDING', label: 'Pending' },
                      { value: 'PROCESSING', label: 'Processing' },
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chargeback Amount</label>
                    <input
                      type="number"
                      value={editData.chargebackAmount || 0}
                      onChange={(e) => setEditData({ ...editData, chargebackAmount: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                )}
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={editData.notes || ''}
                  onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  rows={3}
                  placeholder="Add notes..."
                />
              </div>
              <div className="mt-4 flex justify-end space-x-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveStatus}
                  className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* Payment Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Basic Information */}
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <div className="flex items-center space-x-2 mb-2">
                <Receipt className="h-4 w-4 text-blue-600" />
                <div className="text-sm font-medium text-blue-700">Payment ID</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-blue-900 font-mono break-all mr-2">{payment.id}</div>
                <button
                  onClick={() => handleCopy(payment.id, 'payment-id')}
                  className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-white rounded-lg transition-colors flex-shrink-0"
                >
                  {showCopied === 'payment-id' ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* ✅ FIXED: Use shop object structure */}
            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
              <div className="flex items-center space-x-2 mb-2">
                <Building2 className="h-4 w-4 text-purple-600" />
                <div className="text-sm font-medium text-purple-700">Shop</div>
              </div>
              <div className="text-sm text-purple-900">
                <div className="font-medium">{payment.shopName}</div>
                <div className="text-purple-700">@{payment.shopUsername}</div>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
              <div className="flex items-center space-x-2 mb-2">
                <Wallet className="h-4 w-4 text-green-600" />
                <div className="text-sm font-medium text-green-700">Gateway</div>
              </div>
              <div className="text-sm text-green-900 font-medium">
                {gatewayDisplayName}
              </div>
            </div>

            {/* Amount and Currency */}
            <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                <div className="text-sm font-medium text-emerald-700">Amount</div>
              </div>
              <div className="text-lg font-bold text-emerald-900">
                {payment.amount.toFixed(2)}
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl border border-teal-200">
              <div className="flex items-center space-x-2 mb-2">
                <Globe className="h-4 w-4 text-teal-600" />
                <div className="text-sm font-medium text-teal-700">Currency</div>
              </div>
              <div className="text-sm text-teal-900 font-medium">
                {payment.currency}
              </div>
            </div>

            {/* Status */}
            <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
              <div className="text-sm font-medium text-gray-700 mb-2">Status</div>
              <div className="mt-1">
                {payment.status === 'PAID' && (
                  <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-3 py-1 rounded-lg w-fit">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-medium">Paid</span>
                  </div>
                )}
                {payment.status === 'PENDING' && (
                  <div className="flex items-center space-x-2 text-yellow-600 bg-yellow-50 px-3 py-1 rounded-lg w-fit">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">Pending</span>
                  </div>
                )}
                {payment.status === 'PROCESSING' && (
                  <div className="flex items-center space-x-2 text-blue-600 bg-blue-50 px-3 py-1 rounded-lg w-fit">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm font-medium">Processing</span>
                  </div>
                )}
                {payment.status === 'FAILED' && (
                  <div className="flex items-center space-x-2 text-red-600 bg-red-50 px-3 py-1 rounded-lg w-fit">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Failed</span>
                  </div>
                )}
                {payment.status === 'EXPIRED' && (
                  <div className="flex items-center space-x-2 text-gray-600 bg-gray-50 px-3 py-1 rounded-lg w-fit">
                    <XCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Expired</span>
                  </div>
                )}
                {payment.status === 'CHARGEBACK' && (
                  <div className="flex items-center space-x-2 text-purple-600 bg-purple-50 px-3 py-1 rounded-lg w-fit">
                    <RotateCcw className="h-4 w-4" />
                    <span className="text-sm font-medium">Chargeback</span>
                  </div>
                )}
                {payment.status === 'REFUND' && (
                  <div className="flex items-center space-x-2 text-blue-600 bg-blue-50 px-3 py-1 rounded-lg w-fit">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">Refund</span>
                  </div>
                )}
              </div>
            </div>

            {/* Timestamps */}
            {renderField('Created At', format(new Date(payment.createdAt), 'PPpp'), false, '', <Calendar className="h-4 w-4" />)}
            {renderField('Updated At', format(new Date(payment.updatedAt), 'PPpp'), false, '', <Calendar className="h-4 w-4" />)}

            {/* Order Information */}
            {renderField('Order ID', payment.orderId, true, 'order-id', <Receipt className="h-4 w-4" />)}
            {renderField('Gateway Order ID', payment.gatewayOrderId, true, 'gateway-order-id', <Receipt className="h-4 w-4" />)}
            {renderField('Gateway Payment ID', payment.gatewayPaymentId, true, 'gateway-payment-id', <CreditCard className="h-4 w-4" />)}

            {/* Customer Information */}
            {renderField('Customer Name', payment.customerName, false, '', <User className="h-4 w-4" />)}
            {renderField('Customer Email', payment.customerEmail, true, 'customer-email', <User className="h-4 w-4" />)}
            
            {/* Customer location and device info with icons */}
            {renderField('Customer Country', payment.customerCountry, false, '', <MapPin className="h-4 w-4" />)}
            {renderField('Customer IP', payment.customerIp, true, 'customer-ip', <Globe className="h-4 w-4" />)}
            {renderField('Customer User Agent', payment.customerUa, true, 'customer-ua', <Monitor className="h-4 w-4" />)}
            
            {/* Payment Details */}
            {renderField('Payment Method', payment.paymentMethod, false, '', <CreditCard className="h-4 w-4" />)}
            {renderField('Card Last 4', payment.cardLast4, false, '', <CreditCard className="h-4 w-4" />)}
            {renderField('Bank ID', payment.bankId, false, '', <Building2 className="h-4 w-4" />)}
            {renderField('Remitter IBAN', payment.remitterIban, true, 'remitter-iban', <Building2 className="h-4 w-4" />)}
            {renderField('Remitter Name', payment.remitterName, false, '', <User className="h-4 w-4" />)}

            {/* Show chargeback amount if status is CHARGEBACK */}
            {payment.status === 'CHARGEBACK' && payment.chargebackAmount && (
              <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                <div className="flex items-center space-x-2 mb-2">
                  <RotateCcw className="h-4 w-4 text-purple-600" />
                  <div className="text-sm font-medium text-purple-700">Chargeback Amount</div>
                </div>
                <div className="text-lg font-bold text-purple-900">
                  {payment.chargebackAmount.toFixed(2)} USDT
                </div>
              </div>
            )}

            {/* Expiry information */}
            {payment.expiresAt && renderField('Expires At', format(new Date(payment.expiresAt), 'PPpp'), false, '', <Clock className="h-4 w-4" />)}
          </div>

          {/* Notes Section */}
          {payment.notes && (
            <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="h-4 w-4 text-gray-600" />
                <div className="text-sm font-medium text-gray-700">Notes</div>
              </div>
              <div className="text-sm text-gray-900">{payment.notes}</div>
            </div>
          )}

          {/* External Payment URL */}
          {payment.externalPaymentUrl && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <div className="flex items-center space-x-2 mb-2">
                <ExternalLink className="h-4 w-4 text-blue-600" />
                <div className="text-sm font-medium text-blue-700">External Payment URL</div>
              </div>
              <div className="flex items-center justify-between">
                <a
                  href={payment.externalPaymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-700 hover:text-blue-800 break-all mr-2 underline"
                >
                  {payment.externalPaymentUrl}
                </a>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <button
                    onClick={() => handleCopy(payment.externalPaymentUrl!, 'external-payment-url')}
                    className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-white rounded-lg transition-colors"
                  >
                    {showCopied === 'external-payment-url' ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                  <a
                    href={payment.externalPaymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-white rounded-lg transition-colors"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          )}
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

  const { usePayments, useUpdatePaymentStatus, useMerchantSelection } = useAdmin();
  const updatePaymentStatusMutation = useUpdatePaymentStatus();
  const { data: merchants, isLoading: merchantsLoading } = useMerchantSelection();

  // Build filters for API
  const filters: AdminPaymentFilters = useMemo(() => {
    const apiFilters: AdminPaymentFilters = {
      page: currentPage,
      limit: pageSize,
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

  const { data: paymentsData, isLoading, error } = usePayments(filters);

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
          icon: <Building2 className="h-4 w-4 text-gray-500" />
        });
      });
    }
    

  const handleUpdatePaymentStatus = async (id: string, data: UpdatePaymentStatusData) => {
    try {
      await updatePaymentStatusMutation.mutateAsync({ id, data });
      toast.success('Payment status updated successfully');
      setSelectedPayment(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update payment status');
    }
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
                  value={merchantFilter}
                  onChange={setMerchantFilter}
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
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-6 py-4">
                    <button className="flex items-center space-x-2 text-sm font-medium text-gray-500 hover:text-gray-700">
                      <span>Date</span>
                      <ArrowUpDown className="h-4 w-4" />
                    </button>
                  </th>
                  <th className="text-left px-6 py-4">
                    <span className="text-sm font-medium text-gray-500">Payment ID</span>
                  </th>
                  <th className="text-left px-6 py-4">
                    <span className="text-sm font-medium text-gray-500">Merchant</span>
                  </th>
                  <th className="text-left px-6 py-4">
                    <span className="text-sm font-medium text-gray-500">Gateway</span>
                  </th>
                  <th className="text-left px-6 py-4">
                    <button className="flex items-center space-x-2 text-sm font-medium text-gray-500 hover:text-gray-700">
                      <span>Amount</span>
                      <ArrowUpDown className="h-4 w-4" />
                    </button>
                  </th>
                  <th className="text-left px-6 py-4">
                    <span className="text-sm font-medium text-gray-500">Currency</span>
                  </th>
                  <th className="text-left px-6 py-4">
                    <span className="text-sm font-medium text-gray-500">Status</span>
                  </th>
                  <th className="text-right px-6 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {paymentsData?.payments.map((payment, index) => (
                  <motion.tr 
                    key={payment.id} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 transition-all duration-200"
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">
                        {format(new Date(payment.createdAt), 'MMM d, yyyy')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                        {payment.id.slice(0, 8)}...
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{payment.shopName}</div>
                        <div className="text-xs text-gray-500">@{payment.shopUsername}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900 bg-blue-100 px-2 py-1 rounded">
                        {payment.gateway}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-gray-900">
                        {payment.amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {payment.currency}
                      </span>
                    </td>
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
                        </div>
                      )}
                      {payment.status === 'PENDING' && (
                        <div className="flex items-center space-x-2 text-yellow-600 bg-yellow-50 px-3 py-1 rounded-lg w-fit">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm font-medium">Pending</span>
                        </div>
                      )}
                      {payment.status === 'PROCESSING' && (
                        <div className="flex items-center space-x-2 text-blue-600 bg-blue-50 px-3 py-1 rounded-lg w-fit">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm font-medium">Processing</span>
                        </div>
                      )}
                      {payment.status === 'FAILED' && (
                        <div className="flex items-center space-x-2 text-red-600 bg-red-50 px-3 py-1 rounded-lg w-fit">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Failed</span>
                        </div>
                      )}
                      {payment.status === 'EXPIRED' && (
                        <div className="flex items-center space-x-2 text-gray-600 bg-gray-50 px-3 py-1 rounded-lg w-fit">
                          <XCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Expired</span>
                        </div>
                      )}
                      {payment.status === 'CHARGEBACK' && (
                        <div className="flex items-center space-x-2 text-purple-600 bg-purple-50 px-3 py-1 rounded-lg w-fit">
                          <RotateCcw className="h-4 w-4" />
                          <span className="text-sm font-medium">Chargeback</span>
                        </div>
                      )}
                      {payment.status === 'REFUND' && (
                        <div className="flex items-center space-x-2 text-blue-600 bg-blue-50 px-3 py-1 rounded-lg w-fit">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-sm font-medium">Refund</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setSelectedPayment(payment)}
                          className="p-2 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg transition-all duration-200"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
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
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50 rounded-b-2xl">
            <div className="text-sm text-gray-500">
              Showing {((paymentsData.pagination.page - 1) * paymentsData.pagination.limit) + 1} to{' '}
              {Math.min(paymentsData.pagination.page * paymentsData.pagination.limit, paymentsData.pagination.total)} of{' '}
              {paymentsData.pagination.total} results
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