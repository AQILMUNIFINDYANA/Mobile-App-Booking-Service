import { supabase } from './supabaseClient'
import { Booking } from '../types'

export const bookingService = {
  async createBooking(data: Omit<Booking, 'id' | 'created_at'>) {
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert([data])
      .select()
      .single()

    if (error) throw error
    return booking
  },

  async getUserBookings(userId: string) {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  async getBookingById(id: string) {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  async updateBookingStatus(id: string, status: string) {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getAllBookings() {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, users(name, email, phone)')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  async cancelBooking(id: string) {
    return this.updateBookingStatus(id, 'Cancelled')
  },
}
