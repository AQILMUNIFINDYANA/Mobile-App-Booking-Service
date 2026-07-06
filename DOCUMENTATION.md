# ESGUL Service Pro - Complete Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Features](#features)
4. [Project Structure](#project-structure)
5. [Setup Instructions](#setup-instructions)
6. [Database Schema](#database-schema)
7. [Authentication](#authentication)
8. [API Endpoints](#api-endpoints)
9. [Real-Time Features](#real-time-features)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

**ESGUL Service Pro** adalah aplikasi mobile dan web untuk workshop servis kendaraan yang memungkinkan:
- **User**: Booking servis, tracking booking, chat dengan admin, edit profil
- **Admin**: Dashboard dengan statistik, manage customer chat, track bookings

**Teknologi**: React Native (Expo), TypeScript, Supabase, Real-time Sync

**Status**: ✅ 100% Real Data (Tidak Ada Dummy Features)

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React Native (Expo), TypeScript |
| UI Framework | React Native Paper, Material Community Icons |
| Backend/Database | Supabase (PostgreSQL) |
| Real-time | Supabase Realtime (postgres_changes) |
| Auth | Supabase Auth (Email/Password) |
| Styling | StyleSheet (React Native) |
| Navigation | React Navigation (Stack + Tabs) |

---

## ✨ Features

### User Features
- ✅ **Authentication**: Sign Up, Sign In, Sign Out
- ✅ **Profile**: View & Edit (name, phone, address) - persists to DB
- ✅ **Booking**: Create booking dengan service real dari database
- ✅ **Booking History**: View semua bookings dari database
- ✅ **Service Catalog**: Browse services dengan pricing real
- ✅ **Chat**: Real-time messaging dengan admin (Supabase Realtime)
- ✅ **Home Dashboard**: View upcoming bookings, popular services

### Admin Features
- ✅ **Dashboard**: Key metrics (total bookings, revenue, services)
- ✅ **Chat Management**: 
  - List users yang pernah kirim pesan
  - Unread count per user
  - Real-time reply ke customers
  - Messages dari users muncul instant

---

## 📁 Project Structure

```
src/
├── screens/
│   ├── auth/
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   └── ForgotPasswordScreen.tsx
│   ├── user/
│   │   ├── HomeScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── BookingScreen.tsx
│   │   ├── BookingHistoryScreen.tsx
│   │   ├── ServiceCatalogScreen.tsx
│   │   ├── ChatScreen.tsx
│   │   └── FeedbackScreen.tsx
│   └── admin/
│       ├── AdminDashboardScreen.tsx
│       └── AdminChatScreen.tsx
├── navigation/
│   └── RootNavigator.tsx
├── context/
│   └── AuthContext.tsx
├── services/
│   ├── supabaseClient.ts
│   └── notificationService.ts
├── components/
│   ├── AuthForm.tsx
│   └── ...
└── App.tsx

supabase.sql → Database schema + seed data
package.json → Dependencies
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js 16+
- npm atau yarn
- Supabase account (gratis: https://supabase.com)
- Expo CLI (opsional untuk testing)

### Step 1: Clone & Install

```bash
git clone <repo-url>
cd esgul-service-pro
npm install
```

### Step 2: Setup Environment

Buat file `.env.local` atau `.env`:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Cara dapat key:
1. Login ke https://app.supabase.com
2. Pilih project
3. Settings → API → copy URL & anon key

### Step 3: Setup Database

1. **Login ke Supabase Dashboard**
2. **Pilih project**
3. **Go to SQL Editor**
4. **Copy semua kode dari `supabase.sql`**
5. **Paste di SQL Editor dan Run**

Ini akan membuat:
- ✅ Semua tables (users, bookings, chat_messages, services, reviews, etc)
- ✅ RLS policies (Row Level Security)
- ✅ Seed data (sample users, services, bookings)
- ✅ Indexes untuk performance

### Step 4: Start Development

```bash
npm start

# Pilih platform:
# - w untuk web
# - i untuk iOS (mac only)
# - a untuk Android
```

---

## 🗄 Database Schema

### Tables

#### 1. `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  phone VARCHAR,
  address TEXT,
  role VARCHAR DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
**Usage**: User profiles, authentication
**Persisted By**: Authentication system + ProfileScreen

---

#### 2. `bookings`
```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  service_id UUID NOT NULL REFERENCES services(id),
  vehicle_type VARCHAR NOT NULL,
  vehicle_brand VARCHAR,
  vehicle_plate VARCHAR,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  notes TEXT,
  status VARCHAR DEFAULT 'Pending',
  total_price INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
**Usage**: Store all bookings
**Persisted By**: BookingScreen.handleSubmit()
**Status Values**: 'Pending', 'Confirmed', 'Completed', 'Cancelled'

---

#### 3. `chat_messages`
```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id),
  receiver_id VARCHAR NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```
**Usage**: Real-time chat between users and admin
**Persisted By**: ChatScreen.sendMessage() + AdminChatScreen.sendMessage()
**receiver_id**: Use 'admin-support-team' for admin messages

---

#### 4. `services`
```sql
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  estimated_duration INTEGER,
  discount_percent INTEGER,
  category VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);
```
**Usage**: Service catalog, pricing
**Seeded**: Yes (Oil Change, Tire Installation, etc)
**Used By**: BookingScreen, ServiceCatalogScreen, HomeScreen

---

#### 5. `reviews`
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  status VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);
```
**Usage**: Customer reviews & ratings
**Used By**: HomeScreen (show review modal)

---

### Row Level Security (RLS)

Semua tabel (kecuali services, mechanics, promotions) menggunakan RLS untuk keamanan:

- **Users**: Can only view & edit own profile
- **Bookings**: Can only view & edit own bookings
- **Chat Messages**: Can only view & send messages for themselves
- **Services/Promotions**: Public (no RLS)

---

## 🔐 Authentication

### Flow

1. **Sign Up**
   - User input email & password
   - Supabase creates auth user
   - Automatic create entry di users table
   - Auto login setelah register

2. **Sign In**
   - Email & password
   - Supabase verifies
   - Stored in AsyncStorage
   - Persist across app restarts

3. **Sign Out**
   - Clear AsyncStorage
   - Clear auth session
   - Redirect to LoginScreen

### AuthContext

```typescript
useAuth() returns:
- user: { id, email, name, phone, address }
- logout(): Promise<void>
```

---

## 🌐 API Endpoints (Supabase)

### Read Operations
```typescript
// Get user profile
supabase.from('users').select('*').eq('id', user_id).single()

// Get user's bookings
supabase.from('bookings').select('*').eq('user_id', user_id)

// Get all services
supabase.from('services').select('*')

// Get chat messages
supabase.from('chat_messages').select('*')
  .or(`sender_id.eq.${id},receiver_id.eq.${id}`)
```

### Write Operations
```typescript
// Save booking
supabase.from('bookings').insert({...booking_data})

// Update profile
supabase.from('users').update({...updates}).eq('id', user_id)

// Send message
supabase.from('chat_messages').insert({...message})
```

---

## 🔄 Real-Time Features

### User Chat (ChatScreen)
```typescript
// Subscribe to incoming messages dari admin
supabase.channel('chat_updates')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'chat_messages',
    filter: `receiver_id.eq.${user_id}`
  }, (payload) => {
    // Message appears instantly!
  })
  .subscribe()
```

### Admin Chat (AdminChatScreen)
```typescript
// Subscribe to incoming messages dari users
supabase.channel('admin_chat_updates')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'chat_messages',
    filter: `receiver_id.eq.admin-support-team`
  }, (payload) => {
    // User message appears instantly!
  })
  .subscribe()
```

---

## 🔧 Troubleshooting

### Problem: Blank white screen on web
**Solution**: Make sure `index.js` exists with `registerRootComponent(App)`

### Problem: "ReactDOM.render is not a function"
**Solution**: React 18 must pair with React DOM 18, not 19
```json
"react": "^18.2.0",
"react-dom": "^18.2.0"
```

### Problem: Chat not syncing
**Solution**: Make sure Supabase Realtime is enabled
1. Go to Supabase Dashboard
2. Settings → Realtime → Enable on chat_messages table

### Problem: Can't see data in database
**Solution**: Check RLS policies
1. Go to Supabase Dashboard
2. SQL Editor → Run `SELECT * FROM users WHERE id = 'your-id'`
3. Make sure auth user matches

### Problem: Booking not saving
**Solution**: Check if user_id matches auth user
- BookingScreen should use `useAuth().user?.id`
- Not hardcoded IDs

---

## 📱 UI Colors & Theme

| Color | Hex | Usage |
|-------|-----|-------|
| Primary | #8B6914 | Buttons, accents |
| Dark BG | #1f1f1f | Container background |
| Card | #2a2a2a | Cards, modals |
| Border | #3a3a3a | Dividers, borders |
| Text | #ffffff | Main text |
| Secondary Text | #b0b0b0 | Labels, subtitles |
| Danger | #FF5252 | Logout, errors |

---

## 🎨 Navigation Structure

```
RootNavigator
├── AuthNavigator (if not logged in)
│   ├── LoginScreen
│   ├── RegisterScreen
│   └── ForgotPasswordScreen
└── MainNavigator (if logged in)
    ├── UserNavigator (role === 'user')
    │   ├── UserTabNavigator
    │   │   ├── HomeScreen
    │   │   ├── BookingScreen
    │   │   ├── ServiceCatalogScreen
    │   │   ├── ProfileScreen
    │   │   └── FeedbackScreen
    │   └── ChatScreen (stack overlay)
    │
    └── AdminNavigator (role === 'admin')
        └── AdminTabNavigator
            ├── AdminDashboardScreen
            └── AdminChatScreen
```

---

## 📊 Data Flow

### Booking Flow
```
1. User opens BookingScreen
2. fetchServices() → Load dari services table
3. User fills form
4. Click "Confirm Booking"
5. handleSubmit() → Insert to bookings table
6. Auto-redirect to BookingHistory
7. BookingHistoryScreen fetches & shows data
```

### Chat Flow
```
1. User opens ChatScreen
2. loadMessages() → Load dari chat_messages table
3. Subscribe to realtime → listen for admin replies
4. User types & sends message
5. Insert to chat_messages table
6. AdminChatScreen gets notification instantly
7. Admin replies
8. User receives reply instantly via realtime
9. Both persist in database
```

### Profile Flow
```
1. User opens ProfileScreen
2. loadUserProfile() → Load dari users table
3. Click edit icon
4. Type changes
5. Click "Save Changes"
6. handleSave() → Update users table
7. Confirm with success alert
```

---

## 🧪 Testing Checklist

### Authentication
- [ ] Register new user
- [ ] Login with email/password
- [ ] Logout → goes to LoginScreen
- [ ] Persist login across app restart

### Profile
- [ ] Edit name, phone, address
- [ ] Click Save
- [ ] Close & reopen app → data persists
- [ ] Logout button shows confirmation modal

### Booking
- [ ] Open Booking tab
- [ ] Services dropdown shows real services
- [ ] Fill all required fields
- [ ] Click "Confirm Booking"
- [ ] See "Booking..." state
- [ ] Auto-redirect to BookingHistory
- [ ] New booking appears in history

### Chat
- [ ] Open Chat from Home
- [ ] Send message
- [ ] Message appears in chat
- [ ] Go to Supabase → check chat_messages table
- [ ] Admin replies from AdminChatScreen
- [ ] Reply appears instantly in UserChat
- [ ] Refresh page → all messages persist

### Admin
- [ ] Login as admin
- [ ] Dashboard shows real stats
- [ ] Go to Chat tab
- [ ] See list of users
- [ ] Click user → see conversation
- [ ] Type & send reply
- [ ] Reply saves to database
- [ ] User sees reply instantly

---

## 📞 Support

Untuk issues atau pertanyaan:
1. Check Supabase logs: https://app.supabase.com → Logs
2. Check React Native errors: Metro bundler console
3. Check database: Supabase SQL Editor

---

## 📝 License

Private Project - ESGUL Workshop

---

**Last Updated**: 2026-04-22
**Status**: ✅ Production Ready (All Real Data)
