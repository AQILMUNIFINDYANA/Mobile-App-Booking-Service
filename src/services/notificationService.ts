import { supabase } from './supabaseClient'
import { Notification } from '../types'

export const notificationService = {
  async getUserNotifications(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Notification[]
  },

  async getUnreadCount(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('read', false)

    if (error) throw error
    return data?.length || 0
  },

  async markAsRead(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)

    if (error) throw error
  },

  async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) throw error
  },

  async createNotification(
    userId: string,
    type: string,
    message: string
  ) {
    const { data, error } = await supabase
      .from('notifications')
      .insert([{ user_id: userId, type, message, read: false }])
      .select()
      .single()

    if (error) throw error
    return data as Notification
  },

  async deleteNotification(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)

    if (error) throw error
  },

  // Trigger notifications on booking status change
  async notifyBookingStatusChange(
    userId: string,
    _bookingId: string,
    newStatus: string
  ) {
    const statusMessages: { [key: string]: string } = {
      Pending: 'Booking Anda sedang menunggu konfirmasi',
      Confirmed: 'Booking Anda telah dikonfirmasi! 🎉',
      'In Progress': 'Kendaraan Anda sedang dikerjakan 🔧',
      Completed: 'Pekerjaan selesai! Silakan ambil kendaraan Anda ✓',
      Cancelled: 'Booking Anda telah dibatalkan',
    }

    return this.createNotification(
      userId,
      'service_update',
      statusMessages[newStatus] || `Booking status updated to ${newStatus}`
    )
  },

  // Send maintenance reminder
  async sendMaintenanceReminder(
    userId: string,
    vehicleType: string,
    lastServiceDate: string
  ) {
    const message = `${vehicleType} Anda perlu ganti oli, terakhir service tanggal ${lastServiceDate}`
    return this.createNotification(userId, 'maintenance_reminder', message)
  },
}
