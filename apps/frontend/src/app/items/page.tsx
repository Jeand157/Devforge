'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import AuthGuard from '@/components/AuthGuard'
import { API_CONFIG } from '@/config'

interface Item {
  id: number
  title: string
  description: string
  category: string
  status: string
  latitude: number
  longitude: number
  location: string
  image_url?: string
  owner_id: number
  created_at: string
}

export default function ItemsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [items, setItems] = useState<Item[]>([])
  const [filteredItems, setFilteredItems] = useState<Item[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [chatLoading, setChatLoading] = useState<number | null>(null)

  // Fonction pour ouvrir la carte avec les coordonnées
  const openMap = (latitude: number, longitude: number, location: string) => {
    // Ouvrir Google Maps avec les coordonnées
    const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}&t=m&z=15`
    window.open(mapUrl, '_blank')
  }

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
  }, [])

  useEffect(() => {
    filterItems()
  }, [items, searchTerm, selectedCategory])

  const fetchItems = async () => {
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}/api/items`)
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

  const filterItems = () => {
    let filtered = items

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtre par catégorie
    if (selectedCategory && selectedCategory !== 'Tous') {
      filtered = filtered.filter(item => item.category === selectedCategory)
    }

    setFilteredItems(filtered)
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

  const handleChat = async (item: Item) => {
    if (!session?.user) {
      alert('Vous devez être connecté pour discuter')
      return
    }

    if (String(item.owner_id) === session.user.id) {
      alert('Vous ne pouvez pas discuter avec vous-même')
      return
    }

    setChatLoading(item.id)

    try {
      // Créer ou récupérer une conversation avec le propriétaire
      const response = await fetch(`${API_CONFIG.baseUrl}/api/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.user.accessToken}`
        },
        body: JSON.stringify({
          otherUserId: item.owner_id
        })
      })

      if (response.ok) {
        const conversation = await response.json()
        // Rediriger vers le chat avec cette conversation
        router.push(`/chat/${conversation.id}`)
      } else {
        const errorData = await response.json()
        alert(errorData.message || 'Erreur lors de la création de la conversation')
      }
    } catch (err) {
      alert('Une erreur est survenue')
    } finally {
      setChatLoading(null)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des annonces...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Annonces</h1>
            <p className="text-gray-600">Découvrez les objets disponibles dans votre quartier</p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Rechercher un objet..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input"
                />
              </div>

              {/* Category Filter */}
              <div className="md:w-64">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="input"
                >
                  {categories.map(category => (
                    <option key={category} value={category === 'Tous' ? '' : category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Items Grid */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Aucune annonce trouvée
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || selectedCategory
                  ? 'Essayez de modifier vos critères de recherche'
                  : 'Soyez le premier à publier une annonce !'
                }
              </p>
              <Link href="/publish" className="btn-primary">
                Publier une annonce
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <div key={item.id} className="card hover:shadow-lg transition-shadow">
                  {/* Image */}
                  <div className="aspect-w-16 aspect-h-9 mb-4">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-gray-400 text-4xl">📦</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                        {item.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                      {item.description}
                    </p>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <button
                        onClick={() => openMap(item.latitude, item.longitude, item.location)}
                        className="flex items-center hover:text-blue-600 transition-colors cursor-pointer"
                        title="Cliquer pour voir sur la carte"
                      >
                        <svg className="w-4 h-4 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        <span className="hover:underline">{item.location}</span>
                      </button>
                      <span>{new Date(item.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>

                    <div className="mt-4">
                      <button
                        onClick={() => handleChat(item)}
                        disabled={chatLoading === item.id}
                        className="btn-primary w-full text-center flex items-center justify-center space-x-2"
                      >
                        {chatLoading === item.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Connexion...</span>
                          </>
                        ) : (
                          <>
                            <span>💬</span>
                            <span>Discuter</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="mt-12 text-center">
            <p className="text-gray-600">
              {filteredItems.length} annonce{filteredItems.length > 1 ? 's' : ''} trouvée{filteredItems.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}