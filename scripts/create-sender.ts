import { brevo } from "../src/brevo.js";

const SENDER_NAME = "AWS Student Builder Group UC";
const SENDER_EMAIL = process.argv[2];

if (!SENDER_EMAIL) {
  console.error("Usage: npx tsx scripts/create-sender.ts <email>");
  process.exit(1);
}

async function main() {
  try {
    const result = await brevo.senders.createSender({ name: SENDER_NAME, email: SENDER_EMAIL });
    console.log(`✅ Sender created (id: ${result.id})`);
    console.log(`📧 Check ${SENDER_EMAIL} inbox and click the verification link from Brevo.`);
  } catch (e: any) {
    if (e.statusCode === 400) {
      console.log(`⚠️  Sender may already exist. Listing current senders...`);
      const { senders } = await brevo.senders.getSenders();
      senders?.forEach((s: any) => console.log(`  - ${s.name} <${s.email}> (id: ${s.id}, active: ${s.active})`));
    } else {
      console.error(`✗ Error: ${e.message}`);
    }
  }
}

main().catch(console.error);
