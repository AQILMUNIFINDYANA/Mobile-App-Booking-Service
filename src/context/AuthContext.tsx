import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import { User, UserRole } from '../types'
import { registerForPushNotificationsAsync, savePushToken } from '../utils/notifications'
import * as Notifications from 'expo-notifications'
import { DeviceEventEmitter } from 'react-native'

interface AuthContextType {
  user: User | null
  role: UserRole | null
  isLoading: boolean
  isSignedIn: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  verifyOtp: (email: string, token: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    bootstrapAsync()
  }, [])

  useEffect(() => {
    let chatSubscription: any = null;

    if (user) {
      registerForPushNotificationsAsync().then(token => {
        if (token) {
          savePushToken(user.id, token)
        }
      })

      // Fallback: Realtime local notification to bypass Firebase FCM
      chatSubscription = supabase
        .channel(`chat-notifications-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `receiver_id=eq.${user.id}`,
          },
          async (payload) => {
            try {
              const { data: sender } = await supabase
                .from('users')
                .select('name, role')
                .eq('id', payload.new.sender_id)
                .single();
                
              // Broadcast locally to chat screens so they update instantly
              DeviceEventEmitter.emit('onNewChatMessage', payload.new);
              
              if (sender) {
                const senderPrefix = sender.role === 'admin' ? 'Admin ' : '';
                Notifications.scheduleNotificationAsync({
                  content: {
                    title: `Pesan Baru dari ${senderPrefix}${sender.name}`,
                    body: payload.new.message,
                    sound: 'bookingsound',
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                  },
                  trigger: {
                    channelId: 'booking-channel',
                  },
                }).catch(console.error);
              }
            } catch (err) {
              console.error('Local chat notification error:', err);
            }
          }
        )
        .subscribe();
    }

    return () => {
      if (chatSubscription) {
        supabase.removeChannel(chatSubscription);
      }
    }
  }, [user])

  const bootstrapAsync = async () => {
    try {
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        throw error
      }

      if (data.session?.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.session.user.id)
          .single()

        if (userData) {
          setUser(userData)
          setRole(userData.role)
        }
      }
    } catch (error: any) {
      console.log('Bootstrap error:', error)
      // Jika terjadi error pada token (invalid refresh token), paksa logout untuk membersihkan cache
      if (error.message?.includes('Refresh Token') || error.name?.includes('Auth')) {
        await supabase.auth.signOut()
      }
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    console.log('🔐 Login attempt:', email)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('🔑 Auth response error:', error)
      console.log('🔑 Auth response data:', data)

      if (error) {
        console.log('❌ Auth error:', error.message, error.code)
        throw error
      }

      if (data.user) {
        console.log('✅ User authenticated:', data.user.id)
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (userError) {
          console.log('👤 User query error:', userError)
          throw new Error('Gagal mengambil profil user. Pastikan akun terdaftar dengan benar.');
        }

        if (userData) {
          setUser(userData)
          setRole(userData.role)
          console.log('✅ Login complete, user set:', userData.email)
        } else {
          throw new Error('Profil user tidak ditemukan di database. Silakan Register ulang.');
        }
      }
    } catch (err: any) {
      console.log('💥 Login catch error:', err.message)
      throw err
    }
  }

  const register = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        },
      },
    })

    if (error) throw error

    // Note: The public.users table is automatically populated by a database trigger (handle_new_user) 
    // so we don't need to manually insert the user row here. Doing so would cause an RLS error.

    if (data.user) {
      setUser({
        id: data.user.id,
        email,
        name,
        phone: '',
        address: '',
        role: 'user',
        created_at: new Date().toISOString(),
      })
      setRole('user')
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setRole(null)
  }

  const forgotPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) throw error
  }

  const verifyOtp = async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'recovery',
    })
    if (error) throw error
  }

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isLoading,
        isSignedIn: !!user,
        login,
        register,
        logout,
        forgotPassword,
        verifyOtp,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
