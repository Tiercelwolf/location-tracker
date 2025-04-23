import { Geolocation, Position, PermissionStatus } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
  userId?: string;
}

export interface LocationUser {
  id: string;
  name: string;
  location: LocationData | null;
  isSharing: boolean;
  lastUpdated?: number;
}

class LocationService {
  private watchId: string | null = null;
  private onLocationUpdateCallback: ((location: LocationData) => void) | null = null;
  private onErrorCallback: ((error: any) => void) | null = null;
  
  // Check if location permissions are granted
  async checkPermissions(): Promise<PermissionStatus> {
    if (!Capacitor.isNativePlatform()) {
      return { location: 'granted' } as PermissionStatus;
    }
    
    try {
      return await Geolocation.checkPermissions();
    } catch (error) {
      console.error('Error checking location permissions:', error);
      throw error;
    }
  }
  
  // Request location permissions
  async requestPermissions(): Promise<PermissionStatus> {
    if (!Capacitor.isNativePlatform()) {
      return { location: 'granted' } as PermissionStatus;
    }
    
    try {
      return await Geolocation.requestPermissions();
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      throw error;
    }
  }
  
  // Get current location once
  async getCurrentLocation(): Promise<LocationData> {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });
      
      return this.formatPosition(position);
    } catch (error) {
      console.error('Error getting current location:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(error);
      }
      throw error;
    }
  }
  
  // Start watching location changes
  async startTracking(): Promise<void> {
    if (this.watchId) {
      console.warn('Location tracking already started');
      return;
    }
    
    try {
      // First get the current position
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });
      
      if (this.onLocationUpdateCallback) {
        this.onLocationUpdateCallback(this.formatPosition(position));
      }
      
      // Then start watching for changes
      this.watchId = await Geolocation.watchPosition(
        { enableHighAccuracy: true, timeout: 10000 },
        (position, error) => {
          if (error) {
            console.error('Watch position error:', error);
            if (this.onErrorCallback) {
              this.onErrorCallback(error);
            }
            return;
          }
          
          if (position && this.onLocationUpdateCallback) {
            this.onLocationUpdateCallback(this.formatPosition(position));
          }
        }
      );
    } catch (error) {
      console.error('Error starting location tracking:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(error);
      }
      throw error;
    }
  }
  
  // Stop watching location changes
  async stopTracking(): Promise<void> {
    if (!this.watchId) {
      console.warn('Location tracking not started');
      return;
    }
    
    try {
      await Geolocation.clearWatch({ id: this.watchId });
      this.watchId = null;
    } catch (error) {
      console.error('Error stopping location tracking:', error);
      throw error;
    }
  }
  
  // Set callback for location updates
  onLocationUpdate(callback: (location: LocationData) => void): void {
    this.onLocationUpdateCallback = callback;
  }
  
  // Set callback for errors
  onError(callback: (error: any) => void): void {
    this.onErrorCallback = callback;
  }
  
  // Check if tracking is active
  isTracking(): boolean {
    return this.watchId !== null;
  }
  
  // Helper method to format position data
  private formatPosition(position: Position): LocationData {
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp
    };
  }
  
  // Mock method to get other users' locations (would be replaced with API calls in production)
  async getOtherUsersLocations(): Promise<LocationUser[]> {
    // This is a mock implementation
    // In a real app, you would fetch this data from your backend
    return [
      {
        id: '2',
        name: 'Alice',
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10,
          timestamp: Date.now()
        },
        isSharing: true,
        lastUpdated: Date.now()
      },
      {
        id: '3',
        name: 'Bob',
        location: {
          latitude: 40.7142,
          longitude: -74.0050,
          accuracy: 15,
          timestamp: Date.now()
        },
        isSharing: true,
        lastUpdated: Date.now()
      },
      {
        id: '4',
        name: 'Charlie',
        location: null,
        isSharing: false,
        lastUpdated: Date.now() - 3600000 // 1 hour ago
      }
    ];
  }
}

// Create and export a singleton instance
export const locationService = new LocationService();
export default locationService;