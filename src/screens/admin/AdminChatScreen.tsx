import React, { useState, useEffect, useRef } from 'react'
import { 
  View, 
  StyleSheet, 
  FlatList, 
  Text, 
  TouchableOpacity, 
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TextInput,
  DeviceEventEmitter,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { IconButton } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { supabase } from '../../services/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { chatService } from '../../services/chatService'
import { TypingIndicator } from '../../components/TypingIndicator'

interface ChatUser {
  id: string
  name: string
  lastMessage: string
  lastMessageTime: Date
  unreadCount: number
}

interface Message {
  id: string
  senderId: string
  receiverId: string
  text: string
  timestamp: Date
  read: boolean
}

// We use the actual authenticated admin's ID
// const ADMIN_USER_ID = 'admin-support-team'

export const AdminChatScreen: React.FC<{ navigation: any }> = ({ navigation: _navigation }) => {
  const { user } = useAuth()
  const [view, setView] = useState<'list' | 'chat'>('list')
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([])
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [chatLoading, setChatLoading] = useState(false)
  const [isOtherTyping, setIsOtherTyping] = useState(false)
  const [readUsers, setReadUsers] = useState<Set<string>>(new Set())
  const flatListRef = useRef<FlatList>(null)
  const channelRef = useRef<any>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    loadChatUsers()
    
    // Listen to local broadcast from AuthContext
    const subscription = DeviceEventEmitter.addListener('onNewChatMessage', (payloadNew: any) => {
      if (payloadNew && payloadNew.receiver_id === user?.id) {
        // Add message if user is selected
        if (selectedUser?.id === payloadNew.sender_id) {
          setMessages(prev => {
            const exists = prev.some(m => m.id === payloadNew.id)
            if (exists) return prev;
            
            return [...prev, {
              id: payloadNew.id,
              senderId: payloadNew.sender_id,
              receiverId: payloadNew.receiver_id,
              text: payloadNew.message,
              timestamp: new Date(payloadNew.created_at + (payloadNew.created_at.endsWith('Z') ? '' : 'Z')),
              read: payloadNew.read,
            }]
          })
        }
        
        // Update chat users list
        setChatUsers(prev => {
          const userExists = prev.find(u => u.id === payloadNew.sender_id)
          if (userExists) {
            return prev.map(u => 
              u.id === payloadNew.sender_id 
                ? {
                    ...u,
                    lastMessage: payloadNew.message,
                    lastMessageTime: new Date(payloadNew.created_at + (payloadNew.created_at.endsWith('Z') ? '' : 'Z')),
                    unreadCount: view === 'chat' && selectedUser?.id === u.id ? 0 : u.unreadCount + 1,
                  }
                : u
            )
          }
          return prev
        })
      }
    })

    return () => {
      subscription.remove()
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [selectedUser?.id, user?.id])

  // Setup typing indicator channel for the selected user
  useEffect(() => {
    if (!selectedUser?.id) return;
    
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }
    
    const channel = supabase.channel(`chat_typing_${selectedUser.id}`)
    
    channel.on('broadcast', { event: 'typing' }, (payload) => {
      if (payload.payload.sender_id !== user?.id) {
        setIsOtherTyping(payload.payload.is_typing)
      }
    }).subscribe()
    
    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedUser?.id, user?.id])

  const loadChatUsers = async () => {
    try {
      setLoading(true)
      
      // Get all unique users who have sent messages
      if (!user?.id) return;

      // Filter by users with active bookings
      const { data: activeBookings } = await supabase
        .from('bookings')
        .select('user_id')
        .in('status', ['Confirmed', 'In Progress'])
      
      const activeUserIds = activeBookings?.map(b => b.user_id) || []

      if (activeUserIds.length === 0) {
        setChatUsers([])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .select('sender_id, message, created_at, read, users(id, name)')
        .eq('receiver_id', user.id)
        .in('sender_id', activeUserIds)
        .order('created_at', { ascending: false })

      if (error) throw error

      const userMap = new Map<string, any>()
      
      data?.forEach((msg: any) => {
        if (!userMap.has(msg.sender_id)) {
          userMap.set(msg.sender_id, {
            id: msg.sender_id,
            name: msg.users?.name || 'Unknown User',
            lastMessage: msg.message,
            lastMessageTime: new Date(msg.created_at + (msg.created_at.endsWith('Z') ? '' : 'Z')),
            unreadCount: (msg.read || readUsers.has(msg.sender_id)) ? 0 : 1,
            hasBeenCounted: true
          })
        } else if (!msg.read && !readUsers.has(msg.sender_id) && !userMap.get(msg.sender_id).hasBeenCounted) {
          const existing = userMap.get(msg.sender_id)
          existing.unreadCount += 1
        }
      })

      setChatUsers(Array.from(userMap.values()))
    } catch (error) {
      console.log('Error loading chat users:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: true })

      if (error) throw error

      const formattedMessages: Message[] = (data || []).map((msg: any) => ({
        id: msg.id,
        senderId: msg.sender_id,
        receiverId: msg.receiver_id,
        text: msg.message,
        timestamp: new Date(msg.created_at + (msg.created_at.endsWith('Z') ? '' : 'Z')),
        read: msg.read,
      }))

      setMessages(formattedMessages)

      const unreadMessageIds = formattedMessages
        .filter(m => m.senderId === userId && !m.read)
        .map(m => m.id)

      if (unreadMessageIds.length > 0) {
        const { error: updateError } = await supabase
          .from('chat_messages')
          .update({ read: true })
          .in('id', unreadMessageIds)
        
        if (!updateError) {
          DeviceEventEmitter.emit('messagesRead')
        }
        if (updateError) {
          console.log('❌ Failed to mark messages as read. This is likely an RLS Policy issue in Supabase! error:', updateError)
        }
      }
    } catch (error) {
      console.log('Error loading messages:', error)
    }
  }

  const handleOpenChat = async (user: ChatUser) => {
    setSelectedUser(user)
    setReadUsers(prev => new Set(prev).add(user.id))
    setMessages([])
    setChatLoading(true)
    setView('chat')
    
    await loadMessages(user.id)
    
    setChatLoading(false)
    setChatUsers(prev =>
      prev.map(u => (u.id === user.id ? { ...u, unreadCount: 0 } : u))
    )
  }

  const handleTyping = (text: string) => {
    setNewMessage(text)
    
    if (channelRef.current && user) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { sender_id: user.id, is_typing: true }
      })
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      
      typingTimeoutRef.current = setTimeout(() => {
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'typing',
            payload: { sender_id: user.id, is_typing: false }
          })
        }
      }, 2000)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !user) return

    const messageText = newMessage.trim()
    setNewMessage('')
    
    // Optimistic Update: Tampilkan pesan seketika
    const tempId = 'temp-' + Date.now()
    const optimisticMsg: Message = {
      id: tempId,
      senderId: user.id,
      receiverId: selectedUser.id,
      text: messageText,
      timestamp: new Date(),
      read: false,
    }
    
    setMessages(prev => [...prev, optimisticMsg])

    try {
      setSending(true)
      const data = await chatService.sendMessage(user.id, selectedUser.id, messageText)

      // Replace the temp message with real data from server
      setMessages(prev => prev.map(m => m.id === tempId ? {
        ...m,
        id: data.id,
        timestamp: new Date(data.created_at + (data.created_at.endsWith('Z') ? '' : 'Z')),
      } : m))

      // Reload chat users to update last message
      await loadChatUsers()
    } catch (error) {
      // Revert if error
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setNewMessage(messageText)
      console.log('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  const formatLastSeen = (date: Date): string => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  const getTotalUnread = () => chatUsers.reduce((sum, user) => sum + user.unreadCount, 0)

  const renderChatUser = ({ item }: { item: ChatUser }) => (
    <TouchableOpacity
      style={styles.chatUserItem}
      onPress={() => handleOpenChat(item)}
    >
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </Text>
        </View>
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
          </View>
        )}
      </View>

      <View style={styles.userContent}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.lastMessage}
        </Text>
      </View>

      <View style={styles.userTime}>
        <Text style={styles.timeText}>{formatLastSeen(item.lastMessageTime)}</Text>
      </View>
    </TouchableOpacity>
  )

  const handleMessagePress = (text: string) => {
    const match = text.match(/No\. Pesanan:\s*(ORD-[A-Z0-9-]+)/i) || text.match(/(ORD-[A-Z0-9-]+)/i);
    if (match && match[1]) {
      const orderNumber = match[1];
      _navigation.navigate('AdminDashboard', { orderNumberToOpen: orderNumber });
    }
  }

  const renderMessage = ({ item }: { item: Message }) => {
    const isClickable = item.text.includes('ORD-');
    
    return (
      <View
        style={[
          styles.messageContainer,
          item.senderId === user?.id ? styles.adminMessageContainer : styles.userMessageContainer,
        ]}
      >
        <TouchableOpacity
          activeOpacity={isClickable ? 0.7 : 1}
          onPress={isClickable ? () => handleMessagePress(item.text) : undefined}
          style={[
            styles.messageBubble,
            item.senderId === user?.id ? styles.adminMessage : styles.userMessage,
            isClickable && { borderColor: '#F59E0B', borderWidth: 1 }
          ]}
        >
          <Text style={styles.messageText}>{item.text}</Text>
          <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (view === 'list') {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Customer Chat</Text>
            <Text style={styles.headerSubtitle}>
              {getTotalUnread() > 0 ? `${getTotalUnread()} unread` : 'All caught up'}
            </Text>
          </View>
          <View style={styles.unreadBadgeHeader}>
            <Text style={styles.unreadBadgeHeaderText}>{getTotalUnread()}</Text>
          </View>
        </View>

        {/* Chat Users List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#F59E0B" />
          </View>
        ) : chatUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="chat-outline" size={48} color="#8a8a8a" />
            <Text style={styles.emptyText}>No conversations yet</Text>
          </View>
        ) : (
          <FlatList
            data={chatUsers}
            renderItem={renderChatUser}
            keyExtractor={(item) => item.id}
            scrollEnabled={true}
          />
        )}
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            setView('list');
            setSelectedUser(null);
          }}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color="#F59E0B" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{selectedUser?.name || 'Chat'}</Text>
          <Text style={styles.headerSubtitle}>Last message {formatLastSeen(selectedUser?.lastMessageTime || new Date())}</Text>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={[...messages].reverse()}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.messagesList, messages.length === 0 && { flex: 1, justifyContent: 'center' }]}
        inverted={true}
        ListEmptyComponent={
          <View style={styles.emptyMessages}>
            {chatLoading ? (
              <ActivityIndicator size="large" color="#F59E0B" />
            ) : (
              <Text style={styles.emptyText}>Belum ada pesan</Text>
            )}
          </View>
        }
        ListHeaderComponent={
          isOtherTyping ? <TypingIndicator /> : null
        }
      />

      {/* Input Area */}
      <View style={styles.inputArea}>
        <View style={[styles.inputContainer, { alignItems: 'flex-end' }]}>
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(34, 37, 45, 0.65)',
            borderRadius: 24,
            borderWidth: 1,
            borderColor: newMessage.trim() ? '#F59E0B' : '#3a3a3a',
            minHeight: 48,
            maxHeight: 120,
            justifyContent: 'center',
          }}>
            <TextInput
              placeholder="Type your reply..."
              placeholderTextColor="#666666"
              value={newMessage}
              onChangeText={handleTyping}
              editable={!sending}
              multiline
              maxLength={500}
              style={[styles.input, {
                color: '#ffffff',
                paddingHorizontal: 16,
                paddingTop: Platform.OS === 'ios' ? 14 : 10,
                paddingBottom: Platform.OS === 'ios' ? 14 : 10,
              }]}
            />
          </View>
          {sending ? (
            <View style={[styles.sendButton, { height: 48, justifyContent: 'center' }]}>
              <ActivityIndicator size="small" color="#F59E0B" />
            </View>
          ) : (
            <IconButton
              icon="send"
              iconColor={newMessage.trim() ? '#F59E0B' : '#666666'}
              size={28}
              onPress={sendMessage}
              disabled={!newMessage.trim()}
              style={[styles.sendButton, { height: 48, justifyContent: 'center', margin: 0 }]}
            />
          )}
        </View>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F1115',
  },
  container: {
    flex: 1,
    backgroundColor: '#0F1115',
  },
  header: {
    backgroundColor: '#1A1D24',
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#8a8a8a',
    fontWeight: '500',
  },
  headerContent: {
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  unreadBadgeHeader: {
    backgroundColor: '#F59E0B',
    borderRadius: 50,
    minWidth: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadgeHeaderText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  // Chat Users List
  chatUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  unreadBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#FF5252',
    borderRadius: 50,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0F1115',
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  userContent: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  lastMessage: {
    fontSize: 12,
    color: '#b0b0b0',
  },
  userTime: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 11,
    color: '#8a8a8a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyMessages: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  emptyText: {
    fontSize: 14,
    color: '#8a8a8a',
    marginTop: 12,
  },
  // Messages
  messagesList: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  messageContainer: {
    marginVertical: 4,
  },
  userMessageContainer: {
    alignItems: 'flex-start',
  },
  adminMessageContainer: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  userMessage: {
    backgroundColor: '#1A1D24',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  adminMessage: {
    backgroundColor: '#F59E0B',
  },
  messageText: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 18,
  },
  timestamp: {
    fontSize: 10,
    color: '#b0b0b0',
    marginTop: 4,
  },
  // Input Area
  inputArea: {
    backgroundColor: '#1A1D24',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    fontSize: 14,
  },
  sendButton: {
    margin: 0,
  },
})
