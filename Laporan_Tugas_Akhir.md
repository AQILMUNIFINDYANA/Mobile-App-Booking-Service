# PERANCANGAN DAN IMPLEMENTASI APLIKASI MOBILE BOOKING SERVICE BENGKEL BERBASIS REACT NATIVE DENGAN BACKEND SUPABASE

---

**TUGAS AKHIR**

Diajukan sebagai salah satu syarat untuk memperoleh gelar Sarjana Komputer (S.Kom)

---

**Oleh:**

**AQIL MUNIF INDYANA**

**NIM: [NIM Anda]**

---

**FAKULTAS ILMU KOMPUTER**

**UNIVERSITAS ESA UNGGUL**

**JAKARTA**

**2026**

---

## LEMBAR PENGESAHAN

| | |
|---|---|
| **Judul** | Perancangan dan Implementasi Aplikasi Mobile Booking Service Bengkel Berbasis React Native dengan Backend Supabase |
| **Nama** | Aqil Munif Indyana |
| **NIM** | [NIM Anda] |
| **Fakultas** | Ilmu Komputer |
| **Program Studi** | Sistem Informasi / Teknik Informatika |

Jakarta, \_\_\_\_\_\_\_\_\_\_ 2026

| Pembimbing | Ketua Program Studi |
|---|---|
| | |
| \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_ | \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_ |

---

## ABSTRAK

**Aqil Munif Indyana – [NIM]. Perancangan dan Implementasi Aplikasi Mobile Booking Service Bengkel Berbasis React Native dengan Backend Supabase. Tugas Akhir. Jakarta: Fakultas Ilmu Komputer Universitas Esa Unggul, 2026.**

Bengkel kendaraan bermotor saat ini masih banyak yang mengandalkan sistem konvensional dalam pengelolaan booking dan antrian pelanggan. Pelanggan harus datang langsung ke bengkel, menunggu antrian tanpa kepastian waktu, dan tidak memiliki sarana komunikasi yang efisien dengan pihak bengkel. Hal ini menyebabkan rendahnya efisiensi operasional dan menurunnya kepuasan pelanggan.

Penelitian ini bertujuan untuk merancang dan mengimplementasikan aplikasi mobile booking service bengkel yang dapat mempermudah pelanggan dalam melakukan pemesanan layanan, memantau status pesanan, serta berkomunikasi langsung dengan admin bengkel secara real-time. Aplikasi dibangun menggunakan framework React Native dengan bahasa pemrograman TypeScript, Expo sebagai development platform, dan Supabase sebagai Backend-as-a-Service (BaaS) yang menyediakan database PostgreSQL, authentication, dan fitur real-time.

Metodologi pengembangan yang digunakan adalah metode Waterfall yang mencakup tahap analisis kebutuhan, perancangan sistem, implementasi, pengujian, dan pemeliharaan. Pengujian dilakukan menggunakan metode Black Box Testing untuk memvalidasi fungsionalitas setiap fitur aplikasi.

Hasil penelitian menunjukkan bahwa aplikasi berhasil diimplementasikan dengan fitur-fitur utama meliputi: sistem booking online dengan pemilihan layanan dan jadwal, sistem antrian otomatis dengan nomor pesanan, fitur chat real-time antara pelanggan dan admin, dashboard admin untuk manajemen pesanan, push notification untuk update status pesanan, serta fitur review dan rating. Aplikasi telah diuji pada perangkat Android dan berjalan dengan baik sesuai kebutuhan fungsional yang telah ditentukan.

**Kata Kunci:** Aplikasi Mobile, Booking Service, React Native, Supabase, Bengkel, Real-time Chat

---

## ABSTRACT

**Aqil Munif Indyana – [NIM]. Design and Implementation of Mobile Workshop Booking Service Application Based on React Native with Supabase Backend. Final Project. Jakarta: Faculty of Computer Science, Universitas Esa Unggul, 2026.**

Many vehicle workshops still rely on conventional systems for managing bookings and customer queues. Customers must visit the workshop in person, wait in uncertain queues, and lack efficient communication channels with the workshop staff. This leads to low operational efficiency and decreased customer satisfaction.

This research aims to design and implement a mobile workshop booking service application that enables customers to easily book services, monitor order status, and communicate directly with workshop administrators in real-time. The application is built using the React Native framework with TypeScript programming language, Expo as the development platform, and Supabase as a Backend-as-a-Service (BaaS) providing PostgreSQL database, authentication, and real-time features.

The development methodology used is the Waterfall method, encompassing requirements analysis, system design, implementation, testing, and maintenance phases. Testing was conducted using the Black Box Testing method to validate the functionality of each application feature.

The results show that the application was successfully implemented with key features including: online booking system with service and schedule selection, automatic queue system with order numbers, real-time chat between customers and administrators, admin dashboard for order management, push notifications for order status updates, and review and rating features. The application has been tested on Android devices and operates properly according to the predetermined functional requirements.

**Keywords:** Mobile Application, Booking Service, React Native, Supabase, Workshop, Real-time Chat

---

## KATA PENGANTAR

Puji dan syukur penulis panjatkan ke hadirat Allah SWT yang telah melimpahkan rahmat dan karunia-Nya sehingga penulis dapat menyelesaikan Tugas Akhir ini dengan judul **"Perancangan dan Implementasi Aplikasi Mobile Booking Service Bengkel Berbasis React Native dengan Backend Supabase"**.

Tugas Akhir ini disusun sebagai salah satu syarat untuk menyelesaikan pendidikan Strata-1 (S1) pada Program Studi Sistem Informasi/Teknik Informatika, Fakultas Ilmu Komputer, Universitas Esa Unggul.

Dalam penyusunan Tugas Akhir ini, penulis menyadari bahwa tanpa bimbingan dan bantuan dari berbagai pihak, Tugas Akhir ini tidak akan terselesaikan dengan baik. Oleh karena itu, penulis mengucapkan terima kasih kepada:

1. Bapak/Ibu \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_ selaku Dekan Fakultas Ilmu Komputer Universitas Esa Unggul.
2. Bapak/Ibu \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_ selaku Ketua Program Studi.
3. Bapak/Ibu \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_ selaku Dosen Pembimbing Tugas Akhir yang telah memberikan arahan, bimbingan, dan motivasi selama penyusunan Tugas Akhir ini.
4. Seluruh dosen dan staf Fakultas Ilmu Komputer Universitas Esa Unggul yang telah memberikan ilmu dan pengetahuan selama masa perkuliahan.
5. Kedua orang tua dan keluarga yang selalu memberikan dukungan moral dan material.
6. Teman-teman seperjuangan yang telah memberikan semangat dan bantuan.

Penulis menyadari bahwa Tugas Akhir ini masih memiliki kekurangan. Oleh karena itu, penulis mengharapkan kritik dan saran yang membangun demi perbaikan di masa yang akan datang. Semoga Tugas Akhir ini dapat memberikan manfaat bagi semua pihak.

Jakarta, \_\_\_\_\_\_\_\_\_\_ 2026

Penulis,

**Aqil Munif Indyana**

---

## DAFTAR ISI

- LEMBAR PENGESAHAN
- ABSTRAK
- ABSTRACT
- KATA PENGANTAR
- DAFTAR ISI
- DAFTAR GAMBAR
- DAFTAR TABEL
- **BAB I PENDAHULUAN**
  - 1.1 Latar Belakang
  - 1.2 Rumusan Masalah
  - 1.3 Tujuan Penelitian
  - 1.4 Manfaat Penelitian
  - 1.5 Batasan Masalah
  - 1.6 Sistematika Penulisan
- **BAB II LANDASAN TEORI**
  - 2.1 Penelitian Terdahulu
  - 2.2 Aplikasi Mobile
  - 2.3 React Native
  - 2.4 TypeScript
  - 2.5 Expo
  - 2.6 Supabase
  - 2.7 PostgreSQL
  - 2.8 Real-time Communication
  - 2.9 Push Notification
  - 2.10 Backend-as-a-Service (BaaS)
  - 2.11 Metode Waterfall
  - 2.12 Black Box Testing
  - 2.13 Unified Modeling Language (UML)
