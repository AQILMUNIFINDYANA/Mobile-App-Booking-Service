import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { TextInput, Button } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../services/supabaseClient'

interface Booking {
  id: string
  service_id: string
  booking_date: string
  booking_time: string
  status: string
  services?: { title: string }
  reviews?: any[]
}

interface Service {
  id: string
  title: string
  description: string
  price: number
  estimated_duration: number
}

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuth()
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [rating, setRating] = useState(5)
  const [review, setReview] = useState('')
  const [reviewCount, setReviewCount] = useState(0)
  const [nextReviewTime, setNextReviewTime] = useState<string | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('User')
  const [unreadCount, setUnreadCount] = useState(0)

  useFocusEffect(
    React.useCallback(() => {
      if (!user?.id) return

      const fetchUnread = async () => {
        const { count: activeCount } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .in('status', ['Confirmed', 'In Progress'])
          
        if (!activeCount || activeCount === 0) {
          setUnreadCount(0)
          return
        }

        const { count } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('receiver_id', user.id)
          .eq('read', false)
        
        setUnreadCount(count || 0)
      }

      fetchUnread()
    }, [user?.id])
  )

  useEffect(() => {
    loadReviewCount()
    fetchUserData()
    fetchBookings()
    fetchServices()

    if (!user?.id) return

    const fetchUnread = async () => {
      const { count: activeCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('status', ['Confirmed', 'In Progress'])
        
      if (!activeCount || activeCount === 0) {
        setUnreadCount(0)
        return
      }

      const { count } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('read', false)
      
      setUnreadCount(count || 0)
    }

    fetchUnread()

    const subscription = supabase
      .channel('user-unread-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          fetchUnread()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [user?.id])

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, title, description, price, estimated_duration')
        .order('title', { ascending: true })
        .limit(4)

      if (error) {
        // If estimated_duration column doesn't exist, try without it
        if (error.code === '42703') {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('services')
            .select('id, title, description, price')
            .order('title', { ascending: true })
            .limit(4)

          if (fallbackError) throw fallbackError
          setServices((fallbackData || []).map(item => ({ ...item, estimated_duration: 0 })))
        } else {
          throw error
        }
      } else {
        setServices(data || [])
      }
    } catch (error) {
      console.log('Error fetching services:', error)
    }
  }

  const fetchUserData = async () => {
    try {
      if (!user?.id) return
      const { data, error } = await supabase
        .from('users')
        .select('name')
        .eq('id', user.id)
        .single()

      if (error) throw error
      if (data) setUserName(data.name || 'User')
    } catch (error) {
      console.log('Error fetching user data:', error)
    }
  }

  const fetchBookings = async () => {
    try {
      setLoading(true)
      if (!user?.id) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          service_id,
          booking_date,
          booking_time,
          status,
          services(title),
          reviews(id)
        `)
        .eq('user_id', user.id)
        .order('booking_date', { ascending: true })

      if (error) {
        if (error.code === 'PGRST200' || error.message?.includes('relationship')) {
          // Fallback if reviews relation doesn't exist
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('bookings')
            .select(`
              id,
              service_id,
              booking_date,
              booking_time,
              status,
              services(title)
            `)
            .eq('user_id', user.id)
            .order('booking_date', { ascending: true })

          if (fallbackError) throw fallbackError
          setBookings((fallbackData as any) || [])
        } else {
          throw error
        }
      } else {
        setBookings((data as any) || [])
      }
    } catch (error) {
      console.log('Error fetching bookings:', error)
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  const loadReviewCount = async () => {
    try {
      const stored = await AsyncStorage.getItem('reviewData')
      if (stored) {
        const data = JSON.parse(stored)
        const now = Date.now()
        const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000

        // Filter reviews from last 24 hours
        const recentReviews = data.timestamps.filter((ts: number) => ts > twentyFourHoursAgo)

        if (recentReviews.length >= 7) {
          // Calculate next available review time
          const oldestReview = Math.min(...recentReviews)
          const nextTime = new Date(oldestReview + 24 * 60 * 60 * 1000)
          setNextReviewTime(nextTime.toLocaleTimeString())
        }

        setReviewCount(recentReviews.length)
      }
    } catch (error) {
      console.log('Error loading review count:', error)
    }
  }

  const canReview = reviewCount < 7

  const handleOpenReview = async () => {
    if (!canReview) {
      Alert.alert(
        'Review Limit Reached',
        `You can only submit 7 reviews per 24 hours.\n\nNext review available at: ${nextReviewTime}`,
        [{ text: 'OK' }]
      )
      return
    }

    // Find the most recent completed booking that DOES NOT have a review yet
    const completedBookings = bookings.filter(b => b.status === 'Completed' && (!b.reviews || b.reviews.length === 0))
    const bookingToReview = completedBookings.length > 0 ? completedBookings[completedBookings.length - 1] : null

    if (!bookingToReview) {
      Alert.alert('Belum Bisa Review', 'Semua servis kamu yang sudah selesai telah di-review, atau belum ada servis yang selesai.')
      return
    }

    setSelectedBooking(bookingToReview)
    setReview('')
    setRating(5)
    setShowReviewModal(true)
  }

  const lastBooking = bookings.length > 0 ? bookings[bookings.length - 1] : null
  const upcomingBookings = bookings.filter(b => new Date(b.booking_date) >= new Date())
  const hasCompletedBooking = bookings.some(b => b.status === 'Completed' && (!b.reviews || b.reviews.length === 0))

  const handleSubmitReview = async () => {
    if (!review.trim()) {
      Alert.alert('Error', 'Please enter a review')
      return
    }

    if (!selectedBooking) {
      Alert.alert('Error', 'No booking selected')
      return
    }

    try {
      console.log('💬 Submitting review for booking:', selectedBooking.id)

      // Save to Supabase reviews table
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          booking_id: selectedBooking.id,
          rating: rating,
          review_text: review.trim(),
        })
        .select()

      if (error) {
        console.log('❌ Supabase error:', error)
        Alert.alert('Error', 'Failed to submit review')
        return
      }

      console.log('✅ Review saved to Supabase:', data)

      // Save review timestamp for rate limiting
      const stored = await AsyncStorage.getItem('reviewData')
      const reviewData = stored ? JSON.parse(stored) : { timestamps: [] }
      reviewData.timestamps.push(Date.now())

      await AsyncStorage.setItem('reviewData', JSON.stringify(reviewData))

      Alert.alert('Thank You', 'Your review has been submitted!')
      setReview('')
      setRating(5)
      setShowReviewModal(false)

      // Reload review count
      loadReviewCount()
    } catch (error) {
      console.log('Error submitting review:', error)
      Alert.alert('Error', 'Failed to submit review')
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Clean Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back</Text>
            <Text style={styles.userName}>{userName}</Text>
          </View>
          <View style={styles.headerBadge}>
            <Ionicons name="flash" size={32} color="#ffffff" />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Booking')}
            >
              <MaterialCommunityIcons name="wrench" size={28} color="#F59E0B" />
              <Text style={styles.actionLabel} numberOfLines={1}>Booking</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('BookingHistory')}
            >
              <MaterialCommunityIcons name="history" size={28} color="#F59E0B" />
              <Text style={styles.actionLabel} numberOfLines={1}>History</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Chat')}
            >
              <View>
                <MaterialCommunityIcons name="chat-outline" size={28} color="#F59E0B" />
                {unreadCount > 0 && (
                  <View style={{ position: 'absolute', top: -5, right: -10, backgroundColor: '#EF4444', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4, borderWidth: 2, borderColor: '#1A1D24' }}>
                    <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>{unreadCount}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.actionLabel} numberOfLines={1}>Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton, 
                (!canReview || !hasCompletedBooking) && styles.actionButtonDisabled
              ]}
              onPress={handleOpenReview}
              disabled={!canReview || !hasCompletedBooking}
            >
              <MaterialCommunityIcons 
                name="star-outline" 
                size={28} 
                color={(!canReview || !hasCompletedBooking) ? '#666666' : '#F59E0B'} 
              />
              <Text style={[
                styles.actionLabel,
                (!canReview || !hasCompletedBooking) && { color: '#666666' }
              ]} numberOfLines={1}>Review</Text>
              {!canReview && hasCompletedBooking && <Text style={styles.limitBadge}>{reviewCount}/7</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* Next Appointment */}
        {upcomingBookings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Next Appointment</Text>
            <View style={styles.appointmentCard}>
              <View style={styles.appointmentLeft}>
                <Text style={styles.appointmentService}>{upcomingBookings[0].services?.title || 'Service'}</Text>
                <View style={styles.appointmentMeta}>
                  <View style={styles.metaItem}>
                    <MaterialCommunityIcons name="calendar" size={14} color="#8a8a8a" />
                    <Text style={styles.appointmentMetaText}>{upcomingBookings[0].booking_date?.split('-').reverse().join('-')}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <MaterialCommunityIcons name="clock-outline" size={14} color="#8a8a8a" />
                    <Text style={styles.appointmentMetaText}>{upcomingBookings[0].booking_time?.substring(0, 5)}</Text>
                  </View>
                </View>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: '#F59E0B' }]}>
                <Text style={styles.statusBadgeText}>{upcomingBookings[0].status}</Text>
              </View>
            </View>
          </View>
        )}
        {upcomingBookings.length === 0 && !loading && (
          <View style={styles.section}>
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="calendar-plus" size={40} color="#F59E0B" />
              <Text style={styles.emptyStateText}>No upcoming appointments</Text>
              <Text style={styles.emptyStateSubtext}>Book a service to get started</Text>
            </View>
          </View>
        )}

        {/* Popular Services - Load from Real Data */}
        {services.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Popular Services</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ServiceCatalog')}>
                <Text style={styles.seeAll}>View All →</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.serviceGrid}>
              {services.slice(0, 4).map((service) => (
                <TouchableOpacity 
                  key={service.id} 
                  style={styles.serviceCard}
                  onPress={() => navigation.navigate('Booking', { preselectedService: service })}
                >
                  <Text style={styles.serviceCardPrice}>Rp {service.price.toLocaleString('id-ID')}</Text>
                  <Text style={styles.serviceCardName} numberOfLines={2}>{service.title}</Text>
                  <Text style={styles.serviceCardDuration}>{service.estimated_duration} min</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Info Card */}
        <View style={styles.section}>
          <View style={styles.infoCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 }}>
              <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', padding: 10, borderRadius: 12 }}>
                <MaterialCommunityIcons name="store-clock-outline" size={24} color="#F59E0B" />
              </View>
              <View>
                <Text style={[styles.infoTitle, { marginBottom: 0 }]}>Workshop Hours</Text>
                <Text style={{ fontSize: 12, color: '#8a8a8a', marginTop: 2 }}>Our operational schedule</Text>
              </View>
            </View>

            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: '#b0b0b0', fontWeight: '500' }}>Monday - Friday</Text>
                <Text style={{ fontSize: 13, color: '#ffffff', fontWeight: '600', letterSpacing: 0.5 }}>08:00 - 17:00</Text>
              </View>
              <View style={{ height: 1, backgroundColor: 'rgba(255, 255, 255, 0.05)' }} />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: '#b0b0b0', fontWeight: '500' }}>Saturday</Text>
                <Text style={{ fontSize: 13, color: '#ffffff', fontWeight: '600', letterSpacing: 0.5 }}>08:00 - 15:00</Text>
              </View>
              <View style={{ height: 1, backgroundColor: 'rgba(255, 255, 255, 0.05)' }} />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: '#b0b0b0', fontWeight: '500' }}>Sunday</Text>
                <View style={{ backgroundColor: 'rgba(255, 82, 82, 0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                  <Text style={{ fontSize: 12, color: '#FF5252', fontWeight: '700', letterSpacing: 0.5 }}>CLOSED</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      {/* Review Modal */}
      <Modal
        visible={showReviewModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Service Review</Text>
              <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Booking Info */}
              {lastBooking ? (
                <View style={styles.bookingInfo}>
                  <Text style={styles.bookingInfoLabel}>Last Service</Text>
                  <Text style={styles.bookingInfoService}>{lastBooking.services?.title || 'Service'}</Text>
                  <View style={styles.bookingInfoMeta}>
                    <View style={styles.metaItem}>
                      <MaterialCommunityIcons name="calendar" size={14} color="#8a8a8a" />
                      <Text style={styles.bookingInfoMetaText}>{lastBooking.booking_date?.split('-').reverse().join('-')}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <MaterialCommunityIcons name="clock-outline" size={14} color="#8a8a8a" />
                      <Text style={styles.bookingInfoMetaText}>{lastBooking.booking_time?.substring(0, 5)}</Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.bookingInfo}>
                  <Text style={styles.bookingInfoLabel}>No recent service</Text>
                </View>
              )}

              {/* Rating */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>How was your experience?</Text>
                <View style={styles.ratingStars}>
                  {[1, 2, 3, 4, 5].map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[
                        styles.starButton,
                        rating === r && styles.starButtonActive,
                      ]}
                      onPress={() => setRating(r)}
                    >
                      <Text style={styles.starButtonText}>{r}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.ratingText}>
                  {rating === 1 && '😞 Poor'}
                  {rating === 2 && '😕 Fair'}
                  {rating === 3 && '😐 OK'}
                  {rating === 4 && '😊 Good'}
                  {rating === 5 && '😍 Excellent'}
                </Text>
              </View>

              {/* Review Text */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Your feedback</Text>
                <TextInput
                  value={review}
                  onChangeText={setReview}
                  multiline
                  numberOfLines={4}
                  style={styles.reviewInput}
                  contentStyle={{ paddingTop: 16 }}
                  mode="outlined"
                  outlineColor="#3a3a3a"
                  activeOutlineColor="#F59E0B"
                  textColor="#ffffff"
                  placeholderTextColor="#6a6a6a"
                  placeholder="Tell us about your experience..."
                  theme={{
                    colors: {
                      primary: '#F59E0B',
                      background: 'rgba(34, 37, 45, 0.65)',
                      surface: '#1A1D24',
                    },
                  }}
                />
              </View>

              {/* Submit Button */}
              <Button
                mode="contained"
                onPress={handleSubmitReview}
                style={styles.submitBtn}
                buttonColor="#F59E0B"
                textColor="#ffffff"
                labelStyle={styles.submitBtnLabel}
              >
                Submit Review
              </Button>

              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 13,
    color: '#8a8a8a',
    fontWeight: '400',
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: '900',
    color: '#F59E0B',
    fontStyle: 'italic',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(245, 158, 11, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerBadge: {
    backgroundColor: '#F59E0B',
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  logoImage: {
    width: 50,
    height: 50,
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  seeAll: {
    fontSize: 13,
    color: '#F59E0B',
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'rgba(34, 37, 45, 0.65)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionIcon: {
    // Icons now handled by MaterialCommunityIcons component
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  limitBadge: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FF5252',
    marginTop: 2,
  },
  appointmentCard: {
    backgroundColor: 'rgba(34, 37, 45, 0.65)',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  appointmentLeft: {
    flex: 1,
  },
  appointmentService: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  appointmentMeta: {
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appointmentMetaText: {
    fontSize: 12,
    color: '#b0b0b0',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  card: {
    backgroundColor: '#1A1D24',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
  },
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  serviceCard: {
    width: '48%',
    backgroundColor: 'rgba(34, 37, 45, 0.65)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  serviceCardPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 4,
  },
  serviceCardName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 4,
  },
  serviceCardDuration: {
    fontSize: 11,
    color: '#8a8a8a',
  },
  serviceItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(34, 37, 45, 0.65)',
    borderRadius: 20,
    padding: 14,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  serviceIcon: {
    fontSize: 28,
  },
  serviceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  servicePrice: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: 'rgba(34, 37, 45, 0.65)',
    borderRadius: 20,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 12,
    color: '#b0b0b0',
    marginBottom: 6,
    lineHeight: 18,
  },
  spacer: {
    height: 24,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A1D24',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  closeButton: {
    fontSize: 24,
    color: '#F59E0B',
    fontWeight: '600',
  },
  modalBody: {
    padding: 24,
  },
  bookingInfo: {
    backgroundColor: '#0F1115',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    marginBottom: 24,
  },
  bookingInfoLabel: {
    fontSize: 12,
    color: '#8a8a8a',
    fontWeight: '600',
    marginBottom: 4,
  },
  bookingInfoService: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
  },
  bookingInfoMeta: {
    gap: 8,
  },
  bookingInfoMetaText: {
    fontSize: 12,
    color: '#b0b0b0',
  },
  modalSection: {
    gap: 12,
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 8,
  },
  starButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#0F1115',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  starButtonActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  starButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  ratingText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  reviewInput: {
    backgroundColor: '#0F1115',
    borderRadius: 8,
    textAlignVertical: 'top',
  },
  submitBtn: {
    marginTop: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  submitBtnLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: '#8a8a8a',
    marginTop: 6,
  },
})
