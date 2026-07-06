import { useNotification } from '../context/NotificationContext'

// Helper to use in async operations
export const createNotificationHelper = (showNotification: ReturnType<typeof useNotification>['showNotification']) => ({
  success: (message: string, duration?: number) =>
    showNotification(message, 'success', duration),
  error: (message: string, duration?: number) =>
    showNotification(message, 'error', duration || 4000),
  warning: (message: string, duration?: number) =>
    showNotification(message, 'warning', duration),
  info: (message: string, duration?: number) =>
    showNotification(message, 'info', duration),
  actionable: (
    message: string,
    actionLabel: string,
    onPress: () => void,
    duration?: number
  ) => showNotification(message, 'info', duration, { label: actionLabel, onPress }),
})

// Predefined messages untuk sensitive actions
export const SensitiveActionMessages = {
  booking: {
    success: '✓ Booking berhasil disimpan',
    error: '✗ Gagal menyimpan booking',
  },
  review: {
    success: '✓ Review berhasil dikirim',
    error: '✗ Gagal mengirim review',
  },
  profileUpdate: {
    success: '✓ Profil berhasil diperbarui',
    error: '✗ Gagal memperbarui profil',
  },
  chatMessage: {
    success: '✓ Pesan terkirim',
    error: '✗ Gagal mengirim pesan',
  },
  payment: {
    success: '✓ Pembayaran berhasil',
    error: '✗ Pembayaran gagal',
  },
  delete: {
    success: '✓ Berhasil dihapus',
    error: '✗ Gagal menghapus',
  },
  networkError: 'Periksa koneksi internet Anda',
  validationError: 'Mohon periksa kembali data Anda',
}
