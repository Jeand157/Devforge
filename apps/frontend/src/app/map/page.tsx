'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import AuthGuard from '@/components/AuthGuard'

// Import dynamique pour éviter les erreurs SSR
const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-200 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Chargement de la carte...</p>
      </div>
    </div>
  )
})

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

export default function MapPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [items, setItems] = useState<Item[]>([])
  const [filteredItems, setFilteredItems] = useState<Item[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSearchPerformed, setIsSearchPerformed] = useState(false)

  const categories = [
    'Tous',
    'Électronique',
    'Mobilier',
    'Vêtements',
    'Livres',
    'Jouets',
    'Outils',
    'Décoration',
    'Autre'
  ]

  useEffect(() => {
    fetchItems()
    getUserLocation()
  }, [])

  useEffect(() => {
    filterItems()
  }, [items, searchTerm, selectedCategory])

  const fetchItems = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/items')
      if (response.ok) {
        const data = await response.json()
        setItems(data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des annonces:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.error('Erreur de géolocalisation:', error)
          // Position par défaut (Paris)
          setUserLocation({
            lat: 48.8566,
            lng: 2.3522
          })
        }
      )
    } else {
      // Position par défaut (Paris)
      setUserLocation({
        lat: 48.8566,
        lng: 2.3522
      })
    }
  }

  const filterItems = () => {
    if (!isSearchPerformed) {
      setFilteredItems([])
      return
    }

    let filtered = items

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCategory && selectedCategory !== 'Tous') {
      filtered = filtered.filter(item => item.category === selectedCategory)
    }

    setFilteredItems(filtered)
  }

  const handleSearchTrigger = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setIsSearchPerformed(true)
    filterItems()
  }

  const handleChat = async (ownerId: number) => {
    if (!session?.user) {
      router.push('/login')
      return
    }

    if (ownerId === (session.user as any).id) {
      alert("C'est votre propre annonce !")
      return
    }

    try {
      const response = await fetch('http://localhost:4000/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(session.user as any).token}`
        },
        body: JSON.stringify({
          otherUserId: ownerId
        })
      })

      if (response.ok) {
        const conversation = await response.json()
        router.push(`/chat/${conversation.id}`)
      } else {
        alert('Erreur lors de la création de la conversation')
      }
    } catch (err) {
      console.error('Chat error:', err)
      alert('Une erreur est survenue')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'disponible':
        return 'bg-green-100 text-green-800'
      case 'réservé':
        return 'bg-yellow-100 text-yellow-800'
      case 'pris':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Carte des annonces</h1>
            <p className="text-gray-600">Découvrez les objets disponibles près de chez vous</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Filtres</h2>

                {/* Search Form */}
                <form onSubmit={handleSearchTrigger} className="space-y-4">
                  {/* Search Input */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Rechercher un objet..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="input w-full pr-10"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      🔍
                    </div>
                  </div>

                  {/* Category Filter */}
                  <div>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="input w-full"
                    >
                      {categories.map(category => (
                        <option key={category} value={category === 'Tous' ? '' : category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    Rechercher
                  </button>
                </form>

                {/* Stats */}
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Annonces trouvées:</span>
                    <span className="font-semibold">{filteredItems.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Disponibles:</span>
                    <span className="font-semibold text-green-600">
                      {filteredItems.filter(item => item.status === 'disponible').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Réservés:</span>
                    <span className="font-semibold text-yellow-600">
                      {filteredItems.filter(item => item.status === 'réservé').length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                {!isSearchPerformed ? (
                  <div className="text-center py-8">
                    <div className="text-gray-300 text-5xl mb-3">⌕</div>
                    <p className="text-gray-500 text-sm">Entrez un objet pour voir sa disponibilité</p>
                  </div>
                ) : isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Chargement...</p>
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-4xl mb-2">📍</div>
                    <p className="text-gray-600">Aucune annonce trouvée</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {filteredItems.slice(0, 10).map((item) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900 text-sm line-clamp-2">
                            {item.title}
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                        </div>

                        <p className="text-gray-600 text-xs mb-2 line-clamp-2">
                          {item.description}
                        </p>

                        <div className="text-xs text-gray-500">
                          📍 {item.location}
                        </div>

                        {/* Chat Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleChat(item.owner_id)
                          }}
                          className="mt-3 w-full flex items-center justify-center space-x-2 py-2 bg-gray-50 hover:bg-green-50 text-green-700 rounded-lg border border-gray-100 transition-colors text-xs font-medium"
                        >
                          <span>💬</span>
                          <span>Contacter l'annonceur</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Map */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Carte interactive</h2>

                {!isSearchPerformed ? (
                  <div className="h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center">
                    <div className="text-center px-4">
                      <div className="text-gray-300 text-6xl mb-4">🗺️</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Carte en attente de recherche</h3>
                      <p className="text-gray-500 max-w-sm">Recherchez un objet dans la colonne de gauche pour voir les résultats s'afficher sur la carte.</p>
                    </div>
                  </div>
                ) : userLocation ? (
                  <MapComponent
                    items={filteredItems}
                    userLocation={userLocation}
                    onChat={handleChat}
                  />
                ) : (
                  <div className="h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Chargement de votre position...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}