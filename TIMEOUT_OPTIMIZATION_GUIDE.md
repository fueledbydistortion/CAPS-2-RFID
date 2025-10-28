# Vercel Timeout Optimization Guide

## Problem Summary

Your Vercel deployment was experiencing 504 timeout errors with the following endpoints:

- `/api/schedules` - Timing out after 300 seconds
- `/api/notifications/user/{userId}` - Timing out after 300 seconds
- `/api/notifications/user/{userId}/unread-count` - Timing out after 300 seconds

## Root Causes Identified

1. **Vercel Function Timeout**: `maxDuration` was set to 30 seconds (too restrictive)
2. **Inefficient Database Queries**: Fetching all data without pagination
3. **No Connection Optimization**: Firebase connections not optimized for serverless
4. **Missing Timeout Handling**: No timeout protection for database operations
5. **No Caching**: Repeated queries hitting database unnecessarily

## Optimizations Implemented

### 1. Vercel Configuration (`server/vercel.json`)

```json
{
  "functions": {
    "api/index.js": {
      "maxDuration": 300, // Increased from 30 to 300 seconds
      "memory": 1024
    }
  }
}
```

### 2. Database Query Optimization

- **Pagination**: Added pagination to `/api/schedules` and `/api/notifications`
- **Filtering**: Added query parameters for filtering (day, sectionId, teacherId, subjectId)
- **Limit Caps**: Maximum 100 items per page for schedules, 50 for notifications

### 3. Timeout Protection (`server/utils/timeoutWrapper.js`)

```javascript
const withTimeout = (dbOperation, timeoutMs = 10000) => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    // ... implementation
  });
};
```

### 4. Caching Strategy (`server/utils/cache.js`)

- **In-memory cache** for frequently accessed data
- **5-minute TTL** for schedule and notification data
- **Cache invalidation** on data updates
- **Cache statistics** for monitoring

### 5. Firebase Connection Optimization

```javascript
const appConfig = {
  databaseURL,
  storageBucket,
  httpAgent: {
    timeout: 10000, // 10 seconds timeout
    keepAlive: true,
    keepAliveMsecs: 30000,
  },
};
```

### 6. Health Monitoring (`/api/health`)

- **Basic health check**: `/api/health`
- **Detailed metrics**: `/api/health/detailed`
- **Database connectivity tests**
- **Cache statistics**
- **Memory usage monitoring**

## API Usage Examples

### Schedules with Pagination

```bash
# Get first page (50 items)
GET /api/schedules?page=1&limit=50

# Filter by day
GET /api/schedules?day=Monday&page=1&limit=20

# Filter by section
GET /api/schedules?sectionId=section123&page=1&limit=30
```

### Notifications with Pagination

```bash
# Get user notifications (paginated)
GET /api/notifications/user/userId?page=1&limit=20

# Get only unread notifications
GET /api/notifications/user/userId?unreadOnly=true&page=1&limit=10

# Filter by type
GET /api/notifications/user/userId?type=announcement&page=1&limit=15
```

## Performance Improvements

### Before Optimization

- ❌ 30-second function timeout
- ❌ No pagination (fetching all data)
- ❌ No caching
- ❌ No timeout protection
- ❌ Basic Firebase connection

### After Optimization

- ✅ 300-second function timeout
- ✅ Pagination with configurable limits
- ✅ 5-minute caching with invalidation
- ✅ 10-second timeout protection
- ✅ Optimized Firebase connections
- ✅ Health monitoring endpoints

## Monitoring and Debugging

### Health Check Endpoints

```bash
# Basic health check
curl https://your-app.vercel.app/api/health

# Detailed metrics
curl https://your-app.vercel.app/api/health/detailed
```

### Cache Statistics

The health endpoint provides cache statistics:

```json
{
  "cache": {
    "total": 15,
    "valid": 12,
    "expired": 3
  }
}
```

## Deployment Steps

1. **Deploy the updated code** to Vercel
2. **Monitor the health endpoint** to ensure everything is working
3. **Test the pagination** with different parameters
4. **Check cache performance** via health metrics
5. **Monitor timeout errors** in Vercel dashboard

## Additional Recommendations

### 1. Database Indexing

Consider adding Firebase database rules for better query performance:

```json
{
  "rules": {
    "schedules": {
      ".indexOn": ["day", "sectionId", "teacherId", "subjectId", "createdAt"]
    },
    "notifications": {
      ".indexOn": ["recipientId", "type", "createdAt"]
    }
  }
}
```

### 2. CDN Caching

For static assets, consider using Vercel's CDN caching:

```javascript
// Add cache headers for static responses
res.setHeader("Cache-Control", "public, max-age=300"); // 5 minutes
```

### 3. Database Connection Pooling

For high-traffic scenarios, consider implementing connection pooling or using Firebase's connection optimization features.

### 4. Monitoring

Set up monitoring for:

- Function execution time
- Memory usage
- Cache hit rates
- Database response times

## Expected Results

After implementing these optimizations, you should see:

- ✅ **Eliminated timeout errors** (504 responses)
- ✅ **Faster response times** (cached data)
- ✅ **Better scalability** (pagination)
- ✅ **Improved reliability** (timeout protection)
- ✅ **Better monitoring** (health endpoints)

## Troubleshooting

If you still experience issues:

1. **Check Vercel logs** for specific error messages
2. **Monitor health endpoint** for database connectivity
3. **Verify environment variables** are set correctly
4. **Test with smaller datasets** to isolate issues
5. **Check Firebase quotas** and limits

The optimizations should resolve the timeout issues and provide a much more robust API experience.
