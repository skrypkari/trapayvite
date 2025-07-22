import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

// ===== TYPES =====

// ✅ UPDATED: Fixed interface to match actual API response
export interface AdminDashboardStats {
  totalRevenue: number;
  totalUsers: number; // This will be mapped from totalShops
  totalPayments: number;
  averagePayment: number;
  dailyRevenue: { date: string; amount: number }[];
}

export interface AdminUser {
  id: string;
  username: string;
  email?: string;
  role: 'admin';
}

export interface AdminAuthResponse {
  success: boolean;
  message: string;
  user: AdminUser;
}

// ✅ NEW: Interface for actual API response structure
export interface AdminStatsApiResponse {
  success: boolean;
  result: {
      totalShops: number;
      activeShops: number;
      totalPayments: number;
      successfulPayments: number;
      totalRevenue: number;
      conversionRate: number;
    recentPayments: Array<{
      id: string;
      amount: number;
      currency: string;
      status: string;
      gateway: string;
      shopName: string;
      shopUsername: string;
      createdAt: string;
    }>;
    period: string;
  };
}

// ✅ FIXED: Updated AdminPayment interface to match actual API response
export interface AdminPayment {
  id: string;
  shopId: string;
  gateway: string;
  orderId: string;
  amount: number;
  currency: string;
  sourceCurrency?: string;
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'EXPIRED' | 'FAILED' | 'CHARGEBACK' | 'REFUND';
  usage: 'ONCE' | 'REUSABLE';
  externalPaymentUrl?: string;
  gatewayPaymentId?: string;
  customerEmail?: string;
  customerName?: string;
  customerCountry?: string;
  customerIp?: string;
  customerUa?: string;
  cardLast4?: string;
  paymentMethod?: string;
  bankId?: string;
  remitterIban?: string;
  remitterName?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  webhookLogs?: WebhookLog[];
  gatewayOrderId?: string;
  chargebackAmount?: number;
  notes?: string;
  failureMessage?: string;
  txUrls?: string[];
  // ✅ FIXED: Shop information structure
  shop: {
    name: string;
    username: string;
  };
}

export interface WebhookLog {
  id: string;
  event: string;
  statusCode: number;
  retryCount: number;
  createdAt: string;
}

export interface AdminPaymentFilters {
  page?: number;
  limit?: number;
  status?: 'PENDING' | 'PROCESSING' | 'PAID' | 'EXPIRED' | 'FAILED' | 'CHARGEBACK' | 'REFUND';
  gateway?: string;
  shopId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  currency?: string;
}

// ✅ NEW: Merchant selection interface
export interface MerchantSelection {
  id: string;
  username: string;
  name: string;
}

export interface MerchantSelectionResponse {
  success: boolean;
  result: MerchantSelection[];
}

