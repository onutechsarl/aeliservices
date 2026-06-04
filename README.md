# AELI Services Backend API

Backend API for the AELI Services platform - a platform connecting clients with female entrepreneurs and service providers in Cameroon.

## ✨ Key Features

### 👥 User Management
- **Registration** with email OTP validation
- **Authentication** JWT with automatic refresh
- **Profiles** for clients and providers with multiple photos
- **Reputation system** with reviews and ratings
- **Advanced security** (rate limiting, audit logs)

### 🏢 Provider Management
- **Applications** to become a provider with admin validation
- **Detailed profiles** with services, photos, location
- **Dashboard** with statistics (views, contacts, revenue)
- **Subscriptions** monthly/quarterly/yearly with auto-renewal
- **Visibility** with featuring system

### 💰 Monetization System
- **Pay-per-view** to unlock contact information
- **Premium subscriptions** for unlimited contact access
- **Integrated payments** (CinetPay, NotchPay)
- **Automatic commission** on transactions
- **Accounting data export** (CSV, PDF)

### 📞 Contact Management
- **Encrypted messages** between clients and providers
- **Status tracking** (pending, read, replied) with notifications
- **Unlocking** by payment or subscription
- **Complete history** with search and filtering

### 🌐 Internationalization
- **Multilingual support** (French/English)
- **Automatic localization** based on preferences
- **Localized email templates**
- **Translated error messages**

### 📊 Administration
- **Admin dashboard** with real-time statistics
- **User and provider management**
- **Content and review moderation**
- **Complete audit logs** of all actions
- **Administrative data export**

## 🚀 Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL + Sequelize ORM
- **Authentication**: JWT (JSON Web Tokens) + OTP
- **Image Upload**: Cloudinary
- **Email**: Nodemailer (Mailtrap SMTP)
- **Security**: Helmet, CORS, Rate Limiting, CSRF Protection
- **Internationalization**: i18n (French/English)
- **Payments**: CinetPay, NotchPay
- **File Processing**: Multer, PDFKit, json2csv
- **Logging**: Winston
- **Job Queue**: Bull (Redis)
- **Testing**: Jest + Supertest
- **Real-time**: Socket.io

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Configurations (DB, Cloudinary, Email, CORS)
│   ├── controllers/     # Business logic (11 controllers)
│   ├── middlewares/     # Auth, validation, errors, upload, i18n
│   ├── models/          # Sequelize models (13 models with hooks)
│   ├── routes/          # Express routes (10 files)
│   ├── utils/           # Logger, email templates, helpers, encryption
│   ├── validators/      # Validation rules (10 validators)
│   ├── jobs/            # Cron tasks and processors
│   ├── locales/         # i18n files (fr, en)
│   └── app.js           # Express configuration
├── tests/               # Unit and integration tests
│   ├── unit/           # Unit tests (32 files)
│   ├── integration/    # Integration tests (13 files)
│   ├── fixtures/       # Test data
│   └── setup.js        # Test configuration
├── database/           # Migrations and seeds
├── docs/               # API documentation
├── logs/               # Log files
├── migrations/         # Migration scripts
├── seeds/              # Test data
├── .env.example        # Environment variables template
├── package.json
├── server.js           # Entry point
└── README.md
```

## ⚙️ Installation

### 1. Clone and install dependencies

```bash
cd aeli_service_backend
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

Required configuration:
- **PostgreSQL Database**: Create `aeli_services` database
- **Cloudinary**: Create account and get API keys
- **Mailtrap**: Create account and get SMTP credentials

### 3. Create PostgreSQL database

```sql
CREATE DATABASE aeli_services;
```

### 4. Start the server

```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## 🐳 Docker

The project includes a complete Docker configuration:

```bash
# Build images
npm run docker:build

# Start services
npm run docker:up

# View logs
npm run docker:logs

# Stop services
npm run docker:down
```

Included Docker services:
- **API**: Node.js + Express
- **PostgreSQL**: Database
- **Redis**: Cache and job queue
- **Nginx**: Reverse proxy (optional)

## 🚀 Deployment

Pour un guide complet de déploiement Docker en production (variables d'environnement, migrations, bootstrap admin, dépannage), voir **[DEPLOYMENT.md](DEPLOYMENT.md)**.

### Required Environment Variables

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aeli_services
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your_email_user
EMAIL_PASS=your_email_password

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379

# Application
NODE_ENV=production
PORT=5000
CORS_ORIGIN=http://localhost:3000
```

