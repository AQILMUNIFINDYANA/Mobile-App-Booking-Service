import { supabase } from './supabaseClient'
import { ChatMessage } from '../types'

export const chatService = {
  async getConversation(userId: string, adminId: string) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .or(
        `and(sender_id.eq.${userId},receiver_id.eq.${adminId}),and(sender_id.eq.${adminId},receiver_id.eq.${userId})`
      )
      .order('created_at', { ascending: true })

    if (error) throw error
    return data as ChatMessage[]
  },

  async sendMessage(
    senderId: string,
    receiverId: string,
    message: string,
    locationData?: { latitude: number; longitude: number }
  ) {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([
        {
          sender_id: senderId,
          receiver_id: receiverId,
          message,
          location_data: locationData || null,
          read: false,
        },
      ])
      .select()
      .single()

    if (error) throw error
    return data as ChatMessage
  },

  async replyToMessage(
    senderId: string,
    receiverId: string,
    message: string,
    replyToId: string
  ) {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([
        {
          sender_id: senderId,
          receiver_id: receiverId,
          message,
          reply_to_id: replyToId,
          read: false,
        },
      ])
      .select()
      .single()

    if (error) throw error
    return data as ChatMessage
  },

  async shareLocation(
    senderId: string,
    receiverId: string,
    latitude: number,
    longitude: number
  ) {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([
        {
          sender_id: senderId,
          receiver_id: receiverId,
          message: '📍 Shared location',
          location_data: { latitude, longitude },
          read: false,
        },
      ])
      .select()
      .single()

    if (error) throw error
    return data as ChatMessage
  },

  async markAsRead(messageId: string) {
    const { error } = await supabase
      .from('chat_messages')
      .update({ read: true })
      .eq('id', messageId)

    if (error) throw error
  },

  async deleteMessage(messageId: string) {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId)

    if (error) throw error
  },
}
