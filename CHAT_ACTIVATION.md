# 🚀 AKTIVASI CHAT FEATURE - STEP BY STEP

## ⚡ Quick Checklist

Untuk activate Chat feature, ikuti langkah-langkah ini:

### 1️⃣ Database Setup (5 menit)

**Supabase Console:**
- [ ] Pergi ke SQL Editor
- [ ] Copy-paste `supabase.sql` dari project
- [ ] Klik **RUN**
- [ ] Tunggu sampai selesai

**Verify:**
```sql
SELECT * FROM chat_messages LIMIT 1;  -- Harus ada table
SELECT COUNT(*) FROM chat_messages;   -- Harus 0 (empty)
```

### 2️⃣ RLS Policies (2 menit)

**Supabase Console → Authentication → Policies:**
- [ ] Verify ada policy: "Users can view own chat messages"
- [ ] Verify ada policy: "Users can send messages"
- [ ] Verify ada policy: "Admin can receive messages"

### 3️⃣ Test User Setup (1 menit)

Buat 2 test accounts:
- [ ] **User Account:** user@example.com / Pass@123456
- [ ] **Admin Account:** admin@example.com / Pass@123456

**Update admin user role:**
```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

### 4️⃣ App Test (5 menit)

**Terminal 1 - User Test:**
```bash
npm start  # atau expo start
# Login dengan user@example.com
# Open Chat screen
# Send: "Hello, I need help with booking"
```

**Terminal 2 - Admin Test:**
```bash
# Login dengan admin@example.com
# Open Admin Dashboard → Chat
# Should see message from user@example.com
# Reply: "Hi! How can I help?"
```

### 5️⃣ Verify Real-time (2 menit)

- [ ] User side: instantly lihat admin reply
- [ ] Admin side: instantly lihat user message
- [ ] Messages persist saat refresh
- [ ] Date separators muncul correct

---

## 🐛 Common Issues & Fix

### Issue: "Table chat_messages doesn't exist"

**Fix:**
```sql
-- Run ini di Supabase SQL Editor
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id VARCHAR NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Issue: "Permission denied for schema public"

**Fix:**
- Go to Supabase Console → Authentication → RLS
- Disable RLS temporarily untuk test
- Enable kembali setelah test working

### Issue: "Message not sending"

**Debug:**
```typescript
// Add di ChatScreen.tsx untuk debug
console.log('Sending to:', 'admin-support-team')
console.log('From:', user?.id)
console.log('Message:', newMessage)
```

---

## 📱 Testing Scenarios

### Scenario 1: Basic Message

```
User: "How much is oil change?"
✅ Message visible in user chat
✅ Admin see notification
✅ Admin reply: "Rp 150.000"
✅ User see reply instantly
```

### Scenario 2: Long Conversation

```
User: Message 1
User: Message 2
Admin: Reply 1
Admin: Reply 2
✅ All messages shown in correct order
✅ Date separators visible
✅ Scroll smooth
```

### Scenario 3: Read Status

```
Admin: Send message
User: Open chat
✅ Message marked as read
✅ Admin see read status update
```

---

## ✅ Final Verification

Sebelum go-live:

- [ ] Chat screen load without error
- [ ] Send message working
- [ ] Receive message working
- [ ] Real-time update instant
- [ ] Read status working
- [ ] History persist after app close
- [ ] No console errors
- [ ] Admin dashboard chat working
- [ ] Notification system integration
- [ ] Database backup ready

---

## 🚀 Production Deployment

1. **Backup database** di Supabase
2. **Run migration** (supabase.sql)
3. **Test thoroughly** di staging
4. **Monitor logs** first 24 hours
5. **Have rollback plan** ready

---

## 📞 Support Contact

**Issues?**
- Check CHAT_FEATURE_GUIDE.md untuk detailed docs
- Check browser console untuk error logs
- Check Supabase dashboard untuk database status

**Success?** 🎉
- You can now:
  - Users chat dengan admin
  - Admin manage customer inquiries
  - Real-time communication
  - Message history stored

---

**Created:** 27 Mei 2026
**Status:** Ready for Deployment ✅
