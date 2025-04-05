'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Libraries } from '@react-google-maps/api';
import { Input } from './ui/input';
import { Search } from 'lucide-react';

interface MapProps {
  center?: {
    lat: number;
    lng: number;
  };
  zoom?: number;
  width?: string;
  height?: string;
  className?: string;
  onLocationSelect?: (location: { address: string; lat: number; lng: number; mapsLink: string }) => void;
  defaultAddress?: string;
}

const defaultCenter = {
  lat: 30.0444,
  lng: 31.2357,
};

const libraries: Libraries = ['places'];

const Map: React.FC<MapProps> = ({
  center = defaultCenter,
  zoom = 12,
  width = '100%',
  height = '400px',
  className,
  onLocationSelect,
  defaultAddress,
}) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [searchInput, setSearchInput] = useState(defaultAddress || '');
  const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null);

  const containerStyle = {
    width,
    height,
  };

  const updateMarker = useCallback((location: google.maps.LatLng, address: string | undefined) => {
    if (!map) return;

    // Remove existing marker
    if (marker) {
      marker.setMap(null);
    }

    // Create new marker
    const newMarker = new window.google.maps.Marker({
      map,
      position: location,
      animation: window.google.maps.Animation.DROP,
    });

    setMarker(newMarker);
    if (address) setSearchInput(address);

    // Create Google Maps link
    const mapsLink = `https://www.google.com/maps?q=${location.lat()},${location.lng()}`;

    // Notify parent component
    if (onLocationSelect && address) {
      onLocationSelect({
        address,
        lat: location.lat(),
        lng: location.lng(),
        mapsLink,
      });
    }
  }, [map, marker, onLocationSelect]);

  useEffect(() => {
    if (isLoaded && map) {
      // Initialize SearchBox
      const input = document.getElementById('location-search') as HTMLInputElement;
      const searchBox = new window.google.maps.places.SearchBox(input);
      searchBoxRef.current = searchBox;

      // Bias SearchBox results towards current map's viewport
      map.addListener('bounds_changed', () => {
        searchBox.setBounds(map.getBounds() as google.maps.LatLngBounds);
      });

      // Listen for place selection
      searchBox.addListener('places_changed', () => {
        const places = searchBox.getPlaces();
        if (!places?.length) return;

        const place = places[0];
        if (!place.geometry || !place.geometry.location) return;

        // Update map
        map.setCenter(place.geometry.location);
        map.setZoom(17);

        // Update marker and notify parent
        updateMarker(place.geometry.location, place.formatted_address);
      });

      // If default address is provided, search for it
      if (defaultAddress) {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address: defaultAddress }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const location = results[0].geometry.location;
            map.setCenter(location);
            map.setZoom(17);
            updateMarker(location, results[0].formatted_address);
          }
        });
      }

      return () => {
        window.google.maps.event.clearInstanceListeners(searchBox);
      };
    }
  }, [isLoaded, map, defaultAddress, updateMarker]);

  const handleMapClick = useCallback(async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;

    const geocoder = new window.google.maps.Geocoder();
    try {
      const response = await geocoder.geocode({ location: e.latLng });
      if (response.results[0]) {
        updateMarker(e.latLng, response.results[0].formatted_address);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  }, [updateMarker]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  if (!isLoaded) {
    return <div className="animate-pulse bg-gray-200 rounded" style={containerStyle} />;
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Input
          id="location-search"
          type="text"
          placeholder="Search for a location"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pr-10"
        />
        <Search className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground" />
      </div>
      <div className={className}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={zoom}
          onLoad={onLoad}
          onUnmount={onUnmount}
          onClick={handleMapClick}
        >
          {marker && <Marker position={marker.getPosition() as google.maps.LatLng} />}
        </GoogleMap>
      </div>
    </div>
  );
};

export default Map;