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
  ArrowDownLeft,
  AlertTriangle,
  Download,
  DollarSign,
  Wallet,
  Building2,
  Bitcoin,
  Plus,
  User as UserIcon,
  AlertCircle,
  Copy,
  Check,
  X,
  TrendingUp,
  ArrowUpRight,
  Trash2,
  MoreHorizontal,
  Globe,
  Mail,
  ExternalLink,
  RotateCcw,
  Loader2,
  Edit3
} from 'lucide-react';
import { format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import DatePicker from '../components/DatePicker';
import CustomSelect from '../components/CustomSelect';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  useAdmin, 
  type AdminPayment,
  type AdminPaymentFilters,
  type UpdatePaymentStatusData 
} from '../hooks/useAdmin';

const UpdateStatusModal: React.FC<{
  payment: AdminPayment;
  onClose: () => void;
  onUpdate: (id: string, data: UpdatePaymentStatusData) => void;
}> = ({ payment, onClose, onUpdate }) => {
  const [selectedStatus, setSelectedStatus] = useState<AdminPayment['status']>(payment.status);
  const [notes, setNotes] = useState('');
  const [chargebackAmount, setChargebackAmount] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  const statusOptions = [
    { value: 'PENDING', label: 'Pending', description: 'Payment is awaiting confirmation from the gateway', icon: <Clock className="h-4 w-4 text-yellow-600" /> },
    { value: 'PROCESSING', label: 'Processing', description: 'Payment is currently being processed by the gateway', icon: <Loader2 className="h-4 w-4 text-blue-600" /> },
    { value: 'PAID', label: 'Paid', description: 'Payment successfully confirmed and received', icon: <CheckCircle2 className="h-4 w-4 text-green-600" /> },
    { value: 'EXPIRED', label: 'Expired', description: 'Payment link expired before completion', icon: <XCircle className="h-4 w-4 text-gray-600" /> },
    { value: 'FAILED', label: 'Failed', description: 'Payment declined by the bank or gateway', icon: <AlertTriangle className="h-4 w-4 text-red-600" /> },
    { value: 'REFUND', label: 'Refund', description: 'Full refund issued to the customer', icon: <ArrowDownLeft className="h-4 w-4 text-blue-600" /> },
    { value: 'CHARGEBACK', label: 'Chargeback', description: 'Chargeback initiated by the customer. Penalty applied', icon: <RotateCcw className="h-4 w-4 text-purple-600" /> }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate chargeback amount for CHARGEBACK status
    if (selectedStatus === 'CHARGEBACK') {
      if (!chargebackAmount || parseFloat(chargebackAmount) <= 0) {
        toast.error('Chargeback amount is required and must be greater than 0');
        return;
      }
    }

    setIsUpdating(true);
    
    try {
      const updateData: UpdatePaymentStatusData = {
        status: selectedStatus,
        notes: notes.trim() || undefined
      };

      // Add chargeback amount if status is CHARGEBACK
      if (selectedStatus === 'CHARGEBACK') {
        updateData.chargebackAmount = parseFloat(chargebackAmount);
      }

      await onUpdate(payment.id, updateData);
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update payment status');
    } finally {
      setIsUpdating(false);
    }
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
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Edit3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Update Payment Status</h3>
                <p className="text-sm text-gray-500">Payment ID: {payment.id}</p>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Current Payment Info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Current Status:</span>
                <div className="mt-1">
                  {payment.status === 'PAID' && (
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="font-medium">Paid</span>
                    </div>
                  )}
                  {payment.status === 'PENDING' && (
                    <div className="flex items-center space-x-2 text-yellow-600">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">Pending</span>
                    </div>
                  )}
                  {payment.status === 'PROCESSING' && (
                    <div className="flex items-center space-x-2 text-blue-600">
                      <Loader2 className="h-4 w-4" />
                      <span className="font-medium">Processing</span>
                    </div>
                  )}
                  {payment.status === 'FAILED' && (
                    <div className="flex items-center space-x-2 text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">Failed</span>
                    </div>
                  )}
                  {payment.status === 'EXPIRED' && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <XCircle className="h-4 w-4" />
                      <span className="font-medium">Expired</span>
                    </div>
                  )}
                  {payment.status === 'CHARGEBACK' && (
                    <div className="flex items-center space-x-2 text-purple-600">
                      <RotateCcw className="h-4 w-4" />
                      <span className="font-medium">Chargeback</span>
                    </div>
                  )}
                  {payment.status === 'REFUND' && (
                    <div className="flex items-center space-x-2 text-blue-600">
                      <ArrowDownLeft className="h-4 w-4" />
                      <span className="font-medium">Refund</span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Amount:</span>
                <div className="font-medium text-gray-900">
                  {payment.amount.toLocaleString('en-US', {
                    style: 'currency',
                    currency: payment.currency,
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* New Status Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              New Status *
            </label>
            <div className="space-y-3">
              {statusOptions.map((option) => (
                <div
                  key={option.value}
                  className={`relative flex items-start p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedStatus === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedStatus(option.value as AdminPayment['status'])}
                >
                  <div className="flex items-center h-5">
                    <input
                      type="radio"
                      name="status"
                      value={option.value}
                      checked={selectedStatus === option.value}
                      onChange={() => setSelectedStatus(option.value as AdminPayment['status'])}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                    />
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center space-x-2">
                      {option.icon}
                      <span className="text-sm font-medium text-gray-900">{option.label}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{option.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chargeback Amount (only for CHARGEBACK status) */}
          {selectedStatus === 'CHARGEBACK' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chargeback Amount (USDT) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={chargebackAmount}
                onChange={(e) => setChargebackAmount(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                placeholder="15.50"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter the chargeback penalty amount in USDT. This field is required for chargeback status.
              </p>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              placeholder="Add notes about this status change..."
              rows={3}
            />
          </div>

          {/* Warning for irreversible actions */}
          {(selectedStatus === 'PAID' || selectedStatus === 'CHARGEBACK' || selectedStatus === 'REFUND') && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-900">Important Notice</h4>
                  <p className="mt-1 text-sm text-yellow-700">
                    {selectedStatus === 'PAID' && 'Marking a payment as PAID indicates successful completion and may trigger payout processes.'}
                    {selectedStatus === 'CHARGEBACK' && 'Chargeback status will apply penalty fees and may affect merchant standing.'}
                    {selectedStatus === 'REFUND' && 'Refund status indicates money has been returned to the customer.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800"
              disabled={isUpdating}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating || (selectedStatus === 'CHARGEBACK' && !chargebackAmount)}
              className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isUpdating && <LoadingSpinner size="sm" />}
              <span>{isUpdating ? 'Updating...' : 'Update Status'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

const PaymentDetailsModal: React.FC<{
  payment: AdminPayment;
  onClose: () => void;
  onUpdateStatus: (id: string, data: UpdatePaymentStatusData) => void;
}> = ({ payment, onClose, onUpdateStatus }) => {
  const [showCopied, setShowCopied] = useState<string | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setShowCopied(id);
    setTimeout(() => setShowCopied(null), 2000);
  };

  return (
    <>
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
                  <AlertCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Payment Details</h3>
                  <p className="text-sm text-gray-500">{payment.id}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowUpdateModal(true)}
                  className="px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors flex items-center space-x-2"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>Update Status</span>
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
            {/* ✅ NEW: Show failure message if payment failed */}
            {payment.status === 'FAILED' && payment.failure_message && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-red-900">Failure Reason</h4>
                    <p className="mt-1 text-sm text-red-700">{payment.failure_message}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ✅ NEW: Show transaction URLs if available */}
            {payment.tx_urls && Array.isArray(payment.tx_urls) && payment.tx_urls.length > 0 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <ExternalLink className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Transaction URLs</h4>
                    <div className="space-y-2">
                      {payment.tx_urls.map((url: string, index: number) => (
                        <div key={index} className="flex items-center justify-between">
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
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-sm font-medium text-gray-500 mb-1">Payment ID</div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-900 font-mono break-all mr-2">{payment.id}</div>
                    <button
                      onClick={() => handleCopy(payment.id, 'payment-id')}
                      className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                    >
                      {showCopied === 'payment-id' ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-sm font-medium text-gray-500 mb-1">Shop</div>
                  <div className="space-y-1">
                    <div className="text-sm text-gray-900">{payment.shopName}</div>
                    <div className="text-sm text-gray-600">@{payment.shopUsername}</div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-sm font-medium text-gray-500 mb-1">Gateway</div>
                  <div className="text-sm text-gray-900">{payment.gateway}</div>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-sm font-medium text-gray-500 mb-1">Order ID</div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-900 break-all mr-2">{payment.orderId}</div>
                    <button
                      onClick={() => handleCopy(payment.orderId, 'order-id')}
                      className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                    >
                      {showCopied === 'order-id' ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-sm font-medium text-gray-500 mb-1">Status</div>
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
                        <AlertTriangle className="h-4 w-4" />
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

                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-sm font-medium text-gray-500 mb-1">Created At</div>
                  <div className="text-sm text-gray-900">
                    {format(new Date(payment.createdAt), 'PPpp')}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-sm font-medium text-gray-500 mb-1">Updated At</div>
                  <div className="text-sm text-gray-900">
                    {format(new Date(payment.updatedAt), 'PPpp')}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-sm font-medium text-gray-500 mb-1">Amount</div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {payment.amount.toLocaleString('en-US', {
                      style: 'currency',
                      currency: payment.currency,
                    })}
                  </div>
                </div>

                {payment.sourceCurrency && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="text-sm font-medium text-gray-500 mb-1">Source Currency</div>
                    <div className="text-sm text-gray-900">{payment.sourceCurrency}</div>
                  </div>
                )}

                {payment.customerEmail && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="text-sm font-medium text-gray-500 mb-1">Customer Email</div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-900 break-all mr-2">{payment.customerEmail}</div>
                      <button
                        onClick={() => handleCopy(payment.customerEmail!, 'customer-email')}
                        className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                      >
                        {showCopied === 'customer-email' ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {payment.customerName && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="text-sm font-medium text-gray-500 mb-1">Customer Name</div>
                    <div className="text-sm text-gray-900">{payment.customerName}</div>
                  </div>
                )}

                {payment.cardLast4 && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="text-sm font-medium text-gray-500 mb-1">Card Last 4</div>
                    <div className="text-sm text-gray-900">****{payment.cardLast4}</div>
                  </div>
                )}

                {payment.paymentMethod && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="text-sm font-medium text-gray-500 mb-1">Payment Method</div>
                    <div className="text-sm text-gray-900">{payment.paymentMethod}</div>
                  </div>
                )}

                {payment.bankId && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="text-sm font-medium text-gray-500 mb-1">Bank ID</div>
                    <div className="text-sm text-gray-900">{payment.bankId}</div>
                  </div>
                )}

                {payment.remitterIban && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="text-sm font-medium text-gray-500 mb-1">Remitter IBAN</div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-900 font-mono break-all mr-2">{payment.remitterIban}</div>
                      <button
                        onClick={() => handleCopy(payment.remitterIban!, 'remitter-iban')}
                        className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                      >
                        {showCopied === 'remitter-iban' ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {payment.remitterName && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="text-sm font-medium text-gray-500 mb-1">Remitter Name</div>
                    <div className="text-sm text-gray-900">{payment.remitterName}</div>
                  </div>
                )}

                {payment.gatewayPaymentId && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="text-sm font-medium text-gray-500 mb-1">Gateway Payment ID</div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-900 font-mono break-all mr-2">{payment.gatewayPaymentId}</div>
                      <button
                        onClick={() => handleCopy(payment.gatewayPaymentId!, 'gateway-payment-id')}
                        className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                      >
                        {showCopied === 'gateway-payment-id' ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {payment.gatewayOrderId && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="text-sm font-medium text-gray-500 mb-1">Gateway Order ID</div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-900 font-mono break-all mr-2">{payment.gatewayOrderId}</div>
                      <button
                        onClick={() => handleCopy(payment.gatewayOrderId!, 'gateway-order-id')}
                        className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                      >
                        {showCopied === 'gateway-order-id' ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {payment.expiresAt && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="text-sm font-medium text-gray-500 mb-1">Expires At</div>
                    <div className="text-sm text-gray-900">
                      {format(new Date(payment.expiresAt), 'PPpp')}
                    </div>
                  </div>
                )}

                {payment.chargebackAmount && (
                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <div className="text-sm font-medium text-purple-700 mb-1">Chargeback Amount</div>
                    <div className="text-lg font-semibold text-purple-900">
                      {payment.chargebackAmount.toFixed(2)} USDT
                    </div>
                  </div>
                )}

                {payment.notes && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="text-sm font-medium text-gray-500 mb-1">Notes</div>
                    <div className="text-sm text-gray-900">{payment.notes}</div>
                  </div>
                )}
              </div>
            </div>

            {/* External Payment URL */}
            {payment.externalPaymentUrl && (
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="text-sm font-medium text-gray-500 mb-1">External Payment URL</div>
                <div className="flex items-center justify-between">
                  <a
                    href={payment.externalPaymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:text-primary-dark break-all mr-2"
                  >
                    {payment.externalPaymentUrl}
                  </a>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button
                      onClick={() => handleCopy(payment.externalPaymentUrl!, 'external-payment-url')}
                      className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
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
                      className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Webhook Logs */}
            {payment.webhookLogs && payment.webhookLogs.length > 0 && (
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Webhook Logs</h4>
                <div className="space-y-3">
                  {payment.webhookLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          log.statusCode >= 200 && log.statusCode < 300 ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{log.event}</div>
                          <div className="text-xs text-gray-500">
                            {format(new Date(log.createdAt), 'MMM d, HH:mm')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          log.statusCode >= 200 && log.statusCode < 300 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {log.statusCode}
                        </span>
                        {log.retryCount > 0 && (
                          <span className="text-xs text-gray-500">
                            Retry: {log.retryCount}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Update Status Modal */}
      <AnimatePresence>
        {showUpdateModal && (
          <UpdateStatusModal
            payment={payment}
            onClose={() => setShowUpdateModal(false)}
            onUpdate={onUpdateStatus}
          />
        )}
      </AnimatePresence>
    </>
  );
};

const AdminPayments: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [gatewayFilter, setGatewayFilter] = useState<string>('all');
  const [shopFilter, setShopFilter] = useState<string>('');
  const [selectedPayment, setSelectedPayment] = useState<AdminPayment | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isStartDatePickerOpen, setIsStartDatePickerOpen] = useState(false);
  const [isEndDatePickerOpen, setIsEndDatePickerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  const { usePayments, useUpdatePaymentStatus } = useAdmin();
  const updatePaymentStatusMutation = useUpdatePaymentStatus();

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

    if (shopFilter.trim()) {
      apiFilters.shopId = shopFilter.trim();
    }

    if (startDate) {
      apiFilters.dateFrom = format(startDate, 'yyyy-MM-dd');
    }

    if (endDate) {
      apiFilters.dateTo = format(endDate, 'yyyy-MM-dd');
    }

    if (searchTerm.trim()) {
      apiFilters.search = searchTerm.trim();
    }

    return apiFilters;
  }, [currentPage, pageSize, statusFilter, gatewayFilter, shopFilter, startDate, endDate, searchTerm]);

  const { data: paymentsData, isLoading, error } = usePayments(filters);

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'PENDING', label: 'Pending', icon: <Clock className="h-4 w-4 text-yellow-600" /> },
    { value: 'PROCESSING', label: 'Processing', icon: <Loader2 className="h-4 w-4 text-blue-600" /> },
    { value: 'PAID', label: 'Paid', icon: <CheckCircle2 className="h-4 w-4 text-green-600" /> },
    { value: 'EXPIRED', label: 'Expired', icon: <XCircle className="h-4 w-4 text-gray-600" /> },
    { value: 'FAILED', label: 'Failed', icon: <AlertTriangle className="h-4 w-4 text-red-600" /> },
    { value: 'CHARGEBACK', label: 'Chargeback', icon: <RotateCcw className="h-4 w-4 text-purple-600" /> },
    { value: 'REFUND', label: 'Refund', icon: <AlertTriangle className="h-4 w-4 text-blue-600" /> }
  ];

  const gatewayOptions = [
    { value: 'all', label: 'All Gateways' },
    { value: 'plisio', label: 'Plisio' },
    { value: 'rapyd', label: 'Rapyd' },
    { value: 'noda', label: 'Noda' },
    { value: 'cointopay', label: 'CoinToPay' },
    { value: 'klyme_eu', label: 'KLYME EU' },
    { value: 'klyme_gb', label: 'KLYME GB' },
    { value: 'klyme_de', label: 'KLYME DE' }
  ];

  const handleUpdatePaymentStatus = async (id: string, data: UpdatePaymentStatusData) => {
    try {
      await updatePaymentStatusMutation.mutateAsync({ id, data });
      toast.success('Payment status updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update payment status');
    }
  };

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-600 mb-2">
          <AlertTriangle className="h-8 w-8 mx-auto" />
        </div>
        <p className="text-gray-600">Failed to load payments. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Admin Payments</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and monitor all platform payments
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 w-full sm:w-auto justify-center"
        >
          <Download className="h-4 w-4 mr-2" />
          Export
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
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all duration-200"
                />
              </div>
            </div>
            <div className="flex gap-4">
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
              <CustomSelect
                value={statusFilter}
                onChange={setStatusFilter}
                options={statusOptions}
                placeholder="All Status"
                className="w-[180px]"
              />
              <CustomSelect
                value={gatewayFilter}
                onChange={setGatewayFilter}
                options={gatewayOptions}
                placeholder="All Gateways"
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
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-6 py-4">
                    <button className="flex items-center space-x-2 text-sm font-medium text-gray-500">
                      <span>Date</span>
                      <ArrowUpDown className="h-4 w-4" />
                    </button>
                  </th>
                  <th className="text-left px-6 py-4">
                    <span className="text-sm font-medium text-gray-500">Payment ID</span>
                  </th>
                  <th className="text-left px-6 py-4">
                    <span className="text-sm font-medium text-gray-500">Shop</span>
                  </th>
                  <th className="text-left px-6 py-4">
                    <span className="text-sm font-medium text-gray-500">Gateway</span>
                  </th>
                  <th className="text-left px-6 py-4">
                    <button className="flex items-center space-x-2 text-sm font-medium text-gray-500">
                      <span>Amount</span>
                      <ArrowUpDown className="h-4 w-4" />
                    </button>
                  </th>
                  <th className="text-left px-6 py-4">
                    <span className="text-sm font-medium text-gray-500">Status</span>
                  </th>
                  <th className="text-left px-6 py-4">
                    <span className="text-sm font-medium text-gray-500">Customer</span>
                  </th>
                  <th className="text-right px-6 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {paymentsData?.payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">
                        {format(new Date(payment.createdAt), 'MMM d, yyyy')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono text-gray-900">
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
                      <span className="text-sm text-gray-900">{payment.gateway}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        {payment.amount.toLocaleString('en-US', {
                          style: 'currency',
                          currency: payment.currency,
                        })}
                      </span>
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
                          <AlertTriangle className="h-4 w-4" />
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
                      <div className="text-sm text-gray-900">
                        {payment.customerName && <div>{payment.customerName}</div>}
                        {payment.customerEmail && <div className="text-gray-600">{payment.customerEmail}</div>}
                      </div>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {paymentsData?.pagination && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {((paymentsData.pagination.page - 1) * paymentsData.pagination.limit) + 1} to{' '}
              {Math.min(paymentsData.pagination.page * paymentsData.pagination.limit, paymentsData.pagination.total)} of{' '}
              {paymentsData.pagination.total} results
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
                Page {paymentsData.pagination.page} of {paymentsData.pagination.totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(paymentsData.pagination.totalPages, currentPage + 1))}
                disabled={currentPage === paymentsData.pagination.totalPages}
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
            onUpdateStatus={handleUpdatePaymentStatus}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPayments;