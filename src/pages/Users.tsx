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
  Copy,
  Check,
  Plus,
  Lock,
  Mail,
  Calendar,
  Link2,
  RefreshCw,
  ChevronDown,
  Share2,
  Trash2,
  Edit3,
  BarChart2,
  Users as UsersIcon,
  Globe,
  MoreHorizontal,
  User as UserIcon,
  Building2,
  Percent,
  Timer,
  Wallet,
  X
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import CustomSelect from '../components/CustomSelect';
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
import { getGatewayInfo, getAllGatewayIds, GATEWAY_INFO } from '../utils/gatewayMapping';

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

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      onDelete(user.id);
      onClose();
    }
  };

  const handleSuspend = () => {
    if (window.confirm('Are you sure you want to suspend this user?')) {
      onSuspend(user.id);
    }
  };

  const handleActivate = () => {
    if (window.confirm('Are you sure you want to activate this user?')) {
      onActivate(user.id);
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
        className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <UserIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">User Details</h3>
                <p className="text-sm text-gray-500">{user.name}</p>
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
          {/* User Information */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">User Information</h4>
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
                <div className="text-sm text-gray-900">{user.telegram || 'Not provided'}</div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="text-sm font-medium text-gray-500 mb-1">Merchant URL</div>
                <div className="flex items-center justify-between">
                  <a
                    href={user.shopUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:text-primary-dark break-all mr-2"
                  >
                    {user.shopUrl}
                  </a>
                  <button
                    onClick={() => handleCopy(user.shopUrl, 'shop-url')}
                    className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                  >
                    {showCopied === 'shop-url' ? (
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
                <div className="text-sm font-medium text-gray-500 mb-1">Created At</div>
                <div className="text-sm text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="text-sm font-medium text-gray-500 mb-1">Public Key</div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-900 font-mono break-all mr-2">{user.publicKey}</div>
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

          {/* Gateway Settings */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Gateway Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user.paymentGateways.map((gatewayId) => {
                const gatewayInfo = getGatewayInfo(gatewayId);
                const settings = user.gatewaySettings?.[gatewayId];
                
                return (
                  <motion.div
                    key={gatewayId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50"
                  >
                    {/* Gateway Header */}
                    <div className={`p-4 ${gatewayInfo?.color || 'bg-gray-500'} text-white relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-black/10"></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="font-semibold">{gatewayInfo?.displayName || `Gateway ${gatewayId}`}</h3>
                            <p className="text-sm opacity-90">{gatewayInfo?.description || gatewayId}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Gateway Settings */}
                    <div className="p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                          <div className="flex items-center justify-center mb-2">
                            <Percent className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="text-lg font-bold text-blue-900">
                            {settings?.commission || 0}%
                          </div>
                          <div className="text-xs text-blue-700">Commission</div>
                        </div>
                        
                        <div className="text-center p-3 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
                          <div className="flex items-center justify-center mb-2">
                            <Timer className="h-4 w-4 text-orange-600" />
                          </div>
                          <div className="text-lg font-bold text-orange-900">
                            T+{settings?.payoutDelay || 0}
                          </div>
                          <div className="text-xs text-orange-700">Payout</div>
                        </div>
                      </div>

                      {/* Features */}
                      {gatewayInfo?.features && (
                        <div>
                          <div className="text-xs font-medium text-gray-700 mb-2">Features</div>
                          <div className="flex flex-wrap gap-1">
                            {gatewayInfo.features.map((feature) => (
                              <span
                                key={feature}
                                className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full"
                              >
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
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
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => onEdit(user)}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark flex items-center space-x-2"
              >
                <Edit3 className="h-4 w-4" />
                <span>Edit User</span>
              </button>
              
              {user.status === 'ACTIVE' ? (
                <button
                  onClick={handleSuspend}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center space-x-2"
                >
                  <Lock className="h-4 w-4" />
                  <span>Suspend</span>
                </button>
              ) : (
                <button
                  onClick={handleActivate}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Activate</span>
                </button>
              )}
              
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
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
  editUser?: User | null;
}> = ({ isOpen, onClose, editUser }) => {
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

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedGateways, setSelectedGateways] = useState<string[]>([]);

  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();

  // Initialize form data when editing
  React.useEffect(() => {
    if (editUser) {
      setFormData({
        name: editUser.name,
        username: editUser.username,
        password: '', // Don't pre-fill password
        telegram: editUser.telegram,
        merchantUrl: editUser.shopUrl,
        paymentGateways: editUser.paymentGateways,
        status: editUser.status,
        gatewaySettings: editUser.gatewaySettings || {},
        wallets: editUser.wallets || {
          usdtPolygonWallet: '',
          usdtTrcWallet: '',
          usdtErcWallet: '',
          usdcPolygonWallet: ''
        }
      });
      setSelectedGateways(editUser.paymentGateways);
    } else {
      // Reset form for new user
      setFormData({
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
      setSelectedGateways([]);
    }
    setErrors({});
  }, [editUser, isOpen]);

  const availableGateways = getAllGatewayIds().map(id => ({
    id,
    info: getGatewayInfo(id)!
  }));

  const handleGatewayToggle = (gatewayId: string) => {
    const newGateways = selectedGateways.includes(gatewayId)
      ? selectedGateways.filter(id => id !== gatewayId)
      : [...selectedGateways, gatewayId];
    
    setSelectedGateways(newGateways);
    setFormData(prev => ({
      ...prev,
      paymentGateways: newGateways
    }));

    // Initialize gateway settings for new gateways
    if (!selectedGateways.includes(gatewayId)) {
      setFormData(prev => ({
        ...prev,
        gatewaySettings: {
          ...prev.gatewaySettings,
          [gatewayId]: {
            commission: 10,
            payoutDelay: 5
          }
        }
      }));
    }
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
    
    // Validate form
    const validationErrors = validateUserData(formData);
    if (validationErrors.length > 0) {
      const errorMap: Record<string, string> = {};
      validationErrors.forEach(error => {
        errorMap[error.field] = error.message;
      });
      setErrors(errorMap);
      return;
    }

    try {
      if (editUser) {
        // Update existing user
        await updateUserMutation.mutateAsync({
          id: editUser.id,
          data: formData
        });
        toast.success('User updated successfully!');
      } else {
        // Create new user
        const createData: AddUserFormData = {
          brandName: formData.name,
          username: formData.username,
          password: formData.password!,
          telegramId: formData.telegram,
          merchantUrl: formData.merchantUrl,
          gateways: formData.paymentGateways,
          gatewaySettings: formData.gatewaySettings,
          wallets: formData.wallets
        };
        
        await createUserMutation.mutateAsync(createData);
        toast.success('User created successfully!');
      }
      
      onClose();
    } catch (error: any) {
      toast.error(error.message || `Failed to ${editUser ? 'update' : 'create'} user`);
    }
  };

  const isLoading = createUserMutation.isPending || updateUserMutation.isPending;

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
                <h3 className="text-lg font-semibold text-gray-900">
                  {editUser ? 'Edit User' : 'Add New User'}
                </h3>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">
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
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        errors.name ? 'border-red-300' : 'border-gray-300'
                      } focus:ring-2 focus:ring-primary focus:border-primary outline-none`}
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
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        errors.username ? 'border-red-300' : 'border-gray-300'
                      } focus:ring-2 focus:ring-primary focus:border-primary outline-none`}
                      placeholder="Enter username"
                    />
                    {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password {editUser ? '(leave empty to keep current)' : '*'}
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        errors.password ? 'border-red-300' : 'border-gray-300'
                      } focus:ring-2 focus:ring-primary focus:border-primary outline-none`}
                      placeholder={editUser ? "Leave empty to keep current password" : "Enter password"}
                    />
                    {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telegram ID
                    </label>
                    <input
                      type="text"
                      value={formData.telegram}
                      onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        errors.telegram ? 'border-red-300' : 'border-gray-300'
                      } focus:ring-2 focus:ring-primary focus:border-primary outline-none`}
                      placeholder="Enter Telegram ID"
                    />
                    {errors.telegram && <p className="mt-1 text-sm text-red-600">{errors.telegram}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Merchant URL *
                    </label>
                    <input
                      type="url"
                      value={formData.merchantUrl}
                      onChange={(e) => setFormData({ ...formData, merchantUrl: e.target.value })}
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        errors.merchantUrl ? 'border-red-300' : 'border-gray-300'
                      } focus:ring-2 focus:ring-primary focus:border-primary outline-none`}
                      placeholder="https://example.com"
                    />
                    {errors.merchantUrl && <p className="mt-1 text-sm text-red-600">{errors.merchantUrl}</p>}
                  </div>

                  {editUser && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <CustomSelect
                        value={formData.status}
                        onChange={(value) => setFormData({ ...formData, status: value as any })}
                        options={[
                          { value: 'ACTIVE', label: 'Active' },
                          { value: 'SUSPENDED', label: 'Suspended' },
                          { value: 'PENDING', label: 'Pending' }
                        ]}
                        placeholder="Select status"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Gateways */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">
                  Payment Gateways *
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableGateways.map((gateway) => (
                    <div
                      key={gateway.id}
                      className={`relative p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                        selectedGateways.includes(gateway.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                      }`}
                      onClick={() => handleGatewayToggle(gateway.id)}
                    >
                      {selectedGateways.includes(gateway.id) && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                      )}
                      
                      <div className="mb-3">
                        <h3 className={`font-semibold text-sm mb-1 ${
                          selectedGateways.includes(gateway.id) ? 'text-primary' : 'text-gray-900'
                        }`}>
                          {gateway.info.displayName}
                        </h3>
                        <p className="text-xs text-gray-500 mb-2">{gateway.info.description}</p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1">
                          {gateway.info.features.map((feature) => (
                            <span
                              key={feature}
                              className={`text-xs px-2 py-1 rounded-full ${
                                selectedGateways.includes(gateway.id)
                                  ? 'bg-primary/10 text-primary'
                                  : 'bg-gray-200 text-gray-600'
                              }`}
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Gateway Settings */}
                      {selectedGateways.includes(gateway.id) && (
                        <div className="mt-4 pt-4 border-t border-gray-200 space-y-3" onClick={(e) => e.stopPropagation()}>
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
                              onChange={(e) => handleGatewaySettingChange(
                                gateway.id, 
                                'commission', 
                                parseFloat(e.target.value) || 0
                              )}
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
                              onChange={(e) => handleGatewaySettingChange(
                                gateway.id, 
                                'payoutDelay', 
                                parseInt(e.target.value) || 0
                              )}
                              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {errors.paymentGateways && <p className="mt-1 text-sm text-red-600">{errors.paymentGateways}</p>}
              </div>

              {/* Wallet Settings */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">
                  Crypto Wallets (Optional)
                </h4>
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

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
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
                  <span>{isLoading ? (editUser ? 'Updating...' : 'Creating...') : (editUser ? 'Update User' : 'Create User')}</span>
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
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
      user.telegram.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.shopUrl.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [usersData?.users, searchTerm]);

  const handleEditUser = (user: User) => {
    setEditUser(user);
    setIsAddModalOpen(true);
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

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditUser(null);
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
          <div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left p-4 text-sm font-medium text-gray-500">User</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-500">Username</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-500">Gateways</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-500">Status</th>
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
                          <div className="text-sm text-gray-500">{user.telegram}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-gray-900">@{user.username}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {user.paymentGateways.slice(0, 2).map((gatewayId) => {
                          const gatewayInfo = getGatewayInfo(gatewayId);
                          return (
                            <span
                              key={gatewayId}
                              className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full"
                            >
                              {gatewayInfo?.displayName.split(' - ')[0] || `Gateway ${gatewayId}`}
                            </span>
                          );
                        })}
                        {user.paymentGateways.length > 2 && (
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                            +{user.paymentGateways.length - 2}
                          </span>
                        )}
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
                      <span className="text-sm text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="p-2 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <div className="relative group">
                          <button className="p-2 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                            >
                              <Edit3 className="h-4 w-4" />
                              <span>Edit</span>
                            </button>
                            {user.status === 'ACTIVE' ? (
                              <button
                                onClick={() => handleSuspendUser(user.id)}
                                className="w-full px-4 py-2 text-left text-sm text-yellow-600 hover:bg-yellow-50 flex items-center space-x-2"
                              >
                                <Lock className="h-4 w-4" />
                                <span>Suspend</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleActivateUser(user.id)}
                                className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 flex items-center space-x-2"
                              >
                                <CheckCircle2 className="h-4 w-4" />
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
            
            {/* Empty state */}
            {!isLoading && filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UsersIcon className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">No users found</p>
                <p className="text-gray-400 text-xs mt-1">Create your first user to get started</p>
              </div>
            )}
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
            onClose={handleCloseModal}
            editUser={editUser}
          />
        )}
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
      </AnimatePresence>
    </div>
  );
};

export default Users;