'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

export default function AuthGuard({ 
  children, 
  requireAuth = true, 
  redirectTo = '/login' 
}: AuthGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // En cours de chargement

    if (requireAuth && !session) {
      // Utilisateur non connecté, rediriger vers la page de connexion
      router.push(redirectTo)
    } else if (!requireAuth && session) {
      // Utilisateur connecté mais sur une page publique, rediriger vers les annonces
      router.push('/items')
    }
  }, [session, status, requireAuth, redirectTo, router])

  // Afficher un loader pendant le chargement
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  // Si l'utilisateur doit être connecté mais ne l'est pas, ne rien afficher
  if (requireAuth && !session) {
    return null
  }

  // Si l'utilisateur est connecté mais ne devrait pas être sur cette page, ne rien afficher
  if (!requireAuth && session) {
    return null
  }

  return <>{children}</>
}