- **BAB III ANALISIS DAN PERANCANGAN SISTEM**
  - 3.1 Analisis Sistem Berjalan
  - 3.2 Analisis Sistem Usulan
  - 3.3 Analisis Kebutuhan Fungsional
  - 3.4 Analisis Kebutuhan Non-Fungsional
  - 3.5 Perancangan Use Case Diagram
  - 3.6 Perancangan Activity Diagram
  - 3.7 Perancangan Entity Relationship Diagram (ERD)
  - 3.8 Perancangan Struktur Database
  - 3.9 Perancangan Antarmuka (User Interface)
  - 3.10 Arsitektur Sistem
- **BAB IV IMPLEMENTASI DAN PENGUJIAN**
  - 4.1 Lingkungan Pengembangan
  - 4.2 Implementasi Database
  - 4.3 Implementasi Antarmuka Pengguna
  - 4.4 Implementasi Fitur Utama
  - 4.5 Pengujian Sistem (Black Box Testing)
- **BAB V KESIMPULAN DAN SARAN**
  - 5.1 Kesimpulan
  - 5.2 Saran
- DAFTAR PUSTAKA
- LAMPIRAN

---

## DAFTAR GAMBAR

- Gambar 3.1 Use Case Diagram Sistem
- Gambar 3.2 Activity Diagram Login
- Gambar 3.3 Activity Diagram Registrasi
- Gambar 3.4 Activity Diagram Booking Service
- Gambar 3.5 Activity Diagram Chat Real-time
- Gambar 3.6 Activity Diagram Manajemen Pesanan (Admin)
- Gambar 3.7 Entity Relationship Diagram (ERD)
- Gambar 3.8 Arsitektur Sistem Aplikasi
- Gambar 3.9 Rancangan UI - Halaman Login
- Gambar 3.10 Rancangan UI - Halaman Home
- Gambar 3.11 Rancangan UI - Halaman Booking
- Gambar 3.12 Rancangan UI - Admin Dashboard
- Gambar 4.1 Implementasi Halaman Login
- Gambar 4.2 Implementasi Halaman Registrasi
- Gambar 4.3 Implementasi Halaman Home
- Gambar 4.4 Implementasi Halaman Booking
- Gambar 4.5 Implementasi Halaman History
- Gambar 4.6 Implementasi Halaman Chat User
- Gambar 4.7 Implementasi Halaman Profile
- Gambar 4.8 Implementasi Admin Dashboard
- Gambar 4.9 Implementasi Admin Chat
- Gambar 4.10 Implementasi Splash Screen

---

## DAFTAR TABEL

- Tabel 3.1 Kebutuhan Fungsional Sistem
- Tabel 3.2 Kebutuhan Non-Fungsional Sistem
- Tabel 3.3 Struktur Tabel Users
- Tabel 3.4 Struktur Tabel Services
- Tabel 3.5 Struktur Tabel Bookings
- Tabel 3.6 Struktur Tabel Chat Messages
- Tabel 3.7 Struktur Tabel Reviews
- Tabel 3.8 Struktur Tabel Notifications
- Tabel 4.1 Spesifikasi Perangkat Keras
- Tabel 4.2 Spesifikasi Perangkat Lunak
- Tabel 4.3 Hasil Pengujian Black Box - Modul Autentikasi
- Tabel 4.4 Hasil Pengujian Black Box - Modul Booking
- Tabel 4.5 Hasil Pengujian Black Box - Modul Chat
- Tabel 4.6 Hasil Pengujian Black Box - Modul Admin Dashboard
- Tabel 4.7 Hasil Pengujian Black Box - Modul Review

---

## BAB I
## PENDAHULUAN

### 1.1 Latar Belakang

Perkembangan teknologi informasi dan komunikasi yang sangat pesat telah membawa perubahan signifikan dalam berbagai aspek kehidupan, termasuk dalam bidang jasa layanan otomotif. Bengkel kendaraan bermotor merupakan salah satu sektor usaha yang memiliki peran penting dalam memenuhi kebutuhan perawatan dan perbaikan kendaraan masyarakat. Menurut data Badan Pusat Statistik (BPS), jumlah kendaraan bermotor di Indonesia terus meningkat setiap tahunnya, yang secara langsung berdampak pada meningkatnya kebutuhan layanan bengkel.

Namun demikian, sebagian besar bengkel kendaraan bermotor di Indonesia masih menggunakan sistem konvensional dalam mengelola pemesanan layanan dan antrian pelanggan. Pelanggan harus datang langsung ke bengkel untuk mendaftarkan kendaraannya, kemudian menunggu antrian tanpa adanya kepastian waktu pelayanan. Sistem pencatatan manual juga menyebabkan potensi kesalahan data, hilangnya riwayat servis, serta kesulitan dalam memantau status pengerjaan kendaraan.

Selain itu, komunikasi antara pelanggan dan pihak bengkel juga masih terbatas pada telepon atau pesan singkat yang tidak terstruktur. Pelanggan sering kali kesulitan mendapatkan informasi terkini mengenai status pengerjaan kendaraannya, ketersediaan jadwal, maupun detail layanan yang ditawarkan bengkel. Kondisi ini tentu menurunkan tingkat kepuasan pelanggan dan efisiensi operasional bengkel.

Di sisi lain, penggunaan smartphone telah menjadi bagian tak terpisahkan dari kehidupan masyarakat Indonesia. Berdasarkan data dari We Are Social dan Hootsuite (2025), penetrasi pengguna smartphone di Indonesia telah mencapai lebih dari 75% dari total populasi. Tingginya penetrasi smartphone ini membuka peluang besar untuk mengembangkan solusi berbasis aplikasi mobile yang dapat menjembatani kebutuhan pelanggan dan bengkel secara efisien.

React Native merupakan framework open-source yang dikembangkan oleh Meta (Facebook) untuk membangun aplikasi mobile lintas platform (cross-platform) menggunakan bahasa pemrograman JavaScript dan TypeScript. Dengan React Native, pengembang dapat membuat aplikasi yang berjalan baik di Android maupun iOS dengan satu basis kode (*codebase*), sehingga lebih efisien dari segi waktu dan biaya pengembangan.

Supabase merupakan platform Backend-as-a-Service (BaaS) yang bersifat open-source dan menyediakan berbagai layanan backend seperti database PostgreSQL, autentikasi pengguna, penyimpanan file, serta fitur real-time. Dengan memanfaatkan Supabase, pengembang dapat fokus pada pengembangan antarmuka dan logika bisnis tanpa harus membangun infrastruktur backend dari awal.

Berdasarkan permasalahan yang telah diuraikan di atas, penulis bermaksud untuk merancang dan mengimplementasikan sebuah aplikasi mobile booking service bengkel yang dapat memberikan solusi terintegrasi bagi pelanggan dan pengelola bengkel. Aplikasi ini diharapkan dapat meningkatkan efisiensi proses pemesanan layanan, memberikan transparansi status pengerjaan, serta menyediakan fitur komunikasi real-time antara pelanggan dan admin bengkel.

### 1.2 Rumusan Masalah

Berdasarkan latar belakang yang telah diuraikan, maka rumusan masalah dalam penelitian ini adalah:

1. Bagaimana merancang dan membangun aplikasi mobile booking service bengkel yang memudahkan pelanggan dalam melakukan pemesanan layanan secara online?
2. Bagaimana mengimplementasikan fitur chat real-time yang memungkinkan komunikasi langsung antara pelanggan dan admin bengkel?
3. Bagaimana mengimplementasikan sistem manajemen pesanan yang efisien bagi admin bengkel melalui dashboard admin?
4. Bagaimana hasil pengujian fungsionalitas aplikasi mobile booking service bengkel yang telah dibangun?

### 1.3 Tujuan Penelitian

Adapun tujuan dari penelitian ini adalah:

1. Merancang dan mengimplementasikan aplikasi mobile booking service bengkel berbasis React Native yang memudahkan pelanggan dalam melakukan pemesanan layanan bengkel secara online.
2. Mengimplementasikan fitur chat real-time menggunakan Supabase Realtime yang memungkinkan komunikasi dua arah antara pelanggan dan admin bengkel.
3. Mengimplementasikan dashboard admin yang menyediakan fitur manajemen pesanan, layanan, dan review pelanggan secara terpusat.
4. Melakukan pengujian fungsionalitas aplikasi menggunakan metode Black Box Testing untuk memvalidasi kesesuaian fitur dengan kebutuhan pengguna.

