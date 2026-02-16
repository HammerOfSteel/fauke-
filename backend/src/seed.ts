import { prisma } from "./db.js";
import bcrypt from "bcryptjs";

const SEED_USERS = [
  {
    username: "EricIron",
    password: "pQ:2ay123!",
    displayName: "Eric Iron",
    role: "admin",
  },
  {
    username: "TestUser",
    password: "TestPass",
    displayName: "Test User",
    role: "user",
  },
];

async function seed() {
  console.log("🌱 Seeding users...");

  for (const user of SEED_USERS) {
    const existing = await prisma.user.findUnique({
      where: { username: user.username },
    });

    if (existing) {
      // Update role if it changed
      if (existing.role !== user.role) {
        await prisma.user.update({
          where: { id: existing.id },
          data: { role: user.role },
        });
        console.log(`  ✓ Updated role for "${user.username}" to "${user.role}"`);
      } else {
        console.log(`  ✓ User "${user.username}" already exists, skipping`);
      }
      continue;
    }

    const passwordHash = await bcrypt.hash(user.password, 12);
    await prisma.user.create({
      data: {
        username: user.username,
        passwordHash,
        displayName: user.displayName,
        role: user.role,
      },
    });
    console.log(`  ✓ Created user "${user.username}" (${user.role})`);
  }

  console.log("🌱 Seed complete");
}

seed()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
