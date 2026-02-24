'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
            <div className="text-center max-w-md">
                <h1 className="text-6xl font-bold text-red-600 mb-4">500</h1>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Une erreur est survenue</h2>
                <p className="text-gray-600 mb-8">
                    Nous nous excusons pour le désagrément. Nos équipes travaillent pour résoudre le problème.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => reset()}
                        className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                    >
                        Réessayer
                    </button>
                    <Link
                        href="/"
                        className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors inline-block"
                    >
                        Retour à l'accueil
                    </Link>
                </div>
            </div>
        </div>
    )
}