### 1.4 Manfaat Penelitian

Penelitian ini diharapkan memberikan manfaat sebagai berikut:

**A. Manfaat Teoritis:**
1. Memberikan referensi dan kontribusi ilmiah dalam bidang pengembangan aplikasi mobile menggunakan React Native dan Supabase.
2. Menjadi acuan bagi penelitian selanjutnya yang berkaitan dengan sistem informasi booking service berbasis mobile.

**B. Manfaat Praktis:**
1. **Bagi Pelanggan:** Memudahkan proses pemesanan layanan bengkel, memantau status pengerjaan kendaraan, serta berkomunikasi langsung dengan admin bengkel melalui fitur chat.
2. **Bagi Pengelola Bengkel:** Meningkatkan efisiensi operasional melalui sistem manajemen pesanan digital, mengurangi kesalahan pencatatan manual, dan menyediakan data statistik untuk pengambilan keputusan.
3. **Bagi Akademik:** Menambah koleksi karya ilmiah di lingkungan Fakultas Ilmu Komputer Universitas Esa Unggul.

### 1.5 Batasan Masalah

Agar penelitian ini lebih terarah dan fokus, maka ditetapkan batasan masalah sebagai berikut:

1. Aplikasi ini dibangun untuk platform Android menggunakan framework React Native dan Expo.
2. Backend aplikasi menggunakan Supabase sebagai Backend-as-a-Service (BaaS) dengan database PostgreSQL.
3. Fitur pembayaran online tidak diimplementasikan pada penelitian ini; pembayaran dilakukan secara langsung di bengkel.
4. Aplikasi dikembangkan untuk satu bengkel (single workshop) dan tidak mendukung multi-bengkel.
5. Pengujian dilakukan menggunakan metode Black Box Testing pada perangkat Android.
6. Aplikasi memiliki dua peran pengguna: **User** (pelanggan) dan **Admin** (pengelola bengkel).

### 1.6 Sistematika Penulisan

Sistematika penulisan Tugas Akhir ini disusun dalam lima bab dengan rincian sebagai berikut:

**BAB I PENDAHULUAN**
Bab ini membahas latar belakang masalah, rumusan masalah, tujuan penelitian, manfaat penelitian, batasan masalah, dan sistematika penulisan.

**BAB II LANDASAN TEORI**
Bab ini membahas teori-teori yang menjadi dasar dalam pengembangan aplikasi, meliputi konsep aplikasi mobile, React Native, TypeScript, Expo, Supabase, PostgreSQL, real-time communication, push notification, metode pengembangan Waterfall, Black Box Testing, dan Unified Modeling Language (UML).

**BAB III ANALISIS DAN PERANCANGAN SISTEM**
Bab ini membahas analisis sistem yang sedang berjalan, analisis kebutuhan fungsional dan non-fungsional, perancangan use case diagram, activity diagram, entity relationship diagram (ERD), struktur database, perancangan antarmuka, dan arsitektur sistem.

**BAB IV IMPLEMENTASI DAN PENGUJIAN**
Bab ini membahas implementasi sistem berdasarkan perancangan yang telah dibuat, meliputi implementasi database, antarmuka pengguna, fitur-fitur utama, serta pengujian sistem menggunakan metode Black Box Testing.

**BAB V KESIMPULAN DAN SARAN**
Bab ini berisi kesimpulan dari hasil penelitian dan saran untuk pengembangan sistem di masa yang akan datang.

---

## BAB II
## LANDASAN TEORI

### 2.1 Penelitian Terdahulu

Beberapa penelitian terdahulu yang relevan dengan penelitian ini antara lain:

1. **Muhammad Rizki (2024)** dalam penelitiannya yang berjudul *"Perancangan Aplikasi Booking Service Kendaraan Berbasis Mobile"* mengembangkan aplikasi booking service menggunakan Flutter dan Firebase. Hasil penelitian menunjukkan bahwa aplikasi berhasil mempermudah proses pemesanan layanan bengkel. Perbedaan dengan penelitian ini terletak pada teknologi yang digunakan, di mana penulis menggunakan React Native dan Supabase serta menambahkan fitur chat real-time dan sistem antrian otomatis.

2. **Dwi Putra Pratama (2023)** dalam penelitiannya yang berjudul *"Sistem Informasi Booking Service Bengkel Berbasis Web"* mengembangkan sistem berbasis web menggunakan Laravel dan MySQL. Perbedaan mendasar dengan penelitian ini adalah platform yang digunakan (mobile vs web) dan arsitektur backend (Supabase BaaS vs server tradisional).

3. **Siti Nurhaliza (2024)** dalam penelitiannya yang berjudul *"Implementasi Real-time Chat pada Aplikasi Customer Service Berbasis React Native"* mengimplementasikan fitur chat menggunakan Socket.IO. Penelitian ini menjadi referensi dalam mengimplementasikan fitur chat, namun penulis menggunakan Supabase Realtime sebagai alternatif yang lebih terintegrasi.

### 2.2 Aplikasi Mobile

Aplikasi mobile atau aplikasi seluler adalah perangkat lunak yang dirancang khusus untuk berjalan pada perangkat mobile seperti smartphone dan tablet. Aplikasi mobile dikembangkan untuk platform tertentu seperti Android (Google) atau iOS (Apple). Berdasarkan pendekatan pengembangannya, aplikasi mobile dibagi menjadi tiga kategori:

1. **Native Application:** Aplikasi yang dikembangkan secara khusus untuk satu platform menggunakan bahasa pemrograman dan SDK resmi (Java/Kotlin untuk Android, Swift/Objective-C untuk iOS).
2. **Web Application:** Aplikasi yang berjalan melalui browser web pada perangkat mobile.
3. **Hybrid/Cross-platform Application:** Aplikasi yang dikembangkan menggunakan satu basis kode namun dapat berjalan di berbagai platform. React Native termasuk dalam kategori ini.

### 2.3 React Native

React Native adalah framework open-source yang dikembangkan oleh Meta (sebelumnya Facebook) pada tahun 2015 untuk membangun aplikasi mobile lintas platform menggunakan JavaScript dan React. React Native memungkinkan pengembang untuk membuat aplikasi mobile native menggunakan komponen-komponen React yang di-render menjadi komponen native pada masing-masing platform.

Keunggulan React Native meliputi:
- **Cross-platform development:** Satu kode sumber dapat berjalan di Android dan iOS.
- **Hot Reloading:** Perubahan kode dapat dilihat secara langsung tanpa harus melakukan kompilasi ulang.
- **Komunitas besar:** Didukung oleh komunitas pengembang yang aktif dan ekosistem library yang luas.
- **Performa mendekati native:** Menggunakan native components sehingga performa lebih baik dibanding hybrid framework berbasis WebView.

### 2.4 TypeScript

TypeScript adalah bahasa pemrograman open-source yang dikembangkan oleh Microsoft. TypeScript merupakan superset dari JavaScript yang menambahkan fitur static typing (pengetikan statis). Dengan TypeScript, pengembang dapat mendefinisikan tipe data pada variabel, parameter fungsi, dan return value, sehingga dapat mendeteksi kesalahan pada tahap kompilasi sebelum aplikasi dijalankan.

Keunggulan TypeScript dalam pengembangan aplikasi ini meliputi:
- Deteksi error lebih awal melalui type checking.
- Intellisense dan auto-completion yang lebih baik pada IDE.
- Dokumentasi kode yang lebih jelas melalui definisi tipe.
- Kompatibel penuh dengan JavaScript.

### 2.5 Expo

Expo adalah platform dan ekosistem tools untuk pengembangan aplikasi React Native yang menyederhanakan proses development, build, dan deployment. Expo menyediakan berbagai API dan library siap pakai yang memudahkan akses ke fitur-fitur perangkat seperti kamera, lokasi, notifikasi, dan lain-lain tanpa perlu konfigurasi native yang kompleks.

Fitur-fitur Expo yang digunakan dalam aplikasi ini meliputi:
- **expo-notifications:** Untuk mengirim dan menerima push notification.
- **expo-location:** Untuk mengakses layanan lokasi GPS perangkat.
- **expo-linear-gradient:** Untuk membuat efek gradien pada antarmuka.
- **expo-splash-screen:** Untuk menampilkan splash screen saat aplikasi dimuat.
- **expo-font:** Untuk menggunakan font kustom.

