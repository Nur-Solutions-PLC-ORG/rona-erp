import { db } from '@/db';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { organizations, organizationSettings } from '@/db/schemas/admin';
import { users, userRoles } from '@/db/schemas/auth';
import {
  membershipRoles,
  organizationMemberships,
  roles,
} from '@/db/schemas/tenancy';
import { RbacRepository } from '@/modules/rbac/rbac.repository';
import { MODULE_LIST } from '@rona/config/auth';

const OWNER_EMAIL = 'oliyadabenet@gmail.com';
const OWNER_NAME = 'Rona Owner';
const ORG_NAME = 'Rona Foods';
const ORG_SLUG = 'rona-foods';
const ORG_EMAIL = OWNER_EMAIL;
const ORG_PHONE = '+251900000000';
const ORG_COUNTRY = 'Ethiopia';

async function main() {
  const [existingOrgBySlug] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, ORG_SLUG))
    .limit(1);

  let org = existingOrgBySlug;

  if (!org) {
    const anyOrgs = await db
      .select({ id: organizations.id })
      .from(organizations)
      .limit(1);

    if (anyOrgs.length > 0) {
      const [first] = await db.select().from(organizations).limit(1);
      org = first;
      console.log(`Using existing organization ${org.name} (${org.id}).`);
    } else {
      const [created] = await db
        .insert(organizations)
        .values({
          name: ORG_NAME,
          slug: ORG_SLUG,
          email: ORG_EMAIL,
          phone: ORG_PHONE,
          country: ORG_COUNTRY,
        })
        .returning();
      org = created;
      console.log(`Created organization ${org.name} (${org.id}).`);
    }
  } else {
    console.log(`Organization ${org.name} (${org.id}) already exists.`);
  }

  const [existingSettings] = await db
    .select({ id: organizationSettings.id })
    .from(organizationSettings)
    .where(eq(organizationSettings.organizationId, org.id))
    .limit(1);

  if (!existingSettings) {
    await db.insert(organizationSettings).values({ organizationId: org.id });
    console.log('Created organization settings.');
  }

  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, OWNER_EMAIL))
    .limit(1);

  if (!user) {
    const passwordHash = await bcrypt.hash(randomBytes(32).toString('hex'), 10);
    [user] = await db
      .insert(users)
      .values({
        fullName: OWNER_NAME,
        email: OWNER_EMAIL,
        passwordHash,
        organizationId: org.id,
        isEmailVerified: true,
        tfaEnabled: false,
        status: 'active',
      })
      .returning();
    console.log(`Created owner user ${user.email} (${user.id}).`);
  } else {
    console.log(`Owner user ${user.email} (${user.id}) already exists.`);
  }

  const existingUserRole = await db
    .select({ id: userRoles.id })
    .from(userRoles)
    .where(eq(userRoles.userId, user.id))
    .limit(1);

  if (existingUserRole.length === 0) {
    await db.insert(userRoles).values({
      userId: user.id,
      position: 'super_admin',
      module: [...MODULE_LIST],
    });
    console.log('Created platform user role (super_admin).');
  }

  const rbacRepository = new RbacRepository();
  await rbacRepository.upsertPermissions();
  await rbacRepository.upsertDefaultRoles(org.id);
  const added = await rbacRepository.syncDefaultRolePermissions(org.id);
  console.log(
    `Seeded RBAC for organization ${org.id}` +
      (added > 0 ? ` (+${added} permission grants).` : '.'),
  );

  await db
    .insert(organizationMemberships)
    .values({
      organizationId: org.id,
      userId: user.id,
      status: 'active',
    })
    .onConflictDoNothing();

  const [membership] = await db
    .select({ id: organizationMemberships.id })
    .from(organizationMemberships)
    .where(eq(organizationMemberships.userId, user.id))
    .limit(1);

  const allOrgRoles = await db
    .select({ id: roles.id, key: roles.key })
    .from(roles)
    .where(eq(roles.organizationId, org.id));
  const ownerRoleRow = allOrgRoles.find((r) => r.key === 'OWNER');

  if (membership && ownerRoleRow) {
    await db
      .insert(membershipRoles)
      .values({ membershipId: membership.id, roleId: ownerRoleRow.id })
      .onConflictDoNothing();
    console.log(`Assigned OWNER role to membership ${membership.id}.`);
  }

  console.log('Admin seed complete.');
  console.log(`  Organization: ${org.name} (${org.id})`);
  console.log(`  Owner user:   ${user.email} (${user.id})`);
  console.log('You can now sign in with Google using this email.');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
