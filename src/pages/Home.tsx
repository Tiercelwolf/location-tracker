import React, { useState, useRef, useEffect } from 'react';
import { 
  IonContent, 
  IonHeader, 
  IonPage, 
  IonTitle, 
  IonToolbar, 
  IonButton, 
  IonIcon,
  IonToast,
  IonSpinner,
  IonFab,
  IonFabButton,
  useIonViewDidEnter,
  IonAlert,
} from '@ionic/react';
import { 
  notifications, 
  menu, 
  locate, 
  play, 
  pause,
  chevronBack,
  chevronForward
} from 'ionicons/icons';

// CSS imports
import './Home.css';

// Import the BaiduMapLoader component
// import BaiduMapLoader from '../components/BaiduMapLoader';
import { 
  Map, 
  Marker, 
  ScaleControl, 
  ZoomControl,
  NavigationControl 
} from 'react-bmapgl';

// Import the location context
import { useLocation } from '../contexts/LocationContext';

/**
 * Coordinate conversion utility for transforming WGS-84 (GPS) to BD-09 (Baidu Maps)
 * 
 * This implementation follows the established algorithms for coordinate conversion
 * in China, including the two-step process: WGS-84 -> GCJ-02 -> BD-09
 */

/**
 * Converts WGS-84 coordinates (GPS standard) to BD-09 coordinates (Baidu Maps)
 * @param lng - Longitude in WGS-84 format
 * @param lat - Latitude in WGS-84 format
 * @returns Promise resolving to an object containing converted coordinates in BD-09 format
 */
const wgs84ToBd09 = (lng: number, lat: number): Promise<{ lng: number, lat: number }> => {
  return new Promise((resolve, reject) => {
    try {
    
      // Check if BMapGL is loaded
      if (!BMapGL || !BMapGL.Convertor) {
        console.error('BMapGL or BMapGL.Convertor is not defined. Make sure the Baidu Maps API is loaded correctly.');
        // Return original coordinates with a small offset as fallback
        resolve({ lng: lng + 0.006, lat: lat + 0.006 });
        return;
      }
      
      // Create a Convertor instance
      const convertor = new BMapGL.Convertor();
      
      // Create a point with the WGS-84 coordinates
      const sourcePoint = new BMapGL.Point(lng, lat);
      
      // Convert from WGS-84 (1) to BD-09 (5)
      // Types: 
      // 1: WGS-84
      // 3: GCJ-02
      // 5: BD-09
      convertor.translate([sourcePoint], 1, 5, (data: any) => {
        if (data && data.status === 0 && data.points && data.points.length > 0) {
          // Return the converted coordinates
          resolve({
            lng: data.points[0].lng,
            lat: data.points[0].lat
          });
        } else {
          console.error('Coordinate conversion failed:', data);
          // In case of error, return original coordinates with a small offset
          resolve({ lng: lng + 0.006, lat: lat + 0.006 });
        }
      });
    } catch (error) {
      console.error('Coordinate conversion error:', error);
      // In case of error, return original coordinates with a small offset
      reject({ lng: lng + 0.006, lat: lat + 0.006 });
    }
  });
};
// Add custom CSS to ensure the map container gets proper dimensions
const mapContainerStyle = `
  .bmap-container {
    width: 100%;
    height: 100%;
  }

  .edge-swipe-area {
    position: absolute;
    top: 0;
    height: 100%;
    width: 30px;
    z-index: 20;
    background: transparent;
  }

  .edge-swipe-area.left {
    left: 0;
  }

  .edge-swipe-area.right {
    right: 0;
  }
  
  .custom-marker-icon {
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    color: white;
    font-weight: bold;
    box-shadow: 0 0 10px rgba(0,0,0,0.3);
    border: 2px solid white;
  }
`;



