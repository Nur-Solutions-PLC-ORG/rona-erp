"use client";

import CustomButton from "@/components/custom/custom-button";
import Dropdown from "@/components/custom/dropdown";
import { ControllerGroup } from "@/components/custom/form";
import SheetWrapper, {
  SheetFooterWrapper,
} from "@/components/custom/sheet-wrapper";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useCreateMutation } from "@/hooks/utils";
import { getDirtyValues } from "@/lib/form";
import { slugToString, stringToSlug } from "@/lib/utils";
import { useModalStore } from "@/store";
import { COMPANY_STATUS_LIST } from "@rona/config/admin";
import { CompanyDto, CompanySchema } from "@rona/types/admin";
import { companySchema } from "@rona/validation/admin";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { ApiPatchCompany, ApiPostCompany } from "../api";
import { Button } from "@/components/ui/button";

const defaultValues: CompanySchema = {
  name: "",
  slug: "",
  email: "",
  phone: "",
  country: "",
  status: "active",
};

const CompanyModal = () => {
  const { open, data: rawData, closeModal, view } = useModalStore();
  const modalData = rawData as { company?: CompanyDto | undefined } | null;

  const form = useForm<CompanySchema>({
    resolver: zodResolver(companySchema),
    defaultValues,
    disabled: !!view,
  });

  const queryClient = useQueryClient();
  const concludeMutation = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
    form.reset();
    closeModal();
  };

  const createMutation = useCreateMutation(
    ApiPostCompany,
    (result) => {
      toast.success(result.message);
      concludeMutation();
    },
    (result) => {
      toast.error(result.message);
    },
  );
  const updateMutation = useCreateMutation(
    ApiPatchCompany,
    (result) => {
      toast.success(result.message);
      concludeMutation();
    },
    (result) => {
      toast.error(result.message);
    },
  );

  useEffect(() => {
    if (modalData && modalData.company) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, createdAt, ...values } = modalData.company;
      form.reset(values);
    } else form.reset(defaultValues);
  }, [open, modalData, form]);

  const onSubmit = (values: CompanySchema) => {
    if (view) return;

    if (modalData) {
      if (!modalData.company) {
        toast.info("Please select a company to update");
        return;
      }

      updateMutation.mutate({
        body: getDirtyValues(values, form.formState.dirtyFields),
        slugReplacement: { id: modalData.company.id },
      });
    } else {
      createMutation.mutate({ body: values });
    }
  };

  return (
    <SheetWrapper
      title={
        modalData?.company
          ? view
            ? "Company details"
            : "Edit Company"
          : "Add Company"
      }
      open={open === "admin-company"}
      onOpen={closeModal}
    >
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 flex px-4 pt-4 flex-col flex-1"
      >
        <FieldGroup>
          <ControllerGroup>
            <Controller
              control={form.control}
              name={"name"}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name + "-input"}>Name</FieldLabel>
                  <Input
                    {...field}
                    id={field.name + "-input"}
                    aria-invalid={fieldState.invalid}
                    placeholder={"Acme Inc."}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name={"slug"}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <div className="flex items-center justify-between">
                    <FieldLabel htmlFor={field.name + "-input"}>
                      Slug
                    </FieldLabel>

                    <Button
                      type="button"
                      variant={"link"}
                      onClick={() => {
                        const name = form.getValues("name");
                        if (!name) {
                          toast.info("Please provide name first.");
                          return;
                        }

                        form.setValue("slug", stringToSlug(name));
                      }}
                      size={"sm"}
                      className="h-0 cursor-pointer"
                    >
                      Generate slug
                    </Button>
                  </div>
                  <Input
                    {...field}
                    id={field.name + "-input"}
                    aria-invalid={fieldState.invalid}
                    placeholder={"acme-inc"}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </ControllerGroup>
          <ControllerGroup>
            <Controller
              control={form.control}
              name={"email"}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name + "-input"}>Email</FieldLabel>
                  <Input
                    {...field}
                    id={field.name + "-input"}
                    type={"email"}
                    placeholder="acmeinc@gmail.com"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name={"phone"}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name + "-input"}>Phone</FieldLabel>
                  <Input
                    {...field}
                    id={field.name + "-input"}
                    type={"tel"}
                    placeholder="+251 99919191919"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </ControllerGroup>
          <ControllerGroup>
            <Controller
              control={form.control}
              name="country"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name + "-input"}>
                    Country
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name + "-input"}
                    placeholder="Ethiopia"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="status"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name + "-input"}>
                    Status
                  </FieldLabel>
                  <Dropdown
                    {...field}
                    options={COMPANY_STATUS_LIST.map((value) => ({
                      value,
                      label: slugToString(value),
                    }))}
                    disabled={!!view}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </ControllerGroup>
        </FieldGroup>
        {!view && (
          <SheetFooterWrapper>
            <CustomButton
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {modalData?.company ? "Save" : "Add"}
            </CustomButton>
          </SheetFooterWrapper>
        )}
      </form>
    </SheetWrapper>
  );
};

export default CompanyModal;
