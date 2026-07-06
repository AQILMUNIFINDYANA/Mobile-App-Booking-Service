import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Text,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { AuthForm } from '../../components/AuthForm'
import { useAuth } from '../../context/AuthContext'

const { height: screenHeight } = Dimensions.get('window')

export const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { login, isLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleLogin = async (credentials: Record<string, string>) => {
    setLoading(true)
    setErrorMsg(null)
    try {
      await login(credentials.email, credentials.password)
    } catch (error: any) {
      let msg = error.message
      if (msg.includes('Invalid login credentials')) {
        msg = 'Email atau password salah'
      } else if (msg.includes('Email not confirmed')) {
        msg = 'Email belum dikonfirmasi'
      }
      setErrorMsg(msg)
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
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
      >
        <View style={styles.content}>
        {/* Logo Section - Compact */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Ionicons name="flash" size={44} color="#F59E0B" />
          </View>
          <Text style={styles.brandName}>AMI mobile</Text>
          <Text style={styles.brandSub}>Welcome Back, Rider!</Text>
        </View>

        {/* Form Section */}
        <View style={styles.formContainer}>
          <Text style={styles.welcomeText}>Sign In</Text>

          <View style={styles.formWrapper}>
            <AuthForm
              title=""
              fields={[
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
              ]}
              onSubmit={handleLogin}
              isLoading={loading || isLoading}
              buttonText="Sign In"
              errorMessage={errorMsg}
            />
          </View>
        </View>

        {/* Links Section */}
        <View style={styles.linksContainer}>
          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.signupRow}>
            <Text style={styles.noAccountText}>No account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.signupText}>Create account</Text>
            </TouchableOpacity>
          </View>
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
  content: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    justifyContent: 'center',
    minHeight: screenHeight - 6,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  logoIcon: {
    fontSize: 28,
    lineHeight: 28,
    color: '#ffffff',
    fontWeight: '800',
  },
  brandName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.8,
  },
  brandSub: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F59E0B',
    marginTop: 4,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  formContainer: {
    marginBottom: 20,
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
  welcomeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e0e0e0',
    marginBottom: 12,
  },
  formWrapper: {
    marginTop: 6,
  },
  linksContainer: {
    alignItems: 'center',
    gap: 10,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F59E0B',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noAccountText: {
    fontSize: 12,
    color: 'rgba(224, 224, 224, 0.7)',
    fontWeight: '400',
  },
  signupText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F59E0B',
  },
})
