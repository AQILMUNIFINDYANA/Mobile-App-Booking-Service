export type UserRole = 'user' | 'admin'

export interface User {
  id: string
  email: string
  name: string
  phone: string
  address: string
  role: UserRole
  created_at: string
}

export interface Service {
  id: string
  title: string
  description: string
  price: number
  estimated_duration?: number
  category: string
  created_at: string
}

export interface Booking {
  id: string
  user_id: string
  service_id: string
  vehicle_type: 'Mobil' | 'Motor'
  status: 'Pending' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled' | 'Menunggu Konfirmasi' | 'Dikonfirmasi' | 'Sedang Dikerjakan' | 'Selesai' | 'Dibatalkan'
  booking_date: string
  booking_time: string
  vehicle_brand?: string
  vehicle_plate?: string
  notes?: string
  total_price?: number
  queue_number?: number
  order_number?: string
  created_at?: string
  services?: {
    title: string
    price: number
    estimated_duration?: number
  }
  rating?: number
}

export interface Promotion {
  id: string
  code: string
  discount_percent: number
  active: boolean
  expires_at: string
  created_at: string
}

export interface ChatMessage {
  id: string
  sender_id: string
  receiver_id: string
  message: string
  reply_to_id?: string
  location_data?: {
    latitude: number
    longitude: number
  }
  read: boolean
  created_at: string
}

export interface Review {
  id: string
  booking_id: string
  rating: number
  review_text: string
  status: 'Sudah Aman' | 'Ada Masalah'
  created_at: string
}

export interface Mechanic {
  id: string
  name: string
  bio: string
  specialty: string
  image_url: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: 'service_update' | 'booking_reminder' | 'promotion' | 'maintenance_reminder'
  message: string
  read: boolean
  created_at: string
}
