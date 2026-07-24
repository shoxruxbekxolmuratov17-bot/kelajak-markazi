import 'dotenv/config';

const nodeEnv = process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';

function requireInProd(name: string, value: string | undefined, fallback: string) {
  if (isProd && (!value || value.includes('change-in-production') || value === 'kelajak-dev-secret-change-in-production')) {
    throw new Error(`${name} must be set to a strong secret in production`);
  }
  return value || fallback;
}

export const config = {
  nodeEnv,
  isProd,
  port: Number(process.env.PORT) || 3001,
  /** Faqat DEMO_MODE=true bo‘lsa yoqiladi. Aks holda haqiqiy JWT + DB. */
  demoMode: process.env.DEMO_MODE === 'true',
  jwtSecret: requireInProd(
    'JWT_SECRET',
    process.env.JWT_SECRET,
    'kelajak-dev-secret-change-in-production'
  ),
  corsOrigin: process.env.CORS_ORIGIN || true,
  databaseUrl: process.env.DATABASE_URL || '',
  redisUrl: process.env.REDIS_URL || '',
  smsProvider: (process.env.SMS_PROVIDER || 'stub') as 'stub' | 'eskiz' | 'playmobile',
  click: {
    merchantId: process.env.CLICK_MERCHANT_ID || '',
    serviceId: process.env.CLICK_SERVICE_ID || '',
    secretKey: process.env.CLICK_SECRET_KEY || '',
  },
  payme: {
    merchantId: process.env.PAYME_MERCHANT_ID || '',
    key: process.env.PAYME_KEY || '',
  },
  defaultDistrictId: process.env.DEFAULT_DISTRICT_ID || 'd-qamashi',
};

export type AppConfig = typeof config;
