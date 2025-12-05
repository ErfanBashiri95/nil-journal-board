# مرحله ۱: build با Node 20 روی Alpine (بدون apt)
FROM node:20-alpine AS build

# داخل کانتینر
WORKDIR /app

# نصب پکیج‌ها
COPY package*.json ./
RUN npm install

# کپی کل پروژه
COPY . .

# ساختن نسخه‌ی production
RUN npm run build

# مرحله ۲: سرو کردن نسخه‌ی build شده با Vite preview
FROM node:20-alpine

WORKDIR /app

# فقط فایل‌های لازم برای runtime
COPY package*.json ./
RUN npm install --omit=dev

# کپی خروجی build از مرحله قبل
COPY --from=build /app/dist ./dist

# پورت سرویس
EXPOSE 8080

# اجرای Vite preview (همون چیزی که قبلاً روی Railway جواب می‌داد)
CMD ["npm", "run", "preview"]
