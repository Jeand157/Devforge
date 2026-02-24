'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'

export default function Navigation() {
  const { data: session } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">L</span>
            </div>
            <span className="text-xl font-bold text-gray-900">LocalLoop</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/items" className="text-gray-600 hover:text-green-600 transition-colors">
              Annonces
            </Link>
            <Link href="/map" className="text-gray-600 hover:text-green-600 transition-colors">
              Carte
            </Link>
            <Link href="/publish" className="text-gray-600 hover:text-green-600 transition-colors">
              Publier
            </Link>
            <Link href="/chat" className="text-gray-600 hover:text-green-600 transition-colors">
              Chat
            </Link>
            <Link href="/profile" className="text-gray-600 hover:text-green-600 transition-colors">
              Profil
            </Link>
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {session ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">Bonjour, {session.user.name || session.user.email || session.user.username}</span>
                <button
                  onClick={() => signOut()}
                  className="btn-outline"
                >
                  Déconnexion
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/login" className="btn-outline">
                  Connexion
                </Link>
                <Link href="/register" className="btn-primary">
                  Inscription
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-green-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-4">
              <Link href="/items" className="text-gray-600 hover:text-green-600 transition-colors">
                Annonces
              </Link>
              <Link href="/map" className="text-gray-600 hover:text-green-600 transition-colors">
                Carte
              </Link>
              <Link href="/publish" className="text-gray-600 hover:text-green-600 transition-colors">
                Publier
              </Link>
              <Link href="/chat" className="text-gray-600 hover:text-green-600 transition-colors">
                Chat
              </Link>
              <Link href="/profile" className="text-gray-600 hover:text-green-600 transition-colors">
                Profil
              </Link>
              <div className="pt-4 border-t border-gray-200">
                {session ? (
                  <div className="flex flex-col space-y-2">
                    <span className="text-gray-700">Bonjour, {session.user.name || session.user.email || session.user.username}</span>
                    <button
                      onClick={() => signOut()}
                      className="btn-outline text-left"
                    >
                      Déconnexion
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-2">
                    <Link href="/login" className="btn-outline text-center">
                      Connexion
                    </Link>
                    <Link href="/register" className="btn-primary text-center">
                      Inscription
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}