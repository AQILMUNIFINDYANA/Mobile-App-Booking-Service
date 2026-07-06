import React, { useState } from 'react'
import { View, StyleSheet, ScrollView, Alert, Text, TouchableOpacity } from 'react-native'
import { TextInput, Button } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../services/supabaseClient'

export const ForgotPasswordScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { forgotPassword, verifyOtp, updatePassword, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [step, setStep] = useState<'email' | 'otp' | 'password'>('email')
  const [loading, setLoading] = useState(false)

  const validateEmail = (emailValue: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(emailValue)
  }

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address')
      return
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address')
      return
    }

    setLoading(true)
    try {
      await forgotPassword(email)
      setStep('otp')
      Alert.alert(
        'Check Your Email',
        'We\'ve sent a 6-digit verification code to ' + email + '\n\nPlease enter the code below to reset your password.'
      )
    } catch (error: any) {
      if (error.message.includes('not found')) {
        Alert.alert('User Not Found', 'No account exists with this email address')
      } else {
        Alert.alert('Error', error.message || 'Failed to send reset email')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!otp.trim() || otp.length < 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit code')
      return
    }
    setLoading(true)
    try {
      await verifyOtp(email, otp)
      setStep('password')
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Invalid code')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async () => {
    if (!password.trim() || password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      await updatePassword(password)
      await supabase.auth.signOut()
      Alert.alert(
        'Sukses',
        'Password berhasil diubah. Silakan login kembali dengan password baru Anda.'
      )
      navigation.navigate('Login')
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <LinearGradient
      colors={['#1f1f1f', '#2a2a2a', '#1f1f1f']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      {/* Background Pattern - Garage/Mechanic Theme */}
      <View style={styles.patternOverlay}>
        {/* Horizontal lines pattern like garage door */}
        <View style={styles.linePattern}>
          <View style={styles.horizontalLine} />
          <View style={styles.horizontalLine} />
          <View style={styles.horizontalLine} />
          <View style={styles.horizontalLine} />
          <View style={styles.horizontalLine} />
          <View style={styles.horizontalLine} />
          <View style={styles.horizontalLine} />
          <View style={styles.horizontalLine} />
          <View style={styles.horizontalLine} />
          <View style={styles.horizontalLine} />
        </View>
        {/* Diagonal accent stripes */}
        <View style={[styles.diagonalStripe, styles.stripe1]} />
        <View style={[styles.diagonalStripe, styles.stripe2]} />
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top Accent Line - Orange for workshop theme */}
        <View style={styles.topAccent} />

        <View style={styles.content}>
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons 
                name={step === 'email' ? 'lock-reset' : step === 'otp' ? 'email-check-outline' : 'key-variant'} 
                size={48} 
                color="#F59E0B" 
              />
            </View>
            <Text style={styles.title}>
              {step === 'email' ? 'Reset Password' : step === 'otp' ? 'Enter Code' : 'New Password'}
            </Text>
            <Text style={styles.description}>
              {step === 'email' 
                ? 'Enter your email address and we\'ll send you a 6-digit code to reset your password.' 
                : step === 'otp' 
                ? `Enter the 6-digit code sent to\n${email}`
                : 'Enter your new password below to regain access to your account.'
              }
            </Text>
          </View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            {step === 'email' && (
              <>
                <TextInput
                  label="Email"
                  placeholder="user@example.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading && !isLoading}
                  mode="outlined"
                  style={styles.input}
                  outlineColor="rgba(255, 255, 255, 0.1)"
                  activeOutlineColor="#F59E0B"
                  textColor="#ffffff"
                  placeholderTextColor="#8a8a8a"
                  theme={{
                    colors: {
                      primary: '#F59E0B',
                      background: 'transparent',
                    },
                  }}
                  left={<TextInput.Icon icon="email-outline" color="#8a8a8a" />}
                />

                <Button
                  mode="contained"
                  onPress={handleForgotPassword}
                  loading={loading || isLoading}
                  disabled={loading || isLoading}
                  style={styles.button}
                  buttonColor="#F59E0B"
                  textColor="#ffffff"
                  labelStyle={styles.buttonLabel}
                >
                  Send Reset Code
                </Button>
              </>
            )}

            {step === 'otp' && (
              <>
                <TextInput
                  label="6-Digit Code"
                  placeholder="123456"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  autoCapitalize="none"
                  editable={!loading && !isLoading}
                  mode="outlined"
                  style={styles.input}
                  outlineColor="rgba(255, 255, 255, 0.1)"
                  activeOutlineColor="#F59E0B"
                  textColor="#ffffff"
                  placeholderTextColor="#8a8a8a"
                  theme={{
                    colors: {
                      primary: '#F59E0B',
                      background: 'transparent',
                    },
                  }}
                  left={<TextInput.Icon icon="shield-check-outline" color="#8a8a8a" />}
                />

                <Button
                  mode="contained"
                  onPress={handleVerifyOtp}
                  loading={loading || isLoading}
                  disabled={loading || isLoading}
                  style={styles.button}
                  buttonColor="#F59E0B"
                  textColor="#ffffff"
                  labelStyle={styles.buttonLabel}
                >
                  Verify Code
                </Button>
              </>
            )}

            {step === 'password' && (
              <>
                <TextInput
                  label="New Password"
                  placeholder="Enter new password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!loading && !isLoading}
                  mode="outlined"
                  style={styles.input}
                  outlineColor="rgba(255, 255, 255, 0.1)"
                  activeOutlineColor="#F59E0B"
                  textColor="#ffffff"
                  placeholderTextColor="#8a8a8a"
                  theme={{
                    colors: {
                      primary: '#F59E0B',
                      background: 'transparent',
                    },
                  }}
                  left={<TextInput.Icon icon="lock-outline" color="#8a8a8a" />}
                />

                <Button
                  mode="contained"
                  onPress={handleUpdatePassword}
                  loading={loading || isLoading}
                  disabled={loading || isLoading}
                  style={styles.button}
                  buttonColor="#F59E0B"
                  textColor="#ffffff"
                  labelStyle={styles.buttonLabel}
                >
                  Update Password
                </Button>
              </>
            )}
          </View>

          {/* Back to Login Link */}
          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.backLinkContainer}>
            <MaterialCommunityIcons name="arrow-left" size={16} color="#F59E0B" />
            <Text style={styles.link}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    position: 'relative',
  },
  patternOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    zIndex: 1,
  },
  linePattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-evenly',
    paddingVertical: 20,
  },
  horizontalLine: {
    height: 2,
    backgroundColor: '#8B6914',
    opacity: 0.04,
  },
  diagonalStripe: {
    position: 'absolute',
    backgroundColor: '#8B6914',
    opacity: 0.03,
  },
  stripe1: {
    width: 400,
    height: 400,
    transform: [{ rotate: '45deg' }],
    top: -100,
    right: -150,
  },
  stripe2: {
    width: 400,
    height: 400,
    transform: [{ rotate: '45deg' }],
    bottom: -100,
    left: -150,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  topAccent: {
    height: 4,
    backgroundColor: '#F59E0B',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 28,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 14,
    color: '#a0a0a0',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  formContainer: {
    backgroundColor: '#1f1f1f',
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 15,
    gap: 16,
  },
  input: {
    backgroundColor: 'rgba(25, 25, 25, 0.8)',
    fontSize: 15,
  },
  button: {
    marginTop: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  backLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  link: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '600',
  },
})
