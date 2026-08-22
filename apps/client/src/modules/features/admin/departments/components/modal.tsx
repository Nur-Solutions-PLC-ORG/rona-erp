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
import { useAdminOrganizations } from "@/modules/features/admin/organizations/hooks";
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

const defaultValues: DepartmentSchema = {
  organizationId: "",
  name: "",
  module: [],
};

const DepartmentModal = () => {
  const { open, data: rawData, closeModal, view } = useModalStore();
  const modalData = rawData as {
    department?: DepartmentDto | undefined;
  } | null;
  const { organizations } = useAdminOrganizations();

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
    (result) => {
      toast.success(result.message);
      concludeMutation();
    },
    (result) => {
      toast.error(result.message);
    },
  );
  const updateMutation = useCreateMutation(
    ApiPatchDepartment,
    (result) => {
      toast.success(result.message);
      concludeMutation();
    },
    (result) => {
      toast.error(result.message);
    },
  );

  useEffect(() => {
    if (modalData && modalData.department) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, createdAt, ...values } = modalData.department;
      form.reset(values);
    } else form.reset(defaultValues);
  }, [open, modalData, form]);
  const submit = (values: DepartmentSchema) => {
    if (view) return;

    if (modalData) {
      if (!modalData.department) {
        toast.info("Please select a user to update");
        return;
      }

      updateMutation.mutate({
        body: getDirtyValues(values, form.formState.dirtyFields),
        slugReplacement: { id: modalData.department.id },
      });
    } else {
      createMutation.mutate({ body: values });
    }
  };

  return (
    <SheetWrapper
      title={
        modalData?.department
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
              name="organizationId"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name + "-input"}>
                    Organization
                  </FieldLabel>
                  <Dropdown
                    {...field}
                    options={organizations.map((organization) => ({
                      value: organization.id,
                      label: organization.name,
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
              isPending={createMutation.isPending || updateMutation.isPending}
            >
              {modalData?.department ? "Save" : "Add"}
            </CustomButton>
          </SheetFooterWrapper>
        )}
      </form>
    </SheetWrapper>
  );
};

export default DepartmentModal;
