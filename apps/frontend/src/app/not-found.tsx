import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
            <div className="text-center max-w-md">
                <h1 className="text-6xl font-bold text-green-600 mb-4">404</h1>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Page non trouvée</h2>
                <p className="text-gray-600 mb-8">
                    Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
                </p>
                <Link
                    href="/"
                    className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors inline-block"
                >
                    Retour à l'accueil
                </Link>
            </div>
        </div>
    )
}
