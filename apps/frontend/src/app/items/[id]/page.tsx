'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { API_CONFIG } from '@/config'
import AuthGuard from '@/components/AuthGuard'
import dynamic from 'next/dynamic'

// Import dynamique de la carte pour éviter les erreurs SSR
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">Chargement de la carte...</div>
})

interface Item {
  id: string
  title: string
  description: string
  latitude: number
  longitude: number
  location: string
  image_url?: string
  status: 'available' | 'reserved' | 'given'
  owner_id: string
  owner_name: string
  owner_username: string
  owner_email: string
  created_at: string
  updated_at: string
}

export default function ItemDetailPage() {
  const { id } = useParams()
  const { data: session } = useSession()
  const router = useRouter()
  const [item, setItem] = useState<Item | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isReserving, setIsReserving] = useState(false)

  useEffect(() => {
    if (id) {
      fetchItem()
    }
  }, [id])

  const fetchItem = async () => {
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}/api/items/${id}`)
      if (response.ok) {
        const data = await response.json()
        setItem(data)
      } else {
        setError('Annonce non trouvée')
      }
    } catch (err) {
      setError('Erreur lors du chargement de l\'annonce')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReserve = async () => {
    if (!session?.user || !item) return

    setIsReserving(true)
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}/api/items/${id}/reserve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.user.accessToken}`
        }
      })

      if (response.ok) {
        // Mettre à jour le statut de l'item
        setItem({ ...item, status: 'reserved' })
        alert('Annonce réservée avec succès !')
      } else {
        const errorData = await response.json()
        alert(errorData.message || 'Erreur lors de la réservation')
      }
    } catch (err) {
      alert('Une erreur est survenue')
    } finally {
      setIsReserving(false)
    }
  }

  const handleChat = async () => {
    if (!session?.user || !item) return

    try {
      // Créer ou récupérer une conversation avec le propriétaire
      const response = await fetch(`${API_CONFIG.baseUrl}/api/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.user.accessToken}`
        },
        body: JSON.stringify({
          user_b_id: item.owner_id,
          item_id: item.id
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
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'reserved': return 'bg-yellow-100 text-yellow-800'
      case 'given': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Disponible'
      case 'reserved': return 'Réservé'
      case 'given': return 'Donné'
      default: return 'Inconnu'
    }
  }

  // Fonction pour ouvrir la carte avec les coordonnées
  const openMap = (latitude: number, longitude: number, location: string) => {
    // Ouvrir Google Maps avec les coordonnées
    const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}&t=m&z=15`
    window.open(mapUrl, '_blank')
  }

  if (isLoading) {
    return (
      <AuthGuard requireAuth={false}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (error || !item) {
    return (
      <AuthGuard requireAuth={false}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-400 text-6xl mb-4">😞</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Annonce non trouvée</h1>
            <p className="text-gray-600 mb-6">{error || 'Cette annonce n\'existe pas ou a été supprimée.'}</p>
            <button
              onClick={() => router.push('/items')}
              className="btn-primary"
            >
              Retour aux annonces
            </button>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Bouton retour */}
          <button
            onClick={() => router.back()}
            className="mb-6 text-gray-600 hover:text-gray-900 flex items-center"
          >
            ← Retour
          </button>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
              {/* Image */}
              <div>
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                    <div className="text-gray-400 text-4xl">📷</div>
                  </div>
                )}
              </div>

              {/* Détails */}
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">{item.title}</h1>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(item.status)}`}>
                      {getStatusText(item.status)}
                    </span>
                  </div>
                  <p className="text-gray-600 text-lg">{item.description}</p>
                </div>

                {/* Informations du propriétaire */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Annonceur</h3>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-bold text-lg">
                        {item.owner_name?.charAt(0) || item.owner_username?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-lg">{item.owner_name || item.owner_username}</p>
                      <p className="text-sm text-gray-600">@{item.owner_username}</p>
                    </div>
                  </div>
                </div>

                {/* Date de publication */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Informations</h3>
                  <p className="text-sm text-gray-600">
                    Publié le {new Date(item.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>

                {/* Actions */}
                {session?.user && String(item.owner_id) !== session.user.id && (
                  <div className="border-t pt-6 space-y-3">
                    {item.status === 'available' && (
                      <button
                        onClick={handleReserve}
                        disabled={isReserving}
                        className="btn-primary w-full"
                      >
                        {isReserving ? 'Réservation...' : 'Réserver cet objet'}
                      </button>
                    )}
                    <button
                      onClick={handleChat}
                      className="btn-outline w-full flex items-center justify-center space-x-2"
                    >
                      <span>💬</span>
                      <span>Discuter avec l'annonceur</span>
                    </button>
                  </div>
                )}

                {!session?.user && (
                  <div className="border-t pt-6">
                    <p className="text-sm text-gray-600 mb-3">
                      Connectez-vous pour interagir avec l'annonceur
                    </p>
                    <button
                      onClick={() => router.push('/login')}
                      className="btn-primary w-full"
                    >
                      Se connecter
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Carte de localisation */}
            <div className="border-t p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Localisation</h3>
              <div className="mb-4">
                <button
                  onClick={() => openMap(item.latitude, item.longitude, item.location)}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">{item.location || 'Paris, France'}</span>
                  <span className="text-sm text-gray-500">(Cliquez pour voir sur la carte)</span>
                </button>
                <div className="mt-2 text-sm text-gray-500">
                  Coordonnées: {Number(item.latitude).toFixed(4)}, {Number(item.longitude).toFixed(4)}
                </div>
              </div>
              <MapComponent
                latitude={Number(item.latitude)}
                longitude={Number(item.longitude)}
                title={item.title}
                className="w-full h-64"
              />
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
