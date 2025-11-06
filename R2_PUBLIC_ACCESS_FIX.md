# R2 Public Access - Troubleshooting Guide

## 🔴 Problem: Gambar Tidak Bisa Diakses

Jika URL seperti ini tidak bisa diakses:
```
https://pub-0f9801ee20a34c51bc08b2e404581bde.r2.dev/event-photos/20251106_212849_ef870da1.jpeg
```

Error yang muncul:
- Browser: "Access Denied" atau "Forbidden"
- HTTP Status: 403 Forbidden

### ⚠️ Common Cause: Files in Subfolders

**IMPORTANT:** If your file is in a subfolder (like `event-photos/`), you need special configuration!

```
✅ Root file:     pub-xxx.r2.dev/file.jpg              → May work
❌ Subfolder:     pub-xxx.r2.dev/event-photos/file.jpg → 403 Error
```

**Quick Fix:** See detailed solution in [`R2_SUBFOLDER_FIX.md`](./R2_SUBFOLDER_FIX.md)

**TL;DR:** Set bucket policy with `/*` wildcard to cover all subfolders.

---

## ✅ Solution: Enable Public Access di Bucket

Ada **2 cara** untuk membuat file R2 bisa diakses publik:

---

## 🎯 Method 1: Via Cloudflare Dashboard (RECOMMENDED)

### Step 1: Enable Public Access

1. Login ke https://dash.cloudflare.com/
2. Pilih **R2** di sidebar
3. Klik bucket **`safety-riding`**
4. Masuk ke tab **Settings**
5. Cari section **"Public Access"**
6. Klik **"Allow Access"** atau **"Connect Domain"**

### Step 2: Enable R2.dev Subdomain

1. Di section **"Public Access"**, cari **"R2.dev subdomain"**
2. Klik **"Enable R2.dev subdomain"** atau **"Allow Access"**
3. Setelah enabled, akan muncul URL seperti:
   ```
   https://pub-<hash>.r2.dev
   ```
4. **PENTING**: Copy URL ini dan update `STORAGE_BASE_URL` di `.env`

### Step 3: Verify

Test akses file:
```bash
# Ganti dengan URL file kamu
curl -I https://pub-0f9801ee20a34c51bc08b2e404581bde.r2.dev/event-photos/20251106_212849_ef870da1.jpeg

# Expected: HTTP 200 OK
# Jika 403 Forbidden, public access belum enabled
```

---

## 🎯 Method 2: Via Bucket Policy (Advanced)

Jika Method 1 tidak berhasil, set bucket policy secara manual.

### Option A: Allow All Public Read (Simple)

1. Di bucket settings, cari **"Bucket Policy"** atau **"CORS and Policy"**
2. Tambahkan policy ini:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicRead",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::safety-riding/*"
    }
  ]
}
```

**Penjelasan:**
- `Principal: "*"` = Siapa saja bisa akses
- `Action: "s3:GetObject"` = Hanya read/download (tidak bisa upload/delete)
- `Resource: ".../*"` = Semua file di bucket

### Option B: Allow Public Read for Specific Folder

Jika hanya ingin folder tertentu yang public:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadEventPhotos",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::safety-riding/event-photos/*"
    }
  ]
}
```

---

## 🔧 Method 3: Via S3 API (Programmatic)

Jika ingin set via code/script:

### Using AWS CLI

```bash
# Install AWS CLI
# macOS: brew install awscli
# Linux: apt install awscli

# Configure dengan R2 credentials
aws configure --profile r2
# Input:
# AWS Access Key ID: <your-r2-access-key>
# AWS Secret Access Key: <your-r2-secret-key>
# Default region: auto
# Default output format: json

# Set bucket policy
cat > bucket-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::safety-riding/*"
    }
  ]
}
EOF

# Apply policy
aws s3api put-bucket-policy \
  --bucket safety-riding \
  --policy file://bucket-policy.json \
  --endpoint-url https://<account-id>.r2.cloudflarestorage.com \
  --profile r2
```

### Using MinIO Client (mc)

```bash
# Install mc
# macOS: brew install minio/stable/mc
# Linux: wget https://dl.min.io/client/mc/release/linux-amd64/mc

# Configure R2
mc alias set r2 \
  https://<account-id>.r2.cloudflarestorage.com \
  <access-key> \
  <secret-key>

# Set public policy
mc anonymous set download r2/safety-riding/event-photos

# Atau untuk seluruh bucket
mc anonymous set download r2/safety-riding
```

---

## 🧪 Testing & Verification

### 1. Test Single File

```bash
# Test via curl
curl -I https://pub-<hash>.r2.dev/event-photos/test.jpg

# Expected response:
HTTP/2 200
content-type: image/jpeg
content-length: 12345
...
```

### 2. Test via Browser

Buka URL di browser:
```
https://pub-0f9801ee20a34c51bc08b2e404581bde.r2.dev/event-photos/20251106_212849_ef870da1.jpeg
```

**Expected**: Gambar langsung muncul/download
**Error 403**: Public access belum enabled

### 3. Check from Application

```bash
# Run app dan upload foto event
./safety-riding

# Check logs untuk URL yang disimpan
# Seharusnya format:
https://pub-<hash>.r2.dev/event-photos/<filename>

# Buka URL di browser
```

---

## 🔍 Troubleshooting

### Problem 1: URL Menggunakan S3 Endpoint

