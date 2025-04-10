'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
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

interface AutocompleteSuggestionType {
  placePrediction: {
    text?: { text: string };
    secondaryText?: { text: string };
    description?: string;
    placeId?: string;
    place?: string;
    toPlace: () => PlaceType;
  }
}

interface PlaceType {
  location?: google.maps.LatLng;
  formattedAddress?: string;
  fetchFields: (options: { fields: string[] }) => Promise<void>;
}

interface PlacesLibraryType {
  AutocompleteSessionToken: new () => unknown;
  AutocompleteSuggestion: {
    fetchAutocompleteSuggestions: (request: {
      input: string;
      sessionToken?: unknown;
      locationBias?: google.maps.LatLngBounds | undefined;
    }) => Promise<{ suggestions: AutocompleteSuggestionType[] }>;
  };
}

const defaultCenter = {
  lat: 30.0444,
  lng: 31.2357,
};

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
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.marker.AdvancedMarkerElement | null>(null);
  const [searchInput, setSearchInput] = useState(defaultAddress || '');
  const [editingInput, setEditingInput] = useState(false);
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestionType[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sessionToken, setSessionToken] = useState<unknown>(null);

  const isFirstRender = useRef(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const dummyPlacesRef = useRef<HTMLDivElement>(null);

  const containerStyle = {
    width,
    height,
  };

  useEffect(() => {
    if (!isLoaded) return;

    const loadLibraries = async () => {
      try {
        const { importLibrary } = window.google.maps;
        await Promise.all([
          importLibrary("marker"),
          importLibrary("places")
        ]);

        const placesLib = await importLibrary("places") as unknown as PlacesLibraryType;
        if (placesLib.AutocompleteSessionToken) {
          const token = new placesLib.AutocompleteSessionToken();
          setSessionToken(token);
        }
      } catch (error) {
        console.error("Error loading Google Maps libraries:", error);
      }
    };

    loadLibraries();
  }, [isLoaded]);

  const updateMarker = useCallback((location: google.maps.LatLng, address: string | undefined) => {
    if (!map) return;

    if (marker) {
      marker.position = location;
    } else {
      try {
        const newMarker = new google.maps.marker.AdvancedMarkerElement({
          map,
          position: location,
        });
        setMarker(newMarker);
      } catch (error) {
        console.error("Error creating marker:", error);
        try {
          const standardMarker = new google.maps.Marker({
            map,
            position: location,
          });
          // @ts-expect-error fallback
          setMarker(standardMarker);
        } catch (fallbackError) {
          console.error("Error creating fallback marker:", fallbackError);
        }
      }
    }

    if (address && !editingInput) {
      setSearchInput(address);
    }

    const mapsLink = `https://www.google.com/maps?q=${location.lat()},${location.lng()}`;

    if (onLocationSelect && address) {
      onLocationSelect({
        address,
        lat: location.lat(),
        lng: location.lng(),
        mapsLink,
      });
    }
  }, [map, marker, onLocationSelect, editingInput]);

  const handleAddressSearch = useCallback(() => {
    if (!map || !searchInput.trim()) return;

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: searchInput }, function(results, status) {
      if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
        const location = results[0].geometry.location;
        map.setCenter(location);
        map.setZoom(17);
        updateMarker(location, results[0].formatted_address);
      } else {
        alert("Location not found. Please try a different search term.");
      }
    });
  }, [map, searchInput, updateMarker]);

  const fetchSuggestions = useCallback(async (input: string) => {
    if (!input.trim() || !sessionToken) return;

    try {
      const placesLib = await window.google.maps.importLibrary("places") as unknown as PlacesLibraryType;
      if (placesLib.AutocompleteSuggestion) {
        const request = {
          input: input,
          sessionToken: sessionToken,
          locationBias: map?.getBounds(),
        };

        const result = await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
        if (result.suggestions && result.suggestions.length > 0) {
          setSuggestions(result.suggestions);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
        }
      } else {
        handleAddressSearch();
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      handleAddressSearch();
    }
  }, [sessionToken, map, handleAddressSearch]);

  useEffect(() => {
    if (!searchInput.trim() || !editingInput) {
      if (!editingInput) {
        setSuggestions([]);
        setShowSuggestions(false);
      }
      return;
    }

    const debounceTimer = setTimeout(() => {
      fetchSuggestions(searchInput);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchInput, editingInput, fetchSuggestions]);

  const handleSuggestionSelect = useCallback(async (suggestion: AutocompleteSuggestionType) => {
    if (!map) return;

    try {
      setShowSuggestions(false);
      const place = suggestion.placePrediction.toPlace();
      await place.fetchFields({
        fields: ["location", "formattedAddress"]
      });

      if (place.location) {
        const location = place.location;
        map.setCenter(location);
        map.setZoom(17);

        const address = place.formattedAddress || 
                        suggestion.placePrediction.text?.text || 
                        suggestion.placePrediction.description;

        updateMarker(location, address);

        const placesLib = await google.maps.importLibrary("places") as unknown as PlacesLibraryType;
        if (placesLib.AutocompleteSessionToken) {
          setSessionToken(new placesLib.AutocompleteSessionToken());
        }
      }
    } catch (error) {
      console.error("Error selecting suggestion:", error);
      if (suggestion.placePrediction?.text?.text) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: suggestion.placePrediction.text.text }, function(results, status) {
          if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
            const location = results[0].geometry.location;
            map.setCenter(location);
            map.setZoom(17);
            updateMarker(location, results[0].formatted_address);
          }
        });
      }
    }
  }, [map, updateMarker]);

  useEffect(() => {
    if (!isLoaded || !map) return;

    if (isFirstRender.current) {
      isFirstRender.current = false;

      if (defaultAddress && defaultAddress.trim() !== '') {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: defaultAddress }, function(results, status) {
          if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
            const location = results[0].geometry.location;
            map.setCenter(location);
            map.setZoom(17);
            updateMarker(location, results[0].formatted_address);
          }
        });
      }
    }
  }, [isLoaded, map, defaultAddress, updateMarker]);

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat: e.latLng.lat(), lng: e.latLng.lng() } }, function(results, status) {
      if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
        updateMarker(e.latLng!, results[0].formatted_address);
      } else {
        const coords = `${e.latLng!.lat().toFixed(6)}, ${e.latLng!.lng().toFixed(6)}`;
        updateMarker(e.latLng!, coords);
      }
    });
  }, [updateMarker]);

  useEffect(() => {
    return () => {
      if (marker) {
        marker.map = null;
      }
    };
  }, [marker]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID || "YOUR_MAP_ID_HERE";

  if (!isLoaded) {
    return <div className="animate-pulse bg-gray-200 rounded" style={containerStyle} />;
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search for a location"
          value={searchInput}
          onChange={(e) => {
            setEditingInput(true);
            setSearchInput(e.target.value);
          }}
          onBlur={() => {
            setTimeout(() => {
              setEditingInput(false);
              setShowSuggestions(false);
            }, 200);
          }}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              setEditingInput(false);
              setShowSuggestions(false);
              handleAddressSearch();
            }
          }}
          className="pr-10 h-12 text-base px-4"
          aria-label="Search for a location"
        />
        <button 
          onClick={() => {
            setEditingInput(false);
            setShowSuggestions(false);
            handleAddressSearch();
          }}
          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </button>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <div 
                key={index}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                onClick={() => handleSuggestionSelect(suggestion)}
              >
                <div className="font-medium">
                  {suggestion.placePrediction.text?.text || suggestion.placePrediction.description}
                </div>
                {suggestion.placePrediction.secondaryText?.text && (
                  <div className="text-gray-500 text-xs">
                    {suggestion.placePrediction.secondaryText.text}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div ref={dummyPlacesRef} style={{ display: 'none' }} />

      <div className={className}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={zoom}
          onLoad={onLoad}
          onUnmount={onUnmount}
          onClick={handleMapClick}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            mapId: mapId,
          }}
        />
      </div>
    </div>
  );
};

export default Map;
