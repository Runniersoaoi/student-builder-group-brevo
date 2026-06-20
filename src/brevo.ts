import { BrevoClient } from "@getbrevo/brevo";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env manually
const envPath = resolve(process.cwd(), ".env");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const [key, ...val] = line.split("=");
  if (key && val.length) process.env[key.trim()] = val.join("=").trim();
}

if (!process.env.BREVO_API_KEY) {
  throw new Error("BREVO_API_KEY is not set in .env");
}

export const brevo = new BrevoClient({ apiKey: process.env.BREVO_API_KEY });