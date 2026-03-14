# Shelby File App v2 📦

تطبيق ويب لرفع وتحميل الملفات باستخدام Shelby — مبني على Express + Node.js.

## 🚀 التشغيل

```bash
# 1. انسخ ملف الإعدادات
cp .env.example .env
# عدّل .env وأضف مفتاحك الخاص وعنوان حسابك

# 2. ثبّت المكتبات
npm install --legacy-peer-deps

# 3. شغّل التطبيق
npm run dev
```

افتح المتصفح على: http://localhost:3000

## 📁 هيكل المشروع

```
shelby-app-v3/
├── server.js        # خادم Express + Shelby SDK
├── public/
│   └── index.html   # واجهة المستخدم
├── .env.example     # نموذج الإعدادات
└── package.json
```
