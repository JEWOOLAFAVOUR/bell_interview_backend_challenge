# Bell Booking Challenge 🏨

A comprehensive **Property Booking API** built with **Node.js, Express, Sequelize, PostgreSQL, and TypeScript**. This project provides a complete backend solution for property rental management with user authentication, role-based access control, and comprehensive testing.

---

## 📌 Features

### 🏠 **Core Functionality**

- **Property Management**: Create, read, update, delete properties (Admin only)
- **User Authentication**: JWT-based authentication with role management
- **Booking System**: Create bookings, view user bookings, cancel bookings
- **Availability Tracking**: Real-time property availability checking
- **Role-Based Access**: User and Admin roles with different permissions

### 🔐 **Security & Performance**

- **Rate Limiting**: Endpoint-specific rate limiting for security
- **Input Validation**: Comprehensive request validation
- **Password Encryption**: Secure password hashing with crypto-js
- **CORS Protection**: Cross-origin resource sharing configuration
- **Helmet Security**: Security headers and protection

### 🧪 **Testing**

- **Unit Tests**: Individual function testing with mocks
- **Integration Tests**: Complete API endpoint testing
- **Test Coverage**: Comprehensive test suite with 21 passing tests
- **Database Testing**: Isolated test database for safe testing

---

## 🚀 Getting Started

### 📋 Prerequisites

Before running the project, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v16+ recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [PostgreSQL](https://www.postgresql.org/) (v12+ recommended)

---

### 🔧 Installation & Setup

Follow these steps to set up the project on your local machine:

1. **Clone the repository**:

   ```bash
   git clone https://github.com/JEWOOLAFAVOUR/bell_interview_backend_challenge.git
   cd bell_take_home_challenge
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Database Setup**:

   Create PostgreSQL databases:

   ```sql
   -- Production database
   CREATE DATABASE booking_api;

   -- Test database
   CREATE DATABASE bell_booking_test_db;
   ```

4. **Environment Variables**:

   Create a `.env` file in the root directory:

   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=your_postgres_password
   DB_NAME=booking_api

   # Security Keys
   JWT_SECRET=your_super_secret_jwt_key_here
   PASS_SEC=your_password_encryption_secret

   # Server Configuration
   NODE_ENV=development
   RATE_LIMIT_MAX=100
   ```

5. **Database Migration**:

   ```bash
   # The app will automatically create tables on first run
   npm run dev
   ```

6. **Create Admin User**:
   ```sql
   -- Connect to your database and create an admin user
   UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
   ```

---

## 🏃‍♂️ Running the Application

### **Development Mode**:

```bash
npm run dev
```

### **Production Mode**:

```bash
npm run build
npm start
```

### **Testing**:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test categories
npm run test:unit
npm run test:integration
```

---

## 🧪 Testing the Endpoints

### **Authentication Endpoints**

#### **Register a New User**

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstname": "John",
    "lastname": "Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Expected Response** (201):

```json
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "id": 1,
    "firstname": "John",
    "lastname": "Doe",
    "email": "john@example.com",
    "role": "user",
    "fullname": "John Doe"
  }
}
```

#### **Login User**

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Expected Response** (200):

```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "firstname": "John",
    "lastname": "Doe",
    "email": "john@example.com",
    "role": "user",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### **Property Endpoints**

#### **Get All Properties** (Public)

```bash
curl -X GET http://localhost:5000/api/v1/properties
```

#### **Get Available Properties** (Public)

```bash
curl -X GET http://localhost:5000/api/v1/properties/available
```

#### **Create Property** (Admin Only)

```bash
curl -X POST http://localhost:5000/api/v1/properties \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Beautiful Beach House",
    "description": "A stunning beachfront property with amazing ocean views",
    "price_per_night": 150.00,
    "available_from": "2025-09-01",
    "available_to": "2025-12-31"
  }'
```

#### **Update Property** (Admin Only)

```bash
curl -X PUT http://localhost:5000/api/v1/properties/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Beach House",
    "price_per_night": 175.00
  }'
```

#### **Delete Property** (Admin Only)

