'use client'

import { useEffect, useRef } from 'react'

interface MapComponentProps {
  latitude: number
  longitude: number
  title?: string
  className?: string
}

export default function MapComponent({ latitude, longitude, title, className = "w-full h-64" }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mapRef.current) return

    // Créer une carte simple avec OpenStreetMap
    const mapElement = mapRef.current
    mapElement.innerHTML = `
      <iframe 
        src="https://www.openstreetmap.org/export/embed.html?bbox=${longitude-0.01},${latitude-0.01},${longitude+0.01},${latitude+0.01}&layer=mapnik&marker=${latitude},${longitude}"
        width="100%" 
        height="100%" 
        style="border: none; border-radius: 8px;"
        title="${title || 'Localisation'}"
      ></iframe>
    `
  }, [latitude, longitude, title])

  return (
    <div className={`${className} rounded-lg overflow-hidden`}>
      <div ref={mapRef} className="w-full h-full" />
    </div>
  )
}