const Home: React.FC = () => {
  // Use the location context instead of local state
  const { 
    // myLocation, 
    isTracking, 
    users, 
    activeUser, 
    error, 
    loading,
    startTracking, 
    stopTracking, 
    centerOnMyLocation,
    setActiveUser 
  } = useLocation();

  // Local state for UI elements
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [showToast, setShowToast] = useState<boolean>(false);
  // const [centerMap, setCenterMap] = useState<boolean>(false);
  const [activeUserIndex, setActiveUserIndex] = useState<number>(0);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const [baiduPos, setBaiduPos] = useState<BMapGL.Point>(new BMapGL.Point(-74.0060, 40.7128));
  
  
  const renderCount = useRef(0);
  
  // Increment render counter
  useEffect(() => {
    renderCount.current++;
    console.log(`Home component rendered #${renderCount.current}`);
  });

  // Update error toast when context error changes
  useEffect(() => {
    if (error) {
      setErrorMsg(error);
      setShowToast(true);
    }
  }, [error]);

  // Initial map setup and permissions check
  useIonViewDidEnter(() => {
    // No need to check permissions here as it's handled by LocationContext
  });

  // useEffect(() => {
  //   if (activeUser) {
  //     getCurrentLocation();
  //   }
  // }, [activeUser]);

  const getCurrentLocation = async () => {
        let currentLocation: any;
        if (activeUser?.location && activeUser.isSharing) {
          // Convert from WGS-84 to BD-09
           currentLocation = await wgs84ToBd09(
            activeUser.location.longitude,
            activeUser.location.latitude
          );
        }
        else {
          // If current user has a location, use it
          currentLocation = await wgs84ToBd09(-74.0060, 40.7128);
        }
        setBaiduPos(new BMapGL.Point(currentLocation.lng, currentLocation.lat));
        };
  // Navigate to previous user
  const navigateToPrevUser = () => {
    const newIndex = activeUserIndex === 0 ? users.length - 1 : activeUserIndex - 1;
    setActiveUserIndex(newIndex);
    setActiveUser(users[newIndex]);
    getCurrentLocation();
    // setCenterMap(true);
  };

  // Navigate to next user
  const navigateToNextUser = () => {
    const newIndex = activeUserIndex === users.length - 1 ? 0 : activeUserIndex + 1;
    setActiveUserIndex(newIndex);
    setActiveUser(users[newIndex]);
    getCurrentLocation();
    // setCenterMap(true);
  };

  // Handle touch events for edge swipe areas
  const handleEdgeSwipe = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      navigateToPrevUser();
    } else {
      navigateToNextUser();
    }
  };

  // Handle toggling tracking with confirmation
  const toggleTracking = () => {
    if (isTracking) {
      // If already tracking, stop tracking immediately
      stopTracking();
    } else {
      // If not tracking, show confirmation dialog
      setShowConfirm(true);
    }
  };


  // Check if active user is the current user (Me)
  const isCurrentUserActive = () => {
    return activeUser?.id === '1';
  };

  // Render user markers with coordinate conversion
  const renderMarkers = () => {
    
    if (!activeUser?.isSharing || !activeUser?.location) {
      return null;
    }
    
    return (
      <>
        <Marker
          position={baiduPos}
          icon={'loc_blue'}
        />
      </>
    );
  };

  // Handle user location centering - now uses the context
  const handleCenterOnMyLocation = async () => {
    try {
      await centerOnMyLocation();
      // setCenterMap(true);
    } catch (error) {
      // Error handling is done via the context's error state
    }
  };

  // Start tracking with context function
  const handleStartTracking = async () => {
   
    try {
      await startTracking();
    } catch (error) {
      // Error handling is done via the context's error state
    }
  };

  return (
    <IonPage>
      {/* Add custom CSS for map container */}
      <style>{mapContainerStyle}</style>
      
      <IonHeader>
        <IonToolbar>
          <IonTitle className="font-medium">Location Tracker</IonTitle>
          <IonButton slot="end" fill="clear" color="dark">
            <IonIcon icon={notifications} slot="icon-only" />
          </IonButton>
          <IonButton slot="start" fill="clear" color="dark">
            <IonIcon icon={menu} slot="icon-only" />
          </IonButton>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="ion-no-padding">
        <div className="relative w-full h-full">
          {/* Edge swipe areas for navigation */}
          <div 
            className="edge-swipe-area left"
            onClick={() => handleEdgeSwipe('prev')}
          ></div>
          <div 
            className="edge-swipe-area right"
            onClick={() => handleEdgeSwipe('next')}
          ></div>

          {/* Status bar - Fixed at the top and always visible */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-90 rounded-lg shadow-lg px-4 py-2 w-5/6 text-center" style={{ zIndex: 20 }}>
            <h3 className="font-medium text-gray-800">
              {activeUser?.id === '1' ? 'My map' : `${activeUser?.name}'s map`}
            </h3>
            <p className="text-sm text-gray-600">
              {activeUser?.isSharing 
                ? (activeUser.id === '1' ? 'You are sharing your location' : `${activeUser.name} is sharing location`) 
                : (activeUser?.id === '1' ? 'You are not sharing your location' : 'Sharing stopped')}
            </p>
          </div>
          
          {/* Map container - Takes up the full available space */}
          <div 
          className="absolute top-0 left-0 w-full h-full" style={{ zIndex: 1 }}>
              <Map 
                center={baiduPos}
                zoom={14}
                style={{ height: '100%', width: '100%' }}
                enableScrollWheelZoom={true}
                autoLocate={false}
                mapType="normal"
                heading={0}
                tilt={0}
              >
                {/* Map Controls */}
                <ScaleControl />
                <ZoomControl />
                <NavigationControl />
                
                {/* Render marker for active user */}
                {renderMarkers()}
                
              </Map>
            
          </div>
          
          {/* Loading spinner */}
          {loading && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white bg-opacity-70 rounded-full p-3" style={{ zIndex: 30 }}>
              <IonSpinner name="crescent" />
            </div>
          )}
          
          {/* Floating button to center on my location */}
          <IonFab vertical="bottom" horizontal="end" slot="fixed" style={{ bottom: '80px', right: '10px', zIndex: 20 }}>
            <IonFabButton onClick={handleCenterOnMyLocation}>
              <IonIcon icon={locate} />
            </IonFabButton>
          </IonFab>
          
          {/* Navigation arrows - One line above Start/Stop button when viewing current user's map */}
          {isCurrentUserActive() ? (
            <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 flex justify-between w-48" style={{ zIndex: 20 }}>
              <IonButton 
                size="small"
                fill="clear" 
                color="medium"
                onClick={navigateToPrevUser}
                className="bg-white bg-opacity-70 rounded-full"
              >
                <IonIcon icon={chevronBack} slot="icon-only" />
              </IonButton>
              <IonButton 
                size="small"
                fill="clear" 
                color="medium"
                onClick={navigateToNextUser}
                className="bg-white bg-opacity-70 rounded-full"
              >
                <IonIcon icon={chevronForward} slot="icon-only" />
              </IonButton>
            </div>
          ) : (
            // For other users' maps, navigation arrows are in the place of Start/Stop button
            <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex justify-between w-48" style={{ zIndex: 20 }}>
              <IonButton 
                size="small"
                fill="clear" 
                color="medium"
                onClick={navigateToPrevUser}
                className="bg-white bg-opacity-70 rounded-full"
              >
                <IonIcon icon={chevronBack} slot="icon-only" />
              </IonButton>
              <IonButton 
                size="small"
                fill="clear" 
                color="medium"
                onClick={navigateToNextUser}
                className="bg-white bg-opacity-70 rounded-full"
              >
                <IonIcon icon={chevronForward} slot="icon-only" />
              </IonButton>
            </div>
          )}
          
          {/* Start/Stop positioning button - Only visible when viewing "My map" */}
          {isCurrentUserActive() && (
            <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2" style={{ zIndex: 20 }}>
              <IonButton 
                color={isTracking ? "danger" : "success"}
                onClick={toggleTracking}
                className="w-48"
              >
                <IonIcon slot="start" icon={isTracking ? pause : play} />
                {isTracking ? "Stop Positioning" : "Start Positioning"}
              </IonButton>
            </div>
          )}
        </div>
        
        {/* Confirmation Alert */}
        <IonAlert
          isOpen={showConfirm}
          onDidDismiss={() => setShowConfirm(false)}
          header="Start Positioning"
          message="Are you sure you want to start sharing your location? Your real-time position will be visible to authorized users."
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
              handler: () => {
                console.log('Positioning cancelled');
              }
            },
            {
              text: 'Start',
              handler: () => {
                handleStartTracking();
              }
            }
          ]}
        />
        
        {/* Error toast */}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={errorMsg}
          duration={3000}
          position="top"
          color="danger"
        />
      </IonContent>
    </IonPage>
  );
};

export default Home;