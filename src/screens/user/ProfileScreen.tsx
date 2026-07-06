import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Modal } from 'react-native'
import { TextInput, Button } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '../../context/AuthContext'
import { useNotification } from '../../context/NotificationContext'
import { supabase } from '../../services/supabaseClient'
import { SensitiveActionMessages } from '../../utils/notificationHelper'

export const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth()
  const { showNotification } = useNotification()
  const [isEditing, setIsEditing] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [hidePassword, setHidePassword] = useState(true)
  const [hideConfirmPassword, setHideConfirmPassword] = useState(true)
  const [changingPassword, setChangingPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || 'User',
    phone: user?.phone || '',
    address: user?.address || '',
  })
  const [stats, setStats] = useState({
    bookings: 0,
    rating: 0,
    reviews: 0,
  })

  // Load latest user data and stats from Supabase
  useEffect(() => {
    loadUserProfile()
    loadUserStats()
  }, [user?.id])

  const loadUserProfile = async () => {
    try {
      if (!user?.id) return
      const { data, error } = await supabase
        .from('users')
        .select('name, phone, address')
        .eq('id', user.id)
        .single()

      if (error) throw error
      if (data) {
        setFormData({
          name: data.name || 'User',
          phone: data.phone || '',
          address: data.address || '',
        })
      }
    } catch (error) {
      console.log('Error loading user profile:', error)
    }
  }

  const loadUserStats = async () => {
    try {
      if (!user?.id) return

      // Get total bookings
      const { count: bookingCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      // Get reviews for user's bookings
      const bookingIds = (
        await supabase
          .from('bookings')
          .select('id')
          .eq('user_id', user.id)
      ).data?.map((b: any) => b.id) || []

      let reviewsData: any[] = []
      if (bookingIds.length > 0) {
        const { data } = await supabase
          .from('reviews')
          .select('rating')
          .in('booking_id', bookingIds)
        reviewsData = data || []
      }

      const reviewCount = reviewsData.length || 0
      const avgRating =
        reviewCount > 0
          ? (
            reviewsData.reduce((sum: number, r: any) => sum + r.rating, 0) /
            reviewCount
          ).toFixed(1)
          : 0

      setStats({
        bookings: bookingCount || 0,
        rating: parseFloat(String(avgRating)) || 0,
        reviews: reviewCount,
      })
    } catch (error) {
      console.log('Error loading user stats:', error)
    }
  }

  const handleLogout = () => {
    console.log('🚪 Logout button clicked')
    setShowLogoutConfirm(true)
  }

  const confirmLogout = async () => {
    try {
      console.log('🔄 User logout...')
      setShowLogoutConfirm(false)
      await logout()
      console.log('✅ User logout successful')
    } catch (error) {
      console.log('❌ User logout error:', error)
      setShowLogoutConfirm(false)
    }
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showNotification(SensitiveActionMessages.validationError, 'warning', 3000)
      return
    }

    try {
      setSaving(true)
      if (!user?.id) throw new Error('No user ID')

      const { error } = await supabase
        .from('users')
        .update({
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error

      showNotification(SensitiveActionMessages.profileUpdate.success, 'success', 3000)
      setIsEditing(false)
    } catch (error) {
      console.log('Error saving profile:', error)
      const errorMsg = (error as any)?.message?.includes('Network')
        ? SensitiveActionMessages.networkError
        : SensitiveActionMessages.profileUpdate.error
      showNotification(errorMsg, 'error', 4000)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: user?.name || 'User',
      phone: user?.phone || '',
      address: user?.address || '',
    })
    setIsEditing(false)
  }

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      showNotification('Harap isi semua kolom password', 'warning')
      return
    }
    if (newPassword !== confirmPassword) {
      showNotification('Password baru dan konfirmasi password tidak cocok', 'warning')
      return
    }
    if (newPassword.length < 6) {
      showNotification('Password minimal 6 karakter', 'warning')
      return
    }

    try {
      setChangingPassword(true)
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error

      showNotification('Password berhasil diubah!', 'success')
      setShowPasswordModal(false)
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      console.log('Error changing password:', error)
      showNotification(error.message || 'Gagal mengubah password', 'error')
    } finally {
      setChangingPassword(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Header Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarWrapper}>
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                style={styles.avatar}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.avatarText}>{getInitials(formData.name)}</Text>
              </LinearGradient>

              {!isEditing && (
                <TouchableOpacity
                  style={styles.editIconBadge}
                  onPress={() => setIsEditing(true)}
                >
                  <MaterialCommunityIcons name="pencil" size={16} color="#ffffff" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{formData.name}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusDot}>●</Text>
                <Text style={styles.statusText}>Active</Text>
              </View>
            </View>

          </View>

          {/* Quick Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.bookings}</Text>
              <Text style={styles.statLabel}>Bookings</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.rating > 0 ? stats.rating : '—'}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.reviews}</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* Contact Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information</Text>

            <View style={styles.infoCard}>
              <View style={styles.infoItem}>
                <MaterialCommunityIcons name="whatsapp" size={26} color="#25D366" style={styles.infoIcon} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Phone Number</Text>
                  {isEditing ? (
                    <TextInput
                      value={formData.phone}
                      onChangeText={(v) => setFormData({ ...formData, phone: v })}
                      keyboardType="phone-pad"
                      placeholder="Enter phone number"
                      style={styles.editInput}
                      mode="outlined"
                      outlineColor="#3a3a3a"
                      activeOutlineColor="#F59E0B"
                      textColor="#ffffff"
                      placeholderTextColor="#6a6a6a"
                      theme={{
                        colors: {
                          primary: '#F59E0B',
                          background: 'rgba(34, 37, 45, 0.65)',
                          surface: '#1A1D24',
                        },
                      }}
                    />
                  ) : (
                    <Text style={styles.infoValue}>{formData.phone || '—'}</Text>
                  )}
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoItem}>
                <MaterialCommunityIcons name="google-maps" size={26} color="#4285F4" style={styles.infoIcon} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Address</Text>
                  {isEditing ? (
                    <TextInput
                      value={formData.address}
                      onChangeText={(v) => setFormData({ ...formData, address: v })}
                      placeholder="Enter your address"
                      style={styles.editInput}
                      mode="outlined"
                      outlineColor="#3a3a3a"
                      activeOutlineColor="#F59E0B"
                      textColor="#ffffff"
                      placeholderTextColor="#6a6a6a"
                      theme={{
                        colors: {
                          primary: '#F59E0B',
                          background: 'rgba(34, 37, 45, 0.65)',
                          surface: '#1A1D24',
                        },
                      }}
                    />
                  ) : (
                    <Text style={styles.infoValue}>{formData.address || '—'}</Text>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Full Name Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            <View style={styles.infoCard}>
              <View style={styles.infoItem}>
                <MaterialCommunityIcons name="card-account-details-outline" size={26} color="#3B82F6" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Full Name</Text>
                  {isEditing ? (
                    <TextInput
                      value={formData.name}
                      onChangeText={(v) => setFormData({ ...formData, name: v })}
                      style={styles.editInput}
                      mode="outlined"
                      outlineColor="#3a3a3a"
                      activeOutlineColor="#F59E0B"
                      textColor="#ffffff"
                      theme={{
                        colors: {
                          primary: '#F59E0B',
                          background: 'rgba(34, 37, 45, 0.65)',
                          surface: '#1A1D24',
                        },
                      }}
                    />
                  ) : (
                    <Text style={styles.infoValue}>{formData.name}</Text>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          {isEditing && (
            <View style={styles.section}>
              <View style={styles.buttonGroup}>
                <Button
                  mode="contained"
                  onPress={handleSave}
                  disabled={saving}
                  style={styles.saveButton}
                  buttonColor="#F59E0B"
                  textColor="#ffffff"
                  labelStyle={styles.buttonLabel}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  mode="outlined"
                  onPress={handleCancel}
                  disabled={saving}
                  style={styles.cancelButton}
                  textColor="#b0b0b0"
                  labelStyle={styles.buttonLabel}
                >
                  Cancel
                </Button>
              </View>
            </View>
          )}

          {/* Account Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>

            <View style={styles.menuCard}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => setShowPasswordModal(true)}
              >
                <View style={styles.menuIconContainer}>
                  <MaterialCommunityIcons name="lock-outline" size={22} color="#F59E0B" />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuLabel}>Change Password</Text>
                  <Text style={styles.menuDesc}>Update your password</Text>
                </View>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => showNotification('Fitur Notifikasi akan segera hadir!', 'info')}
              >
                <View style={styles.menuIconContainer}>
                  <MaterialCommunityIcons name="bell-outline" size={22} color="#EC4899" style={styles.menuIcon} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuLabel}>Notifications</Text>
                  <Text style={styles.menuDesc}>Manage alerts & notifications</Text>
                </View>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Logout Section */}
          <View style={styles.section}>
            <Button
              mode="contained"
              onPress={handleLogout}
              style={styles.logoutButton}
              buttonColor="#FF5252"
              textColor="#ffffff"
              labelStyle={styles.buttonLabel}
            >
              Logout
            </Button>
          </View>

          <View style={styles.flexSpacer} />
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal visible={showLogoutConfirm} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
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

      {/* Change Password Modal */}
      <Modal visible={showPasswordModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.passwordModalContent}>
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              style={styles.passwordModalHeader}
            >
              <MaterialCommunityIcons name="shield-lock-outline" size={48} color="#ffffff" style={{ marginBottom: 12 }} />
              <Text style={styles.passwordModalTitle}>Change Password</Text>
              <Text style={styles.passwordModalSubtitle}>Secure your account with a new password</Text>
            </LinearGradient>
            
            <View style={{ padding: 24 }}>
              <TextInput
                label="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={hidePassword}
                mode="outlined"
                outlineColor="#3a3a3a"
                activeOutlineColor="#F59E0B"
                textColor="#ffffff"
                style={{ backgroundColor: 'rgba(34, 37, 45, 0.65)', marginBottom: 16 }}
                theme={{ colors: { onSurfaceVariant: '#8a8a8a' } }}
                right={
                  <TextInput.Icon 
                    icon={hidePassword ? "eye-off" : "eye"} 
                    color="#8a8a8a"
                    onPress={() => setHidePassword(!hidePassword)} 
                    forceTextInputFocus={false}
                  />
                }
              />
              <TextInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={hideConfirmPassword}
                mode="outlined"
                outlineColor="#3a3a3a"
                activeOutlineColor="#F59E0B"
                textColor="#ffffff"
                style={{ backgroundColor: 'rgba(34, 37, 45, 0.65)', marginBottom: 24 }}
                theme={{ colors: { onSurfaceVariant: '#8a8a8a' } }}
                right={
                  <TextInput.Icon 
                    icon={hideConfirmPassword ? "eye-off" : "eye"} 
                    color="#8a8a8a"
                    onPress={() => setHideConfirmPassword(!hideConfirmPassword)} 
                    forceTextInputFocus={false}
                  />
                }
              />

              <View style={styles.logoutModalButtons}>
                <TouchableOpacity
                  style={[styles.logoutCancelButton, { flex: 1, marginRight: 8, borderColor: '#3a3a3a' }]}
                  onPress={() => {
                  setShowPasswordModal(false)
                  setNewPassword('')
                  setConfirmPassword('')
                }}
                disabled={changingPassword}
              >
                <Text style={styles.logoutCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.logoutConfirmButton, { flex: 1, marginLeft: 8, backgroundColor: '#F59E0B' }]}
                onPress={handleChangePassword}
                disabled={changingPassword}
              >
                <Text style={styles.logoutConfirmButtonText}>
                  {changingPassword ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
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
  scrollContent: {
    flexGrow: 1,
  },
  // Profile Card Styles
  profileCard: {
    backgroundColor: '#1A1D24',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 16,
    position: 'relative',
  },
  avatarWrapper: {
    position: 'relative',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    borderRadius: 44, // Make shadow circular
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#1A1D24',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#ffffff',
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F59E0B',
    fontStyle: 'italic',
    letterSpacing: 0.5,
    marginBottom: 4,
    textShadowColor: 'rgba(245, 158, 11, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  userEmail: {
    fontSize: 13,
    color: '#b0b0b0',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  statusDot: {
    fontSize: 12,
    color: '#4CAF50',
  },
  statusText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  editIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#1A1D24',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  // Stats Container
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#8a8a8a',
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  // Content Styles
  content: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  // Info Card
  infoCard: {
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
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  infoIcon: {
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
    gap: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: '#8a8a8a',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  infoValue: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 16,
  },
  editInput: {
    backgroundColor: '#0F1115',
    borderRadius: 8,
    marginTop: 4,
  },
  // Menu Card
  menuCard: {
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
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#0F1115',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 20,
  },
  menuContent: {
    flex: 1,
    gap: 2,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  menuDesc: {
    fontSize: 11,
    color: '#8a8a8a',
  },
  menuArrow: {
    fontSize: 16,
    color: '#F59E0B',
    fontWeight: '600',
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 16,
  },
  // Button Styles
  buttonGroup: {
    gap: 10,
  },
  saveButton: {
    borderRadius: 10,
    paddingVertical: 6,
  },
  cancelButton: {
    borderRadius: 10,
    paddingVertical: 6,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  logoutButton: {
    borderRadius: 10,
    paddingVertical: 6,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  spacer: {
    height: 24,
  },
  flexSpacer: {
    flex: 1,
    minHeight: 24,
  },
  // Logout Modal Styles
  modalOverlay: {
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
  passwordModalContent: {
    backgroundColor: '#1A1D24',
    borderRadius: 20,
    width: '85%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
  },
  passwordModalHeader: {
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  passwordModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  passwordModalSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    textAlign: 'center',
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
})
