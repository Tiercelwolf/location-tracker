import React, { useState } from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonIcon,
  IonText,
  IonSegment,
  IonSegmentButton,
  IonLoading,
  IonBackButton,
  IonButtons,
  IonAlert
} from '@ionic/react';
import {
  personOutline,
  mailOutline,
  phonePortraitOutline,
  lockClosedOutline,
  checkmarkOutline,
  keyOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import AuthService, { RegisterRequest } from '../services/auth.service';

const Register: React.FC = () => {
  const history = useHistory();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState('email');
  const [verificationSent, setVerificationSent] = useState(false);
  
  // Form fields
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  
  // Validation states
  const [usernameError, setUsernameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [verificationCodeError, setVerificationCodeError] = useState('');
  
  // Username validation with server check
  const validateUsername = async (username: string) => {
    if (!username) {
      setUsernameError('Username is required');
      return false;
    }
    
    if (username.length < 4) {
      setUsernameError('Username must be at least 4 characters');
      return false;
    }
    
    try {
      // Server check for username availability
      const isAvailable = await AuthService.checkUsernameAvailability(username);
      if (!isAvailable) {
        setUsernameError('This username is already taken');
        return false;
      }
    } catch (error) {
      console.error('Error checking username:', error);
      // Don't set error - we'll continue with client-side validation only
    }
    
    setUsernameError('');
    return true;
  };
  
  // Phone validation
  const validatePhone = (phone: string) => {
    if (!phone) {
      setPhoneError('Phone number is required');
      return false;
    }
    
    const phoneRegex = /^\d{10,15}$/;
    if (!phoneRegex.test(phone)) {
      setPhoneError('Please enter a valid phone number');
      return false;
    }
    
    setPhoneError('');
    return true;
  };
  
  // Email validation
  const validateEmail = (email: string) => {
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    
    setEmailError('');
    return true;
  };
  
  // Password validation
  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }
    
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return false;
    }
    
    // Check for a strong password (contains letters, numbers, special chars)
    const strongPasswordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!strongPasswordRegex.test(password)) {
      setPasswordError('Password must include letters, numbers, and special characters');
      return false;
    }
    
    setPasswordError('');
    return true;
  };
  
  // Confirm password validation
  const validateConfirmPassword = (confirmPassword: string) => {
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      return false;
    }
    
    if (confirmPassword !== password) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    }
    
    setConfirmPasswordError('');
    return true;
  };
  
  // Verification code validation
  const validateVerificationCode = (verificationCode: string) => {
    if (!verificationCode) {
      setVerificationCodeError('Verification code is required');
      return false;
    }
    
    if (verificationCode.length !== 6) {
      setVerificationCodeError('Verification code must be 6 digits');
      return false;
    }
    
    setVerificationCodeError('');
    return true;
  };
  
  // Validate all fields before submission
  const validateForm = async () => {
    const isUsernameValid = await validateUsername(username);
    const isPhoneValid = validatePhone(phone);
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);
    const isVerificationCodeValid = validateVerificationCode(verificationCode);
    
    return (
      isUsernameValid &&
      isPhoneValid &&
      isEmailValid &&
      isPasswordValid &&
      isConfirmPasswordValid &&
      isVerificationCodeValid
    );
  };
  
  // Handle verification method change
  const handleVerificationMethodChange = (event: CustomEvent) => {
    setVerificationMethod(event.detail.value);
    setVerificationSent(false);
    setVerificationCode('');
    setVerificationCodeError('');
  };
  
  // Send verification code
  const sendVerificationCode = async () => {
    const target = verificationMethod === 'email' ? email : phone;
    
    if (verificationMethod === 'email') {
      if (!validateEmail(email)) {
        return;
      }
    } else {
      if (!validatePhone(phone)) {
        return;
      }
    }
    
    setLoading(true);
    try {
      const success = await AuthService.requestVerificationCode(
        verificationMethod as 'email' | 'sms',
        target,
        'register'
      );
      
      if (success) {
        setVerificationSent(true);
      } else {
        setError('Failed to send verification code. Please try again.');
        setShowError(true);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to send verification code');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle registration
  const handleRegister = async () => {
    setError('');
    
    const isValid = await validateForm();
    if (!isValid) {
      return;
    }
    
    setLoading(true);
    try {
      const registerData: RegisterRequest = {
        username,
        email,
        phone,
        password,
        verificationCode,
        verificationMethod: verificationMethod as 'email' | 'sms'
      };
      
      const success = await AuthService.register(registerData);
      
      if (success) {
        // Registration successful - redirect to login
        history.replace('/login');
      } else {
        throw new Error('Registration failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.response?.data?.message || error.message || 'Registration failed');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/login" />
          </IonButtons>
          <IonTitle>Register</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="max-w-md mx-auto px-4 py-2 pb-8">
          <h1 className="text-xl font-bold text-primary-500 text-center mb-6">Create Account</h1>
          
          <div className="flex flex-col">
            {/* Username */}
            <IonItem className={`mb-3 rounded-lg ${usernameError ? 'border border-red-500' : ''}`}>
              <IonIcon icon={personOutline} slot="start" />
              <IonInput
                label="Username"
                type="text"
                value={username}
                onIonInput={(e) => setUsername(e.detail.value!)}
                onIonBlur={async () => await validateUsername(username)}
                labelPlacement="floating"
                placeholder="Choose a unique username"
              />
            </IonItem>
            {usernameError && <div className="-mt-2 mb-3 ml-10 text-xs text-red-500"><IonText>{usernameError}</IonText></div>}
            
            {/* Phone */}
            <IonItem className={`mb-3 rounded-lg ${phoneError ? 'border border-red-500' : ''}`}>
              <IonIcon icon={phonePortraitOutline} slot="start" />
              <IonInput
                label="Phone Number"
                type="tel"
                value={phone}
                onIonInput={(e) => setPhone(e.detail.value!)}
                onIonBlur={() => validatePhone(phone)}
                labelPlacement="floating"
                placeholder="Enter your phone number"
              />
            </IonItem>
            {phoneError && <div className="-mt-2 mb-3 ml-10 text-xs text-red-500"><IonText>{phoneError}</IonText></div>}
            
            {/* Email */}
            <IonItem className={`mb-3 rounded-lg ${emailError ? 'border border-red-500' : ''}`}>
              <IonIcon icon={mailOutline} slot="start" />
              <IonInput
                label="Email"
                type="email"
                value={email}
                onIonInput={(e) => setEmail(e.detail.value!)}
                onIonBlur={() => validateEmail(email)}
                labelPlacement="floating"
                placeholder="Enter your email address"
              />
            </IonItem>
            {emailError && <div className="-mt-2 mb-3 ml-10 text-xs text-red-500"><IonText>{emailError}</IonText></div>}
            
            {/* Password */}
            <IonItem className={`mb-3 rounded-lg ${passwordError ? 'border border-red-500' : ''}`}>
              <IonIcon icon={lockClosedOutline} slot="start" />
              <IonInput
                label="Password"
                type="password"
                value={password}
                onIonInput={(e) => setPassword(e.detail.value!)}
                onIonBlur={() => validatePassword(password)}
                labelPlacement="floating"
                placeholder="Create a strong password"
              />
            </IonItem>
            {passwordError && <div className="-mt-2 mb-3 ml-10 text-xs text-red-500"><IonText>{passwordError}</IonText></div>}
            
            {/* Confirm Password */}
            <IonItem className={`mb-3 rounded-lg ${confirmPasswordError ? 'border border-red-500' : ''}`}>
              <IonIcon icon={checkmarkOutline} slot="start" />
              <IonInput
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onIonInput={(e) => setConfirmPassword(e.detail.value!)}
                onIonBlur={() => validateConfirmPassword(confirmPassword)}
                labelPlacement="floating"
                placeholder="Confirm your password"
              />
            </IonItem>
            {confirmPasswordError && <div className="-mt-2 mb-3 ml-10 text-xs text-red-500"><IonText>{confirmPasswordError}</IonText></div>}
            
            {/* Verification Method Selector */}
            <div className="mt-6 mb-4">
              <IonLabel className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Verification Method
              </IonLabel>
              <IonSegment value={verificationMethod} onIonChange={handleVerificationMethodChange}>
                <IonSegmentButton value="email">
                  <IonLabel>Email</IonLabel>
                </IonSegmentButton>
                <IonSegmentButton value="sms">
                  <IonLabel>SMS</IonLabel>
                </IonSegmentButton>
              </IonSegment>
              
              <IonButton 
                expand="block" 
                fill="outline" 
                onClick={sendVerificationCode} 
                className="mt-4 mb-4 rounded-lg"
                disabled={verificationSent}
              >
                {verificationSent ? 'Code Sent' : `Send Code to ${verificationMethod === 'email' ? 'Email' : 'Phone'}`}
              </IonButton>
            </div>
            
            {/* Verification Code */}
            <IonItem className={`mb-3 rounded-lg ${verificationCodeError ? 'border border-red-500' : ''}`}>
              <IonIcon icon={keyOutline} slot="start" />
              <IonInput
                label="Verification Code"
                type="text"
                value={verificationCode}
                onIonInput={(e) => setVerificationCode(e.detail.value!)}
                labelPlacement="floating"
                placeholder="Enter 6-digit code"
              />
            </IonItem>
            {verificationCodeError && <div className="-mt-2 mb-3 ml-10 text-xs text-red-500"><IonText>{verificationCodeError}</IonText></div>}
            
            {/* Register Button */}
            <IonButton 
              expand="block" 
              onClick={handleRegister} 
              className="mt-6 h-12 font-semibold rounded-lg"
            >
              Create Account
            </IonButton>
            
            <div className="flex items-center justify-center mt-6">
              <IonText className="text-sm text-gray-600 dark:text-gray-400">
                Already have an account?
              </IonText>
              <IonButton fill="clear" routerLink="/login" className="text-sm font-semibold ml-1">
                Login
              </IonButton>
            </div>
          </div>
        </div>
        
        <IonLoading isOpen={loading} message="Please wait..." />
        
        <IonAlert
          isOpen={showError}
          onDidDismiss={() => setShowError(false)}
          header="Error"
          message={error}
          buttons={['OK']}
        />
      </IonContent>
    </IonPage>
  );
};

export default Register;