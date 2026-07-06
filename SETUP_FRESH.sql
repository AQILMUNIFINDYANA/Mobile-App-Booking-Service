-- ============================================================================
-- ESGUL Service Pro - FRESH DATABASE SETUP (Clean Version)
-- ============================================================================
-- THIS IS THE DEFINITIVE VERSION - Use this if tables are corrupted
-- 
-- INSTRUCTIONS:
-- 1. Go to https://app.supabase.com
-- 2. Select your Supabase project
-- 3. Go to SQL Editor
-- 4. Copy ALL code from this file
-- 5. Click "Run without RLS" (IMPORTANT!)
-- 6. Wait for completion
-- 7. Done!
-- ============================================================================

-- ============================================================================
-- STEP 0: DROP ALL EXISTING TABLES (Clean Slate)
-- ============================================================================
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS promotions CASCADE;
DROP TABLE IF EXISTS mechanics CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- STEP 1: ENABLE EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- STEP 2: CREATE TABLES (Fresh)
-- ============================================================================

-- Users Table - NO RLS (Supabase Auth needs access)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  phone VARCHAR DEFAULT '',
  address TEXT DEFAULT '',
  role VARCHAR DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE users IS 'User profiles (no RLS - Supabase Auth needs access)';
COMMENT ON COLUMN users.role IS 'user = customer, admin = workshop staff';

-- Services Table - Public read (no RLS)
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  estimated_duration INTEGER DEFAULT 0,
  discount_percent INTEGER DEFAULT 0,
  category VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE services IS 'Available workshop services';
COMMENT ON COLUMN services.price IS 'Price in IDR (Indonesian Rupiah)';

-- Bookings Table - WITH RLS
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  vehicle_type VARCHAR NOT NULL,
  vehicle_brand VARCHAR DEFAULT '',
  vehicle_plate VARCHAR DEFAULT '',
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  notes TEXT DEFAULT '',
  status VARCHAR DEFAULT 'Pending' CHECK (status IN ('Pending', 'Confirmed', 'Completed', 'Cancelled')),
  total_price INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE bookings IS 'Customer service bookings (RLS enabled)';

-- Chat Messages Table - WITH RLS
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id VARCHAR NOT NULL,
  message TEXT NOT NULL CHECK (LENGTH(message) <= 500),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE chat_messages IS 'Real-time chat messages (RLS enabled)';

-- Reviews Table - WITH RLS
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  status VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE reviews IS 'Customer reviews (RLS enabled)';

-- Mechanics Table - Optional (no RLS)
CREATE TABLE mechanics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  bio TEXT,
  specialty VARCHAR,
  image_url VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Promotions Table - Optional (no RLS)
CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR UNIQUE NOT NULL,
  discount_percent INTEGER,
  active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications Table - WITH RLS
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- STEP 3: CREATE INDEXES
-- ============================================================================
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX idx_chat_messages_receiver_id ON chat_messages(receiver_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX idx_reviews_booking_id ON reviews(booking_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_users_email ON users(email);

-- ============================================================================
-- STEP 4: ENABLE RLS (On specific tables only)
-- ============================================================================
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE mechanics DISABLE ROW LEVEL SECURITY;
ALTER TABLE promotions DISABLE ROW LEVEL SECURITY;

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 5: CREATE RLS POLICIES (Only for protected tables)
-- ============================================================================

-- Bookings: Users can view own bookings
CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  USING (user_id = auth.uid());

-- Bookings: Admin can view all bookings
CREATE POLICY "Admin can view all bookings"
  ON bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Bookings: Users can create own bookings
CREATE POLICY "Users can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Bookings: Users can update own bookings
CREATE POLICY "Users can update own bookings"
  ON bookings FOR UPDATE
  USING (user_id = auth.uid());

-- Bookings: Admin can update all bookings
CREATE POLICY "Admin can update all bookings"
  ON bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Chat Messages: Users can view own chats
CREATE POLICY "Users can view own chats"
  ON chat_messages FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = CAST(auth.uid() AS VARCHAR));

-- Chat Messages: Users can send messages
CREATE POLICY "Users can send messages"
  ON chat_messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- Reviews: Users can view own reviews
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
CREATE POLICY "Admin can view all reviews"
  ON reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Reviews: Users can create reviews
CREATE POLICY "Users can create reviews for own bookings"
  ON reviews FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = reviews.booking_id 
      AND bookings.user_id = auth.uid()
    )
  );

-- Notifications: Users can view own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================================
-- STEP 6: SEED DATA
-- ============================================================================

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

INSERT INTO mechanics (name, bio, specialty, image_url) VALUES
  ('Budi Santoso', 'Senior mechanic with 10+ years of experience', 'Mobil', 'https://via.placeholder.com/150?text=Budi'),
  ('Rakhman Wijaya', 'Expert motorcycle mechanic', 'Motor', 'https://via.placeholder.com/150?text=Rakhman'),
  ('Adi Gunawan', 'Electrical systems specialist', 'Elektrik', 'https://via.placeholder.com/150?text=Adi')
ON CONFLICT DO NOTHING;

INSERT INTO promotions (code, discount_percent, active, expires_at) VALUES
  ('SAVE20', 20, TRUE, NOW() + INTERVAL '30 days'),
  ('WELCOME10', 10, TRUE, NOW() + INTERVAL '7 days'),
  ('SPRING15', 15, TRUE, NOW() + INTERVAL '60 days')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 7: VERIFY
-- ============================================================================

-- Run these to verify everything is created:
-- SELECT COUNT(*) FROM users;
-- SELECT COUNT(*) FROM services;
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('users', 'bookings', 'services');

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
-- Database is ready. Now:
-- 1. Restart your app (npm start)
-- 2. Login with your admin@esgul.com account
-- 3. Everything should work!
