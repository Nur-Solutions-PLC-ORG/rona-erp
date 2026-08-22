"use client";

import CustomButton from "@/components/custom/custom-button";
import Dropdown from "@/components/custom/dropdown";
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
import { useAdminDepartments } from "@/modules/features/platform/departments/hooks";
import { useModalStore } from "@/store";
import { zodResolver } from "@hookform/resolvers/zod";
import { BranchDto, BranchSchema } from "@rona/types/admin";
import { branchSchema } from "@rona/validation/admin";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { ApiPatchBranch, ApiPostBranch } from "../api";
import { useAdminCompanies } from "../../companies/hooks";

const defaultValues: BranchSchema = { departmentId: "", name: "" };

const BranchModal = () => {
  const { open, data: rawData, closeModal, view } = useModalStore();
  const modalData = rawData as { branch?: BranchDto | undefined } | null;
  const { departments } = useAdminDepartments();
  const { companiesNameLookup } = useAdminCompanies();

  const form = useForm<BranchSchema>({
    resolver: zodResolver(branchSchema),
    defaultValues,
    disabled: !!view,
  });

  const queryClient = useQueryClient();
  const concludeMutation = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-branches"] });
    form.reset();
    closeModal();
  };

  const createMutation = useCreateMutation(
    ApiPostBranch,
    (result) => {
      toast.success(result.message);
      concludeMutation();
    },
    (result) => toast.error(result.message),
  );
  const updateMutation = useCreateMutation(
    ApiPatchBranch,
    (result) => {
      toast.success(result.message);
      concludeMutation();
    },
    (result) => toast.error(result.message),
  );

  useEffect(() => {
    if (modalData && modalData.branch) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, tenantId, createdAt, ...values } = modalData.branch;
      form.reset(values);
    } else form.reset(defaultValues);
  }, [open, modalData, form]);

  const submit = (values: BranchSchema) => {
    if (view) return;

    if (modalData) {
      if (!modalData.branch) {
        toast.info("Please select a branch to update");
        return;
      }

      updateMutation.mutate({
        body: getDirtyValues(values, form.formState.dirtyFields),
        slugReplacement: { id: modalData.branch.id },
      });
    } else {
      createMutation.mutate({ body: values });
    }
  };

  return (
    <SheetWrapper
      title={
        modalData?.branch
          ? view
            ? "Branch details"
            : "Edit Branch"
          : "Add Branch"
      }
      open={open === "admin-branch"}
      onOpen={closeModal}
    >
      <form
        onSubmit={form.handleSubmit(submit)}
        className="space-y-6 flex px-4 pt-4 flex-col flex-1"
      >
        <FieldGroup>
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
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="departmentId"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name + "-input"}>
                  Department
                </FieldLabel>
                <Dropdown
                  {...field}
                  options={departments.map((department) => ({
                    value: department.id,
                    label: department.name,
                    id: companiesNameLookup[department.tenantId],
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
        </FieldGroup>
        {!view && (
          <SheetFooterWrapper>
            <CustomButton
              type="submit"
              isPending={createMutation.isPending || updateMutation.isPending}
            >
              {modalData?.branch ? "Save" : "Add"}
            </CustomButton>
          </SheetFooterWrapper>
        )}
      </form>
    </SheetWrapper>
  );
};
export default BranchModal;