**Symptom:**
```
https://<account-id>.r2.cloudflarestorage.com/safety-riding/event-photos/test.jpg
```

**Solution:**
URL salah! Seharusnya menggunakan R2.dev:
```
https://pub-<hash>.r2.dev/event-photos/test.jpg
```

**Fix:**
1. Pastikan `STORAGE_BASE_URL` di `.env` menggunakan R2.dev URL
2. Restart aplikasi
3. Upload ulang file

### Problem 2: 403 Forbidden

**Symptom:**
```xml
<Error>
  <Code>AccessDenied</Code>
  <Message>Access Denied</Message>
</Error>
```

**Solution:**
1. Enable public access via dashboard (Method 1)
2. Atau set bucket policy (Method 2)
3. Wait 1-2 menit untuk propagasi

### Problem 3: R2.dev URL Tidak Muncul di Dashboard

**Symptom:**
Tidak ada opsi "Enable R2.dev subdomain" di settings

**Solution:**
1. Pastikan sudah di tab **Settings** bucket (bukan overview)
2. Scroll ke section **"Public Access"** atau **"Domain & DNS"**
3. Jika tidak ada, gunakan Method 2 (Bucket Policy)

### Problem 4: File Lama Masih 403

**Symptom:**
File yang di-upload sebelum enable public access masih error 403

**Solution:**
Public access apply ke **semua file**, termasuk yang lama. Jika masih 403:
1. Clear browser cache
2. Test dengan curl (untuk bypass cache)
3. Pastikan bucket policy sudah benar

---

## 📋 Checklist untuk Public Access

Sebelum upload file, pastikan:

- [ ] Bucket `safety-riding` sudah dibuat
- [ ] Public Access sudah dienabled (via dashboard atau policy)
- [ ] R2.dev subdomain sudah dienabled
- [ ] `STORAGE_BASE_URL` di `.env` menggunakan R2.dev URL (bukan S3 endpoint)
- [ ] Format: `https://pub-<hash>.r2.dev` (dengan https, tanpa trailing slash)
- [ ] Aplikasi sudah direstart setelah update `.env`
- [ ] Test upload file baru
- [ ] Test akses URL via browser

---

## 🎯 Quick Fix Script

Buat file `setup-r2-public.sh`:

```bash
#!/bin/bash

# R2 Public Access Setup Script
# Usage: ./setup-r2-public.sh

echo "🚀 R2 Public Access Setup"
echo ""

# Load dari .env
source .env

# Extract account ID dan bucket name
ACCOUNT_ID=$R2_ACCOUNT_ID
BUCKET=$STORAGE_BUCKET_NAME
ACCESS_KEY=$STORAGE_ACCESS_KEY
SECRET_KEY=$STORAGE_SECRET_KEY

# Configure mc
echo "📝 Configuring MinIO Client..."
mc alias set r2-setup \
  "https://${ACCOUNT_ID}.r2.cloudflarestorage.com" \
  "$ACCESS_KEY" \
  "$SECRET_KEY"

# Set public read
echo "🔓 Setting public read access..."
mc anonymous set download "r2-setup/${BUCKET}/event-photos"

# Test
echo ""
echo "✅ Done! Testing access..."
mc ls "r2-setup/${BUCKET}/event-photos" 2>/dev/null || echo "⚠️  No files yet"

echo ""
echo "🎉 Public access configured!"
echo "Upload a test file and check if accessible via R2.dev URL"
```

Jalankan:
```bash
chmod +x setup-r2-public.sh
./setup-r2-public.sh
```

---

## ⚠️ Security Considerations

### Public vs Private

**Public Access (Current Setup):**
- ✅ File bisa diakses siapa saja dengan URL
- ✅ Cocok untuk: Foto event, assets public
- ❌ Jangan untuk: Data sensitif, dokumen pribadi

**Private Access (Alternative):**
- ✅ File hanya bisa diakses dengan signed URL
- ✅ Cocok untuk: Dokumen user, data pribadi
- ❌ Perlu generate signed URL setiap akses

### Best Practices

1. **Untuk Public Files:**
   - Enable public access via R2.dev
   - Gunakan folder terpisah (`/public/*`)

2. **Untuk Private Files:**
   - Jangan enable public access
   - Generate signed URL dengan TTL
   - Implementasi authentication di aplikasi

3. **Folder Structure:**
   ```
   safety-riding/
   ├── event-photos/     (public)
   ├── public-assets/    (public)
   └── private-docs/     (private, not in policy)
   ```

---

## 📞 Support

Jika masih tidak bisa:

1. **Check Dashboard:**
   - Bucket → Settings → Public Access → Status harus "Enabled"
   - R2.dev URL harus ada dan visible

2. **Check Config:**
   ```bash
   # Verify .env
   cat .env | grep STORAGE

   # Should show:
   # STORAGE_BASE_URL=https://pub-<hash>.r2.dev
   ```

3. **Check Logs:**
   ```bash
   # Run app dan cek URL yang disimpan
   ./safety-riding

   # Log seharusnya show:
   # File uploaded to: https://pub-<hash>.r2.dev/event-photos/xxx.jpg
   ```

4. **Manual Test:**
   ```bash
   # Upload via mc
   echo "test" > test.txt
   mc cp test.txt r2/safety-riding/event-photos/

   # Try access
   curl https://pub-<hash>.r2.dev/event-photos/test.txt
   ```

---

**Last Updated:** 2025-01-06
