# YouTube Video Auto-Uploader

Automate YouTube video uploads from configured folders with scheduled publishing, metadata management, and monitoring.

## Features

- **Scheduled Uploads**: Configure cron jobs per folder for automated uploads
- **Development Mode**: Test functionality without consuming YouTube API quota
- **Quota Management**: Built-in rate limiting and quota tracking for YouTube API
- **File Management**:
  - Automatic archiving after successful uploads
  - Duplicate upload prevention
  - Support for video thumbnails
- **Customization**:
  - Configurable metadata templates per folder
  - Custom privacy settings
  - Flexible folder structure
- **Reliability**:
  - Error handling with automatic retries
  - Upload status monitoring and logging
  - Transaction-safe operations

## Prerequisites

- Node.js (v18 or higher)
- YouTube Data API v3 credentials
- PostgreSQL database

## Installation

1. Clone the repository:

```bash
git clone https://github.com/gsachdeva0422/youtube-uploader.git
cd youtube-uploader
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp config/example.env config/default.env
```

Edit `default.env` with your credentials:

```env
NODE_ENV=development
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=
YOUTUBE_REDIRECT_URI=
YOUTUBE_REFRESH_TOKEN=
PORT=3000
BASE_VIDEOS_PATH=
```

## Usage

1. Start the server:

```bash
npm run dev
```

2. Configure upload folders in the database:

```sql
INSERT INTO folder_configs (
    folder_path,
    folder_name,
    cron_expression,
    privacy_status,
    title_template,
    description_template
) VALUES (
    '/path/to/videos',
    'Channel Videos',
    '*/5 * * * *',
    'private',
    '{filename} - My Channel',
    'Uploaded via Auto-Uploader\n\n{filename}'
);
```

3. Place videos in configured folders following the structure:

```
BASE_VIDEOS_PATH/
  └── folder_name/
      ├── 1-video-title/
      │   ├── video.mp4
      │   └── thumbnail.jpg (optional)
      └── archive/
```

## Development Mode

Set `NODE_ENV=development` to simulate uploads without hitting YouTube API.

## Error Handling

- Failed uploads are logged with error details
- Automatic retries for transient failures
- Quota exceeded handling with cooldown periods

## License

MIT

## Contributing

Pull requests welcome. For major changes, open an issue first.
