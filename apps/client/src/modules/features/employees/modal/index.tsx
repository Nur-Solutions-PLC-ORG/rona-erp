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
import { getDirtyValues } from "@/lib/form";
import { slugToString } from "@/lib/utils";
import { useAdminCompanies } from "@/modules/features/companies/hooks";
import { useCreateMutation } from "@/hooks/utils";
import { useModalStore } from "@/store";
import { EMPLOYEE_STATUS_LIST, GENDER_LIST } from "@rona/config/admin";
import { EmployeeDto, EmployeeSchema } from "@rona/types/admin";
import { employeeSchema } from "@rona/validation/admin";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { ApiPatchEmployee, ApiPostEmployee } from "../api";

const defaultValues: EmployeeSchema = {
  tenantId: "",
  eId: "",
  fullName: "",
  phone: "",
  email: "",
  gender: "M",
  birthDate: "",
  status: "active",
};
const EmployeeModal = () => {
  const { open, data: rawData, closeModal, view } = useModalStore();
  const modalData = rawData as { employee: EmployeeDto } | null;
  const { companies } = useAdminCompanies();
  const form = useForm<EmployeeSchema>({
    resolver: zodResolver(employeeSchema),
    defaultValues,
    disabled: !!view,
  });
  const queryClient = useQueryClient();
  const done = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-employees"] });
    closeModal();
  };
  const createMutation = useCreateMutation(
    ApiPostEmployee,
    (data) => {
      toast.success(data.message);
      done();
    },
    (data) => toast.error(data.message),
  );
  const updateMutation = useCreateMutation(
    ApiPatchEmployee,
    (data) => {
      toast.success(data.message);
      done();
    },
    (data) => toast.error(data.message),
  );
  useEffect(() => {
    if (modalData) {
      const { id, createdAt, ...values } = modalData.employee;
      form.reset(values);
    } else form.reset(defaultValues);
  }, [open, modalData, form]);
  const submit = (values: EmployeeSchema) => {
    if (modalData)
      updateMutation.mutate({
        body: getDirtyValues(values, form.formState.dirtyFields),
        slugReplacement: { id: modalData.employee.id },
      });
    else createMutation.mutate({ body: values });
  };
  return (
    <SheetWrapper
      title={
        modalData
          ? view
            ? "Employee details"
            : "Edit Employee"
          : "Add Employee"
      }
      open={open === "admin-employee"}
      onOpen={closeModal}
    >
      <form
        onSubmit={form.handleSubmit(submit)}
        className="space-y-6 flex px-4 pt-4 flex-col flex-1"
      >
        <FieldGroup>
          <Controller
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor={field.name + "-input"}>
                  Full Name
                </FieldLabel>
                <Input {...field} />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="eId"
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor={field.name + "-input"}>
                  Employee ID
                </FieldLabel>
                <Input {...field} />
              </Field>
            )}
          />
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
            name="status"
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor={field.name + "-input"}>Status</FieldLabel>
                <Dropdown
                  {...field}
                  options={EMPLOYEE_STATUS_LIST.map((value) => ({
                    value,
                    label: slugToString(value),
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
              {modalData ? "Save" : "Add"}
            </CustomButton>
          </SheetFooterWrapper>
        )}
      </form>
    </SheetWrapper>
  );
};
export default EmployeeModal;
