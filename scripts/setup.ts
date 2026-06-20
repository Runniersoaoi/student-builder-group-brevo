import { brevo } from "../src/brevo.js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const contactsDir = resolve(__dirname, "../contacts");

const ATTRIBUTES = ["NOMBRE_DIRECTOR", "NOMBRE_CONTACTO", "NOMBRE_INGENIERO", "FACULTAD", "SALUDO"];
const FOLDER_NAME = "AWS Student Builder Group";
const LISTS = ["directores_carrera", "wichay_uc", "continua_uc", "ingenieros_facultad", "test"];

async function createAttributes() {
  console.log("📋 Creating attributes...");
  for (const attr of ATTRIBUTES) {
    try {
      await brevo.contacts.createAttribute({ attributeCategory: "normal", attributeName: attr, type: "text" });
      console.log(`  ✓ ${attr}`);
    } catch (e: any) {
      if (e.statusCode === 400) {
        console.log(`  - ${attr} (already exists)`);
      } else throw e;
    }
  }
}

async function createFolder(): Promise<number> {
  console.log("\n📁 Creating folder...");
  try {
    const folder = await brevo.contacts.createFolder({ name: FOLDER_NAME });
    console.log(`  ✓ ${FOLDER_NAME} (id: ${folder.id})`);
    return folder.id;
  } catch (e: any) {
    if (e.statusCode === 400) {
      console.log(`  - Folder may already exist, fetching...`);
      const { folders } = await brevo.contacts.getFolders({ limit: 50, offset: 0 });
      const existing = folders?.find((f: any) => f.name === FOLDER_NAME);
      if (existing) {
        console.log(`  ✓ Found existing folder (id: ${existing.id})`);
        return existing.id;
      }
    }
    throw e;
  }
}

async function createLists(folderId: number): Promise<Map<string, number>> {
  console.log("\n📝 Creating lists...");
  const listMap = new Map<string, number>();

  for (const name of LISTS) {
    try {
      const list = await brevo.contacts.createList({ name, folderId });
      console.log(`  ✓ ${name} (id: ${list.id})`);
      listMap.set(name, list.id);
    } catch (e: any) {
      if (e.statusCode === 400) {
        console.log(`  - ${name} (already exists, fetching...)`);
        const { lists } = await brevo.contacts.getLists({ limit: 50, offset: 0 });
        const existing = lists?.find((l: any) => l.name === name);
        if (existing) {
          listMap.set(name, existing.id);
          console.log(`  ✓ Found existing (id: ${existing.id})`);
        }
      } else throw e;
    }
  }
  return listMap;
}

async function syncContacts(listMap: Map<string, number>) {
  console.log("\n👥 Syncing contacts...");

  for (const [segment, listId] of listMap) {
    const file = resolve(contactsDir, `${segment}.json`);
    const contacts = JSON.parse(readFileSync(file, "utf-8"));

    for (const contact of contacts) {
      try {
        await brevo.contacts.createContact({
          email: contact.email,
          attributes: contact.attributes,
          listIds: [listId],
          updateEnabled: true,
        });
        console.log(`  ✓ ${contact.email} → ${segment}`);
      } catch (e: any) {
        console.error(`  ✗ ${contact.email}: ${e.message}`);
      }
    }
  }
}

async function main() {
  console.log("🚀 Brevo Setup\n");
  await createAttributes();
  const folderId = await createFolder();
  const listMap = await createLists(folderId);
  await syncContacts(listMap);
  console.log("\n✅ Setup complete!");
}

main().catch(console.error);
