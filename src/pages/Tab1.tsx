import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonFab, IonFabButton, IonIcon, IonGrid, IonRow, IonCol, IonImg } from '@ionic/react';
import { camera } from 'ionicons/icons';
import { usePhotoGallery } from '../hooks/usePhotoGallery';
import './Tab1.css';

const Tab1: React.FC = () => {
  const { photos, takePhoto } = usePhotoGallery();
  
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Location History</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Location History</IonTitle>
          </IonToolbar>
        </IonHeader>
        
        <IonGrid>
          <IonRow>
            {photos.map((photo, index) => (
              <IonCol size="6" key={index}>
                <IonImg src={photo.webviewPath} className="rounded-lg shadow-md" />
              </IonCol>
            ))}
          </IonRow>
        </IonGrid>
        
        {photos.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center p-6">
              <p className="text-xl mb-4">No photos yet</p>
              <p className="text-gray-500">Tap the camera button to take your first photo</p>
            </div>
          </div>
        )}
        
        <IonFab vertical="bottom" horizontal="center" slot="fixed">
          <IonFabButton onClick={() => takePhoto()}>
            <IonIcon icon={camera}></IonIcon>
          </IonFabButton>
        </IonFab>
      </IonContent>
    </IonPage>
  );
};

export default Tab1;