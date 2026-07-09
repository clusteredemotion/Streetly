import crypto from "crypto";
import { Client } from "pg";

export const RIDER_EMAIL = "rider-e2e-test@example.com";
export const RIDER_PASSWORD = "TestPass123!";

export const REGIONAL_MANAGER_EMAIL = "regional-manager-e2e-test@example.com";
export const REGIONAL_MANAGER_PASSWORD = "TestPass123!";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "streetly_salt").digest("hex");
}

export default async function globalSetup() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to seed the rider e2e test account");
  }

  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query(
      `INSERT INTO users (name, email, password_hash, role, msa_id)
       VALUES ($1, $2, $3, 'delivery_rider', $4)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'delivery_rider'`,
      ["Rider E2E Test", RIDER_EMAIL, hashPassword(RIDER_PASSWORD), "RIDER-E2E-1"],
    );
    await client.query(
      `INSERT INTO users (name, email, password_hash, role, msa_id)
       VALUES ($1, $2, $3, 'regional_manager', $4)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'regional_manager'`,
      ["Regional Manager E2E Test", REGIONAL_MANAGER_EMAIL, hashPassword(REGIONAL_MANAGER_PASSWORD), "REGIONAL-MGR-E2E-1"],
    );
  } finally {
    await client.end();
  }
}
