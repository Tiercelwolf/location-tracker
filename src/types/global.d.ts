// Type declarations for Baidu Maps GL API
declare namespace BMapGL {
    class Convertor {
        /**
         * Translates coordinates from one coordinate system to another.
         * @param points Array of BMapGL.Point objects to be converted.
         * @param from Source coordinate system type (e.g., 1 for WGS-84).
         * @param to Target coordinate system type (e.g., 5 for BD-09).
         * @param callback Callback function to handle the result of the conversion.
         */
        translate(
          points: Point[],
          from: number,
          to: number,
          callback: (result: { status: number; points: Point[] }) => void
        ): void;
      }

    class Point {
      constructor(lng: number, lat: number);
      lng: number;
      lat: number;
    }
    
    class Size {
      constructor(width: number, height: number);
      width: number;
      height: number;
    }
    
    class Icon {
      constructor(
        url: string,
        size: BMapGL.Size,
        opts?: {
          anchor?: BMapGL.Size;
          imageOffset?: BMapGL.Size;
          imageSize?: BMapGL.Size;
          imageUrl?: string;
          printImageUrl?: string;
        }
      );
    }
    
    class Map {
      centerAndZoom(center: BMapGL.Point, zoom: number): void;
      setCenter(center: BMapGL.Point): void;
      getZoom(): number;
      setZoom(zoom: number): void;
      getCenter(): BMapGL.Point;
      addOverlay(overlay: any): void;
      removeOverlay(overlay: any): void;
      clearOverlays(): void;
    }
  
    // Add more classes as needed
  }
  
  // Extend the Window interface
  interface Window {
    // BMapGL: typeof BMapGL;
    // BMAP_NORMAL_MAP: any;
    // BMAP_SATELLITE_MAP: any;
    // BMAP_HYBRID_MAP: any;
    initBaiduMap?: () => void;
  }
  
  // React-BMAPGl component types (simplified)
  declare module 'react-bmapgl' {
    import React from 'react';
  
    export interface MapProps {
      center?: { lng: number; lat: number };
      zoom?: number;
      style?: React.CSSProperties;
      enableScrollWheelZoom?: boolean;
      autoLocate?: boolean;
      mapType?: string;
      heading?: number;
      tilt?: number;
      ak?: string;
      [key: string]: any;
    }
  
    export interface MarkerProps {
      position: BMapGL.Point;
      icon?: any;
      offset?: { width: number; height: number };
      enableDragging?: boolean;
      enableMassClear?: boolean;
      customContent?: React.ReactNode;
      onClick?: (e: any) => void;
      onDragend?: (e: any) => void;
      [key: string]: any;
    }
  
    export interface InfoWindowProps {
      position: { lng: number; lat: number };
      width?: number;
      height?: number;
      offset?: { width: number; height: number };
      enableCloseOnClick?: boolean;
      children?: React.ReactNode;
      [key: string]: any;
    }
  
    export class Map extends React.Component<MapProps> {}
    export class Marker extends React.Component<MarkerProps> {}
    export class InfoWindow extends React.Component<InfoWindowProps> {}
    export class ScaleControl extends React.Component<any> {}
    export class ZoomControl extends React.Component<any> {}
    export class NavigationControl extends React.Component<any> {}
  }