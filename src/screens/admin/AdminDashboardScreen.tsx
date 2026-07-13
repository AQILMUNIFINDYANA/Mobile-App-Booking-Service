import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  Alert,
  TouchableOpacity,
  Modal,
  RefreshControl,
  Vibration,
  Animated,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Menu, TextInput } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as Notifications from 'expo-notifications'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../services/supabaseClient'
import { sendPushNotification } from '../../utils/notifications'
import { useRoute, useNavigation } from '@react-navigation/native'

// Force notification to show in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface AdminBooking {
  id: string
  users?: { name: string }
  user_id: string
  service_id: string
  booking_date: string
  booking_time: string
  status: string
  vehicle_brand?: string
  vehicle_plate?: string
  notes?: string
  queue_number?: number
  order_number?: string
  vehicle_type?: string
  services?: { title: string; estimated_duration?: number }
  created_at?: string
}

interface Service {
  id: string
  title: string
  description: string
  price: number
  estimated_duration: number
}

interface Review {
  id: string
  booking_id: string
  rating: number
  review_text?: string
  created_at: string
  bookings?: { users?: { name: string }; services?: { title: string } }
}



type TabType = 'overview' | 'bookings' | 'services' | 'reviews'

export const AdminDashboardScreen: React.FC = () => {
  const route = useRoute<any>()
  const navigation = useNavigation<any>()
  const { logout } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [menuVisible, setMenuVisible] = useState<{ [key: string]: boolean }>({})
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedDetailBooking, setSelectedDetailBooking] = useState<AdminBooking | null>(null)
  const stats = {
    totalBookings: bookings.length,
    pendingBookings: bookings.filter((b) => b.status === 'Pending').length,
    completedBookings: bookings.filter((b) => b.status === 'Completed').length,
    totalServices: services.length,
  }
  const [loading, setLoading] = useState(true)
  const [highlightedBookingId, setHighlightedBookingId] = useState<string | null>(null)
  const [pendingScrollIndex, setPendingScrollIndex] = useState<number | null>(null)
  const scrollViewRef = useRef<ScrollView>(null)
  const pulseAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (route.params?.orderNumberToOpen && bookings.length > 0) {
      const searchOrder = route.params.orderNumberToOpen.toUpperCase();
      const orderToOpen = bookings.find(b => b.order_number?.toUpperCase() === searchOrder)
      if (orderToOpen) {
        setActiveTab('bookings')
        setHighlightedBookingId(orderToOpen.id)
        
        const index = bookings.findIndex(b => b.order_number?.toUpperCase() === searchOrder)
        if (index !== -1) {
          setPendingScrollIndex(index)
        }

        setSelectedDetailBooking(orderToOpen)
        setShowDetailModal(true)
        navigation.setParams({ orderNumberToOpen: undefined })
      }
    }
  }, [route.params?.orderNumberToOpen, bookings])

  const itemLayouts = useRef<{ [key: string]: number }>({})

  useEffect(() => {
    if (pendingScrollIndex !== null && activeTab === 'bookings') {
      const timer = setTimeout(() => {
        const bookingId = bookings[pendingScrollIndex]?.id;
        const itemY = (bookingId && itemLayouts.current[bookingId] !== undefined) 
          ? itemLayouts.current[bookingId] 
          : pendingScrollIndex * 220;
        
        scrollViewRef.current?.scrollTo({ 
          y: Math.max(0, itemY - 150), 
          animated: true 
        })
        setPendingScrollIndex(null)
      }, 800)
      return () => clearTimeout(timer)
    }
    return undefined;
  }, [pendingScrollIndex, activeTab, bookings])

  useEffect(() => {
    if (highlightedBookingId) {
      pulseAnim.setValue(0);
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: true,
          })
        ])
      );
      animation.start();

      return () => {
        animation.stop();
      };
    }
    return undefined;
  }, [highlightedBookingId]);

  useEffect(() => {
    fetchDashboardData()

    // Subscribe to realtime updates for bookings
    const bookingsSubscription = supabase
      .channel('admin-bookings-updates')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'bookings',
        },
        (payload) => {
          console.log('Realtime update received for bookings in AdminDashboard', payload.eventType)
          fetchDashboardData()
          
          if (payload.eventType === 'INSERT') {
            Vibration.vibrate([0, 500, 200, 500])
            
            // Trigger system tray notification
            Notifications.scheduleNotificationAsync({
              content: {
                title: 'Pesanan Masuk Baru!',
                body: 'Ada pelanggan yang baru saja membuat pesanan!',
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
              },
              trigger: null,
            }).catch(console.error);
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(bookingsSubscription)
    }
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [bookingsData, servicesDataResult, reviewsData] = await Promise.all([
        supabase
          .from('bookings')
          .select('id, user_id, service_id, booking_date, booking_time, status, vehicle_brand, vehicle_plate, notes, queue_number, order_number, vehicle_type, created_at, users(name), services(title, estimated_duration)')
          .order('created_at', { ascending: false }),
        supabase
          .from('services')
          .select('id, title, description, price, estimated_duration'),
        supabase
          .from('reviews')
          .select('id, booking_id, rating, review_text, created_at, bookings(users(name), services(title))')
          .order('created_at', { ascending: false }),
      ])

      if (bookingsData.error) throw bookingsData.error
      
      let servicesData = servicesDataResult

      // Handle missing estimated_duration column
      if (servicesData.error && servicesData.error.code === '42703') {
        const fallbackResult = await supabase
          .from('services')
          .select('id, title, description, price')
        if (fallbackResult.error) throw fallbackResult.error
        servicesData = {
          data: (fallbackResult.data || []).map((item: any) => ({ ...item, estimated_duration: 0 })),
          error: null,
        } as any
      } else if (servicesData.error) {
        throw servicesData.error
      }

      const bookingsList = (bookingsData.data || []) as any as AdminBooking[]
      const servicesList = (servicesData.data || []) as Service[]
      let reviewsList = (reviewsData.data || []) as Review[]

      // Clean up any duplicate reviews (keep only the latest one per booking)
      const seenBookings = new Set()
      const uniqueReviews: Review[] = []
      
      for (const review of reviewsList) {
        if (seenBookings.has(review.booking_id)) {
          // Delete duplicate from DB silently
          supabase.from('reviews').delete().eq('id', review.id).then()
        } else {
          seenBookings.add(review.booking_id)
          uniqueReviews.push(review)
        }
      }
      reviewsList = uniqueReviews

      setBookings(bookingsList)
      setServices(servicesList)
      setReviews(reviewsList)

      // Stats are now derived automatically from state
    } catch (error) {
      console.log('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const [showServiceModal, setShowServiceModal] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [newService, setNewService] = useState<Service>({
    id: '',
    title: '',
    description: '',
    price: 0,
    estimated_duration: 0,
  })
  const [deleteServiceId, setDeleteServiceId] = useState<string | null>(null)

  const statuses = ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled']

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const handleLogout = () => {
    console.log('🚪 Logout button clicked')
    setShowLogoutConfirm(true)
  }

  const confirmLogout = async () => {
    try {
      console.log('🔄 Admin logout...')
      setShowLogoutConfirm(false)
      await logout()
      console.log('✅ Admin logout successful')
    } catch (error) {
      console.log('❌ Admin logout error:', error)
      setShowLogoutConfirm(false)
    }
  }

  const updateStatus = async (bookingId: string, newStatus: string) => {
    try {
      // Find the current booking to check its status
      const currentBooking = bookings.find((b) => b.id === bookingId)
      if (!currentBooking) {
        Alert.alert('Error', 'Booking not found')
        return
      }

      // Prevent status changes if already completed or cancelled
      if (currentBooking.status === 'Completed' || currentBooking.status === 'Cancelled') {
        Alert.alert('Cannot Update', `Status cannot be changed from ${currentBooking.status}`)
        setMenuVisible({ ...menuVisible, [bookingId]: false })
        return
      }

      let updatePayload: any = { status: newStatus }

      if (newStatus === 'Confirmed' && !currentBooking.order_number) {
        const { data: maxQueueData } = await supabase
          .from('bookings')
          .select('queue_number')
          .eq('booking_date', currentBooking.booking_date)
          .not('order_number', 'is', null)
          .order('queue_number', { ascending: false })
          .limit(1)

        const maxQueue = maxQueueData && maxQueueData.length > 0 ? maxQueueData[0].queue_number : 0;
        const queueNumber = maxQueue + 1;
        const dateStr = currentBooking.booking_date.replace(/-/g, '')
        const orderNumber = `ORD-${dateStr}-${queueNumber.toString().padStart(3, '0')}`

        updatePayload.queue_number = queueNumber
        updatePayload.order_number = orderNumber
      }

      const { error } = await supabase
        .from('bookings')
        .update(updatePayload)
        .eq('id', bookingId)

      if (error) throw error

      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, ...updatePayload } : b
        )
      )
      setMenuVisible({ ...menuVisible, [bookingId]: false })
      Alert.alert('Success', `Status updated to ${newStatus}`)

      // Notify User
      try {
        const { data: userTokens } = await supabase
          .from('users')
          .select('push_token')
          .eq('id', currentBooking.user_id)
          .single()
          
        if (userTokens?.push_token) {
          const notificationBody = newStatus === 'Completed' 
            ? 'Service kendaraan Anda sudah selesai dikerjakan. Silakan ambil kendaraan Anda.' 
            : `Pesanan servis kendaraan Anda sekarang berstatus ${newStatus}`;

          sendPushNotification(
            userTokens.push_token,
            'Update Status Pesanan',
            notificationBody
          );
        }
      } catch (notifyError) {
        console.log('Error sending notification:', notifyError)
      }
    } catch (error: any) {
      console.log('Error updating booking status:', error)
      Alert.alert('Error', `Failed to update status: ${error.message || JSON.stringify(error)}`)
    }
  }

  const confirmDeleteBooking = (bookingId: string) => {
    Alert.alert(
      'Delete Booking',
      'Are you sure you want to delete this booking? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteBooking(bookingId) }
      ]
    )
  }

  const deleteBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId)

      if (error) throw error

      setBookings((prev) => prev.filter((b) => b.id !== bookingId))
      Alert.alert('Success', 'Booking deleted successfully')
    } catch (error: any) {
      console.log('Error deleting booking:', error)
      Alert.alert('Error', `Failed to delete booking: ${error.message || JSON.stringify(error)}`)
    }
  }

  // Service add/edit functionality disabled - loading real data from Supabase
  // const handleAddService = () => {
  //   if (!newService.title || !newService.price || !newService.estimated_duration) {
  //     Alert.alert('Error', 'Please fill all fields')
  //     return
  //   }
  //
  //   if (editingService) {
  //     setServices((prev) =>
  //       prev.map((s) => (s.id === editingService.id ? newService : s))
  //     )
  //     Alert.alert('Success', 'Service updated')
  //   } else {
  //     const service = {
  //       ...newService,
  //       id: Date.now().toString(),
  //     }
  //     setServices((prev) => [...prev, service])
  //     Alert.alert('Success', 'Service added')
  //   }
  //
  //   setShowServiceModal(false)
  //   setNewService({
  //     id: '',
  //     title: '',
  //     description: '',
  //     price: 0,
  //     estimated_duration: 0,
  //   })
  //   setEditingService(null)
  // }

  const handleAddService = async () => {
    if (!newService.title || !newService.description || !newService.price || !newService.estimated_duration) {
      Alert.alert('Error', 'Please fill all fields')
      return
    }

    try {
      if (editingService) {
        // Update existing service
        const { error } = await supabase
          .from('services')
          .update({
            title: newService.title,
            description: newService.description,
            price: newService.price,
            estimated_duration: newService.estimated_duration,
          })
          .eq('id', editingService.id)

        if (error) throw error

        setServices((prev) =>
          prev.map((s) => (s.id === editingService.id ? newService : s))
        )
        Alert.alert('Success', 'Service updated')
      } else {
        // Add new service
        const { data, error } = await supabase
          .from('services')
          .insert({
            title: newService.title,
            description: newService.description,
            price: newService.price,
            estimated_duration: newService.estimated_duration,
          })
          .select()

        if (error) throw error

        if (data && data.length > 0) {
          setServices((prev) => [...prev, data[0]])
          Alert.alert('Success', 'Service added')
        }
      }

      setShowServiceModal(false)
      setNewService({
        id: '',
        title: '',
        description: '',
        price: 0,
        estimated_duration: 0,
      })
      setEditingService(null)
    } catch (error) {
      console.log('Error saving service:', error)
      Alert.alert('Error', 'Failed to save service')
    }
  }

  const handleEditService = (service: Service) => {
    setEditingService(service)
    setNewService(service)
    setShowServiceModal(true)
  }

  const handleDeleteService = (serviceId: string) => {
    console.log('🗑️ Delete button clicked for service:', serviceId)
    setDeleteServiceId(serviceId)
  }

  const confirmDeleteService = async () => {
    if (!deleteServiceId) return

    console.log('🗑️ Delete confirmed for service:', deleteServiceId)
    try {
      console.log('📡 Sending delete request to Supabase for service:', deleteServiceId)
      const { data, error, status } = await supabase
        .from('services')
        .delete()
        .eq('id', deleteServiceId)
        .select()

      console.log('📡 Delete response:', { status, data, error })

      if (error) {
        console.log('❌ Delete error:', error)
        Alert.alert('Error', error.message || 'Failed to delete service')
        setDeleteServiceId(null)
        return
      }

      console.log('✅ Service deleted successfully from DB')
      setServices((prev) => {
        const updated = prev.filter((s) => s.id !== deleteServiceId)
        console.log('Updated services list, removed:', deleteServiceId)
        return updated
      })
      Alert.alert('Success', 'Service deleted')
      setDeleteServiceId(null)
    } catch (error: any) {
      console.log('❌ Exception during delete:', error?.message, error)
      Alert.alert('Error', error?.message || 'Failed to delete service')
      setDeleteServiceId(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return '#FF9800'
      case 'Confirmed': return '#2196F3'
      case 'In Progress': return '#4CAF50'
      case 'Completed': return '#8BC34A'
      case 'Cancelled': return '#F44336'
      default: return '#999'
    }
  }



  const renderBooking = ({ item }: { item: AdminBooking }) => {
    const isHighlighted = highlightedBookingId && highlightedBookingId === item.id;
    
    return (
    <View 
      style={styles.bookingCard}
      onLayout={(e) => {
        itemLayouts.current[item.id] = e.nativeEvent.layout.y;
      }}
    >
      {/* Absolute precise glow overlay */}
      {isHighlighted && (
        <Animated.View 
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            {
              top: -1, left: -1, right: -1, bottom: -1,
              borderRadius: 20,
              borderWidth: 2,
              borderColor: '#F59E0B',
              backgroundColor: 'rgba(245, 158, 11, 0.08)',
              opacity: pulseAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 1]
              })
            }
          ]}
        />
      )}
      <View style={styles.cardInner}>
        {/* Top Row: User + Status */}
        <View style={styles.topRow}>
          <View style={styles.userSection}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.userName}>{item.users?.name || 'Unknown'}</Text>
              {item.status === 'Pending' && (
                <View style={{ backgroundColor: '#EF4444', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ color: 'white', fontSize: 9, fontWeight: 'bold' }}>BARU</Text>
                </View>
              )}
            </View>
            <Text style={styles.serviceText}>{item.services?.title || 'Service'}</Text>
          </View>
          <View
            style={[
              styles.statusPill,
              { backgroundColor: `${getStatusColor(item.status)}20` },
            ]}
          >
            <Text style={[styles.statusLabel, { color: getStatusColor(item.status) }]}>
              {item.status}
            </Text>
          </View>
        </View>

        {/* Middle Row: Details */}
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="calendar" size={16} color="#F59E0B" />
            <Text style={styles.detail}>{item.booking_date ? item.booking_date.split('-').reverse().join('-') : '-'}</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="clock-outline" size={16} color="#F59E0B" />
            <Text style={styles.detail}>{item.booking_time ? item.booking_time.substring(0, 5) : '-'}</Text>
          </View>
        </View>

        {/* Dibuat Pada */}
        {item.created_at && (
          <View style={[styles.detailsRow, { marginTop: 8 }]}>
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="clock-check-outline" size={16} color="#8a8a8a" />
              <Text style={[styles.detail, { color: '#8a8a8a', fontSize: 11 }]}>
                Dipesan pada : {new Date(item.created_at).toLocaleString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
        )}

        {/* Vehicle Details */}
        {(item.vehicle_brand || item.vehicle_plate) && (
          <View style={[styles.detailsRow, { marginTop: 2, marginBottom: 0 }]}>
            <View style={[styles.detailItem, { flex: 1 }]}>
              <View style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', padding: 6, borderRadius: 8 }}>
                <MaterialCommunityIcons name="motorbike" size={16} color="#3B82F6" />
              </View>
              <Text style={[styles.detail, { color: '#e0e0e0', fontWeight: '500', marginLeft: 6 }]}>
                {item.vehicle_brand || 'Unknown'} <Text style={{ color: '#8a8a8a' }}>•</Text> {item.vehicle_plate || 'No Plate'}
              </Text>
            </View>
          </View>
        )}
        
        {/* Notes */}
        {item.notes && (
          <View style={[styles.detailsRow, { marginTop: 4, marginBottom: 0 }]}>
            <View style={[styles.detailItem, { flex: 1, alignItems: 'flex-start' }]}>
              <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: 6, borderRadius: 8 }}>
                <MaterialCommunityIcons name="text-box-outline" size={16} color="#10B981" />
              </View>
              <Text style={[styles.detail, { color: '#d1d5db', lineHeight: 20, fontStyle: 'italic', marginLeft: 6, flex: 1, paddingTop: 4 }]}>
                "{item.notes}"
              </Text>
            </View>
          </View>
        )}

        {/* Bottom Row: Status Button and Delete */}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16, height: 40 }}>
          <View style={{ flex: 1, flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              style={[styles.statusChangeBtn, { flex: 1, height: '100%', justifyContent: 'center', paddingVertical: 0, backgroundColor: 'transparent', borderColor: '#F59E0B', borderWidth: 1 }]}
              onPress={() => {
                setSelectedDetailBooking(item)
                setShowDetailModal(true)
              }}
            >
              <Text style={styles.statusChangeBtnText}>Detail</Text>
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              {item.status !== 'Completed' && item.status !== 'Cancelled' ? (
                <Menu
                visible={menuVisible[item.id] || false}
                onDismiss={() => setMenuVisible({ ...menuVisible, [item.id]: false })}
                contentStyle={{ backgroundColor: '#1A1D24', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' }}
                anchor={
                  <TouchableOpacity
                    style={[styles.statusChangeBtn, { height: '100%', justifyContent: 'center', paddingVertical: 0 }]}
                    onPress={() => setMenuVisible({ ...menuVisible, [item.id]: true })}
                  >
                    <Text style={styles.statusChangeBtnText}>Status</Text>
                  </TouchableOpacity>
                }
              >
                {statuses.map((status) => (
                  <Menu.Item
                    key={status}
                    onPress={() => updateStatus(item.id, status)}
                    title={status}
                    titleStyle={{ color: getStatusColor(status), fontWeight: '600' }}
                  />
                ))}
              </Menu>
              ) : (
                <View style={[styles.statusChangeBtn, { height: '100%', justifyContent: 'center', paddingVertical: 0, opacity: 0.5 }]}>
                  <Text style={[styles.statusChangeBtnText, { color: '#999' }]}>Locked</Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity 
            style={[styles.statusChangeBtn, { width: 40, height: '100%', paddingHorizontal: 0, paddingVertical: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(244, 67, 54, 0.1)' }]} 
            onPress={() => confirmDeleteBooking(item.id)}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={20} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
    )
  }

  const renderService = ({ item }: { item: Service }) => (
    <View style={styles.serviceCard}>
      <View style={styles.cardInner}>
        <View style={styles.serviceTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.serviceName}>{item.title}</Text>
            <Text style={styles.serviceDescription}>{item.description}</Text>
          </View>
        </View>

        <View style={styles.serviceMeta}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>💰 Price</Text>
            <Text style={styles.metaValue}>Rp {item.price.toLocaleString('id-ID')}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>⏱️ Duration</Text>
            <Text style={styles.metaValue}>{item.estimated_duration} min</Text>
          </View>
        </View>

        <View style={styles.serviceActions}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => handleEditService(item)}
          >
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDeleteService(item.id)}
          >
            <Text style={styles.deleteBtnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )

  const renderReview = ({ item }: { item: Review }) => {
    const handlePressReview = () => {
      const relatedBooking = bookings.find(b => b.id === item.booking_id)
      if (relatedBooking) {
        setActiveTab('bookings')
        setHighlightedBookingId(relatedBooking.id)
        
        const index = bookings.findIndex(b => b.id === relatedBooking.id)
        if (index !== -1) {
          setPendingScrollIndex(index)
        }
      }
    }

    return (
      <TouchableOpacity 
        style={styles.bookingCard}
        activeOpacity={0.7}
        onPress={handlePressReview}
      >
        <View style={styles.cardInner}>
          <View style={styles.topRow}>
            <View style={styles.userSection}>
              <Text style={styles.userName}>
                {item.bookings?.users?.name || 'Unknown User'}
              </Text>
              <Text style={styles.serviceText}>
                {item.bookings?.services?.title || 'Service'}
              </Text>
            </View>
            <View style={styles.ratingContainer}>
              <MaterialCommunityIcons name="star" size={20} color="#FFD700" />
              <Text style={styles.ratingText}>{item.rating}/5</Text>
            </View>
          </View>

          {item.review_text && (
            <View style={styles.reviewTextContainer}>
              <Text style={styles.reviewText}>{item.review_text}</Text>
            </View>
          )}

          <View style={styles.detailsRow}>
            <MaterialCommunityIcons name="calendar" size={16} color="#F59E0B" />
            <Text style={styles.detail}>
              {new Date(item.created_at).toLocaleDateString('id-ID')}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Admin Control</Text>
            <Text style={styles.headerSubtitle}>Manage workshop operations</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabBar}>
        {(['overview', 'bookings', 'services', 'reviews'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
            onPress={() => setActiveTab(tab)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 24, gap: 6 }}>
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === tab && styles.activeTabButtonText,
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
              {tab === 'bookings' && stats.pendingBookings > 0 && (
                <View style={{ backgroundColor: '#EF4444', borderRadius: 12, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6, shadowColor: '#EF4444', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 3, elevation: 4 }}>
                  <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '900', includeFontPadding: false, textAlign: 'center', lineHeight: 14 }}>
                    {stats.pendingBookings}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.content}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => setHighlightedBookingId(null)}
        onTouchStart={() => setHighlightedBookingId(null)}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchDashboardData}
            tintColor="#F59E0B"
            colors={['#F59E0B']}
          />
        }
      >
        {activeTab === 'overview' && (
          <View style={styles.section}>
            {/* Welcome Card */}
            <View style={styles.welcomeCard}>
              <View>
                <Text style={styles.welcomeTitle}>Welcome Back! 👋</Text>
                <Text style={styles.welcomeSubtitle}>Workshop Admin Dashboard</Text>
              </View>
              <Text style={styles.welcomeTime}>Today's Overview</Text>
            </View>

            {/* Main Stats Grid */}
            <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>Key Metrics</Text>
            <View style={styles.statsGrid}>
              <View style={[styles.statCardLarge, { backgroundColor: '#1A1D24', borderColor: 'rgba(255, 255, 255, 0.05)' }]}>
                <MaterialCommunityIcons name="calendar-range" size={32} color="#F59E0B" />
                <Text style={styles.statCardLabel}>Total Bookings</Text>
                <Text style={[styles.statCardValueLarge, { color: '#F59E0B' }]}>{stats.totalBookings}</Text>
              </View>
              <View style={[styles.statCardLarge, { backgroundColor: '#1A1D24', borderColor: 'rgba(255, 255, 255, 0.05)' }]}>
                <MaterialCommunityIcons name="clock-check-outline" size={32} color="#F59E0B" />
                <Text style={styles.statCardLabel}>Pending Review</Text>
                <Text style={[styles.statCardValueLarge, { color: '#F59E0B' }]}>{stats.pendingBookings}</Text>
              </View>
              <View style={[styles.statCardLarge, { backgroundColor: '#1A1D24', borderColor: 'rgba(255, 255, 255, 0.05)' }]}>
                <MaterialCommunityIcons name="check-circle-outline" size={32} color="#F59E0B" />
                <Text style={styles.statCardLabel}>Completed</Text>
                <Text style={[styles.statCardValueLarge, { color: '#F59E0B' }]}>{stats.completedBookings}</Text>
              </View>
              <View style={[styles.statCardLarge, { backgroundColor: '#1A1D24', borderColor: 'rgba(255, 255, 255, 0.05)' }]}>
                <MaterialCommunityIcons name="wrench" size={32} color="#F59E0B" />
                <Text style={styles.statCardLabel}>Services</Text>
                <Text style={[styles.statCardValueLarge, { color: '#F59E0B' }]}>{stats.totalServices}</Text>
              </View>
            </View>

            {/* Progress Section */}
            <View style={styles.progressSection}>
              <View style={styles.progressCard}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressTitle}>Booking Progress</Text>
                  <Text style={styles.progressPercent}>
                    {stats.totalBookings > 0 ? Math.round((stats.completedBookings / stats.totalBookings) * 100) : 0}%
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${stats.totalBookings > 0 ? (stats.completedBookings / stats.totalBookings) * 100 : 0}%`,
                      },
                    ]}
                  />
                </View>
                <View style={styles.progressStats}>
                  <View style={styles.progressStat}>
                    <Text style={styles.progressStatLabel}>Completed</Text>
                    <Text style={styles.progressStatValue}>{stats.completedBookings}</Text>
                  </View>
                  <View style={styles.progressDivider} />
                  <View style={styles.progressStat}>
                    <Text style={styles.progressStatLabel}>Remaining</Text>
                    <Text style={styles.progressStatValue}>
                      {stats.totalBookings - stats.completedBookings}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Quick Stats */}
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Quick Overview</Text>
            <View style={styles.quickStatsContainer}>
              <TouchableOpacity
                style={styles.quickStatItem}
                onPress={() => {
                  console.log('Active Bookings clicked')
                  setActiveTab('bookings')
                }}
              >
                <View style={styles.quickStatIconBox}>
                  <MaterialCommunityIcons name="lightning-bolt" size={24} color="#F59E0B" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.quickStatTitle}>Active Bookings</Text>
                  <Text style={styles.quickStatValue}>
                    {bookings.filter((b) => b.status === 'In Progress' || b.status === 'Confirmed').length}
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#F59E0B" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickStatItem}
                onPress={() => {
                  console.log('Need Attention clicked')
                  setActiveTab('bookings')
                }}
              >
                <View style={[styles.quickStatIconBox, { backgroundColor: '#fff3e0' }]}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#FF9800" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.quickStatTitle}>Need Attention</Text>
                  <Text style={styles.quickStatValue}>{stats.pendingBookings}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#FF9800" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickStatItem}
                onPress={() => {
                  console.log('Avg. Rating clicked')
                  setActiveTab('reviews')
                }}
              >
                <View style={[styles.quickStatIconBox, { backgroundColor: '#e8f5e9' }]}>
                  <MaterialCommunityIcons name="star" size={24} color="#4CAF50" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.quickStatTitle}>Avg. Rating</Text>
                  <Text style={styles.quickStatValue}>
                    {reviews.length > 0 
                      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                      : '0.0'}
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#4CAF50" />
              </TouchableOpacity>
            </View>

            {/* Recent Bookings */}
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Latest Bookings</Text>
            <View style={styles.listContainer}>
              {bookings.slice(0, 3).map((item) => (
                <React.Fragment key={item.id}>
                  {renderBooking({ item })}
                </React.Fragment>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'bookings' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>All Bookings ({bookings.length})</Text>
            <View style={styles.listContainer}>
              {bookings.map((item) => (
                <React.Fragment key={item.id}>
                  {renderBooking({ item })}
                </React.Fragment>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'services' && (
          <View style={styles.section}>
            <View style={styles.serviceHeader}>
              <Text style={styles.sectionTitle}>Service Catalog</Text>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => {
                  setEditingService(null)
                  setNewService({
                    id: '',
                    title: '',
                    description: '',
                    price: 0,
                    estimated_duration: 0,
                  })
                  setShowServiceModal(true)
                }}
              >
                <Text style={styles.addBtnText}>+ Add Service</Text>
              </TouchableOpacity>
            </View>
            {services.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No services available</Text>
              </View>
            ) : (
            <View style={styles.listContainer}>
              {services.map((item) => (
                <React.Fragment key={item.id}>
                  {renderService({ item })}
                </React.Fragment>
              ))}
            </View>
            )}
          </View>
        )}

        {activeTab === 'reviews' && (
          <View style={styles.section}>
            <View style={styles.serviceHeader}>
              <Text style={styles.sectionTitle}>Customer Reviews</Text>
              <View style={styles.avgRatingBadge}>
                <MaterialCommunityIcons name="star" size={18} color="#FFD700" />
                <Text style={styles.avgRatingText}>
                  {reviews.length > 0 
                    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                    : '0'}
                </Text>
              </View>
            </View>
            {reviews.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No reviews yet</Text>
              </View>
            ) : (
            <View style={styles.listContainer}>
              {reviews.map((item) => (
                <React.Fragment key={item.id}>
                  {renderReview({ item })}
                </React.Fragment>
              ))}
            </View>
            )}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Service Modal */}
      <Modal visible={showServiceModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.dragIndicator} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingService ? 'Edit Service' : 'Add New Service'}
              </Text>
              <TouchableOpacity onPress={() => setShowServiceModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <TextInput
                label="Service Name"
                value={newService.title}
                onChangeText={(text) => setNewService({ ...newService, title: text })}
                mode="outlined"
                outlineColor="rgba(255, 255, 255, 0.15)"
                activeOutlineColor="#F59E0B"
                textColor="#ffffff"
                style={[styles.input, { backgroundColor: '#16191E' }]}
                theme={{ colors: { onSurfaceVariant: '#999999' }, roundness: 12 }}
              />

              <TextInput
                label="Description"
                value={newService.description}
                onChangeText={(text) => setNewService({ ...newService, description: text })}
                mode="outlined"
                outlineColor="rgba(255, 255, 255, 0.15)"
                activeOutlineColor="#F59E0B"
                textColor="#ffffff"
                multiline
                numberOfLines={3}
                style={[styles.input, { marginTop: 12, backgroundColor: '#16191E' }]}
                theme={{ colors: { onSurfaceVariant: '#999999' }, roundness: 12 }}
              />

              <TextInput
                label="Price (Rp)"
                value={newService.price.toString()}
                onChangeText={(text) =>
                  setNewService({ ...newService, price: parseInt(text) || 0 })
                }
                keyboardType="numeric"
                mode="outlined"
                outlineColor="rgba(255, 255, 255, 0.15)"
                activeOutlineColor="#F59E0B"
                textColor="#ffffff"
                style={[styles.input, { marginTop: 12, backgroundColor: '#16191E' }]}
                theme={{ colors: { onSurfaceVariant: '#999999' }, roundness: 12 }}
              />

              <TextInput
                label="Duration (minutes)"
                value={newService.estimated_duration.toString()}
                onChangeText={(text) =>
                  setNewService({ ...newService, estimated_duration: parseInt(text) || 0 })
                }
                keyboardType="numeric"
                mode="outlined"
                outlineColor="rgba(255, 255, 255, 0.15)"
                activeOutlineColor="#F59E0B"
                textColor="#ffffff"
                style={[styles.input, { marginTop: 12, marginBottom: 24, backgroundColor: '#16191E' }]}
                theme={{ colors: { onSurfaceVariant: '#999999' }, roundness: 12 }}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowServiceModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleAddService}>
                <Text style={styles.submitBtnText}>
                  {editingService ? 'Update' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Service Confirmation Modal */}
      <Modal visible={deleteServiceId !== null} transparent={true} animationType="fade">
        <View style={styles.centerModalOverlay}>
          <View style={styles.logoutModalContent}>
            <Text style={styles.logoutModalTitle}>Delete Service</Text>
            <Text style={styles.logoutModalMessage}>
              Are you sure you want to delete this service?
            </Text>

            <View style={styles.logoutModalButtons}>
              <TouchableOpacity
                style={styles.logoutCancelButton}
                onPress={() => setDeleteServiceId(null)}
              >
                <Text style={styles.logoutCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.logoutConfirmButton, { backgroundColor: '#F44336' }]}
                onPress={confirmDeleteService}
              >
                <Text style={styles.logoutConfirmButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal visible={showLogoutConfirm} transparent={true} animationType="fade">
        <View style={styles.centerModalOverlay}>
          <View style={styles.logoutModalContent}>
            <Text style={styles.logoutModalTitle}>Logout</Text>
            <Text style={styles.logoutModalMessage}>
              Are you sure you want to logout?
            </Text>

            <View style={styles.logoutModalButtons}>
              <TouchableOpacity
                style={styles.logoutCancelButton}
                onPress={() => setShowLogoutConfirm(false)}
              >
                <Text style={styles.logoutCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.logoutConfirmButton}
                onPress={confirmLogout}
              >
                <Text style={styles.logoutConfirmButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Detail Modal */}
      <Modal visible={showDetailModal} transparent={true} animationType="fade">
        <View style={styles.centerModalOverlay}>
          <View style={[styles.logoutModalContent, { width: '90%', maxWidth: 400 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={styles.logoutModalTitle}>Detail Pesanan</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#F59E0B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator={false}>
              {selectedDetailBooking && (
                <>
                  <View style={{ borderColor: '#F59E0B', borderWidth: 1, backgroundColor: 'rgba(245, 158, 11, 0.05)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                    <Text style={{ fontSize: 12, color: '#8a8a8a', marginBottom: 4 }}>Nomor Pesanan</Text>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: '#ffffff', marginBottom: 12 }}>
                      {selectedDetailBooking.order_number || 'Menunggu Konfirmasi'}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#8a8a8a', marginBottom: 4 }}>Nomor Antrian</Text>
                    <Text style={{ fontSize: 24, fontWeight: '700', color: '#F59E0B' }}>
                      {selectedDetailBooking.queue_number ? `#${selectedDetailBooking.queue_number}` : '-'}
                    </Text>
                  </View>
                  
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#ffffff', marginBottom: 8 }}>Pelanggan</Text>
                    <Text style={{ color: '#e0e0e0', fontSize: 14 }}>{selectedDetailBooking.users?.name || 'Unknown'}</Text>
                  </View>

                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#ffffff', marginBottom: 8 }}>Informasi Layanan</Text>
                    <Text style={{ color: '#e0e0e0', fontSize: 14 }}>{selectedDetailBooking.services?.title || 'Service'}</Text>
                    {selectedDetailBooking.services?.estimated_duration && (
                      <Text style={{ color: '#e0e0e0', fontSize: 14, marginTop: 4 }}>
                        Estimasi : {selectedDetailBooking.services.estimated_duration} Menit
                      </Text>
                    )}
                  </View>
                  
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#ffffff', marginBottom: 8 }}>Waktu Booking</Text>
                    <View style={{ gap: 8, marginTop: 8 }}>
                      <Text style={{ color: '#e0e0e0', fontSize: 14 }}>Tanggal : {selectedDetailBooking.booking_date ? selectedDetailBooking.booking_date.split('-').reverse().join('-') : '-'}</Text>
                      <Text style={{ color: '#e0e0e0', fontSize: 14 }}>Jam : {selectedDetailBooking.booking_time ? selectedDetailBooking.booking_time.substring(0, 5) : '-'}</Text>
                    </View>
                  </View>

                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#ffffff', marginBottom: 8 }}>Kendaraan</Text>
                    <Text style={{ color: '#e0e0e0', fontSize: 14 }}>Tipe : {selectedDetailBooking.vehicle_type || '-'}</Text>
                    <Text style={{ color: '#e0e0e0', fontSize: 14 }}>Merek : {selectedDetailBooking.vehicle_brand || '-'}</Text>
                    <Text style={{ color: '#e0e0e0', fontSize: 14 }}>Plat : {selectedDetailBooking.vehicle_plate || '-'}</Text>
                  </View>

                  {selectedDetailBooking.notes && (
                    <View style={{ marginBottom: 16 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#ffffff', marginBottom: 8 }}>Catatan</Text>
                      <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: 12, borderRadius: 8 }}>
                        <Text style={{ color: '#e0e0e0', fontSize: 14 }}>{selectedDetailBooking.notes}</Text>
                      </View>
                    </View>
                  )}
                  <View style={{ height: 16 }} />
                </>
              )}
            </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1D24',
  },
  header: {
    backgroundColor: '#1A1D24',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#F59E0B',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(224, 224, 224, 0.7)',
    marginTop: 4,
  },
  logoutBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 12,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1A1D24',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#F59E0B',
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999999',
  },
  activeTabButtonText: {
    color: '#F59E0B',
  },
  content: {
    flex: 1,
    backgroundColor: '#1A1D24',
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e0e0e0',
    marginBottom: 16,
  },
  listContainer: {
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
  },
  serviceCard: {
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
  cardInner: {
    padding: 14,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userSection: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e0e0e0',
  },
  serviceText: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 3,
  },
  statusIconSmall: {
    fontSize: 10,
    lineHeight: 10,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '700',
  },

  detailsRow: {
    flexDirection: 'row',
    gap: 16,
    marginVertical: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detail: {
    fontSize: 11,
    color: '#b0b0b0',
  },
  statusChangeBtn: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusChangeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  serviceTop: {
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#e0e0e0',
  },
  serviceDescription: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 2,
  },
  serviceMeta: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 11,
    color: '#999999',
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F59E0B',
    marginTop: 2,
  },
  serviceActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
    alignItems: 'center',
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  deleteBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d32f2f',
    alignItems: 'center',
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ff6b6b',
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 12,
  },
  bottomSpacer: {
    height: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#16191E',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    maxHeight: '90%',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  dragIndicator: {
    width: 48,
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  closeBtn: {
    fontSize: 22,
    color: '#999999',
    backgroundColor: 'rgba(255,255,255,0.05)',
    width: 32,
    height: 32,
    borderRadius: 16,
    textAlign: 'center',
    lineHeight: 32,
    overflow: 'hidden',
  },
  modalForm: {
    paddingHorizontal: 28,
    paddingTop: 24,
  },
  input: {
    marginBottom: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 28,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    gap: 16,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F59E0B',
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  welcomeCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#e0e0e0',
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: 'rgba(224, 224, 224, 0.8)',
    marginTop: 4,
  },
  welcomeTime: {
    fontSize: 11,
    color: 'rgba(224, 224, 224, 0.6)',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCardLarge: {
    width: '48%',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(34, 37, 45, 0.65)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  statCardIcon: {
    marginBottom: 12,
  },
  statCardLabel: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
    marginBottom: 6,
  },
  statCardValueLarge: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F59E0B',
  },
  progressSection: {
    marginTop: 24,
  },
  progressCard: {
    backgroundColor: 'rgba(34, 37, 45, 0.65)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e0e0e0',
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F59E0B',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 4,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressStat: {
    flex: 1,
    alignItems: 'center',
  },
  progressStatLabel: {
    fontSize: 11,
    color: '#999999',
    fontWeight: '500',
  },
  progressStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e0e0e0',
    marginTop: 4,
  },
  progressDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  quickStatsContainer: {
    gap: 10,
  },
  quickStatItem: {
    backgroundColor: 'rgba(34, 37, 45, 0.65)',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  quickStatIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickStatIcon: {
    // No longer needed - using MaterialCommunityIcons instead
  },
  quickStatTitle: {
    fontSize: 13,
    color: '#999999',
    fontWeight: '600',
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F59E0B',
    marginTop: 2,
  },
  // Icon styling no longer needed for arrows - using MaterialCommunityIcons
  quickStatArrow: {
    // No longer needed - using chevron-right icon
  },
  // Centered Modal Styles
  centerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutModalContent: {
    backgroundColor: '#1A1D24',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 20,
    width: '85%',
    maxWidth: 300,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  logoutModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  logoutModalMessage: {
    fontSize: 14,
    color: '#b0b0b0',
    marginBottom: 20,
    lineHeight: 20,
  },
  logoutModalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  logoutCancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  logoutCancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#b0b0b0',
  },
  logoutConfirmButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FF5252',
    alignItems: 'center',
  },
  logoutConfirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#8a8a8a',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFD700',
  },
  reviewTextContainer: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
    borderRadius: 4,
  },
  reviewText: {
    fontSize: 13,
    color: '#e0e0e0',
    lineHeight: 18,
  },
  avgRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  avgRatingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFD700',
  },
})