```bash
curl -X DELETE http://localhost:5000/api/v1/properties/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### **Booking Endpoints**

#### **Create Booking** (Authenticated Users)

```bash
curl -X POST http://localhost:5000/api/v1/bookings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "property_id": 1,
    "start_date": "2025-09-15",
    "end_date": "2025-09-20"
  }'
```

#### **Get My Bookings** (Authenticated Users)

```bash
curl -X GET http://localhost:5000/api/v1/bookings/my \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### **Cancel Booking** (Authenticated Users)

```bash
curl -X POST http://localhost:5000/api/v1/bookings/1/cancel \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### **Get All Bookings** (Admin Only)

```bash
curl -X GET http://localhost:5000/api/v1/bookings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🧪 Using Postman

### **Setting Up Postman Environment**

1. Create a new environment in Postman
2. Add these variables:
   - `baseUrl`: `http://localhost:5000`
   - `authToken`: (will be set after login)

### **Postman Collection Structure**

```
Bell Booking API/
├── Auth/
│   ├── Register User
│   └── Login User
├── Properties/
│   ├── Get All Properties
│   ├── Get Available Properties
│   ├── Create Property (Admin)
│   ├── Update Property (Admin)
│   └── Delete Property (Admin)
└── Bookings/
    ├── Create Booking
    ├── Get My Bookings
    ├── Cancel Booking
    └── Get All Bookings (Admin)
```

### **Authentication Flow in Postman**

1. **Register/Login**: Use auth endpoints to get JWT token
2. **Set Token**: Add this script to your login request's "Tests" tab:
   ```javascript
   if (pm.response.code === 200) {
     const responseJson = pm.response.json();
     pm.environment.set("authToken", responseJson.user.token);
   }
   ```
3. **Use Token**: In other requests, add header:
   - Key: `Authorization`
   - Value: `Bearer {{authToken}}`

---

## 🏗️ Project Structure

```
bell_take_home_challenge/
├── app.ts                      # Main application entry point
├── controllers/
│   ├── auth-controller/
│   │   └── userController.ts   # Authentication logic
│   ├── property-controller/
│   │   └── propertyController.ts # Property management
│   └── booking-controller/
│       └── bookingController.ts  # Booking operations
├── models/
│   ├── user/user.ts            # User model & validation
│   ├── property/property.ts    # Property model & validation
│   └── booking/booking.ts      # Booking model & validation
├── routers/
│   ├── auth-route/userRoute.ts
│   ├── property-route/propertyRoute.ts
│   └── booking-route/bookingRoute.ts
├── middlewares/
│   ├── verifyToken.ts          # JWT authentication
│   ├── validator.ts            # Input validation
│   └── rateLimiters.ts         # Rate limiting rules
├── tests/
│   ├── unit/                   # Unit tests
│   ├── integration/            # API integration tests
│   └── utils/testHelpers.ts    # Test utilities
├── utils/
│   ├── helper.ts               # Utility functions
│   └── types.ts                # TypeScript interfaces
├── db/index.ts                 # Database configuration
└── README.md
```

---

## 📊 API Rate Limits

| Endpoint Type    | Limit       | Window     | Notes                        |
| ---------------- | ----------- | ---------- | ---------------------------- |
| Register         | 3 attempts  | 10 minutes | Prevents spam registration   |
| Login            | 8 attempts  | 10 minutes | Prevents brute force attacks |
| Bookings         | 10 attempts | 15 minutes | Prevents booking spam        |
| Admin Operations | 50 requests | 5 minutes  | Higher limit for admin tasks |

---

## 🔐 User Roles & Permissions

### **User Role** (`user`)

- ✅ View all properties
- ✅ View available properties
- ✅ Create personal bookings
- ✅ View own bookings
- ✅ Cancel own bookings
- ❌ Create/modify/delete properties
- ❌ View all users' bookings

### **Admin Role** (`admin`)

- ✅ All user permissions
- ✅ Create properties
- ✅ Update properties
- ✅ Delete properties
- ✅ View all bookings
- ✅ Manage all system data

---

