"use client";
import CustomButton from "@/components/custom/custom-button";
import Dropdown from "@/components/custom/dropdown";
import SheetWrapper, {
  SheetFooterWrapper,
} from "@/components/custom/sheet-wrapper";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useCreateMutation } from "@/hooks/utils";
import { slugToString } from "@/lib/utils";
import { useModalStore } from "@/store";
import { PLATFORM_CONFIG_VALUE_TYPES } from "@rona/config/admin";
import { PlatformConfigDto, PlatformConfigSchema } from "@rona/types/admin";
import { platformConfigSchema } from "@rona/validation/admin";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { ApiPutPlatformConfig } from "../api";
const defaults: PlatformConfigSchema = {
  key: "name",
  value: "",
  type: "string",
};
const PlatformConfigModal = () => {
  const { open, data, view, closeModal } = useModalStore();
  const config = (data as { config: PlatformConfigDto } | null)?.config;
  const form = useForm<PlatformConfigSchema>({
    resolver: zodResolver(platformConfigSchema),
    defaultValues: defaults,
    disabled: !!view,
  });
  const queryClient = useQueryClient();
  const updateMutation = useCreateMutation(
    ApiPutPlatformConfig,
    (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: ["admin-platform-configs"] });
      closeModal();
    },
    (result) => toast.error(result.message),
  );
  useEffect(() => {
    if (config)
      form.reset({ key: config.key, value: config.value, type: config.type });
  }, [config, open, form]);
  const submit = (values: PlatformConfigSchema) => {
    if (config)
      updateMutation.mutate({
        body: { value: values.value, type: values.type },
        slugReplacement: { key: config.key },
      });
  };
  return (
    <SheetWrapper
      title={view ? "Platform Config details" : "Edit Platform Config"}
      open={open === "admin-platform-config"}
      onOpen={closeModal}
    >
      <form
        onSubmit={form.handleSubmit(submit)}
        className="space-y-6 flex px-4 pt-4 flex-col flex-1"
      >
        <FieldGroup>
          <Controller
            control={form.control}
            name="key"
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor={field.name + "-input"}>Config</FieldLabel>
                <Input value={slugToString(field.value)} disabled />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="value"
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor={field.name + "-input"}>Value</FieldLabel>
                <Input
                  value={String(field.value)}
                  onChange={(event) => field.onChange(event.target.value)}
                  disabled={!!view}
                />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="type"
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor={field.name + "-input"}>Type</FieldLabel>
                <Dropdown
                  {...field}
                  options={PLATFORM_CONFIG_VALUE_TYPES.map((value) => ({
                    value,
                    label: slugToString(value),
                  }))}
                  disabled
                />
              </Field>
            )}
          />
        </FieldGroup>
        {!view && (
          <SheetFooterWrapper>
            <CustomButton type="submit" disabled={updateMutation.isPending}>
              Save
            </CustomButton>
          </SheetFooterWrapper>
        )}
      </form>
    </SheetWrapper>
  );
};
export default PlatformConfigModal;
