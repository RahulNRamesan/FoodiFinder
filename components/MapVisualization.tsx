import React, { useEffect, useRef } from 'react';
import { FoodSpot, Coordinates } from '../types';

// Declare Leaflet global type
declare const L: any;

interface MapProps {
  spots: FoodSpot[];
  center: Coordinates;
  selectedSpotId: string | null;
  onSelectSpot: (spot: FoodSpot) => void;
  mapType: 'map' | 'satellite';
}

export const MapVisualization: React.FC<MapProps> = ({ spots, center, selectedSpotId, onSelectSpot, mapType }) => {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const tileLayerRef = useRef<any>(null);

  // Initialize Map
  useEffect(() => {
    if (containerRef.current && !mapRef.current) {
      // Create map
      mapRef.current = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: false,
        touchZoom: true,
        scrollWheelZoom: true,
        dragging: true
      }).setView([center.lat, center.lng], 13);

      // Add Zoom Control to bottom right
      L.control.zoom({
        position: 'bottomright'
      }).addTo(mapRef.current);
    }

    return () => {
      // Cleanup happens naturally in React, but Leaflet instances are manual
      // We keep the instance alive for performance in this demo
    };
  }, []); // Run once

  // Handle Tile Layer Updates (Map vs Satellite)
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove existing layer
    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    const tileUrl = mapType === 'satellite' 
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
      
    const attribution = mapType === 'satellite'
      ? 'Tiles &copy; Esri'
      : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

    tileLayerRef.current = L.tileLayer(tileUrl, {
      attribution: attribution,
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(mapRef.current);

  }, [mapType]);

  // Update View on Center Change
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.flyTo([center.lat, center.lng], 13, {
        duration: 1.5,
        easeLinearity: 0.25
      });
    }
  }, [center]);

  // Update Markers
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove old markers
    Object.values(markersRef.current).forEach((marker: any) => marker.remove());
    markersRef.current = {};

    spots.forEach(spot => {
      const isSelected = selectedSpotId === spot.id;
      
      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="marker-pin ${isSelected ? 'selected' : ''}"></div>`,
        iconSize: [30, 42],
        iconAnchor: [15, 42]
      });

      const marker = L.marker([spot.coordinates.lat, spot.coordinates.lng], { icon: customIcon })
        .addTo(mapRef.current)
        .on('click', () => onSelectSpot(spot));
      
      // Add simple tooltip
      marker.bindTooltip(spot.name, {
        permanent: false,
        direction: 'top',
        offset: [0, -35],
        className: 'bg-white px-2 py-1 rounded shadow text-xs font-bold border border-slate-200'
      });

      if (isSelected) {
        marker.setZIndexOffset(1000);
      }

      markersRef.current[spot.id] = marker;
    });

  }, [spots, selectedSpotId, onSelectSpot]);

  return (
    <div className="w-full h-full relative z-0">
      <div ref={containerRef} className="w-full h-full" style={{ background: '#f1f5f9' }} />
      <div className="absolute bottom-1 right-1 text-[10px] text-slate-400 bg-white/80 px-1 rounded z-[400] pointer-events-none">
         Leaflet | &copy; {mapType === 'map' ? 'CartoDB' : 'Esri'}
      </div>
    </div>
  );
};