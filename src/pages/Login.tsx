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
  IonSegment,
  IonSegmentButton,
  IonText,
  IonLoading,
  IonIcon,
  IonRouterLink,
  IonAlert
} from '@ionic/react';
import { logInOutline, mailOutline, phonePortraitOutline, lockClosedOutline, personOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthService, { LoginRequest } from '../services/auth.service';

const Login: React.FC = () => {
  const history = useHistory();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [loginMethod, setLoginMethod] = useState('password');
  
  // Password login state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Email verification login state
  const [email, setEmail] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  
  // SMS verification login state
  const [phone, setPhone] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [smsCodeSent, setSmsCodeSent] = useState(false);

  const handleLoginMethodChange = (event: CustomEvent) => {
    setLoginMethod(event.detail.value);
    setErrorMessage('');
  };

  const sendEmailVerificationCode = async () => {
    if (!email || !validateEmail(email)) {
      setErrorMessage('Please enter a valid email address');
      setShowError(true);
      return;
    }

    setLoading(true);
    try {
      const success = await AuthService.requestVerificationCode('email', email, 'login');
      if (success) {
        setEmailCodeSent(true);
      } else {
        setErrorMessage('Failed to send verification code. Please try again.');
        setShowError(true);
      }
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Failed to send verification code');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const sendSmsVerificationCode = async () => {
    if (!phone || !validatePhone(phone)) {
      setErrorMessage('Please enter a valid phone number');
      setShowError(true);
      return;
    }

    setLoading(true);
    try {
      const success = await AuthService.requestVerificationCode('sms', phone, 'login');
      if (success) {
        setSmsCodeSent(true);
      } else {
        setErrorMessage('Failed to send verification code. Please try again.');
        setShowError(true);
      }
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Failed to send verification code');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setErrorMessage('');
    setLoading(true);

    try {
      let loginData: LoginRequest;

      // Prepare login request based on method
      if (loginMethod === 'password') {
        if (!username) {
          throw new Error('Please enter your username or email');
        }
        if (!password) {
          throw new Error('Please enter your password');
        }
        loginData = {
          method: 'password',
          username,
          password
        };
      } 
      else if (loginMethod === 'email') {
        if (!email || !validateEmail(email)) {
          throw new Error('Please enter a valid email address');
        }
        if (!emailCode) {
          throw new Error('Please enter the verification code');
        }
        if (!emailCodeSent) {
          throw new Error('Please request a verification code first');
        }
        loginData = {
          method: 'email',
          email,
          verificationCode: emailCode
        };
      } 
      else if (loginMethod === 'sms') {
        if (!phone || !validatePhone(phone)) {
          throw new Error('Please enter a valid phone number');
        }
        if (!smsCode) {
          throw new Error('Please enter the verification code');
        }
        if (!smsCodeSent) {
          throw new Error('Please request a verification code first');
        }
        loginData = {
          method: 'sms',
          phone,
          verificationCode: smsCode
        };
      } else {
        throw new Error('Invalid login method');
      }

      // Make the API call
      const response = await AuthService.login(loginData);
      
      // Save auth data using context
      login(response.token, response.user);
      
      // Redirect to home page
      history.replace('/tabs/home');
    } catch (error: any) {
      console.error('Login error:', error);
      setErrorMessage(error.response?.data?.message || error.message || 'Login failed');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone: string) => {
    const re = /^\d{10,15}$/;
    return re.test(phone);
  };

  const renderPasswordLogin = () => {
    return (
      <>
        <IonItem className="mb-4 rounded-lg">
          <IonIcon icon={personOutline} slot="start" />
          <IonInput
            label="Username or Email"
            type="text"
            value={username}
            onIonInput={(e) => setUsername(e.detail.value!)}
            labelPlacement="floating"
            placeholder="Enter username or email"
          />
        </IonItem>

        <IonItem className="mb-4 rounded-lg">
          <IonIcon icon={lockClosedOutline} slot="start" />
          <IonInput
            label="Password"
            type="password"
            value={password}
            onIonInput={(e) => setPassword(e.detail.value!)}
            labelPlacement="floating"
            placeholder="Enter your password"
          />
        </IonItem>

        <div className="text-right mb-6">
          <IonRouterLink routerLink="/forgot-password" className="text-sm">
            Forgot Password?
          </IonRouterLink>
        </div>

        <IonButton expand="block" onClick={handleLogin} className="h-12 font-semibold rounded-lg">
          <IonIcon icon={logInOutline} slot="start" />
          Login
        </IonButton>
      </>
    );
  };

  const renderEmailLogin = () => {
    return (
      <>
        <IonItem className="mb-4 rounded-lg">
          <IonIcon icon={mailOutline} slot="start" />
          <IonInput
            label="Email"
            type="email"
            value={email}
            onIonInput={(e) => setEmail(e.detail.value!)}
            labelPlacement="floating"
            placeholder="Enter your email"
          />
        </IonItem>

        <IonButton 
          expand="block" 
          fill="outline" 
          onClick={sendEmailVerificationCode} 
          className="mb-4 rounded-lg"
          disabled={emailCodeSent}
        >
          {emailCodeSent ? 'Code Sent' : 'Send Verification Code'}
        </IonButton>

        <IonItem className="mb-4 rounded-lg">
          <IonIcon icon={lockClosedOutline} slot="start" />
          <IonInput
            label="Verification Code"
            type="text"
            value={emailCode}
            onIonInput={(e) => setEmailCode(e.detail.value!)}
            labelPlacement="floating"
            placeholder="Enter verification code"
          />
        </IonItem>

        <IonButton expand="block" onClick={handleLogin} className="h-12 font-semibold rounded-lg mt-4">
          <IonIcon icon={logInOutline} slot="start" />
          Login with Email
        </IonButton>
      </>
    );
  };

  const renderSmsLogin = () => {
    return (
      <>
        <IonItem className="mb-4 rounded-lg">
          <IonIcon icon={phonePortraitOutline} slot="start" />
          <IonInput
            label="Phone Number"
            type="tel"
            value={phone}
            onIonInput={(e) => setPhone(e.detail.value!)}
            labelPlacement="floating"
            placeholder="Enter your phone number"
          />
        </IonItem>

        <IonButton 
          expand="block" 
          fill="outline" 
          onClick={sendSmsVerificationCode} 
          className="mb-4 rounded-lg"
          disabled={smsCodeSent}
        >
          {smsCodeSent ? 'Code Sent' : 'Send Verification Code'}
        </IonButton>

        <IonItem className="mb-4 rounded-lg">
          <IonIcon icon={lockClosedOutline} slot="start" />
          <IonInput
            label="Verification Code"
            type="text"
            value={smsCode}
            onIonInput={(e) => setSmsCode(e.detail.value!)}
            labelPlacement="floating"
            placeholder="Enter verification code"
          />
        </IonItem>

        <IonButton expand="block" onClick={handleLogin} className="h-12 font-semibold rounded-lg mt-4">
          <IonIcon icon={logInOutline} slot="start" />
          Login with SMS
        </IonButton>
      </>
    );
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Login</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="max-w-md mx-auto px-4 py-4 flex flex-col">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-primary-500">Location Tracker</h1>
          </div>

          <IonSegment value={loginMethod} onIonChange={handleLoginMethodChange} className="mb-6">
            <IonSegmentButton value="password">
              <IonLabel>Password</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="email">
              <IonLabel>Email</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="sms">
              <IonLabel>SMS</IonLabel>
            </IonSegmentButton>
          </IonSegment>

          <div className="mb-8">
            {loginMethod === 'password' && renderPasswordLogin()}
            {loginMethod === 'email' && renderEmailLogin()}
            {loginMethod === 'sms' && renderSmsLogin()}
          </div>

          <div className="text-center mt-6">
            <IonText className="text-sm">Don't have an account?</IonText>
            <IonRouterLink routerLink="/register" className="ml-2 font-semibold text-sm">
              Register now
            </IonRouterLink>
          </div>
        </div>

        <IonLoading isOpen={loading} message="Please wait..." />
        
        <IonAlert
          isOpen={showError}
          onDidDismiss={() => setShowError(false)}
          header="Error"
          message={errorMessage}
          buttons={['OK']}
        />
      </IonContent>
    </IonPage>
  );
};

export default Login;