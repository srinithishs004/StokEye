# User Authentication System

A complete backend system for user registration and login using Node.js, Express, and MongoDB.

## Features

- User registration
- User login
- JWT authentication
- Protected routes
- MongoDB database

## Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/user-auth-db
   JWT_SECRET=your_jwt_secret_key_here
   ```
4. Make sure MongoDB is running on your system

## Usage

### Development mode
```
npm run dev
```

### Production mode
```
npm start
```

## API Endpoints

### Register a new user
```
POST /api/auth/register
```
Request body:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "123456"
}
```

### Login
```
POST /api/auth/login
```
Request body:
```json
{
  "email": "john@example.com",
  "password": "123456"
}
```

### Get current user (Protected route)
```
GET /api/auth/me
```
Headers:
```
Authorization: Bearer YOUR_JWT_TOKEN
```