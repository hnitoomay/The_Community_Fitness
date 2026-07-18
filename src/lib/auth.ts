import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins/admin";
import { Kysely, PostgresDialect } from "kysely";

import { db as pgPool } from "./server/db";

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

const authDatabase = new Kysely<never>({
  dialect: new PostgresDialect({
    pool: pgPool,
  }),
});

export const auth = betterAuth({
  appName: "The Community Fitness",
  baseURL: getRequiredEnv("BETTER_AUTH_URL"),
  secret: getRequiredEnv("BETTER_AUTH_SECRET"),
  database: {
    db: authDatabase,
    type: "postgres",
    casing: "snake",
    transaction: true,
  },
  user: {
    modelName: "auth_users",
    fields: {
      createdAt: "created_at",
      updatedAt: "updated_at",
      emailVerified: "email_verified",
    },
  },
  session: {
    modelName: "auth_sessions",
    fields: {
      createdAt: "created_at",
      updatedAt: "updated_at",
      userId: "user_id",
      expiresAt: "expires_at",
      ipAddress: "ip_address",
      userAgent: "user_agent",
    },
  },
  account: {
    modelName: "auth_accounts",
    fields: {
      createdAt: "created_at",
      updatedAt: "updated_at",
      providerId: "provider_id",
      accountId: "account_id",
      userId: "user_id",
      accessToken: "access_token",
      refreshToken: "refresh_token",
      idToken: "id_token",
      accessTokenExpiresAt: "access_token_expires_at",
      refreshTokenExpiresAt: "refresh_token_expires_at",
    },
  },
  verification: {
    modelName: "auth_verifications",
    fields: {
      createdAt: "created_at",
      updatedAt: "updated_at",
      expiresAt: "expires_at",
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: getRequiredEnv("GOOGLE_CLIENT_ID"),
      clientSecret: getRequiredEnv("GOOGLE_CLIENT_SECRET"),
    },
  },
  plugins: [
    nextCookies(),
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
      schema: {
        user: {
          fields: {
            role: "role",
            banned: "banned",
            banReason: "ban_reason",
            banExpires: "ban_expires",
          },
        },
        session: {
          fields: {
            impersonatedBy: "impersonated_by",
          },
        },
      },
    }),
  ],
});
