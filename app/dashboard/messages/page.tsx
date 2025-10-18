'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { RoleSwitcher } from '@/components/role-switcher'
import { supabase } from '@/lib/supabase'

interface Message {
  id: string
  message_text: string
  message_type: string
  is_read: boolean
  created_at: string
  sender_id: string
  profiles: {
    full_name: string
    email: string
  }
}

interface Conversation {
  id: string
  status: string
  created_at: string
  updated_at: string
  pitch_pages: {
    id: string
    pitch_title: string
    advance_assurance_applications: {
      company_name: string
    }
  }
  founder: {
    id: string
    full_name: string
    email: string
  }
  investor: {
    id: string
    full_name: string
    email: string
  }
  messages: Message[]
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState('founder')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        
        if (user) {
          // Get user's active role
          const { data: profile } = await supabase
            .from('profiles')
            .select('active_role')
            .eq('id', user.id)
            .single()
          
          setUserRole(profile?.active_role || 'founder')
          await loadConversations(user.id, profile?.active_role || 'founder')
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const loadConversations = async (userId: string, role: string) => {
    try {
      console.log('Loading conversations for:', { userId, role })

      // First, try a simple query to see if conversations exist
      // Try both founder and investor to be sure
      const { data: simpleConversations, error: simpleError } = await supabase
        .from('conversations')
        .select('*')
        .or(`founder_id.eq.${userId},investor_id.eq.${userId}`)

      console.log('Simple conversations query result:', { simpleConversations, simpleError })

      if (simpleError) {
        if (simpleError.code === '42P01') {
          console.log('Conversations table does not exist yet')
          setConversations([])
          return
        }
        throw simpleError
      }

      if (!simpleConversations || simpleConversations.length === 0) {
        console.log('No conversations found for user')
        setConversations([])
        return
      }

      // Now try the complex query with joins
      const { data: conversationsData, error } = await supabase
        .from('conversations')
        .select(`
          *,
          pitch_pages (
            id,
            pitch_title,
            advance_assurance_applications (
              company_name
            )
          ),
          founder:profiles!conversations_founder_id_fkey (
            id,
            full_name,
            email
          ),
          investor:profiles!conversations_investor_id_fkey (
            id,
            full_name,
            email
          ),
          messages (
            *,
            profiles (
              full_name,
              email
            )
          )
        `)
        .or(`founder_id.eq.${userId},investor_id.eq.${userId}`)
        .order('updated_at', { ascending: false })

      console.log('Complex conversations query result:', { conversationsData, error })

      if (error) {
        console.error('Complex query failed, falling back to simple data:', error)
        // Fallback to simple conversations without joins
        setConversations(simpleConversations.map(conv => ({
          ...conv,
          pitch_pages: { id: conv.pitch_page_id, pitch_title: 'Loading...', advance_assurance_applications: { company_name: 'Loading...' } },
          founder: { id: conv.founder_id, full_name: 'Loading...', email: '' },
          investor: { id: conv.investor_id, full_name: 'Loading...', email: '' },
          messages: []
        })))
        return
      }

      // Sort messages within each conversation
      const sortedConversations = (conversationsData || []).map(conv => ({
        ...conv,
        messages: (conv.messages || []).sort((a: Message, b: Message) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
      }))

      console.log('Final sorted conversations:', sortedConversations)
      setConversations(sortedConversations)
    } catch (error) {
      console.error('Error loading conversations:', error)
      setConversations([])
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return

    setSending(true)
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation,
          sender_id: user.id,
          message_text: newMessage.trim(),
          message_type: 'text'
        })

      if (error) throw error

      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedConversation)

      setNewMessage('')
      await loadConversations(user.id, userRole)
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const markAsRead = async (conversationId: string) => {
    if (!user) return

    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  const handleRoleChange = (newRole: string) => {
    setUserRole(newRole)
    setSelectedConversation(null)
    if (user) {
      loadConversations(user.id, newRole)
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversations, selectedConversation])

  const selectedConv = conversations.find(c => c.id === selectedConversation)
  const unreadCount = (convId: string) => {
    const conv = conversations.find(c => c.id === convId)
    return conv?.messages.filter(m => !m.is_read && m.sender_id !== user?.id).length || 0
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600 mt-2">
            Communicate with {userRole === 'founder' ? 'investors' : 'founders'} about investment opportunities
          </p>
        </div>

        <RoleSwitcher currentRole={userRole} onRoleChange={handleRoleChange} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Conversations List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Conversations</CardTitle>
              <CardDescription>
                {conversations.length} active conversation{conversations.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[500px] overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <span className="text-4xl block mb-2">💬</span>
                    <p className="font-medium mb-2">No conversations yet</p>
                    <div className="text-sm space-y-2">
                      {userRole === 'investor' ? (
                        <>
                          <p>To start messaging founders:</p>
                          <ol className="text-left list-decimal list-inside space-y-1 text-xs">
                            <li>Browse investment opportunities</li>
                            <li>Click "Express Interest" on any pitch</li>
                            <li>Fill out the interest form</li>
                            <li>Conversation will appear here</li>
                          </ol>
                          <div className="mt-3">
                            <Button size="sm" asChild>
                              <a href="/browse">Browse Opportunities</a>
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p>Conversations will appear when investors express interest in your pitch pages.</p>
                          <div className="mt-3">
                            <Button size="sm" asChild>
                              <a href="/dashboard/pitch-pages">View Pitch Pages</a>
                            </Button>
                          </div>
                        </>
                      )}
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs">
                        <p className="font-medium text-blue-800 mb-1">💡 Setup Required</p>
                        <p className="text-blue-700">
                          If Express Interest shows "no conversations", run the user_roles_schema.sql file in your Supabase dashboard to enable messaging.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  conversations.map((conversation) => {
                    const otherUser = userRole === 'founder' ? conversation.investor : conversation.founder
                    const lastMessage = conversation.messages[conversation.messages.length - 1]
                    const unread = unreadCount(conversation.id)
                    
                    return (
                      <div
                        key={conversation.id}
                        onClick={() => {
                          setSelectedConversation(conversation.id)
                          markAsRead(conversation.id)
                        }}
                        className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                          selectedConversation === conversation.id ? 'bg-purple-50 border-purple-200' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">
                              {userRole === 'founder' ? '💰' : '🚀'}
                            </span>
                            <span className="font-medium text-sm">
                              {otherUser.full_name}
                            </span>
                            {unread > 0 && (
                              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                                {unread}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(conversation.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          {conversation.pitch_pages.pitch_title || 
                           conversation.pitch_pages.advance_assurance_applications?.company_name}
                        </p>
                        {lastMessage && (
                          <p className="text-xs text-gray-500 truncate">
                            {lastMessage.message_text}
                          </p>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Messages */}
          <Card className="lg:col-span-2">
            {selectedConv ? (
              <>
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        <span className="mr-2">{userRole === 'founder' ? '💰' : '🚀'}</span>
                        {userRole === 'founder' ? selectedConv.investor.full_name : selectedConv.founder.full_name}
                      </CardTitle>
                      <CardDescription>
                        Re: {selectedConv.pitch_pages.pitch_title || 
                             selectedConv.pitch_pages.advance_assurance_applications?.company_name}
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                    >
                      <a 
                        href={`/pitch/${selectedConv.pitch_pages.id}`} 
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span className="mr-2">👁️</span>
                        View Pitch
                      </a>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-[400px] overflow-y-auto p-4 space-y-4">
                    {selectedConv.messages.map((message) => {
                      const isOwn = message.sender_id === user?.id
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              isOwn
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-200 text-gray-900'
                            } ${message.message_type === 'interest' ? 'border-l-4 border-blue-500' : ''}`}
                          >
                            {message.message_type === 'interest' && (
                              <div className="text-xs opacity-75 mb-1">
                                💡 Investment Interest
                              </div>
                            )}
                            <p className="text-sm whitespace-pre-wrap">{message.message_text}</p>
                            <p className={`text-xs mt-1 ${isOwn ? 'text-purple-200' : 'text-gray-500'}`}>
                              {new Date(message.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="border-t p-4">
                    <div className="flex space-x-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                        className="flex-1"
                      />
                      <Button 
                        onClick={sendMessage} 
                        disabled={sending || !newMessage.trim()}
                      >
                        <span className="mr-2">📤</span>
                        Send
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <span className="text-6xl block mb-4">💬</span>
                  <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                  <p className="text-sm">Choose a conversation from the list to start messaging</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
