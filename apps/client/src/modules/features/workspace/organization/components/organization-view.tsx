"use client";

import { useState } from "react";
import { toast } from "sonner";
import { HiOutlineBuildingOffice2, HiOutlinePencilSquare } from "react-icons/hi2";
import { ORGANIZATION_STATUS_LIST } from "@rona/config/admin";
import { organizationUpdateSchema } from "@rona/validation/tenancy";
import type { OrganizationUpdateSchema } from "@rona/types/tenancy";
import { usePermissions } from "@/modules/workspace/hooks";
import {
  BTN_PRIMARY,
  Card,
  EmptyState,
  PageHeader,
  StatusBadge,
} from "@/modules/workspace/components/ui";
import {
  FormModal,
  LabeledInput,
  LabeledSelect,
  ModalActions,
} from "@/modules/workspace/components/form";
import LogoUpload from "@/components/custom/logo-upload";
import OrgLogo from "@/components/custom/org-logo";
import {
  useOrganization,
  useOrganizationSettings,
  useUpdateOrganization,
} from "../hooks";

interface OrgForm {
  name: string;
  slug: string;
  email: string;
  phone: string;
  country: string;
  status: string;
  logoUrl: string;
}

const toForm = (organization: {
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  country: string | null;
  logoUrl: string | null;
  status: string;
}): OrgForm => ({
  name: organization.name,
  slug: organization.slug,
  email: organization.email ?? "",
  phone: organization.phone ?? "",
  country: organization.country ?? "",
  status: organization.status,
  logoUrl: organization.logoUrl ?? "",
});

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-zinc-100 last:border-0">
      <span className="text-xs font-medium text-zinc-500">{label}</span>
      <span className="text-xs font-medium text-zinc-800 text-right break-all">
        {value || "—"}
      </span>
    </div>
  );
}

export default function OrganizationView() {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission("organization.read");
  const canUpdate = hasPermission("organization.update");

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [form, setForm] = useState<OrgForm>({
    name: "",
    slug: "",
    email: "",
    phone: "",
    country: "",
    status: "",
    logoUrl: "",
  });

  const { organization, isLoading } = useOrganization();
  const { settings } = useOrganizationSettings();
  const updateOrganization = useUpdateOrganization();

  if (!canRead) {
    return (
      <EmptyState
        icon={<HiOutlineBuildingOffice2 className="w-6 h-6" />}
        title="Organization unavailable"
        description="You do not have permission to view organization details. Contact an administrator."
      />
    );
  }

  const updateForm = (key: keyof OrgForm, value: string) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const submitUpdate = () => {
    const parsed = organizationUpdateSchema.safeParse({
      name: form.name,
      slug: form.slug,
      email: form.email || undefined,
      phone: form.phone || undefined,
      country: form.country || undefined,
      status: form.status || undefined,
      logoUrl: form.logoUrl ? form.logoUrl : null,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid organization details");
      return;
    }

    updateOrganization.mutate(parsed.data as OrganizationUpdateSchema, {
      onSuccess: () => setIsEditOpen(false),
    });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        icon={<HiOutlineBuildingOffice2 className="w-5 h-5" />}
        title="Organization"
        description="Profile and settings for the current organization"
        actions={
          canUpdate ? (
            <button
              type="button"
              className={BTN_PRIMARY}
              onClick={() => {
                if (!organization) return;
                setForm(toForm(organization));
                setIsEditOpen(true);
              }}
              disabled={!organization}
            >
              <HiOutlinePencilSquare className="w-4 h-4" />
              Edit Organization
            </button>
          ) : undefined
        }
      />

      {isLoading && !organization ? (
        <Card className="p-8 text-center text-xs text-zinc-500">
          Loading organization…
        </Card>
      ) : organization ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <OrgLogo
                  src={organization.logoUrl}
                  className="h-7 w-7 bg-card"
                  iconClassName="h-3.5 w-3.5"
                />
                <h2 className="text-sm font-semibold text-zinc-800">Profile</h2>
              </div>
              <StatusBadge status={organization.status} />
            </div>
            <div>
              <DetailRow label="Name" value={organization.name} />
              <DetailRow label="Slug" value={organization.slug} />
              <DetailRow label="Email" value={organization.email ?? ""} />
              <DetailRow label="Phone" value={organization.phone ?? ""} />
              <DetailRow label="Country" value={organization.country ?? ""} />
              <DetailRow
                label="Created"
                value={new Date(organization.createdAt).toLocaleDateString()}
              />
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-zinc-800 mb-3">Settings</h2>
            <div>
              <DetailRow label="Currency" value={settings?.currency ?? "—"} />
              <DetailRow
                label="Settings ID"
                value={settings ? settings.id.slice(0, 8) : "—"}
              />
              {settings && (
                <DetailRow
                  label="Updated"
                  value={new Date(settings.updatedAt).toLocaleDateString()}
                />
              )}
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-zinc-400">
              Currency and other defaults are managed by the system for now.
            </p>
          </Card>
        </div>
      ) : (
        <EmptyState
          icon={<HiOutlineBuildingOffice2 className="w-6 h-6" />}
          title="No organization found"
          description="The active membership could not be resolved to an organization."
        />
      )}

      <FormModal
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Organization"
        icon={<HiOutlinePencilSquare className="w-4 h-4" />}
        maxWidth="max-w-lg"
      >
        <div>
          <label className="block mb-1.5 text-xs font-medium text-zinc-600">
            Logo
          </label>
          <LogoUpload
            value={form.logoUrl}
            onChange={(value) => updateForm("logoUrl", value ?? "")}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <LabeledInput
            label="Name"
            id="org-name"
            value={form.name}
            onChange={(event) => updateForm("name", event.target.value)}
            placeholder="e.g. Rona Manufacturing PLC"
          />
          <LabeledInput
            label="Slug"
            id="org-slug"
            value={form.slug}
            onChange={(event) => updateForm("slug", event.target.value)}
            placeholder="e.g. rona-manufacturing"
          />
          <LabeledInput
            label="Email (optional)"
            id="org-email"
            type="email"
            value={form.email}
            onChange={(event) => updateForm("email", event.target.value)}
            placeholder="info@example.com"
          />
          <LabeledInput
            label="Phone (optional)"
            id="org-phone"
            value={form.phone}
            onChange={(event) => updateForm("phone", event.target.value)}
            placeholder="e.g. 0912345678"
          />
          <LabeledInput
            label="Country (optional)"
            id="org-country"
            value={form.country}
            onChange={(event) => updateForm("country", event.target.value)}
            placeholder="e.g. Ethiopia"
          />
          <LabeledSelect
            label="Status"
            id="org-status"
            value={form.status}
            onChange={(event) => updateForm("status", event.target.value)}
          >
            <option value="">Select…</option>
            {ORGANIZATION_STATUS_LIST.map((status) => (
              <option key={status} value={status}>
                {status.toUpperCase()}
              </option>
            ))}
          </LabeledSelect>
        </div>
        <ModalActions
          onCancel={() => setIsEditOpen(false)}
          onSubmit={submitUpdate}
          submitLabel="Save Changes"
          isPending={updateOrganization.isPending}
        />
      </FormModal>
    </div>
  );
}
