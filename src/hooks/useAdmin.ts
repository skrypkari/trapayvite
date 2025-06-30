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
    overview: {
      totalShops: number;
      activeShops: number;
      totalPayments: number;
      successfulPayments: number;
      totalRevenue: number;
      conversionRate: number;
    };
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

// Admin Payment Types - ✅ UPDATED: Added CHARGEBACK and REFUND statuses, failure_message and tx_urls
export interface AdminPayment {
  id: string;
  shopId: string;
  shopName: string;
  shopUsername: string;
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
  // ✅ NEW: Chargeback specific fields
  chargebackAmount?: number;
  notes?: string;
  // ✅ NEW: Failure message and transaction URLs
  failure_message?: string;
  tx_urls?: string[];
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

// ✅ UPDATED: Added chargeback and refund specific fields
export interface UpdatePaymentStatusData {
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'EXPIRED' | 'FAILED' | 'CHARGEBACK' | 'REFUND';
  notes?: string;
  chargebackAmount?: number; // Required for CHARGEBACK status
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
      const overview = response.result.overview;
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