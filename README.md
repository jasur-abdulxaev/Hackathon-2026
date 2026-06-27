# Xperience

**Xperience** — o'quv markazlari va ta'lim muassasalari uchun mo'ljallangan zamonaviy boshqaruv tizimi (LMS/CRM). Tizim o'quv jarayonini monitoring qilish, o'quvchilar natijalarini baholash va sun'iy intellekt orqali tezkor yordam ko'rsatish imkoniyatlarini o'z ichiga oladi.

## 🚀 Asosiy Imkoniyatlar

- **Rollarga asoslangan tizim**: Admin, O'qituvchi, O'quvchi va Call-operator kabi maxsus rollar.
- **Sun'iy Intellekt (AI)**: Foydalanuvchilarga avtomatik yordam beruvchi aqlli chatbot va tizim integratsiyasi.
- **Baholash va Normativlar**: O'quvchilar topshiriqlarini tekshirish, ball berish va reyting tizimi.
- **Hisobot va Eksport**: Barcha ma'lumotlarni qulay o'rganish uchun Excel (XLSX) formatida yuklab olish.
- **Telegram Integratsiya**: Tizim yangiliklari va vazifalarni Telegram orqali xabardor qilib borish.

## 🛠 Texnologiyalar Steki

- **Frontend**: React, Vite, TypeScript, Tailwind CSS, Radix UI.
- **Backend**: Node.js, Express.js, TypeScript.
- **Ma'lumotlar bazasi**: PostgreSQL, Prisma ORM.
- **Infratuzilma**: Docker, Docker Compose, Nginx, CI/CD (GitHub Actions).

## ⚙️ O'rnatish va Ishga Tushirish

### 1. Lokal muhitda ishga tushirish (Development)

**Backendni sozlash:**
```bash
cd backend
npm install
# .env faylini sozlang va bazaga ulaning
npx prisma migrate dev
npm run dev
```

**Frontendni sozlash:**
```bash
cd frontend
npm install
npm run dev
```

### 2. Docker orqali ishga tushirish (Production / Demo)

Tizimni tezda serverda ko'tarish uchun tayyor `docker-compose.demo.yml` faylidan foydalanishingiz mumkin:

```bash
docker-compose -f docker-compose.demo.yml up -d --build
```

## 🔒 Arxitektura va Xavfsizlik

Xperience platformasi yuqori xavfsizlik va barqarorlikka qaratilgan. Maxfiy sozlamalar, AI modellari kalitlari va API ulashlarni boshqarish uchun qulay **Admin Panel** darchalari yaratilgan. Tizim CI/CD (GitHub Actions) yordamida avtomatik serverga yuklanib, xatosiz yangilanadi.
