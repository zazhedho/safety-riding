# Storage Configuration Guide

The Safety Riding API supports two object storage providers:
1. **MinIO** (Self-hosted, S3-compatible)
2. **Cloudflare R2** (Cloud-based, S3-compatible)

You can easily switch between providers by changing environment variables.

---

## Quick Start

### Using MinIO (Default)

MinIO is configured by default in `docker-compose.yml`. Just run:

```bash
docker-compose up -d
```

### Using Cloudflare R2

Update your `.env` file with R2 credentials:

```env
STORAGE_PROVIDER=r2
STORAGE_ENDPOINT=<account_id>.r2.cloudflarestorage.com
STORAGE_ACCESS_KEY=<your_r2_access_key_id>
STORAGE_SECRET_KEY=<your_r2_secret_access_key>
STORAGE_BUCKET_NAME=safety-riding
STORAGE_USE_SSL=true
STORAGE_BASE_URL=https://pub-<hash>.r2.dev
R2_ACCOUNT_ID=<your_cloudflare_account_id>
```

---

## Configuration Reference

### Environment Variables

| Variable | Description | MinIO Example | R2 Example |
|----------|-------------|---------------|------------|
| `STORAGE_PROVIDER` | Storage provider type | `minio` | `r2` |
| `STORAGE_ENDPOINT` | Storage endpoint | `localhost:9000` | `<account>.r2.cloudflarestorage.com` |
| `STORAGE_ACCESS_KEY` | Access key ID | `minioadmin` | Your R2 access key |
| `STORAGE_SECRET_KEY` | Secret access key | `minioadmin` | Your R2 secret key |
| `STORAGE_BUCKET_NAME` | Bucket name | `safety-riding` | `safety-riding` |
| `STORAGE_USE_SSL` | Use HTTPS | `false` | `true` |
| `STORAGE_BASE_URL` | Public URL for files | `http://localhost:9000` | `https://pub-xxx.r2.dev` |
| `STORAGE_REGION` | Region (S3 compatible) | `auto` | `auto` |
| `R2_ACCOUNT_ID` | Cloudflare account ID (R2 only) | - | Your account ID |

---

## Setup Instructions

### Option 1: MinIO (Self-Hosted)

#### 1. Using Docker Compose (Recommended)

MinIO is already configured in `docker-compose.yml`:

```yaml
services:
  minio:
    image: minio/minio:latest
    ports:
      - "9000:9000"  # API
      - "9001:9001"  # Console
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
```

**Access MinIO Console:**
- URL: http://localhost:9001
- Username: `minioadmin`
- Password: `minioadmin`

#### 2. Standalone Installation

If not using Docker:

```bash
# Download MinIO
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio

# Run MinIO
./minio server /data --console-address ":9001"
```

Configure environment:
```env
STORAGE_PROVIDER=minio
STORAGE_ENDPOINT=localhost:9000
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin
STORAGE_BUCKET_NAME=safety-riding
STORAGE_USE_SSL=false
STORAGE_BASE_URL=http://localhost:9000
```

---

### Option 2: Cloudflare R2

#### 1. Create R2 Bucket

⚠️ **IMPORTANT**: R2 buckets **MUST** be created manually via Cloudflare Dashboard. The application cannot create buckets automatically (R2 limitation).

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select **R2** from the sidebar
3. Click **Create bucket**
4. Enter bucket name: `safety-riding` (must match `STORAGE_BUCKET_NAME` in your config)
5. Click **Create bucket**
6. **Verify the bucket was created successfully before proceeding**

#### 2. Generate API Tokens (S3 Credentials)

In R2 dashboard, you'll see **S3 API** section. This is where you get credentials.

1. Click **Manage R2 API Tokens** (near the S3 API section)
2. Click **Create API token**
3. Configure token:
   - **Token name**: Enter a name (e.g., "safety-riding-api")
   - **Permissions**:
     - Choose **Object Read & Write** (recommended)
     - Or **Admin Read & Write** (for full access)
   - **Specify bucket(s)**:
     - Choose **Apply to specific buckets only**
     - Select your `safety-riding` bucket
     - Or choose **Apply to all buckets in this account**
