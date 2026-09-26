import { db } from '@/db';
import { organizations } from '@/db/schemas/admin';
import { RbacRepository } from '@/modules/rbac/rbac.repository';

async function main() {
  const rbacRepository = new RbacRepository();

  await rbacRepository.upsertPermissions();
  console.log('Upserted global permission catalog.');

  const orgRows = await db.select({ id: organizations.id }).from(organizations);

  for (const org of orgRows) {
    await rbacRepository.upsertDefaultRoles(org.id);
    const added = await rbacRepository.syncDefaultRolePermissions(org.id);
    console.log(
      `Seeded default roles for organization ${org.id}` +
        (added > 0 ? ` (+${added} new permission grants).` : '.'),
    );
  }

  console.log(
    `RBAC seed complete: ${orgRows.length} organization(s) provisioned.`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
