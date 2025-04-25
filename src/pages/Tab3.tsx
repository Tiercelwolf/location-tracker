import React, { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  IonListHeader,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonAlert,
  IonModal,
  IonButtons,
  IonToast,
  IonRefresher,
  IonRefresherContent,
  IonAvatar,
  IonItemDivider,
  IonChip,
  IonText,
} from '@ionic/react';
import {
  lockClosed,
  mailOutline,
  phonePortraitOutline,
  trashOutline,
} from 'ionicons/icons';
import { useAuth } from '../contexts/AuthContext';
import { RefresherEventDetail } from '@ionic/core';

const Tab3: React.FC = () => {
  // Context and state
  const { user, logout } = useAuth();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState('success');

  // Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showConfirmAlert, setShowConfirmAlert] = useState(false);
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});
  const [confirmMessage, setConfirmMessage] = useState('');

  // User lists state
  const [usersWhoCanViewMe, setUsersWhoCanViewMe] = useState<
    { id: string; name: string; email: string }[]
  >([
    { id: '1', name: 'John Doe', email: 'john@example.com' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
  ]);
  const [usersICanView, setUsersICanView] = useState<
    { id: string; name: string; email: string }[]
  >([
    { id: '3', name: 'Mike Johnson', email: 'mike@example.com' },
    { id: '4', name: 'Sarah Williams', email: 'sarah@example.com' },
  ]);

  // Form states
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [phoneForm, setPhoneForm] = useState({
    oldEmailVerification: '',
    newPhone: '',
    smsCode: '',
    emailCode: '',
    step: 1,
  });

  const [emailForm, setEmailForm] = useState({
    oldPhoneVerification: '',
    newEmail: '',
    smsCode: '',
    emailCode: '',
    step: 1,
  });

  // Cooldown check
  const [lastModified, setLastModified] = useState<{
    phone?: Date;
    email?: Date;
  }>({});

  // Check if user is in cooldown period
  const isInCooldown = (type: 'phone' | 'email') => {
    if (!lastModified[type]) return false;

    const cooldownDays = 7;
    const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000;
    const timeSinceLastModification =
      new Date().getTime() - lastModified[type]!.getTime();

    return timeSinceLastModification < cooldownMs;
  };

  // Get remaining cooldown days
  const getRemainingCooldownDays = (type: 'phone' | 'email') => {
    if (!lastModified[type]) return 0;

    const cooldownDays = 7;
    const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000;
    const timeSinceLastModification =
      new Date().getTime() - lastModified[type]!.getTime();
    const remainingMs = cooldownMs - timeSinceLastModification;

    return Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
  };

  // Handle refresh
  const handleRefresh = (event: CustomEvent<RefresherEventDetail>) => {
    setTimeout(() => {
      // Refresh data here
      event.detail.complete();
    }, 1000);
  };

  // Simulate sending verification code
  const sendVerificationCode = (
    method: 'email' | 'sms',
    destination: string,
  ) => {
    // In a real app, this would call an API
    setToastMessage(`Verification code sent to ${destination} by ${method}`);
    setToastColor('success');
    setShowToast(true);
    return '123456'; // Simulated code
  };

  // Password change handlers
  const handleChangePassword = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setToastMessage('New passwords do not match');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    // Password validation
    if (passwordForm.newPassword.length < 8) {
      setToastMessage('New password must be at least 8 characters');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    // In a real app, this would call an API
    setTimeout(() => {
      setShowPasswordModal(false);
      setToastMessage('Password updated successfully');
      setToastColor('success');
      setShowToast(true);
      setPasswordForm({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    }, 1000);
  };

  // Phone change handlers
  const handleChangePhone = () => {
    if (isInCooldown('email')) {
      setToastMessage(
        `Cannot change phone number. Email was modified recently. Please wait ${getRemainingCooldownDays('email')} more days.`,
      );
      setToastColor('warning');
      setShowToast(true);
      return;
    }

    if (phoneForm.step === 1) {
      // First step - verify old email
      // In a real app, this would validate the email code
      // For demo, we'll just proceed to next step
      setPhoneForm({ ...phoneForm, step: 2 });
    } else if (phoneForm.step === 2) {
      // Second step - verify new phone
      // In a real app, this would validate the SMS code
      setTimeout(() => {
        setShowPhoneModal(false);
        setToastMessage('Phone number updated successfully');
        setToastColor('success');
        setShowToast(true);
        setLastModified({ ...lastModified, phone: new Date() });
        setPhoneForm({
          oldEmailVerification: '',
          newPhone: '',
          smsCode: '',
          emailCode: '',
          step: 1,
        });
      }, 1000);
    }
  };

  // Email change handlers
  const handleChangeEmail = () => {
    if (isInCooldown('phone')) {
      setToastMessage(
        `Cannot change email. Phone was modified recently. Please wait ${getRemainingCooldownDays('phone')} more days.`,
      );
      setToastColor('warning');
      setShowToast(true);
      return;
    }

    if (emailForm.step === 1) {
      // First step - verify old phone
      // In a real app, this would validate the SMS code
      // For demo, we'll just proceed to next step
      setEmailForm({ ...emailForm, step: 2 });
    } else if (emailForm.step === 2) {
      // Second step - verify new email
      // In a real app, this would validate the email code
      setTimeout(() => {
        setShowEmailModal(false);
        setToastMessage('Email updated successfully');
        setToastColor('success');
        setShowToast(true);
        setLastModified({ ...lastModified, email: new Date() });
        setEmailForm({
          oldPhoneVerification: '',
          newEmail: '',
          smsCode: '',
          emailCode: '',
          step: 1,
        });
      }, 1000);
    }
  };

  // Privacy settings handlers
  const removeUserWhoCanViewMe = (userId: string) => {
    setConfirmMessage(
      "This will permanently revoke this user's access to view your location. Are you sure?",
    );
    setConfirmAction(() => () => {
      setUsersWhoCanViewMe(
        usersWhoCanViewMe.filter((user) => user.id !== userId),
      );
      setToastMessage('User removed from viewers list');
      setToastColor('success');
      setShowToast(true);
    });
    setShowConfirmAlert(true);
  };

  const removeUserICanView = (userId: string) => {
    setConfirmMessage(
      "This will permanently remove your access to view this user's location. Are you sure?",
    );
    setConfirmAction(() => () => {
      setUsersICanView(usersICanView.filter((user) => user.id !== userId));
      setToastMessage('User removed from your viewing list');
      setToastColor('success');
      setShowToast(true);
    });
    setShowConfirmAlert(true);
  };

  // Render password change modal
  const renderPasswordModal = () => (
    <IonModal
      isOpen={showPasswordModal}
      onDidDismiss={() => setShowPasswordModal(false)}
    >
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => setShowPasswordModal(false)}>
              Cancel
            </IonButton>
          </IonButtons>
          <IonTitle>Change Password</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleChangePassword} strong={true}>
              Save
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="space-y-4">
          <IonItem>
            <IonLabel position="stacked">Current Password</IonLabel>
            <IonInput
              type="password"
              value={passwordForm.oldPassword}
              onIonChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  oldPassword: e.detail.value || '',
                })
              }
            />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">New Password</IonLabel>
            <IonInput
              type="password"
              value={passwordForm.newPassword}
              onIonChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  newPassword: e.detail.value || '',
                })
              }
            />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Confirm New Password</IonLabel>
            <IonInput
              type="password"
              value={passwordForm.confirmPassword}
              onIonChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  confirmPassword: e.detail.value || '',
                })
              }
            />
          </IonItem>

          <IonText color="medium" className="text-sm">
            <p>
              Password must be at least 8 characters long and include a mix of
              letters, numbers, and special characters.
            </p>
          </IonText>
        </div>
      </IonContent>
    </IonModal>
  );

  // Render phone change modal
  const renderPhoneModal = () => (
    <IonModal
      isOpen={showPhoneModal}
      onDidDismiss={() => setShowPhoneModal(false)}
    >
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => setShowPhoneModal(false)}>
              Cancel
            </IonButton>
          </IonButtons>
          <IonTitle>Change Phone Number</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleChangePhone} strong={true}>
              {phoneForm.step === 1 ? 'Next' : 'Save'}
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {phoneForm.step === 1 ? (
          <div className="space-y-4">
            <IonText>
              <h2 className="text-lg font-medium mb-2">
                Step 1: Verify your email
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                We'll send a verification code to your current email address.
              </p>
            </IonText>

            <IonItem>
              <IonLabel position="stacked">Email Verification Code</IonLabel>
              <IonInput
                type="text"
                value={phoneForm.emailCode}
                onIonChange={(e) =>
                  setPhoneForm({
                    ...phoneForm,
                    emailCode: e.detail.value || '',
                  })
                }
              />
            </IonItem>

            <IonButton
              expand="block"
              fill="outline"
              onClick={() =>
                sendVerificationCode('email', 'your-email@example.com')
              }
            >
              Send Code
            </IonButton>
          </div>
        ) : (
          <div className="space-y-4">
            <IonText>
              <h2 className="text-lg font-medium mb-2">
                Step 2: Enter new phone number
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                We'll send a verification code to your new phone number.
              </p>
            </IonText>

            <IonItem>
              <IonLabel position="stacked">New Phone Number</IonLabel>
              <IonInput
                type="tel"
                value={phoneForm.newPhone}
                onIonChange={(e) =>
                  setPhoneForm({ ...phoneForm, newPhone: e.detail.value || '' })
                }
              />
            </IonItem>

            <IonButton
              expand="block"
              fill="outline"
              onClick={() => sendVerificationCode('sms', phoneForm.newPhone)}
              disabled={!phoneForm.newPhone}
            >
              Send SMS Code
            </IonButton>

            <IonItem>
              <IonLabel position="stacked">SMS Verification Code</IonLabel>
              <IonInput
                type="text"
                value={phoneForm.smsCode}
                onIonChange={(e) =>
                  setPhoneForm({ ...phoneForm, smsCode: e.detail.value || '' })
                }
              />
            </IonItem>
          </div>
        )}
      </IonContent>
    </IonModal>
  );

  // Render email change modal
  const renderEmailModal = () => (
    <IonModal
      isOpen={showEmailModal}
      onDidDismiss={() => setShowEmailModal(false)}
    >
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => setShowEmailModal(false)}>
              Cancel
            </IonButton>
          </IonButtons>
          <IonTitle>Change Email</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleChangeEmail} strong={true}>
              {emailForm.step === 1 ? 'Next' : 'Save'}
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {emailForm.step === 1 ? (
          <div className="space-y-4">
            <IonText>
              <h2 className="text-lg font-medium mb-2">
                Step 1: Verify your phone
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                We'll send a verification code to your current phone number.
              </p>
            </IonText>

            <IonItem>
              <IonLabel position="stacked">SMS Verification Code</IonLabel>
              <IonInput
                type="text"
                value={emailForm.smsCode}
                onIonChange={(e) =>
                  setEmailForm({ ...emailForm, smsCode: e.detail.value || '' })
                }
              />
            </IonItem>

            <IonButton
              expand="block"
              fill="outline"
              onClick={() => sendVerificationCode('sms', '+1234567890')}
            >
              Send Code
            </IonButton>
          </div>
        ) : (
          <div className="space-y-4">
            <IonText>
              <h2 className="text-lg font-medium mb-2">
                Step 2: Enter new email address
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                We'll send a verification code to your new email address.
              </p>
            </IonText>

            <IonItem>
              <IonLabel position="stacked">New Email Address</IonLabel>
              <IonInput
                type="email"
                value={emailForm.newEmail}
                onIonChange={(e) =>
                  setEmailForm({ ...emailForm, newEmail: e.detail.value || '' })
                }
              />
            </IonItem>

            <IonButton
              expand="block"
              fill="outline"
              onClick={() => sendVerificationCode('email', emailForm.newEmail)}
              disabled={!emailForm.newEmail}
            >
              Send Email Code
            </IonButton>

            <IonItem>
              <IonLabel position="stacked">Email Verification Code</IonLabel>
              <IonInput
                type="text"
                value={emailForm.emailCode}
                onIonChange={(e) =>
                  setEmailForm({
                    ...emailForm,
                    emailCode: e.detail.value || '',
                  })
                }
              />
            </IonItem>
          </div>
        )}
      </IonContent>
    </IonModal>
  );

  // Main render
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Profile</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        <div className="flex flex-col items-center p-4 bg-blue-50">
          <IonAvatar className="w-24 h-24 mb-2">
            <img
              src="https://ionicframework.com/docs/img/demos/avatar.svg"
              alt="Profile"
            />
          </IonAvatar>
          <h2 className="text-xl font-bold">
            {user?.displayName || 'User Name'}
          </h2>
          <p className="text-gray-600">{user?.email || 'user@example.com'}</p>
        </div>

        {/* Account Settings Section */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle className="text-lg">Account Settings</IonCardTitle>
          </IonCardHeader>
          <IonCardContent className="p-0">
            <IonList lines="full">
              <IonItem button detail onClick={() => setShowPasswordModal(true)}>
                <IonIcon icon={lockClosed} slot="start" color="primary" />
                <IonLabel>Change Password</IonLabel>
              </IonItem>

              <IonItem
                button
                detail
                onClick={() => {
                  if (isInCooldown('email')) {
                    setToastMessage(
                      `Cannot change phone number. Email was modified recently. Please wait ${getRemainingCooldownDays('email')} more days.`,
                    );
                    setToastColor('warning');
                    setShowToast(true);
                  } else {
                    setShowPhoneModal(true);
                  }
                }}
              >
                <IonIcon
                  icon={phonePortraitOutline}
                  slot="start"
                  color="primary"
                />
                <IonLabel>Change Phone Number</IonLabel>
                {isInCooldown('email') && (
                  <IonChip color="warning" slot="end">
                    {getRemainingCooldownDays('email')} days
                  </IonChip>
                )}
              </IonItem>

              <IonItem
                button
                detail
                onClick={() => {
                  if (isInCooldown('phone')) {
                    setToastMessage(
                      `Cannot change email. Phone was modified recently. Please wait ${getRemainingCooldownDays('phone')} more days.`,
                    );
                    setToastColor('warning');
                    setShowToast(true);
                  } else {
                    setShowEmailModal(true);
                  }
                }}
              >
                <IonIcon icon={mailOutline} slot="start" color="primary" />
                <IonLabel>Change Email</IonLabel>
                {isInCooldown('phone') && (
                  <IonChip color="warning" slot="end">
                    {getRemainingCooldownDays('phone')} days
                  </IonChip>
                )}
              </IonItem>
            </IonList>
          </IonCardContent>
        </IonCard>

        {/* Privacy Settings Section */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle className="text-lg">Privacy Settings</IonCardTitle>
          </IonCardHeader>
          <IonCardContent className="p-0">
            <IonList lines="full">
              <IonListHeader>
                <IonLabel>Users Who Can View My Location</IonLabel>
              </IonListHeader>

              {usersWhoCanViewMe.length > 0 ? (
                usersWhoCanViewMe.map((user) => (
                  <IonItem key={user.id}>
                    <IonLabel>
                      <h2>{user.name}</h2>
                      <p>{user.email}</p>
                    </IonLabel>
                    <IonButton
                      fill="clear"
                      color="danger"
                      onClick={() => removeUserWhoCanViewMe(user.id)}
                    >
                      <IonIcon slot="icon-only" icon={trashOutline} />
                    </IonButton>
                  </IonItem>
                ))
              ) : (
                <IonItem>
                  <IonLabel color="medium">
                    No users have access to view your location
                  </IonLabel>
                </IonItem>
              )}

              <IonItemDivider />

              <IonListHeader>
                <IonLabel>Users I Can View</IonLabel>
              </IonListHeader>

              {usersICanView.length > 0 ? (
                usersICanView.map((user) => (
                  <IonItem key={user.id}>
                    <IonLabel>
                      <h2>{user.name}</h2>
                      <p>{user.email}</p>
                    </IonLabel>
                    <IonButton
                      fill="clear"
                      color="danger"
                      onClick={() => removeUserICanView(user.id)}
                    >
                      <IonIcon slot="icon-only" icon={trashOutline} />
                    </IonButton>
                  </IonItem>
                ))
              ) : (
                <IonItem>
                  <IonLabel color="medium">
                    You don't have access to view any users
                  </IonLabel>
                </IonItem>
              )}

              <IonItem>
                <IonText color="medium" className="text-sm p-2">
                  <p>
                    Note: Removing a user is permanent. You will need to request
                    access again if you wish to restore it.
                  </p>
                </IonText>
              </IonItem>
            </IonList>
          </IonCardContent>
        </IonCard>

        {/* About Us Section */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle className="text-lg">About Us</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="space-y-2">
              <p>
                <strong>Version:</strong> 1.0.0
              </p>
              <p>
                <strong>Developer:</strong> LBS App Team
              </p>
              <p>
                <strong>Contact:</strong> support@lbsapp.example.com
              </p>
              <p className="text-sm text-gray-600 mt-4">
                © 2025 LBS App. All rights reserved.
              </p>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Logout Button */}
        <div className="p-4">
          <IonButton expand="block" color="danger" onClick={logout}>
            Logout
          </IonButton>
        </div>

        {/* Modals */}
        {renderPasswordModal()}
        {renderPhoneModal()}
        {renderEmailModal()}

        {/* Confirmation Alert */}
        <IonAlert
          isOpen={showConfirmAlert}
          onDidDismiss={() => setShowConfirmAlert(false)}
          header={'Confirm Action'}
          message={confirmMessage}
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
            },
            {
              text: 'Confirm',
              handler: () => {
                confirmAction();
              },
            },
          ]}
        />

        {/* Toast */}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          color={toastColor}
        />
      </IonContent>
    </IonPage>
  );
};

export default Tab3;
