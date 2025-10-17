# Beauty N Brushes - API Reference Documentation

## Base URL

**Development**: `http://localhost:3000/api/v1`  
**Staging**: `https://staging.beautyandbrushes.com/api/v1`  
**Production**: `https://api.beautyandbrushes.com/api/v1`

---

## Authentication

All authenticated endpoints require a valid session token or JWT.

### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

---

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "meta": {
    "timestamp": "2025-10-06T12:00:00Z",
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-10-06T12:00:00Z",
    "requestId": "req_abc123"
  }
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Unprocessable Entity
- `429` - Too Many Requests
- `500` - Internal Server Error

---

## Authentication Endpoints

### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "Jane",
  "lastName": "Doe",
  "role": "CLIENT"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_abc123",
      "email": "user@example.com",
      "firstName": "Jane",
      "lastName": "Doe",
      "role": "CLIENT",
      "emailVerified": false
    },
    "message": "Verification email sent"
  }
}
```

---

### POST /auth/login
Authenticate user and receive session token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_abc123",
      "email": "user@example.com",
      "firstName": "Jane",
      "lastName": "Doe",
      "role": "CLIENT"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresAt": "2025-10-07T12:00:00Z"
  }
}
```

---

### POST /auth/logout
Invalidate current session.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

### POST /auth/forgot-password
Request password reset email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "message": "Password reset email sent"
  }
}
```

---

### POST /auth/reset-password
Reset password with token.

**Request Body:**
```json
{
  "token": "reset_token_abc123",
  "newPassword": "NewSecurePass123!"
}
```

**Response:** `200 OK`

---

## User Endpoints

### GET /users/me
Get current user profile.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "role": "CLIENT",
    "avatar": "https://cdn.bnb.com/avatars/user123.jpg",
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

---

### PATCH /users/me
Update current user profile.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "firstName": "Janet",
  "phone": "555-0100"
}
```

**Response:** `200 OK`

---

## Provider Endpoints

### GET /providers
Search and list providers.

**Query Parameters:**
- `search` (string) - Search term
- `city` (string) - Filter by city
- `category` (string) - Service category
- `page` (number) - Page number (default: 1)
- `limit` (number) - Items per page (default: 20)
- `sortBy` (string) - Sort field (rating, distance, price)
- `lat` (number) - Latitude for distance search
- `lng` (number) - Longitude for distance search
- `radius` (number) - Search radius in miles

**Example Request:**
```
GET /providers?city=Atlanta&category=hair&sortBy=rating&page=1
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "prv_123",
      "slug": "hair-studio-atlanta",
      "businessName": "Hair Studio Atlanta",
      "description": "Premium hair styling services",
      "city": "Atlanta",
      "state": "GA",
      "averageRating": 4.8,
      "totalReviews": 127,
      "distance": 2.3,
      "featuredImage": "https://cdn.bnb.com/providers/123.jpg",
      "services": [
        {
          "id": "srv_456",
          "title": "Box Braids",
          "priceMin": 150,
          "priceMax": 200
        }
      ]
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

---

### GET /providers/:slug
Get provider profile by slug.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "prv_123",
    "slug": "hair-studio-atlanta",
    "businessName": "Hair Studio Atlanta",
    "tagline": "Your Hair, Our Passion",
    "description": "We specialize in natural hair care...",
    "address": {
      "line1": "123 Main St",
      "city": "Atlanta",
      "state": "GA",
      "zipCode": "30301"
    },
    "contact": {
      "phone": "404-555-0100",
      "email": "contact@hairstudio.com",
      "instagram": "@hairstudioatl"
    },
    "hours": {
      "monday": { "start": "09:00", "end": "18:00" },
      "tuesday": { "start": "09:00", "end": "18:00" }
    },
    "branding": {
      "logo": "https://cdn.bnb.com/logos/123.jpg",
      "primaryColor": "#E94B8B",
      "secondaryColor": "#2D2D2D"
    },
    "stats": {
      "averageRating": 4.8,
      "totalReviews": 127,
      "totalBookings": 543,
      "yearsExperience": 8
    },
    "policies": {
      "cancellation": "24 hours notice required...",
      "deposit": "50% deposit required for all bookings"
    }
  }
}
```

