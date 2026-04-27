import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import { MapPin, Search, Loader2, X, Check } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

const DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
})
L.Marker.prototype.options.icon = DefaultIcon

/**
 * UI component responsible for rendering location marker.
 */
function LocationMarker({ position, setPosition }) {
    useMapEvents({
        click(e) { setPosition(e.latlng) },
    })
    return position ? <Marker position={position} /> : null
}

/**
 * UI component responsible for rendering map controller.
 */
function MapController({ center, zoom }) {
    const map = useMap()
    useEffect(() => {
        if (center) map.flyTo(center, zoom, { animate: true, duration: 1.5 })
    }, [center, zoom, map])
    return null
}

/**
 * UI component responsible for rendering map picker.
 */
export function MapPicker({ onConfirm, onClose }) {
    const [mapCenter, setMapCenter] = useState([3.848, 11.502])
    const [tempPos, setTempPos] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [suggestions, setSuggestions] = useState([])
    const [isLoading, setIsLoading] = useState(false)

    /**
     * Handles handle search behavior.
     */
    const handleSearch = async (query) => {
        setSearchQuery(query)
        if (query.length < 3) return setSuggestions([])
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=cm&limit=5`)
            const data = await res.json()
            setSuggestions(data)
        } catch (e) { console.error(e) }
    }

    /**
     * Handles handle confirm behavior.
     */
    const handleConfirm = async () => {
        if (!tempPos) return
        setIsLoading(true)
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${tempPos.lat}&lon=${tempPos.lng}`)
            const data = await res.json()
            onConfirm({
                address: data.display_name,
                lat: tempPos.lat,
                lon: tempPos.lng
            })
        } catch (e) { console.error(e) }
        setIsLoading(false)
    }

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col">
                <div className="h-[500px] relative">
                    {}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[90%] md:w-2/3 z-[1000]">
                        <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
                            <div className="flex items-center px-3">
                                <Search size={18} className="text-gray-400" />
                                <input
                                    type="text"
                                    className="w-full p-3 outline-none text-sm"
                                    placeholder="Rechercher un quartier (ex: Bastos)"
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                />
                            </div>
                            {suggestions.length > 0 && (
                                <ul className="border-t max-h-40 overflow-auto">
                                    {suggestions.map((s, i) => (
                                        <li key={i} onClick={() => {
                                            const pos = [parseFloat(s.lat), parseFloat(s.lon)]
                                            setMapCenter(pos)
                                            setTempPos({ lat: pos[0], lng: pos[1] })
                                            setSuggestions([])
                                            setSearchQuery(s.display_name)
                                        }} className="p-3 text-xs hover:bg-gray-50 cursor-pointer border-b last:border-0 truncate">
                                            {s.display_name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                    <MapContainer center={mapCenter} zoom={13} style={{ height: '100%' }}>
                        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png" />
                        <MapController center={mapCenter} zoom={16} />
                        <LocationMarker position={tempPos} setPosition={setTempPos} />
                    </MapContainer>
                    <div className="absolute bottom-4 right-4 flex gap-4 z-[1000]">
                        <button onClick={onClose} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg transition-colors">
                            Annuler
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={!tempPos || isLoading}
                            className="bg-[#E8524D] text-white px-6 py-2 rounded-lg disabled:opacity-50 flex items-center gap-2"
                        >
                            {isLoading ? (
                                <span key="loading-state" className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Verification...
                                </span>
                            ) : (
                                <span key="idle-state" className="flex items-center gap-2">
                                    <Check size={18} />
                                    Confirmer ce lieu
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}