import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { View, Platform, Animated, Text, DeviceEventEmitter } from 'react-native'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/supabaseClient'

import { LoginScreen } from '../screens/auth/LoginScreen'
import { RegisterScreen } from '../screens/auth/RegisterScreen'
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen'
import { HomeScreen } from '../screens/user/HomeScreen'
import { BookingScreen } from '../screens/user/BookingScreen'
import { BookingHistoryScreen } from '../screens/user/BookingHistoryScreen'
import { ChatScreen } from '../screens/user/ChatScreen'
import { ProfileScreen } from '../screens/user/ProfileScreen'
import { ServiceCatalogScreen } from '../screens/user/ServiceCatalogScreen'
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen'
import { AdminChatScreen } from '../screens/admin/AdminChatScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

const AuthNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </Stack.Navigator>
)

const AnimatedTabIcon = ({ name, color, focused }: { name: any, color: string, focused: boolean }) => {
  const pulseAnim = React.useRef(new Animated.Value(0)).current

  React.useEffect(() => {
    if (focused) {
      Animated.loop(
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
      ).start()
    } else {
      pulseAnim.stopAnimation()
      pulseAnim.setValue(0)
    }
  }, [focused])

  const glowColor = '#F59E0B' // vibrant amber
  const displayColor = focused ? glowColor : color

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 40, height: 40 }}>
      {focused && (
        <Animated.View
          style={{
            position: 'absolute',
            opacity: pulseAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.3, 0.7]
            }),
            transform: [{
              scale: pulseAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.4]
              })
            }],
          }}
        >
          <Ionicons
            name={name}
            size={24}
            color={glowColor}
            style={{
              textShadowColor: glowColor,
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 15,
            }}
          />
        </Animated.View>
      )}
      <Ionicons
        name={name}
        size={24}
        color={displayColor}
        style={focused ? {
          textShadowColor: glowColor,
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 8,
        } : undefined}
      />
    </View>
  )
}

const UserTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused, color }) => {
        let iconName: any
        if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline'
        else if (route.name === 'Booking') iconName = focused ? 'add-circle' : 'add-circle-outline'
        else if (route.name === 'BookingHistory') iconName = focused ? 'list' : 'list-outline'
        else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline'
        return <AnimatedTabIcon name={iconName} color={color} focused={focused} />
      },
      tabBarActiveTintColor: '#F59E0B',
      tabBarInactiveTintColor: '#7a7a7a',
      tabBarStyle: {
        backgroundColor: '#1f1f1f',
        borderTopColor: '#8B6914',
        borderTopWidth: 2,
        paddingTop: 8,
        paddingBottom: Platform.OS === 'ios' ? 28 : 10,
        height: Platform.OS === 'ios' ? 88 : 64,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
      },
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 4,
      },
      tabBarItemStyle: {
        paddingVertical: 2,
      },
    })}
  >
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{ tabBarLabel: 'Home' }}
    />
    <Tab.Screen
      name="Booking"
      component={BookingScreen}
      options={{ tabBarLabel: 'Booking' }}
    />
    <Tab.Screen
      name="BookingHistory"
      component={BookingHistoryScreen}
      options={{ tabBarLabel: 'History' }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{ tabBarLabel: 'Profile' }}
    />
  </Tab.Navigator>
)

const UserNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="UserTabs" component={UserTabNavigator} />
    <Stack.Screen
      name="Chat"
      component={ChatScreen}
      options={{
        contentStyle: { backgroundColor: '#1f1f1f' },
      }}
    />
    <Stack.Screen
      name="ServiceCatalog"
      component={ServiceCatalogScreen}
      options={{
        contentStyle: { backgroundColor: '#0F1115' },
      }}
    />
  </Stack.Navigator>
)

const AdminTabNavigator = () => {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = React.useState(0)

  React.useEffect(() => {
    if (!user?.id) return

    const fetchUnread = async () => {
      const { data: activeBookings } = await supabase
        .from('bookings')
        .select('user_id')
        .in('status', ['Confirmed', 'In Progress'])
        
      const activeUserIds = activeBookings?.map(b => b.user_id) || []
      
      if (activeUserIds.length === 0) {
        setUnreadCount(0)
        return
      }

      const { count } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('read', false)
        .in('sender_id', activeUserIds)
      
      setUnreadCount(count || 0)
    }

    fetchUnread()

    const subscription = supabase
      .channel('admin-unread-messages')
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

    const readSubscription = DeviceEventEmitter.addListener('messagesRead', () => {
      fetchUnread()
    })

    return () => {
      supabase.removeChannel(subscription)
      readSubscription.remove()
    }
  }, [user?.id])

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color }) => {
          let iconName: any
          if (route.name === 'AdminDashboard') iconName = focused ? 'speedometer' : 'speedometer'
          else if (route.name === 'AdminChat') iconName = focused ? 'chatbubble' : 'chatbubble-outline'
          return <AnimatedTabIcon name={iconName} color={color} focused={focused} />
        },
        tabBarActiveTintColor: '#F59E0B',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#1f1f1f',
          borderTopColor: '#8B6914',
          borderTopWidth: 2,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          height: Platform.OS === 'ios' ? 88 : 64,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ tabBarLabel: 'Dashboard' }} />
      <Tab.Screen 
        name="AdminChat" 
        component={AdminChatScreen} 
        options={{
          tabBarLabel: 'AdminChat',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: { backgroundColor: '#EF4444', color: 'white', fontSize: 10 }
        }}
      />
    </Tab.Navigator>
  )
}

const AdminNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="AdminTabs" component={AdminTabNavigator} />
  </Stack.Navigator>
)

const CustomSplashScreen = ({ onAnimationComplete }: { onAnimationComplete: () => void }) => {
  const particles = [
    { x: -200, y: -250 },
    { x: 200, y: -250 },
    { x: -300, y: 0 },
    { x: 300, y: 0 },
    { x: -200, y: 250 },
    { x: 200, y: 250 },
    { x: 0, y: -350 },
    { x: 0, y: 350 },
  ]
  const particleAnims = React.useRef(particles.map(p => new Animated.ValueXY(p))).current
  const particlesOpacity = React.useRef(new Animated.Value(0)).current
  const mainLogoScale = React.useRef(new Animated.Value(0)).current
  const mainLogoOpacity = React.useRef(new Animated.Value(0)).current
  const textOpacity = React.useRef(new Animated.Value(0)).current
  const textTranslateY = React.useRef(new Animated.Value(20)).current

  React.useEffect(() => {
    // 1. Fade in particles
    Animated.timing(particlesOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start()

    // 2. Move particles to center (gathering effect)
    Animated.parallel(
      particleAnims.map(anim =>
        Animated.timing(anim, {
          toValue: { x: 0, y: 0 },
          duration: 1000,
          useNativeDriver: true,
        })
      )
    ).start(() => {
      // 3. Hide particles, pop main logo
      Animated.parallel([
        Animated.timing(particlesOpacity, { toValue: 0, duration: 50, useNativeDriver: true }),
        Animated.timing(mainLogoOpacity, { toValue: 1, duration: 50, useNativeDriver: true }),
        Animated.spring(mainLogoScale, { toValue: 1, friction: 4, tension: 50, useNativeDriver: true }),
      ]).start(() => {
        // 4. Show text
        Animated.parallel([
          Animated.timing(textOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(textTranslateY, { toValue: 0, duration: 600, useNativeDriver: true }),
        ]).start(() => {
          // Finish animation
          setTimeout(() => {
            onAnimationComplete()
          }, 800)
        })
      })
    })
  }, [])

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F1115' }}>
      <Animated.View style={{ opacity: particlesOpacity, position: 'absolute', width: 10, height: 10, justifyContent: 'center', alignItems: 'center' }}>
        {particleAnims.map((anim, i) => (
          <Animated.View key={i} style={{ position: 'absolute', transform: anim.getTranslateTransform() }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#F59E0B', shadowColor: '#F59E0B', shadowOpacity: 1, shadowRadius: 10, elevation: 5 }} />
          </Animated.View>
        ))}
      </Animated.View>

      <Animated.View style={{
        opacity: mainLogoOpacity,
        transform: [{ scale: mainLogoScale }],
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        width: 140,
        height: 140,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 30,
        marginBottom: 40,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.3)'
      }}>
        <Ionicons name="flash" size={80} color="#F59E0B" />
      </Animated.View>

      <Animated.View style={{ opacity: textOpacity, transform: [{ translateY: textTranslateY }] }}>
        <Text style={{
          fontSize: 26,
          fontWeight: '800',
          color: '#ffffff',
          letterSpacing: 0.8,
          textShadowColor: 'rgba(0, 0, 0, 0.3)',
          textShadowOffset: { width: 0, height: 2 },
          textShadowRadius: 4
        }}>
          SMART BOOKING SYSTEM
        </Text>
      </Animated.View>
    </View>
  )
}

export const RootNavigator = () => {
  const { isLoading, isSignedIn, role } = useAuth()
  const [showSplash, setShowSplash] = React.useState(true)
  const [isAnimComplete, setIsAnimComplete] = React.useState(false)
  const fadeAnim = React.useRef(new Animated.Value(1)).current

  React.useEffect(() => {
    if (!isLoading && isAnimComplete) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setShowSplash(false)
      })
    }
  }, [isLoading, isAnimComplete])

  if (showSplash) {
    return (
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <CustomSplashScreen onAnimationComplete={() => setIsAnimComplete(true)} />
      </Animated.View>
    )
  }

  return (
    <NavigationContainer>
      {isSignedIn ? (
        role === 'admin' ? <AdminNavigator /> : <UserNavigator />
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  )
}
