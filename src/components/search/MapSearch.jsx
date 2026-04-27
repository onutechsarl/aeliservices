import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { Button } from '../../ui/Button';
import { ArrowRight, MapPin, Navigation, AlertTriangle } from 'lucide-react';

const providerIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

/**
 * UI component responsible for rendering route handler.
 */
function RouteHandler({ providers, userPos, setRoutes }) {
    const map = useMap();

    const calculateRoutes = useCallback(async () => {
        if (!userPos || !providers || providers.length === 0) return;

        const newRoutes = [];
        const bounds = L.latLngBounds([userPos.lat, userPos.lng]);

        for (const item of providers) {
            const lat = parseFloat(item.latitude);
            const lng = parseFloat(item.longitude);
            if (isNaN(lat) || isNaN(lng)) continue;

            bounds.extend([lat, lng]);

            try {

                const url = `https://router.project-osrm.org/route/v1/driving/${userPos.lng},${userPos.lat};${lng},${lat}?overview=full&geometries=geojson`;
                const response = await fetch(url);
                const data = await response.json();

                if (data.routes && data.routes[0]) {
                    const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
                    newRoutes.push({ id: item.id, coords });
                }
            } catch (error) {
                console.error("Erreur de calcul d'itinéraire:", error);
            }
        }

        setRoutes(newRoutes);
        map.fitBounds(bounds, { padding: [70, 70], animate: true });
    }, [providers, userPos, map, setRoutes]);

    useEffect(() => {
        calculateRoutes();
    }, [calculateRoutes]);

    return null;
}

/**
 * UI component responsible for rendering map search.
 */
export function MapSearch({ providers }) {
    const navigate = useNavigate();
    const [userPos, setUserPos] = useState(null);
    const [routes, setRoutes] = useState([]);
    const [geoError, setGeoError] = useState(false);

    useEffect(() => {
        if (!navigator.geolocation) {
            setGeoError(true);
            return;
        }

        const options = { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 };

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setGeoError(false);
            },
            (err) => {
                console.error("Erreur Géo:", err);
                setGeoError(true);

                setUserPos({ lat: 4.051, lng: 9.767 });
            },
            options
        );
    }, []);

    return (
        <div className="h-[600px] w-full rounded-3xl overflow-hidden border-4 border-white shadow-2xl relative">
            {geoError && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1001] bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-full text-xs flex items-center gap-2 shadow-lg">
                    <AlertTriangle size={14} />
                    Activez le GPS pour voir l'itinéraire
                </div>
            )}

            <MapContainer center={[4.05, 9.70]} zoom={12} className="h-full w-full">
                <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                <TileLayer url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png" />

                <RouteHandler providers={providers} userPos={userPos} setRoutes={setRoutes} />

                {userPos && (
                    <Marker position={[userPos.lat, userPos.lng]} icon={userIcon}>
                        <Popup className="font-semibold text-blue-600">Votre position</Popup>
                    </Marker>
                )}

                {routes.map(r => (
                    <Polyline
                        key={r.id}
                        positions={r.coords}
                        pathOptions={{ color: '#3b82f6', weight: 5, opacity: 0.8, dashArray: '10, 15' }}
                    />
                ))}

                {providers.map((item) => {
                    const lat = parseFloat(item.latitude);
                    const lng = parseFloat(item.longitude);
                    if (isNaN(lat) || isNaN(lng)) return null;

                    return (
                        <Marker key={item.id} position={[lat, lng]} icon={providerIcon}>
                            <Popup className="custom-provider-popup">
                                <div className="p-2 min-w-[180px] max-w-[280px]">
                                    <h4 className="font-bold text-slate-900 mb-1 truncate text-sm">
                                        {item.businessName}
                                    </h4>

                                    <p className="text-[10px] text-slate-500 flex items-start gap-1 mb-2 leading-tight">
                                        <MapPin size={10} className="text-red-500 shrink-0 mt-0.5" />
                                        <span className="line-clamp-2">{item.location}</span>
                                    </p>

                                    <div className="mb-3">
                                        <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-3 italic bg-slate-50 p-1.5 rounded-md border-l-2 border-red-400">
                                            {item.description || "Aucune description disponible."}
                                        </p>
                                    </div>

                                    <Button
                                        variant="gradient"
                                        size="sm"
                                        onClick={() => navigate('/consult-provider', {
                                            state: { mode: "consultationCustomers", data: item }
                                        })}
                                        className="w-full h-8 text-[11px] rounded-lg shadow-sm"
                                    >
                                        Consulter <ArrowRight size={12} className="ml-1" />
                                    </Button>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
}