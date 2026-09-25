/**
 * CORS Configuration
 * Handles Cross-Origin Resource Sharing for multiple frontend URLs
 */

/**
 * Parse FRONTEND_URL from environment variable
 * Supports both comma-separated and JSON array formats [...]
 */
const parseFrontendUrls = (urlStr) => {
  if (!urlStr) return [];

  const rawUrl = urlStr.trim();
  if (rawUrl.startsWith("[") && rawUrl.endsWith("]")) {
    try {
      // Support JSON array format: ["url1", "url2"]
      return JSON.parse(rawUrl);
    } catch (e) {
      const logger = require("../utils/logger");
      logger.warn("Error parsing FRONTEND_URL as JSON array:", {
        error: e.message,
        rawUrl,
      });
      // Fallback to comma split if JSON parse fails
      return rawUrl
        .substring(1, rawUrl.length - 1)
        .split(",")
        .map((url) => url.trim().replace(/^["']|["']$/g, ""));
    }
  }

  // Support comma separated format: url1, url2
  return rawUrl.split(",").map((url) => url.trim());
};

// Local development origins are always allowed.
const devOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
];

// Production origins. Prefer CORS_ALLOWED_ORIGINS (CSV or JSON array) so they
// can be changed without a code deploy; fall back to the known list otherwise.
// The previous "…vercel.app/#" entry was invalid (an Origin header never
// carries a fragment) and has been dropped.
const prodOriginsFallback = [
  "https://aeli-service-admin.onrender.com",
  "https://aeli-service.onrender.com",
  "https://aeliservices.vercel.app",
  "https://aeliservicesfrontuser.vercel.app",
  "https://aeliserviceadmin.vercel.app",
];

const configuredProdOrigins = parseFrontendUrls(process.env.CORS_ALLOWED_ORIGINS);
const prodOrigins = configuredProdOrigins.length > 0
  ? configuredProdOrigins
  : prodOriginsFallback;

const envOrigins = parseFrontendUrls(process.env.FRONTEND_URL);

// Combine and remove duplicates, trimming any accidental whitespace/fragments.
const allAllowedOrigins = [
  ...new Set(
    [...devOrigins, ...prodOrigins, ...envOrigins]
      .map((o) => (typeof o === "string" ? o.trim().replace(/\/#.*$/, "") : o))
      .filter(Boolean)
  ),
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Check against our unified list
    if (allAllowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-CSRF-Token",
    "X-XSRF-Token",
    "X-Lang",
    "Accept-Language",
  ],
  exposedHeaders: ["X-Total-Count", "X-Page-Number"],
  maxAge: 86400, // 24 hours - how long browsers cache preflight requests
};

module.exports = {
  corsOptions,
  allAllowedOrigins,
};
