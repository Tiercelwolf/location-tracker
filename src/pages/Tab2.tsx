import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, IonIcon, IonFab, IonFabButton } from '@ionic/react';
import { locate, share, bookmark } from 'ionicons/icons';
import './Tab2.css';

const Tab2: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Live Tracking</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Live Tracking</IonTitle>
          </IonToolbar>
        </IonHeader>
        
        <div className="h-full relative">
          {/* Map placeholder - in a real app, this would be a map component */}
          <div className="h-full w-full bg-gray-200 flex items-center justify-center">
            <div className="text-center p-6">
              <p className="text-xl mb-4">Map View</p>
              <p className="text-gray-500 mb-4">Real map implementation will be displayed here</p>
              <IonButton>
                <IonIcon icon={locate} slot="start" />
                Center on my location
              </IonButton>
            </div>
          </div>
          
          {/* Location info panel */}
          <div className="absolute bottom-16 left-0 right-0 mx-auto w-full max-w-md p-4 bg-white dark:bg-gray-800 rounded-t-lg shadow-lg">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">Current Location</h3>
                <p className="text-gray-500">Latitude: 37.7749, Longitude: -122.4194</p>
                <p className="text-gray-500">Updated: Just now</p>
              </div>
              <div className="flex">
                <IonButton fill="clear" color="primary">
                  <IonIcon slot="icon-only" icon={share} />
                </IonButton>
                <IonButton fill="clear" color="primary">
                  <IonIcon slot="icon-only" icon={bookmark} />
                </IonButton>
              </div>
            </div>
          </div>
          
          {/* Start/Stop tracking FAB */}
          <IonFab vertical="bottom" horizontal="end" slot="fixed">
            <IonFabButton color="success">
              <IonIcon icon={locate} />
            </IonFabButton>
          </IonFab>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Tab2;