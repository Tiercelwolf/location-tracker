// import api from './api';
import api from './mockApi';

export interface LoginRequest {
  username?: string;
  password?: string;
  email?: string;
  phone?: string;
  verificationCode?: string;
  method: 'password' | 'email' | 'sms';
}

export interface RegisterRequest {
  username: string;
  email: string;
  phone: string;
  password: string;
  verificationCode: string;
  verificationMethod: 'email' | 'sms';
}

export interface ForgotPasswordRequest {
  email?: string;
  phone?: string;
  resetMethod: 'email' | 'sms';
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface AuthResponse {
  user: {
    id: string;
    username: string;
    email: string;
    phone?: string;
  };
  token: string;
}

const AuthService = {
  // Login with multiple methods
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  // Register new user
  register: async (data: RegisterRequest): Promise<boolean> => {
    const response = await api.post('/auth/register', data);
    return response.status === 201;
  },

  // Request verification code (for both email and SMS)
  requestVerificationCode: async (type: 'email' | 'sms', target: string, purpose: 'login' | 'register' | 'reset'): Promise<boolean> => {
    const response = await api.post('/auth/verification-code', { type, target, purpose });
    return response.status === 200;
  },

  // Initiate password reset
  forgotPassword: async (data: ForgotPasswordRequest): Promise<boolean> => {
    const response = await api.post('/auth/forgot-password', data);
    return response.status === 200;
  },

  // Verify the code for password reset
  verifyResetCode: async (code: string, email?: string, phone?: string): Promise<string> => {
    const response = await api.post('/auth/verify-reset-code', { code, email, phone });
    return response.data.token;
  },

  // Reset password with token
  resetPassword: async (data: ResetPasswordRequest): Promise<boolean> => {
    const response = await api.post('/auth/reset-password', data);
    return response.status === 200;
  },

  // Get current user info
  getCurrentUser: async (): Promise<any> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Verify if username is available
  checkUsernameAvailability: async (username: string): Promise<boolean> => {
    const response = await api.get(`/auth/check-username?username=${encodeURIComponent(username)}`);
    return response.data.available;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('isLoggedIn');
  }
};

export default AuthService;