import Link from 'next/link'
import AuthGuard from '@/components/AuthGuard'

export default function HomePage() {
  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero-gradient py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Rejoignez une communauté{' '}
            <span className="gradient-text">solidaire</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Partagez, échangez et créez des liens avec vos voisins. 
            Chaque objet trouve une seconde vie dans votre quartier.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="btn-primary text-lg px-8 py-4">
              Commencer maintenant
            </Link>
            <Link href="/items" className="btn-secondary text-lg px-8 py-4">
              Voir les annonces
            </Link>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="card">
              <div className="text-4xl font-bold text-green-600 mb-2">2,500+</div>
              <div className="text-gray-600">Objets partagés</div>
            </div>
            <div className="card">
              <div className="text-4xl font-bold text-green-600 mb-2">1,200+</div>
              <div className="text-gray-600">Membres actifs</div>
            </div>
            <div className="card">
              <div className="text-4xl font-bold text-green-600 mb-2">15</div>
              <div className="text-gray-600">Quartiers couverts</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Trois étapes simples pour rejoindre la communauté LocalLoop
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-green-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Inscrivez-vous</h3>
              <p className="text-gray-600">
                Créez votre compte en quelques minutes et rejoignez votre quartier
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Publiez ou Cherchez</h3>
              <p className="text-gray-600">
                Donnez vos objets inutilisés ou trouvez ce dont vous avez besoin
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Connectez-vous</h3>
              <p className="text-gray-600">
                Échangez avec vos voisins et créez des liens durables
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Ce que disent nos membres
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card">
              <p className="text-gray-600 mb-4">
                "J'ai trouvé une nouvelle famille pour mes livres et j'ai rencontré des voisins formidables !"
              </p>
              <div className="font-semibold text-gray-900">Marie, 34 ans</div>
              <div className="text-sm text-gray-500">Quartier Belleville</div>
            </div>
            
            <div className="card">
              <p className="text-gray-600 mb-4">
                "LocalLoop m'a permis de me débarrasser de mes vieux meubles tout en aidant mes voisins."
              </p>
              <div className="font-semibold text-gray-900">Pierre, 28 ans</div>
              <div className="text-sm text-gray-500">Quartier République</div>
            </div>
            
            <div className="card">
              <p className="text-gray-600 mb-4">
                "Une plateforme géniale pour l'économie circulaire et la solidarité locale !"
              </p>
              <div className="font-semibold text-gray-900">Sophie, 42 ans</div>
              <div className="text-sm text-gray-500">Quartier Bastille</div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact */}
      <section className="py-20 bg-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
            Notre impact écologique
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="card">
              <div className="text-5xl font-bold text-green-600 mb-4">-75%</div>
              <div className="text-xl text-gray-700 mb-2">de déchets en moins</div>
              <div className="text-gray-600">Grâce au réemploi des objets</div>
            </div>
            
            <div className="card">
              <div className="text-5xl font-bold text-green-600 mb-4">+200%</div>
              <div className="text-xl text-gray-700 mb-2">de liens sociaux</div>
              <div className="text-gray-600">Entre voisins du quartier</div>
            </div>
          </div>
          
          <div className="text-center">
            <Link href="/register" className="btn-primary text-lg px-8 py-4">
              Rejoindre la communauté
            </Link>
          </div>
        </div>
      </section>
    </div>
    </AuthGuard>
  )
}