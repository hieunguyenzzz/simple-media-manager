# Simple Media Manager

A simple media manager for images and videos built with Next.js, PostgreSQL, and MinIO.

## Features

- User authentication (register/login)
- Upload images and videos
- Gallery view with filtering
- REST API with Bearer token authentication

## Setup

1. Copy `.env.example` to `.env` and configure your environment variables:

```bash
cp .env.example .env
```

2. Install dependencies:

```bash
npm install
```

3. Generate Prisma client and push schema:

```bash
npx prisma generate
npx prisma db push
```

4. Start the development server:

```bash
npm run dev
```

## API Usage

### Authentication

#### Register

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "yourpassword",
    "name": "Your Name"
  }'
```

Response:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Your Name",
    "createdAt": "2025-12-06T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "message": "User registered successfully"
}
```

#### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "yourpassword"
  }'
```

Response:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Your Name",
    "createdAt": "2025-12-06T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "message": "Login successful"
}
```

#### Logout

```bash
curl -X POST http://localhost:3000/api/auth/logout
```

#### Get Current User

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Media

All media endpoints require authentication via Bearer token.

#### Upload Media

```bash
curl -X POST http://localhost:3000/api/media \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/image.jpg"
```

Response:
```json
{
  "media": {
    "id": "uuid",
    "filename": "generated-uuid.jpg",
    "originalName": "image.jpg",
    "mimeType": "image/jpeg",
    "size": 12345,
    "url": "https://your-minio-endpoint/media/generated-uuid.jpg",
    "type": "IMAGE",
    "userId": "user-uuid",
    "createdAt": "2025-12-06T00:00:00.000Z",
    "updatedAt": "2025-12-06T00:00:00.000Z"
  },
  "message": "File uploaded successfully"
}
```

Supported file types:
- Images: JPEG, PNG, GIF, WebP, SVG
- Videos: MP4, WebM, OGG, MOV

Max file size: 100MB

#### List Media

```bash
curl "http://localhost:3000/api/media?page=1&limit=20&type=IMAGE" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Query parameters:
- `page` (optional): Page number, default 1
- `limit` (optional): Items per page, default 20
- `type` (optional): Filter by type - `IMAGE` or `VIDEO`

Response:
```json
{
  "media": [
    {
      "id": "uuid",
      "filename": "generated-uuid.jpg",
      "originalName": "image.jpg",
      "mimeType": "image/jpeg",
      "size": 12345,
      "url": "https://your-minio-endpoint/media/generated-uuid.jpg",
      "type": "IMAGE",
      "userId": "user-uuid",
      "createdAt": "2025-12-06T00:00:00.000Z",
      "updatedAt": "2025-12-06T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

#### Delete Media

```bash
curl -X DELETE "http://localhost:3000/api/media?id=MEDIA_UUID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
```json
{
  "message": "Media deleted successfully"
}
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `MINIO_ENDPOINT` | MinIO server hostname |
| `MINIO_PORT` | MinIO server port |
| `MINIO_USE_SSL` | Use SSL for MinIO (`true`/`false`) |
| `MINIO_ACCESS_KEY` | MinIO access key |
| `MINIO_SECRET_KEY` | MinIO secret key |
| `MINIO_BUCKET` | MinIO bucket name |
