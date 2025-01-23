import React, { useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

const MapDisplay = ({ route, locationText, onLocationUpdate }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const directionsServiceRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const googleRef = useRef(null);
  const infoWindowRef = useRef(null);
  const markersRef = useRef([]); // マーカーを追跡するための配列

  // マップの初期化
  useEffect(() => {
    if (!mapRef.current) return;

    const initializeMap = async () => {
      try {
        console.log('Initializing map...');
        const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
        console.log('API Key status:', apiKey ? 'Present' : 'Missing');
        
        const loader = new Loader({
          apiKey: apiKey || '',
          version: 'weekly'
        });

        const google = await loader.load();
        googleRef.current = google;

        // 必要なライブラリを個別に読み込む
        await google.maps.importLibrary("places");
        await google.maps.importLibrary("marker");

        const initialCenter = { lat: 35.681236, lng: 139.767125 };
        
        if (!mapInstanceRef.current) {
          mapInstanceRef.current = new google.maps.Map(mapRef.current, {
            center: route?.center || initialCenter,
            zoom: 12,
            mapId: process.env.REACT_APP_GOOGLE_MAPS_ID
          });

          directionsServiceRef.current = new google.maps.DirectionsService();
          directionsRendererRef.current = new google.maps.DirectionsRenderer({
            map: mapInstanceRef.current,
            suppressMarkers: true
          });
        } else {
          mapInstanceRef.current.setCenter(route?.center || initialCenter);
        }
      } catch (error) {
        console.error('Map initialization error:', error);
        console.error('Environment variables:', process.env);
      }
    };

    initializeMap();
  }, []);

  // locationTextが変更されたときの処理
  useEffect(() => {
    if (!locationText || !googleRef.current || !directionsServiceRef.current || !directionsRendererRef.current) return;

    // 既存のマーカーをクリア
    markersRef.current.forEach(marker => {
      marker.map = null;  // マーカーを地図から削除
    });
    markersRef.current = [];  // マーカー配列をリセット

    // ルートをクリア
    directionsRendererRef.current.setDirections({ routes: [] });

    const locations = JSON.parse(locationText);
    if (!locations.length) return;

    // 情報ウィンドウの初期化
    if (!infoWindowRef.current) {
      infoWindowRef.current = new googleRef.current.maps.InfoWindow();
    }

    const geocodeLocation = (locationData) => {
      return new Promise((resolve, reject) => {
        const geocoder = new googleRef.current.maps.Geocoder();
        geocoder.geocode({ address: locationData.address }, (results, status) => {
          if (status === 'OK' && results[0]) {
            resolve({
              position: {
                lat: results[0].geometry.location.lat(),
                lng: results[0].geometry.location.lng()
              },
              name: locationData.name,
              description: locationData.description,
              address: locationData.address
            });
          } else {
            reject(status);
          }
        });
      });
    };

    const setupRoute = async () => {
      try {
        // すべての場所の座標と情報を取得
        const locationDetails = await Promise.all(locations.map(geocodeLocation));
        
        if (locationDetails.length > 0) {
          const origin = locationDetails[0].position;
          const destination = locationDetails[locationDetails.length - 1].position;
          const waypoints = locationDetails.slice(1, -1).map(detail => ({
            location: detail.position,
            stopover: true
          }));

          const request = {
            origin,
            destination,
            waypoints,
            travelMode: googleRef.current.maps.TravelMode.WALKING,
            optimizeWaypoints: true
          };

          directionsServiceRef.current.route(request, (result, status) => {
            if (status === 'OK') {
              directionsRendererRef.current.setDirections(result);
              
              // 新しいマーカーを作成し、配列に追加
              locationDetails.forEach((detail, index) => {
                const markerView = new googleRef.current.maps.marker.AdvancedMarkerElement({
                  map: mapInstanceRef.current,
                  position: detail.position,
                  title: detail.name,
                  content: buildMarkerContent(index + 1)
                });

                markerView.addListener('click', () => {
                  const content = `
                    <div style="padding: 10px;">
                      <h3 style="margin: 0 0 8px 0;">${detail.name}</h3>
                      <p style="margin: 0 0 8px 0; color: #666; font-size: 0.9em;">${detail.address}</p>
                      <p style="margin: 0;">${detail.description}</p>
                    </div>
                  `;
                  infoWindowRef.current.setContent(content);
                  infoWindowRef.current.open(mapInstanceRef.current, markerView);
                });

                markersRef.current.push(markerView);  // マーカーを配列に追加
              });

              const path = result.routes[0].overview_path.map(point => ({
                lat: point.lat(),
                lng: point.lng()
              }));
              onLocationUpdate({ center: origin, path });
            }
          });
        }
      } catch (error) {
        console.error('Error setting up route:', error);
      }
    };

    // マーカーの見た目を作成する関数
    const buildMarkerContent = (number) => {
      const content = document.createElement('div');
      content.classList.add('marker');
      content.style.backgroundColor = '#1976d2';
      content.style.color = 'white';
      content.style.padding = '8px 12px';
      content.style.borderRadius = '50%';
      content.style.fontSize = '14px';
      content.style.fontWeight = 'bold';
      content.style.display = 'flex';
      content.style.justifyContent = 'center';
      content.style.alignItems = 'center';
      content.textContent = `${number}`;
      return content;
    };

    setupRoute();
  }, [locationText, onLocationUpdate]);

  return <div ref={mapRef} style={{ height: '500px', width: '100%' }} />;
};

export default MapDisplay;