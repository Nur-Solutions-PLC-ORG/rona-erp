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
import { Button } from "@/components/ui/button";
import { generateCombinations } from "@/lib/passwords";
import { useAdminOrganizations } from "../../organizations/hooks";
import { DatePickerInput } from "@/components/custom/date-picker-input";

const defaultValues: EmployeeSchema = {
  organizationId: "",
  eId: "",
  fullName: "",
  phone: "",
  email: "",
  gender: "M",
  birthDate: new Date(),
  status: "active",
};

const EmployeeModal = () => {
  const { open, data: rawData, closeModal, view } = useModalStore();
  const modalData = rawData as { employee?: EmployeeDto | undefined } | null;

  const { organizations } = useAdminOrganizations();
  const form = useForm<EmployeeSchema>({
    resolver: zodResolver(employeeSchema),
    defaultValues,
    disabled: !!view,
  });

  const queryClient = useQueryClient();
  const concludeMutation = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-employees"] });
    form.reset();
    closeModal();
  };

  const createMutation = useCreateMutation(
    ApiPostEmployee,
    (result) => {
      toast.success(result.message);
      concludeMutation();
    },
    (result) => {
      toast.error(result.message);
    },
  );
  const updateMutation = useCreateMutation(
    ApiPatchEmployee,
    (result) => {
      toast.success(result.message);
      concludeMutation();
    },
    (result) => {
      toast.error(result.message);
    },
  );

  useEffect(() => {
    if (modalData && modalData.employee) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, createdAt, ...values } = modalData.employee;
      form.reset(values);
    } else form.reset(defaultValues);
  }, [open, modalData, form]);

  const submit = (values: EmployeeSchema) => {
    if (view) return;

    if (!values.email) {
      values.email = undefined;
    }

    if (modalData) {
      if (!modalData.employee) {
        toast.info("Please select an employee to update");
        return;
      }

      updateMutation.mutate({
        body: getDirtyValues(values, form.formState.dirtyFields),
        slugReplacement: { id: modalData.employee.id },
      });
    } else {
      createMutation.mutate({ body: values });
    }
  };
  return (
    <SheetWrapper
      title={
        modalData?.employee
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
          <ControllerGroup>
            <Controller
              control={form.control}
              name="fullName"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor={field.name + "-input"}>
                    Full Name
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name + "-input"}
                    aria-invalid={fieldState.invalid}
                    placeholder="Simon Seol"
                  />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="eId"
              render={({ field, fieldState }) => (
                <Field>
                  <div className="flex items-center justify-between">
                    <FieldLabel htmlFor={field.name + "-input"}>EID</FieldLabel>

                    <Button
                      type="button"
                      variant={"link"}
                      onClick={() => {
                        form.setValue(
                          "eId",
                          generateCombinations({
                            includeLowercase: false,
                            includeSymbols: false,
                            includeUppercase: false,
                            length: 5,
                          }),
                        );
                      }}
                      size={"sm"}
                      className="h-0 cursor-pointer"
                    >
                      Generate EID
                    </Button>
                  </div>
                  <Input
                    {...field}
                    type="number"
                    id={field.name + "-input"}
                    aria-invalid={fieldState.invalid}
                    placeholder="000000"
                  />
                </Field>
              )}
            />
          </ControllerGroup>
          <ControllerGroup>
            <Controller
              control={form.control}
              name="organizationId"
              render={({ field }) => (
                <Field>
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
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="status"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor={field.name + "-input"}>
                    Status
                  </FieldLabel>
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
          </ControllerGroup>
          <ControllerGroup>
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
                    placeholder="email@gmail.com"
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
              name="gender"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name + "-input"}>
                    Gender
                  </FieldLabel>
                  <Dropdown
                    {...field}
                    options={GENDER_LIST.map((item) => ({
                      value: item,
                      label: item == "F" ? "Female" : "Male",
                    }))}
                    disabled={!!view}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="birthDate"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name + "-input"}>
                    Birth Date (GC)
                  </FieldLabel>
                  <DatePickerInput {...field} />
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
              isPending={createMutation.isPending || updateMutation.isPending}
            >
              {modalData?.employee ? "Save" : "Add"}
            </CustomButton>
          </SheetFooterWrapper>
        )}
      </form>
    </SheetWrapper>
  );
};
export default EmployeeModal;