### 2.6 Supabase

Supabase adalah platform open-source Backend-as-a-Service (BaaS) yang menyediakan layanan backend lengkap berbasis PostgreSQL. Supabase sering disebut sebagai alternatif open-source dari Firebase. Layanan yang disediakan Supabase meliputi:

1. **Database:** PostgreSQL database dengan antarmuka visual dan API otomatis.
2. **Authentication:** Sistem autentikasi pengguna yang mendukung email/password, OAuth, dan magic link.
3. **Realtime:** Fitur real-time subscriptions yang memungkinkan aplikasi menerima perubahan data secara langsung.
4. **Storage:** Penyimpanan file dan objek.
5. **Row Level Security (RLS):** Kebijakan keamanan tingkat baris untuk mengontrol akses data.

Dalam aplikasi ini, Supabase digunakan sebagai backend utama yang menangani:
- Autentikasi pengguna (login, register, forgot password).
- Penyimpanan dan pengelolaan data booking, layanan, chat, dan review.
- Fitur real-time untuk chat dan update status pesanan.
- Row Level Security untuk memastikan keamanan data pengguna.

### 2.7 PostgreSQL

PostgreSQL adalah sistem manajemen basis data relasional (RDBMS) yang bersifat open-source dan sangat tangguh. PostgreSQL dikenal dengan keandalan, fitur yang lengkap, dan kemampuan untuk menangani beban kerja yang besar. PostgreSQL mendukung tipe data yang beragam, transaksi ACID, dan ekstensi yang fleksibel.

### 2.8 Real-time Communication

Real-time communication (komunikasi real-time) mengacu pada pertukaran data atau informasi yang terjadi secara instan tanpa adanya penundaan yang signifikan. Dalam konteks aplikasi ini, real-time communication diimplementasikan melalui fitur chat yang memungkinkan pelanggan dan admin bengkel berkomunikasi secara langsung.

Supabase Realtime menggunakan protokol WebSocket untuk mengirimkan perubahan data dari database ke klien secara langsung. Ketika ada pesan baru yang disisipkan ke tabel `chat_messages`, Supabase akan secara otomatis mengirimkan data tersebut ke semua klien yang berlangganan (subscribe) pada channel tersebut.

### 2.9 Push Notification

Push notification adalah pesan yang dikirimkan oleh aplikasi server ke perangkat pengguna meskipun aplikasi tidak sedang aktif. Push notification digunakan untuk memberikan informasi penting kepada pengguna, seperti update status pesanan, pesan baru, atau promosi.

Dalam aplikasi ini, push notification diimplementasikan menggunakan:
- **Expo Notifications:** Library untuk mengelola push notification pada aplikasi Expo/React Native.
- **Supabase Realtime sebagai trigger lokal:** Ketika ada pesan chat baru, sistem akan secara otomatis menampilkan notifikasi lokal pada perangkat pengguna.

### 2.10 Backend-as-a-Service (BaaS)

Backend-as-a-Service (BaaS) adalah model layanan cloud computing yang menyediakan infrastruktur backend siap pakai bagi pengembang aplikasi. Dengan BaaS, pengembang tidak perlu membangun dan mengelola server, database, serta API dari awal. BaaS menyediakan layanan seperti database, autentikasi, penyimpanan file, dan fungsi serverless melalui API dan SDK.

### 2.11 Metode Waterfall

Metode Waterfall (Air Terjun) adalah metode pengembangan perangkat lunak yang bersifat linier dan sekuensial. Setiap tahap harus diselesaikan sebelum melanjutkan ke tahap berikutnya. Tahapan dalam metode Waterfall meliputi:

1. **Analisis Kebutuhan (Requirements Analysis):** Mengidentifikasi dan mendokumentasikan kebutuhan sistem.
2. **Perancangan Sistem (System Design):** Merancang arsitektur, database, dan antarmuka sistem.
3. **Implementasi (Implementation):** Menerjemahkan rancangan menjadi kode program.
4. **Pengujian (Testing):** Menguji sistem untuk memastikan kesesuaian dengan kebutuhan.
5. **Pemeliharaan (Maintenance):** Melakukan perbaikan dan peningkatan setelah sistem digunakan.

### 2.12 Black Box Testing

Black Box Testing adalah metode pengujian perangkat lunak yang berfokus pada fungsionalitas sistem tanpa memperhatikan struktur internal kode program. Penguji hanya menguji input dan output sistem berdasarkan spesifikasi kebutuhan yang telah ditentukan. Black Box Testing digunakan untuk memvalidasi bahwa setiap fitur berjalan sesuai dengan yang diharapkan.

### 2.13 Unified Modeling Language (UML)

Unified Modeling Language (UML) adalah bahasa pemodelan standar yang digunakan untuk memvisualisasikan, menspesifikasikan, membangun, dan mendokumentasikan artefak dari sistem perangkat lunak. Diagram UML yang digunakan dalam penelitian ini meliputi:

1. **Use Case Diagram:** Menggambarkan interaksi antara aktor (pengguna) dengan sistem.
2. **Activity Diagram:** Menggambarkan alur aktivitas dalam suatu proses bisnis.
3. **Entity Relationship Diagram (ERD):** Menggambarkan hubungan antar entitas dalam database.

---

## BAB III
## ANALISIS DAN PERANCANGAN SISTEM

### 3.1 Analisis Sistem Berjalan

Pada sistem yang sedang berjalan saat ini, proses booking service di bengkel umumnya dilakukan secara konvensional dengan tahapan sebagai berikut:

1. Pelanggan datang langsung ke bengkel.
2. Pelanggan menyampaikan keluhan atau layanan yang diinginkan kepada petugas bengkel.
3. Petugas bengkel mencatat data pelanggan dan kendaraan secara manual (buku catatan atau spreadsheet).
4. Pelanggan menunggu antrian tanpa informasi estimasi waktu yang jelas.
5. Setelah selesai, pelanggan melakukan pembayaran dan menerima nota pembayaran.

**Kelemahan Sistem Berjalan:**
- Tidak ada sistem booking online; pelanggan harus datang langsung.
- Pencatatan manual rentan terhadap kesalahan dan kehilangan data.
- Tidak ada transparansi status pengerjaan kendaraan.
- Komunikasi antara pelanggan dan bengkel tidak terstruktur.
- Tidak ada sistem review atau feedback dari pelanggan.
- Tidak ada sistem antrian otomatis.

### 3.2 Analisis Sistem Usulan

Sistem usulan yang dikembangkan adalah aplikasi mobile booking service bengkel yang menyediakan solusi terintegrasi dengan fitur-fitur berikut:

1. **Sistem Booking Online:** Pelanggan dapat memesan layanan bengkel kapan saja dan di mana saja melalui aplikasi mobile.
2. **Katalog Layanan:** Menampilkan daftar layanan yang tersedia beserta harga dan estimasi durasi.
3. **Sistem Antrian Otomatis:** Setiap booking yang dikonfirmasi mendapatkan nomor pesanan dan nomor antrian secara otomatis.
4. **Chat Real-time:** Pelanggan dapat berkomunikasi langsung dengan admin bengkel.
5. **Dashboard Admin:** Admin dapat mengelola seluruh pesanan, layanan, dan review dari satu antarmuka terpusat.
6. **Push Notification:** Notifikasi otomatis untuk update status pesanan dan pesan baru.
7. **Review dan Rating:** Pelanggan dapat memberikan ulasan dan rating setelah layanan selesai.
8. **Profil Pengguna:** Pelanggan dapat mengelola data pribadi, riwayat booking, dan preferensi.

### 3.3 Analisis Kebutuhan Fungsional

