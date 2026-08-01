import CustomButton from "@/components/custom/custom-button";
import Dropdown from "@/components/custom/dropdown";
import { ControllerGroup } from "@/components/custom/form";
import { ListInput } from "@/components/custom/list-input";
import PasswordInput from "@/components/custom/password-input";
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
  tenantId: "",
};

const UserModal = () => {
  const { open, data: rawData, closeModal, view } = useModalStore();
  const modalData = rawData as { user: UserDto } | null;
  const modalMeta = {
    id: "admin-user",
    title: "User",
  };

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
    (data) => {
      toast.success(data.message);

      concludeMutation();
    },
    (data) => {
      toast.error(data.message);
    },
  );

  const editMutation = useCreateMutation(
    ApiPatchUser,
    (data) => {
      toast.success(data.message);

      concludeMutation();
    },
    (data) => {
      toast.error(data.message);
    },
  );

  useEffect(() => {
    if (modalData) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...alikeFields } = modalData.user;
      form.reset({
        ...alikeFields,
      });
    } else {
      form.reset(defaultValues);
    }
  }, [open, form, modalData]);

  const onSubmit = (values: UserSchema) => {
    if (view) return;

    if (modalData) {
      editMutation.mutate({
        body: getDirtyValues(values, form.formState.dirtyFields),
        slugReplacement: {
          id: modalData.user.id,
        },
      });
    } else {
      createMutation.mutate({
        body: values,
      });
    }
  };

  return (
    <SheetWrapper
      title={
        modalData
          ? view
            ? `${modalMeta.title} details`
            : `Edit ${modalMeta.title}`
          : `Add ${modalMeta.title}`
      }
      open={open == modalMeta.id}
      onOpen={() => closeModal()}
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="px-6 space-y-5 pt-6">
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
                    <FieldLabel htmlFor={field.name + "-input"}>
                      Email
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name + "-input"}
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
                    <FieldLabel htmlFor={field.name + "-input"}>
                      Password
                    </FieldLabel>
                    <PasswordInput
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
            </ControllerGroup>

            <Controller
              control={form.control}
              name="role.modules"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name + "-input"}>
                    Modules
                  </FieldLabel>
                  <ListInput
                    options={MODULE_LIST.map((status) => ({
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
          </FieldGroup>
        </div>

        {!view && (
          <SheetFooterWrapper>
            <CustomButton
              type="submit"
              disabled={createMutation.isPending || editMutation.isPending}
            >
              {modalData ? "Save" : "Add"}
            </CustomButton>
          </SheetFooterWrapper>
        )}
      </form>
    </SheetWrapper>
  );
};

export default UserModal;