---

### POST /providers/onboard
Create provider profile (requires PROVIDER role).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "businessName": "Hair Studio Atlanta",
  "description": "Premium hair styling services",
  "address": {
    "line1": "123 Main St",
    "city": "Atlanta",
    "state": "GA",
    "zipCode": "30301"
  },
  "phone": "404-555-0100",
  "categories": ["hair"]
}
```

**Response:** `201 Created`

---

## Service Endpoints

### GET /services
Search services.

**Query Parameters:**
- `search` (string)
- `categoryId` (string)
- `providerId` (string)
- `priceMin` (number)
- `priceMax` (number)
- `page` (number)
- `limit` (number)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "srv_456",
      "title": "Box Braids",
      "description": "Traditional box braids...",
      "priceMin": 150,
      "priceMax": 200,
      "priceType": "range",
      "durationMinutes": 180,
      "category": {
        "id": "cat_1",
        "name": "Hair"
      },
      "provider": {
        "id": "prv_123",
        "slug": "hair-studio-atlanta",
        "businessName": "Hair Studio Atlanta"
      },
      "featuredImage": "https://cdn.bnb.com/services/456.jpg",
      "media": [
        {
          "id": "med_789",
          "url": "https://cdn.bnb.com/media/789.jpg",
          "type": "image"
        }
      ]
    }
  ]
}
```

---

### GET /services/:id
Get service details.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "srv_456",
    "title": "Box Braids",
    "description": "Traditional box braids with premium synthetic or human hair...",
    "priceMin": 150,
    "priceMax": 200,
    "priceType": "range",
    "durationMinutes": 180,
    "depositRequired": true,
    "depositType": "percentage",
    "depositAmount": 50,
    "category": {
      "id": "cat_1",
      "name": "Hair",
      "slug": "hair"
    },
    "provider": {
      "id": "prv_123",
      "slug": "hair-studio-atlanta",
      "businessName": "Hair Studio Atlanta",
      "averageRating": 4.8
    },
    "media": [
      {
        "id": "med_789",
        "url": "https://cdn.bnb.com/media/789.jpg",
        "thumbnail": "https://cdn.bnb.com/media/789_thumb.jpg",
        "type": "image",
        "order": 1
      }
    ],
    "tags": ["braids", "box_braids", "protective_style"],
    "bookingCount": 87,
    "active": true
  }
}
```

---

### POST /services
Create new service (Provider only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "Box Braids",
  "description": "Traditional box braids...",
  "priceMin": 150,
  "priceMax": 200,
  "priceType": "range",
  "durationMinutes": 180,
  "categoryId": "cat_1",
  "subcategoryId": "sub_1",
  "depositRequired": true,
  "depositType": "percentage",
  "depositAmount": 50
}
```

**Response:** `201 Created`

---

## Booking Endpoints

### POST /bookings
Create new booking.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "serviceId": "srv_456",
  "date": "2025-10-15",
  "time": "10:00",
  "specialRequests": "Please use synthetic hair",
  "paymentMethodId": "pm_abc123"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "bkg_789",
    "serviceId": "srv_456",
    "clientId": "usr_123",
    "providerId": "prv_456",
    "date": "2025-10-15",
    "time": "10:00",
    "endTime": "13:00",
    "status": "confirmed",
    "paymentStatus": "deposit_paid",
    "totalAmount": 175,
    "depositAmount": 87.50,
    "balanceAmount": 87.50,
    "specialRequests": "Please use synthetic hair",
    "createdAt": "2025-10-06T12:00:00Z"
  }
}
```

---

### GET /bookings/:id
Get booking details.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "bkg_789",
    "status": "confirmed",
    "date": "2025-10-15",
    "time": "10:00",
    "service": {
      "id": "srv_456",
      "title": "Box Braids",
      "durationMinutes": 180
    },
    "provider": {
      "id": "prv_123",
      "businessName": "Hair Studio Atlanta",
      "address": "123 Main St, Atlanta, GA"
    },
    "client": {
      "id": "usr_123",
      "firstName": "Jane",
      "lastName": "Doe",
      "email": "jane@example.com"
    },
    "payment": {
      "totalAmount": 175,
      "depositPaid": 87.50,
      "balanceDue": 87.50,
      "paymentStatus": "deposit_paid"
    },
    "specialRequests": "Please use synthetic hair"
  }
}
```

