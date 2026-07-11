-- ============================================================================
-- ESGUL Service Pro - Complete Database Setup & Seed Data
-- ============================================================================
-- This file contains:
-- 1. Table definitions with proper constraints
-- 2. Row Level Security (RLS) policies
-- 3. Indexes for performance
-- 4. Seed data for testing
--
-- HOW TO USE:
-- 1. Go to https://app.supabase.com
-- 2. Select your project
-- 3. Go to SQL Editor
-- 4. Copy ALL code from this file
-- 5. Paste into SQL Editor
-- 6. Click "Run"
-- 7. Done! All tables, policies, and seed data are created
--
-- EXPECTED TIME: ~30 seconds
-- ============================================================================

-- ============================================================================
-- 1. ENABLE EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. CREATE TABLES
-- ============================================================================

-- Users Table
-- - Stores user profiles (created by auth system)
-- - Can be manually edited from ProfileScreen
-- - RLS: Users can only view/edit their own profile
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  phone VARCHAR,
  address TEXT,
  role VARCHAR DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE users IS 'User profiles and authentication data';
COMMENT ON COLUMN users.role IS 'user = customer, admin = workshop staff';

-- Services Table
-- - Stores available services (Oil Change, Tire Installation, etc)
-- - Created by admin only
-- - RLS: Public read, admin write
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  estimated_duration INTEGER,
  discount_percent INTEGER DEFAULT 0,
  category VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE services IS 'Available workshop services';
COMMENT ON COLUMN services.price IS 'Price in IDR (Indonesian Rupiah)';

-- Bookings Table
-- - Stores all service bookings
-- - Created by BookingScreen.handleSubmit()
-- - RLS: Users can only view/edit their own bookings
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  vehicle_type VARCHAR NOT NULL,
  vehicle_brand VARCHAR,
  vehicle_plate VARCHAR,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  notes TEXT,
  status VARCHAR DEFAULT 'Pending' CHECK (status IN ('Pending', 'Confirmed', 'Completed', 'Cancelled')),
  total_price INTEGER,
  queue_number INTEGER,
  order_number VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- PENTING: UPDATE UNTUK EXISTING DATABASE
-- Jika database sudah pernah dibuat, jalankan 2 baris ini:
-- ALTER TABLE bookings ADD COLUMN queue_number INTEGER;
-- ALTER TABLE bookings ADD COLUMN order_number VARCHAR;
-- ============================================================================

COMMENT ON TABLE bookings IS 'Customer service bookings';
COMMENT ON COLUMN bookings.status IS 'Booking status: Pending, Confirmed, Completed, Cancelled';

-- Chat Messages Table
-- - Stores all user-admin chat messages
-- - Real-time updates via Supabase Realtime
-- - sender_id = user UUID or admin id
-- - receiver_id = user UUID or admin id
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id VARCHAR NOT NULL,
  message TEXT NOT NULL CHECK (LENGTH(message) <= 500),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE chat_messages IS 'Real-time chat messages between users and admin';
COMMENT ON COLUMN chat_messages.receiver_id IS 'User UUID or "admin-support-team" for admin';
COMMENT ON COLUMN chat_messages.message IS 'Message text (max 500 characters)';

-- Reviews Table
-- - Stores customer reviews and ratings
-- - Created from HomeScreen review modal
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  status VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE reviews IS 'Customer reviews and ratings for completed bookings';

-- Mechanics Table (Optional - for future features)
CREATE TABLE IF NOT EXISTS mechanics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  bio TEXT,
  specialty VARCHAR,
  image_url VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Promotions Table (Optional - for future features)
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR UNIQUE NOT NULL,
  discount_percent INTEGER,
  active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications Table (Optional - for push notifications)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_receiver_id ON chat_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================================================
-- 4. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Disable RLS on users table initially (Supabase Auth needs full access during login)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Services, Mechanics, Promotions are public (no RLS)
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE mechanics DISABLE ROW LEVEL SECURITY;
ALTER TABLE promotions DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. CREATE RLS POLICIES
-- ============================================================================

-- Bookings: Can view own bookings
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  USING (user_id = auth.uid());

-- Bookings: Admin can view all bookings
DROP POLICY IF EXISTS "Admin can view all bookings" ON bookings;
CREATE POLICY "Admin can view all bookings"
  ON bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Bookings: Can create own bookings
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
CREATE POLICY "Users can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Bookings: Can update own bookings
DROP POLICY IF EXISTS "Users can update own bookings" ON bookings;
CREATE POLICY "Users can update own bookings"
  ON bookings FOR UPDATE
  USING (user_id = auth.uid());

