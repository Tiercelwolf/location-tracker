import { useState, useEffect } from 'react';
import { Camera, CameraResultType, CameraSource, type Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { isPlatform } from '@ionic/react';

export interface UserPhoto {
  filepath: string;
  webviewPath?: string;
}

const LOCATION_STORAGE = 'location_history';

export function usePhotoGallery() {
  const [photos, setPhotos] = useState<UserPhoto[]>([]);
  
  useEffect(() => {
    const loadSaved = async () => {
      // In Capacitor 7, Preferences API returns the value directly
      const saved = await Preferences.get({ key: LOCATION_STORAGE });
      const photosInStorage = (saved.value ? JSON.parse(saved.value) : []) as UserPhoto[];
      
      if (!isPlatform('hybrid')) {
        for (let photo of photosInStorage) {
          try {
            const file = await Filesystem.readFile({
              path: photo.filepath,
              directory: Directory.Data,
            });
            
            photo.webviewPath = `data:image/jpeg;base64,${file.data}`;
          } catch (e) {
            console.error('Error loading photo', e);
          }
        }
      }
      
      setPhotos(photosInStorage);
    };
    
    loadSaved();
  }, []);
  
  const savePhoto = async (photo: Photo, fileName: string): Promise<UserPhoto> => {
    let base64Data: string;
    
    // "hybrid" will detect if we are running on iOS or Android
    if (isPlatform('hybrid')) {
      const file = await Filesystem.readFile({
        path: photo.path!,
      });
      // In Capacitor 7, readFile returns a different structure
      base64Data = typeof file.data === 'string' ? file.data : '';
    } else {
      base64Data = await base64FromPath(photo.webPath!);
    }
    
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data,
    });
    
    if (isPlatform('hybrid')) {
      // Display the new image by rewriting the 'file://' path to HTTP
      return {
        filepath: savedFile.uri,
        webviewPath: photo.webPath,
      };
    } else {
      // Use webPath to display the new image instead of base64 since it's
      // already loaded into memory
      return {
        filepath: fileName,
        webviewPath: photo.webPath,
      };
    }
  };
  
  const takePhoto = async () => {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        quality: 100,
      });
      
      const fileName = new Date().getTime() + '.jpeg';
      const savedFileImage = await savePhoto(photo, fileName);
      
      const newPhotos = [savedFileImage, ...photos];
      setPhotos(newPhotos);
      
      Preferences.set({
        key: LOCATION_STORAGE,
        value: JSON.stringify(newPhotos),
      });
    } catch (e) {
      console.error('Error taking photo', e);
    }
  };
  
  return {
    photos,
    takePhoto,
  };
};

export async function base64FromPath(path: string): Promise<string> {
  const response = await fetch(path);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        reject('method did not return a string');
      }
    };
    reader.readAsDataURL(blob);
  });
}