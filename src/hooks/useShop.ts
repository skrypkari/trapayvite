import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { convertGatewayNamesToIds, convertGatewayIdsToNames } from '../utils/gatewayMapping';

export interface ShopProfile {
  id: string;
  name: string; // Mapped from fullName (Brand Name)
  username: string;
  telegram: string; // Mapped from telegramId
  commision: number; // Note: keeping the typo from server response - DEPRECATED
  shopUrl: string; // Mapped from merchantUrl
  paymentGateways: string[]; // These will be gateway IDs (0001, 0010, etc.) - mapped from gateways
  payoutDelay: number; // DEPRECATED - use gatewaySettings
  publicKey: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
  // New fields from API response
  gatewaySettings?: {
    [gatewayName: string]: { // Gateway names as keys from server
      commission: number;
      minAmount?: number;
      maxAmount?: number;
      payoutDelay?: number;
    };
  };
  wallets?: {
    usdtPolygonWallet?: string | null;
    usdtTrcWallet?: string | null;
    usdtErcWallet?: string | null;
    usdcPolygonWallet?: string | null;
  };
}

// Payment Interface - ✅ UPDATED: Added failure_message, tx_urls, and customer fields
export interface ShopPayment {
  id: string;
  shopId: string;
  gateway: string; // This will be gateway ID
  product_name: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'EXPIRED' | 'FAILED';
  created_at: string;
  updated_at?: string;
  customer_email?: string;
  customer_name?: string;
  // ✅ NEW: Customer location and device info
  customer_country?: string;
  customer_ip?: string;
  customer_ua?: string;
  webhook_logs?: WebhookLog[];
  // ✅ NEW: Failure message field
  failure_message?: string;
  // ✅ NEW: Transaction URLs field
  tx_urls?: string[];
}

// ✅ UPDATED: Payout Interface to match new API structure
export interface ShopPayout {
  id: string;
  amount: number;
  network: string; // e.g., "USDT TRC20", "USDT Polygon", "USDC Polygon" - читаемые названия из API
  wallet: string; // ✅ NEW: Add wallet field
  status: 'PENDING' | 'COMPLETED' | 'REJECTED';
  txid?: string | null;
  notes?: string | null;
  periodFrom?: string | null; // ✅ NEW: Период начала payout
  periodTo?: string | null;   // ✅ NEW: Период окончания payout
  createdAt: string;
  paidAt?: string | null;
}

// Webhook Log Interface
export interface WebhookLog {
  id: string;
  paymentId: string;
  shopId: string;
  event: string;
  statusCode: number;
  retryCount: number;
  responseBody?: string;
  createdAt: string;
  payment?: {
    id: string;
    productName: string;
    amount: number;
    currency: string;
  };
}

// Daily Revenue/Payments Interface
export interface DailyRevenue {
  date: string; // YYYY-MM-DD format
  amount: number;
}

export interface DailyPayments {
  date: string; // YYYY-MM-DD format
  count: number;
}

// Statistics Interface - Updated with new fields
export interface ShopStatistics {
  totalPayments: number;
  successfulPayments: number;
  totalAmount: number;
  totalRevenue?: number; // ✅ NEW: API response field
  averageAmount: number;
  conversionRate?: number; // ✅ NEW: API response field
  paymentsByStatus: {
    PAID: number;
    PENDING: number;
    PROCESSING: number; // ✅ NEW: Added PROCESSING status
    FAILED: number;
    EXPIRED: number;
  };
  paymentsByGateway: Record<string, number>; // Gateway IDs as keys
  recentPayments: ShopPayment[];
  dailyRevenue: DailyRevenue[]; // New field for chart data
  dailyPayments: DailyPayments[]; // New field for chart data
}

// Pagination Interface
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// API Response Interfaces
export interface ApiResponse<T> {
  success: boolean;
  result: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  result: {
    [key: string]: T[] | Pagination;
    pagination: Pagination;
  };
}

// Filters - ✅ UPDATED: Added PROCESSING status and currency filter
export interface PaymentFilters {
  page?: number;
  limit?: number;
  status?: 'PENDING' | 'PROCESSING' | 'PAID' | 'EXPIRED' | 'FAILED';
  gateway?: string; // Gateway ID
  currency?: string; // ✅ NEW: Added currency filter
}

