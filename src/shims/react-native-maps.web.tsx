import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface LatLng {
  latitude: number;
  longitude: number;
}

export const PROVIDER_DEFAULT = 'default';
export const PROVIDER_GOOGLE = 'google';

export const Marker: React.FC<any> = ({ coordinate, onPress, children, style }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.markerContainer, style]}
    >
      {children}
    </TouchableOpacity>
  );
};

export const Callout: React.FC<any> = ({ children }) => <View>{children}</View>;
export const Polygon: React.FC<any> = () => null;
export const Polyline: React.FC<any> = () => null;
export const Circle: React.FC<any> = () => null;
export const Overlay: React.FC<any> = () => null;

const MapView = forwardRef<any, any>((props, ref) => {
  const { style, children, initialRegion, onRegionChangeComplete } = props;
  const [region, setRegion] = useState<Region>(
    initialRegion || {
      latitude: 31.776667,
      longitude: 35.234167,
      latitudeDelta: 3.5,
      longitudeDelta: 3.5,
    }
  );

  useImperativeHandle(ref, () => ({
    animateToRegion: (newRegion: Region) => {
      setRegion(newRegion);
      onRegionChangeComplete?.(newRegion);
    },
    fitToCoordinates: () => {},
  }));

  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${(
    region.longitude - 1.5
  ).toFixed(4)}%2C${(region.latitude - 1.5).toFixed(4)}%2C${(
    region.longitude + 1.5
  ).toFixed(4)}%2C${(region.latitude + 1.5).toFixed(4)}&layer=mapnik&marker=${region.latitude.toFixed(
    4
  )}%2C${region.longitude.toFixed(4)}`;

  return (
    <View style={[styles.mapContainer, style]}>
      <iframe
        title="Biblical Places Map"
        src={osmUrl}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      />
      <View style={styles.overlayContainer} pointerEvents="box-none">
        {children}
      </View>
    </View>
  );
});

MapView.displayName = 'MapViewWeb';

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  markerContainer: {
    position: 'absolute',
  },
});

export default MapView;
