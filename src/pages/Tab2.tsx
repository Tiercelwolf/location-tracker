import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonIcon,
  IonCard,
  IonCardContent,
  IonButton,
  IonList,
  IonItem,
  IonAvatar,
  IonBadge,
  IonAlert,
  IonToast,
  IonLoading,
  // IonFab,
  // IonFabButton,
  IonFooter,
} from '@ionic/react';
import {
  qrCode,
  scanOutline,
  peopleCircleOutline,
  checkmarkCircle,
  closeCircle,
  download,
} from 'ionicons/icons';
import { useAuth } from '../contexts/AuthContext';
import {
  CapacitorBarcodeScanner,
  CapacitorBarcodeScannerOptions,
  CapacitorBarcodeScannerTypeHint,
  CapacitorBarcodeScannerCameraDirection,
} from '@capacitor/barcode-scanner';
import { Capacitor } from '@capacitor/core';
import { QRCodeCanvas as QRCode } from 'qrcode.react';
import './Tab2.css';

// Interface for location sharing request
interface SharingRequest {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  requestTime: string;
  status: 'pending' | 'approved' | 'rejected';
}

const Tab2: React.FC = () => {
  // State management
  const [activeSegment, setActiveSegment] = useState<string>('mySharing');
  const [scannerActive, setScannerActive] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sharingRequests, setSharingRequests] = useState<SharingRequest[]>([]);

  // Access auth context
  const { user } = useAuth();

  // Fetch sharing requests
  useEffect(() => {
    // This would be an API call in a real implementation
    // Here we're mocking some example data
    const mockSharingRequests = [
      {
        id: '1',
        userId: 'user123',
        userName: 'Alice Smith',
        userAvatar: 'https://i.pravatar.cc/300?u=alice',
        requestTime: new Date(Date.now() - 3600000).toLocaleString(),
        status: 'pending',
      },
      {
        id: '2',
        userId: 'user456',
        userName: 'Bob Johnson',
        userAvatar: 'https://i.pravatar.cc/300?u=bob',
        requestTime: new Date(Date.now() - 7200000).toLocaleString(),
        status: 'pending',
      },
    ] as SharingRequest[];

    setSharingRequests(mockSharingRequests);
  }, []);

  // QR Scanner functions
  const startScan = async () => {
    // Check if we're on a real device
    if (!Capacitor.isNativePlatform()) {
      setAlertMessage('QR scanning is only available on physical devices');
      setShowAlert(true);
      return;
    }

    try {
      // Set scanner active state for UI
      setScannerActive(true);

      // Use the scanBarcode method with the updated CapacitorBarcodeScanner class
      const options: CapacitorBarcodeScannerOptions = {
        hint: CapacitorBarcodeScannerTypeHint.QR_CODE, // Target QR codes
        scanInstructions: 'Position the QR code within the frame',
        scanButton: true, // Show scan button
        scanText: 'Tap to scan',
        cameraDirection: CapacitorBarcodeScannerCameraDirection.BACK, // Use back camera by default
      };

      const result = await CapacitorBarcodeScanner.scanBarcode(options);

      // Process scan result
      if (result && result.ScanResult) {
        processScanResult(result.ScanResult);
      }
    } catch (error) {
      console.error('QR Scan error:', error);

      // Handle error message
      setAlertMessage(
        'Failed to scan QR code. Make sure camera permissions are enabled.',
      );
      setShowAlert(true);
    } finally {
      // Reset scanner active state
      setScannerActive(false);
    }
  };

  const stopScan = () => {
    // Reset scanner active state
    setScannerActive(false);
  };

  const processScanResult = (content: string) => {
    try {
      const data = JSON.parse(content);

      // Validate QR data format
      if (data.type !== 'location-share-request' || !data.userId) {
        throw new Error('Invalid QR code format');
      }

      // In a real app, this would send an API request to the other user
      setIsLoading(true);

      // Simulate API request
      setTimeout(() => {
        setIsLoading(false);
        setToastMessage(`Location sharing request sent to ${data.displayName}`);
        setShowToast(true);
      }, 1500);
    } catch (error) {
      setAlertMessage('Invalid QR code. Please try again.');
      setShowAlert(true);
    }
  };

  // Generate QR code data
  const generateQRData = () => {
    if (!user) return '';

    const shareData = {
      type: 'location-share-request',
      userId: user.uid || 'demo-user',
      displayName: user.displayName || 'Demo User',
      timestamp: new Date().getTime(),
    };

    return JSON.stringify(shareData);
  };

  // Download QR code as image
  const downloadQRCode = () => {
    const canvas = document.getElementById(
      'sharing-qrcode',
    ) as HTMLCanvasElement;
    if (!canvas) return;

    const pngUrl = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = 'location-sharing-qrcode.png';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    setToastMessage('QR code downloaded');
    setShowToast(true);
  };

  // Handle sharing request approval/rejection
  const handleSharingRequest = (requestId: string, approved: boolean) => {
    setIsLoading(true);

    // In a real app, this would update the request in your backend
    setTimeout(() => {
      // Update local state
      setSharingRequests((prev) =>
        prev.filter((request) => request.id !== requestId),
      );

      setToastMessage(`Request ${approved ? 'approved' : 'rejected'}`);
      setShowToast(true);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Location Sharing</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonSegment
            value={activeSegment}
            onIonChange={(e) => setActiveSegment(e.detail.value as string)}
          >
            <IonSegmentButton value="mySharing">
              <IonLabel>My Sharing</IonLabel>
              <IonIcon icon={qrCode} />
            </IonSegmentButton>
            <IonSegmentButton value="addSharing">
              <IonLabel>Add Sharing</IonLabel>
              <IonIcon icon={scanOutline} />
            </IonSegmentButton>
            <IonSegmentButton value="confirmSharing">
              <IonLabel>Confirm</IonLabel>
              <IonIcon icon={peopleCircleOutline} />
              {sharingRequests.length > 0 && (
                <IonBadge color="danger" className="absolute -top-1 -right-1">
                  {sharingRequests.length}
                </IonBadge>
              )}
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding">
        {/* QR Code Generation UI */}
        {activeSegment === 'mySharing' && (
          <div className="flex flex-col items-center justify-center h-full">
            <IonCard className="w-full max-w-md mx-auto">
              <IonCardContent className="flex flex-col items-center p-6">
                <h2 className="text-xl font-semibold mb-4">
                  My Location Sharing QR Code
                </h2>
                <p className="text-sm text-gray-500 mb-6 text-center">
                  Others can scan this QR code to request access to your
                  location
                </p>
                <div className="bg-white p-4 rounded-lg shadow-inner mb-6">
                  <QRCode
                    id="sharing-qrcode"
                    value={generateQRData()}
                    size={250}
                    level="H"
                    includeMargin={true}
                    className="mx-auto"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  QR code expires after 24 hours for security
                </p>
                <IonButton
                  expand="block"
                  className="mt-6"
                  onClick={downloadQRCode}
                >
                  <IonIcon slot="start" icon={download} />
                  Download QR Code
                </IonButton>
              </IonCardContent>
            </IonCard>
          </div>
        )}

        {/* QR Code Scanner UI */}
        {activeSegment === 'addSharing' && (
          <div className="h-full flex flex-col items-center justify-center">
            {scannerActive ? (
              <div className="scanner-ui">
                <div className="scanner-frame"></div>
                <p className="text-white text-center mt-4 scanner-text">
                  Position the QR code within the frame
                </p>
              </div>
            ) : (
              <IonCard className="w-full max-w-md mx-auto">
                <IonCardContent className="flex flex-col items-center p-6">
                  <div className="rounded-full bg-gray-100 p-6 mb-4">
                    <IonIcon
                      icon={scanOutline}
                      className="text-primary text-5xl"
                    />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">
                    Add Location Sharing
                  </h2>
                  <p className="text-sm text-gray-500 mb-6 text-center">
                    Scan someone's QR code to request access to their location
                  </p>
                  <IonButton
                    expand="block"
                    onClick={startScan}
                    className="w-full"
                  >
                    <IonIcon slot="start" icon={scanOutline} />
                    Scan QR Code
                  </IonButton>
                </IonCardContent>
              </IonCard>
            )}
          </div>
        )}

        {/* Pending Requests UI */}
        {activeSegment === 'confirmSharing' && (
          <div className="h-full">
            <h2 className="text-xl font-semibold px-4 pt-4 mb-2">
              Pending Requests
            </h2>
            {sharingRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-2/3">
                <div className="rounded-full bg-gray-100 p-6 mb-4">
                  <IonIcon
                    icon={peopleCircleOutline}
                    className="text-gray-400 text-5xl"
                  />
                </div>
                <p className="text-gray-500">No pending requests</p>
              </div>
            ) : (
              <IonList>
                {sharingRequests.map((request) => (
                  <IonItem key={request.id} className="py-2">
                    <IonAvatar slot="start">
                      <img
                        src={
                          request.userAvatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(request.userName)}&background=random`
                        }
                        alt={request.userName}
                      />
                    </IonAvatar>
                    <IonLabel>
                      <h2 className="font-medium">{request.userName}</h2>
                      <p className="text-xs text-gray-500">
                        Requested: {request.requestTime}
                      </p>
                    </IonLabel>
                    <IonButton
                      fill="clear"
                      color="success"
                      onClick={() => handleSharingRequest(request.id, true)}
                    >
                      <IonIcon icon={checkmarkCircle} slot="icon-only" />
                    </IonButton>
                    <IonButton
                      fill="clear"
                      color="danger"
                      onClick={() => handleSharingRequest(request.id, false)}
                    >
                      <IonIcon icon={closeCircle} slot="icon-only" />
                    </IonButton>
                  </IonItem>
                ))}
              </IonList>
            )}
          </div>
        )}

        {/* Cancel button for scanner */}
        {scannerActive && (
          <IonFooter className="ion-no-border transparent-footer">
            <IonToolbar className="transparent-toolbar">
              <div className="flex justify-center pb-8">
                <IonButton
                  color="danger"
                  onClick={stopScan}
                  shape="round"
                  size="large"
                >
                  Cancel Scan
                </IonButton>
              </div>
            </IonToolbar>
          </IonFooter>
        )}

        {/* Feedback components */}
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Alert"
          message={alertMessage}
          buttons={['OK']}
        />

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="bottom"
        />

        <IonLoading isOpen={isLoading} message="Please wait..." />
      </IonContent>
    </IonPage>
  );
};

export default Tab2;