export interface PayoutFilters {
  page?: number;
  limit?: number;
  status?: 'PENDING' | 'COMPLETED' | 'REJECTED';
  network?: string; // e.g., "polygon", "trc20", "erc20"
  periodFrom?: string; // YYYY-MM-DD ✅ NEW: Фильтр по дате начала периода
  periodTo?: string; // YYYY-MM-DD ✅ NEW: Фильтр по дате окончания периода
  dateFrom?: string; // YYYY-MM-DD - для совместимости
  dateTo?: string; // YYYY-MM-DD - для совместимости
}

export interface WebhookLogFilters {
  page?: number;
  limit?: number;
  paymentId?: string;
}

// Webhook Settings Interface - Updated to match API response
export interface WebhookSettings {
  webhookUrl: string;
  webhookEvents: string[];
}

// Shop Settings Interface - New interface for the complete settings response
export interface ShopSettings {
  fullName: string;
  brand: string;
  merchantUrl: string;
  telegramUsername: string | null;
  telegramBotApiKey: string | null; // Masked in response
  telegramChatId: string | null;
  webhookUrl: string;
  webhookEvents: string[];
  notifications: {
    payment_success: boolean;
    payment_failed: boolean;
    refund: boolean;
    payout: boolean;
    login: boolean;
    api_error: boolean;
  };
}

// Wallets Interface
export interface WalletSettings {
  usdtPolygonWallet?: string;
  usdtTrcWallet?: string;
  usdtErcWallet?: string;
  usdcPolygonWallet?: string;
}

// Transform server response to UI format
const transformShopProfile = (serverProfile: any): ShopProfile => {
  console.log('Transforming shop profile:', serverProfile); // Debug log
  
  // Safely handle gateways array
  const gateways = Array.isArray(serverProfile.gateways) ? serverProfile.gateways : [];
  console.log('Server gateways:', gateways); // Debug log
  
  const transformedGateways = convertGatewayNamesToIds(gateways);
  console.log('Transformed gateways:', transformedGateways); // Debug log
  
  return {
    id: serverProfile.id,
    name: serverProfile.fullName || '', // ✅ Map fullName to name (Brand Name)
    username: serverProfile.username || '',
    telegram: serverProfile.telegramId || '', // ✅ Map telegramId to telegram
    commision: 0, // DEPRECATED - not used anymore
    shopUrl: serverProfile.merchantUrl || '', // ✅ Map merchantUrl to shopUrl
    paymentGateways: transformedGateways, // ✅ Map gateways to paymentGateways and convert to IDs
    payoutDelay: 0, // DEPRECATED - not used anymore
    publicKey: serverProfile.publicKey || '',
    status: serverProfile.status || 'ACTIVE',
    createdAt: serverProfile.createdAt || new Date().toISOString(),
    // Keep gateway settings as-is (with gateway names as keys from server)
    gatewaySettings: serverProfile.gatewaySettings,
    // Include wallet information
    wallets: serverProfile.wallets
  };
};

// Query Keys
export const shopKeys = {
  all: ['shop'] as const,
  profile: () => [...shopKeys.all, 'profile'] as const,
  payments: () => [...shopKeys.all, 'payments'] as const,
  paymentsList: (filters: PaymentFilters) => [...shopKeys.payments(), 'list', filters] as const,
  payment: (id: string) => [...shopKeys.payments(), 'detail', id] as const,
  payouts: () => [...shopKeys.all, 'payouts'] as const,
  payoutsList: (filters: PayoutFilters) => [...shopKeys.payouts(), 'list', filters] as const,
  payout: (id: string) => [...shopKeys.payouts(), 'detail', id] as const,
  payoutStats: () => [...shopKeys.payouts(), 'stats'] as const,
  webhookLogs: () => [...shopKeys.all, 'webhook-logs'] as const,
  webhookLogsList: (filters: WebhookLogFilters) => [...shopKeys.webhookLogs(), 'list', filters] as const,
  statistics: (period?: string) => [...shopKeys.all, 'statistics', period] as const,
  settings: () => [...shopKeys.all, 'settings'] as const, // New key for shop settings
  wallets: () => [...shopKeys.all, 'wallets'] as const,
};

