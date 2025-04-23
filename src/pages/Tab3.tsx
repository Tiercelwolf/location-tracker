import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonItem, IonLabel, IonToggle, IonList, IonListHeader, IonAvatar, IonButton, IonIcon } from '@ionic/react';
import { moon, notifications, language, help, logOut } from 'ionicons/icons';
import './Tab3.css';

const Tab3: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Profile</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="p-4 flex flex-col items-center bg-gradient-to-b from-primary-500 to-primary-600 text-white">
          <IonAvatar className="w-24 h-24 mb-4">
            <img alt="Profile" src="https://ionicframework.com/docs/img/demos/avatar.svg" />
          </IonAvatar>
          <h2 className="text-xl font-bold mb-1">John Doe</h2>
          <p className="text-sm opacity-80 mb-4">john.doe@example.com</p>
          <IonButton size="small" fill="outline" color="light">Edit Profile</IonButton>
        </div>
        
        <IonList lines="full" className="py-4">
          <IonListHeader>
            <IonLabel>Settings</IonLabel>
          </IonListHeader>
          
          <IonItem>
            <IonIcon icon={moon} slot="start" className="text-gray-500" />
            <IonLabel>Dark Mode</IonLabel>
            <IonToggle slot="end" />
          </IonItem>
          
          <IonItem>
            <IonIcon icon={notifications} slot="start" className="text-gray-500" />
            <IonLabel>Notifications</IonLabel>
            <IonToggle slot="end" checked />
          </IonItem>
          
          <IonItem detail>
            <IonIcon icon={language} slot="start" className="text-gray-500" />
            <IonLabel>Language</IonLabel>
            <div slot="end" className="text-gray-500">English</div>
          </IonItem>
          
          <IonItem detail>
            <IonIcon icon={help} slot="start" className="text-gray-500" />
            <IonLabel>Help & Support</IonLabel>
          </IonItem>
          
          <IonItem lines="none" className="mt-8">
            <IonIcon icon={logOut} slot="start" className="text-red-500" />
            <IonLabel color="danger">Log Out</IonLabel>
          </IonItem>
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default Tab3;