4. Click **Create API token**
5. **IMPORTANT: Copy and save these credentials immediately** (you won't see them again):
   - **Access Key ID** (example: `a1b2c3d4e5f6g7h8i9j0`)
   - **Secret Access Key** (example: `SuperSecretKey123456789abcdefg`)
   - Keep them secure!

**Screenshot location in Cloudflare:**
```
Dashboard → R2 → [Right Sidebar]
├─ Account ID: abc123def456
└─ S3 API: (click to see endpoint info)
    └─ Manage R2 API Tokens → Create API token
```

#### 3. Get Public URL

**Option A: Use R2.dev subdomain (Free, Public)**

1. In bucket settings, enable **Public Access**
2. Enable **R2.dev subdomain**
3. Your public URL: `https://pub-<hash>.r2.dev`

**Option B: Use Custom Domain (Recommended for Production)**

1. Go to bucket settings → **Custom Domains**
2. Click **Connect Domain**
3. Enter your domain (e.g., `cdn.yourdomain.com`)
4. Add DNS record as instructed
5. Use custom domain as `STORAGE_BASE_URL`

#### 4. Configure Environment

**Step-by-step to get each value:**

1. **Account ID & Endpoint:**
   - In R2 Dashboard, right sidebar shows:
     - `Account ID`: Copy this (e.g., `abc123def456`)
     - `S3 API`: Click to expand, shows endpoint
   - **Build endpoint**: `<Account-ID>.r2.cloudflarestorage.com`
   - Example: If Account ID is `abc123def456`, endpoint is `abc123def456.r2.cloudflarestorage.com`

2. **Access Key & Secret Key:**
   - From Step 2 (API Token creation)
   - Copy the **Access Key ID** and **Secret Access Key**

3. **Public URL (Base URL):**
   - Go to your bucket → Settings
   - Look for **Public Access** section
   - Enable **R2.dev subdomain**
   - Copy the URL shown (e.g., `https://pub-xyz789abc.r2.dev`)

Update `.env`:

```env
STORAGE_PROVIDER=r2

# Endpoint: <Account-ID>.r2.cloudflarestorage.com (NO https://)
STORAGE_ENDPOINT=<your-account-id>.r2.cloudflarestorage.com

# From API Token (Step 2)
STORAGE_ACCESS_KEY=<access-key-from-api-token>
STORAGE_SECRET_KEY=<secret-key-from-api-token>

# Your bucket name
STORAGE_BUCKET_NAME=safety-riding

# Always true for R2
STORAGE_USE_SSL=true

# Public URL from bucket settings (WITH https://)
STORAGE_BASE_URL=https://pub-<hash>.r2.dev

# Same as Account ID
R2_ACCOUNT_ID=<your-account-id>
```

**⚠️ Important Notes:**
- `STORAGE_ENDPOINT` should NOT include `https://` or `http://`
- `STORAGE_BASE_URL` MUST include `https://`
- Bucket must already exist in Cloudflare Dashboard
- Account ID format: usually 32 hex characters

**Real Example (with fake credentials):**
```env
STORAGE_PROVIDER=r2
STORAGE_ENDPOINT=4a7b2c9e8f1d3a5b6c4e8f2a1b9d7c3e.r2.cloudflarestorage.com
STORAGE_ACCESS_KEY=f8e7d6c5b4a39281736455
STORAGE_SECRET_KEY=YourSuperSecretKeyHere123456789ABC
STORAGE_BUCKET_NAME=safety-riding
STORAGE_USE_SSL=true
STORAGE_BASE_URL=https://pub-a1b2c3d4e5f6.r2.dev
R2_ACCOUNT_ID=4a7b2c9e8f1d3a5b6c4e8f2a1b9d7c3e
```

**How to verify your values:**

| Variable | Where to find | Format |
|----------|---------------|--------|
| `Account ID` | R2 Dashboard → Right sidebar | 32 hex chars (e.g., `4a7b2c9e...`) |
| `STORAGE_ENDPOINT` | Build from Account ID | `<account-id>.r2.cloudflarestorage.com` |
| `Access Key` | After creating API token | 20-40 chars alphanumeric |
| `Secret Key` | After creating API token | Long string |
| `Base URL` | Bucket → Settings → R2.dev | `https://pub-<hash>.r2.dev` |

#### 5. Set Bucket CORS (Optional, for frontend uploads)

If you need to upload from browser:

1. In R2 bucket settings → **CORS policy**
2. Add rule:

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

---

## Switching Between Providers

### From MinIO to R2

1. Create R2 bucket and get credentials (see above)
2. Update `.env`:
   ```env
   STORAGE_PROVIDER=r2
   STORAGE_ENDPOINT=<account-id>.r2.cloudflarestorage.com
   STORAGE_ACCESS_KEY=<r2-access-key>
   STORAGE_SECRET_KEY=<r2-secret-key>
   STORAGE_BASE_URL=https://pub-<hash>.r2.dev
   STORAGE_USE_SSL=true
   ```
3. Restart application

**Data Migration:**
Files don't automatically migrate. To move existing files:

```bash
# Install MinIO Client (mc)
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc

# Configure MinIO source
./mc alias set minio-local http://localhost:9000 minioadmin minioadmin

# Configure R2 destination
./mc alias set r2 https://<account-id>.r2.cloudflarestorage.com <access-key> <secret-key>

# Mirror/sync files
./mc mirror minio-local/safety-riding r2/safety-riding
```

### From R2 to MinIO

1. Start MinIO (via docker-compose or standalone)
2. Update `.env`:
   ```env
   STORAGE_PROVIDER=minio
   STORAGE_ENDPOINT=localhost:9000
   STORAGE_ACCESS_KEY=minioadmin
   STORAGE_SECRET_KEY=minioadmin
   STORAGE_BASE_URL=http://localhost:9000
   STORAGE_USE_SSL=false
   ```
3. Restart application

**Data Migration:**
```bash
# Mirror from R2 to MinIO
./mc mirror r2/safety-riding minio-local/safety-riding
```

---

## Cost Comparison

### MinIO (Self-Hosted)
- ✅ **Free** (only infrastructure costs)
- ✅ Full control over data
- ✅ No egress fees
- ❌ Requires server maintenance
- ❌ You pay for infrastructure (EC2, storage, bandwidth)

**Best for:**
- On-premise deployments
- High egress traffic
- Regulatory compliance requiring data sovereignty

### Cloudflare R2
- ✅ **Zero egress fees** (unlike AWS S3)
- ✅ No infrastructure management
- ✅ Global CDN included
- ✅ Automatic scaling
- ❌ Pay for storage ($0.015/GB/month)
- ❌ Pay for operations (Class A: $4.50/million, Class B: $0.36/million)

**Pricing:**
- Storage: $0.015/GB/month
- Class A operations (writes): $4.50/million requests
- Class B operations (reads): $0.36/million requests
- **Egress: $0.00** (free!)

**Best for:**
- Production deployments
- Global applications
- High traffic websites
- Startups (free tier: 10GB storage)

---

## Troubleshooting

### Connection Errors

**MinIO:**
```bash
# Check if MinIO is running
docker ps | grep minio

# Check MinIO logs
docker logs safety_riding_minio

# Test connection
curl http://localhost:9000/minio/health/live
```

**R2:**
```bash
# Verify credentials
# Install AWS CLI or MinIO Client
mc alias set r2-test https://<account>.r2.cloudflarestorage.com <key> <secret>
mc ls r2-test
```

### Error: "301 Moved Permanently" (R2)

This error occurs when:
1. Endpoint includes `https://` prefix (should be removed)
2. Bucket doesn't exist yet
3. Incorrect account ID

**Solution:**

✅ **Correct Configuration:**
```env
STORAGE_ENDPOINT=abc123def456.r2.cloudflarestorage.com
# NO https:// prefix!
```

❌ **Wrong Configuration:**
```env
STORAGE_ENDPOINT=https://abc123def456.r2.cloudflarestorage.com
# This will cause 301 error
```

**Checklist:**
- [ ] Remove `https://` from `STORAGE_ENDPOINT`
- [ ] Verify bucket exists in Cloudflare Dashboard
- [ ] Confirm `STORAGE_BUCKET_NAME` matches bucket name exactly
- [ ] Check `R2_ACCOUNT_ID` is correct
- [ ] Ensure API token has permissions for the bucket

### Bucket Not Found

- MinIO: Bucket is auto-created on first run
- R2: Create bucket manually in Cloudflare Dashboard

### Access Denied

**MinIO:**
- Check `STORAGE_ACCESS_KEY` and `STORAGE_SECRET_KEY`
- Verify bucket policy (should allow public read)

**R2:**
- Verify API token has correct permissions
- Check bucket exists
- Ensure token scope includes the bucket

### Files Not Accessible

**MinIO:**
- Check `STORAGE_BASE_URL` matches your MinIO endpoint
- Verify bucket policy allows public access

**R2:**
- Enable R2.dev subdomain or configure custom domain
- Check CORS settings if uploading from browser
- Verify `STORAGE_BASE_URL` matches your public URL

---

## Architecture

### Storage Interface

The application uses a provider-agnostic interface:

```go
type StorageProvider interface {
    UploadFile(ctx context.Context, file multipart.File, fileHeader *multipart.FileHeader, folder string) (string, error)
    UploadFileFromBytes(ctx context.Context, data []byte, filename string, folder string, contentType string) (string, error)
    DeleteFile(ctx context.Context, fileURL string) error
    GetFileURL(objectName string) string
    DownloadFile(ctx context.Context, objectName string) (io.ReadCloser, error)
}
```

### Implementations

- **MinIOAdapter**: `/pkg/storage/minio_adapter.go`
- **R2Adapter**: `/pkg/storage/r2_adapter.go`
- **Factory**: `/pkg/storage/factory.go`

### Used By

Event photos are stored via the storage provider:
- Upload: `EventService.AddEventPhotosFromFiles()`
- Delete: `EventService.DeleteEventPhoto()`

---

## FAQ

**Q: Can I use both MinIO and R2 simultaneously?**
A: No, the application uses one provider at a time. However, you can deploy multiple instances with different configurations.

**Q: Do I need to change code when switching providers?**
A: No, just change environment variables and restart.

**Q: What happens to existing files when switching providers?**
A: Existing files remain in the old storage. You need to manually migrate (see "Data Migration" above).

**Q: Can I use AWS S3 instead?**
A: The current implementation supports MinIO and R2. However, since both use S3-compatible APIs, you can create an S3 adapter following the same pattern.

**Q: Is R2 really free for egress?**
A: Yes! Cloudflare R2 has zero egress fees, unlike AWS S3 which charges for bandwidth.

**Q: Which should I choose for production?**
A:
- **High traffic, global users**: Use R2 (free egress + global CDN)
- **Low traffic, on-premise**: Use MinIO (full control, no vendor lock-in)
- **Regulatory compliance**: Use MinIO (data sovereignty)

---

## Support

For issues or questions:
- GitHub Issues: [Your repo URL]
- Email: zaiduszhuhur@gmail.com
- Documentation: This file

---

**Last Updated:** 2025-01-06
