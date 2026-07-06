import React, { useEffect, useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Snackbar, Card, Text, Button } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useNotification, NotificationType } from '../context/NotificationContext'

const getTypeConfig = (type: NotificationType) => {
  const configs = {
    success: { color: '#4CAF50', icon: 'check-circle' },
    error: { color: '#F44336', icon: 'alert-circle' },
    warning: { color: '#FF9800', icon: 'alert' },
    info: { color: '#2196F3', icon: 'information' },
  }
  return configs[type]
}

export const NotificationOverlay: React.FC = () => {
  const { notifications, removeNotification } = useNotification()
  const [visibleToasts, setVisibleToasts] = useState<Set<string>>(new Set())

  useEffect(() => {
    const newVisible = new Set(notifications.map((n) => n.id))
    setVisibleToasts(newVisible)
  }, [notifications])

  const bannerNotifications = notifications.slice(0, 1)
  const toastNotifications = notifications.slice(1)

  return (
    <SafeAreaView style={styles.container} pointerEvents="box-none" edges={['top']}>
      {/* Banner - untuk notif paling top priority */}
      {bannerNotifications.map((notification) => {
        const config = getTypeConfig(notification.type)
        return (
          <Card key={`banner-${notification.id}`} style={[styles.banner, { borderLeftColor: config.color }]}>
            <View style={styles.bannerContent}>
              <MaterialCommunityIcons name={config.icon as any} size={24} color={config.color} />
              <View style={styles.bannerText}>
                <Text variant="bodyMedium" style={{ fontWeight: '600' }}>
                  {notification.message}
                </Text>
              </View>
              {notification.action && (
                <Button
                  mode="text"
                  compact
                  onPress={() => {
                    notification.action?.onPress()
                    removeNotification(notification.id)
                  }}
                >
                  {notification.action.label}
                </Button>
              )}
            </View>
          </Card>
        )
      })}

      {/* Toast - bottom notifications untuk multiple items */}
      {toastNotifications.map((notification) => {
        const config = getTypeConfig(notification.type)
        return (
          <Snackbar
            key={`toast-${notification.id}`}
            visible={visibleToasts.has(notification.id)}
            onDismiss={() => removeNotification(notification.id)}
            duration={notification.duration || 3000}
            style={[styles.snackbar, { backgroundColor: config.color }]}
            action={
              notification.action
                ? {
                    label: notification.action.label,
                    onPress: notification.action.onPress,
                  }
                : undefined
            }
          >
            <View style={styles.snackbarContent}>
              <MaterialCommunityIcons name={config.icon as any} size={20} color="white" />
              <Text style={styles.snackbarText}>{notification.message}</Text>
            </View>
          </Snackbar>
        )
      })}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    pointerEvents: 'box-none',
  },
  banner: {
    marginHorizontal: 12,
    marginVertical: 8,
    borderLeftWidth: 4,
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  bannerText: {
    flex: 1,
  },
  snackbar: {
    margin: 12,
    borderRadius: 4,
  },
  snackbarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  snackbarText: {
    color: 'white',
    fontSize: 14,
  },
})
