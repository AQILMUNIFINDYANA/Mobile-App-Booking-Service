-- ESGUL Service Pro - Complete Database Schema with RLS
-- Last Updated: 27 Mei 2026

-- Drop old policies if they exist (to avoid conflicts on re-run)
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can view own chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can send messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can mark messages read" ON chat_messages;
DROP POLICY IF EXISTS "Admin can receive messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can create reviews" ON reviews;
DROP POLICY IF EXISTS "Users can view reviews for their bookings" ON reviews;

-- Drop tables if they exist (cascade to remove dependencies)
-- WARNING: This will delete all data - only use on development/testing
-- For production, use migrations instead
-- DROP TABLE IF EXISTS chat_messages CASCADE;
-- DROP TABLE IF EXISTS bookings CASCADE;
-- DROP TABLE IF EXISTS reviews CASCADE;
-- DROP TABLE IF EXISTS notifications CASCADE;
-- DROP TABLE IF EXISTS services CASCADE;
-- DROP TABLE IF EXISTS mechanics CASCADE;
-- DROP TABLE IF EXISTS promotions CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- 1. Users Table (linked to auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  phone VARCHAR,
  address TEXT,
  role VARCHAR DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Services Table
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  duration_minutes INTEGER,
  discount_percent INTEGER,
  category VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id),
  vehicle_type VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'Pending',
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  vehicle_brand VARCHAR,
  vehicle_plate VARCHAR,
  notes TEXT,
  total_price INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id VARCHAR NOT NULL,
  message TEXT NOT NULL,
  reply_to_id UUID REFERENCES chat_messages(id),
  location_data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  status VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Promotions Table
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR UNIQUE NOT NULL,
  discount_percent INTEGER,
  active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Mechanics Table
CREATE TABLE IF NOT EXISTS mechanics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  bio TEXT,
  specialty VARCHAR,
  image_url VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 8. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- INDEXES for Performance
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_receiver_id ON chat_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON reviews(booking_id);

-- SEED DATA
-- Insert demo services
INSERT INTO services (title, description, price, duration_minutes, category) VALUES
  ('Oil Change', 'Complete oil and filter replacement for your vehicle', 150000, 30, 'Maintenance'),
  ('Tire Installation', 'Professional tire installation and balancing service', 200000, 45, 'Parts'),
  ('Battery Replacement', 'Replace vehicle battery with high-quality alternatives', 350000, 20, 'Parts'),
  ('Full Service', 'Complete vehicle maintenance and comprehensive checkup', 500000, 120, 'Maintenance'),
  ('Brake Pad Replacement', 'Replace worn brake pads with quality parts', 250000, 40, 'Maintenance')
ON CONFLICT DO NOTHING;

-- Insert demo mechanics
INSERT INTO mechanics (name, bio, specialty, image_url) VALUES
  ('Budi Santoso', 'Senior mechanic with 10+ years of experience in car repairs', 'Mobil', 'https://via.placeholder.com/150?text=Budi'),
  ('Rakhman Wijaya', 'Expert motorcycle mechanic specializing in performance tuning', 'Motor', 'https://via.placeholder.com/150?text=Rakhman')
ON CONFLICT DO NOTHING;

-- Insert demo promotions
INSERT INTO promotions (code, discount_percent, active, expires_at) VALUES
  ('SAVE20', 20, TRUE, NOW() + INTERVAL '30 days'),
  ('WELCOME10', 10, TRUE, NOW() + INTERVAL '7 days'),
  ('SPRING15', 15, TRUE, NOW() + INTERVAL '60 days')
ON CONFLICT DO NOTHING;

-- Row Level Security Policies

-- Create trigger function for auto-create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'name', new.email), 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Disable RLS on public tables
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE mechanics DISABLE ROW LEVEL SECURITY;
ALTER TABLE promotions DISABLE ROW LEVEL SECURITY;

-- Users Policies
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Bookings Policies
CREATE POLICY "Users can view own bookings" ON bookings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create bookings" ON bookings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own bookings" ON bookings
  FOR UPDATE USING (user_id = auth.uid());

-- Chat Messages Policies
CREATE POLICY "Users can view own chat messages" ON chat_messages
  FOR SELECT USING (
    sender_id = auth.uid() OR receiver_id::uuid = auth.uid()
  );

CREATE POLICY "Users can send messages" ON chat_messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can mark messages read" ON chat_messages
  FOR UPDATE USING (receiver_id::uuid = auth.uid()) 
  WITH CHECK (receiver_id::uuid = auth.uid());

CREATE POLICY "Admin can receive messages" ON chat_messages
  FOR SELECT USING (
    receiver_id = 'admin-support-team' OR 
    sender_id = auth.uid()
  );

-- Notifications Policies
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Reviews Policies
CREATE POLICY "Users can create reviews" ON reviews
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view reviews for their bookings" ON reviews
  FOR SELECT USING (true);