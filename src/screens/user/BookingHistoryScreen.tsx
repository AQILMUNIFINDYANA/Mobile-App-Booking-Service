import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, FlatList, Text, TouchableOpacity, Modal, Alert, ActivityIndicator, RefreshControl } from 'react-native'
import { Button, TextInput } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNavigation } from '@react-navigation/native'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../services/supabaseClient'

interface Booking {
  id: string
  service_id: string
  user_id: string
  booking_date: string
  booking_time: string
  status: string
  notes?: string
  price?: number
  queue_number?: number
  order_number?: string
  vehicle_type?: string
  vehicle_brand?: string
  vehicle_plate?: string
  services?: { title: string; price: number; estimated_duration?: number }
  reviews?: { id: string; rating: number; review_text: string }[]
  created_at?: string
}

export const BookingHistoryScreen: React.FC = () => {
  const navigation = useNavigation<any>()
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [isViewOnly, setIsViewOnly] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [selectedDetailBooking, setSelectedDetailBooking] = useState<Booking | null>(null)
  const [rating, setRating] = useState(5)
  const [review, setReview] = useState('')
  const [reviewCount, setReviewCount] = useState(0)
  const [nextReviewTime, setNextReviewTime] = useState<string | null>(null)

  useEffect(() => {
    loadReviewCount()
    fetchBookings()

    if (!user?.id) return

    // Subscribe to real-time updates for this user's bookings
    const channel = supabase
      .channel(`bookings:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        (payload) => {
          // Verify if it belongs to the user, or if it's a delete (which might not have user_id in new_record)
          // For safety, just re-fetch whenever any booking changes. It's inexpensive enough.
          console.log('📬 Booking update received:', payload)
          fetchBookings()
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [user?.id])

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true)
    await fetchBookings()
    setRefreshing(false)
  }, [user?.id])

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
          user_id,
          booking_date,
          booking_time,
          status,
          notes,
          queue_number,
          order_number,
          vehicle_type,
          vehicle_brand,
          vehicle_plate,
          created_at,
          services(title, price, estimated_duration),
          reviews(id, rating, review_text)
        `)
        .eq('user_id', user.id)
        .order('booking_date', { ascending: false })

      if (error) throw error
      setBookings((data as any) || [])
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

  const handleOpenReview = (booking: Booking) => {
    setSelectedBooking(booking)

    if (booking.reviews && booking.reviews.length > 0) {
      setIsViewOnly(true)
      setRating(booking.reviews[0].rating)
      setReview(booking.reviews[0].review_text)
      setShowReviewModal(true)
      return
    }

    if (!canReview) {
      Alert.alert(
        'Review Limit Reached',
        `You can only submit 7 reviews per 24 hours.\n\nNext review available at: ${nextReviewTime}`,
        [{ text: 'OK' }]
      )
      return
    }

    setIsViewOnly(false)
    setRating(5)
    setReview('')
    setShowReviewModal(true)
  }

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
      
      // Reload review count and bookings to reflect the new review
      loadReviewCount()
      fetchBookings()
    } catch (error) {
      console.log('Error submitting review:', error)
      Alert.alert('Error', 'Failed to submit review')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return '#FF9800'
      case 'Confirmed':
        return '#2196F3'
      case 'In Progress':
        return '#4CAF50'
      case 'Completed':
        return '#8BC34A'
      case 'Cancelled':
        return '#F44336'
      default:
        return '#999999'
    }
  }

  const getDisplayStatus = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'Menunggu Konfirmasi'
      case 'Confirmed':
        return 'Dikonfirmasi'
      case 'In Progress':
        return 'Sedang Dikerjakan'
      case 'Completed':
        return 'Selesai'
      case 'Cancelled':
        return 'Dibatalkan'
      default:
        return status
    }
  }

  // Unused - keeping for reference
  // const getStatusIcon = (status: string) => {
  //   switch (status) {
  //     case 'Menunggu Konfirmasi':
  //       return '⏳'
  //     case 'Dikonfirmasi':
  //       return '✓'
  //     case 'Sedang Dikerjakan':
  //       return '⚙️'
  //     case 'Selesai':
  //       return '✓✓'
  //     case 'Dibatalkan':
  //       return '✕'
  //     default:
  //       return '◯'
  //   }
  // }

  const renderBooking = ({ item }: { item: Booking }) => {
    const serviceData = Array.isArray(item.services) ? item.services[0] : item.services;
    const serviceTitle = serviceData?.title || 'Service';
    const servicePrice = serviceData?.price || 0;

    return (
    <View style={styles.bookingCard}>
      <View style={styles.cardContent}>
        {/* Header with Service and Status */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.serviceName}>{serviceTitle}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${getStatusColor(item.status)}20` },
            ]}
          >
            <Text
              style={[styles.status, { color: getStatusColor(item.status) }]}
            >
              {getDisplayStatus(item.status)}
            </Text>
          </View>
        </View>

        {/* DateTime */}
        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="calendar" size={14} color="#8a8a8a" />
            <Text style={styles.infoLabel}>{item.booking_date?.split('-').reverse().join('-')}</Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="clock-outline" size={14} color="#8a8a8a" />
            <Text style={styles.infoLabel}>{item.booking_time?.substring(0, 5)}</Text>
          </View>
        </View>

        {/* Dibuat Pada */}
        {item.created_at && (
          <View style={[styles.infoSection, { marginTop: 0 }]}>
            <View style={[styles.infoItem, { width: '100%' }]}>
              <MaterialCommunityIcons name="clock-check-outline" size={14} color="#8a8a8a" />
              <Text style={styles.infoLabel}>
                Dipesan pada : {new Date(item.created_at).toLocaleString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
        )}

        {/* Notes */}
        {item.notes && (
          <View style={styles.notesSection}>
            <View style={styles.notesLabelContainer}>
              <MaterialCommunityIcons name="note-text-outline" size={14} color="#8a8a8a" />
              <Text style={styles.notesLabel}>Catatan</Text>
            </View>
            <Text style={styles.notesValue}>{item.notes}</Text>
          </View>
        )}

        {/* Footer - Price and Rating */}
        <View style={[styles.footer, { flexDirection: 'column', alignItems: 'stretch' }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={styles.priceLabel}>Total Harga</Text>
            <Text style={styles.price}>
              Rp {servicePrice.toLocaleString('id-ID')}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button
              mode="outlined"
              labelStyle={[styles.reviewButtonLabel, { color: '#F59E0B' }]}
              style={[styles.reviewButton, { flex: 1, backgroundColor: 'transparent', borderColor: '#F59E0B', borderWidth: 1 }]}
              onPress={() => {
                setSelectedDetailBooking(item)
                setShowDetailModal(true)
              }}
            >
              Detail
            </Button>
            {(item.status === 'Confirmed' || item.status === 'In Progress') && (
              <Button
                mode="contained"
                labelStyle={styles.reviewButtonLabel}
                style={[styles.reviewButton, { flex: 1, backgroundColor: '#4CAF50' }]}
                onPress={() => navigation.navigate('Chat')}
              >
                Chat Admin
              </Button>
            )}
            {item.status === 'Completed' && (
              <Button
                mode="contained"
                labelStyle={styles.reviewButtonLabel}
                style={[
                  styles.reviewButton,
                  { flex: 1 },
                  item.reviews && item.reviews.length > 0 ? { backgroundColor: '#666666' } : {}
                ]}
                onPress={() => handleOpenReview(item)}
              >
                {item.reviews && item.reviews.length > 0 ? 'Reviewed' : 'Review'}
              </Button>
            )}
          </View>
        </View>
      </View>
    </View>
  )}

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
      {/* Header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Booking History</Text>
        <Text style={styles.pageSubtitle}>Manage your service bookings</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F59E0B" />
        </View>
      ) : bookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="calendar-blank" size={50} color="#F59E0B" />
          <Text style={styles.emptyText}>No bookings yet</Text>
          <Text style={styles.emptySubtext}>Your booking history will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBooking}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#F59E0B']}
              tintColor="#F59E0B"
            />
          }
        />
      )}

      {/* Review Modal */}
      <Modal visible={showReviewModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Write Your Review</Text>
              <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <ScrollView style={styles.modalBody}>
              {/* Booking Info */}
               {selectedBooking && (
                 <View style={styles.bookingInfo}>
                   <Text style={styles.bookingInfoLabel}>Service</Text>
                   <Text style={styles.bookingInfoService}>
                    {selectedBooking.services?.title || 'Service'}
                   </Text>
                   <View style={styles.bookingInfoMeta}>
                     <View style={styles.metaItem}>
                       <MaterialCommunityIcons name="calendar" size={14} color="#8a8a8a" />
                        <Text style={styles.bookingInfoMetaText}>{selectedBooking.booking_date?.split('-').reverse().join('-')}</Text>
                     </View>
                     <View style={styles.metaItem}>
                       <MaterialCommunityIcons name="clock-outline" size={14} color="#8a8a8a" />
                        <Text style={styles.bookingInfoMetaText}>{selectedBooking.booking_time?.substring(0, 5)}</Text>
                     </View>
                   </View>
                 </View>
               )}

              {/* Rating */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Your Rating</Text>
                <View style={styles.ratingStars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      style={[
                        styles.starButton,
                        rating >= star && styles.starButtonActive,
                      ]}
                      onPress={() => !isViewOnly && setRating(star)}
                    >
                      <MaterialCommunityIcons 
                        name={rating >= star ? 'star' : 'star-outline'} 
                        size={20} 
                        color={rating >= star ? '#F59E0B' : '#666666'} 
                      />
                      <Text style={styles.starButtonText}>{star}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {rating > 0 && (
                  <Text style={styles.ratingText}>{rating} out of 5 stars</Text>
                )}
              </View>

              {/* Review Text */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Your Review</Text>
                <TextInput
                  mode="outlined"
                  multiline
                  numberOfLines={5}
                  placeholder="Share your experience..."
                  placeholderTextColor="#666"
                  value={review}
                  onChangeText={setReview}
                  editable={!isViewOnly}
                  style={styles.reviewInput}
                  contentStyle={{ paddingTop: 16 }}
                  outlineColor="#3a3a3a"
                  activeOutlineColor="#F59E0B"
                  textColor="#ffffff"
                />
              </View>

              {/* Submit Button */}
              {!isViewOnly && (
                <Button
                  mode="contained"
                  style={styles.submitBtn}
                  labelStyle={styles.submitBtnLabel}
                  onPress={handleSubmitReview}
                  buttonColor="#F59E0B"
                >
                  Submit Review
                </Button>
              )}

              <View style={{ height: 24 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Detail Modal */}
      <Modal visible={showDetailModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detail Pesanan</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#F59E0B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {selectedDetailBooking && (
                <>
                  <View style={[styles.bookingInfo, { borderColor: '#F59E0B', borderWidth: 1, backgroundColor: 'rgba(245, 158, 11, 0.05)' }]}>
                    <Text style={{ fontSize: 12, color: '#8a8a8a', marginBottom: 4 }}>Nomor Pesanan</Text>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: '#ffffff', marginBottom: 12 }}>
                      {selectedDetailBooking.order_number || 'Menunggu Konfirmasi'}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#8a8a8a', marginBottom: 4 }}>Nomor Antrian</Text>
                    <Text style={{ fontSize: 24, fontWeight: '700', color: '#F59E0B' }}>
                      {selectedDetailBooking.queue_number ? `#${selectedDetailBooking.queue_number}` : '-'}
                    </Text>
                  </View>
                  
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Informasi Layanan</Text>
                    <View style={{ gap: 8, marginTop: 8 }}>
                      <Text style={{ color: '#e0e0e0', fontSize: 14 }}>{selectedDetailBooking.services?.title || 'Service'}</Text>
                      <Text style={{ color: '#F59E0B', fontSize: 16, fontWeight: '700' }}>
                        Rp {(selectedDetailBooking.services?.price || 0).toLocaleString('id-ID')}
                      </Text>
                      {selectedDetailBooking.services?.estimated_duration && (
                        <Text style={{ color: '#e0e0e0', fontSize: 14 }}>
                          Estimasi : {selectedDetailBooking.services.estimated_duration} Menit
                        </Text>
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Waktu Booking</Text>
                    <View style={{ gap: 8, marginTop: 8 }}>
                      <Text style={{ color: '#e0e0e0', fontSize: 14 }}>Tanggal : {selectedDetailBooking.booking_date?.split('-').reverse().join('-')}</Text>
                      <Text style={{ color: '#e0e0e0', fontSize: 14 }}>Jam : {selectedDetailBooking.booking_time?.substring(0, 5)}</Text>
                      <Text style={{ color: '#F59E0B', fontSize: 12, fontStyle: 'italic', marginTop: 4 }}>
                        * Mohon datang 10 menit sebelum waktu booking agar tidak terlambat.
                      </Text>
                    </View>
                  </View>

                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#ffffff', marginBottom: 8 }}>Kendaraan</Text>
                    <Text style={{ color: '#e0e0e0', fontSize: 14 }}>Tipe : {selectedDetailBooking.vehicle_type || '-'}</Text>
                    <Text style={{ color: '#e0e0e0', fontSize: 14 }}>Merek : {selectedDetailBooking.vehicle_brand || '-'}</Text>
                    <Text style={{ color: '#e0e0e0', fontSize: 14 }}>Plat : {selectedDetailBooking.vehicle_plate || '-'}</Text>
                  </View>

                  {selectedDetailBooking.notes && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Catatan</Text>
                      <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: 12, borderRadius: 8, marginTop: 8 }}>
                        <Text style={{ color: '#e0e0e0', fontSize: 14 }}>{selectedDetailBooking.notes}</Text>
                      </View>
                    </View>
                  )}
                  
                  <View style={{ height: 24 }} />
                </>
              )}
            </ScrollView>
            
            {/* Action Button pinned at the bottom */}
            {selectedDetailBooking && (
              <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.05)' }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderColor: '#3B82F6',
                    borderWidth: 1,
                    borderRadius: 12,
                    padding: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8
                  }}
                  onPress={() => {
                    setShowDetailModal(false)
                    navigation.navigate('Chat', { prefillMessage: `Tolong cek pesanan saya dengan No. Pesanan: ${selectedDetailBooking.order_number || '-'}` })
                  }}
                >
                  <MaterialCommunityIcons name="chat-processing-outline" size={20} color="#3B82F6" />
                  <Text style={{ color: '#3B82F6', fontSize: 14, fontWeight: '600' }}>Tanya Admin tentang Pesanan ini</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
      </View>
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
  pageHeader: {
    backgroundColor: '#1A1D24',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
  },
  pageSubtitle: {
    fontSize: 13,
    color: 'rgba(224, 224, 224, 0.7)',
    marginTop: 4,
  },
  list: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
  },
  bookingCard: {
    backgroundColor: 'rgba(34, 37, 45, 0.65)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  vehicleTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  vehicleType: {
    fontSize: 12,
    color: '#b0b0b0',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  statusIcon: {
    fontSize: 12,
    lineHeight: 12,
  },
  status: {
    fontSize: 11,
    fontWeight: '700',
  },
  infoSection: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoLabel: {
    fontSize: 12,
    color: '#d0d0d0',
    fontWeight: '500',
  },
  notesSection: {
    backgroundColor: 'rgba(15, 17, 21, 0.5)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  notesLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8a8a8a',
  },
  notesValue: {
    fontSize: 12,
    color: '#b0b0b0',
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  priceLabel: {
    fontSize: 11,
    color: '#8a8a8a',
    fontWeight: '500',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F59E0B',
    marginTop: 4,
  },
  reviewButton: {
    borderRadius: 12,
    backgroundColor: '#F59E0B',
    minWidth: 100,
    justifyContent: 'center',
  },
  reviewButtonLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A1D24',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  modalTitle: {
    fontSize: 18,
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
    backgroundColor: 'rgba(34, 37, 45, 0.65)',
    borderRadius: 16,
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
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    paddingVertical: 12,
    backgroundColor: 'rgba(34, 37, 45, 0.65)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flexDirection: 'column',
  },
  starButtonActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#F59E0B',
  },
  starButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  ratingText: {
    fontSize: 13,
    color: '#F59E0B',
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 12,
  },
  reviewInput: {
    backgroundColor: 'rgba(34, 37, 45, 0.65)',
    borderRadius: 12,
    textAlignVertical: 'top',
  },
  submitBtn: {
    marginTop: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  submitBtnLabel: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  ratingButton: {
    borderRadius: 12,
    borderColor: '#F59E0B',
  },
  ratingButtonLabel: {
    fontSize: 11,
    fontWeight: '600',
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
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#8a8a8a',
    marginTop: 6,
  },
})
