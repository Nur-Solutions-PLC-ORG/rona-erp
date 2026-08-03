"use client";

import CustomButton from "@/components/custom/custom-button";
import Dropdown from "@/components/custom/dropdown";
import { ControllerGroup } from "@/components/custom/form";
import { ListInput } from "@/components/custom/list-input";
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
import { slugToString } from "@/lib/utils";
import { useAdminCompanies } from "@/modules/features/companies/hooks";
import { useModalStore } from "@/store";
import { zodResolver } from "@hookform/resolvers/zod";
import { MODULE_LIST } from "@rona/config/auth";
import { DepartmentDto, DepartmentSchema } from "@rona/types/admin";
import { departmentSchema } from "@rona/validation/admin";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { ApiPatchDepartment, ApiPostDepartment } from "../api";

const defaultValues: DepartmentSchema = { tenantId: "", name: "", module: [] };

const DepartmentModal = () => {
  const { open, data: rawData, closeModal, view } = useModalStore();
  const modalData = rawData as { department: DepartmentDto } | null;
  const { companies } = useAdminCompanies();

  const form = useForm<DepartmentSchema>({
    resolver: zodResolver(departmentSchema),
    defaultValues,
    disabled: !!view,
  });

  const queryClient = useQueryClient();
  const concludeMutation = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-departments"] });
    form.reset();
    closeModal();
  };

  const createMutation = useCreateMutation(
    ApiPostDepartment,
    (data) => {
      toast.success(data.message);
      concludeMutation();
    },
    (data) => toast.error(data.message),
  );
  const updateMutation = useCreateMutation(
    ApiPatchDepartment,
    (data) => {
      toast.success(data.message);
      concludeMutation();
    },
    (data) => toast.error(data.message),
  );

  useEffect(() => {
    if (modalData) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, createdAt, ...values } = modalData.department;
      form.reset(values);
    } else form.reset(defaultValues);
  }, [open, modalData, form]);
  const submit = (values: DepartmentSchema) => {
    if (view) return;

    if (modalData)
      updateMutation.mutate({
        body: getDirtyValues(values, form.formState.dirtyFields),
        slugReplacement: { id: modalData.department.id },
      });
    else {
      createMutation.mutate({ body: values });
    }
  };

  return (
    <SheetWrapper
      title={
        modalData
          ? view
            ? "Department details"
            : "Edit Department"
          : "Add Department"
      }
      open={open === "admin-department"}
      onOpen={closeModal}
    >
      <form
        onSubmit={form.handleSubmit(submit)}
        className="space-y-6 flex px-4 pt-4 flex-col flex-1"
      >
        <FieldGroup>
          <ControllerGroup>
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name + "-input"}>Name</FieldLabel>
                  <Input
                    {...field}
                    id={field.name + "-input"}
                    aria-invalid={fieldState.invalid}
                    placeholder="Engineering"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="tenantId"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name + "-input"}>
                    Company
                  </FieldLabel>
                  <Dropdown
                    {...field}
                    options={companies.map((company) => ({
                      value: company.id,
                      label: company.name,
                    }))}
                    disabled={!!view}
                    search
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </ControllerGroup>
          <Controller
            control={form.control}
            name="module"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name + "-input"}>Modules</FieldLabel>
                <ListInput
                  {...field}
                  options={MODULE_LIST.map((value) => ({
                    value,
                    label: slugToString(value),
                  }))}
                  viewMode={view}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
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
              {modalData ? "Save" : "Add"}
            </CustomButton>
          </SheetFooterWrapper>
        )}
      </form>
    </SheetWrapper>
  );
};

export default DepartmentModal;
