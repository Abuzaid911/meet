# Cloudflare R2 Setup for Meet App

This guide explains how to set up Cloudflare R2 for image storage in the Meet App.

## 1. Create a Cloudflare Account

If you don't already have one, create a Cloudflare account at [cloudflare.com](https://cloudflare.com).

## 2. Set Up R2 Storage

1. Once logged in, navigate to **R2** from the sidebar.
2. If this is your first time using R2, you'll need to create a subscription plan.
3. Click on **Create bucket** and give it a name (e.g., `meet-app-uploads`).
4. Choose a region close to your users.

## 3. Set Up Public Access

To allow public access to your images:

1. Go to your bucket settings.
2. Go to **Public Access** tab.
3. Enable **Public Access**.
4. Note the public URL format for your bucket, which should look like `https://pub-XXXX.r2.dev`.

## 4. Create API Tokens

1. Go to **R2** > **Overview** > **Manage R2 API Tokens**.
2. Click **Create API Token**.
3. Select the appropriate permissions:
   - Object Read (for getting files)
   - Object Write (for uploading files)
   - Object Delete (for deleting files)
4. Set appropriate bucket access (either the specific bucket or all buckets).
5. Copy the Access Key ID and Secret Access Key.

## 5. Configure Environment Variables

Add the following variables to your `.env.local` file:

```
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_ACCESS_KEY_ID=your_access_key_id
CLOUDFLARE_SECRET_ACCESS_KEY=your_secret_access_key
CLOUDFLARE_R2_BUCKET_NAME=your_bucket_name
CLOUDFLARE_R2_PUBLIC_URL=https://your-public-domain.r2.dev
```

- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID found in the URL when logged in to the dashboard.
- `CLOUDFLARE_ACCESS_KEY_ID`: The Access Key ID from step 4.
- `CLOUDFLARE_SECRET_ACCESS_KEY`: The Secret Access Key from step 4.
- `CLOUDFLARE_R2_BUCKET_NAME`: The name of your bucket, e.g., `meet-app-uploads`.
- `CLOUDFLARE_R2_PUBLIC_URL`: The public URL of your bucket, e.g., `https://pub-XXXX.r2.dev`.

## 6. CORS Configuration (Optional)

If you need to set up CORS for direct client-side uploads:

1. Go to your bucket settings.
2. Select the **Settings** tab.
3. Configure CORS rules as needed, for example:

```json
[
  {
    "AllowedOrigins": ["https://yourdomain.com", "http://localhost:3000"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }
]
```

## 7. Monitoring Usage

Monitor your R2 usage in the Cloudflare dashboard to keep track of storage and bandwidth costs. R2 has a generous free tier, but it's always good to monitor usage.

## Storage Structure

In the Meet App, files are stored with the following structure:

- Event photos: `events/{eventId}/{userId}-{timestamp}.{extension}`
- Profile images: `profile-images/{userId}-{timestamp}.{extension}`

This organization makes it easy to manage and clean up photos associated with specific events or users. 