---

### GET /bookings
List user's bookings.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `status` (string) - Filter by status
- `upcoming` (boolean) - Only future bookings
- `past` (boolean) - Only past bookings
- `page` (number)
- `limit` (number)

**Response:** `200 OK`

---

### PATCH /bookings/:id/cancel
Cancel a booking.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "reason": "Schedule conflict"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "bkg_789",
    "status": "cancelled_by_client",
    "cancellationFee": 43.75,
    "refundAmount": 43.75,
    "cancelledAt": "2025-10-06T12:00:00Z"
  }
}
```

---

### POST /bookings/:id/reschedule
Reschedule a booking.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "newDate": "2025-10-16",
  "newTime": "14:00"
}
```

**Response:** `200 OK`

---

## Availability Endpoints

### GET /availability/:providerId
Get provider availability.

**Query Parameters:**
- `date` (string) - YYYY-MM-DD format
- `month` (string) - YYYY-MM format
- `serviceId` (string) - Filter by service duration

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "providerId": "prv_123",
    "date": "2025-10-15",
    "slots": [
      {
        "time": "09:00",
        "available": true,
        "endTime": "12:00"
      },
      {
        "time": "10:00",
        "available": true,
        "endTime": "13:00"
      },
      {
        "time": "14:00",
        "available": false,
        "endTime": "17:00",
        "reason": "booked"
      }
    ]
  }
}
```

---

## Review Endpoints

### POST /reviews
Create a review.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "bookingId": "bkg_789",
  "overallRating": 5,
  "qualityRating": 5,
  "timelinessRating": 5,
  "professionalismRating": 5,
  "reviewText": "Amazing service! Highly recommend!",
  "photos": ["https://cdn.bnb.com/reviews/photo1.jpg"]
}
```

**Response:** `201 Created`

---

### GET /reviews
Get reviews for a provider.

**Query Parameters:**
- `providerId` (string) - Required
- `page` (number)
- `limit` (number)
- `sortBy` (string) - rating, date

**Response:** `200 OK`

---

## AI Endpoints

### POST /ai/match-inspiration
Match uploaded inspiration image to providers.

**Headers:** `Authorization: Bearer <token>`

**Request Body (multipart/form-data):**
```
image: <file>
location: "Atlanta, GA"
radius: 25
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "provider": {
          "id": "prv_123",
          "businessName": "Hair Studio Atlanta"
        },
        "service": {
          "id": "srv_456",
          "title": "Box Braids",
          "priceMin": 150
        },
        "matchScore": 0.92,
        "reasons": [
          "Similar braiding style",
          "Matching hair texture",
          "Color palette match"
        ],
        "matchingMedia": {
          "id": "med_789",
          "url": "https://cdn.bnb.com/media/789.jpg"
        }
      }
    ],
    "analysis": {
      "styleType": "box_braids",
      "hairLength": "long",
      "hairTexture": "4c",
      "complexity": "moderate",
      "colors": ["black", "brown"]
    }
  }
}
```

---

### POST /ai/generate-brand-theme
Generate brand theme from description.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "description": "warm, luxury, feminine, modern"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "primaryColor": "#E94B8B",
    "secondaryColor": "#2D2D2D",
    "accentColor": "#FFD700",
    "fontHeading": "Playfair Display",
    "fontBody": "Inter",
    "vibe": "Luxurious and feminine with modern sophistication"
  }
}
```

---

## Webhook Events

### Stripe Webhooks

**Endpoint**: `/api/webhooks/stripe`

**Events Handled:**
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`
- `account.updated`
- `payout.paid`

---

## Rate Limits

- **Anonymous requests**: 60/hour
- **Authenticated requests**: 1000/hour
- **AI endpoints**: 100/hour

**Rate Limit Headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1696598400
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Invalid input data |
| `UNAUTHORIZED` | Authentication required |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `CONFLICT` | Resource conflict |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `PAYMENT_FAILED` | Payment processing error |
| `INTERNAL_ERROR` | Server error |

---

**API Version**: 1.0  
**Last Updated**: October 6, 2025