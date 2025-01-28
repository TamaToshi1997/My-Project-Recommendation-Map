import React, { useEffect, useRef } from 'react';

const MapDisplay = ({ plan, onCircleChange, radius, center: initialCenter, googleApi, rangeType = 'circle' }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const directionsServiceRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const infoWindowRef = useRef(null);
  const markersRef = useRef([]);
  const circleRef = useRef(null);

  // 円を表示すべきかどうかを判定
  const shouldShowCircle = () => {
    // テキストによる指定の場合のみ非表示
    if (rangeType === 'text') return false;
    return true;
  };

  // 地図の初期化
  useEffect(() => {
    if (!mapRef.current || !googleApi) return;

    const initializeMap = async () => {
      try {
        if (!mapInstanceRef.current) {
          mapInstanceRef.current = new googleApi.maps.Map(mapRef.current, {
            center: initialCenter,
            zoom: 12,
            mapId: process.env.REACT_APP_GOOGLE_MAPS_ID
          });

          directionsServiceRef.current = new googleApi.maps.DirectionsService();
          directionsRendererRef.current = new googleApi.maps.DirectionsRenderer({
            map: mapInstanceRef.current,
            suppressMarkers: true
          });

          infoWindowRef.current = new googleApi.maps.InfoWindow();
        }

        // 既存のクリックリスナーを削除
        if (mapInstanceRef.current) {
          googleApi.maps.event.clearListeners(mapInstanceRef.current, 'click');
          
          // 円による指定の場合のみ、クリックリスナーを追加
          if (shouldShowCircle()) {
            mapInstanceRef.current.addListener('click', (event) => {
              if (onCircleChange) {
                const newCenter = event.latLng.toJSON();
                onCircleChange(newCenter, radius);
              }
            });
          }
        }

      } catch (error) {
        console.error('Map initialization error:', error);
      }
    }

    initializeMap();
  }, [googleApi, rangeType, plan]);

  // 円の更新
  const updateCircle = (center, radius) => {
    if (!googleApi || !mapInstanceRef.current) return;

    if (circleRef.current) {
      circleRef.current.setMap(null);
    }

    if (shouldShowCircle() && center) {
      circleRef.current = new googleApi.maps.Circle({
        strokeColor: '#FF0000',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#FF0000',
        fillOpacity: 0.35,
        map: mapInstanceRef.current,
        center: center,
        radius: Number(radius),
        clickable: true
      });

      // 円のクリックイベントを追加
      circleRef.current.addListener('click', (event) => {
        if (onCircleChange) {
          const newCenter = event.latLng.toJSON();
          onCircleChange(newCenter, radius);
        }
      });
    }
  };

  // 円の更新処理
  useEffect(() => {
    if (googleApi && mapInstanceRef.current && initialCenter) {
      if (shouldShowCircle()) {
        updateCircle(initialCenter, radius || 1000);
      } else if (circleRef.current) {
        circleRef.current.setMap(null);
      }
    }
  }, [initialCenter, radius, googleApi, rangeType, plan]);

  // プランが変更されたときの処理
  useEffect(() => {
    // 既存のマーカーをクリア
    markersRef.current.forEach(marker => {
      marker.setMap(null);  // setMap(null)を使用してマーカーを削除
    });
    markersRef.current = [];

    // ルートをクリア
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setDirections({ routes: [] });
    }

    if (!plan || !googleApi || !directionsServiceRef.current || !directionsRendererRef.current) return;

    console.log('Updating map with plan:', plan);

    const locations = plan.locations;
    if (!locations || !locations.length) return;

    // 情報ウィンドウの初期化
    if (!infoWindowRef.current) {
      infoWindowRef.current = new googleApi.maps.InfoWindow();
    }

    const geocodeLocation = (locationData) => {
      return new Promise((resolve, reject) => {
        const geocoder = new googleApi.maps.Geocoder();
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
            travelMode: googleApi.maps.TravelMode.WALKING,
            optimizeWaypoints: true
          };

          directionsServiceRef.current.route(request, (result, status) => {
            if (status === 'OK') {
              directionsRendererRef.current.setDirections(result);

              locationDetails.forEach((detail, index) => {
                const markerView = new googleApi.maps.Marker({
                  map: mapInstanceRef.current,
                  position: detail.position,
                  title: detail.name,
                  label: String(index + 1)
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

                markersRef.current.push(markerView);
              });

              // 地図の表示領域を調整
              const bounds = new googleApi.maps.LatLngBounds();
              locationDetails.forEach(detail => {
                bounds.extend(detail.position);
              });
              mapInstanceRef.current.fitBounds(bounds);
            }
          });
        }
      } catch (error) {
        console.error('Error setting up route:', error);
      }
    };

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
  }, [plan]);

  return <div ref={mapRef} style={{ height: '100%', width: '100%' }} />;
};

export default MapDisplay;