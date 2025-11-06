# Cloudflare R2 - Quick Setup Guide

Panduan singkat setup Cloudflare R2 untuk Safety Riding API.

---

## 📋 Checklist Setup (5 Langkah)

### ✅ Step 1: Buat Bucket

1. Login ke https://dash.cloudflare.com/
2. Pilih **R2** di sidebar
3. Klik **Create bucket**
4. Nama bucket: **`safety-riding`** (harus persis sama dengan config)
5. Klik **Create bucket**

---

### ✅ Step 2: Generate API Token (Credentials)

1. Di R2 Dashboard, cari section **"S3 API"** di sidebar kanan
2. Klik **"Manage R2 API Tokens"**
3. Klik **"Create API token"**
4. Isi form:
   - **Token name**: `safety-riding-api` (atau nama bebas)
   - **Permissions**: Pilih **"Object Read & Write"**
   - **Bucket scope**:
     - Pilih **"Apply to specific buckets only"**
     - Centang bucket **`safety-riding`**
5. Klik **"Create API token"**
6. ⚠️ **PENTING**: Simpan credentials yang muncul (tidak akan muncul lagi!):
   ```
   Access Key ID: f8e7d6c5b4a39281736455
   Secret Access Key: YourSuperSecretKeyHere123456789ABC
   ```

---

### ✅ Step 3: Copy Account ID

1. Di R2 Dashboard, lihat **sidebar kanan**
2. Copy **Account ID** (contoh: `4a7b2c9e8f1d3a5b6c4e8f2a1b9d7c3e`)
3. Ini akan digunakan untuk build endpoint

---

### ✅ Step 4: Enable Public Access (PENTING!)

**⚠️ WAJIB: Tanpa langkah ini, file tidak bisa diakses publik (403 Forbidden)**

1. Klik bucket **`safety-riding`** yang sudah dibuat
2. Masuk ke tab **Settings** (bukan Overview)
3. Scroll ke section **"Public Access"** atau **"Domain & DNS"**
4. Klik button **"Allow Access"** atau **"Connect Domain"**
5. Pilih opsi **"Enable R2.dev subdomain"**
6. Konfirmasi dan enable
7. **IMPORTANT**: Copy URL yang muncul (contoh: `https://pub-a1b2c3d4e5f6.r2.dev`)

**Verification:**
- Status harus berubah jadi "Public Access: Enabled"
- R2.dev URL harus terlihat di settings
- URL format: `https://pub-<32-char-hash>.r2.dev`

**Jika tidak ada opsi R2.dev subdomain:**
- Coba refresh page
- Atau set via Bucket Policy (lihat `R2_PUBLIC_ACCESS_FIX.md`)

**Test Public Access:**
```bash
# Upload test file via dashboard
# Atau via curl:
curl -I https://pub-<hash>.r2.dev/test.txt
# Expected: HTTP 200 (bukan 403)
```

**Quick Commands (Alternative):**

Jika tidak bisa enable via Dashboard, gunakan script:

```bash
# Enable public access via script
./scripts/enable-r2-public.sh

# Test access
./scripts/test-r2-access.sh
```

---

### ✅ Step 5: Update Environment Variables

Edit file `.env` di project root:

```env
# Switch ke R2
STORAGE_PROVIDER=r2

# Endpoint = <Account-ID>.r2.cloudflarestorage.com (TANPA https://)
STORAGE_ENDPOINT=4a7b2c9e8f1d3a5b6c4e8f2a1b9d7c3e.r2.cloudflarestorage.com

# Credentials dari Step 2
STORAGE_ACCESS_KEY=f8e7d6c5b4a39281736455
STORAGE_SECRET_KEY=YourSuperSecretKeyHere123456789ABC

# Nama bucket (harus sama persis!)
STORAGE_BUCKET_NAME=safety-riding

# Always true untuk R2
STORAGE_USE_SSL=true

# Public URL dari Step 4 (DENGAN https://)
STORAGE_BASE_URL=https://pub-a1b2c3d4e5f6.r2.dev

# Account ID dari Step 3
R2_ACCOUNT_ID=4a7b2c9e8f1d3a5b6c4e8f2a1b9d7c3e
```

---

## 🎯 Mapping: Dari Dashboard ke Config

