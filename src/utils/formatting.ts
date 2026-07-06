export const formatters = {
  // Format currency to IDR
  currency: (amount: number): string => {
    return `Rp ${amount.toLocaleString('id-ID')}`
  },

  // Format date to Indonesian format
  date: (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  },

  // Format time
  time: (timeString: string): string => {
    if (!timeString) return ''
    return timeString.substring(0, 5)
  },

  // Format date and time together
  dateTime: (dateString: string, timeString: string): string => {
    return `${formatters.date(dateString)} ${formatters.time(timeString)}`
  },

  // Capitalize first letter
  capitalize: (text: string): string => {
    return text.charAt(0).toUpperCase() + text.slice(1)
  },

  // Format status in Indonesian
  statusLabel: (status: string): string => {
    const statusMap: { [key: string]: string } = {
      Pending: 'Menunggu Konfirmasi',
      Confirmed: 'Dikonfirmasi',
      'In Progress': 'Sedang Dikerjakan',
      Completed: 'Selesai',
      Cancelled: 'Dibatalkan',
    }
    return statusMap[status] || status
  },

  // Get status color
  statusColor: (status: string): string => {
    const colorMap: { [key: string]: string } = {
      Pending: '#FF9800',
      Confirmed: '#2196F3',
      'In Progress': '#4CAF50',
      Completed: '#8BC34A',
      Cancelled: '#F44336',
    }
    return colorMap[status] || '#999'
  },

  // Truncate text
  truncate: (text: string, length: number): string => {
    return text.length > length ? text.substring(0, length) + '...' : text
  },

  // Phone number formatter
  phoneNumber: (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '')
    const match = cleaned.match(/^(\d{1,3})(\d{3})(\d{4})(\d{4})$/)
    if (match) {
      return `+${match[1]} ${match[2]} ${match[3]} ${match[4]}`
    }
    return phone
  },
}
