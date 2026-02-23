'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import AuthGuard from '@/components/AuthGuard'

interface UserStats {
  published_items: number
  reserved_items: number
  total_conversations: number
  rating: number
  join_date: string
}

interface RecentActivity {
  id: number
  type: 'published' | 'taken' | 'conversation'
  title: string
  date: string
}

export default function ProfilePage() {
  const { data: session } = useSession()
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userItems, setUserItems] = useState<any[]>([])
  const [userReservedItems, setUserReservedItems] = useState<any[]>([])
  const [deletingAll, setDeletingAll] = useState(false)

  useEffect(() => {
    if (session) {
      fetchUserData()
    }
  }, [session])

  const fetchUserData = async () => {
    try {
      // Récupérer les statistiques utilisateur
      const statsResponse = await fetch('http://localhost:4000/api/users/me/stats', {
        headers: {
          'Authorization': `Bearer ${(session?.user as any)?.token || ''}`
        }
      })

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setUserStats(statsData)
      }

      // Récupérer les annonces de l'utilisateur
      const itemsResponse = await fetch('http://localhost:4000/api/items/my', {
        headers: {
          'Authorization': `Bearer ${(session?.user as any)?.token || ''}`
        }
      })

      if (itemsResponse.ok) {
        const itemsData = await itemsResponse.json()
        setUserItems(itemsData)
      }

      // Récupérer les objets réservés par l'utilisateur
      const reservedResponse = await fetch('http://localhost:4000/api/items/reserved', {
        headers: {
          'Authorization': `Bearer ${(session?.user as any)?.token || ''}`
        }
      })

      if (reservedResponse.ok) {
        const reservedData = await reservedResponse.json()
        setUserReservedItems(reservedData)
      }

      // Récupérer l'activité récente (vide pour commencer)
      setRecentActivity([])

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAllItems = async () => {
    if (userItems.length === 0) {
      alert('Vous n\'avez aucune annonce à supprimer.')
      return
    }

    const confirmMessage = `Êtes-vous sûr de vouloir supprimer toutes vos ${userItems.length} annonces ? Cette action est irréversible.`
    if (!confirm(confirmMessage)) {
      return
    }

    setDeletingAll(true)
    try {
      // Supprimer toutes les annonces une par une
      for (const item of userItems) {
        const response = await fetch(`http://localhost:4000/api/items/${item.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${(session?.user as any)?.token || ''}`
          }
        })

        if (!response.ok) {
          throw new Error(`Erreur lors de la suppression de l'annonce ${item.title}`)
        }
      }

      // Mettre à jour les données
      setUserItems([])
      await fetchUserData() // Recharger les statistiques

      alert(`Toutes vos ${userItems.length} annonces ont été supprimées avec succès !`)
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      alert('Erreur lors de la suppression des annonces. Veuillez réessayer.')
    } finally {
      setDeletingAll(false)
    }
  }

  const getAchievements = () => {
    const achievements = []

    if (userStats) {
      if (userStats.published_items >= 5) {
        achievements.push({
          id: 'donateur',
          title: 'Donateur Actif',
          description: 'A publié 5+ annonces',
          icon: '🎁',
          color: 'bg-green-100 text-green-800'
        })
      }

      if (userStats.reserved_items >= 3) {
        achievements.push({
          id: 'receveur',
          title: 'Receveur Engagé',
          description: 'A récupéré 3+ objets',
          icon: '📦',
          color: 'bg-blue-100 text-blue-800'
        })
      }

      if (userStats.total_conversations >= 10) {
        achievements.push({
          id: 'social',
          title: 'Social Butterfly',
          description: 'A démarré 10+ conversations',
          icon: '💬',
          color: 'bg-purple-100 text-purple-800'
        })
      }
    }

    return achievements
  }


  const achievements = getAchievements()

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                {/* Avatar */}
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-green-600">
                    {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || 'U'}
                  </span>
                </div>

                {/* Infos utilisateur */}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {session?.user?.name || 'Utilisateur'}
                  </h1>
                  <p className="text-gray-600">@{session?.user?.email}</p>
                  {userStats && userStats.join_date && (
                    <p className="text-sm text-gray-500 mt-1">
                      Membre depuis {new Date(userStats.join_date).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
              </div>

              {/* Bouton déconnexion */}
              <button
                onClick={() => signOut()}
                className="btn-outline"
              >
                Déconnexion
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Statistiques */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Mes statistiques</h2>
                  {userItems.length > 0 && (
                    <button
                      onClick={handleDeleteAllItems}
                      disabled={deletingAll}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center"
                    >
                      {deletingAll ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Suppression...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Supprimer toutes mes annonces
                        </>
                      )}
                    </button>
                  )}
                </div>

                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Chargement...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {userStats?.published_items || 0}
                      </div>
                      <div className="text-gray-600 text-sm">Objets publiés</div>
                      {userStats && userStats.published_items > 0 && (
                        <button
                          onClick={() => {
                            const element = document.getElementById('mes-annonces-section');
                            element?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="mt-2 text-xs text-green-600 hover:text-green-800 underline"
                        >
                          Voir mes annonces
                        </button>
                      )}
                    </div>

                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {userStats?.reserved_items || 0}
                      </div>
                      <div className="text-gray-600 text-sm">Objets réservés</div>
                    </div>

                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600 mb-2">
                        {userStats?.total_conversations || 0}
                      </div>
                      <div className="text-gray-600 text-sm">Conversations</div>
                    </div>

                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-600 mb-2">
                        {userStats?.rating ? userStats.rating.toFixed(1) : 'N/A'}
                      </div>
                      <div className="text-gray-600 text-sm">Note moyenne</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Mes Annonces */}
              <div id="mes-annonces-section" className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Mes annonces</h2>
                  {userItems.length > 0 && (
                    <button
                      onClick={handleDeleteAllItems}
                      disabled={deletingAll}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center"
                    >
                      {deletingAll ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Suppression...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Supprimer toutes mes annonces
                        </>
                      )}
                    </button>
                  )}
                </div>

                {userItems.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-4xl mb-2">📝</div>
                    <p className="text-gray-600 mb-4">Vous n'avez pas encore publié d'annonces</p>
                    <a
                      href="/publish"
                      className="btn-primary inline-flex items-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Publier ma première annonce
                    </a>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userItems.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.title}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <div className="text-gray-400 text-2xl">📦</div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{item.title}</h3>
                          <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === 'available' ? 'bg-green-100 text-green-800' :
                              item.status === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                              {item.status === 'available' ? 'Disponible' :
                                item.status === 'reserved' ? 'Réservé' : 'Donné'}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(item.created_at).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <a
                            href={`/items/${item.id}`}
                            className="btn-outline text-sm"
                          >
                            Voir détails
                          </a>
                          <button
                            onClick={() => {
                              if (confirm(`Êtes-vous sûr de vouloir supprimer "${item.title}" ?`)) {
                                // Supprimer cette annonce spécifique
                                fetch(`http://localhost:4000/api/items/${item.id}`, {
                                  method: 'DELETE',
                                  headers: {
                                    'Authorization': `Bearer ${(session?.user as any)?.token || ''}`
                                  }
                                }).then(() => {
                                  fetchUserData(); // Recharger les données
                                });
                              }
                            }}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Mes Réservations */}
              <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Mes réservations</h2>

                {userReservedItems.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-4xl mb-2">🎁</div>
                    <p className="text-gray-600 mb-4">Vous n'avez réservé aucun objet pour le moment</p>
                    <a
                      href="/map"
                      className="btn-primary inline-flex items-center"
                    >
                      Parcourir la carte
                    </a>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userReservedItems.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
                        <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center border border-blue-100">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.title}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <div className="text-blue-400 text-2xl">📦</div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-gray-900">{item.title}</h3>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 font-medium">
                              En attente de retrait
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-1">Donné par: <strong>{item.owner_name}</strong></p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="text-xs text-gray-500">
                              📍 {item.location}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <a
                            href={`/chat`}
                            className="btn-outline text-sm bg-white"
                          >
                            Contacter
                          </a>
                          <a
                            href={`/items/${item.id}`}
                            className="btn-outline text-sm bg-white"
                          >
                            Détails
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Réalisations */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Réalisations</h2>

                {achievements.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-4xl mb-2">🏆</div>
                    <p className="text-gray-600">Aucune réalisation encore</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Continuez à utiliser LocalLoop pour débloquer des badges !
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {achievements.map((achievement) => (
                      <div key={achievement.id} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl">{achievement.icon}</div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{achievement.title}</h3>
                          <p className="text-sm text-gray-600">{achievement.description}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${achievement.color}`}>
                          ✓
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard >
  )
}