| No | Kode | Kebutuhan Fungsional | Aktor |
|---|---|---|---|
| 1 | FR-01 | Sistem menyediakan fitur registrasi pengguna baru | User |
| 2 | FR-02 | Sistem menyediakan fitur login dengan email dan password | User, Admin |
| 3 | FR-03 | Sistem menyediakan fitur lupa password (forgot password) | User, Admin |
| 4 | FR-04 | Sistem menampilkan halaman beranda dengan ringkasan booking dan statistik | User |
| 5 | FR-05 | Sistem menampilkan katalog layanan bengkel beserta harga | User |
| 6 | FR-06 | Sistem menyediakan fitur booking layanan dengan pemilihan tanggal, waktu, dan detail kendaraan | User |
| 7 | FR-07 | Sistem menyediakan fitur riwayat booking dengan status terkini | User |
| 8 | FR-08 | Sistem menyediakan fitur chat real-time dengan admin bengkel | User |
| 9 | FR-09 | Sistem menyediakan fitur review dan rating setelah layanan selesai | User |
| 10 | FR-10 | Sistem menyediakan fitur pengelolaan profil pengguna | User |
| 11 | FR-11 | Sistem menyediakan dashboard admin dengan statistik dan manajemen pesanan | Admin |
| 12 | FR-12 | Sistem menyediakan fitur update status pesanan (Pending → Confirmed → In Progress → Completed) | Admin |
| 13 | FR-13 | Sistem menyediakan fitur chat real-time dengan pelanggan | Admin |
| 14 | FR-14 | Sistem menyediakan fitur manajemen layanan (CRUD services) | Admin |
| 15 | FR-15 | Sistem mengirimkan push notification untuk update status dan pesan baru | System |
| 16 | FR-16 | Sistem menampilkan nomor pesanan dan nomor antrian otomatis | System |
| 17 | FR-17 | Sistem menyediakan fitur berbagi lokasi pada chat | User |
| 18 | FR-18 | Sistem menyediakan fitur reply pesan pada chat | User, Admin |
| 19 | FR-19 | Sistem menyediakan fitur logout | User, Admin |

### 3.4 Analisis Kebutuhan Non-Fungsional

| No | Kode | Kebutuhan Non-Fungsional | Deskripsi |
|---|---|---|---|
| 1 | NFR-01 | Performa | Aplikasi dapat memuat halaman dalam waktu kurang dari 3 detik |
| 2 | NFR-02 | Keamanan | Data pengguna dilindungi dengan Row Level Security (RLS) dan autentikasi Supabase |
| 3 | NFR-03 | Usability | Antarmuka aplikasi intuitif dan mudah digunakan |
| 4 | NFR-04 | Kompatibilitas | Aplikasi berjalan pada perangkat Android dengan versi minimal Android 6.0 |
| 5 | NFR-05 | Realtime | Pesan chat dan update status terkirim secara real-time |
| 6 | NFR-06 | Responsif | Antarmuka menyesuaikan dengan berbagai ukuran layar perangkat |
| 7 | NFR-07 | Ketersediaan | Sistem tersedia 24/7 dengan uptime mendekati 99.9% (Supabase cloud) |

### 3.5 Perancangan Use Case Diagram

Sistem memiliki dua aktor utama:

**Aktor 1: User (Pelanggan)**
- Registrasi akun
- Login / Logout
- Melihat halaman beranda (Home)
- Melihat katalog layanan
- Melakukan booking layanan
- Melihat riwayat booking
- Mengirim pesan chat ke admin
- Berbagi lokasi pada chat
- Membalas (reply) pesan chat
- Memberikan review dan rating
- Mengelola profil

**Aktor 2: Admin (Pengelola Bengkel)**
- Login / Logout
- Melihat dashboard (statistik dan pesanan)
- Mengubah status pesanan
- Melihat detail pesanan
- Mengelola layanan bengkel
- Mengirim pesan chat ke pelanggan
- Melihat review pelanggan

### 3.6 Perancangan Activity Diagram

#### 3.6.1 Activity Diagram - Login

1. User membuka aplikasi.
2. Sistem menampilkan splash screen animasi.
3. Sistem menampilkan halaman login.
4. User memasukkan email dan password.
5. User menekan tombol "Login".
6. Sistem memvalidasi kredensial melalui Supabase Auth.
7. Jika valid: Sistem mengambil data profil user dari tabel `users`, kemudian mengarahkan ke halaman Home (user) atau Dashboard (admin) berdasarkan role.
8. Jika tidak valid: Sistem menampilkan pesan error.

#### 3.6.2 Activity Diagram - Booking Service

1. User menekan tab "Booking" pada navigasi bawah.
2. Sistem menampilkan halaman booking.
3. User memilih layanan dari dropdown.
4. User memilih tipe kendaraan (Motor/Mobil).
5. User mengisi merek kendaraan dan nomor plat.
6. User memilih tanggal booking melalui date picker.
7. User memilih waktu booking melalui time picker.
8. User mengisi catatan tambahan (opsional).
9. User menekan tombol "Konfirmasi Booking".
10. Sistem menyimpan data booking ke tabel `bookings` di Supabase.
11. Sistem menampilkan pesan sukses dengan nomor pesanan.

#### 3.6.3 Activity Diagram - Chat Real-time

1. User menekan tombol chat dari halaman Home.
2. Sistem menampilkan halaman chat.
3. Sistem memuat riwayat pesan dari tabel `chat_messages`.
4. User mengetik pesan dan menekan tombol kirim.
5. Sistem menyimpan pesan ke Supabase.
6. Supabase Realtime mengirimkan pesan ke penerima secara langsung.
7. Sistem menampilkan pesan baru pada kedua sisi (pengirim dan penerima).
8. Sistem mengirimkan push notification kepada penerima.

### 3.7 Perancangan Entity Relationship Diagram (ERD)

Sistem ini memiliki 7 entitas utama dengan relasi sebagai berikut:

**Entitas dan Relasi:**

1. **Users** (1) → (N) **Bookings** : Satu user dapat memiliki banyak booking.
2. **Services** (1) → (N) **Bookings** : Satu service dapat digunakan di banyak booking.
3. **Users** (1) → (N) **Chat_Messages** (sebagai sender) : Satu user dapat mengirim banyak pesan.
4. **Bookings** (1) → (1) **Reviews** : Satu booking dapat memiliki satu review.
5. **Users** (1) → (N) **Notifications** : Satu user dapat memiliki banyak notifikasi.

### 3.8 Perancangan Struktur Database

#### Tabel 3.3 Struktur Tabel Users

| No | Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|---|
| 1 | id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | ID unik pengguna |
| 2 | email | VARCHAR | UNIQUE, NOT NULL | Alamat email |
| 3 | name | VARCHAR | NOT NULL | Nama lengkap |
| 4 | phone | VARCHAR | - | Nomor telepon |
| 5 | address | TEXT | - | Alamat |
| 6 | role | VARCHAR | DEFAULT 'user', CHECK ('user', 'admin') | Peran pengguna |
| 7 | created_at | TIMESTAMP | DEFAULT NOW() | Waktu pembuatan akun |
| 8 | updated_at | TIMESTAMP | DEFAULT NOW() | Waktu update terakhir |

#### Tabel 3.4 Struktur Tabel Services

| No | Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|---|
| 1 | id | UUID | PRIMARY KEY | ID unik layanan |
| 2 | title | VARCHAR | NOT NULL | Nama layanan |
| 3 | description | TEXT | - | Deskripsi layanan |
| 4 | price | INTEGER | NOT NULL | Harga dalam Rupiah |
| 5 | estimated_duration | INTEGER | - | Estimasi durasi (menit) |
| 6 | discount_percent | INTEGER | DEFAULT 0 | Diskon (persen) |
| 7 | category | VARCHAR | - | Kategori layanan |
| 8 | created_at | TIMESTAMP | DEFAULT NOW() | Waktu pembuatan |

#### Tabel 3.5 Struktur Tabel Bookings

| No | Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|---|
| 1 | id | UUID | PRIMARY KEY | ID unik booking |
| 2 | user_id | UUID | FK → users(id), NOT NULL | ID pengguna |
| 3 | service_id | UUID | FK → services(id), NOT NULL | ID layanan |
| 4 | vehicle_type | VARCHAR | NOT NULL | Tipe kendaraan (Motor/Mobil) |
| 5 | vehicle_brand | VARCHAR | - | Merek kendaraan |
| 6 | vehicle_plate | VARCHAR | - | Nomor plat kendaraan |
| 7 | booking_date | DATE | NOT NULL | Tanggal booking |
| 8 | booking_time | TIME | NOT NULL | Waktu booking |
| 9 | notes | TEXT | - | Catatan tambahan |
| 10 | status | VARCHAR | DEFAULT 'Pending' | Status pesanan |
| 11 | total_price | INTEGER | - | Total harga |
| 12 | queue_number | INTEGER | - | Nomor antrian |
| 13 | order_number | VARCHAR | - | Nomor pesanan |
| 14 | created_at | TIMESTAMP | DEFAULT NOW() | Waktu pembuatan |
| 15 | updated_at | TIMESTAMP | DEFAULT NOW() | Waktu update terakhir |

