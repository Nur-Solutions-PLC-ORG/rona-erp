import CustomButton from "@/components/custom/custom-button";
import Dropdown from "@/components/custom/dropdown";
import { ControllerGroup } from "@/components/custom/form";
import { ListInput } from "@/components/custom/list-input";
import SheetWrapper, {
  SheetFooterWrapper,
} from "@/components/custom/sheet-wrapper";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useCreateMutation } from "@/hooks/utils";
import { getDirtyValues } from "@/lib/form";
import { generateCombinations } from "@/lib/passwords";
import { slugToString } from "@/lib/utils";
import { useModalStore } from "@/store";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  MODULE_LIST,
  POSITIONS_LIST,
  USER_STATUS_LIST,
} from "@rona/config/auth";
import { UserSchema } from "@rona/types/admin";
import { UserDto } from "@rona/types/auth";
import { userSchema } from "@rona/validation/admin";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useAdminOrganizations } from "../../organizations/hooks";
import { ApiPatchUser, ApiPostUser } from "../api";

const defaultValues: UserSchema = {
  fullName: "",
  email: "",
  password: "",
  status: "active",
  role: {
    position: "staff",
    modules: [],
  },
  organizationId: "",
};

const UserModal = () => {
  const { open, data: rawData, closeModal, view } = useModalStore();
  const modalData = rawData as { user?: UserDto | undefined } | null;

  const { organizations } = useAdminOrganizations();

  const queryClient = useQueryClient();
  const form = useForm<UserSchema>({
    resolver: zodResolver(userSchema),
    reValidateMode: "onSubmit",
    defaultValues,
    disabled: !!view,
  });

  const concludeMutation = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    form.reset();
    closeModal();
  };

  const createMutation = useCreateMutation(
    ApiPostUser,
    (result) => {
      toast.success(result.message);
      concludeMutation();
    },
    (result) => {
      toast.error(result.message);
    },
  );

  const editMutation = useCreateMutation(
    ApiPatchUser,
    (result) => {
      toast.success(result.message);
      concludeMutation();
    },
    (result) => {
      toast.error(result.message);
    },
  );

  useEffect(() => {
    if (modalData && modalData.user) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...values } = modalData.user;
      form.reset({
        ...values,
      });
    } else {
      form.reset(defaultValues);
    }
  }, [open, form, modalData]);

  const onSubmit = (values: UserSchema) => {
    if (view) return;

    if (!values.organizationId) {
      values.organizationId = undefined;
    }

    if (modalData) {
      if (!modalData.user) {
        toast.info("Please select a user to update");
        return;
      }

      editMutation.mutate({
        body: getDirtyValues(values, form.formState.dirtyFields),
        slugReplacement: {
          id: modalData.user.id,
        },
      });
    } else {
      createMutation.mutate({
        body: { ...values },
      });
    }
  };

  return (
    <SheetWrapper
      title={
        modalData?.user ? (view ? `User details` : `Edit User`) : `Add User`
      }
      open={open == "admin-user"}
      onOpen={() => closeModal()}
    >
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 flex px-4 pt-4 flex-col flex-1"
      >
        <FieldGroup>
          <ControllerGroup>
            <Controller
              control={form.control}
              name="fullName"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name + "-input"}>
                    Full Name
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name + "-input"}
                    aria-invalid={fieldState.invalid}
                    placeholder="John James Doe"
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
                    options={USER_STATUS_LIST.map((status) => ({
                      value: status,
                      label: slugToString(status),
                    }))}
                    {...field}
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
              name="email"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name + "-input"}>Email</FieldLabel>
                  <Input
                    {...field}
                    id={field.name + "-input"}
                    type="email"
                    aria-invalid={fieldState.invalid}
                    placeholder="johndoe@gmail.com"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="password"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <div className="flex items-center justify-between">
                    <FieldLabel htmlFor={field.name + "-input"}>
                      Password
                    </FieldLabel>

                    {!view && (
                      <Button
                        type="button"
                        variant={"link"}
                        onClick={() => {
                          form.setValue("password", generateCombinations());
                        }}
                        size={"sm"}
                        className="h-0 cursor-pointer"
                      >
                        Generate password
                      </Button>
                    )}
                  </div>
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
          </ControllerGroup>

          <ControllerGroup>
            <Controller
              control={form.control}
              name="role.position"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name + "-input"}>
                    Position
                  </FieldLabel>
                  <Dropdown
                    options={POSITIONS_LIST.map((status) => ({
                      value: status,
                      label: slugToString(status),
                    }))}
                    {...field}
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
                  <div className="flex items-center gap-3 justify-between">
                    <FieldLabel htmlFor={field.name + "-input"}>
                      Organization
                    </FieldLabel>
                    <Button
                      size={"sm"}
                      type="button"
                      variant="secondary"
                      className="h-5! px-2! cursor-pointer"
                      onClick={() => field.onChange(undefined)}
                    >
                      Set <code>None</code>
                    </Button>
                  </div>

                  <Dropdown
                    options={organizations.map((comp) => ({
                      value: comp.id,
                      label: comp.name,
                    }))}
                    {...field}
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
            name="role.modules"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name + "-input"}>Modules</FieldLabel>
                <ListInput
                  options={MODULE_LIST.map((status) => ({
                    value: status,
                    label: slugToString(status),
                  }))}
                  {...field}
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
              isPending={createMutation.isPending || editMutation.isPending}
            >
              {modalData?.user ? "Save" : "Add"}
            </CustomButton>
          </SheetFooterWrapper>
        )}
      </form>
    </SheetWrapper>
  );
};

export default UserModal;
