import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export type NotificationType = 'success' | 'error' | 'info' | 'warning'

export interface Notification {
  id: string
  message: string
  type: NotificationType
  duration?: number
  action?: {
    label: string
    onPress: () => void
  }
}

interface NotificationContextType {
  notifications: Notification[]
  showNotification: (
    message: string,
    type: NotificationType,
    duration?: number,
    action?: { label: string; onPress: () => void }
  ) => void
  removeNotification: (id: string) => void
  clearAll: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const showNotification = useCallback(
    (
      message: string,
      type: NotificationType = 'info',
      duration: number = 3000,
      action?: { label: string; onPress: () => void }
    ) => {
      const id = `${Date.now()}-${Math.random()}`
      const notification: Notification = {
        id,
        message,
        type,
        duration,
        action,
      }

      setNotifications((prev) => {
        // Prevent duplicate messages if the user spams
        if (prev.some(n => n.message === message)) {
          return prev;
        }
        return [...prev, notification];
      })

      if (duration > 0) {
        setTimeout(() => {
          removeNotification(id)
        }, duration)
      }
    },
    []
  )

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        showNotification,
        removeNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider')
  }
  return context
}
