# Firestore Database Schema

## Collections Structure

### users/
Stores user profile information
```json
{
  "uid": "firebase-uid",
  "email": "user@example.com",
  "displayName": "John Doe",
  "phoneNumber": "+251912345678",
  "role": "renter" || "owner" || "admin",
  "profilePhoto": "url-to-image",
  "bio": "Farmer in Addis Ababa",
  "address": "Addis Ababa, Ethiopia",
  "createdAt": timestamp,
  "updatedAt": timestamp,
  "walletBalance": 0,
  "verified": false,
  "verificationDate": null
}
```

### equipment/
Stores equipment listings
```json
{
  "equipmentId": "auto-generated",
  "ownerId": "uid-of-owner",
  "name": "John Deere Tractor",
  "category": "tractor" || "pump" || "thresher" || "plow",
  "description": "Well-maintained 40hp tractor",
  "photos": ["url1", "url2"],
  "pricePerDay": 500,
  "location": {
    "city": "Addis Ababa",
    "latitude": 9.0320,
    "longitude": 38.7469
  },
  "availability": "available" || "booked" || "maintenance",
  "specifications": {
    "horsepower": 40,
    "year": 2015,
    "condition": "good"
  },
  "reviews": 4.5,
  "totalBookings": 12,
  "createdAt": timestamp,
  "updatedAt": timestamp
}
```

### bookings/
Stores rental bookings
```json
{
  "bookingId": "auto-generated",
  "equipmentId": "equipment-id",
  "equipmentName": "John Deere Tractor",
  "ownerId": "uid-of-owner",
  "renterId": "uid-of-renter",
  "startDate": timestamp,
  "endDate": timestamp,
  "durationDays": 5,
  "pricePerDay": 500,
  "totalPrice": 2500,
  "commission": 250,
  "ownerEarnings": 2250,
  "status": "pending" || "confirmed" || "active" || "completed" || "cancelled",
  "paymentStatus": "unpaid" || "paid" || "refunded",
  "paymentMethod": "telebirr" || "chapa",
  "transactionId": "payment-provider-id",
  "rentalTerms": "text describing damage policy",
  "notes": "User notes",
  "createdAt": timestamp,
  "updatedAt": timestamp
}
```

### reviews/
Stores user reviews
```json
{
  "reviewId": "auto-generated",
  "bookingId": "booking-id",
  "equipmentId": "equipment-id",
  "reviewerId": "uid-of-reviewer",
  "targetId": "uid-of-reviewed-user",
  "rating": 4,
  "comment": "Great equipment and responsive owner",
  "createdAt": timestamp
}
```

### transactions/
Stores payment transactions
```json
{
  "transactionId": "auto-generated",
  "bookingId": "booking-id",
  "userId": "uid-making-payment",
  "type": "booking" || "commission-payout",
  "amount": 2500,
  "currency": "ETB",
  "paymentMethod": "telebirr" || "chapa",
  "externalTransactionId": "payment-provider-id",
  "status": "pending" || "completed" || "failed",
  "createdAt": timestamp,
  "completedAt": null
}
```

### admin_dashboard/
Admin analytics and metrics
```json
{
  "metrics": {
    "totalUsers": 150,
    "totalEquipment": 45,
    "totalBookings": 320,
    "totalRevenue": 850000,
    "avgBookingValue": 2656,
    "updatedAt": timestamp
  }
}
```
