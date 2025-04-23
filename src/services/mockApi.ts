// mockApi.ts - Mock implementation for auth requests

import { 
    LoginRequest, 
    RegisterRequest, 
    ForgotPasswordRequest, 
    ResetPasswordRequest,
    AuthResponse 
  } from './auth.service';
  
  // Mock database
  const mockUsers = [
    {
      id: 'usr_123456',
      username: 'testuser',
      email: 'test@example.com',
      phone: '+15551234567',
      password: 'Password123'
    },
    {
      id: 'usr_789012',
      username: 'johndoe',
      email: 'john@example.com',
      phone: '+15559876543',
      password: 'SecurePass456'
    }
  ];
  
  // Store for verification codes
  const verificationCodes = new Map<string, string>();
  
  // Store for reset tokens
  const resetTokens = new Map<string, string>();
  
  // Helper to create API response structure
  const createResponse = (data: any, status = 200) => {
    return {
      data,
      status,
      headers: {},
      config: {},
      statusText: status === 200 ? 'OK' : status === 201 ? 'Created' : 'Error'
    };
  };
  
  // Generate a random verification code
  const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();
  
  // Mock API implementation
  const mockApi = {
    post: async (url: string, data: any) => {
      // Add artificial delay to simulate network
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Route to appropriate handler based on URL
      switch (url) {
        case '/auth/login':
          return handleLogin(data);
        case '/auth/register':
          return handleRegister(data);
        case '/auth/verification-code':
          return handleVerificationCode(data);
        case '/auth/forgot-password':
          return handleForgotPassword(data);
        case '/auth/verify-reset-code':
          return handleVerifyResetCode(data);
        case '/auth/reset-password':
          return handleResetPassword(data);
        default:
          return createResponse({ error: 'Endpoint not found' }, 404);
      }
    },
    
    get: async (url: string) => {
      // Add artificial delay to simulate network
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (url === '/auth/me') {
        return handleGetCurrentUser();
      }
      
      if (url.startsWith('/auth/check-username')) {
        const username = decodeURIComponent(url.split('=')[1]);
        return handleCheckUsername(username);
      }
      
      return createResponse({ error: 'Endpoint not found' }, 404);
    }
  };
  
  // Handler functions for each endpoint
  function handleLogin(data: LoginRequest) {
    const { username, email, phone, password, verificationCode, method } = data;
    
    // Find user based on provided credentials
    let user;
    
    if (method === 'password') {
      // Login with username/email/phone + password
      user = mockUsers.find(u => 
        (username && u.username === username) || 
        (email && u.email === email) || 
        (phone && u.phone === phone)
      );
      
      if (!user || user.password !== password) {
        return createResponse({ error: 'Invalid credentials' }, 401);
      }
    } 
    else if (method === 'email' && email && verificationCode) {
      // Login with email + verification code
      user = mockUsers.find(u => u.email === email);
      const storedCode = verificationCodes.get(email);
      
      if (!user || !storedCode || storedCode !== verificationCode) {
        return createResponse({ error: 'Invalid verification code' }, 401);
      }
    } 
    else if (method === 'sms' && phone && verificationCode) {
      // Login with phone + verification code
      user = mockUsers.find(u => u.phone === phone);
      const storedCode = verificationCodes.get(phone);
      
      if (!user || !storedCode || storedCode !== verificationCode) {
        return createResponse({ error: 'Invalid verification code' }, 401);
      }
    } 
    else {
      return createResponse({ error: 'Invalid login method or missing data' }, 400);
    }
    
    // Generate mock token
    const token = `mock-jwt-token-${user.id}-${Date.now()}`;
    
    // Store token in localStorage for auth state simulation
    localStorage.setItem('authToken', token);
    localStorage.setItem('userId', user.id);
    
    // Return user data and token
    const authResponse: AuthResponse = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone
      },
      token
    };
    
    return createResponse(authResponse);
  }
  
  function handleRegister(data: RegisterRequest) {
    const { username, email, phone, password, verificationCode, verificationMethod } = data;
    
    // Check if user already exists
    const userExists = mockUsers.some(
      u => u.username === username || u.email === email || (phone && u.phone === phone)
    );
    
    if (userExists) {
      return createResponse({ error: 'User already exists' }, 409);
    }
    
    // Verify the code
    const target = verificationMethod === 'email' ? email : phone;
    const storedCode = verificationCodes.get(target);
    
    if (!storedCode || storedCode !== verificationCode) {
      return createResponse({ error: 'Invalid verification code' }, 400);
    }
    
    // Create new user
    const newUser = {
      id: `usr_${Date.now().toString().slice(-6)}`,
      username,
      email,
      phone,
      password
    };
    
    mockUsers.push(newUser);
    
    return createResponse({}, 201);
  }
  
  function handleVerificationCode(data: { type: 'email' | 'sms', target: string, purpose: 'login' | 'register' | 'reset' }) {
    const { type, target, purpose } = data;
    
    // Generate a verification code
    const code = generateCode();
    
    // Store code (in real system, this would be sent via email/SMS)
    verificationCodes.set(target, code);
    
    console.log(`[MOCK] Sending ${type} verification code to ${target} for ${purpose}: ${code}`);
    
    return createResponse({ message: 'Verification code sent successfully' });
  }
  
  function handleForgotPassword(data: ForgotPasswordRequest) {
    const { email, phone, resetMethod } = data;
    const target = resetMethod === 'email' ? email : phone;
    
    if (!target) {
      return createResponse({ error: 'Email or phone is required' }, 400);
    }
    
    // Find user
    // const userExists = mockUsers.some(
    //   u => (email && u.email === email) || (phone && u.phone === phone)
    // );
    
    // Always return success even if user doesn't exist (security best practice)
    
    // Generate code
    const code = generateCode();
    verificationCodes.set(target, code);
    
    console.log(`[MOCK] Password reset code for ${target}: ${code}`);
    
    return createResponse({ message: 'Reset instructions sent successfully' });
  }
  
  function handleVerifyResetCode(data: { code: string, email?: string, phone?: string }) {
    const { code, email, phone } = data;
    const target = email || phone;
    
    if (!target) {
      return createResponse({ error: 'Email or phone is required' }, 400);
    }
    
    const storedCode = verificationCodes.get(target);
    
    if (!storedCode || storedCode !== code) {
      return createResponse({ error: 'Invalid verification code' }, 400);
    }
    
    // Generate reset token
    const token = `reset-token-${Date.now()}`;
    resetTokens.set(token, target);
    
    return createResponse({ token });
  }
  
  function handleResetPassword(data: ResetPasswordRequest) {
    const { token, newPassword } = data;
    
    // Validate token
    const target = resetTokens.get(token);
    
    if (!target) {
      return createResponse({ error: 'Invalid or expired token' }, 400);
    }
    
    // Find user
    const user = mockUsers.find(
      u => u.email === target || u.phone === target
    );
    
    if (!user) {
      return createResponse({ error: 'User not found' }, 404);
    }
    
    // Update password
    user.password = newPassword;
    
    // Clear token
    resetTokens.delete(token);
    
    return createResponse({ message: 'Password reset successfully' });
  }
  
  function handleGetCurrentUser() {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      return createResponse({ error: 'Unauthorized' }, 401);
    }
    
    const userId = localStorage.getItem('userId');
    const user = mockUsers.find(u => u.id === userId);
    
    if (!user) {
      return createResponse({ error: 'User not found' }, 404);
    }
    
    return createResponse({
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone
    });
  }
  
  function handleCheckUsername(username: string) {
    const exists = mockUsers.some(user => user.username === username);
    return createResponse({ available: !exists });
  }
  
  export default mockApi;