import React, { useState } from 'react'
import { View, StyleSheet, ScrollView, Text, TouchableOpacity } from 'react-native'
import { TextInput, Button } from 'react-native-paper'
import { useNotification } from '../../context/NotificationContext'
import { SensitiveActionMessages } from '../../utils/notificationHelper'

export const FeedbackScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { showNotification } = useNotification()
  const [rating, setRating] = useState(5)
  const [review, setReview] = useState('')
  const [status, setStatus] = useState<'safe' | 'issue'>('safe')

  // Mock last booking data
  const lastBooking = {
    id: '1',
    service: 'Oil Change',
    date: 'Jan 15, 2024',
    time: '09:00',
    mechanic: 'Budi Santoso',
    totalPrice: 150000,
  }

  const handleSubmit = () => {
    if (!review.trim()) {
      showNotification(SensitiveActionMessages.validationError, 'warning', 3000)
      return
    }

    if (status === 'safe') {
      showNotification(SensitiveActionMessages.review.success, 'success', 3000)
      setReview('')
      setRating(5)
      setStatus('safe')
      setTimeout(() => navigation.goBack(), 1500)
    } else {
      showNotification('Menghubungi tim support...', 'info', 2000)
    }
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Service Review</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Last Booking Card */}
        <View style={styles.bookingCard}>
          <Text style={styles.bookingLabel}>Last Service</Text>
          <Text style={styles.bookingService}>{lastBooking.service}</Text>
          <View style={styles.bookingDetails}>
            <View style={styles.bookingDetailItem}>
              <Text style={styles.bookingDetailIcon}>📅</Text>
              <Text style={styles.bookingDetailText}>{lastBooking.date}</Text>
            </View>
            <View style={styles.bookingDetailItem}>
              <Text style={styles.bookingDetailIcon}>⏰</Text>
              <Text style={styles.bookingDetailText}>{lastBooking.time}</Text>
            </View>
            <View style={styles.bookingDetailItem}>
              <Text style={styles.bookingDetailIcon}>👨‍🔧</Text>
              <Text style={styles.bookingDetailText}>{lastBooking.mechanic}</Text>
            </View>
          </View>
        </View>

        {/* Rating Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How was your experience?</Text>
          <View style={styles.ratingButtons}>
            {[1, 2, 3, 4, 5].map((r) => (
              <TouchableOpacity
                key={r}
                style={[
                  styles.ratingButton,
                  rating === r && styles.ratingButtonActive,
                ]}
                onPress={() => setRating(r)}
              >
                <Text style={styles.ratingButtonText}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.ratingLabel}>
            {rating === 1 && '😞 Poor'}
            {rating === 2 && '😕 Fair'}
            {rating === 3 && '😐 OK'}
            {rating === 4 && '😊 Good'}
            {rating === 5 && '😍 Excellent'}
          </Text>
        </View>

        {/* Review Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tell us more</Text>
          <TextInput
            label="Your Review"
            value={review}
            onChangeText={setReview}
            multiline
            numberOfLines={5}
            style={styles.input}
            mode="outlined"
            outlineColor="#3a3a3a"
            activeOutlineColor="#F59E0B"
            textColor="#ffffff"
            placeholderTextColor="#6a6a6a"
            placeholder="Share your experience with the service..."
            theme={{
              colors: {
                primary: '#F59E0B',
                background: 'rgba(34, 37, 45, 0.65)',
                surface: '#1A1D24',
              },
              roundness: 24,
            }}
          />
        </View>

        {/* Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Any issues?</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity 
              style={styles.radioOption}
              onPress={() => setStatus('safe')}
            >
              <View style={[styles.radioButton, status === 'safe' && styles.radioButtonChecked]}>
                {status === 'safe' && <Text style={styles.radioButtonDot}>●</Text>}
              </View>
              <Text style={styles.radioLabel}>No issues - Everything is good ✓</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.radioOption}
              onPress={() => setStatus('issue')}
            >
              <View style={[styles.radioButton, status === 'issue' && styles.radioButtonChecked]}>
                {status === 'issue' && <Text style={styles.radioButtonDot}>●</Text>}
              </View>
              <Text style={styles.radioLabel}>I have concerns - Need support</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Submit Button */}
        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.submitButton}
          buttonColor="#F59E0B"
          textColor="#ffffff"
          labelStyle={styles.submitButtonLabel}
        >
          Submit Review
        </Button>

        <View style={styles.spacer} />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1115',
  },
  header: {
    backgroundColor: '#1A1D24',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  content: {
    padding: 24,
    gap: 24,
  },
  bookingCard: {
    backgroundColor: 'rgba(34, 37, 45, 0.65)',
    borderRadius: 20,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  bookingLabel: {
    fontSize: 12,
    color: '#8a8a8a',
    fontWeight: '600',
    marginBottom: 4,
  },
  bookingService: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
  },
  bookingDetails: {
    gap: 8,
  },
  bookingDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bookingDetailIcon: {
    fontSize: 16,
  },
  bookingDetailText: {
    fontSize: 13,
    color: '#b0b0b0',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  ratingButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#1A1D24',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  ratingButtonActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  ratingButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  ratingLabel: {
    fontSize: 13,
    color: '#F59E0B',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  input: {
    backgroundColor: '#1A1D24',
    borderRadius: 10,
    textAlignVertical: 'top',
  },
  radioGroup: {
    gap: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonChecked: {
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  radioButtonDot: {
    color: '#F59E0B',
    fontSize: 12,
  },
  radioLabel: {
    fontSize: 13,
    color: '#ffffff',
    flex: 1,
  },
  submitButton: {
    marginTop: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  submitButtonLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  spacer: {
    height: 24,
  },
})