### Health Checks

```bash
# Check API status
curl http://localhost:5000/api/health

# Check DB connectivity
curl http://localhost:5000/api/health/db
```

## � API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/register` | Registration |
| POST | `/login` | Login |
| POST | `/forgot-password` | Forgot password |
| POST | `/reset-password/:token` | Password reset |
| GET | `/me` | Current user profile |

### Users (`/api/users`)
| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | `/profile` | Get profile |
| PUT | `/profile` | Update profile |
| PUT | `/password` | Change password |
| DELETE | `/account` | Deactivate account |
| GET | `/me/referral` | My referral code + shareable URL |
| GET | `/me/referrals` | Paginated list of my referrals (status filterable) |
| GET | `/me/referrals/stats` | Aggregated stats (totals + days earned) |

### Providers (`/api/providers`)
| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | List (paginated, filterable) |
| GET | `/:id` | Provider details (public) |
| GET | `/by-slug/:slug` | Public profile via shareable link (no auth required) |
| POST | `/apply` | Provider application (client→provider) |
| GET | `/my-application` | My application status |
| PUT | `/:id` | Edit profile |
| DELETE | `/:id/photos/:index` | Delete photo |
| GET | `/my-profile` | My profile |
| GET | `/my-dashboard` | Dashboard |

### Services (`/api/services`)
| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | `/categories` | Categories list |
| POST | `/categories` | Create category (admin) |
| GET | `/provider/:id` | Provider's services |
| POST | `/` | Create service |
| PUT | `/:id` | Update service |
| DELETE | `/:id` | Delete service |

### Reviews (`/api/reviews`)
| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | `/provider/:id` | Provider's reviews |
| POST | `/` | Create review |
| PUT | `/:id` | Update review |
| DELETE | `/:id` | Delete review |

### Favorites (`/api/favorites`)
| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | My favorites |
| POST | `/` | Add favorite |
| DELETE | `/:providerId` | Remove favorite |
| GET | `/check/:providerId` | Check if favorite |

### Contacts (`/api/contacts`)
| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/` | Send message |
| GET | `/received` | Received messages (provider) |
| GET | `/sent` | Sent messages |
| PUT | `/:id/status` | Update status |

### Administration (`/api/admin`)
| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | `/stats` | Platform statistics |
| GET | `/users` | Users list |
| PUT | `/users/:id/status` | Activate/deactivate |
| GET | `/providers/pending` | Pending providers |
| PUT | `/providers/:id/verify` | Verify provider |
| PUT | `/providers/:id/feature` | Feature provider |
| POST | `/providers/:id/grant-subscription` | Grant N days of subscription to a provider (admin-configurable max) |
| GET | `/providers/:id/grant-history` | Audit history of admin-issued subscription grants |
| GET | `/reviews` | All reviews |
| PUT | `/reviews/:id/visibility` | Moderate review |
| GET | `/analytics` | Top endpoints + global stats (top 20 routes, errors, avg duration) |
| GET | `/analytics/hourly?date=YYYY-MM-DD` | Hourly request breakdown for a date |
| GET | `/analytics/daily-active-users?days=N` | Distinct users logged in per day (1-365 days, default 30) |
| GET | `/admins` | List admin accounts |
| POST | `/admins` | Create a new admin |
| PUT | `/admins/:id/promote` | Promote an existing user to admin |
| PUT | `/admins/:id/demote` | Demote an admin back to client or provider |
| GET | `/settings` | List all admin-tunable platform settings |
| GET | `/settings/:key` | Fetch one setting |
| PUT | `/settings/:key` | Update a setting value (typed + range-validated) |
| POST | `/settings/:key/reset` | Restore default value |

### Search (`/api/search`)
| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Global search |

**Search parameters**:
- `q`: Search term
- `category`: Category slug
- `location`: City/neighborhood
- `minRating`: Minimum rating (1-5)
- `sort`: Sort (rating, recent, views)
- `page`: Page
- `limit`: Items per page

## 🔐 Authentication

All protected routes require a JWT token in the header:

```
Authorization: Bearer <token>
```

## 📧 Emails

5 email templates are configured:
- Welcome email
- New contact request notification
- Provider account validation
- New review notification
- Password reset

## 🛡️ Security and Compliance

### 🔐 Data Security
- **Encryption** of sensitive data (emails, phones) with AES-256
- **bcrypt hashing** of passwords with salt
- **JWT tokens** with configurable expiration
- **One-time OTP** for email validation
- **CSRF protection** for forms
- **Configurable rate limiting** per endpoint

### 🛡️ Attack Protection
- **Rate limiting** on login (5 attempts/15 min)
- **General rate limiting** (100 req/min)
- **XSS protection** with automatic cleaning
- **SQL injection protection** via Sequelize ORM
- **Security headers** (Helmet) with strict configuration
- **Strict input validation**

### 📋 Audit and Compliance
- **Complete audit logs** of all sensitive actions
- **Security logs** for intrusion attempts
- **GDPR consent management**
- **Personal data anonymization** on request
- **Personal data export** (GDPR)
- **Complete user account deletion**

### 🔍 Monitoring
- **Structured logs** with Winston
- **Alerts** on suspicious activities
- **Performance and error metrics**
- **Automatic service health checks**
- **Fraud attempt monitoring**

## 📝 Logs

Logs are saved in:
- `logs/error.log`: Errors only
- `logs/combined.log`: All logs

## 🧪 Testing

The project uses **Jest** for unit and integration tests with complete API coverage.

### Available Test Scripts

```bash
# Run all tests
npm test

