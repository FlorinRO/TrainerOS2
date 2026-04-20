import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

interface BootstrapAdmin {
  email: string;
  name?: string;
  password: string;
}

const prisma = new PrismaClient();

function parseAdmins(): BootstrapAdmin[] {
  const raw = process.env.ADMIN_BOOTSTRAP_USERS;

  if (!raw) {
    throw new Error(
      'Missing ADMIN_BOOTSTRAP_USERS. Example: ' +
        `ADMIN_BOOTSTRAP_USERS='[{"email":"admin@example.com","name":"Admin","password":"StrongPassword123!"}]'`
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('ADMIN_BOOTSTRAP_USERS must be valid JSON');
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('ADMIN_BOOTSTRAP_USERS must be a non-empty JSON array');
  }

  const admins = parsed.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`Admin entry at index ${index} must be an object`);
    }

    const email = (item as { email?: unknown }).email;
    const name = (item as { name?: unknown }).name;
    const password = (item as { password?: unknown }).password;

    if (typeof email !== 'string' || !email.includes('@')) {
      throw new Error(`Admin entry at index ${index} has invalid email`);
    }

    if (name !== undefined && typeof name !== 'string') {
      throw new Error(`Admin entry at index ${index} has invalid name`);
    }

    if (typeof password !== 'string' || password.length < 12) {
      throw new Error(`Admin entry at index ${index} requires a password with at least 12 characters`);
    }

    return {
      email: email.toLowerCase().trim(),
      name: typeof name === 'string' ? name.trim() : undefined,
      password,
    };
  });

  return admins;
}

async function createAdmins(): Promise<void> {
  const admins = parseAdmins();

  for (const admin of admins) {
    try {
      const existing = await prisma.user.findUnique({
        where: { email: admin.email },
      });

      if (existing) {
        await prisma.user.update({
          where: { email: admin.email },
          data: {
            isAdmin: true,
            plan: 'ELITE',
            planExpiresAt: new Date('2050-12-31'),
          },
        });

        console.log(`Updated ${admin.email} to admin`);
      } else {
        const passwordHash = await bcrypt.hash(admin.password, 12);

        await prisma.user.create({
          data: {
            email: admin.email,
            name: admin.name,
            passwordHash,
            isAdmin: true,
            plan: 'ELITE',
            planExpiresAt: new Date('2050-12-31'),
            trialEndsAt: new Date('2050-12-31'),
          },
        });

        console.log(`Created admin user: ${admin.email}`);
      }
    } catch (error) {
      console.error(`Failed to create/update ${admin.email}:`, error);
    }
  }

  await prisma.$disconnect();
}

void createAdmins();
