import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import locationService, { LocationData, LocationUser } from '../services/locationService';


const apiKey = import.meta.env.VITE_BAIDU_MAP_KEY;

interface LocationContextType {
  myLocation: LocationData | null;
  isTracking: boolean;
  users: LocationUser[];
  activeUser: LocationUser | null;
  error: string | null;
  loading: boolean;
  startTracking: () => Promise<void>;
  stopTracking: () => Promise<void>;
  centerOnMyLocation: () => Promise<void>;
  setActiveUser: (user: LocationUser) => void;
}

const LocationContext = createContext<LocationContextType | null>(null);

export const LocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [myLocation, setMyLocation] = useState<LocationData | null>(null);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [users, setUsers] = useState<LocationUser[]>([]);
  const [activeUser, setActiveUser] = useState<LocationUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState(false);
  // Add the current user to the beginning of the list
  useEffect(() => {
    // Initialize with current user
    const currentUser: LocationUser = {
      id: '1', // Current user ID
      name: 'Me', // Current user name
      location: myLocation,
      isSharing: isTracking
    };
    
    // Fetch other users
    const fetchUsers = async () => {
      try {
        const otherUsers = await locationService.getOtherUsersLocations();
        
        // Combine current user with others
        const allUsers = [currentUser, ...otherUsers];
        setUsers(allUsers);
        
        // Set active user if not already set
        if (!activeUser) {
          setActiveUser(currentUser);
        } 
        // else {
        //   // Update active user if it's in the list
        //   const updatedActiveUser = allUsers.find(user => user.id === activeUser.id);
        //   if (updatedActiveUser) {
        //     setActiveUser(updatedActiveUser);
        //   }
        // }
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Failed to fetch users');
      }
    };
    
    fetchUsers();
    
    // Set up a polling interval to refresh other users' locations
    const interval = setInterval(fetchUsers, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, [myLocation, isTracking, activeUser]);

  // Set up location update handler
  useEffect(() => {
    locationService.onLocationUpdate((location: LocationData) => {
      setMyLocation(location);
    });
    
    locationService.onError((error: any) => {
      console.error('Location service error:', error);
      setError('Location service error: ' + (error.message || JSON.stringify(error)));
    });
    
    // Check if already tracking
    if (locationService.isTracking()) {
      setIsTracking(true);
    }
    
    return () => {
      // Clean up
      locationService.stopTracking().catch(console.error);
    };
  }, []);

  useEffect(() => {
      // Skip if already loaded
      if (isLoaded) {
        setIsLoaded(true);
        return;
      }
      if(!apiKey) {
        setError('Please provide a Baidu Maps API key in the .env file.');
        return;
      }
      // Load Baidu Maps script
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      script.src = `https://api.map.baidu.com/api?v=2.0&type=webgl&ak=${apiKey}&callback=initBaiduMap`;
      
      // Define callback function
      window.initBaiduMap = () => {
        console.log('Baidu Maps API loaded successfully');
        setIsLoaded(true);
      };
  
      // Handle errors
      script.onerror = () => {
        setError('Failed to load Baidu Maps API. Please check your internet connection and API key.');
      };
  
      // Append script to document
      document.head.appendChild(script);
  
      // Cleanup
      return () => {
        document.head.removeChild(script);
        delete window.initBaiduMap;
      };
    }, [apiKey]);
  // Start tracking location
  const startTracking = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      // Check permissions
      const permissions = await locationService.checkPermissions();
      
      if (permissions.location !== 'granted') {
        const requested = await locationService.requestPermissions();
        
        if (requested.location !== 'granted') {
          throw new Error('Location permission is required for tracking');
        }
      }
      
      await locationService.startTracking();
      setIsTracking(true);
    } catch (error) {
      console.error('Error starting tracking:', error);
      setError('Failed to start location tracking: ' + (error as Error).message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Stop tracking location
  const stopTracking = async (): Promise<void> => {
    setLoading(true);
    
    try {
      await locationService.stopTracking();
      setIsTracking(false);
    } catch (error) {
      console.error('Error stopping tracking:', error);
      setError('Failed to stop location tracking: ' + (error as Error).message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Get current location and center map
  const centerOnMyLocation = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const location = await locationService.getCurrentLocation();
      setMyLocation(location);
    } catch (error) {
      console.error('Error getting current location:', error);
      setError('Failed to get current location: ' + (error as Error).message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocationContext.Provider
      value={{
        myLocation,
        isTracking,
        users,
        activeUser,
        error,
        loading,
        startTracking,
        stopTracking,
        centerOnMyLocation,
        setActiveUser
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  
  return context;
};

export default LocationContext;