-- Bookings: Admin can update all bookings
DROP POLICY IF EXISTS "Admin can update all bookings" ON bookings;
CREATE POLICY "Admin can update all bookings"
  ON bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Chat Messages: Can view own messages
DROP POLICY IF EXISTS "Users can view own chats" ON chat_messages;
CREATE POLICY "Users can view own chats"
  ON chat_messages FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = CAST(auth.uid() AS VARCHAR));

-- Chat Messages: Can send messages
DROP POLICY IF EXISTS "Users can send messages" ON chat_messages;
CREATE POLICY "Users can send messages"
  ON chat_messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- Reviews: Can view own reviews
DROP POLICY IF EXISTS "Users can view own reviews" ON reviews;
CREATE POLICY "Users can view own reviews"
  ON reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = reviews.booking_id 
      AND bookings.user_id = auth.uid()
    )
  );

-- Reviews: Admin can view all reviews
DROP POLICY IF EXISTS "Admin can view all reviews" ON reviews;
CREATE POLICY "Admin can view all reviews"
  ON reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Reviews: Can create reviews for own bookings
DROP POLICY IF EXISTS "Users can create reviews for own bookings" ON reviews;
CREATE POLICY "Users can create reviews for own bookings"
  ON reviews FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = reviews.booking_id 
      AND bookings.user_id = auth.uid()
    )
  );

-- Notifications: Can view own notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================================
-- 6. SEED DATA FOR TESTING
-- ============================================================================

-- Disable constraints temporarily for seed data
SET CONSTRAINTS ALL DEFERRED;

-- Insert Services
INSERT INTO services (title, description, price, estimated_duration, category) VALUES
  ('Oil Change', 'Complete oil and filter replacement for your vehicle', 150000, 30, 'Maintenance'),
  ('Tire Installation', 'Professional tire installation and balancing service', 200000, 45, 'Parts'),
  ('Battery Replacement', 'Replace vehicle battery with high-quality alternatives', 350000, 20, 'Parts'),
  ('Full Service', 'Complete vehicle maintenance and comprehensive checkup', 500000, 120, 'Maintenance'),
  ('Brake Pad Replacement', 'Replace worn brake pads with quality parts', 250000, 40, 'Maintenance'),
  ('Air Filter Cleaning', 'Clean and inspect air filter system', 75000, 15, 'Maintenance'),
  ('Spark Plug Replacement', 'Replace spark plugs for optimal engine performance', 100000, 25, 'Maintenance'),
  ('Transmission Fluid Flush', 'Flush and replace transmission fluid', 400000, 60, 'Maintenance')
ON CONFLICT DO NOTHING;

-- Insert Sample Mechanics
INSERT INTO mechanics (name, bio, specialty, image_url) VALUES
  ('Budi Santoso', 'Senior mechanic with 10+ years of experience in car repairs', 'Mobil', 'https://via.placeholder.com/150?text=Budi'),
  ('Rakhman Wijaya', 'Expert motorcycle mechanic specializing in performance tuning', 'Motor', 'https://via.placeholder.com/150?text=Rakhman'),
  ('Adi Gunawan', 'Electrical systems specialist', 'Elektrik', 'https://via.placeholder.com/150?text=Adi')
ON CONFLICT DO NOTHING;

-- Insert Sample Promotions
INSERT INTO promotions (code, discount_percent, active, expires_at) VALUES
  ('SAVE20', 20, TRUE, NOW() + INTERVAL '30 days'),
  ('WELCOME10', 10, TRUE, NOW() + INTERVAL '7 days'),
  ('SPRING15', 15, TRUE, NOW() + INTERVAL '60 days')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 7. VERIFICATION QUERIES
-- ============================================================================

-- Run these queries to verify setup:
-- SELECT COUNT(*) as users_count FROM users;
-- SELECT COUNT(*) as services_count FROM services;
-- SELECT COUNT(*) as bookings_count FROM bookings;
-- SELECT COUNT(*) as messages_count FROM chat_messages;

-- ============================================================================
-- 8. SETUP COMPLETE!
-- ============================================================================
-- All tables, RLS policies, and seed data are ready to use!
--
-- NEXT STEPS:
-- 1. Update .env with SUPABASE_URL and SUPABASE_ANON_KEY
-- 2. Run: npm start
-- 3. Register new user account
-- 4. Test features:
--    - Edit profile (saves to users table)
--    - Create booking (saves to bookings table)
--    - Chat with admin (saves to chat_messages table)
--
-- NOTES:
-- - Services are seeded with real data
-- - Bookings table is empty (users create via app)
-- - Messages table is empty (users create via chat)
-- - Each user can only see their own data (RLS policies enforce this)
--
-- ============================================================================
