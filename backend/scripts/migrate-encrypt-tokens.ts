import { PrismaClient } from '../src/generated/prisma/index.js';
import { encrypt } from '../src/utils/crypto.js';
import 'dotenv/config';

const prisma = new PrismaClient();

async function migrate() {
  console.log('Starting token encryption migration...');

  try {
    const accounts = await prisma.gitHubAccount.findMany();
    let migratedCount = 0;
    let skippedCount = 0;

    for (const account of accounts) {
      // Check if it's already encrypted.
      // Our encryption format is iv:authTag:ciphertext, so it contains two colons.
      // Plain GitHub tokens usually start with 'gho_' or 'ghp_' and have no colons.
      if (account.accessToken.split(':').length === 3) {
        skippedCount++;
        continue;
      }

      const encryptedToken = encrypt(account.accessToken);

      await prisma.gitHubAccount.update({
        where: { id: account.id },
        data: { accessToken: encryptedToken },
      });

      migratedCount++;
    }

    console.log(`Migration complete!`);
    console.log(`- Migrated (Encrypted): ${migratedCount} accounts`);
    console.log(`- Skipped (Already encrypted): ${skippedCount} accounts`);
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
