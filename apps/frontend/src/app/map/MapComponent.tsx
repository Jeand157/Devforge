'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Search, Navigation, Layers, Map as MapIcon, Image as ImageIcon } from 'lucide-react'

// Fix pour les icônes Leaflet avec Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  })
}

interface Item {
  id: number
  title: string
  description: string
  category: string
  status: string
  location: string
  latitude?: number
  longitude?: number
  image_url?: string
  owner_id: number
}

interface MapComponentProps {
  items: Item[]
  userLocation: { lat: number; lng: number }
  onChat?: (ownerId: number) => void
}

type MapLayer = 'street' | 'satellite' | 'terrain'

export default function MapComponent({ items, userLocation, onChat }: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeLayer, setActiveLayer] = useState<MapLayer>('street')
  const [isSearching, setIsSearching] = useState(false)
  const layersRef = useRef<{ [key: string]: L.TileLayer }>({})

  const initLayers = () => {
    layersRef.current = {
      street: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }),
      satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
      }),
      terrain: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
      })
    }
  }

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    initLayers()

    const map = L.map(mapContainerRef.current, {
      zoomControl: false // On va le mettre à droite plus tard ou garder celui par défaut
    }).setView([userLocation.lat, userLocation.lng], 13)

    mapRef.current = map

    // Ajouter la couche initiale
    layersRef.current[activeLayer].addTo(map)

    // Zoom control en haut à droite
    L.control.zoom({ position: 'topright' }).addTo(map)

    // Marqueur pour la position de l'utilisateur
    const userMarker = L.circleMarker([userLocation.lat, userLocation.lng], {
      radius: 8,
      fillColor: '#3B82F6',
      color: '#fff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8
    }).addTo(map).bindPopup('<b>Votre position</b>')

    // Ajouter les marqueurs pour les objets
    items.forEach((item) => {
      if (item.latitude && item.longitude) {
        const markerColor = item.status === 'disponible' ? '#10B981' :
          item.status === 'réservé' ? '#F59E0B' : '#6B7280'

        const markerIcon = L.divIcon({
          className: 'custom-marker',
          html: `<div class="marker-pin" style="background-color: ${markerColor}"></div>`,
          iconSize: [30, 42],
          iconAnchor: [15, 42]
        })

        const statusClass = item.status === 'disponible' ? 'bg-green-100 text-green-800' :
          item.status === 'réservé' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'

        const popupContent = `
          <div class="w-48">
            ${item.image_url ? `<img src="${item.image_url}" class="w-full h-24 object-cover rounded-t-lg mb-2" />` : ''}
            <div class="px-2 pb-2">
              <h3 class="font-bold text-gray-900">${item.title}</h3>
              <p class="text-xs text-gray-500 mb-2 truncate">${item.description}</p>
              <div class="flex items-center justify-between mt-2">
                <span class="text-[10px] px-2 py-0.5 rounded-full ${statusClass}">${item.status}</span>
                <button 
                  data-owner-id="${item.owner_id}" 
                  class="chat-trigger text-blue-600 font-medium text-[10px] hover:underline flex items-center gap-1"
                >
                  💬 Contacter
                </button>
              </div>
            </div>
          </div>
        `

        L.marker([item.latitude, item.longitude], { icon: markerIcon })
          .addTo(map)
          .bindPopup(popupContent)
      }
    })

    // Délégation d'événement pour les clics sur "Contacter" dans les popups
    const handlePopupClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const chatButton = target.closest('.chat-trigger')
      if (chatButton && onChat) {
        const ownerId = chatButton.getAttribute('data-owner-id')
        if (ownerId) {
          onChat(parseInt(ownerId))
        }
      }
    }

    const container = mapContainerRef.current
    if (container) {
      container.addEventListener('click', handlePopupClick)
    }

    return () => {
      if (container) {
        container.removeEventListener('click', handlePopupClick)
      }
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [items, userLocation, onChat])

  const handleLayerChange = (layer: MapLayer) => {
    if (!mapRef.current) return
    mapRef.current.removeLayer(layersRef.current[activeLayer])
    layersRef.current[layer].addTo(mapRef.current)
    setActiveLayer(layer)
  }

  const handleLocateMe = () => {
    if (!mapRef.current) return
    mapRef.current.setView([userLocation.lat, userLocation.lng], 15)
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim() || !mapRef.current) return

    setIsSearching(true)
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()

      if (data && data.length > 0) {
        const { lat, lon } = data[0]
        mapRef.current.setView([parseFloat(lat), parseFloat(lon)], 14)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="relative group">
      {/* Search Bar overlay */}
      <div className="absolute top-4 left-4 z-[1000] w-full max-w-xs transition-all">
        <form onSubmit={handleSearch} className="relative flex items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un lieu..."
            className="w-full py-3 px-4 pl-12 bg-white rounded-full shadow-lg border-none focus:ring-2 focus:ring-blue-500 text-sm outline-none"
          />
          <Search className="absolute left-4 w-5 h-5 text-gray-400" />
          {isSearching && <div className="absolute right-4 animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />}
        </form>
      </div>

      {/* Map Type Switcher overlay */}
      <div className="absolute bottom-6 left-4 z-[1000] flex flex-col gap-2">
        <div className="bg-white rounded-xl shadow-lg p-1 flex flex-col gap-1">
          <button
            onClick={() => handleLayerChange('street')}
            className={`p-2 rounded-lg transition-colors ${activeLayer === 'street' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-600'}`}
            title="Plan"
          >
            <MapIcon size={20} />
          </button>
          <button
            onClick={() => handleLayerChange('satellite')}
            className={`p-2 rounded-lg transition-colors ${activeLayer === 'satellite' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-600'}`}
            title="Satellite"
          >
            <ImageIcon size={20} />
          </button>
          <button
            onClick={() => handleLayerChange('terrain')}
            className={`p-2 rounded-lg transition-colors ${activeLayer === 'terrain' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-600'}`}
            title="Terrain"
          >
            <Layers size={20} />
          </button>
        </div>

        <button
          onClick={handleLocateMe}
          className="bg-white p-3 rounded-full shadow-lg text-blue-600 hover:bg-blue-50 transition-colors w-12 h-12 flex items-center justify-center"
          title="Ma position"
        >
          <Navigation size={20} fill="currentColor" />
        </button>
      </div>

      <div ref={mapContainerRef} className="h-[500px] w-full rounded-2xl shadow-inner z-0" />

      <style jsx global>{`
        .custom-marker {
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        }
        
        .marker-pin {
          width: 30px;
          height: 30px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          margin-top: -15px;
          margin-left: -15px;
          border: 3px solid white;
        }
        
        .marker-pin::after {
          content: '';
          width: 12px;
          height: 12px;
          margin: 6px 0 0 6px;
          background: white;
          position: absolute;
          border-radius: 50%;
        }

        .leaflet-popup-content-wrapper {
          padding: 0;
          overflow: hidden;
          border-radius: 12px;
        }
        
        .leaflet-popup-content {
          margin: 0;
          width: 100% !important;
        }

        .leaflet-popup-tip-container {
          margin-top: -1px;
        }
      `}</style>
    </div>
  )
}
