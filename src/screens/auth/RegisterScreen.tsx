import React, { useState } from 'react'
import { View, StyleSheet, ScrollView, Alert, Text, TouchableOpacity } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { AuthForm } from '../../components/AuthForm'
import { useAuth } from '../../context/AuthContext'



export const RegisterScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { register, isLoading } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleRegister = async (credentials: Record<string, string>) => {
    if (credentials.password !== credentials.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await register(credentials.email, credentials.password, credentials.name)
      Alert.alert('Success', 'Account created successfully!')
      // Don't navigate - AuthContext will auto-redirect when user is set
    } catch (error: any) {
      Alert.alert('Registration Error', error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <LinearGradient
      colors={['#0F1115', '#1A1D24', '#0F1115']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      {/* Background Ambient Glows */}
      <View style={styles.ambientGlow1} />
      <View style={styles.ambientGlow2} />


      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top Accent Line */}
        <View style={styles.topAccent} />

        <View style={styles.content}>
          {/* Header Section */}
          <View style={styles.headerSection}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.description}>
              Join us to start managing your service bookings
            </Text>
          </View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            <AuthForm
              title=""
              fields={[
                {
                  name: 'name',
                  label: 'Full Name',
                  placeholder: 'John Doe',
                },
                {
                  name: 'email',
                  label: 'Email',
                  placeholder: 'user@example.com',
                },
                {
                  name: 'password',
                  label: 'Password',
                  placeholder: '••••••••',
                  secureTextEntry: true,
                },
                {
                  name: 'confirmPassword',
                  label: 'Confirm Password',
                  placeholder: '••••••••',
                  secureTextEntry: true,
                },
              ]}
              onSubmit={handleRegister}
              isLoading={loading || isLoading}
              buttonText="Register"
            />
          </View>

          {/* Login Link */}
          <View style={styles.links}>
            <Text style={styles.text}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>Login</Text>
            </TouchableOpacity>
          </View>
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
  ambientGlow1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#F59E0B',
    opacity: 0.1,
    transform: [{ scaleX: 1.5 }],
  },
  ambientGlow2: {
    position: 'absolute',
    bottom: -150,
    left: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: '#3B82F6',
    opacity: 0.05,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  topAccent: {
    height: 4,
    backgroundColor: '#F59E0B',
    borderRadius: 2,
    marginHorizontal: 120,
    marginBottom: 20,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 28,
    gap: 20,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
    color: '#ffffff',
  },
  description: {
    fontSize: 13,
    color: 'rgba(224, 224, 224, 0.8)',
    textAlign: 'center',
    lineHeight: 19,
  },
  formContainer: {
    backgroundColor: 'rgba(34, 37, 45, 0.65)',
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
  },
  links: {
    marginTop: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 13,
    color: 'rgba(224, 224, 224, 0.7)',
  },
  link: {
    fontSize: 13,
    color: '#F59E0B',
    fontWeight: '700',
  },
})
