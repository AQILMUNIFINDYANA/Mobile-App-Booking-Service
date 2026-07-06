import React, { useEffect } from 'react'
import { Platform } from 'react-native'
import { PaperProvider } from 'react-native-paper'
import { AuthProvider } from './src/context/AuthContext'
import { NotificationProvider } from './src/context/NotificationContext'
import { RootNavigator } from './src/navigation/RootNavigator'
import { NotificationOverlay } from './src/components/NotificationOverlay'

export default function App() {
  useEffect(() => {
    if (Platform.OS === 'web') {
      const style = document.createElement('style')
      style.textContent = `
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 50px rgba(26, 29, 36, 0.95) inset !important;
          -webkit-text-fill-color: #F9FAFB !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `
      document.head.appendChild(style)
    }
  }, [])

  return (
    <PaperProvider>
      <NotificationProvider>
        <AuthProvider>
          <RootNavigator />
          <NotificationOverlay />
        </AuthProvider>
      </NotificationProvider>
    </PaperProvider>
  )
}
