"use client";

import CustomButton from "@/components/custom/custom-button";
import Dropdown from "@/components/custom/dropdown";
import SheetWrapper, {
  SheetFooterWrapper,
} from "@/components/custom/sheet-wrapper";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { useCreateMutation } from "@/hooks/utils";
import { getDirtyValues } from "@/lib/form";
import { useAdminCompanies } from "@/modules/features/companies/hooks";
import { useModalStore } from "@/store";
import { CURRENCY_LIST } from "@rona/config/admin";
import { CompanySettingsDto, CompanySettingsSchema } from "@rona/types/admin";
import { companySettingsSchema } from "@rona/validation/admin";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { ApiPatchCompanySettings, ApiPostCompanySettings } from "../api";

const defaults: CompanySettingsSchema = { tenantId: "", currency: "ETB" };
const CompanySettingsModal = () => {
  const { open, data, view, closeModal } = useModalStore();
  const settings = (data as { settings: CompanySettingsDto } | null)?.settings;
  const { companies } = useAdminCompanies();
  const form = useForm<CompanySettingsSchema>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: defaults,
    disabled: !!view,
  });
  const client = useQueryClient();
  const done = (message: string) => {
    toast.success(message);
    client.invalidateQueries({ queryKey: ["admin-company-settings"] });
    closeModal();
  };
  const createMutation = useCreateMutation(
    ApiPostCompanySettings,
    (result) => done(result.message),
    (result) => toast.error(result.message),
  );
  const updateMutation = useCreateMutation(
    ApiPatchCompanySettings,
    (result) => done(result.message),
    (result) => toast.error(result.message),
  );
  useEffect(() => {
    if (settings)
      form.reset({ tenantId: settings.tenantId, currency: settings.currency });
    else form.reset(defaults);
  }, [settings, open, form]);
  const submit = (values: CompanySettingsSchema) =>
    settings
      ? updateMutation.mutate({
          body: getDirtyValues(values, form.formState.dirtyFields),
          slugReplacement: { id: settings.id },
        })
      : createMutation.mutate({ body: values });
  return (
    <SheetWrapper
      title={
        settings
          ? view
            ? "Company settings details"
            : "Edit Company Settings"
          : "Add Company Settings"
      }
      open={open === "admin-company-settings"}
      onOpen={closeModal}
    >
      <form
        onSubmit={form.handleSubmit(submit)}
        className="space-y-6 flex px-4 pt-4 flex-col flex-1"
      >
        <FieldGroup>
          <Controller
            control={form.control}
            name="tenantId"
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor={field.name + "-input"}>Company</FieldLabel>
                <Dropdown
                  {...field}
                  options={companies.map((company) => ({
                    value: company.id,
                    label: company.name,
                  }))}
                  disabled={!!view}
                />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="currency"
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor={field.name + "-input"}>
                  Currency
                </FieldLabel>
                <Dropdown
                  {...field}
                  options={CURRENCY_LIST.map((value) => ({
                    value,
                    label: value,
                  }))}
                  disabled={!!view}
                />
              </Field>
            )}
          />
        </FieldGroup>
        {!view && (
          <SheetFooterWrapper>
            <CustomButton
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {settings ? "Save" : "Add"}
            </CustomButton>
          </SheetFooterWrapper>
        )}
      </form>
    </SheetWrapper>
  );
};
export default CompanySettingsModal;
