import React, { useState } from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  IonIcon,
  IonText,
  IonLoading,
  IonAlert
} from '@ionic/react';
import { mailOutline, phonePortraitOutline, lockClosedOutline, keyOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import AuthService, { ForgotPasswordRequest, ResetPasswordRequest } from '../services/auth.service';

const ForgotPassword: React.FC = () => {
  const history = useHistory();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const [step, setStep] = useState(1);
  const [resetMethod, setResetMethod] = useState('email');
  const [verificationSent, setVerificationSent] = useState(false);
  const [resetToken, setResetToken] = useState('');
  
  // Form fields
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Validation states
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [verificationCodeError, setVerificationCodeError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  
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
  
  // Verification code validation
  const validateVerificationCode = (code: string) => {
    if (!code) {
      setVerificationCodeError('Verification code is required');
      return false;
    }
    
    if (code.length !== 6) {
      setVerificationCodeError('Verification code must be 6 digits');
      return false;
    }
    
    setVerificationCodeError('');
    return true;
  };
  
  // Password validation
  const validateNewPassword = (password: string) => {
    if (!password) {
      setNewPasswordError('New password is required');
      return false;
    }
    
    if (password.length < 8) {
      setNewPasswordError('Password must be at least 8 characters');
      return false;
    }
    
    // Check for a strong password (contains letters, numbers, special chars)
    const strongPasswordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!strongPasswordRegex.test(password)) {
      setNewPasswordError('Password must include letters, numbers, and special characters');
      return false;
    }
    
    setNewPasswordError('');
    return true;
  };
  
  // Confirm password validation
  const validateConfirmPassword = (confirmPwd: string) => {
    if (!confirmPwd) {
      setConfirmPasswordError('Please confirm your password');
      return false;
    }
    
    if (confirmPwd !== newPassword) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    }
    
    setConfirmPasswordError('');
    return true;
  };
  
  // Handle reset method change
  const handleResetMethodChange = (event: CustomEvent) => {
    setResetMethod(event.detail.value);
    setVerificationSent(false);
    setError('');
  };
  
  // Send verification code
  const sendVerificationCode = async () => {
    const target = resetMethod === 'email' ? email : phone;
    
    if (resetMethod === 'email') {
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
      // First, request to start the forgot password process
      const forgotPasswordData: ForgotPasswordRequest = {
        resetMethod: resetMethod as 'email' | 'sms'
      };
      
      if (resetMethod === 'email') {
        forgotPasswordData.email = email;
      } else {
        forgotPasswordData.phone = phone;
      }
      
      const success = await AuthService.forgotPassword(forgotPasswordData);
      
      if (success) {
        // If successful, request verification code
        const codeSent = await AuthService.requestVerificationCode(
          resetMethod as 'email' | 'sms',
          target,
          'reset'
        );
        
        if (codeSent) {
          setVerificationSent(true);
        } else {
          throw new Error('Failed to send verification code');
        }
      } else {
        throw new Error('Failed to start password reset process');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || error.message || 'Failed to send verification code');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };
  
  // Verify code and move to next step
  const verifyCodeAndProceed = async () => {
    if (!validateVerificationCode(verificationCode)) {
      return;
    }
    
    setLoading(true);
    try {
      // Verify the reset code and get reset token
      const token = await AuthService.verifyResetCode(
        verificationCode,
        resetMethod === 'email' ? email : undefined,
        resetMethod === 'sms' ? phone : undefined
      );
      
      // Save the token for password reset
      setResetToken(token);
      
      // Move to password reset step
      setStep(2);
    } catch (error: any) {
      setVerificationCodeError('Invalid verification code');
      setError(error.response?.data?.message || error.message || 'Verification failed');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };
  
  // Reset password
  const resetPassword = async () => {
    if (!validateNewPassword(newPassword) || !validateConfirmPassword(confirmPassword)) {
      return;
    }
    
    setLoading(true);
    try {
      const resetData: ResetPasswordRequest = {
        token: resetToken,
        newPassword: newPassword
      };
      
      const success = await AuthService.resetPassword(resetData);
      
      if (success) {
        // Password reset successful, redirect to login
        history.replace('/login');
      } else {
        throw new Error('Password reset failed');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || error.message || 'Password reset failed');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };
  
  // Render step 1: Verify identity
  const renderStep1 = () => {
    return (
      <>
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-primary-500 mb-2">Reset Your Password</h2>
          <p className="text-gray-600 dark:text-gray-400">First, let's verify your identity</p>
        </div>
        
        <IonSegment value={resetMethod} onIonChange={handleResetMethodChange} className="mb-6">
          <IonSegmentButton value="email">
            <IonLabel>Email</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="sms">
            <IonLabel>SMS</IonLabel>
          </IonSegmentButton>
        </IonSegment>
        
        {resetMethod === 'email' ? (
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
        ) : (
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
        )}
        
        {emailError && resetMethod === 'email' && (
          <div className="-mt-2 mb-3 ml-10 text-xs text-red-500"><IonText>{emailError}</IonText></div>
        )}
        
        {phoneError && resetMethod === 'sms' && (
          <div className="-mt-2 mb-3 ml-10 text-xs text-red-500"><IonText>{phoneError}</IonText></div>
        )}
        
        <IonButton 
          expand="block" 
          fill="outline" 
          onClick={sendVerificationCode} 
          className="mt-4 mb-4 rounded-lg"
          disabled={verificationSent}
        >
          {verificationSent ? 'Code Sent' : `Send Verification Code`}
        </IonButton>
        
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
        
        {verificationCodeError && (
          <div className="-mt-2 mb-3 ml-10 text-xs text-red-500"><IonText>{verificationCodeError}</IonText></div>
        )}
        
        <IonButton 
          expand="block" 
          onClick={verifyCodeAndProceed} 
          className="mt-6 h-12 font-semibold rounded-lg"
          disabled={!verificationSent}
        >
          Verify & Continue
        </IonButton>
      </>
    );
  };
  
  // Render step 2: Set new password
  const renderStep2 = () => {
    return (
      <>
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-primary-500 mb-2">Create New Password</h2>
          <p className="text-gray-600 dark:text-gray-400">Please enter and confirm your new password</p>
        </div>
        
        <IonItem className={`mb-3 rounded-lg ${newPasswordError ? 'border border-red-500' : ''}`}>
          <IonIcon icon={lockClosedOutline} slot="start" />
          <IonInput
            label="New Password"
            type="password"
            value={newPassword}
            onIonInput={(e) => setNewPassword(e.detail.value!)}
            onIonBlur={() => validateNewPassword(newPassword)}
            labelPlacement="floating"
            placeholder="Create a strong password"
          />
        </IonItem>
        
        {newPasswordError && (
          <div className="-mt-2 mb-3 ml-10 text-xs text-red-500"><IonText>{newPasswordError}</IonText></div>
        )}
        
        <IonItem className={`mb-3 rounded-lg ${confirmPasswordError ? 'border border-red-500' : ''}`}>
          <IonIcon icon={lockClosedOutline} slot="start" />
          <IonInput
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onIonInput={(e) => setConfirmPassword(e.detail.value!)}
            onIonBlur={() => validateConfirmPassword(confirmPassword)}
            labelPlacement="floating"
            placeholder="Confirm your new password"
          />
        </IonItem>
        
        {confirmPasswordError && (
          <div className="-mt-2 mb-3 ml-10 text-xs text-red-500"><IonText>{confirmPasswordError}</IonText></div>
        )}
        
        <IonButton 
          expand="block" 
          onClick={resetPassword} 
          className="mt-6 h-12 font-semibold rounded-lg"
        >
          Reset Password
        </IonButton>
      </>
    );
  };
  
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/login" />
          </IonButtons>
          <IonTitle>Forgot Password</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="max-w-md mx-auto px-4 py-2 pb-8">
          <div className="flex justify-center mb-6 mt-2">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${step === 1 ? 'bg-primary-500 scale-110' : 'bg-gray-400'}`}></div>
              <div className={`w-3 h-3 rounded-full ${step === 2 ? 'bg-primary-500 scale-110' : 'bg-gray-400'}`}></div>
            </div>
          </div>
          
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
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

export default ForgotPassword;