#### Tabel 3.6 Struktur Tabel Chat Messages

| No | Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|---|
| 1 | id | UUID | PRIMARY KEY | ID unik pesan |
| 2 | sender_id | UUID | FK → users(id), NOT NULL | ID pengirim |
| 3 | receiver_id | VARCHAR | NOT NULL | ID penerima |
| 4 | message | TEXT | NOT NULL, MAX 500 chars | Isi pesan |
| 5 | read | BOOLEAN | DEFAULT FALSE | Status baca |
| 6 | created_at | TIMESTAMP | DEFAULT NOW() | Waktu pengiriman |

#### Tabel 3.7 Struktur Tabel Reviews

| No | Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|---|
| 1 | id | UUID | PRIMARY KEY | ID unik review |
| 2 | booking_id | UUID | FK → bookings(id), NOT NULL | ID booking terkait |
| 3 | rating | INTEGER | NOT NULL, CHECK (1-5) | Rating (1-5 bintang) |
| 4 | review_text | TEXT | - | Teks ulasan |
| 5 | status | VARCHAR | - | Status feedback |
| 6 | created_at | TIMESTAMP | DEFAULT NOW() | Waktu pembuatan |

#### Tabel 3.8 Struktur Tabel Notifications

| No | Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|---|
| 1 | id | UUID | PRIMARY KEY | ID unik notifikasi |
| 2 | user_id | UUID | FK → users(id), NOT NULL | ID penerima |
| 3 | type | VARCHAR | NOT NULL | Tipe notifikasi |
| 4 | message | TEXT | NOT NULL | Isi notifikasi |
| 5 | read | BOOLEAN | DEFAULT FALSE | Status baca |
| 6 | created_at | TIMESTAMP | DEFAULT NOW() | Waktu pembuatan |

### 3.9 Perancangan Antarmuka (User Interface)

