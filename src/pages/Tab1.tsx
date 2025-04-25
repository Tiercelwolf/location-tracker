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
  IonRange,
  useIonViewDidEnter,
  IonModal,
  IonDatetime,
  useIonViewWillLeave,
} from '@ionic/react';
import {
  menu,
  locate,
  play,
  pause,
  chevronBack,
  chevronForward,
  calendar,
  flag,
  time,
} from 'ionicons/icons';

// Import Baidu Map components
import {
  Map,
  Marker,
  Polyline,
  ScaleControl,
  ZoomControl,
  NavigationControl,
} from 'react-bmapgl';

// Import the location context
import { useLocation } from '../contexts/LocationContext';

// CSS imports
import './Tab1.css';

// Define a type for trajectory points
interface TrajectoryPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
}

// Define a type for user trajectory data
interface UserTrajectory {
  userId: string;
  userName: string;
  color: string;
  points: TrajectoryPoint[];
}

/**
 * Converts WGS-84 coordinates (GPS standard) to BD-09 coordinates (Baidu Maps)
 */
const wgs84ToBd09 = (
  lng: number,
  lat: number,
): Promise<{ lng: number; lat: number }> => {
  return new Promise((resolve) => {
    try {
      // Check if BMapGL is loaded
      if (!window.BMapGL || !window.BMapGL.Convertor) {
        console.error(
          'BMapGL or BMapGL.Convertor is not defined. Make sure the Baidu Maps API is loaded correctly.',
        );
        // Return original coordinates with a small offset as fallback
        resolve({ lng: lng + 0.006, lat: lat + 0.006 });
        return;
      }

      // Create a Convertor instance
      const convertor = new window.BMapGL.Convertor();

      // Create a point with the WGS-84 coordinates
      const sourcePoint = new window.BMapGL.Point(lng, lat);

      // Convert from WGS-84 (1) to BD-09 (5)
      convertor.translate([sourcePoint], 1, 5, (data: any) => {
        if (
          data &&
          data.status === 0 &&
          data.points &&
          data.points.length > 0
        ) {
          // Return the converted coordinates
          resolve({
            lng: data.points[0].lng,
            lat: data.points[0].lat,
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
      resolve({ lng: lng + 0.006, lat: lat + 0.006 });
    }
  });
};

const Tab1: React.FC = () => {
  // Use the location context
  const { users, activeUser, error, loading, setActiveUser } = useLocation();

  // Local state
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [showToast, setShowToast] = useState<boolean>(false);
  const [activeUserIndex, setActiveUserIndex] = useState<number>(0);
  const [center, setCenter] = useState<any>({ lng: 116.404, lat: 39.915 }); // Default to Beijing
  const [trajectories, setTrajectories] = useState<UserTrajectory[]>([]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackProgress, setPlaybackProgress] = useState<number>(0);
  const [visiblePoints, setVisiblePoints] = useState<TrajectoryPoint[]>([]);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(3);
  const [convertedPoints, setConvertedPoints] = useState<any[]>([]);
  const [latestMarkerPosition, setLatestMarkerPosition] = useState<any>(null);
  const [startMarkerPosition, setStartMarkerPosition] = useState<any>(null);
  const [cacheExpiry, setCacheExpiry] = useState<number>(
    Date.now() + 60 * 60 * 1000,
  ); // 1 hour from now
  const [dataLoaded, setDataLoaded] = useState<boolean>(false);

  // Add state for time displays
  const [startTimeDisplay, setStartTimeDisplay] = useState<string>('');
  const [endTimeDisplay, setEndTimeDisplay] = useState<string>('');

  // Time range form states
  const [showTimeModal, setShowTimeModal] = useState<boolean>(true);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<string>(() => {
    const threeDay = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    return threeDay.toISOString();
  });
  const [endTime, setEndTime] = useState<string>(() => {
    return new Date().toISOString();
  });
  const [currentTimeRange, setCurrentTimeRange] = useState<{
    start: number;
    end: number;
  }>({
    start: Date.now() - 3 * 24 * 60 * 60 * 1000,
    end: Date.now(),
  });

  // Add state for time picker visibility
  const [showStartPicker, setShowStartPicker] = useState<boolean>(false);
  const [showEndPicker, setShowEndPicker] = useState<boolean>(false);

  // Refs
  const playbackIntervalRef = useRef<any>(null);
  const mapRef = useRef<any>(null);

  // Update error toast when context error changes
  useEffect(() => {
    if (error) {
      setErrorMsg(error);
      setShowToast(true);
    }
  }, [error]);

  // Fetch trajectory data when active user changes
  useEffect(() => {
    if (activeUser) {
      // When switching users, show the time range modal and ensure it's not minimized
      setShowTimeModal(true);
      setIsMinimized(false);
      setDataLoaded(false);

      // Reset start/end time displays
      setStartTimeDisplay(formatDateForDisplay(new Date(startTime)));
      setEndTimeDisplay(formatDateForDisplay(new Date(endTime)));
    }
  }, [activeUser]);

  // Clean up playback interval on unmount
  useEffect(() => {
    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    };
  }, []);

  // Handle playback state
  useEffect(() => {
    if (isPlaying) {
      startPlayback();
    } else {
      stopPlayback();
    }
  }, [isPlaying, playbackSpeed]);

  // Update visible points when progress changes
  useEffect(() => {
    updateVisiblePoints();
  }, [playbackProgress, trajectories]);

  // Convert visible points to Baidu format
  useEffect(() => {
    const convertPoints = async () => {
      if (visiblePoints.length === 0) {
        setConvertedPoints([]);
        setLatestMarkerPosition(null);
        setStartMarkerPosition(null);
        return;
      }

      try {
        // Convert all points
        const converted = await Promise.all(
          visiblePoints.map(async (point) => {
            const bdPoint = await wgs84ToBd09(point.longitude, point.latitude);
            return new window.BMapGL.Point(bdPoint.lng, bdPoint.lat);
          }),
        );

        setConvertedPoints(converted);

        // Set latest marker position (end point)
        if (visiblePoints.length > 0) {
          const latest = visiblePoints[visiblePoints.length - 1];
          const bdLatest = await wgs84ToBd09(latest.longitude, latest.latitude);
          setLatestMarkerPosition(
            new window.BMapGL.Point(bdLatest.lng, bdLatest.lat),
          );

          // Update center to follow the latest point if playing
          if (isPlaying) {
            setCenter({ lng: bdLatest.lng, lat: bdLatest.lat });
          }
        }

        // Set start marker position (first point)
        if (visiblePoints.length > 0) {
          const first = visiblePoints[0];
          const bdFirst = await wgs84ToBd09(first.longitude, first.latitude);
          setStartMarkerPosition(
            new window.BMapGL.Point(bdFirst.lng, bdFirst.lat),
          );
        }
      } catch (error) {
        console.error('Error converting points:', error);
      }
    };

    convertPoints();
  }, [visiblePoints, isPlaying]);

  // Initialize the page when it enters the view
  useIonViewDidEnter(() => {
    // Show the time range modal when entering the page and ensure it's not minimized
    setShowTimeModal(true);
    setIsMinimized(false);
    setDataLoaded(false);

    // Reset time values to default (3 days ago to now)
    const startDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const endDate = new Date();
    setStartTime(startDate.toISOString());
    setEndTime(endDate.toISOString());

    // Update display values
    setStartTimeDisplay(formatDateForDisplay(startDate));
    setEndTimeDisplay(formatDateForDisplay(endDate));
  });

  useIonViewWillLeave(() => {
    // Hide modal and timepickers when leaving the page
    setShowTimeModal(false);
    setIsMinimized(true);
    setShowStartPicker(false);
    setShowEndPicker(false);
  });
  // Format date for display
  const formatDateForDisplay = (date: Date): string => {
    return `${date.getFullYear()}年${
      date.getMonth() + 1
    }月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(
      date.getMinutes(),
    ).padStart(2, '0')}`;
  };

  // Handle start time change
  const handleStartTimeChange = (e: CustomEvent) => {
    const selectedDate = new Date(e.detail.value);

    // Set to the beginning of the hour
    selectedDate.setMinutes(0);
    selectedDate.setSeconds(0);
    selectedDate.setMilliseconds(0);

    setStartTime(selectedDate.toISOString());
    setStartTimeDisplay(formatDateForDisplay(selectedDate));
    setShowStartPicker(false);
  };

  // Handle end time change
  const handleEndTimeChange = (e: CustomEvent) => {
    const selectedDate = new Date(e.detail.value);

    // Set to the beginning of the hour
    selectedDate.setMinutes(0);
    selectedDate.setSeconds(0);
    selectedDate.setMilliseconds(0);

    setEndTime(selectedDate.toISOString());
    setEndTimeDisplay(formatDateForDisplay(selectedDate));
    setShowEndPicker(false);
  };

  // Handle form submission
  const handleConfirm = () => {
    // Hide any open time pickers
    setShowStartPicker(false);
    setShowEndPicker(false);

    // Convert ISO strings to timestamps
    const startTimestamp = new Date(startTime).getTime();
    const endTimestamp = new Date(endTime).getTime();

    // Update current time range
    setCurrentTimeRange({
      start: startTimestamp,
      end: endTimestamp,
    });

    // Reset playback
    setIsPlaying(false);
    setPlaybackProgress(0);

    // Minimize the modal instead of closing it
    setIsMinimized(true);

    // Fetch data with the new time range
    if (activeUser) {
      fetchTrajectoryData(activeUser.id, startTimestamp, endTimestamp);
    }
  };

  // Handle form cancel
  const handleCancel = () => {
    // Hide any open time pickers
    setShowStartPicker(false);
    setShowEndPicker(false);

    setIsMinimized(true);
    // if (dataLoaded) {
    //   // If data already loaded, just minimize the form
    //   setIsMinimized(true);
    // } else {
    //   // Otherwise keep the form open
    //   // In a real app we might want to set default times or show a message
    // }
  };

  // Mock function to fetch trajectory data
  const fetchTrajectoryData = async (
    userId: string,
    startTimestamp: number,
    endTimestamp: number,
  ) => {
    try {
      // Check if data is already cached and valid
      const cachedTrajectory = trajectories.find(
        (t) => t.userId === userId && Date.now() < cacheExpiry,
      );

      if (cachedTrajectory) {
        // Filter the cached trajectory based on the new time range
        const filteredPoints = cachedTrajectory.points.filter(
          (point) =>
            point.timestamp >= startTimestamp &&
            point.timestamp <= endTimestamp,
        );

        // Use filtered cached data
        if (filteredPoints.length > 0) {
          setTrajectories([
            {
              ...cachedTrajectory,
              points: filteredPoints,
            },
          ]);
        } else {
          // If no points match, generate new data
          const mockTrajectory = generateMockTrajectory(
            userId,
            startTimestamp,
            endTimestamp,
          );
          setTrajectories([mockTrajectory]);
        }
      } else {
        // Generate new mock trajectory data with the given time range
        const mockTrajectory = generateMockTrajectory(
          userId,
          startTimestamp,
          endTimestamp,
        );

        // Update trajectories state
        setTrajectories([mockTrajectory]);

        // Reset cache expiry
        setCacheExpiry(Date.now() + 60 * 60 * 1000);
      }

      // Set initial visible points
      setVisiblePoints([]);
      setPlaybackProgress(0);

      // Update map center to first point if available
      if (trajectories[0]?.points.length > 0) {
        const firstPoint = trajectories[0].points[0];
        const convertedPoint = await wgs84ToBd09(
          firstPoint.longitude,
          firstPoint.latitude,
        );
        setCenter(convertedPoint);
      }

      // Mark data as loaded
      setDataLoaded(true);
    } catch (error) {
      console.error('Error fetching trajectory data:', error);
      setErrorMsg('Failed to load trajectory data');
      setShowToast(true);
    }
  };

  // Generate mock trajectory data for testing
  const generateMockTrajectory = (
    userId: string,
    startTime: number,
    endTime: number,
  ): UserTrajectory => {
    const user = users.find((u) => u.id === userId);
    const userName = user ? user.name : 'Unknown User';

    // Generate random points
    const points: TrajectoryPoint[] = [];
    let time = startTime;

    // Use a starting position that makes sense for the user
    // In a real app, this would come from a database or API
    let lat = 39.915 + (Math.random() * 0.02 - 0.01);
    let lng = 116.404 + (Math.random() * 0.02 - 0.01);

    // Create a realistic trajectory (simulating daily commutes, etc.)
    while (time < endTime) {
      // Add the current point
      points.push({
        latitude: lat,
        longitude: lng,
        timestamp: time,
      });

      // Add some realistic movement patterns
      const hourOfDay = new Date(time).getHours();

      if (hourOfDay >= 7 && hourOfDay <= 9) {
        // Morning commute - move more quickly in one direction
        lat += Math.random() * 0.003;
        lng += Math.random() * 0.003 - 0.001;
        // Add points more frequently during commute times
        time += Math.floor(Math.random() * 10 + 5) * 3600 * 1000;
      } else if (hourOfDay >= 17 && hourOfDay <= 19) {
        // Evening commute - return in the opposite direction
        lat -= Math.random() * 0.003;
        lng -= Math.random() * 0.003 - 0.001;
        // Add points more frequently during commute times
        time += Math.floor(Math.random() * 10 + 5) * 3600 * 1000;
      } else if (hourOfDay >= 23 || hourOfDay <= 5) {
        // Overnight - minimal movement
        lat += Math.random() * 0.0005 - 0.00025;
        lng += Math.random() * 0.0005 - 0.00025;
        // Add points less frequently overnight
        time += Math.floor(Math.random() * 60 + 30) * 3600 * 1000;
      } else {
        // Normal daytime activity
        lat += Math.random() * 0.002 - 0.001;
        lng += Math.random() * 0.002 - 0.001;
        // Regular intervals during the day
        time += Math.floor(Math.random() * 25 + 5) * 3600 * 1000;
      }
    }

    return {
      userId,
      userName,
      color: userId === '1' ? '#3880ff' : '#ff3880', // Blue for current user, pink for others
      points: points.sort((a, b) => a.timestamp - b.timestamp), // Ensure chronological order
    };
  };

  // Start trajectory playback
  const startPlayback = () => {
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
    }

    const interval = 200 / playbackSpeed; // Adjust interval based on speed

    playbackIntervalRef.current = setInterval(() => {
      setPlaybackProgress((prev) => {
        if (prev >= 100) {
          setIsPlaying(false);
          return 100;
        }
        return prev + 0.5; // Increment by 0.5% each time
      });
    }, interval);
  };

  // Stop trajectory playback
  const stopPlayback = () => {
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
      playbackIntervalRef.current = null;
    }
  };

  // Update the visible points based on playback progress
  const updateVisiblePoints = () => {
    if (trajectories.length === 0 || trajectories[0].points.length === 0) {
      setVisiblePoints([]);
      return;
    }

    const trajectory = trajectories[0];

    // Determine how many points to show based on progress
    const pointCount = Math.max(
      1,
      Math.floor((trajectory.points.length * playbackProgress) / 100),
    );

    // Get the subset of points to display
    const visiblePointsSubset = trajectory.points.slice(0, pointCount);

    setVisiblePoints(visiblePointsSubset);
  };

  // Navigate to previous user
  const navigateToPrevUser = () => {
    const newIndex =
      activeUserIndex === 0 ? users.length - 1 : activeUserIndex - 1;
    setActiveUserIndex(newIndex);
    setActiveUser(users[newIndex]);

    // Reset playback
    setIsPlaying(false);
    setPlaybackProgress(0);

    // Show time range modal for the new user
    setShowTimeModal(true);
    setIsMinimized(false);
    setDataLoaded(false);
  };

  // Navigate to next user
  const navigateToNextUser = () => {
    const newIndex =
      activeUserIndex === users.length - 1 ? 0 : activeUserIndex + 1;
    setActiveUserIndex(newIndex);
    setActiveUser(users[newIndex]);

    // Reset playback
    setIsPlaying(false);
    setPlaybackProgress(0);

    // Show time range modal for the new user
    setShowTimeModal(true);
    setIsMinimized(false);
    setDataLoaded(false);
  };

  // Handle edge swipe for navigation
  const handleEdgeSwipe = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      navigateToPrevUser();
    } else {
      navigateToNextUser();
    }
  };

  // Handle playback progress change
  const handleProgressChange = (e: CustomEvent) => {
    const newProgress = e.detail.value as number;
    setPlaybackProgress(newProgress);
  };

  // Toggle playback state
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  // Handle playback speed change
  const handleSpeedChange = (e: CustomEvent) => {
    const newSpeed = e.detail.value as number;
    setPlaybackSpeed(newSpeed);
  };

  // Format a timestamp for display
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Handle centering on latest point
  const handleCenterOnLatest = () => {
    if (latestMarkerPosition) {
      setCenter({
        lng: latestMarkerPosition.lng,
        lat: latestMarkerPosition.lat,
      });
    }
  };

  // Handle the time range form
  const handleShowTimeForm = () => {
    setShowTimeModal(true);
    setIsMinimized(false);
  };

  // Toggle minimized state
  const toggleMinimized = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle className="font-medium">Trajectory</IonTitle>
          {dataLoaded && (
            <IonButton
              slot="end"
              fill="clear"
              color="dark"
              onClick={handleShowTimeForm}
            >
              <IonIcon icon={calendar} slot="icon-only" />
            </IonButton>
          )}
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

          {/* Status bar */}
          <div
            className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-90 rounded-lg shadow-lg px-4 py-2 w-5/6 text-center"
            style={{ zIndex: 20 }}
          >
            <h3 className="font-medium text-gray-800">
              {activeUser?.id === '1'
                ? 'My Trajectory'
                : `${activeUser?.name}'s Trajectory`}
            </h3>
            <p className="text-sm text-gray-600">
              {dataLoaded
                ? visiblePoints.length > 0
                  ? `${formatTimestamp(
                      visiblePoints[0].timestamp,
                    )} - ${formatTimestamp(
                      visiblePoints[visiblePoints.length - 1].timestamp,
                    )}`
                  : `${formatTimestamp(
                      currentTimeRange.start,
                    )} - ${formatTimestamp(currentTimeRange.end)}`
                : 'Select time range to view trajectory'}
            </p>
          </div>

          {/* Map container */}
          <div
            className="absolute top-0 left-0 w-full h-full"
            style={{ zIndex: 1 }}
          >
            <Map
              center={center}
              zoom={14}
              style={{ height: '100%', width: '100%' }}
              enableScrollWheelZoom={true}
              autoLocate={false}
              mapType="normal"
              heading={0}
              tilt={0}
              ref={mapRef}
            >
              {/* Map Controls */}
              <ScaleControl />
              <ZoomControl />
              <NavigationControl />

              {/* Render trajectory polyline */}
              {convertedPoints.length > 1 && (
                <Polyline
                  path={convertedPoints}
                  strokeColor={trajectories[0]?.color || '#3880ff'}
                  strokeWeight={5}
                  strokeOpacity={0.8}
                />
              )}

              {/* Render start point marker */}
              {startMarkerPosition && (
                <Marker
                  position={startMarkerPosition}
                  icon={'start'}
                  offset={{ width: 0, height: -10 }}
                  customContent={
                    <div>
                      <div className="start-marker-label">Start</div>
                      <div style={{ color: '#3880ff', fontSize: '24px' }}>
                        <IonIcon icon={flag} />
                      </div>
                    </div>
                  }
                />
              )}

              {/* Render end point marker */}
              {latestMarkerPosition && (
                <Marker
                  position={latestMarkerPosition}
                  icon={'end'}
                  offset={{ width: 0, height: -10 }}
                  customContent={
                    <div>
                      <div className="end-marker-label">End</div>
                      <div style={{ color: '#ff3880', fontSize: '24px' }}>
                        <IonIcon icon={flag} />
                      </div>
                    </div>
                  }
                />
              )}
            </Map>
          </div>

          {/* Loading spinner */}
          {loading && (
            <div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white bg-opacity-70 rounded-full p-3"
              style={{ zIndex: 30 }}
            >
              <IonSpinner name="crescent" />
            </div>
          )}

          {/* Playback controls - only show when data is loaded */}
          {dataLoaded && (
            <div className="playback-controls">
              <div className="time-indicator">
                <span>
                  {visiblePoints.length > 0
                    ? formatTimestamp(visiblePoints[0].timestamp)
                    : formatTimestamp(currentTimeRange.start)}
                </span>
                <span>
                  {visiblePoints.length > 0
                    ? formatTimestamp(
                        visiblePoints[visiblePoints.length - 1].timestamp,
                      )
                    : formatTimestamp(currentTimeRange.end)}
                </span>
              </div>
              <IonRange
                min={0}
                max={100}
                value={playbackProgress}
                onIonChange={handleProgressChange}
                color="primary"
              />
              <div className="flex justify-between items-center mt-2">
                <div className="flex items-center">
                  <IonIcon icon={time} className="mr-1 text-gray-600" />
                  <span className="text-xs text-gray-600">Playback</span>
                </div>
                <IonButton
                  size="small"
                  onClick={togglePlayback}
                  color={isPlaying ? 'danger' : 'success'}
                >
                  <IonIcon slot="start" icon={isPlaying ? pause : play} />
                  {isPlaying ? 'Pause' : 'Play'}
                </IonButton>
                <div className="flex items-center speed-control">
                  <span className="text-xs text-gray-600 mr-1">Speed</span>
                  <IonRange
                    min={1}
                    max={5}
                    step={1}
                    value={playbackSpeed}
                    onIonChange={handleSpeedChange}
                    className="w-16"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Minimized time range form as a dot */}
          {isMinimized && (
            <div className="dot-modal" onClick={toggleMinimized}>
              <IonIcon icon={calendar} color="primary" size="large" />
            </div>
          )}

          {/* Controls for navigation between users */}
          <div
            className="absolute bottom-36 left-1/2 transform -translate-x-1/2 flex justify-between w-48"
            style={{ zIndex: 20 }}
          >
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

          {/* Floating button to center on latest point - only show when data is loaded */}
          {dataLoaded && (
            <IonFab
              vertical="bottom"
              horizontal="end"
              slot="fixed"
              style={{ bottom: '80px', right: '10px', zIndex: 20 }}
            >
              <IonFabButton
                onClick={handleCenterOnLatest}
                disabled={!latestMarkerPosition}
              >
                <IonIcon icon={locate} />
              </IonFabButton>
            </IonFab>
          )}
        </div>

        {/* Responsive Time Range Modal with Side Calendar */}
        <IonModal
          isOpen={showTimeModal && !isMinimized}
          onDidDismiss={() => {
            setIsMinimized(true);
          }}
          className="time-form-modal"
          backdropDismiss={true}
          showBackdrop={false}
        >
          <div className="responsive-form-container">
            {/* Time Range Form */}
            <div className="time-range-form">
              <h2 className="time-range-title">Set Time Range</h2>

              <div className="time-input-group">
                <label className="time-input-label">Start Time:</label>
                <input
                  type="text"
                  className="time-input"
                  placeholder="Select start time"
                  value={startTimeDisplay}
                  readOnly
                  onClick={() => {
                    setShowStartPicker(true);
                    setShowEndPicker(false);
                  }}
                />
              </div>

              <div className="time-input-group">
                <label className="time-input-label">End Time:</label>
                <input
                  type="text"
                  className="time-input"
                  placeholder="Select end time"
                  value={endTimeDisplay}
                  readOnly
                  onClick={() => {
                    setShowEndPicker(true);
                    setShowStartPicker(false);
                  }}
                />
              </div>

              <div className="time-form-buttons">
                <button className="cancel-button" onClick={handleCancel}>
                  Cancel
                </button>
                <button className="confirm-button" onClick={handleConfirm}>
                  Confirm
                </button>
              </div>
            </div>

            {/* Side Calendar - Only render when a picker is active */}
            {(showStartPicker || showEndPicker) && (
              <div className="calendar-container">
                {showStartPicker && (
                  <IonDatetime
                    value={startTime}
                    presentation="date-time"
                    hourCycle="h23"
                    firstDayOfWeek={1}
                    minuteValues="0"
                    onIonChange={handleStartTimeChange}
                  />
                )}

                {showEndPicker && (
                  <IonDatetime
                    value={endTime}
                    presentation="date-time"
                    hourCycle="h23"
                    firstDayOfWeek={1}
                    minuteValues="0"
                    onIonChange={handleEndTimeChange}
                  />
                )}
              </div>
            )}
          </div>
        </IonModal>
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

export default Tab1;