// Shop Profile Hook - Updated to handle new API response structure
export function useShopProfile() {
  return useQuery({
    queryKey: shopKeys.profile(),
    queryFn: async () => {
      const response = await api.get<ApiResponse<any>>('/shop/profile');
      console.log('Shop profile API response:', response); // Debug log
      
      const profile = response.result;
      
      if (!profile) {
        throw new Error('No profile data found in response');
      }
      
      return transformShopProfile(profile);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Shop Payments Hook
export function useShopPayments(filters: PaymentFilters = {}) {
  return useQuery({
    queryKey: shopKeys.paymentsList(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.status) params.append('status', filters.status);
      if (filters.gateway) {
        // Convert gateway ID to name for API request
        const gatewayName = convertGatewayIdsToNames([filters.gateway])[0];
        params.append('gateway', gatewayName);
      }
      if (filters.currency) params.append('currency', filters.currency); // ✅ NEW: Added currency filter
      
      const queryString = params.toString();
      const response = await api.get<{
        success: boolean;
        result: {
          payments: ShopPayment[];
          pagination: Pagination;
        };
      }>(
        `/shop/payments${queryString ? `?${queryString}` : ''}`
      );
      
      // Convert gateway names to IDs in response
      const paymentsWithGatewayIds = response.result.payments.map(payment => ({
        ...payment,
        gateway: convertGatewayNamesToIds([payment.gateway])[0]
      }));
      
      return {
        payments: paymentsWithGatewayIds,
        pagination: response.result.pagination
      };
    },
    placeholderData: (previousData) => previousData,
  });
}

// Single Payment Hook
export function useShopPayment(id: string) {
  return useQuery({
    queryKey: shopKeys.payment(id),
    queryFn: async () => {
      const response = await api.get<ApiResponse<ShopPayment>>(`/shop/payments/${id}`);
      const payment = response.result;
      
      // Convert gateway name to ID
      return {
        ...payment,
        gateway: convertGatewayNamesToIds([payment.gateway])[0]
      };
    },
    enabled: !!id,
  });
}

// ✅ UPDATED: Shop Payouts Hook to match new API structure
export function useShopPayouts(filters: PayoutFilters = {}) {
  return useQuery({
    queryKey: shopKeys.payoutsList(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.status) params.append('status', filters.status);
      if (filters.network) params.append('network', filters.network);
      if (filters.periodFrom) params.append('periodFrom', filters.periodFrom);
      if (filters.periodTo) params.append('periodTo', filters.periodTo);
      // Поддержка старых полей для совместимости
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      
      const queryString = params.toString();
      const response = await api.get<ApiResponse<{
        payouts: ShopPayout[];
        pagination: Pagination;
      }>>(
        `/shop/payouts${queryString ? `?${queryString}` : ''}`
      );
      
      return {
        payouts: response.result.payouts,
        pagination: response.result.pagination
      };
    },
    placeholderData: (previousData) => previousData,
  });
}

// Single Payout Hook
export function useShopPayout(id: string) {
  return useQuery({
    queryKey: shopKeys.payout(id),
    queryFn: async () => {
      const response = await api.get<ApiResponse<ShopPayout>>(`/shop/payouts/${id}`);
      return response.result;
    },
    enabled: !!id,
  });
}

// ✅ FIXED: Payout Statistics Hook to match API response structure
export function useShopPayoutStats() {
  return useQuery({
    queryKey: shopKeys.payoutStats(),
    queryFn: async () => {
      const response = await api.get<ApiResponse<{
        availableBalance: number;  // ✅ FIXED: Use availableBalance from API
        totalPaidOut: number;
        awaitingPayout: number;
        thisMonth: number;
      }>>('/shop/payouts/stats');
      return response.result;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Webhook Logs Hook
export function useWebhookLogs(filters: WebhookLogFilters = {}) {
  return useQuery({
    queryKey: shopKeys.webhookLogsList(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.paymentId) params.append('paymentId', filters.paymentId);
      
      const queryString = params.toString();
      const response = await api.get<{
        success: boolean;
        result: {
          logs: WebhookLog[];
          pagination: Pagination;
        };
      }>(
        `/shop/webhook-logs${queryString ? `?${queryString}` : ''}`
      );
      
      return {
        logs: response.result.logs,
        pagination: response.result.pagination
      };
    },
    placeholderData: (previousData) => previousData,
  });
}

// Shop Statistics Hook - Updated to handle new fields
export function useShopStatistics(period: string = '30d') {
  return useQuery({
    queryKey: shopKeys.statistics(period),
    queryFn: async () => {
      const response = await api.get<ApiResponse<ShopStatistics>>(
        `/shop/statistics?period=${period}`
      );
      const stats = response.result;
      
      console.log('🔍 Shop statistics API response:', stats); // Debug log
      
      // Ensure stats is not null/undefined
      if (!stats) {
        return {
          totalPayments: 0,
          successfulPayments: 0,
          totalAmount: 0,
          averageAmount: 0,
          paymentsByStatus: {
            PAID: 0,
            PENDING: 0,
            PROCESSING: 0,
            FAILED: 0,
            EXPIRED: 0
          },
          paymentsByGateway: {},
          recentPayments: [],
          dailyRevenue: [],
          dailyPayments: []
        };
      }
      
      return {
        totalPayments: stats.totalPayments || 0,
        successfulPayments: stats.successfulPayments || 0,
        totalAmount: stats.totalRevenue || 0, // ✅ Map totalRevenue to totalAmount
        averageAmount: stats.averageAmount || 0,
        paymentsByStatus: stats.paymentsByStatus || {
          PAID: 0,
          PENDING: 0,
          PROCESSING: 0,
          FAILED: 0,
          EXPIRED: 0
        },
        paymentsByGateway: stats.paymentsByGateway || {},
        recentPayments: (stats.recentPayments || []).map((payment: any) => ({
          ...payment,
          gateway: convertGatewayNamesToIds([payment.gateway])[0] // Convert gateway name to ID
        })),
        dailyRevenue: stats.dailyRevenue || [],
        dailyPayments: stats.dailyPayments || []
      };
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Shop Settings Hook - NEW: Get complete shop settings including webhook settings
export function useShopSettings() {
  return useQuery({
    queryKey: shopKeys.settings(),
    queryFn: async () => {
      const response = await api.get<{
        success: boolean;
        message: string;
        data: ShopSettings;
      }>('/shop/settings');
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Webhook Settings Hook - UPDATED: Extract webhook settings from shop settings
export function useWebhookSettings() {
  return useQuery({
    queryKey: [...shopKeys.settings(), 'webhook'],
    queryFn: async () => {
      const response = await api.get<{
        success: boolean;
        message: string;
        data: ShopSettings;
      }>('/shop/settings');
      
      return {
        webhookUrl: response.data.webhookUrl || '',
        webhookEvents: response.data.webhookEvents || []
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Wallets Hook
export function useWalletSettings() {
  return useQuery({
    queryKey: shopKeys.wallets(),
    queryFn: async () => {
      const response = await api.get<ApiResponse<ShopProfile>>('/shop/profile');
      return response.result.wallets || {};
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Update Shop Profile Hook
export function useUpdateShopProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<ShopProfile>) => {
      // Convert gateway IDs to names for API request
      const dataForApi = {
        ...data,
        paymentGateways: data.paymentGateways ? convertGatewayIdsToNames(data.paymentGateways) : undefined
      };
      
      const response = await api.put<ApiResponse<any>>('/shop/profile', dataForApi);
      const profile = response.result;
      
      return transformShopProfile(profile);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(shopKeys.profile(), data);
      queryClient.invalidateQueries({ queryKey: shopKeys.profile() });
    },
  });
}

// Update Webhook Settings Hook - UPDATED: Use new API endpoint
export function useUpdateWebhookSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: WebhookSettings) => {
      const response = await api.put<{
        success: boolean;
        message: string;
        data: WebhookSettings;
      }>('/shop/integrations/webhook', data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate both webhook settings and shop settings queries
      queryClient.invalidateQueries({ queryKey: [...shopKeys.settings(), 'webhook'] });
      queryClient.invalidateQueries({ queryKey: shopKeys.settings() });
    },
  });
}

// Update Wallet Settings Hook
export function useUpdateWalletSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: WalletSettings) => {
      const response = await api.put<ApiResponse<WalletSettings>>('/shop/wallets', data);
      return response.result;
    },
    onSuccess: () => {
      // Invalidate both wallets and profile queries since wallets are part of profile
      queryClient.invalidateQueries({ queryKey: shopKeys.wallets() });
      queryClient.invalidateQueries({ queryKey: shopKeys.profile() });
    },
  });
}

// Retry Webhook Hook
export function useRetryWebhook() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (paymentId: string) => {
      const response = await api.post<ApiResponse<void>>(`/shop/payments/${paymentId}/retry-webhook`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shopKeys.webhookLogs() });
    },
  });
}

// Test Webhook Hook
export function useTestWebhook() {
  return useMutation({
    mutationFn: async () => {
      const response = await api.post<ApiResponse<void>>('/shop/webhook/test');
      return response;
    },
  });
}