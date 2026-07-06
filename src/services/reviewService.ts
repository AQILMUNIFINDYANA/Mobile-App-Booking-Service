import { supabase } from './supabaseClient'
import { Review } from '../types'

export const reviewService = {
  async createReview(
    bookingId: string,
    rating: number,
    reviewText: string,
    status: 'Sudah Aman' | 'Ada Masalah'
  ) {
    const { data, error } = await supabase
      .from('reviews')
      .insert([
        {
          booking_id: bookingId,
          rating,
          review_text: reviewText,
          status,
        },
      ])
      .select()
      .single()

    if (error) throw error
    return data as Review
  },

  async getBookingReview(bookingId: string) {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('booking_id', bookingId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return (data as Review) || null
  },

  async getServiceReviews(serviceId: string) {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, bookings(service_id)')
      .eq('bookings.service_id', serviceId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Review[]
  },

  async getAverageRating(serviceId: string) {
    const { data, error } = await supabase
      .from('reviews')
      .select('rating, bookings(service_id)')
      .eq('bookings.service_id', serviceId)

    if (error) throw error

    if (!data || data.length === 0) return 0

    const ratings = data.map((r) => r.rating).filter(Boolean) as number[]
    if (ratings.length === 0) return 0

    const sum = ratings.reduce((a, b) => a + b, 0)
    return Math.round((sum / ratings.length) * 10) / 10
  },

  async updateReviewStatus(reviewId: string, status: string) {
    const { data, error } = await supabase
      .from('reviews')
      .update({ status })
      .eq('id', reviewId)
      .select()
      .single()

    if (error) throw error
    return data as Review
  },
}
