export const validators = {
  // Email validation
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  // Password strength validation
  password: (password: string): {
    isValid: boolean
    score: number
    feedback: string
  } => {
    let score = 0
    const feedback: string[] = []

    if (password.length < 8) {
      feedback.push('Password harus minimal 8 karakter')
    } else {
      score += 1
    }

    if (/[a-z]/.test(password)) {
      score += 1
    } else {
      feedback.push('Tambahkan huruf kecil')
    }

    if (/[A-Z]/.test(password)) {
      score += 1
    } else {
      feedback.push('Tambahkan huruf besar')
    }

    if (/[0-9]/.test(password)) {
      score += 1
    } else {
      feedback.push('Tambahkan angka')
    }

    if (/[^a-zA-Z0-9]/.test(password)) {
      score += 1
    }

    return {
      isValid: score >= 4,
      score,
      feedback: feedback.join(', '),
    }
  },

  // Phone number validation
  phone: (phone: string): boolean => {
    const phoneRegex = /^(\+62|0)[0-9]{9,12}$/
    return phoneRegex.test(phone.replace(/\D/g, ''))
  },

  // License plate validation (Indonesian format)
  licensePlate: (plate: string): boolean => {
    const plateRegex = /^[A-Z]{1,2} \d{1,4} [A-Z]{1,3}$/
    return plateRegex.test(plate.toUpperCase())
  },

  // URL validation
  url: (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  },

  // Empty string check
  required: (value: string | null | undefined): boolean => {
    return value !== null && value !== undefined && value.trim().length > 0
  },

  // Min length check
  minLength: (value: string, length: number): boolean => {
    return value.length >= length
  },

  // Max length check
  maxLength: (value: string, length: number): boolean => {
    return value.length <= length
  },

  // Number range check
  range: (value: number, min: number, max: number): boolean => {
    return value >= min && value <= max
  },

  // Booking validation
  bookingForm: (data: any): { valid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (!validators.required(data.name)) errors.push('Nama harus diisi')
    if (!validators.required(data.service)) errors.push('Layanan harus dipilih')
    if (!validators.required(data.vehicleType)) errors.push('Jenis kendaraan harus dipilih')
    if (!validators.required(data.vehicleBrand)) errors.push('Merk kendaraan harus diisi')
    if (!validators.required(data.vehiclePlate)) errors.push('Plat nomor harus diisi')
    if (!validators.required(data.date)) errors.push('Tanggal harus dipilih')
    if (!validators.required(data.time)) errors.push('Waktu harus dipilih')

    return { valid: errors.length === 0, errors }
  },

  // Login validation
  loginForm: (email: string, password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (!validators.required(email)) errors.push('Email harus diisi')
    else if (!validators.email(email)) errors.push('Format email tidak valid')

    if (!validators.required(password)) errors.push('Password harus diisi')
    else if (password.length < 6) errors.push('Password minimal 6 karakter')

    return { valid: errors.length === 0, errors }
  },
}
