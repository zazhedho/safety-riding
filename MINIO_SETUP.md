# MinIO Setup Guide

This guide explains how to set up and use MinIO for file storage in the Safety Riding application.

## What is MinIO?

MinIO is an open-source object storage server compatible with Amazon S3 APIs. It's used in this application to store event photos and other media files.

## Installation

### Option 1: Using Docker (Recommended)

1. Create a docker-compose.yml file or add MinIO to your existing one:

```yaml
services:
  minio:
    image: minio/minio:latest
    container_name: safety-riding-minio
    ports:
      - "9000:9000"      # API port
      - "9001:9001"      # Console port
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data
    networks:
      - safety-riding-network

volumes:
  minio_data:
    driver: local

networks:
  safety-riding-network:
    driver: bridge
```

2. Start MinIO:

```bash
docker-compose up -d minio
```

3. Access MinIO Console at: http://localhost:9001
   - Username: minioadmin
   - Password: minioadmin

### Option 2: Standalone Installation

**macOS:**
```bash
brew install minio/stable/minio
minio server /data
```

**Linux:**
```bash
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
./minio server /data
```

**Windows:**
Download from: https://dl.min.io/server/minio/release/windows-amd64/minio.exe
```cmd
minio.exe server C:\data
```

## Configuration

### Environment Variables

The application uses the following MinIO configuration in the `.env` file:

```env
# MinIO Configuration
MINIO_ENDPOINT=localhost:9000          # MinIO server endpoint
MINIO_ACCESS_KEY=minioadmin            # Access key (like AWS Access Key)
MINIO_SECRET_KEY=minioadmin            # Secret key (like AWS Secret Key)
MINIO_BUCKET_NAME=safety-riding        # Bucket name for storing files
MINIO_USE_SSL=false                    # Set to true if using HTTPS
MINIO_BASE_URL=http://localhost:9000   # Public URL to access files
```

### For Production

When deploying to production, make sure to:

1. **Change default credentials:**
   ```env
   MINIO_ACCESS_KEY=your-secure-access-key
   MINIO_SECRET_KEY=your-secure-secret-key-min-8-chars
   ```

2. **Enable SSL:**
   ```env
   MINIO_USE_SSL=true
   MINIO_BASE_URL=https://yourdomain.com
   ```

3. **Use a proper domain:**
   - Set up a reverse proxy (nginx/Apache)
   - Configure SSL certificate
   - Update MINIO_BASE_URL to your domain

## Bucket Configuration

The application automatically creates the bucket if it doesn't exist. The bucket is configured with:

- **Bucket Name:** Configured via `MINIO_BUCKET_NAME`
- **Access Policy:** Public read access (files can be read by anyone with the URL)
- **Folder Structure:**
  - `event-photos/` - Event photos uploaded via the API

## Usage in the Application

### Upload Event Photos

**Endpoint:** `POST /api/event/:id/photos`

**Request Type:** `multipart/form-data`

**Fields:**
- `photos` (required): Array of image files
- `captions` (optional): Array of captions for each photo
- `photo_orders` (optional): Array of display orders for photos

**Example using cURL:**

```bash
curl -X POST http://localhost:8080/api/event/:id/photos \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "photos=@photo1.jpg" \
  -F "photos=@photo2.jpg" \
  -F "captions[]=First photo" \
  -F "captions[]=Second photo" \
  -F "photo_orders[]=1" \
  -F "photo_orders[]=2"
```

**Example using JavaScript (FormData):**

```javascript
const formData = new FormData();
formData.append('photos', file1);
formData.append('photos', file2);
formData.append('captions', 'First photo');
formData.append('captions', 'Second photo');
formData.append('photo_orders', '1');
formData.append('photo_orders', '2');

fetch(`http://localhost:8080/api/event/${eventId}/photos`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

### File Naming Convention

Uploaded files are automatically renamed using the pattern:
```
YYYYMMDD_HHMMSS_<uuid>.ext
```

Example: `20250101_143022_a1b2c3d4.jpg`

This ensures:
- No filename conflicts
- Easy sorting by date
- Unique identification

## Monitoring and Management

### MinIO Console

Access the web console at: http://localhost:9001

Features:
- Browse buckets and files
- Upload/download files manually
- Monitor storage usage
- Configure bucket policies
- View access logs

### Check Storage Status

```bash
# Using MinIO Client (mc)
mc alias set local http://localhost:9000 minioadmin minioadmin
mc admin info local
mc ls local/safety-riding
```

## Troubleshooting

### Cannot connect to MinIO

1. Check if MinIO is running:
   ```bash
   docker ps | grep minio
   # or
   curl http://localhost:9000/minio/health/live
   ```

2. Verify environment variables in `.env`

3. Check network connectivity

### Bucket creation fails

- Ensure MinIO credentials are correct
- Check MinIO server logs: `docker logs safety-riding-minio`
- Verify bucket name follows naming rules (lowercase, no special chars except hyphens)

### File upload fails

1. Check file size limits in your server configuration
2. Verify MinIO storage has enough space
3. Check file permissions
4. Review application logs for detailed error messages

### Files not accessible

1. Verify bucket policy allows public read
2. Check MINIO_BASE_URL is correctly configured
3. Ensure firewall allows access to port 9000

## Security Best Practices

1. **Never commit credentials** to version control
2. **Use strong passwords** in production (min 8 characters)
3. **Enable SSL/TLS** for production deployments
4. **Restrict bucket access** - only make necessary buckets public
5. **Regular backups** - Set up periodic backups of MinIO data
6. **Monitor access logs** - Review who's accessing your files
7. **Use IAM policies** - Create specific access keys per application

## Backup and Recovery

### Backup MinIO Data

```bash
# Using docker volumes
docker run --rm -v minio_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/minio-backup.tar.gz /data

# Or using MinIO Client
mc mirror local/safety-riding /backup/safety-riding
```

### Restore from Backup

```bash
# Restore volume
docker run --rm -v minio_data:/data -v $(pwd):/backup \
  alpine tar xzf /backup/minio-backup.tar.gz -C /

# Or using MinIO Client
mc mirror /backup/safety-riding local/safety-riding
```

## Additional Resources

- [MinIO Documentation](https://min.io/docs/minio/linux/index.html)
- [MinIO Client Guide](https://min.io/docs/minio/linux/reference/minio-mc.html)
- [MinIO Docker Setup](https://min.io/docs/minio/container/index.html)
- [S3 API Compatibility](https://docs.min.io/docs/minio-server-limits-per-tenant.html)

## Support

For issues related to MinIO integration in this application, please check:
1. Application logs in `logs/` directory
2. MinIO server logs: `docker logs safety-riding-minio`
3. GitHub Issues: [Your Repository Issues]
