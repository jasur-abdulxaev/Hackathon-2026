# 🚀 Demo Tizim — Server Deployment Qo'llanmasi

## Arxitektura

```
Internet
    │
    ▼
Server Nginx (host'da)
    └── testalpha.xperia.uz → localhost:8051 (demo tizim)
                                   │
                    ┌──────────────┴───────────────┐
                    │                              │
             docker-compose.yml          docker-compose.demo.yml
             ├── tizim_db_demo (5441)    ├── tizim_db_demo (5441)
             ├── tizim_backend_demo (5051)└── tizim_backend_demo (5051)
             └── tizim_frontend_demo (8051)
```

---

## 1-QADAM: DNS Sozlash

Domain provayderingizda (namecheap, godaddy yoki boshqa):

```
A Record:  testalpha.xperia.uz  →  [Server IP manzili]
```

> Masalan: `testalpha  A  185.xxx.xxx.xxx`

DNS tarqalishi 5-30 daqiqa oladi.

---

## 2-QADAM: Kodni Serverga Yuklash

```bash
# Serverga SSH orqali kirish
ssh root@your-server-ip

# Loyiha papkasiga o'tish
cd /path/to/tizim-it-live

# Yangi fayllarni git orqali yuklash
git pull origin main
```

Yoki SCP bilan yangi fayllarni yuklash:
```bash
# Lokaldan serverga (kerak bo'lgan fayllar)
scp docker-compose.demo.yml root@your-server-ip:/path/to/project/
scp backend/.env.demo root@your-server-ip:/path/to/project/backend/
scp frontend/Dockerfile.demo root@your-server-ip:/path/to/project/frontend/
scp frontend/nginx.demo.conf root@your-server-ip:/path/to/project/frontend/
scp backend/prisma/seed-demo.ts root@your-server-ip:/path/to/project/backend/prisma/
scp backend/src/shared/middleware/demoGuard.ts root@your-server-ip:/path/to/project/backend/src/shared/middleware/
```

---

## 3-QADAM: Server Nginx Sozlash

```bash
# Nginx konfiguratsiyasini o'rnatish
sudo nano /etc/nginx/sites-available/testalpha-xperia

# (nginx-server.conf ichidagi konfiguratsiyani joylashtirish)

# Sites-enabled ga ulanish
sudo ln -sf /etc/nginx/sites-available/testalpha-xperia /etc/nginx/sites-enabled/

# Nginx konfiguratsiyasini tekshirish
sudo nginx -t

# Nginx qayta ishga tushirish
sudo systemctl reload nginx
```

---

## 4-QADAM: SSL Sertifikat (HTTPS)

```bash
# Certbot o'rnatilmagan bo'lsa:
sudo apt install certbot python3-certbot-nginx

# SSL olish
sudo certbot --nginx -d testalpha.xperia.uz

# Avtomatik yangilanishni tekshirish
sudo certbot renew --dry-run
```

---

## 5-QADAM: Demo Docker Tizimini Ishga Tushirish

```bash
# Demo tizimni build qilish (birinchi marta yoki o'zgarish bo'lganda)
npm run demo:build

# Demo tizimni ishga tushirish
npm run demo:up

# Konteynerlar ishga tushishini kutish (30-60 soniya)
sleep 60

# Demo ma'lumotlarni yuklash
npm run demo:seed
```

---

## 6-QADAM: Tekshirish

```bash
# Konteynerlar holatini tekshirish
docker ps | grep demo

# Demo backend health check
curl http://localhost:5051/api/health

# Demo frontend
curl -I http://localhost:8051

# Tashqi tekshirish
curl https://testalpha.xperia.uz/api/health
```

---

## Foydali Buyruqlar

```bash
# Demo loglarni ko'rish
npm run demo:logs

# Faqat backend loglar
docker logs tizim_backend_demo -f

# Demo tizimni to'xtatish
npm run demo:down

# Demo ma'lumotlarni qayta yuklash (yangi seed)
npm run demo:reset
sleep 60
npm run demo:seed
```

---

## Taqdimot Uchun Login Ma'lumotlari

| Rol | Login | Parol |
|-----|-------|-------|
| **Admin** | `demo_admin` | `Demo@2026!` |
| **Filial Rahbari** | `demo_rahbar` | `Demo@2026!` |
| **Kassir** | `demo_kassir` | `Demo@2026!` |
| **Administrator** | `demo_administrator` | `Demo@2026!` |
| **O'qituvchi 1** | `demo_teacher1` | `Demo@2026!` |
| **O'qituvchi 2** | `demo_teacher2` | `Demo@2026!` |
| **O'quvchi** | `demo_student` | `Demo@2026!` |
