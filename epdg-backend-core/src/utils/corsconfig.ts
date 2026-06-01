import { CorsOptions } from "cors";

const allowedOrigins = {
  development: [
    "http://localhost:5173"
  ],
  production: [
    "https://emersonproffesionaldevelopment.netlify.app"
  ]
};

const env =
  (process.env.NODE_ENV || "development") as keyof typeof allowedOrigins;

const origins = allowedOrigins[env];

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (origins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },

  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],

  allowedHeaders: [
    "Content-Type",
    "Authorization"
  ],

  credentials: true,

  maxAge: 600,
};