export interface AdminPaymentsResponse {
  success: boolean;
  payments: AdminPayment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminPaymentResponse {
  success: boolean;
  result: AdminPayment;
}

export interface UpdatePaymentStatusData {
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'EXPIRED' | 'FAILED' | 'CHARGEBACK' | 'REFUND';
  notes?: string;
  chargebackAmount?: number;
}

// ===== NEW: PAYOUT TYPES =====

// ✅ FIXED: Updated AdminPayoutStats to match actual API response
export interface AdminPayoutStats {
  totalPayout: number;
  awaitingPayout: number;
  thisMonth: number;
  availableBalance: number;
}

export interface AdminPayoutMerchant {
  id: string;
  fullName: string;
  username: string;
  telegramId: string;
  merchantUrl: string;
  totalAmountUSDT: number;
  totalAmountAfterCommissionUSDT: number;
  paymentsCount: number;
  oldestPaymentDate: string;
  gatewayBreakdown: Array<{
    gateway: string;
    count: number;
    amountUSDT: number;
    amountAfterCommissionUSDT: number;
    commission: number;
  }>;
  wallets: {
    usdtPolygonWallet?: string;
    usdtTrcWallet?: string;
    usdtErcWallet?: string;
    usdcPolygonWallet?: string;
  };
}

export interface AdminPayout {
  id: string;
  shopId: string;
  shopName: string;
  shopUsername: string;
  amount: number;
  network: string;
  status: 'PENDING' | 'COMPLETED' | 'REJECTED';
  walletAddress: string;
  txid?: string;
  notes?: string;
  createdAt: string;
  paidAt?: string;
  periodFrom?: string;
  periodTo?: string;
}

export interface AdminPayoutMerchantsFilters {
  page?: number;
  limit?: number;
  search?: string;
  minAmount?: number;
}

export interface AdminPayoutFilters {
  page?: number;
  limit?: number;
  search?: string;
  network?: string;
  status?: 'PENDING' | 'COMPLETED' | 'REJECTED';
}

export interface AdminPayoutMerchantsResponse {
  success: boolean;
  merchants: AdminPayoutMerchant[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminPayoutsResponse {
  success: boolean;
  payouts: AdminPayout[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreatePayoutData {
  shopId: string;
  amount: number;
  network: string;
  notes?: string;
  periodFrom?: string;
  periodTo?: string;
}

// ===== NEW: MERCHANT STATISTICS TYPES =====

export interface MerchantStatistics {
  totalTurnover: number;
  merchantEarnings: number;
  gatewayEarnings: number;
  totalPaidOut: number;
  averageCheck: number;
  totalPayments: number;
  successfulPayments: number;
  conversionRate: number;
  gatewayBreakdown: Array<{
    gateway: string;
    gatewayDisplayName: string;
    paymentsCount: number;
    turnoverUSDT: number;
    commissionUSDT: number;
    merchantEarningsUSDT: number;
    averageCommissionRate: number;
  }>;
  merchantBreakdown: Array<{
    shopId: string;
    shopName: string;
    shopUsername: string;
    paymentsCount: number;
    turnoverUSDT: number;
    commissionUSDT: number;
    merchantEarningsUSDT: number;
    paidOutUSDT: number;
    averageCheckUSDT: number;
  }>;
  dailyData: Array<{
    date: string;
    turnover: number;
    merchantEarnings: number;
    gatewayEarnings: number;
    paymentsCount: number;
  }>;
  periodInfo: {
    from: string;
    to: string;
    periodType: string;
    daysCount: number;
  };
}

export interface MerchantStatisticsFilters {
  shopId: string;
  period?: 'all' | 'year' | 'month' | 'week' | 'custom';
  dateFrom?: string;
  dateTo?: string;
}

export interface MerchantStatisticsResponse {
  success: boolean;
  result: MerchantStatistics;
}

// ===== QUERY KEYS =====

export const adminKeys = {
  all: ['admin'] as const,
  auth: () => [...adminKeys.all, 'auth'] as const,
  stats: () => [...adminKeys.all, 'stats'] as const,
  statsList: (period?: string) => [...adminKeys.stats(), 'list', period] as const,
  payments: () => [...adminKeys.all, 'payments'] as const,
  paymentsList: (filters?: AdminPaymentFilters) => [...adminKeys.payments(), 'list', filters] as const,
  payment: (id: string) => [...adminKeys.payments(), 'detail', id] as const,
  payouts: () => [...adminKeys.all, 'payouts'] as const,
  payoutStats: () => [...adminKeys.payouts(), 'stats'] as const,
  payoutMerchants: () => [...adminKeys.payouts(), 'merchants'] as const,
  payoutMerchantsList: (filters?: AdminPayoutMerchantsFilters) => [...adminKeys.payoutMerchants(), 'list', filters] as const,
  payoutsList: (filters?: AdminPayoutFilters) => [...adminKeys.payouts(), 'list', filters] as const,
  payout: (id: string) => [...adminKeys.payouts(), 'detail', id] as const,
  merchants: () => [...adminKeys.all, 'merchants'] as const,
  merchantSelection: () => [...adminKeys.merchants(), 'selection'] as const,
  merchantStats: () => [...adminKeys.all, 'merchantStats'] as const,
  merchantStatsList: (filters?: MerchantStatisticsFilters) => [...adminKeys.merchantStats(), 'list', filters] as const,
};

// ===== ADMIN AUTH HOOKS =====

// Hook to check admin authentication
export function useAdminAuth() {
  const query = useQuery({
    queryKey: adminKeys.auth(),
    queryFn: async () => {
      try {
        console.log('🔍 Checking admin auth...');
        const response = await api.get<AdminAuthResponse>('/admin/auth');
        console.log('✅ Admin auth successful:', response);
        return response.user;
      } catch (error: any) {
        console.error('❌ Admin auth failed:', error);
        throw error;
      }
    },
    retry: false, // Don't retry on auth failure
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  return {
    ...query,
    isAuthenticated: query.isSuccess && !!query.data,
    adminUser: query.data,
  };
}

// ===== ADMIN DASHBOARD STATS HOOKS =====

// Hook to get admin dashboard statistics
export function useAdminDashboardStats(period: string = '30d') {
  return useQuery({
    queryKey: adminKeys.statsList(period),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (period) {
        params.append('period', period);
      }
      
      const queryString = params.toString();
      const response = await api.get<AdminStatsApiResponse>(
        `/admin/statistics${queryString ? `?${queryString}` : ''}`
      );
      
      console.log('🔍 Admin stats API response:', response);
      
      // ✅ FIXED: Transform API response to match expected interface
      const overview = response.result;
      const transformedStats: AdminDashboardStats = {
        totalRevenue: overview.totalRevenue,
        totalUsers: overview.totalShops, // Map totalShops to totalUsers
        totalPayments: overview.totalPayments,
        averagePayment: overview.totalPayments > 0 ? overview.totalRevenue / overview.totalPayments : 0,
        dailyRevenue: [] // API doesn't provide this yet, so empty array
      };
      
      console.log('🔍 Transformed stats:', transformedStats);
      
      return transformedStats;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

// ===== ADMIN PAYMENTS HOOKS =====

// Hook to get admin payments with filters and pagination
export function useAdminPayments(filters?: AdminPaymentFilters) {
  return useQuery({
    queryKey: adminKeys.paymentsList(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.status) params.append('status', filters.status);
      if (filters?.gateway) params.append('gateway', filters.gateway);
      if (filters?.shopId) params.append('shopId', filters.shopId);
      if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters?.dateTo) params.append('dateTo', filters.dateTo);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.currency) params.append('currency', filters.currency);
      
      const queryString = params.toString();
      const response = await api.get<AdminPaymentsResponse>(
        `/admin/payments${queryString ? `?${queryString}` : ''}`
      );
      
      return response;
    },
    keepPreviousData: true,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Hook to get single admin payment by ID
export function useAdminPayment(id: string) {
  return useQuery({
    queryKey: adminKeys.payment(id),
    queryFn: async () => {
      const response = await api.get<AdminPaymentResponse>(`/admin/payments/${id}`);
      return response.result;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook to update payment status
export function useUpdatePaymentStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePaymentStatusData }) => {
      const response = await api.put<AdminPaymentResponse>(`/admin/payments/${id}`, data);
      return response.result;
    },
    onSuccess: (data, variables) => {
      // Invalidate payments list
      queryClient.invalidateQueries({ queryKey: adminKeys.payments() });
      // Update specific payment cache
      queryClient.setQueryData(adminKeys.payment(variables.id), data);
    },
  });
}

// ===== NEW: MERCHANT SELECTION HOOK =====

// Hook to get merchant selection list for filters
export function useAdminMerchantSelection() {
  return useQuery({
    queryKey: adminKeys.merchantSelection(),
    queryFn: async () => {
      const response = await api.get<MerchantSelectionResponse>('/admin/merchants/selection');
      return response.result;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes - merchants don't change often
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

// ===== ADMIN PAYOUT HOOKS =====

// ✅ FIXED: Hook to get admin payout statistics - now matches actual API response
export function useAdminPayoutStats() {
  return useQuery({
    queryKey: adminKeys.payoutStats(),
    queryFn: async () => {
      const response = await api.get<{ success: boolean; result: AdminPayoutStats }>('/admin/payout/stats');
      
      console.log('🔍 Admin payout stats API response:', response);
      
      // ✅ FIXED: Return the exact structure from API
      return response.result;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook to get merchants awaiting payout
export function useAdminPayoutMerchants(filters?: AdminPayoutMerchantsFilters) {
  return useQuery({
    queryKey: adminKeys.payoutMerchantsList(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.search) params.append('search', filters.search);
      if (filters?.minAmount) params.append('minAmount', filters.minAmount.toString());
      
      const queryString = params.toString();
      const response = await api.get<AdminPayoutMerchantsResponse>(
        `/admin/payout/merchants${queryString ? `?${queryString}` : ''}`
      );
      
      return response;
    },
    keepPreviousData: true,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Hook to get admin payouts with filters and pagination
export function useAdminPayouts(filters?: AdminPayoutFilters) {
  return useQuery({
    queryKey: adminKeys.payoutsList(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.search) params.append('search', filters.search);
      if (filters?.network) params.append('network', filters.network);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.periodFrom) params.append('periodFrom', filters.periodFrom);
      if (filters?.periodTo) params.append('periodTo', filters.periodTo);
      
      const queryString = params.toString();
      const response = await api.get<AdminPayoutsResponse>(
        `/admin/payouts${queryString ? `?${queryString}` : ''}`
      );
      
      return response;
    },
    keepPreviousData: true,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Hook to create a new payout with period validation
export function useCreatePayout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreatePayoutData) => {
      // Client-side validation for period fields
      if (data.periodFrom && !data.periodTo) {
        throw new Error('If periodFrom is specified, periodTo must also be provided');
      }
      if (data.periodTo && !data.periodFrom) {
        throw new Error('If periodTo is specified, periodFrom must also be provided');
      }
      if (data.periodFrom && data.periodTo) {
        const fromDate = new Date(data.periodFrom);
        const toDate = new Date(data.periodTo);
        const now = new Date();
        
        if (fromDate >= toDate) {
          throw new Error('periodFrom must be earlier than periodTo');
        }
        if (toDate > now) {
          throw new Error('periodTo cannot be a future date');
        }
      }
      
      const response = await api.post<{ success: boolean; result: AdminPayout }>('/admin/payout', data);
      return response.result;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: adminKeys.payouts() });
      queryClient.invalidateQueries({ queryKey: adminKeys.payoutMerchants() });
      queryClient.invalidateQueries({ queryKey: adminKeys.payoutStats() });
    },
  });
}

// Hook to delete a payout
export function useDeletePayout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/payout/${id}`);
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: adminKeys.payouts() });
      queryClient.invalidateQueries({ queryKey: adminKeys.payoutMerchants() });
      queryClient.invalidateQueries({ queryKey: adminKeys.payoutStats() });
    },
  });
}

// ===== NEW: MERCHANT STATISTICS HOOKS =====

// Hook to get merchant statistics
export function useAdminMerchantStatistics(filters: MerchantStatisticsFilters) {
  return useQuery({
    queryKey: adminKeys.merchantStatsList(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      
      params.append('shopId', filters.shopId);
      if (filters.period) params.append('period', filters.period);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      
      const queryString = params.toString();
      const response = await api.get<MerchantStatisticsResponse>(
        `/admin/merchant-statistics?${queryString}`
      );
      
      return response.result;
    },
    enabled: !!filters.shopId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ===== MAIN ADMIN HOOK =====

// Main hook that provides all admin functionality
export function useAdmin() {
  const auth = useAdminAuth();
  
  return {
    // Auth
    ...auth,
    
    // Stats
    useStats: useAdminDashboardStats,
    
    // Payments
    usePayments: useAdminPayments,
    usePayment: useAdminPayment,
    useUpdatePaymentStatus: useUpdatePaymentStatus,
    useMerchantSelection: useAdminMerchantSelection,
    
    // Payouts
    usePayoutStats: useAdminPayoutStats,
    usePayoutMerchants: useAdminPayoutMerchants,
    usePayouts: useAdminPayouts,
    useCreatePayout: useCreatePayout,
    useDeletePayout: useDeletePayout,
    
    // Merchant Statistics
    useMerchantStatistics: useAdminMerchantStatistics,
    
    // Query keys for external use
    queryKeys: adminKeys,
  };
}

// Export individual hooks for specific use cases
export { useAdminAuth as useAdminAuthOnly };
export { useAdminDashboardStats as useAdminStatsOnly };
export { useAdminPayments as useAdminPaymentsOnly };
export { useAdminPayment as useAdminPaymentOnly };
export { useUpdatePaymentStatus as useUpdatePaymentStatusOnly };
export { useAdminPayoutStats as useAdminPayoutStatsOnly };
export { useAdminPayoutMerchants as useAdminPayoutMerchantsOnly };
export { useAdminPayouts as useAdminPayoutsOnly };
export { useCreatePayout as useCreatePayoutOnly };
export { useDeletePayout as useDeletePayoutOnly };
export { useAdminMerchantStatistics as useAdminMerchantStatisticsOnly };