# Run tests with detailed coverage report
npm run test:coverage

# Run tests in watch mode (auto-restart)
npm run test:watch

# Run specific test file
npm test -- tests/unit/User.test.js

# Run tests by pattern
npm test -- tests/unit/
npm test -- tests/integration/

# Run tests with verbose output
npm test -- --verbose
```

### Test Structure

- **Unit tests** (`tests/unit/`): 32 files testing models, controllers, utilities, and validators in isolation
- **Integration tests** (`tests/integration/`): 13 files testing complete API flows with database
- **Fixtures** (`tests/fixtures/`): Reusable test data
- **Setup** (`tests/setup.js`): Test database configuration and cleanup

### Covered Test Types

✅ **Sequelize Models**: Hooks, instance methods, validation, relationships  
✅ **Controllers**: Business logic, error handling, validation  
✅ **Middlewares**: Authentication, validation, rate limiting  
✅ **API Routes**: REST endpoints, request/response handling  
✅ **Utilities**: Encryption, helpers, email templates  
✅ **Validators**: Input validation rules  
✅ **Integration**: Complete user flows, real database

### 📊 Test Coverage (Current Report)

**Global Statistics:**
- **Tests**: 596 passing tests on 51 suites
- **Lines**: 82.37%
- **Statements**: 74.45%
- **Functions**: 71.14%
- **Branches**: 76.47%

**Coverage by main module:**

| Module | Lines | Statements | Functions | Branches |
|--------|--------|------------|-----------|----------|
| **src/models/** | | | | |
| Contact.js | 87.23% | 69.23% | 100% | 90.9% |
| User.js | 100% | 94.44% | 100% | 100% |
| Provider.js | 70.73% | 65.21% | 88.88% | 71.79% |
| Payment.js | 69.69% | 33.33% | 80% | 69.69% |
| Subscription.js | 88.88% | 90.47% | 75% | 88.67% |
| Review.js | 100% | 100% | 100% | 100% |
| Favorite.js | 100% | 100% | 100% | 100% |
| Service.js | 100% | 100% | 100% | 100% |

| **src/controllers/** | | | | |
| All controllers | ~85% | ~80% | ~85% | ~82% |

| **src/utils/** | | | | |
| encryption.js | 90.41% | 88.23% | 100% | 90.27% |
| helpers.js | 81.81% | 72.91% | 69.23% | 85.41% |
| dbHelpers.js | 94.73% | 76.47% | 100% | 94.28% |
| responseHelpers.js | 100% | 100% | 100% | 100% |

**Coverage highlights:**
- Complete unit tests for all models
- High coverage for critical utilities (encryption, helpers)
- Integration tests for all API routes
- Complete authentication middleware validation

**Areas for improvement:**
- Increase admin routes coverage (45.45%)
- Improve worker and webhook coverage
- Add tests for complex error scenarios

## 🤝 Contribution

Contributions are welcome! Please check the [Contributing Guide](CONTRIBUTING.md) for details on how to participate.

## 📄 License

ISC

---

Developed by NGOUE DAVID for AELI Services - Cameroon with a lot of fatigue, laziness, and sickness
