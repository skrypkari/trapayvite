import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Copy,
  Check,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Wallet,
  Timer,
  CreditCard,
  Shield,
  Loader2,
  ArrowRight,
  User,
  Mail
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { formatCurrency } from '../utils/currency';
import LoadingSpinner from '../components/LoadingSpinner';
import { api } from '../lib/api';
import { getGatewayIdSafe } from '../utils/gatewayMapping';

// ✅ NEW: Interface for MasterCard payment form data
interface MasterCardFormData {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  fullName: string; // ✅ CHANGED: Объединили firstName и lastName в одно поле
  email: string;
}

// ✅ NEW: Interface for MasterCard payment request
interface MasterCardPaymentRequest {
  cardData: {
    number: string;
    expire_month: string;
    expire_year: string;
    cvv: string;
  };
  cardHolder: {
    first_name: string;
    last_name: string;
    email: string;
    // ✅ REMOVED: country, post_code, city, address_line_1, phone - only keep cardholder and email for gateway 1111
  };
  browser: {
    accept_header: string;
    color_depth: number;
    ip: string;
    language: string;
    screen_height: number;
    screen_width: number;
    time_different: number;
    user_agent: string;
    java_enabled: number;
    window_height: number;
    window_width: number;
  };
}

// ✅ NEW: MasterCard Payment Form Component
const MasterCardForm: React.FC<{
  paymentData: PaymentData;
  urlParams?: URLSearchParams; // ✅ NEW: Добавили параметр для URL параметров
  onSuccess: (redirectUrl?: string) => void;
  onFailure: (reason: string, redirectUrl?: string) => void;
}> = ({ paymentData, urlParams, onSuccess, onFailure }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<MasterCardFormData>({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    fullName: '',
    email: ''
  });
  const [formErrors, setFormErrors] = useState<Partial<MasterCardFormData>>({});

  // ✅ NEW: Инициализация формы с параметрами из URL
  useEffect(() => {
    // Получаем параметры из URL
    const searchParams = urlParams || new URLSearchParams(window.location.search);
    const nameParam = searchParams.get('name');
    const emailParam = searchParams.get('email');

    console.log('🔍 URL параметры:', { name: nameParam, email: emailParam });

    if (nameParam || emailParam) {
      setFormData(prev => ({
        ...prev,
        fullName: nameParam || prev.fullName,
        email: emailParam || prev.email
      }));
      console.log('✅ Форма заполнена из URL параметров');
    }
  }, [urlParams]);

  // Get user's IP address
  const getUserIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || '127.0.0.1';
    } catch (error) {
      console.error('Failed to get IP:', error);
      return '127.0.0.1';
    }
  };

  // Get browser information
  const getBrowserInfo = () => {
    const timezoneOffset = new Date().getTimezoneOffset();
    
    // Map screen.colorDepth to valid values accepted by the API
    const getValidColorDepth = (depth: number): number => {
      const validDepths = [1, 4, 8, 15, 16, 24, 32];
      // Find the closest valid depth or default to 24
      const closest = validDepths.reduce((prev, curr) => 
        Math.abs(curr - depth) < Math.abs(prev - depth) ? curr : prev
      );
      return closest;
    };

    return {
      accept_header: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      color_depth: getValidColorDepth(screen.colorDepth || 24),
      language: navigator.language || 'en-US',
      screen_height: screen.height,
      screen_width: screen.width,
      time_different: -timezoneOffset,
      user_agent: navigator.userAgent,
      java_enabled: 0,
      window_height: window.innerHeight,
      window_width: window.innerWidth
    };
  };

  // ✅ NEW: Luhn algorithm validation function
  const validateLuhn = (cardNumber: string): boolean => {
    const digits = cardNumber.replace(/\s/g, '').split('').map(Number);
    let sum = 0;
    let isEven = false;

    // Process digits from right to left
    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = digits[i];

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  };

  const validateForm = (): boolean => {
    const errors: Partial<MasterCardFormData> = {};

    // Card number validation
    const cardNumber = formData.cardNumber.replace(/\s/g, '');
    if (!cardNumber) {
      errors.cardNumber = 'Card number is required';
    } else if (cardNumber.length < 13 || cardNumber.length > 19) {
      errors.cardNumber = 'Invalid card number length';
    } else if (!/^\d+$/.test(cardNumber)) {
      errors.cardNumber = 'Card number must contain only digits';
    } else if (!cardNumber.startsWith('5')) {
      errors.cardNumber = 'Card must be a MasterCard (starting with 5)';
    } else if (!validateLuhn(cardNumber)) {
      errors.cardNumber = 'Invalid card number (failed Luhn check)';
    }

    // Expiry validation
    const month = parseInt(formData.expiryMonth);
    if (!formData.expiryMonth || month < 1 || month > 12) {
      errors.expiryMonth = 'Valid month required (01-12)';
    }

    const year = parseInt(formData.expiryYear);
    const currentYear = new Date().getFullYear() % 100;
    if (!formData.expiryYear || year < currentYear) {
      errors.expiryYear = 'Valid future year required';
    }

    // CVV validation
    if (!formData.cvv || formData.cvv.length < 3 || formData.cvv.length > 4) {
      errors.cvv = 'Valid CVV required (3-4 digits)';
    } else if (!/^\d+$/.test(formData.cvv)) {
      errors.cvv = 'CVV must contain only digits';
    }

    // Cardholder validation
    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().split(' ').length < 2) {
      errors.fullName = 'Please enter your full name (first and last name)';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const formatCardNumber = (value: string): string => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setFormData(prev => ({ ...prev, cardNumber: formatted }));
    if (formErrors.cardNumber) {
      setFormErrors(prev => ({ ...prev, cardNumber: undefined }));
    }
  };

  const handleInputChange = (field: keyof MasterCardFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const userIP = await getUserIP();
      const browserInfo = getBrowserInfo();

      // ✅ NEW: Разделяем полное имя на имя и фамилию
      const nameParts = formData.fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || nameParts[0] || ''; // Если только одно слово, используем его как фамилию тоже

      const requestData: MasterCardPaymentRequest = {
        cardData: {
          number: formData.cardNumber.replace(/\s/g, ''),
          expire_month: formData.expiryMonth.padStart(2, '0'),
          expire_year: formData.expiryYear,
          cvv: formData.cvv
        },
        cardHolder: {
          first_name: firstName,
          last_name: lastName,
          email: formData.email.trim()
        },
        browser: {
          ...browserInfo,
          ip: userIP
        }
      };

      const response = await api.post<{
        success: boolean;
        message: string;
        result: {
          status: string;
          transactionId?: string;
          redirectUrl?: string;
          failureReason?: string;
          requires3ds?: boolean;
          gatewayPaymentId?: string;
          final?: boolean;
        };
      }>(`/payments/${paymentData.id}/process-mastercard`, requestData);

      // ✅ NEW: Handle 3DS verification requirement
      if (response.success && response.result.requires3ds && response.result.redirectUrl) {
        toast.info('3DS verification required. Redirecting...');
        // Redirect to 3DS verification page
        window.location.href = response.result.redirectUrl;
        return;
      }

      if (response.success && response.result.status === 'PAID') {
        toast.success('Payment processed successfully!');
        onSuccess(response.result.redirectUrl);
      } else {
        const reason = response.result?.failureReason || response.message || 'Payment failed';
        toast.error(reason);
        onFailure(reason, response.result?.redirectUrl);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Payment processing failed';
      toast.error(errorMessage);
      onFailure(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Card Payment</h2>
        <p className="text-gray-600 text-sm">
          Enter your card details to complete the payment
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card Information */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Card Information
          </h3>

          <div className="space-y-4">
            {/* Card Number */}
            <div>
              <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Card Number *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CreditCard className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleCardNumberChange}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-colors ${formErrors.cardNumber
                      ? 'border-gray-300 focus:border-gray-500 focus:ring-gray-200'
                      : 'border-gray-300 focus:border-gray-500 focus:ring-gray-200'
                    } focus:outline-none focus:ring-2`}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  disabled={isSubmitting}
                />
              </div>
              {formErrors.cardNumber && (
                <p className="mt-1 text-sm text-red-600">{formErrors.cardNumber}</p>
              )}
            </div>

            {/* Expiry and CVV */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="expiryMonth" className="block text-sm font-medium text-gray-700 mb-2">
                  Month *
                </label>
                <input
                  type="text"
                  id="expiryMonth"
                  value={formData.expiryMonth}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 2);
                    handleInputChange('expiryMonth', value);
                  }}
                  className={`w-full px-4 py-3 rounded-xl border transition-colors ${formErrors.expiryMonth
                      ? 'border-gray-300 focus:border-gray-500 focus:ring-gray-200'
                      : 'border-gray-300 focus:border-gray-500 focus:ring-gray-200'
                    } focus:outline-none focus:ring-2`}
                  placeholder="MM"
                  maxLength={2}
                  disabled={isSubmitting}
                />
                {formErrors.expiryMonth && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.expiryMonth}</p>
                )}
              </div>

              <div>
                <label htmlFor="expiryYear" className="block text-sm font-medium text-gray-700 mb-2">
                  Year *
                </label>
                <input
                  type="text"
                  id="expiryYear"
                  value={formData.expiryYear}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 2);
                    handleInputChange('expiryYear', value);
                  }}
                  className={`w-full px-4 py-3 rounded-xl border transition-colors ${formErrors.expiryYear
                      ? 'border-gray-300 focus:border-gray-500 focus:ring-gray-200'
                      : 'border-gray-300 focus:border-gray-500 focus:ring-gray-200'
                    } focus:outline-none focus:ring-2`}
                  placeholder="YY"
                  maxLength={2}
                  disabled={isSubmitting}
                />
                {formErrors.expiryYear && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.expiryYear}</p>
                )}
              </div>

              <div>
                <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-2">
                  CVV *
                </label>
                <input
                  type="text"
                  id="cvv"
                  value={formData.cvv}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                    handleInputChange('cvv', value);
                  }}
                  className={`w-full px-4 py-3 rounded-xl border transition-colors ${formErrors.cvv
                      ? 'border-gray-300 focus:border-gray-500 focus:ring-gray-200'
                      : 'border-gray-300 focus:border-gray-500 focus:ring-gray-200'
                    } focus:outline-none focus:ring-2`}
                  placeholder="123"
                  maxLength={4}
                  disabled={isSubmitting}
                />
                {formErrors.cvv && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.cvv}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Billing Information */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <User className="h-5 w-5 mr-2" />
            Billing Information
          </h3>

          <div className="space-y-4">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                id="fullName"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border transition-colors ${formErrors.fullName
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                  } focus:outline-none focus:ring-2`}
                placeholder="John Doe"
                disabled={isSubmitting}
              />
              {formErrors.fullName && (
                <p className="mt-1 text-sm text-red-600">{formErrors.fullName}</p>
              )}
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-colors ${formErrors.email
                        ? 'border-gray-300 focus:border-gray-500 focus:ring-gray-200'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                      } focus:outline-none focus:ring-2`}
                    placeholder="john@example.com"
                    disabled={isSubmitting}
                  />
                </div>
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-blue-900">Secure Payment</h4>
              <p className="mt-1 text-sm text-blue-700">
                Your payment information is encrypted and secure. We use industry-standard security measures to protect your data.
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary text-white py-4 px-6 rounded-xl font-medium hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Processing Payment...</span>
            </>
          ) : (
            <>
              <span>Pay {formatCurrency(paymentData.amount, paymentData.currency)}</span>
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

interface PaymentData {
  id: string;
  gateway: string;
  product_name: string;
  amount: number;
  currency: string;
  source_currency?: string;
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'EXPIRED' | 'FAILED';
  payment_url: string;
  success_url?: string;
  fail_url?: string;
  customer_email?: string;
  customer_name?: string;
  invoice_total_sum?: number;
  qr_code?: string;
  qr_url?: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  order_id?: string;
  merchant_brand?: string;
  external_payment_url?: string;
  gateway_order_id?: string;
  white_url?: string;
}

// ✅ NEW: Interface for test gateway payment details
interface TestGatewayPaymentData {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  merchantName: string;
  description: string;
  testInstructions: {
    successCard: string;
    failureCard: string;
    expiryDate: string;
    cvc: string;
    holderName: string;
  };
}

// ✅ NEW: Interface for card form data
interface CardFormData {
  cardNumber: string;
  cardHolderName: string;
  expiryMonth: string;
  expiryYear: string;
  cvc: string;
}

// ✅ NEW: Interface for customer info update
interface CustomerInfoUpdate {
  customerCountry?: string;
  customerIp?: string;
  customerUa?: string;
}

// ✅ NEW: Test Gateway Payment Form Component
const TestGatewayForm: React.FC<{
  paymentData: PaymentData;
  onSuccess: (redirectUrl?: string) => void;
  onFailure: (reason: string, redirectUrl?: string) => void;
}> = ({ paymentData, onSuccess, onFailure }) => {
  const [testPaymentData, setTestPaymentData] = useState<TestGatewayPaymentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CardFormData>({
    cardNumber: '',
    cardHolderName: '',
    expiryMonth: '',
    expiryYear: '',
    cvc: ''
  });
  const [formErrors, setFormErrors] = useState<Partial<CardFormData>>({});

  // Fetch test gateway payment details
  useEffect(() => {
    const fetchTestPaymentData = async () => {
      try {
        const response = await api.get<{ success: boolean; result: TestGatewayPaymentData }>(`/test-gateway/payment/${paymentData.id}`);
        if (response.success) {
          setTestPaymentData(response.result);
        } else {
          throw new Error('Failed to load test payment data');
        }
      } catch (error: any) {
        console.error('Failed to fetch test payment data:', error);
        toast.error('Failed to load payment form');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTestPaymentData();
  }, [paymentData.id]);

  const validateForm = (): boolean => {
    const errors: Partial<CardFormData> = {};

    // Card number validation
    const cardNumber = formData.cardNumber.replace(/\s/g, '');
    if (!cardNumber) {
      errors.cardNumber = 'Card number is required';
    } else if (cardNumber.length < 13 || cardNumber.length > 19) {
      errors.cardNumber = 'Invalid card number length';
    } else if (!/^\d+$/.test(cardNumber)) {
      errors.cardNumber = 'Card number must contain only digits';
    }

    // Cardholder name validation
    if (!formData.cardHolderName.trim()) {
      errors.cardHolderName = 'Cardholder name is required';
    }

    // Expiry month validation
    const month = parseInt(formData.expiryMonth);
    if (!formData.expiryMonth || month < 1 || month > 12) {
      errors.expiryMonth = 'Valid month required (01-12)';
    }

    // Expiry year validation
    const year = parseInt(formData.expiryYear);
    const currentYear = new Date().getFullYear() % 100;
    if (!formData.expiryYear || year < currentYear) {
      errors.expiryYear = 'Valid future year required';
    }

    // CVC validation
    if (!formData.cvc || formData.cvc.length < 3 || formData.cvc.length > 4) {
      errors.cvc = 'Valid CVC required (3-4 digits)';
    } else if (!/^\d+$/.test(formData.cvc)) {
      errors.cvc = 'CVC must contain only digits';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const formatCardNumber = (value: string): string => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setFormData(prev => ({ ...prev, cardNumber: formatted }));
    if (formErrors.cardNumber) {
      setFormErrors(prev => ({ ...prev, cardNumber: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post<{
        success: boolean;
        message: string;
        result: {
          status: string;
          transactionId?: string;
          redirectUrl?: string;
          failureReason?: string;
        };
      }>(`/test-gateway/process-card/${paymentData.id}`, {
        cardNumber: formData.cardNumber.replace(/\s/g, ''),
        cardHolderName: formData.cardHolderName,
        expiryMonth: formData.expiryMonth.padStart(2, '0'),
        expiryYear: formData.expiryYear,
        cvc: formData.cvc
      });

      if (response.success && response.result.status === 'PAID') {
        toast.success('Payment processed successfully!');
        onSuccess(response.result.redirectUrl);
      } else {
        const reason = response.result?.failureReason || response.message || 'Payment failed';
        toast.error(reason);
        onFailure(reason, response.result?.redirectUrl);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Payment processing failed';
      toast.error(errorMessage);
      onFailure(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Loading payment form...</p>
      </div>
    );
  }

  if (!testPaymentData) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-4" />
        <p className="text-red-600">Failed to load payment form</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Test Payment</h2>
        <p className="text-gray-600 text-sm">
          Enter your card details to complete the payment
        </p>
      </div>

      {/* Test Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <CreditCard className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-900">Test Instructions</h4>
            <div className="mt-2 text-sm text-blue-700 space-y-1">
              <p><strong>Success:</strong> Use card {testPaymentData.testInstructions.successCard}</p>
              <p><strong>Failure:</strong> Use any other card number</p>
              <p><strong>Expiry:</strong> {testPaymentData.testInstructions.expiryDate}</p>
              <p><strong>CVC:</strong> {testPaymentData.testInstructions.cvc}</p>
              <p><strong>Name:</strong> {testPaymentData.testInstructions.holderName}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Card Number */}
        <div>
          <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-2">
            Card Number *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CreditCard className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              id="cardNumber"
              value={formData.cardNumber}
              onChange={handleCardNumberChange}
              className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-colors ${formErrors.cardNumber
                  ? 'border-gray-300 focus:border-gray-500 focus:ring-gray-200'
                  : 'border-gray-300 focus:border-primary focus:ring-primary/20'
                } focus:outline-none focus:ring-2`}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              disabled={isSubmitting}
            />
          </div>
          {formErrors.cardNumber && (
            <p className="mt-1 text-sm text-red-600">{formErrors.cardNumber}</p>
          )}
        </div>

        {/* Cardholder Name */}
        <div>
          <label htmlFor="cardHolderName" className="block text-sm font-medium text-gray-700 mb-2">
            Cardholder Name *
          </label>
          <input
            type="text"
            id="cardHolderName"
            value={formData.cardHolderName}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, cardHolderName: e.target.value }));
              if (formErrors.cardHolderName) {
                setFormErrors(prev => ({ ...prev, cardHolderName: undefined }));
              }
            }}
            className={`w-full px-4 py-3 rounded-xl border transition-colors ${formErrors.cardHolderName
                ? 'border-gray-300 focus:border-gray-500 focus:ring-gray-200'
                : 'border-gray-300 focus:border-primary focus:ring-primary/20'
              } focus:outline-none focus:ring-2`}
            placeholder="John Doe"
            disabled={isSubmitting}
          />
          {formErrors.cardHolderName && (
            <p className="mt-1 text-sm text-red-600">{formErrors.cardHolderName}</p>
          )}
        </div>

        {/* Expiry and CVC */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="expiryMonth" className="block text-sm font-medium text-gray-700 mb-2">
              Month *
            </label>
            <input
              type="text"
              id="expiryMonth"
              value={formData.expiryMonth}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 2);
                setFormData(prev => ({ ...prev, expiryMonth: value }));
                if (formErrors.expiryMonth) {
                  setFormErrors(prev => ({ ...prev, expiryMonth: undefined }));
                }
              }}
              className={`w-full px-4 py-3 rounded-xl border transition-colors ${formErrors.expiryMonth
                  ? 'border-gray-300 focus:border-gray-500 focus:ring-gray-200'
                  : 'border-gray-300 focus:border-primary focus:ring-primary/20'
                } focus:outline-none focus:ring-2`}
              placeholder="MM"
              maxLength={2}
              disabled={isSubmitting}
            />
            {formErrors.expiryMonth && (
              <p className="mt-1 text-sm text-red-600">{formErrors.expiryMonth}</p>
            )}
          </div>

          <div>
            <label htmlFor="expiryYear" className="block text-sm font-medium text-gray-700 mb-2">
              Year *
            </label>
            <input
              type="text"
              id="expiryYear"
              value={formData.expiryYear}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 2);
                setFormData(prev => ({ ...prev, expiryYear: value }));
                if (formErrors.expiryYear) {
                  setFormErrors(prev => ({ ...prev, expiryYear: undefined }));
                }
              }}
              className={`w-full px-4 py-3 rounded-xl border transition-colors ${formErrors.expiryYear
                  ? 'border-gray-300 focus:border-gray-500 focus:ring-gray-200'
                  : 'border-gray-300 focus:border-primary focus:ring-primary/20'
                } focus:outline-none focus:ring-2`}
              placeholder="YY"
              maxLength={2}
              disabled={isSubmitting}
            />
            {formErrors.expiryYear && (
              <p className="mt-1 text-sm text-red-600">{formErrors.expiryYear}</p>
            )}
          </div>

          <div>
            <label htmlFor="cvc" className="block text-sm font-medium text-gray-700 mb-2">
              CVC *
            </label>
            <input
              type="text"
              id="cvc"
              value={formData.cvc}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                setFormData(prev => ({ ...prev, cvc: value }));
                if (formErrors.cvc) {
                  setFormErrors(prev => ({ ...prev, cvc: undefined }));
                }
              }}
              className={`w-full px-4 py-3 rounded-xl border transition-colors ${formErrors.cvc
                  ? 'border-gray-300 focus:border-gray-500 focus:ring-gray-200'
                  : 'border-gray-300 focus:border-primary focus:ring-primary/20'
                } focus:outline-none focus:ring-2`}
              placeholder="123"
              maxLength={4}
              disabled={isSubmitting}
            />
            {formErrors.cvc && (
              <p className="mt-1 text-sm text-red-600">{formErrors.cvc}</p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary text-white py-4 px-6 rounded-xl font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Processing Payment...</span>
            </>
          ) : (
            <>
              <span>Pay {formatCurrency(testPaymentData.amount, testPaymentData.currency)}</span>
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

const Payment: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation(); // ✅ NEW: Для получения URL параметров
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCopied, setShowCopied] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [customerInfoSent, setCustomerInfoSent] = useState(false); // ✅ NEW: Track if customer info was sent
  const [paymentResult, setPaymentResult] = useState<{
    status: 'success' | 'failure';
    message: string;
    redirectUrl?: string;
  } | null>(null);

  // ✅ NEW: Получаем URL параметры
  const urlParams = new URLSearchParams(location.search);

  // ✅ NEW: Function to get user's IP address
  const getUserIP = async (): Promise<string | null> => {
    try {
      // Try multiple IP services for reliability
      const ipServices = [
        'https://api.ipify.org?format=json',
        'https://ipapi.co/json/',
        'https://api.ip.sb/jsonip'
      ];

      for (const service of ipServices) {
        try {
          const response = await fetch(service);
          const data = await response.json();

          // Different services return IP in different fields
          const ip = data.ip || data.query || data.ipAddress;
          if (ip) {
            console.log('✅ Got user IP:', ip, 'from service:', service);
            return ip;
          }
        } catch (err) {
          console.warn('❌ Failed to get IP from service:', service, err);
          continue;
        }
      }

      console.warn('❌ Failed to get IP from all services');
      return null;
    } catch (error) {
      console.error('❌ Error getting user IP:', error);
      return null;
    }
  };

  // ✅ NEW: Function to get user's country from IP
  const getUserCountry = async (ip: string): Promise<string | null> => {
    try {
      // Use ipapi.co for country detection
      const response = await fetch(`https://ipapi.co/${ip}/json/`);
      const data = await response.json();

      const country = data.country_code || data.country;
      if (country) {
        console.log('✅ Got user country:', country, 'for IP:', ip);
        return country;
      }

      console.warn('❌ No country data for IP:', ip);
      return null;
    } catch (error) {
      console.error('❌ Error getting user country:', error);
      return null;
    }
  };

  // ✅ NEW: Function to send customer info to server
  const sendCustomerInfo = async (paymentId: string) => {
    if (customerInfoSent) {
      console.log('🔍 Customer info already sent for payment:', paymentId);
      return;
    }

    try {
      console.log('🔍 Collecting customer info for payment:', paymentId);

      // Get user agent
      const userAgent = navigator.userAgent;
      console.log('✅ Got user agent:', userAgent);

      // Get user IP
      const userIP = await getUserIP();
      if (!userIP) {
        console.warn('❌ Could not get user IP, skipping customer info update');
        return;
      }

      // Get user country
      const userCountry = await getUserCountry(userIP);

      // Prepare customer info
      const customerInfo: CustomerInfoUpdate = {
        customerIp: userIP,
        customerUa: userAgent
      };

      if (userCountry) {
        customerInfo.customerCountry = userCountry;
      }

      console.log('🔍 Sending customer info:', customerInfo);

      // Send to server
      await api.put(`/payments/${paymentId}/customer`, customerInfo);

      console.log('✅ Customer info sent successfully');
      setCustomerInfoSent(true);

    } catch (error) {
      console.error('❌ Failed to send customer info:', error);
      // Don't show error to user as this is background functionality
    }
  };

  // Fetch payment data
  useEffect(() => {
    const fetchPaymentData = async () => {
      if (!id) {
        setError('Payment ID is required');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`https://api.trapay.uk/api/payments/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch payment data');
        }

        if (data.success && data.result) {
          setPaymentData(data.result);

          // ✅ NEW: Send customer info after payment data is loaded
          sendCustomerInfo(data.result.id);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load payment');
        toast.error(err.message || 'Failed to load payment');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentData();
  }, [id]);

  // Timer for expiration
  useEffect(() => {
    if (!paymentData?.expires_at) return;

    const updateTimer = () => {
      const expiryTime = new Date(paymentData.expires_at!).getTime();
      const now = new Date().getTime();
      const difference = expiryTime - now;

      if (difference > 0) {
        setTimeLeft(Math.floor(difference / 1000));
      } else {
        setTimeLeft(0);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [paymentData?.expires_at]);

  // Poll for payment status updates
  useEffect(() => {
    if (!paymentData || (paymentData.status !== 'PENDING' && paymentData.status !== 'PROCESSING')) return;

    const pollStatus = async () => {
      try {
        const response = await fetch(`https://api.trapay.uk/api/payments/${id}`);
        const data = await response.json();

        if (data.success && data.result) {
          const newStatus = data.result.status;
          if (newStatus !== paymentData.status) {
            setPaymentData(prev => prev ? { ...prev, status: newStatus } : null);

            if (newStatus === 'PAID') {
              toast.success('Payment completed successfully!');
              if (paymentData.success_url) {
                window.location.href = paymentData.success_url;
              }
            } else if (newStatus === 'FAILED') {
              toast.error('Payment failed');
              if (paymentData.fail_url) {
                window.location.href = paymentData.fail_url;
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to poll payment status:', err);
      }
    };

    const interval = setInterval(pollStatus, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [id, paymentData]);

  // ✅ NEW: Handle test gateway payment results
  const handleTestPaymentSuccess = (redirectUrl?: string) => {
    setPaymentResult({
      status: 'success',
      message: 'Payment processed successfully!',
      redirectUrl
    });

    // Update payment data status
    if (paymentData) {
      setPaymentData(prev => prev ? { ...prev, status: 'PAID' } : null);
    }
  };

  const handleTestPaymentFailure = (reason: string, redirectUrl?: string) => {
    setPaymentResult({
      status: 'failure',
      message: reason,
      redirectUrl
    });

    // Update payment data status
    if (paymentData) {
      setPaymentData(prev => prev ? { ...prev, status: 'FAILED' } : null);
    }
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setShowCopied(type);
    setTimeout(() => setShowCopied(null), 2000);
    toast.success('Copied to clipboard');
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Get display order ID (order_id or fallback to id)
  const getDisplayOrderId = () => {
    return paymentData?.order_id || paymentData?.gateway_order_id || paymentData?.id || '';
  };

  // Маппинг для source_currency
  const cryptoCurrencyLabels: Record<string, string> = {
    USDT_TRX: 'USDT TRC-20',
    USDT: 'USDT ERC-20',
    USDC: 'USDC ERC-20',
    BTC: 'BTC',
    ETH: 'ETH',
    TON: 'TON',
    TRX: 'TRON',
  };


  const isTestGateway = paymentData && getGatewayIdSafe(paymentData.gateway) === '0000';
  const isMasterCardGateway = paymentData && getGatewayIdSafe(paymentData.gateway) === '1111';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error || !paymentData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl p-8 text-center"
          >
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-3">Payment Not Successful</h1>
            <p className="text-gray-600 mb-8">Please try again or contact the payment recipient.</p>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-primary text-white py-3 px-6 rounded-xl font-medium hover:bg-primary-dark transition-colors"
            >
              Go Back
            </button>
          </motion.div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <span>Powered by</span>
                <div className="flex items-center space-x-1">
                  <img src="/logo.png" alt="TRAPAY" className="h-5" />
                </div>
              </div>
              <span>•</span>
              <a href="https://t.me/trapay_sales" className="hover:text-gray-700 transition-colors">Support</a>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (paymentData?.white_url && !isTestGateway && !isMasterCardGateway) {
    return (
      <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
        <iframe
          src={paymentData.white_url}
          style={{ width: '100vw', height: '100vh', border: 'none' }}
          title="WhiteUrl Payment"
          allowFullScreen
        />
      </div>
    );
  }
  if (
    paymentData?.external_payment_url &&
    paymentData.external_payment_url.includes('tesoft') &&
    !isTestGateway && !isMasterCardGateway
  ) {
    return (
      <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
        <iframe
          src={paymentData.external_payment_url}
          style={{ width: '100vw', height: '100vh', border: 'none' }}
          title="External Payment"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-2xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-center min-h-screen">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg"
          >
            {/* Payment Card */}
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 bg-primary text-white">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-lg font-semibold truncate" title={getDisplayOrderId()}>
                      {getDisplayOrderId()}
                    </div>
                    {paymentData.merchant_brand && (
                      <div className="text-sm opacity-75 truncate mt-1" title={paymentData.merchant_brand}>
                        by {paymentData.merchant_brand}
                      </div>
                    )}
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <div className="text-lg font-semibold">
                      {formatCurrency(paymentData.amount, paymentData.currency)}
                    </div>
                    {paymentData.source_currency && (
                      <div className="text-sm opacity-75">
                        via {cryptoCurrencyLabels[paymentData.source_currency] || paymentData.source_currency}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="p-8">
                {/* ✅ NEW: Test Gateway Form */}
                {paymentData.status === 'PENDING' && isTestGateway && (
                  <TestGatewayForm
                    paymentData={paymentData}
                    onSuccess={handleTestPaymentSuccess}
                    onFailure={handleTestPaymentFailure}
                  />
                )}

                {/* ✅ NEW: MasterCard Gateway Form */}
                {paymentData.status === 'PENDING' && isMasterCardGateway && (
                  <MasterCardForm
                    paymentData={paymentData}
                    urlParams={urlParams}
                    onSuccess={handleTestPaymentSuccess}
                    onFailure={handleTestPaymentFailure}
                  />
                )}

                {/* Pending State */}
                {paymentData.status === 'PENDING' && !isTestGateway && !isMasterCardGateway && (
                  <div className="text-center space-y-6">
                    {/* QR Code Section for Plisio */}
                    {paymentData.gateway === '0001' && paymentData.qr_code && (
                      <>
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900 mb-2">Scan to Pay</h2>
                          <p className="text-gray-600 text-sm">
                            Send exactly {paymentData.invoice_total_sum} {paymentData.source_currency}
                          </p>
                        </div>

                        {/* QR Code */}
                        <div className="flex justify-center">
                          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                            <img
                              src={`${paymentData.qr_code}`}
                              alt="Payment QR Code"
                              className="w-48 h-48 object-contain"
                            />
                          </div>
                        </div>

                        {/* Wallet Address */}
                        {paymentData.qr_url && (
                          <div className="space-y-3">
                            <div className="text-sm font-medium text-gray-700">
                              Or copy wallet address:
                            </div>
                            <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                              <Wallet className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <code className="flex-1 text-xs font-mono text-gray-900 break-all">
                                {paymentData.qr_url}
                              </code>
                              <button
                                onClick={() => handleCopy(paymentData.qr_url!, 'wallet')}
                                className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                              >
                                {showCopied === 'wallet' ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Amount to Send */}
                        {paymentData.invoice_total_sum && paymentData.source_currency && (
                          <div className="space-y-3">
                            <div className="text-sm font-medium text-gray-700">
                              Amount to send:
                            </div>
                            <div className="flex items-center space-x-2 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                              <CreditCard className="h-5 w-5 text-blue-600 flex-shrink-0" />
                              <span className="flex-1 text-lg font-semibold text-blue-900">
                                {paymentData.invoice_total_sum} {cryptoCurrencyLabels[paymentData.source_currency] || paymentData.source_currency}
                              </span>
                              <button
                                onClick={() => handleCopy(paymentData.invoice_total_sum!.toString(), 'amount')}
                                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-colors flex-shrink-0"
                              >
                                {showCopied === 'amount' ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Timer */}
                        {timeLeft !== null && timeLeft > 0 && (
                          <div className="flex items-center justify-center space-x-2 text-orange-600">
                            <Timer className="h-4 w-4" />
                            <span className="font-mono text-sm font-medium">
                              {formatTime(timeLeft)}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* ✅ UPDATED: Processing State - Payment received, waiting for blockchain confirmation */}
                {paymentData.status === 'PROCESSING' && (
                  <div className="text-center space-y-6">
                    <div className="relative">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", duration: 0.6 }}
                        className="relative w-24 h-24 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto"
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <Loader2 className="h-12 w-12 text-white" />
                        </motion.div>
                      </motion.div>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Received!</h2>
                      <p className="text-gray-600">Your payment has been received and is being confirmed in the blockchain.</p>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <CheckCircle2 className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="flex-1 text-left">
                          <h4 className="text-lg font-semibold text-green-900 mb-2">Payment Confirmed</h4>
                          <div className="space-y-2 text-sm text-green-700">
                            <p>✅ Your payment has been successfully received</p>
                            <p>🔄 Waiting for blockchain confirmation</p>
                            <p>⏱️ This usually takes 1-5 minutes</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-start space-x-3">
                        <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-left">
                          <h4 className="text-sm font-medium text-blue-900">What happens next?</h4>
                          <p className="mt-1 text-sm text-blue-700">
                            Your transaction is being processed on the blockchain. Once confirmed,
                            you'll be automatically redirected to the success page.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Success State */}
                {(paymentData.status === 'PAID' || paymentResult?.status === 'success') && (
                  <div className="text-center space-y-6">
                    {/* Success Animation Background */}
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 rounded-full opacity-20 blur-3xl"></div>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", duration: 0.6 }}
                        className="relative w-24 h-24 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto"
                      >
                        <CheckCircle2 className="h-12 w-12 text-white" />
                      </motion.div>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment initiation completed</h2>
                      <p className="text-gray-600">
                        {paymentResult?.message || 'Thank you for using TRAPAY Payment services'}
                      </p>
                    </div>

                    {(paymentResult?.redirectUrl || paymentData.success_url) ? (
                      <a
                        href={paymentResult?.redirectUrl || paymentData.success_url}
                        className="inline-flex items-center justify-center w-full bg-primary text-white py-4 px-6 rounded-xl font-medium hover:bg-primary-dark transition-colors"
                      >
                        Return to merchant
                      </a>
                    ) : (
                      <button
                        onClick={() => navigate('/')}
                        className="inline-flex items-center justify-center w-full bg-primary text-white py-4 px-6 rounded-xl font-medium hover:bg-primary-dark transition-colors"
                      >
                        Return to merchant
                      </button>
                    )}
                  </div>
                )}

                {/* Failed State */}
                {(paymentData.status === 'FAILED' || paymentResult?.status === 'failure') && (
                  <div className="text-center space-y-6">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                      <XCircle className="h-8 w-8 text-red-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Not Successful</h2>
                      <p className="text-gray-600 text-sm">
                        {paymentResult?.message || 'Please try again or contact the payment recipient.'}
                      </p>
                    </div>
                    <div className="space-y-3">
                      <button
                        onClick={() => window.location.reload()}
                        className="w-full bg-primary text-white py-3 px-6 rounded-xl font-medium hover:bg-primary-dark transition-colors"
                      >
                        Try Again
                      </button>
                      {(paymentResult?.redirectUrl || paymentData.fail_url) && (
                        <a
                          href={paymentResult?.redirectUrl || paymentData.fail_url}
                          className="block w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                        >
                          Go Back
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Expired State */}
                {paymentData.status === 'EXPIRED' && (
                  <div className="text-center space-y-6">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                      <AlertTriangle className="h-8 w-8 text-orange-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Expired</h2>
                      <p className="text-gray-600 text-sm">
                        This payment link has expired. Please create a new payment.
                      </p>
                    </div>
                    {paymentData.fail_url && (
                      <a
                        href={paymentData.fail_url}
                        className="inline-flex items-center justify-center w-full bg-gray-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-gray-700 transition-colors"
                      >
                        Go Back
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center">
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <span>Powered by</span>
                  <div className="flex items-center space-x-1">
                    <img src="/logo.png" alt="TRAPAY" className="h-5" />
                  </div>
                </div>
                <span>•</span>
                <a href="https://t.me/trapay_sales" className="hover:text-gray-700 transition-colors">Support</a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Payment;