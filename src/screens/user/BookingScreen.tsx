import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Platform } from 'react-native'
import { TextInput, Button, Menu } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useAuth } from '../../context/AuthContext'
import { useNotification } from '../../context/NotificationContext'
import { supabase } from '../../services/supabaseClient'
import { SensitiveActionMessages } from '../../utils/notificationHelper'

interface Service {
  id: string
  title: string
  price: number
}

export const BookingScreen: React.FC<{ route?: any; navigation: any }> = ({ route, navigation }) => {
  const { user } = useAuth()
  const { showNotification } = useNotification()
  const [formData, setFormData] = useState({
    service: '',
    serviceId: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    vehicleType: 'Motorcycle',
    vehicleBrand: '',
    vehiclePlate: '',
    notes: '',
  })

  const [services, setServices] = useState<Service[]>([])
  const [serviceMenuVisible, setServiceMenuVisible] = useState(false)
  const [vehicleMenuVisible, setVehicleMenuVisible] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchServices()
  }, [])

  useEffect(() => {
    if (route?.params?.preselectedService) {
      const service = route.params.preselectedService
      setFormData(prev => ({
        ...prev,
        service: service.title,
        serviceId: service.id
      }))
    }
  }, [route?.params?.preselectedService])

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, title, price')

      if (error) throw error
      setServices(data || [])
    } catch (error) {
      console.log('Error fetching services:', error)
    }
  }

  const handleSubmit = async () => {
    if (!formData.serviceId || !formData.vehicleType || !formData.vehicleBrand || !formData.vehiclePlate) {
      showNotification(SensitiveActionMessages.validationError, 'warning', 3000)
      return
    }

    // Validate Operating Hours
    const selectedDate = new Date(formData.date)
    const dayOfWeek = selectedDate.getDay() // 0 = Sunday, 6 = Saturday
    const selectedHour = parseInt(formData.time.split(':')[0], 10)

    if (dayOfWeek === 0) {
      showNotification('Maaf, bengkel tutup pada hari Minggu. Silakan pilih hari lain.', 'warning', 4000)
      return
    }

    if (dayOfWeek === 6 && selectedHour >= 15) {
      showNotification('Maaf, pada hari Sabtu bengkel tutup pukul 15:00. Silakan pilih jam lebih awal.', 'warning', 4000)
      return
    }

    if (selectedHour < 8 || selectedHour >= 17) {
      showNotification('Maaf, waktu yang dipilih di luar jam operasional bengkel.', 'warning', 4000)
      return
    }

    if (!user?.id) {
      showNotification('User belum terautentikasi', 'error')
      return
    }

    try {
      setIsSubmitting(true)

      const selectedService = services.find(s => s.id === formData.serviceId)
      const totalPrice = selectedService?.price || 0

      const { error } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          service_id: formData.serviceId,
          vehicle_type: formData.vehicleType,
          vehicle_brand: formData.vehicleBrand,
          vehicle_plate: formData.vehiclePlate,
          booking_date: formData.date,
          booking_time: formData.time,
          notes: formData.notes,
          status: 'Pending',
          total_price: totalPrice,
        })

      if (error) throw error

      // Notify admins
      try {
        const { data: admins } = await supabase.from('users').select('push_token').eq('role', 'admin')
        if (admins) {
          const { sendPushNotification } = await import('../../utils/notifications')
          admins.forEach(admin => {
            if (admin.push_token) {
              sendPushNotification(
                admin.push_token,
                'Pesanan Masuk Baru! 🔔',
                `${user.name} baru saja membuat pesanan ${selectedService?.title || 'Servis'}.`
              )
            }
          })
        }
      } catch (pushErr) {
        console.log('Failed to send push:', pushErr)
      }

      showNotification(SensitiveActionMessages.booking.success, 'success', 3000)
      setFormData({
        service: '',
        serviceId: '',
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        vehicleType: 'Motorcycle',
        vehicleBrand: '',
        vehiclePlate: '',
        notes: '',
      })
      setTimeout(() => {
        navigation.navigate('BookingHistory')
      }, 500)
    } catch (error: any) {
      console.log('Error creating booking:', error)
      const errorMessage = error?.message?.includes('Network')
        ? SensitiveActionMessages.networkError
        : SensitiveActionMessages.booking.error
      showNotification(errorMessage, 'error', 4000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDateChange = (_event: any, selectedDate: any) => {
    setShowDatePicker(false)
    if (selectedDate) {
      // Need to adjust for local timezone to prevent offset issues
      const dateString = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0]
      setFormData({ ...formData, date: dateString })
    }
  }

  const handleTimeChange = (_event: any, selectedTime: any) => {
    setShowTimePicker(false)
    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, '0')
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0')
      setFormData({ ...formData, time: `${hours}:${minutes}` })
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Card */}
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>Book Your Service</Text>
          <Text style={styles.headerSubtitle}>Schedule a maintenance for your vehicle</Text>
        </View>

        {/* Service Selection Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Select Service</Text>
          </View>

          <View style={styles.card}>
            <Menu
              visible={serviceMenuVisible}
              onDismiss={() => setServiceMenuVisible(false)}
              contentStyle={{ backgroundColor: '#1A1D24', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' }}
              anchor={
                <TouchableOpacity
                  onPress={() => setServiceMenuVisible(true)}
                  style={styles.menuButton}
                >
                  <MaterialCommunityIcons name="wrench" size={20} color="#F59E0B" />
                  <View style={styles.menuButtonContent}>
                    <Text style={styles.menuButtonLabel}>Service Type</Text>
                    <Text style={[styles.menuButtonValue, { color: formData.service ? '#F59E0B' : '#b0b0b0' }]}>
                      {formData.service || 'Choose a service'}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#F59E0B" />
                </TouchableOpacity>
              }
            >
              {services.map((s) => (
                <Menu.Item
                  key={s.id}
                  titleStyle={{ color: '#ffffff', fontSize: 14 }}
                  onPress={() => {
                    setFormData({ ...formData, service: s.title, serviceId: s.id })
                    setServiceMenuVisible(false)
                  }}
                  title={s.title}
                />
              ))}
            </Menu>
          </View>
        </View>

        {/* Vehicle Information Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Vehicle Details</Text>
          </View>

          <View style={styles.card}>
            {/* Vehicle Type */}
            <View style={[styles.menuButton, { borderBottomWidth: 0 }]}>
              <MaterialCommunityIcons name="motorbike" size={26} color="#F59E0B" />
              <View style={[styles.menuButtonContent, { justifyContent: 'center' }]}>
                <Text style={[styles.menuButtonLabel, { fontSize: 16, color: '#ffffff' }]}>Vehicle Type</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Brand and Plate Row */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Vehicle Brand</Text>
              <TextInput
                placeholder="e.g., Yamaha"
                value={formData.vehicleBrand}
                onChangeText={(text) => setFormData({ ...formData, vehicleBrand: text })}
                style={styles.input}
                placeholderTextColor="#6a6a6a"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>License Plate</Text>
              <TextInput
                placeholder="e.g., B 13 4MI"
                value={formData.vehiclePlate}
                onChangeText={(text) => setFormData({ ...formData, vehiclePlate: text })}
                style={styles.input}
                placeholderTextColor="#6a6a6a"
              />
            </View>
          </View>
        </View>

        {/* Schedule Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Schedule</Text>
          </View>

          <View style={styles.card}>
            {/* Date */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Date</Text>
              {Platform.OS === 'web' ? (
                <View style={[styles.selectButton, { paddingVertical: 6 }]}>
                  <MaterialCommunityIcons name="calendar" size={18} color="#F59E0B" />
                  {/* @ts-ignore */}
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e: any) => setFormData({ ...formData, date: e.target.value })}
                    style={{
                      backgroundColor: 'transparent',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      outline: 'none',
                      flex: 1,
                      padding: '4px 0',
                      colorScheme: 'dark',
                    }}
                  />
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  style={styles.selectButton}
                >
                  <MaterialCommunityIcons name="calendar" size={18} color="#F59E0B" />
                  <Text style={[styles.selectText, { color: formData.date ? '#ffffff' : '#b0b0b0' }]}>
                    {formData.date || 'Select date'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.divider} />

            {/* Time */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Time</Text>
              {Platform.OS === 'web' ? (
                <View style={[styles.selectButton, { paddingVertical: 6 }]}>
                  <MaterialCommunityIcons name="clock-outline" size={18} color="#F59E0B" />
                  {/* @ts-ignore */}
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e: any) => setFormData({ ...formData, time: e.target.value })}
                    style={{
                      backgroundColor: 'transparent',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      outline: 'none',
                      flex: 1,
                      padding: '4px 0',
                      colorScheme: 'dark',
                    }}
                  />
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => setShowTimePicker(true)}
                  style={styles.selectButton}
                >
                  <MaterialCommunityIcons name="clock-outline" size={18} color="#F59E0B" />
                  <Text style={[styles.selectText, { color: formData.time ? '#ffffff' : '#b0b0b0' }]}>
                    {formData.time || 'Select time'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Additional Notes Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Additional Notes</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.fieldGroup}>
              <TextInput
                placeholder="Add any special requests or notes..."
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                multiline
                numberOfLines={4}
                style={[styles.input, styles.notesInput]}
                placeholderTextColor="#6a6a6a"
              />
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <View style={styles.section}>
          <Button
            mode="contained"
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={styles.submitButton}
            buttonColor="#F59E0B"
            textColor="#ffffff"
            labelStyle={styles.submitButtonLabel}
          >
            {isSubmitting ? 'Booking...' : 'Confirm Booking'}
          </Button>
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      {/* Native Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={new Date(formData.date)}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Native Time Picker Modal */}
      {showTimePicker && (
        <DateTimePicker
          value={
            new Date(
              new Date().toISOString().split('T')[0] + 'T' + (formData.time || '09:00') + ':00'
            )
          }
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}
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
  scrollContent: {
    flexGrow: 1,
  },
  // Header Card
  headerCard: {
    backgroundColor: '#1A1D24',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#b0b0b0',
  },
  // Section Styles
  section: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  // Card Styles
  card: {
    backgroundColor: 'rgba(34, 37, 45, 0.65)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  fieldGroup: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8a8a8a',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  // Menu Button Styles
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuButtonIcon: {
    fontSize: 20,
  },
  menuButtonContent: {
    flex: 1,
    gap: 2,
  },
  menuButtonLabel: {
    fontSize: 12,
    color: '#8a8a8a',
    fontWeight: '600',
  },
  menuButtonValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  menuButtonArrow: {
    fontSize: 16,
    color: '#F59E0B',
    fontWeight: '600',
  },
  // Input Styles
  input: {
    backgroundColor: '#0F1115',
    borderRadius: 8,
    fontSize: 14,
    color: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  notesInput: {
    textAlignVertical: 'top',
    minHeight: 100,
    color: '#e0e0e0',
  },
  // Select Button
  selectButton: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#0F1115',
    gap: 10,
  },
  selectIcon: {
    fontSize: 18,
  },
  selectText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Read Only Button
  readOnlyButton: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#0F1115',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  readOnlyIcon: {
    fontSize: 18,
  },
  readOnlyText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  // Divider
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 16,
  },
  // Submit Button
  submitButton: {
    borderRadius: 10,
    paddingVertical: 8,
    marginBottom: 12,
  },
  submitButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  spacer: {
    height: 24,
  },
})