| Yang terlihat di Dashboard | Config Variable | Contoh Value |
|---------------------------|-----------------|--------------|
| **Account ID** (sidebar) | `R2_ACCOUNT_ID` & `STORAGE_ENDPOINT` | `4a7b2c9e8f1d3a5b6c4e8f2a1b9d7c3e` |
| **Access Key ID** (saat buat token) | `STORAGE_ACCESS_KEY` | `f8e7d6c5b4a39281736455` |
| **Secret Access Key** (saat buat token) | `STORAGE_SECRET_KEY` | `YourSuperSecretKeyHere...` |
| **Bucket Name** (yang kamu buat) | `STORAGE_BUCKET_NAME` | `safety-riding` |
| **R2.dev URL** (bucket settings) | `STORAGE_BASE_URL` | `https://pub-a1b2c3d4e5f6.r2.dev` |

---

## 🔧 Build Endpoint dari Account ID

**Formula:**
```
STORAGE_ENDPOINT = <Account-ID>.r2.cloudflarestorage.com
```

**Contoh:**
- Account ID: `4a7b2c9e8f1d3a5b6c4e8f2a1b9d7c3e`
- Endpoint: `4a7b2c9e8f1d3a5b6c4e8f2a1b9d7c3e.r2.cloudflarestorage.com`

⚠️ **PENTING**:
- Endpoint **TANPA** `https://` atau `http://`
- Base URL **DENGAN** `https://`

---

## ✅ Verifikasi Config

Sebelum jalankan aplikasi, cek:

- [ ] Bucket `safety-riding` sudah dibuat di Cloudflare
- [ ] API Token sudah dibuat dan credentials disimpan
- [ ] Account ID sudah dicopy
- [ ] R2.dev subdomain sudah dienable
- [ ] `.env` sudah diupdate dengan nilai yang benar
- [ ] `STORAGE_ENDPOINT` **TANPA** `https://`
- [ ] `STORAGE_BASE_URL` **DENGAN** `https://`

---

## 🚀 Test Run

```bash
# Build backend
go build -o safety-riding main.go

# Run
./safety-riding

# Atau dengan Docker
docker-compose up --build
```

**Expected output:**
```
✓ Storage provider initialized successfully. Provider: r2, Endpoint: <account-id>.r2.cloudflarestorage.com, Bucket: safety-riding
```

**Jika error:**
- ❌ `301 Moved Permanently` → Endpoint include `https://` (harus dihapus)
- ❌ `Access Denied` → API token salah atau bucket scope tidak sesuai
- ❌ `Bucket not found` → Bucket belum dibuat atau nama salah

---

## 📸 Screenshot Locations

### Di mana menemukan info di Cloudflare:

```
Cloudflare Dashboard
├─ R2 (sidebar kiri)
│   ├─ [Bucket List] → Create bucket / Klik bucket untuk settings
│   │   └─ Settings → Public Access → R2.dev subdomain
│   │
│   └─ [Sidebar Kanan]
│       ├─ Account ID: 4a7b2c9e... ← Copy ini
│       └─ S3 API: Click to expand
│           └─ Manage R2 API Tokens → Create API token
│               └─ [Show Credentials]
│                   ├─ Access Key ID ← Copy ini
│                   └─ Secret Access Key ← Copy ini
```

---

## ❓ FAQ

**Q: Aku tidak lihat Access Key di dashboard?**
A: Access Key hanya muncul SATU KALI saat create API token. Jika hilang, buat token baru.

**Q: Endpoint-nya mana?**
A: Endpoint = Account ID + `.r2.cloudflarestorage.com`. Contoh: `abc123.r2.cloudflarestorage.com`

**Q: R2.dev URL-nya di mana?**
A: Klik bucket → Settings → Public Access → Enable R2.dev subdomain → URL muncul di situ.

**Q: Masih error 301?**
A: Pastikan `STORAGE_ENDPOINT` TANPA `https://`. Contoh yang benar: `abc123.r2.cloudflarestorage.com`

**Q: Bucket tidak ditemukan?**
A: Bucket harus dibuat manual di dashboard. R2 tidak bisa auto-create bucket via API.

---

## 💰 Biaya

R2 sangat murah:
- **Storage**: $0.015/GB/bulan (~Rp 240/GB/bulan)
- **Egress**: **GRATIS** (tidak ada biaya bandwidth)
- **Operations**:
  - Write: $4.50/juta request (~Rp 72.000/juta request)
  - Read: $0.36/juta request (~Rp 5.760/juta request)

**Free Tier**: 10GB storage gratis per bulan!

---

## 📞 Support

Jika masih error, cek:
1. `STORAGE_SETUP.md` - Dokumentasi lengkap
2. `.env.example` - Contoh config
3. GitHub Issues atau contact developer

---

**Last updated:** 2025-11-06
