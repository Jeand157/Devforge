'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import AuthGuard from '@/components/AuthGuard'

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  sender_name: string
  sender_username: string
  text: string
  created_at: string
}

interface Conversation {
  id: string
  user_a_id: string
  user_b_id: string
  item_id?: string
  created_at: string
  other_user_name: string
  other_user_username: string
  item_title?: string
}

export default function ChatDetailPage() {
  const { id } = useParams()
  const { data: session } = useSession()
  const router = useRouter()
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (id) {
      fetchConversation()
      fetchMessages()
    }
  }, [id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchConversation = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/conversations/${id}`, {
        headers: {
          'Authorization': `Bearer ${(session?.user as any)?.token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setConversation(data)
      } else {
        setError('Conversation non trouvée')
      }
    } catch (err) {
      setError('Erreur lors du chargement de la conversation')
    }
  }

  const fetchMessages = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/conversations/${id}/messages`, {
        headers: {
          'Authorization': `Bearer ${(session?.user as any)?.token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      }
    } catch (err) {
      console.error('Erreur lors du chargement des messages:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isSending) return

    setIsSending(true)
    try {
      const response = await fetch(`http://localhost:4000/api/conversations/${id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(session?.user as any)?.token}`
        },
        body: JSON.stringify({
          text: newMessage.trim()
        })
      })

      if (response.ok) {
        setNewMessage('')
        // Recharger les messages
        fetchMessages()
      } else {
        const errorData = await response.json()
        alert(errorData.message || 'Erreur lors de l\'envoi du message')
      }
    } catch (err) {
      alert('Une erreur est survenue')
    } finally {
      setIsSending(false)
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  if (isLoading) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (error || !conversation) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-400 text-6xl mb-4">💬</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Conversation non trouvée</h1>
            <p className="text-gray-600 mb-6">{error || 'Cette conversation n\'existe pas ou vous n\'y avez pas accès.'}</p>
            <button
              onClick={() => router.push('/chat')}
              className="btn-primary"
            >
              Retour au chat
            </button>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.back()}
                  className="text-gray-600 hover:text-gray-900"
                >
                  ← Retour
                </button>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold">
                      {conversation.other_user_name?.charAt(0) || conversation.other_user_username?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">
                      {conversation.other_user_name || conversation.other_user_username}
                    </h1>
                    <p className="text-sm text-gray-600">@{conversation.other_user_username}</p>
                    {conversation.item_title && (
                      <p className="text-sm text-gray-500">À propos de: {conversation.item_title}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="bg-white rounded-lg shadow-sm h-96 flex flex-col">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-4xl mb-2">💬</div>
                  <p>Aucun message pour le moment</p>
                  <p className="text-sm">Commencez la conversation !</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === (session?.user as any)?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender_id === (session?.user as any)?.id
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender_id === (session?.user as any)?.id
                          ? 'text-green-100'
                          : 'text-gray-500'
                      }`}>
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-t p-4">
              <form onSubmit={handleSendMessage} className="flex space-x-4">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Tapez votre message..."
                  className="flex-1 input"
                  disabled={isSending}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || isSending}
                  className="btn-primary px-6"
                >
                  {isSending ? 'Envoi...' : 'Envoyer'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
