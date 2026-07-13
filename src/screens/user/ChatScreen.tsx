import React, { useState, useEffect, useRef } from 'react'
import { 
  View, 
  StyleSheet, 
  FlatList, 
  Text, 
  TouchableOpacity, 
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TextInput,
  DeviceEventEmitter,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { IconButton } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useAuth } from '../../context/AuthContext'
import { useNotification } from '../../context/NotificationContext'
import { supabase } from '../../services/supabaseClient'
import { SensitiveActionMessages } from '../../utils/notificationHelper'
import { chatService } from '../../services/chatService'
import { TypingIndicator } from '../../components/TypingIndicator'

interface Message {
  id: string
  senderId: string
  receiverId: string
  text: string
  timestamp: Date
  read: boolean
  senderType: 'user' | 'admin'
}

// We will fetch the admin ID dynamically from the database
// const ADMIN_USER_ID = 'admin-support-team'

export const ChatScreen: React.FC<{ navigation: any, route?: any }> = ({ navigation, route }) => {
  const { user } = useAuth()
  const { showNotification } = useNotification()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState(route?.params?.prefillMessage || '')
  const [showInfo, setShowInfo] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [isOtherTyping, setIsOtherTyping] = useState(false)
  const flatListRef = useRef<FlatList>(null)
  const channelRef = useRef<any>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [adminId, setAdminId] = useState<string | null>(null)
  const [hasActiveBooking, setHasActiveBooking] = useState(false)

  useEffect(() => {
    const fetchAdminId = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'admin')
        .limit(1)
        .single()
      
      if (data && !error) {
        setAdminId(data.id)
      }
    }
    fetchAdminId()
  }, [])

  useEffect(() => {
    loadMessages()
    
    // Listen to local broadcast from AuthContext
    const subscription = DeviceEventEmitter.addListener('onNewChatMessage', (payloadNew: any) => {
      if (payloadNew && (payloadNew.receiver_id === user?.id || payloadNew.sender_id === user?.id)) {
        const newMsg: Message = {
          id: payloadNew.id,
          senderId: payloadNew.sender_id,
          receiverId: payloadNew.receiver_id,
          text: payloadNew.message,
          timestamp: new Date(payloadNew.created_at + (payloadNew.created_at.endsWith('Z') ? '' : 'Z')),
          read: payloadNew.read,
          senderType: payloadNew.sender_id === user?.id ? 'user' : 'admin',
        }
        setMessages(prev => {
          const exists = prev.some(m => m.id === newMsg.id)
          if (exists) return prev;
          
          return [...prev, newMsg]
        })
      }
    })

    // Setup typing indicator channel
    if (user?.id) {
      const channel = supabase.channel(`chat_typing_${user.id}`)
      
      channel.on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload.sender_id !== user.id) {
          setIsOtherTyping(payload.payload.is_typing)
        }
      }).subscribe()
      
      channelRef.current = channel
    }

    return () => {
      subscription.remove()
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [user?.id])

  const loadMessages = async () => {
    try {
      setLoading(true)
      if (!user?.id) return

      // Check if user has an active booking
      const { data: activeBookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('user_id', user.id)
        .in('status', ['Confirmed', 'In Progress'])
        .limit(1)
        
      const isActive = !!(activeBookings && activeBookings.length > 0)
      setHasActiveBooking(isActive)

      if (!isActive) {
        setMessages([])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: true })

      if (error) throw error

      const formattedMessages: Message[] = (data || []).map((msg: any) => ({
        id: msg.id,
        senderId: msg.sender_id,
        receiverId: msg.receiver_id,
        text: msg.message,
        timestamp: new Date(msg.created_at + (msg.created_at.endsWith('Z') ? '' : 'Z')),
        read: msg.read,
        senderType: msg.sender_id === user.id ? 'user' : 'admin',
      }))

      setMessages(formattedMessages)
      
      const unreadMessageIds = formattedMessages
        .filter(m => m.receiverId === user.id && !m.read)
        .map(m => m.id)

      if (unreadMessageIds.length > 0) {
        await supabase
          .from('chat_messages')
          .update({ read: true })
          .in('id', unreadMessageIds)
          
        DeviceEventEmitter.emit('messagesRead')
      }
    } catch (error) {
      console.log('Error loading messages:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const count = messages.filter(m => m.senderType === 'admin' && !m.read).length
    setUnreadCount(count)
  }, [messages])

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
    if (!newMessage.trim() || !user?.id || !adminId) return

    const messageText = newMessage.trim()
    setNewMessage('')
    
    // Optimistic Update: Tampilkan pesan seketika
    const tempId = 'temp-' + Date.now()
    const optimisticMsg: Message = {
      id: tempId,
      senderId: user.id,
      receiverId: adminId,
      text: messageText,
      timestamp: new Date(),
      read: false,
      senderType: 'user',
    }
    
    setMessages(prev => [...prev, optimisticMsg])

    try {
      setSending(true)
      const data = await chatService.sendMessage(user.id, adminId, messageText)

      // Replace the temp message with real data from server
      setMessages(prev => prev.map(m => m.id === tempId ? {
        ...m,
        id: data.id,
        timestamp: new Date(data.created_at + (data.created_at.endsWith('Z') ? '' : 'Z')),
      } : m))

    } catch (error) {
      // Revert if error
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setNewMessage(messageText)
      console.log('💥 Send message catch error:', error)
      const errorMsg = (error as any)?.message?.includes('Network')
        ? SensitiveActionMessages.networkError
        : SensitiveActionMessages.chatMessage.error
      showNotification(errorMsg, 'error', 3000)
    } finally {
      setSending(false)
    }
  }

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const formatDate = (date: Date): string => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const shouldShowDateSeparator = (currentIndex: number): boolean => {
    if (currentIndex === 0) return true
    const currentDate = messages[currentIndex].timestamp.toDateString()
    const prevDate = messages[currentIndex - 1].timestamp.toDateString()
    return currentDate !== prevDate
  }

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const showDate = shouldShowDateSeparator(index)
    
    return (
      <View>
        {showDate && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateSeparatorText}>{formatDate(item.timestamp)}</Text>
          </View>
        )}
        <View
          style={[
            styles.messageContainer,
            item.senderType === 'user' ? styles.userMessageContainer : styles.adminMessageContainer,
          ]}
        >
          <View
            style={[
              styles.messageBubble,
              item.senderType === 'user' ? styles.userMessage : styles.adminMessage,
            ]}
          >
            <Text style={styles.messageText}>{item.text}</Text>
            <View style={styles.messageFooter}>
              <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>
              {item.senderType === 'user' && (
                <MaterialCommunityIcons 
                  name={item.read ? 'check-all' : 'check'} 
                  size={14} 
                  color="#b0b0b0"
                  style={{ marginLeft: 4 }}
                />
              )}
            </View>
          </View>
        </View>
      </View>
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
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color="#F59E0B" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>Workshop Support</Text>
            <Text style={styles.subtitle}>Usually responds in minutes</Text>
          </View>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity 
          onPress={() => setShowInfo(true)}
          style={styles.infoButton}
        >
          <MaterialCommunityIcons name="information-outline" size={24} color="#F59E0B" />
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      {!hasActiveBooking ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="chat-remove-outline" size={64} color="#8a8a8a" />
          <Text style={[styles.emptyText, { marginTop: 16 }]}>Chat is currently closed</Text>
          <Text style={[styles.emptySubtext, { textAlign: 'center', marginHorizontal: 20, marginTop: 8 }]}>
            Chat is only available while you have an active booking (Confirmed or In Progress).
          </Text>
        </View>
      ) : loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F59E0B" />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={[...messages].reverse()}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.messagesList, messages.length === 0 && { flex: 1, justifyContent: 'center' }]}
          scrollEnabled={true}
          inverted={true}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="chat-outline" size={48} color="#8a8a8a" />
              <Text style={styles.emptyText}>Belum ada pesan</Text>
              <Text style={styles.emptySubtext}>Kirim pesan untuk memulai percakapan</Text>
            </View>
          }
          ListHeaderComponent={
            isOtherTyping ? <TypingIndicator /> : null
          }
        />
      )}

      {/* Input Area */}
      {hasActiveBooking && (
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
                placeholder="Type your message..."
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
          <Text style={styles.charCount}>
            {newMessage.length}/500
          </Text>
        </View>
      )}

      {/* Info Modal */}
      <Modal visible={showInfo} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chat Info</Text>
              <TouchableOpacity onPress={() => setShowInfo(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Chat Guidelines */}
              <View style={styles.infoSection}>
                <View style={styles.infoHeader}>
                  <MaterialCommunityIcons name="chat-plus-outline" size={20} color="#F59E0B" />
                  <Text style={styles.infoTitle}>Chat Guidelines</Text>
                </View>
                <View style={styles.guidelineItem}>
                  <Text style={styles.bulletPoint}>•</Text>
                  <Text style={styles.guidelineText}>Be clear and specific about your issue</Text>
                </View>
                <View style={styles.guidelineItem}>
                  <Text style={styles.bulletPoint}>•</Text>
                  <Text style={styles.guidelineText}>Include booking reference if available</Text>
                </View>
                <View style={styles.guidelineItem}>
                  <Text style={styles.bulletPoint}>•</Text>
                  <Text style={styles.guidelineText}>Provide photos if reporting issues</Text>
                </View>
                <View style={styles.guidelineItem}>
                  <Text style={styles.bulletPoint}>•</Text>
                  <Text style={styles.guidelineText}>Response time varies by time of day</Text>
                </View>
              </View>

              {/* Support Hours */}
              <View style={styles.infoSection}>
                <View style={styles.infoHeader}>
                  <MaterialCommunityIcons name="clock-outline" size={20} color="#F59E0B" />
                  <Text style={styles.infoTitle}>Support Hours</Text>
                </View>
                <View style={styles.hoursItem}>
                  <Text style={styles.hoursDay}>Monday - Friday</Text>
                  <Text style={styles.hoursTime}>09:00 - 17:00</Text>
                </View>
                <View style={styles.hoursItem}>
                  <Text style={styles.hoursDay}>Saturday</Text>
                  <Text style={styles.hoursTime}>10:00 - 16:00</Text>
                </View>
                <View style={styles.hoursItem}>
                  <Text style={styles.hoursDay}>Sunday</Text>
                  <Text style={styles.hoursTime}>Closed</Text>
                </View>
              </View>

              {/* Common Issues */}
              <View style={styles.infoSection}>
                <View style={styles.infoHeader}>
                  <MaterialCommunityIcons name="help-circle-outline" size={20} color="#F59E0B" />
                  <Text style={styles.infoTitle}>Common Issues</Text>
                </View>
                <View style={styles.issueItem}>
                  <Text style={styles.issueTitle}>How to reschedule?</Text>
                  <Text style={styles.issueDesc}>Go to Booking History and click "Edit" on your booking</Text>
                </View>
                <View style={styles.issueItem}>
                  <Text style={styles.issueTitle}>How to cancel?</Text>
                  <Text style={styles.issueDesc}>Click "Cancel" button on your active booking before 24 hours</Text>
                </View>
                <View style={styles.issueItem}>
                  <Text style={styles.issueTitle}>Pricing question?</Text>
                  <Text style={styles.issueDesc}>Check Service Catalog for detailed pricing and duration</Text>
                </View>
              </View>

              <View style={styles.spacer} />
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#8a8a8a',
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: '#F59E0B',
    borderRadius: 50,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  unreadCount: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  infoButton: {
    padding: 8,
    marginRight: -8,
  },
  messagesList: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 4,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 16,
    marginTop: 8,
  },
  dateSeparatorText: {
    fontSize: 11,
    color: '#8a8a8a',
    fontWeight: '600',
    backgroundColor: '#0F1115',
    paddingHorizontal: 8,
  },
  messageContainer: {
    marginVertical: 4,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  adminMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  userMessage: {
    backgroundColor: '#F59E0B',
  },
  adminMessage: {
    backgroundColor: '#1A1D24',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  messageText: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 18,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    justifyContent: 'flex-end',
  },
  timestamp: {
    fontSize: 11,
    color: '#b0b0b0',
    marginTop: 2,
  },
  inputArea: {
    backgroundColor: '#1A1D24',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    fontSize: 14,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#1A1D24',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 0,
    padding: 0,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  charCount: {
    fontSize: 10,
    color: '#8a8a8a',
    marginTop: 4,
    textAlign: 'right',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0F1115',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  infoSection: {
    marginBottom: 24,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  guidelineItem: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 8,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '700',
  },
  guidelineText: {
    fontSize: 13,
    color: '#b0b0b0',
    flex: 1,
    lineHeight: 18,
  },
  hoursItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  hoursDay: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '600',
  },
  hoursTime: {
    fontSize: 13,
    color: '#F59E0B',
    fontWeight: '700',
  },
  issueItem: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  issueTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  issueDesc: {
    fontSize: 12,
    color: '#b0b0b0',
    lineHeight: 16,
  },
  spacer: {
    height: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F1115',
  },
  loadingText: {
    fontSize: 14,
    color: '#b0b0b0',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    minHeight: 300,
  },
  emptyText: {
    fontSize: 14,
    color: '#8a8a8a',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#8a8a8a',
    marginTop: 6,
  },
})