## 🧪 Test Coverage

The project includes comprehensive testing:

```bash
Test Suites: 5 passed, 5 total
Tests:       21 passed, 21 total
Snapshots:   0 total
Time:        ~10s
```

### **Test Categories**

- **Unit Tests**: Controller logic, utility functions (4 tests)
- **Integration Tests**: Complete API workflows (17 tests)
- **Authentication Tests**: JWT and role-based access
- **Database Tests**: Model validation and relationships

### **Running Tests**

```bash
npm test                 # Run all tests
npm run test:unit       # Run only unit tests
npm run test:integration # Run only integration tests
npm run test:coverage   # Run with coverage report
npm run test:watch      # Run tests in watch mode
```

---

## 📝 Assumptions & Design Decisions

### **Business Logic Assumptions**

1. **Property Availability**: Properties have fixed availability periods set by admins
2. **Booking Overlap**: No overlapping bookings allowed for the same property
3. **User Registration**: All users start with "user" role (admin promotion is manual)
4. **Booking Cancellation**: Users can only cancel their own bookings
5. **Price Calculation**: Total price = (price_per_night × number_of_nights)
6. **Date Validation**: Start date must be in the future, end date must be after start date

### **Technical Decisions**

1. **Database**: PostgreSQL chosen for ACID compliance and relational data integrity
2. **Authentication**: JWT tokens for stateless authentication
3. **Password Security**: crypto-js AES encryption for password storage
4. **Rate Limiting**: Prevents abuse and protects against brute force attacks
5. **Validation**: Server-side validation for all inputs with custom error messages
6. **Testing**: Comprehensive unit and integration tests for reliability

### **API Design Decisions**

1. **RESTful Design**: Following REST principles for predictable API behavior
2. **Consistent Responses**: Standardized response format across all endpoints
3. **Error Handling**: Detailed error messages with appropriate HTTP status codes
4. **Pagination**: Built-in pagination support for list endpoints
5. **Boolean Flags**: Added convenience fields for frontend consumption

---

## 🚨 Known Limitations & Notes

### **Current Limitations**

1. **File Uploads**: Avatar field exists but file upload not implemented
2. **Email Notifications**: Booking confirmations not sent via email
3. **Payment Integration**: No payment processing (assumed external handling)
4. **Real-time Updates**: No WebSocket implementation for live availability
5. **Soft Deletes**: Hard deletes used (could implement soft deletes for audit trail)

### **Development Notes**

1. **Environment**: Uses different databases for development and testing
2. **Timezone**: All dates stored in UTC, frontend should handle timezone conversion
3. **Validation**: Dates must be in YYYY-MM-DD format
4. **Rate Limits**: Disabled during testing to avoid interference
5. **Admin Creation**: Manual SQL update required to create first admin user

---

## 🔮 Future Enhancements

- [ ] Image upload for property photos using Cloudinary
- [ ] Email notification service for booking confirmations
- [ ] Real-time availability updates with WebSockets
- [ ] Payment integration (Stripe/PayPal)
- [ ] Property reviews and ratings system
- [ ] Advanced search and filtering capabilities
- [ ] Booking modification functionality
- [ ] Calendar view for property availability
- [ ] SMS notifications for booking updates
- [ ] Multi-language support

---

## 🤝 Contributing

1. **Fork the Repository**
2. **Create Feature Branch**: `git checkout -b feature/new-feature`
3. **Make Changes**: Implement your feature with tests
4. **Run Tests**: `npm test` to ensure all tests pass
5. **Commit Changes**: `git commit -m 'Add new feature'`
6. **Push to Branch**: `git push origin feature/new-feature`
7. **Open Pull Request**: Submit PR with detailed description

---

## 📄 License

This project is part of the Bell Take Home Challenge and is for evaluation purposes.

---

## 📞 Support

For questions or issues related to this Bell Booking Challenge implementation, please:

- Create an issue in the repository
- Contact: JEWOOLAFAVOUR
- Email: [Your contact email]

---

**Built with ❤️ using Node.js, Express, PostgreSQL, and TypeScript**
