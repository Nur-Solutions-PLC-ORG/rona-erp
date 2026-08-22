"use client";
import CustomButton from "@/components/custom/custom-button";
import SheetWrapper, {
  SheetFooterWrapper,
} from "@/components/custom/sheet-wrapper";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useCreateMutation } from "@/hooks/utils";
import { useModalStore } from "@/store";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlatformConfigDto, PlatformConfigSchema } from "@rona/types/admin";
import { platformConfigSchema } from "@rona/validation/admin";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { ApiPutPlatformConfig } from "../api";

const defaultValues: PlatformConfigSchema = {
  key: "name",
  value: "",
  type: "string",
};

const PlatformConfigModal = () => {
  const { open, data, view, closeModal } = useModalStore();
  const modalData = data as { config?: PlatformConfigDto | undefined } | null;

  const form = useForm<PlatformConfigSchema>({
    resolver: zodResolver(platformConfigSchema),
    defaultValues,
    disabled: !!view,
  });

  const type = useWatch({
    control: form.control,
    name: "type",
  });

  const queryClient = useQueryClient();
  const updateMutation = useCreateMutation(
    ApiPutPlatformConfig,
    (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: ["admin-platform-configs"] });
      closeModal();
    },
    (result) => {
      toast.error(result.message);
    },
  );

  useEffect(() => {
    if (modalData && modalData.config) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...values } = modalData.config;
      form.reset(values);
    } else form.reset(defaultValues);
  }, [open, modalData, form]);

  const submit = (values: PlatformConfigSchema) => {
    if (modalData && modalData.config)
      updateMutation.mutate({
        body: { value: values.value, type: values.type },
        slugReplacement: { key: modalData.config.key },
      });
    else toast.info("Please select a config to update");
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
            name="type"
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor={field.name + "-input"}>Type</FieldLabel>
                <Input value={field.value} disabled className="font-mono" />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="key"
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor={field.name + "-input"}>Config</FieldLabel>
                <Input value={field.value} disabled className="font-mono" />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="value"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor={field.name + "-input"}>Value</FieldLabel>

                {type == "boolean" ? (
                  <Switch
                    id={field.name + "-input"}
                    name={field.name}
                    aria-invalid={fieldState.invalid}
                    disabled={field.disabled}
                    checked={field.value == "true" ? true : false}
                    onCheckedChange={(value) =>
                      field.onChange(value as boolean)
                    }
                  />
                ) : type == "string" ? (
                  <Input
                    disabled={field.disabled}
                    id={field.name + "-input"}
                    name={field.name}
                    aria-invalid={fieldState.invalid}
                    value={String(field.value)}
                    onChange={(e) =>
                      field.onChange(String(e.target.value || ""))
                    }
                  />
                ) : (
                  <Input
                    disabled={field.disabled}
                    id={field.name + "-input"}
                    name={field.name}
                    aria-invalid={fieldState.invalid}
                    type="number"
                    value={Number(field.value)}
                    onChange={(e) =>
                      field.onChange(Number((e.target.value || "") as string))
                    }
                  />
                )}
              </Field>
            )}
          />
        </FieldGroup>
        {!view && (
          <SheetFooterWrapper>
            <CustomButton type="submit" isPending={updateMutation.isPending}>
              Save
            </CustomButton>
          </SheetFooterWrapper>
        )}
      </form>
    </SheetWrapper>
  );
};
export default PlatformConfigModal;
