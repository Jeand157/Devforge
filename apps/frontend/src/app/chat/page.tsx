'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import AuthGuard from '@/components/AuthGuard'

interface Message {
  id: number
  content: string
  sender_id: number
  sender_username: string
  conversation_id: number
  created_at: string
}

interface Conversation {
  id: number
  title: string
  last_message?: Message
  participants: Array<{
    id: number
    username: string
  }>
}

export default function ChatPage() {
  const { data: session } = useSession()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (session) {
      fetchConversations()
    }
  }, [session])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id)
    }
  }, [selectedConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchConversations = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/conversations', {
        headers: {
          'Authorization': `Bearer ${session?.user?.token || ''}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setConversations(data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des conversations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMessages = async (conversationId: number) => {
    try {
      const response = await fetch(`http://localhost:4000/api/conversations/${conversationId}/messages`, {
        headers: {
          'Authorization': `Bearer ${session?.user?.token || ''}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    try {
      const response = await fetch(`http://localhost:4000/api/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.user?.token || ''}`
        },
        body: JSON.stringify({
          content: newMessage.trim()
        })
      })

      if (response.ok) {
        setNewMessage('')
        // Recharger les messages
        fetchMessages(selectedConversation.id)
        // Recharger les conversations pour mettre à jour le dernier message
        fetchConversations()
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }


  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Chat</h1>
        
        <div className="bg-white rounded-lg shadow-sm h-96 flex">
          {/* Sidebar - Liste des conversations */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Chargement...</p>
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-center">
                  <div className="text-gray-400 text-4xl mb-2">💬</div>
                  <p className="text-gray-600">Aucune conversation</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedConversation?.id === conversation.id ? 'bg-green-50 border-r-2 border-green-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 text-sm">
                            {conversation.title}
                          </h3>
                          {conversation.last_message && (
                            <p className="text-gray-600 text-xs mt-1 line-clamp-2">
                              {conversation.last_message.content}
                            </p>
                          )}
                        </div>
                        {conversation.last_message && (
                          <span className="text-xs text-gray-500 ml-2">
                            {formatTime(conversation.last_message.created_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Zone de chat principale */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Header de la conversation */}
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedConversation.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedConversation.participants.map(p => p.username).join(', ')}
                  </p>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-400 text-4xl mb-2">💭</div>
                      <p className="text-gray-600">Aucun message dans cette conversation</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender_id === session.user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.sender_id === session.user?.id
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-200 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.sender_id === session.user?.id
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

                {/* Zone de saisie */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex space-x-4">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Tapez votre message..."
                      className="flex-1 input"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="btn-primary px-6"
                    >
                      Envoyer
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-gray-400 text-6xl mb-4">💬</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Sélectionnez une conversation
                  </h3>
                  <p className="text-gray-600">
                    Choisissez une conversation dans la liste pour commencer à discuter
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </AuthGuard>
  )
}