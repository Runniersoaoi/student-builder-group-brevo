import { brevo } from "../src/brevo.js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const contactsDir = resolve(__dirname, "../contacts");
const templatesDir = resolve(__dirname, "../templates");
const configDir = resolve(__dirname, "../config");

const DEFAULT_SUBJECTS: Record<string, string> = {
  directores_carrera: "AWS Student Builder Group llega a {{params.FACULTAD}}",
  wichay_uc: "AWS Student Builder Group UC — nos presentamos ante Wichay",
  continua_uc: "Certificaciones AWS para estudiantes UC — nueva comunidad en la universidad",
  ingenieros_facultad: "{{params.NOMBRE_INGENIERO}}, lanzamos AWS Student Builder Group en la UC",
};

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
  };

  const segment = get("--segment");
  const template = get("--template");
  const subject = get("--subject");
  const senderName = get("--sender-name") || "AWS Student Builder Group UC";
  const senderEmail = get("--sender-email");

  if (!segment || !template || !senderEmail) {
    console.error("Usage: npx tsx scripts/send.ts --segment <name> --template <path> [--subject <subject>] --sender-email <email> [--sender-name <name>]");
    console.error("\nSegments: directores_carrera, wichay_uc, continua_uc, ingenieros_facultad, test");
    process.exit(1);
  }

  const resolvedSubject = subject || DEFAULT_SUBJECTS[segment];
  if (!resolvedSubject) {
    console.error(`Error: No default subject for segment "${segment}". Provide --subject flag.`);
    process.exit(1);
  }

  return { segment, template, subject: resolvedSubject, senderName, senderEmail };
}

function getContactName(contact: any): string {
  const attrs = contact.attributes;
  return attrs.NOMBRE_DIRECTOR || attrs.NOMBRE_INGENIERO || attrs.NOMBRE_CONTACTO || "";
}

async function main() {
  const { segment, template, subject, senderName, senderEmail } = parseArgs();

  const contacts = JSON.parse(readFileSync(resolve(contactsDir, `${segment}.json`), "utf-8"));
  const htmlContent = readFileSync(resolve(templatesDir, template), "utf-8");
  const eventConfig = JSON.parse(readFileSync(resolve(configDir, "event.json"), "utf-8"));

  console.log(`📧 Sending "${subject}" to ${contacts.length} contact(s) in [${segment}]\n`);

  const messageVersions = contacts.map((contact: any) => ({
    to: [{ email: contact.email, name: getContactName(contact) }],
    params: { ...eventConfig, ...contact.attributes },
    subject,
  }));

  try {
    const result = await brevo.transactionalEmails.sendTransacEmail({
      sender: { name: senderName, email: senderEmail },
      subject,
      htmlContent,
      messageVersions,
    });
    console.log(`✅ Sent! Message ID: ${result.messageId}`);
  } catch (e: any) {
    console.error(`✗ Error: ${e.message}`);
    if (e.body) console.error(e.body);
  }
}

main().catch(console.error);