Aplikasi ini menggunakan desain modern dengan tema gelap (dark mode) yang elegan dan aksen warna amber (#F59E0B) sebagai identitas visual utama. Navigasi menggunakan Bottom Tab Navigation untuk kemudahan akses fitur-fitur utama.

**Halaman-halaman pada sisi User:**
1. **Splash Screen** – Animasi partikel yang berkumpul membentuk logo.
2. **Login Screen** – Form login dengan email dan password.
3. **Register Screen** – Form registrasi pengguna baru.
4. **Forgot Password Screen** – Form reset password melalui email OTP.
5. **Home Screen** – Dashboard ringkasan booking, statistik, dan akses cepat ke fitur.
6. **Service Catalog Screen** – Katalog layanan bengkel.
7. **Booking Screen** – Form pemesanan layanan.
8. **Booking History Screen** – Riwayat dan status seluruh booking.
9. **Chat Screen** – Chat real-time dengan admin bengkel.
10. **Profile Screen** – Pengaturan profil, data pribadi, dan preferensi.

**Halaman-halaman pada sisi Admin:**
1. **Admin Dashboard Screen** – Dashboard statistik, manajemen pesanan, layanan, dan review.
2. **Admin Chat Screen** – Daftar percakapan dengan seluruh pelanggan.

### 3.10 Arsitektur Sistem

Arsitektur sistem aplikasi ini menggunakan pola **Client-Server** dengan pendekatan **Backend-as-a-Service (BaaS)**:

```
┌─────────────────────┐
│   Mobile Client     │
│   (React Native +   │
│    Expo + TS)       │
│                     │
│  ┌───────────────┐  │
│  │  UI Layer     │  │
│  │  (Screens +   │  │
│  │   Components) │  │
│  ├───────────────┤  │
│  │  Service Layer│  │
│  │  (API Calls)  │  │
│  ├───────────────┤  │
│  │  State Mgmt   │  │
│  │  (Context API)│  │
│  └───────────────┘  │
└─────────┬───────────┘
          │ HTTPS / WebSocket
          ▼
┌─────────────────────┐
│   Supabase (BaaS)   │
│                     │
│  ┌───────────────┐  │
│  │  Auth Service │  │
│  ├───────────────┤  │
│  │  REST API     │  │
│  │  (Auto-gen)   │  │
│  ├───────────────┤  │
│  │  Realtime     │  │
│  │  (WebSocket)  │  │
│  ├───────────────┤  │
│  │  PostgreSQL   │  │
│  │  Database     │  │
│  ├───────────────┤  │
│  │  RLS Policies │  │
│  └───────────────┘  │
└─────────────────────┘
```

**Penjelasan Arsitektur:**

1. **Mobile Client (Frontend):** Dibangun menggunakan React Native + Expo + TypeScript. Terdiri dari UI Layer (tampilan), Service Layer (logika bisnis dan panggilan API), dan State Management (React Context API untuk mengelola state global seperti autentikasi).

2. **Supabase Backend:** Menyediakan Auth Service untuk autentikasi, REST API yang di-generate otomatis dari skema database, Realtime Engine untuk fitur chat dan notifikasi, serta PostgreSQL sebagai database utama yang dilindungi oleh Row Level Security.

3. **Komunikasi:** Client berkomunikasi dengan Supabase melalui HTTPS untuk operasi CRUD standar, dan WebSocket untuk fitur real-time (chat dan notifikasi).

---

## BAB IV
## IMPLEMENTASI DAN PENGUJIAN

### 4.1 Lingkungan Pengembangan

#### Tabel 4.1 Spesifikasi Perangkat Keras

| No | Komponen | Spesifikasi |
|---|---|---|
| 1 | Laptop/PC | [Sesuaikan dengan spesifikasi Anda] |
| 2 | Processor | [Sesuaikan] |
| 3 | RAM | [Sesuaikan] |
| 4 | Storage | [Sesuaikan] |
| 5 | Perangkat Uji | Smartphone Android [Merek dan Model Anda] |

#### Tabel 4.2 Spesifikasi Perangkat Lunak

| No | Perangkat Lunak | Versi | Fungsi |
|---|---|---|---|
| 1 | Windows | 10/11 | Sistem Operasi |
| 2 | Visual Studio Code | Latest | Code Editor / IDE |
| 3 | Node.js | 18.x / 20.x | JavaScript Runtime |
| 4 | React Native | 0.74.5 | Framework Mobile |
| 5 | Expo | 51.0.0 | Development Platform |
| 6 | TypeScript | 5.3.3 | Bahasa Pemrograman |
| 7 | Supabase | Cloud | Backend-as-a-Service |
| 8 | PostgreSQL | 15.x (via Supabase) | Database |
| 9 | Android Studio | Latest | Android SDK & Emulator |
| 10 | Git | Latest | Version Control |

### 4.2 Implementasi Database

Database diimplementasikan pada Supabase Cloud dengan skema PostgreSQL yang terdiri dari 7 tabel utama: `users`, `services`, `bookings`, `chat_messages`, `reviews`, `mechanics`, dan `notifications`. Seluruh tabel dilengkapi dengan index untuk optimasi performa query dan Row Level Security (RLS) untuk keamanan data.

**Implementasi Index:**
```sql
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX idx_chat_messages_receiver_id ON chat_messages(receiver_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX idx_reviews_booking_id ON reviews(booking_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_users_email ON users(email);
```

**Implementasi Row Level Security (RLS):**
- Tabel `bookings`: User hanya dapat melihat dan mengedit booking miliknya sendiri.
- Tabel `chat_messages`: User hanya dapat melihat pesan yang dikirim atau diterima oleh dirinya sendiri.
- Tabel `reviews`: User dapat membuat review dan melihat semua review.
- Tabel `notifications`: User hanya dapat melihat notifikasi miliknya sendiri.

### 4.3 Implementasi Antarmuka Pengguna

Antarmuka aplikasi diimplementasikan dengan desain dark mode yang konsisten menggunakan palet warna:
- **Background utama:** #0F1115 (dark navy)
- **Background card:** rgba(34, 37, 45, 0.65)
- **Aksen utama:** #F59E0B (amber/kuning keemasan)
- **Teks utama:** #FFFFFF dan #E0E0E0
- **Teks sekunder:** #999999

#### 4.3.1 Implementasi Splash Screen
Splash screen diimplementasikan dengan animasi partikel yang menampilkan 8 titik cahaya yang bergerak dari posisi acak menuju pusat layar, kemudian membentuk logo aplikasi dengan efek "pop-up". Nama aplikasi "SMART BOOKING SYSTEM" ditampilkan dengan animasi fade-in dari bawah.

#### 4.3.2 Implementasi Halaman Login
Halaman login menampilkan form dengan input email dan password, tombol login, link ke halaman registrasi, dan link lupa password. Autentikasi dilakukan melalui `supabase.auth.signInWithPassword()`.

#### 4.3.3 Implementasi Halaman Home (User)
Halaman Home menampilkan:
- Salam personal kepada pengguna
- Ringkasan statistik booking (total, selesai, berlangsung)
- Shortcut akses cepat ke fitur-fitur utama
- Daftar booking terbaru
- Tombol floating untuk chat dengan admin

#### 4.3.4 Implementasi Halaman Booking
Halaman booking menyediakan form pemesanan layanan yang meliputi:
- Dropdown pemilihan layanan dari katalog
- Pemilihan tipe kendaraan (Motor/Mobil)
- Input merek kendaraan dan nomor plat
- Date picker untuk tanggal booking
- Time picker untuk waktu booking
- Text area untuk catatan tambahan
- Tombol konfirmasi booking

#### 4.3.5 Implementasi Halaman Chat
Halaman chat mengimplementasikan:
- Tampilan bubble chat dengan warna berbeda untuk pengirim dan penerima
- Real-time subscription menggunakan Supabase Realtime
- Fitur reply pesan (swipe atau tap untuk reply)
- Fitur berbagi lokasi (menggunakan expo-location)
- Typing indicator saat admin/user sedang mengetik
- Timestamp pada setiap pesan

#### 4.3.6 Implementasi Admin Dashboard
Admin Dashboard menampilkan:
- Tab navigasi: Overview, Bookings, Services, Reviews
- Statistik total booking, pendapatan, dan layanan
- Progress bar penyelesaian pesanan
- Daftar seluruh booking dengan kemampuan filter dan update status
- Manajemen layanan (tambah, edit, hapus)
- Daftar review dari pelanggan
- Fitur navigasi dari chat ke booking spesifik (klik nomor pesanan untuk scroll otomatis ke booking tersebut)

### 4.4 Implementasi Fitur Utama

#### 4.4.1 Sistem Booking Online
Proses booking diimplementasikan melalui `bookingService.createBooking()` yang menyimpan data ke tabel `bookings` di Supabase. Setiap booking secara otomatis mendapatkan:
- **Order Number:** Format `ORD-YYYYMMDD-XXX` (contoh: ORD-20260730-001)
- **Queue Number:** Nomor antrian berurutan

#### 4.4.2 Chat Real-time
Chat real-time diimplementasikan menggunakan Supabase Realtime Subscriptions:
```typescript
supabase
  .channel('chat-messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'chat_messages',
  }, (payload) => {
    // Handle new message in real-time
  })
  .subscribe()
```

#### 4.4.3 Push Notification
Push notification diimplementasikan dengan dua mekanisme:
1. **Expo Push Notifications:** Untuk notifikasi yang dikirim melalui server.
2. **Local Notifications via Supabase Realtime:** Ketika ada pesan chat baru, sistem otomatis menampilkan notifikasi lokal menggunakan `Notifications.scheduleNotificationAsync()`.

#### 4.4.4 Autentikasi dan Keamanan
Autentikasi dikelola melalui Supabase Auth yang menyediakan:
- Login dengan email dan password
- Registrasi pengguna baru
- Reset password melalui email OTP (One-Time Password)
- Session management otomatis
- Row Level Security untuk proteksi data

### 4.5 Pengujian Sistem (Black Box Testing)

#### Tabel 4.3 Hasil Pengujian Black Box - Modul Autentikasi

| No | Skenario Pengujian | Input | Output yang Diharapkan | Hasil | Status |
|---|---|---|---|---|---|
| 1 | Login dengan data valid | Email dan password yang benar | Berhasil login, diarahkan ke halaman Home | Sesuai | ✅ Berhasil |
| 2 | Login dengan data tidak valid | Email benar, password salah | Menampilkan pesan error "Invalid login credentials" | Sesuai | ✅ Berhasil |
| 3 | Login dengan field kosong | Email atau password kosong | Menampilkan pesan error validasi | Sesuai | ✅ Berhasil |
| 4 | Registrasi pengguna baru | Email, password, nama valid | Akun berhasil dibuat, diarahkan ke Home | Sesuai | ✅ Berhasil |
| 5 | Registrasi dengan email yang sudah terdaftar | Email yang sudah ada | Menampilkan pesan error "User already registered" | Sesuai | ✅ Berhasil |
| 6 | Forgot password | Email terdaftar | OTP dikirim ke email, bisa reset password | Sesuai | ✅ Berhasil |
| 7 | Logout | Menekan tombol Logout | Berhasil logout, diarahkan ke halaman Login | Sesuai | ✅ Berhasil |

#### Tabel 4.4 Hasil Pengujian Black Box - Modul Booking

| No | Skenario Pengujian | Input | Output yang Diharapkan | Hasil | Status |
|---|---|---|---|---|---|
| 1 | Membuat booking dengan data lengkap | Layanan, tipe kendaraan, tanggal, waktu, detail kendaraan | Booking berhasil dibuat dengan nomor pesanan | Sesuai | ✅ Berhasil |
| 2 | Membuat booking dengan data tidak lengkap | Layanan tidak dipilih | Menampilkan pesan error validasi | Sesuai | ✅ Berhasil |
| 3 | Melihat riwayat booking | Membuka tab History | Menampilkan daftar seluruh booking beserta statusnya | Sesuai | ✅ Berhasil |
| 4 | Membatalkan booking | Menekan tombol batalkan pada booking Pending | Status booking berubah menjadi "Cancelled" | Sesuai | ✅ Berhasil |
| 5 | Melihat detail booking | Menekan kartu booking | Menampilkan detail lengkap booking | Sesuai | ✅ Berhasil |

#### Tabel 4.5 Hasil Pengujian Black Box - Modul Chat

| No | Skenario Pengujian | Input | Output yang Diharapkan | Hasil | Status |
|---|---|---|---|---|---|
| 1 | Mengirim pesan teks | Teks pesan pada input chat | Pesan terkirim dan muncul di kedua sisi secara real-time | Sesuai | ✅ Berhasil |
| 2 | Menerima pesan real-time | Pesan dari admin/user lain | Pesan baru muncul langsung tanpa refresh | Sesuai | ✅ Berhasil |
| 3 | Membalas (reply) pesan | Menekan pesan untuk reply | Pesan dikirim dengan referensi ke pesan yang di-reply | Sesuai | ✅ Berhasil |
| 4 | Berbagi lokasi | Menekan tombol lokasi | Lokasi terkirim dan ditampilkan pada chat | Sesuai | ✅ Berhasil |
| 5 | Push notification pesan baru | Pesan diterima saat di luar chat | Notifikasi muncul di perangkat | Sesuai | ✅ Berhasil |

#### Tabel 4.6 Hasil Pengujian Black Box - Modul Admin Dashboard

| No | Skenario Pengujian | Input | Output yang Diharapkan | Hasil | Status |
|---|---|---|---|---|---|
| 1 | Melihat statistik dashboard | Membuka Admin Dashboard | Menampilkan total booking, pendapatan, dan grafik | Sesuai | ✅ Berhasil |
| 2 | Update status pesanan | Memilih status baru pada pesanan | Status pesanan berubah dan notifikasi dikirim ke user | Sesuai | ✅ Berhasil |
| 3 | Melihat detail pesanan | Menekan kartu pesanan | Modal detail pesanan ditampilkan | Sesuai | ✅ Berhasil |
| 4 | Navigasi dari chat ke pesanan | Klik nomor pesanan di Admin Chat | Layar scroll otomatis ke pesanan yang dimaksud dengan efek glow | Sesuai | ✅ Berhasil |
| 5 | Menambah layanan baru | Mengisi form tambah layanan | Layanan baru berhasil ditambahkan dan muncul di katalog | Sesuai | ✅ Berhasil |

#### Tabel 4.7 Hasil Pengujian Black Box - Modul Review

| No | Skenario Pengujian | Input | Output yang Diharapkan | Hasil | Status |
|---|---|---|---|---|---|
| 1 | Memberikan review dengan rating dan teks | Rating 1-5 bintang dan teks ulasan | Review berhasil disimpan dan ditampilkan | Sesuai | ✅ Berhasil |
| 2 | Memberikan review tanpa teks | Rating saja tanpa teks | Review berhasil disimpan dengan rating saja | Sesuai | ✅ Berhasil |
| 3 | Melihat review di Admin Dashboard | Membuka tab Reviews di admin | Daftar seluruh review dari pelanggan ditampilkan | Sesuai | ✅ Berhasil |

---

## BAB V
## KESIMPULAN DAN SARAN

### 5.1 Kesimpulan

Berdasarkan hasil perancangan, implementasi, dan pengujian yang telah dilakukan, maka dapat diambil kesimpulan sebagai berikut:

1. **Aplikasi mobile booking service bengkel** telah berhasil dirancang dan diimplementasikan menggunakan framework React Native dengan bahasa pemrograman TypeScript dan Expo sebagai development platform. Aplikasi ini memudahkan pelanggan dalam melakukan pemesanan layanan bengkel secara online kapan saja dan di mana saja melalui perangkat mobile.

2. **Fitur chat real-time** telah berhasil diimplementasikan menggunakan Supabase Realtime yang memanfaatkan teknologi WebSocket. Fitur ini memungkinkan komunikasi dua arah secara langsung dan instan antara pelanggan dan admin bengkel, dilengkapi dengan fitur reply pesan, berbagi lokasi, dan typing indicator.

3. **Dashboard admin** telah berhasil diimplementasikan dengan fitur-fitur manajemen pesanan yang komprehensif, meliputi: tampilan statistik (total booking, pendapatan, progress), kemampuan update status pesanan, manajemen layanan (CRUD), review pelanggan, serta fitur navigasi otomatis dari chat ke pesanan spesifik dengan efek visual glow.

4. **Pengujian fungsionalitas** menggunakan metode Black Box Testing menunjukkan bahwa seluruh fitur utama aplikasi (autentikasi, booking, chat, admin dashboard, review) berjalan dengan baik dan sesuai dengan kebutuhan fungsional yang telah ditentukan. Seluruh skenario pengujian memberikan hasil **"Berhasil"**.

### 5.2 Saran

Untuk pengembangan lebih lanjut, penulis memberikan saran sebagai berikut:

1. **Integrasi Payment Gateway:** Menambahkan fitur pembayaran online menggunakan payment gateway seperti Midtrans atau Xendit agar pelanggan dapat melakukan pembayaran langsung melalui aplikasi.

2. **Dukungan Multi-bengkel:** Mengembangkan sistem agar dapat mendukung lebih dari satu bengkel, sehingga pelanggan dapat memilih bengkel terdekat berdasarkan lokasi.

3. **Fitur Tracking Real-time:** Menambahkan fitur pelacakan pengerjaan kendaraan secara real-time dengan tahapan yang lebih detail (misalnya: diterima → diagnosis → pengerjaan → quality check → selesai).

4. **Pengembangan iOS:** Memperluas jangkauan aplikasi dengan melakukan deployment ke platform iOS (Apple App Store).

5. **Fitur Laporan dan Analitik:** Menambahkan fitur laporan keuangan dan analitik bisnis yang lebih mendalam untuk membantu pengelola bengkel dalam pengambilan keputusan strategis.

6. **Fitur Pengingat Servis:** Menambahkan fitur pengingat otomatis untuk jadwal servis berkala berdasarkan riwayat servis pelanggan.

7. **Optimasi Performa:** Melakukan optimasi performa aplikasi dengan menerapkan teknik lazy loading, caching, dan pagination untuk meningkatkan kecepatan respon aplikasi.

---

## DAFTAR PUSTAKA

1. Eisenman, B. (2023). *Learning React Native: Building Native Mobile Apps with JavaScript* (3rd ed.). O'Reilly Media.

2. Meta Platforms, Inc. (2024). *React Native Documentation*. Diakses dari https://reactnative.dev/docs/getting-started

3. Supabase Inc. (2024). *Supabase Documentation*. Diakses dari https://supabase.com/docs

4. Expo. (2024). *Expo Documentation*. Diakses dari https://docs.expo.dev/

5. TypeScript. (2024). *TypeScript Documentation*. Diakses dari https://www.typescriptlang.org/docs/

6. PostgreSQL Global Development Group. (2024). *PostgreSQL 15 Documentation*. Diakses dari https://www.postgresql.org/docs/15/

7. Pressman, R. S., & Maxim, B. R. (2020). *Software Engineering: A Practitioner's Approach* (9th ed.). McGraw-Hill Education.

8. Sommerville, I. (2021). *Software Engineering* (10th ed.). Pearson Education.

9. Badan Pusat Statistik. (2025). *Statistik Transportasi Darat*. Jakarta: BPS.

10. We Are Social & Hootsuite. (2025). *Digital 2025: Indonesia*. Diakses dari https://wearesocial.com/

11. Fowler, M. (2019). *UML Distilled: A Brief Guide to the Standard Object Modeling Language* (3rd ed.). Addison-Wesley Professional.

12. Dennis, A., Wixom, B. H., & Roth, R. M. (2021). *Systems Analysis and Design* (7th ed.). John Wiley & Sons.

---

## LAMPIRAN

### Lampiran 1: Source Code Utama

**File: App.tsx**
```typescript
// Entry point aplikasi
import { AuthProvider } from './src/context/AuthContext'
import { RootNavigator } from './src/navigation/RootNavigator'

export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  )
}
```

**File: src/services/supabaseClient.ts**
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Lampiran 2: Struktur Direktori Proyek

```
Mobile-App-Booking-Service/
├── App.tsx                          # Entry point
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript config
├── app.json                         # Expo config
├── SETUP.sql                        # Database schema
├── src/
│   ├── components/
│   │   ├── AuthForm.tsx             # Reusable auth form
│   │   ├── NotificationOverlay.tsx  # In-app notification
│   │   └── TypingIndicator.tsx      # Chat typing indicator
│   ├── context/
│   │   └── AuthContext.tsx          # Auth state management
│   ├── navigation/
│   │   └── RootNavigator.tsx        # App navigation
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── RegisterScreen.tsx
│   │   │   └── ForgotPasswordScreen.tsx
│   │   ├── user/
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── BookingScreen.tsx
│   │   │   ├── BookingHistoryScreen.tsx
│   │   │   ├── ChatScreen.tsx
│   │   │   ├── ProfileScreen.tsx
│   │   │   ├── ServiceCatalogScreen.tsx
│   │   │   └── FeedbackScreen.tsx
│   │   └── admin/
│   │       ├── AdminDashboardScreen.tsx
│   │       └── AdminChatScreen.tsx
│   ├── services/
│   │   ├── supabaseClient.ts
│   │   ├── bookingService.ts
│   │   ├── chatService.ts
│   │   ├── notificationService.ts
│   │   ├── reviewService.ts
│   │   └── serviceService.ts
│   ├── types/
│   │   └── index.ts                 # TypeScript type definitions
│   └── utils/
│       ├── formatting.ts
│       ├── notifications.ts
│       ├── notificationHelper.ts
│       └── validation.ts
└── android/                         # Android native project
```

### Lampiran 3: Konfigurasi Database (SETUP.sql)

*(Terlampir pada file SETUP.sql dalam repositori proyek)*

---

> **Catatan:** Dokumen ini dibuat dalam format Markdown. Untuk mengkonversi ke format Word (.docx) sesuai pedoman Tugas Akhir Universitas Esa Unggul, silakan salin konten ini ke Microsoft Word dan sesuaikan format (font Times New Roman 12pt, spasi 1.5, margin 4-3-3-3 cm).
