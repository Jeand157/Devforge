'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthGuard from '@/components/AuthGuard'
import { useSession } from 'next-auth/react'

// Service de géocodage avec coordonnées prédéfinies
function geocodeLocation(locationText) {
  console.log(`🔍 Géocodage de: "${locationText}"`);
  
  // Coordonnées prédéfinies pour les villes principales
  const cityCoordinates = {
    'paris': { latitude: 48.8566, longitude: 2.3522 },
    'lomé': { latitude: 6.1287, longitude: 1.2215 },
    'abidjan': { latitude: 5.3600, longitude: -4.0083 },
    'dakar': { latitude: 14.6928, longitude: -17.4467 },
    'casablanca': { latitude: 33.5731, longitude: -7.5898 },
    'tunis': { latitude: 36.8065, longitude: 10.1815 },
    'alger': { latitude: 36.7372, longitude: 3.0869 },
    'cotonou': { latitude: 6.3728, longitude: 2.5185 },
    'ouagadougou': { latitude: 12.3714, longitude: -1.5197 },
    'bamako': { latitude: 12.6392, longitude: -8.0029 },
    'yaoundé': { latitude: 3.8480, longitude: 11.5021 },
    'douala': { latitude: 4.0483, longitude: 9.7043 },
    'kinshasa': { latitude: -4.4419, longitude: 15.2663 },
    'lubumbashi': { latitude: -11.6647, longitude: 27.4794 },
    'nairobi': { latitude: -1.2921, longitude: 36.8219 },
    'lagos': { latitude: 6.5244, longitude: 3.3792 },
    'accra': { latitude: 5.6037, longitude: -0.1870 },
    'freetown': { latitude: 8.4840, longitude: -13.2299 },
    'monrovia': { latitude: 6.3008, longitude: -10.7970 },
    'bissau': { latitude: 11.8636, longitude: -15.5981 }
  };
  
  const normalizedLocation = locationText.toLowerCase().trim();
  
  // Chercher dans les coordonnées prédéfinies
  for (const [city, coords] of Object.entries(cityCoordinates)) {
    if (normalizedLocation.includes(city)) {
      console.log(`✅ Géocodage trouvé: ${locationText} → ${coords.latitude}, ${coords.longitude}`);
      return { latitude: coords.latitude, longitude: coords.longitude, found: true };
    }
  }
  
  // Si pas trouvé, utiliser Paris par défaut
  console.log(`⚠️ Localisation non trouvée, utilisation de Paris par défaut`);
  return { latitude: 48.8566, longitude: 2.3522, found: false };
}

export default function PublishPage() {
  const { data: session } = useSession()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: ''
  })
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const categories = [
    'Électronique',
    'Mobilier',
    'Vêtements',
    'Livres',
    'Jouets',
    'Outils',
    'Décoration',
    'Autre'
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImage(file)
      
      // Créer un aperçu de l'image
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      setImage(file)
      
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Vérifier que l'utilisateur est connecté
      if (!session?.user) {
        setError('Vous devez être connecté pour publier une annonce')
        setIsLoading(false)
        return
      }
      let imageUrl = ''

      // Upload de l'image si présente
      if (image) {
        const formData = new FormData()
        formData.append('image', image)

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          imageUrl = uploadData.url
        }
      }

      // Géocoder la localisation pour obtenir les coordonnées GPS
      console.log('🔍 Géocodage de la localisation...');
      const geocodeResult = geocodeLocation(formData.location);
      
      if (geocodeResult.found) {
        console.log(`✅ Localisation trouvée: ${formData.location} → ${geocodeResult.latitude}, ${geocodeResult.longitude}`);
      } else {
        console.log(`⚠️ Localisation non trouvée, utilisation des coordonnées par défaut (Paris)`);
      }

      // Créer l'annonce
      const response = await fetch('http://localhost:4000/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(session.user as any).token}`
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          latitude: geocodeResult.latitude,
          longitude: geocodeResult.longitude,
          location: formData.location,
          imageUrl: imageUrl
        }),
      })

      if (response.ok) {
        // Rediriger vers le profil pour voir les statistiques mises à jour
        router.push('/profile')
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Erreur lors de la publication')
      }
    } catch (err) {
      setError('Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Publier une annonce</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Titre */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Titre de l'annonce *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="input"
                placeholder="Ex: Table en bois massif"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className="input"
                placeholder="Décrivez l'objet, son état, pourquoi vous le donnez..."
              />
            </div>

            {/* Catégorie */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Catégorie *
              </label>
              <select
                id="category"
                name="category"
                required
                value={formData.category}
                onChange={handleChange}
                className="input"
              >
                <option value="">Sélectionnez une catégorie</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Localisation */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Localisation *
              </label>
              <input
                type="text"
                id="location"
                name="location"
                required
                value={formData.location}
                onChange={handleChange}
                className="input"
                placeholder="Ex: Paris 11ème, Belleville"
              />
            </div>

            {/* Upload d'image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photo de l'objet
              </label>
              
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {imagePreview ? (
                  <div className="space-y-4">
                    <img
                      src={imagePreview}
                      alt="Aperçu"
                      className="mx-auto h-32 w-32 object-cover rounded-lg"
                    />
                    <p className="text-sm text-gray-600">Image sélectionnée</p>
                    <button
                      type="button"
                      onClick={() => {
                        setImage(null)
                        setImagePreview(null)
                      }}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Supprimer l'image
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-gray-400 text-4xl">📷</div>
                    <div>
                      <p className="text-gray-600">Glissez-déposez une image ici</p>
                      <p className="text-sm text-gray-500">ou</p>
                      <label htmlFor="image" className="btn-outline cursor-pointer">
                        Choisir un fichier
                      </label>
                      <input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Boutons */}
            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="btn-secondary flex-1"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary flex-1"
              >
                {isLoading ? 'Publication...' : 'Publier l\'annonce'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    </AuthGuard>
  )
}