import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'
import Providers from '@/components/Providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LocalLoop - Partagez, Échangez, Solidarisez',
  description: 'Plateforme locale de don et d\'échange d\'objets entre voisins. Rejoignez une communauté solidaire et écologique.',
  keywords: 'don, échange, local, voisins, solidarité, écologie, réutilisation',
  authors: [{ name: 'LocalLoop Team' }],
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'LocalLoop - Partagez, Échangez, Solidarisez',
    description: 'Plateforme locale de don et d\'échange d\'objets entre voisins.',
    type: 'website',
    locale: 'fr_FR',
  },
}

import { getServerSession } from 'next-auth'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()

  return (
    <html lang="fr">
      <body className={inter.className}>
        <Providers session={session}>
          <Navigation />
          <main className="min-h-screen">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}

