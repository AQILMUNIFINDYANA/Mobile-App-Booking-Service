# Notification System Guide

Notification system untuk sensitive actions (booking, review, chat, profile update, dll) sudah implemented!

## Architecture

```
NotificationContext (global state management)
    ↓
NotificationOverlay (UI component - renders notifications)
    ↓
useNotification (custom hook - easy to use di screens)
```

## Features

✅ **Toast notifications** - Auto-disappear (configurable duration)
✅ **Banner notifications** - Top priority alerts (sticky until dismissed)
✅ **Type-specific styling** - success, error, warning, info dengan icon & color berbeda
✅ **Action buttons** - Optional action pada notification (misal "Retry", "View", dll)

## Usage in Screens

### Basic Usage

```tsx
import { useNotification } from '../../context/NotificationContext'

export const MyScreen = () => {
  const { showNotification } = useNotification()

  const handleAction = async () => {
    try {
      // Do something
      showNotification('Success!', 'success', 3000)
    } catch (error) {
      showNotification('Error occurred', 'error', 4000)
    }
  }

  return <View>{/* content */}</View>
}
```

### Using Predefined Messages

```tsx
import { SensitiveActionMessages } from '../../utils/notificationHelper'

// Success notification
showNotification(SensitiveActionMessages.booking.success, 'success')

// Error notification
showNotification(SensitiveActionMessages.booking.error, 'error')

// Validation error
showNotification(SensitiveActionMessages.validationError, 'warning')

// Network error
showNotification(SensitiveActionMessages.networkError, 'error')
```

### With Action Button

```tsx
showNotification(
  'Booking failed. Retry?',
  'error',
  5000,
  {
    label: 'Retry',
    onPress: () => {
      handleSubmit() // retry the action
    }
  }
)
```

## Notification Types & Styling

| Type    | Color    | Icon            | Duration |
|---------|----------|-----------------|----------|
| success | #4CAF50  | check-circle    | 3000ms   |
| error   | #F44336  | alert-circle    | 4000ms   |
| warning | #FF9800  | alert           | 3000ms   |
| info    | #2196F3  | information     | 3000ms   |

## Predefined Messages

Location: `src/utils/notificationHelper.ts`

```tsx
SensitiveActionMessages = {
  booking: { success: '✓ Booking berhasil disimpan', error: '✗ Gagal menyimpan booking' },
  review: { success: '✓ Review berhasil dikirim', error: '✗ Gagal mengirim review' },
  profileUpdate: { success: '✓ Profil berhasil diperbarui', error: '✗ Gagal memperbarui profil' },
  chatMessage: { success: '✓ Pesan terkirim', error: '✗ Gagal mengirim pesan' },
  payment: { success: '✓ Pembayaran berhasil', error: '✗ Pembayaran gagal' },
  delete: { success: '✓ Berhasil dihapus', error: '✗ Gagal menghapus' },
  networkError: 'Periksa koneksi internet Anda',
  validationError: 'Mohon periksa kembali data Anda',
}
```

## Implemented Screens

✅ **BookingScreen** - booking success/error notifications
✅ **FeedbackScreen** - review submit notifications
✅ **ChatScreen** - message send notifications
✅ **ProfileScreen** - profile update notifications

## How Notifications Render

1. **First notification** (priority) → Banner at top
2. **Additional notifications** (queue) → Toast at bottom (stacked)
3. Auto-dismiss after duration
4. Click action button or swipe to dismiss

## Example from BookingScreen

```tsx
const handleSubmit = async () => {
  if (!formData.serviceId || !formData.vehicleType) {
    showNotification(SensitiveActionMessages.validationError, 'warning')
    return
  }

  try {
    setIsSubmitting(true)
    const { error } = await supabase
      .from('bookings')
      .insert({ /* data */ })

    if (error) throw error

    // Success!
    showNotification(SensitiveActionMessages.booking.success, 'success')
    setFormData({ /* reset */ })
    setTimeout(() => navigation.navigate('BookingHistory'), 500)
  } catch (error: any) {
    const errorMsg = error?.message?.includes('Network')
      ? SensitiveActionMessages.networkError
      : SensitiveActionMessages.booking.error
    showNotification(errorMsg, 'error', 4000)
  } finally {
    setIsSubmitting(false)
  }
}
```

## Adding More Notifications

### Step 1: Add message to `SensitiveActionMessages`
```tsx
// src/utils/notificationHelper.ts
paymentFailed: 'Pembayaran gagal, silakan coba lagi',
```

### Step 2: Use in your screen
```tsx
import { SensitiveActionMessages } from '../../utils/notificationHelper'

showNotification(SensitiveActionMessages.paymentFailed, 'error')
```

## Notes

- All notifications are UI-only (tidak di-save ke database)
- Multiple notifications queue up, first one is banner, rest are toasts
- Durations default to 3000ms, errors default to 4000ms
- Import useNotification hook di setiap screen yang butuh
- NotificationProvider sudah wrap semua di App.tsx
