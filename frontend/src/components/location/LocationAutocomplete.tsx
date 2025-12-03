'use client';

/**
 * LocationAutocomplete Component
 * Reusable component for Google Places autocomplete with location detection
 */

import { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useGooglePlaces } from '@/hooks/useGooglePlaces';
import { toast } from 'sonner';
import { LocationData } from '@/shared-types/google-places.types';

interface LocationAutocompleteProps {
  onLocationSelect: (location: LocationData) => void;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function LocationAutocomplete({
  onLocationSelect,
  defaultValue = '',
  placeholder = 'Enter your business address',
  disabled = false,
  className = '',
}: LocationAutocompleteProps) {
  const [inputValue, setInputValue] = useState(defaultValue);
  const [showPredictions, setShowPredictions] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isSelectingRef = useRef(false); // Track if user is selecting a location

  const {
    predictions,
    isLoading,
    error,
    searchPlaces,
    selectPlace,
    getCurrentLocation,
    clearPredictions,
    clearError,
  } = useGooglePlaces();

  // Update input value when defaultValue changes
  useEffect(() => {
    setInputValue(defaultValue);
  }, [defaultValue]);

  // Handle input change with debouncing
  useEffect(() => {
    // Don't search if user just selected a location
    if (isSelectingRef.current) {
      isSelectingRef.current = false;
      return;
    }

    const timeoutId = setTimeout(() => {
      if (inputValue.length >= 3) {
        searchPlaces(inputValue);
        setShowPredictions(true);
      } else {
        clearPredictions();
        setShowPredictions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [inputValue, searchPlaces, clearPredictions]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowPredictions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error('Location Error', {
        description: error,
      });
      clearError();
    }
  }, [error, clearError]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handlePredictionClick = async (placeId: string, description: string) => {
    // Set flag to prevent search from re-triggering
    isSelectingRef.current = true;
    
    // Close dropdown and clear predictions FIRST to prevent re-triggering search
    setShowPredictions(false);
    clearPredictions();
    
    // Then update the input value
    setInputValue(description);

    const locationData = await selectPlace(placeId);
    if (locationData) {
      onLocationSelect(locationData);
      toast.success('Location selected', {
        description: 'Address fields have been filled automatically',
      });
    }
  };

  const handleUseCurrentLocation = async () => {
    setIsGettingLocation(true);
    const locationData = await getCurrentLocation();
    setIsGettingLocation(false);

    if (locationData) {
      setInputValue(locationData.formattedAddress || locationData.addressLine1);
      onLocationSelect(locationData);
      toast.success('Location detected', {
        description: 'Your address has been filled in automatically',
      });
    }
  };

  const handleClearInput = () => {
    setInputValue('');
    clearPredictions();
    setShowPredictions(false);
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={disabled}
            className="pl-10 pr-10"
            onFocus={() => {
              if (predictions.length > 0) {
                setShowPredictions(true);
              }
            }}
          />
          {inputValue && !disabled && (
            <button
              type="button"
              onClick={handleClearInput}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          size="default"
          onClick={handleUseCurrentLocation}
          disabled={disabled || isGettingLocation}
          className="gap-2 whitespace-nowrap"
        >
          {isGettingLocation ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Detecting...
            </>
          ) : (
            <>
              <Navigation className="h-4 w-4" />
              Use My Location
            </>
          )}
        </Button>
      </div>

      {/* Predictions Dropdown */}
      {showPredictions && predictions.length > 0 && (
        <Card
          ref={dropdownRef}
          className="absolute z-50 w-full mt-2 max-h-[300px] overflow-y-auto shadow-lg"
        >
          <div className="py-2">
            {predictions.map((prediction) => (
              <button
                key={prediction.placeId}
                type="button"
                onClick={() => handlePredictionClick(prediction.placeId, prediction.description)}
                className="w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-start gap-3"
              >
                <MapPin className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">
                    {prediction.structuredFormatting.mainText}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {prediction.structuredFormatting.secondaryText}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* No results message */}
      {showPredictions && !isLoading && inputValue.length >= 3 && predictions.length === 0 && (
        <Card ref={dropdownRef} className="absolute z-50 w-full mt-2 shadow-lg">
          <div className="px-4 py-3 text-sm text-muted-foreground text-center">
            No locations found. Try a different search.
          </div>
        </Card>
      )}
    </div>
  );
}
