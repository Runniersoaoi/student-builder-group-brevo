import { brevo } from "../src/brevo.js";

const senderId = parseInt(process.argv[2]);
const otp = parseInt(process.argv[3]);

if (!senderId || !otp) {
  console.error("Usage: npx tsx scripts/validate-sender.ts <senderId> <otp>");
  process.exit(1);
}

try {
  await brevo.senders.validateSenderByOtp({ senderId, otp });
  console.log("✅ Sender verified!");
} catch (e: any) {
  console.error(`✗ Error: ${e.message}`);
}
