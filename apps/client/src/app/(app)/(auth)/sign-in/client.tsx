"use client";

import {
  ApiGetGoogleUrl,
  ApiPostResendVerificationCode,
  ApiPostSignIn,
} from "@/api";
import CardWrapper, {
  CardWrapperParent,
} from "@/components/custom/card-wrapper";
import CustomButton from "@/components/custom/custom-button";
import PasswordInput from "@/components/custom/password-input";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useCreateMutation } from "@/hooks/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { OPT_RESEND_DELAY_DURATION_MS } from "@rona/config/auth";
import { CLIENT_APP_DASHBOARD_PAGE } from "@rona/routes/app";
import { ResendVerificationCodeSchema, SignInSchema } from "@rona/types/auth";
import { signInSchema } from "@rona/validation/auth";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { FcGoogle } from "react-icons/fc";
import { toast } from "sonner";

const defaultValues: SignInSchema = {
  email: "",
  password: "",
};

const Client = () => {
  const router = useRouter();

  const form = useForm<SignInSchema>({
    resolver: zodResolver(signInSchema),
    reValidateMode: "onSubmit",
    defaultValues,
  });

  const [tFAEnabled, setTFAEnabled] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  const emailValue = useWatch({ control: form.control, name: "email" });

  const googleMutation = useCreateMutation(
    ApiGetGoogleUrl,
    (data) => {
      if (data.data) {
        router.push(data.data);
        toast.info("Redirecting...");
      }
    },
    (data) => {
      toast.error(data.message);
    },
  );

  const signInMutation = useCreateMutation(
    ApiPostSignIn,
    (data) => {
      toast.success(data.message);

      if (data.data && data.data.tfaEnabled) {
        setTFAEnabled(true);
        setResendIn(60);
      } else {
        location.reload();
        router.push(CLIENT_APP_DASHBOARD_PAGE);
      }
    },
    (data) => {
      toast.error(data.message);
    },
  );

  const resendVerificationCodeMutation = useCreateMutation(
    ApiPostResendVerificationCode,
    (data) => {
      toast.success(data.message);
      setResendIn(OPT_RESEND_DELAY_DURATION_MS / 1000);
    },
    (data) => {
      toast.error(data.message);
    },
  );

  useEffect(() => {
    const intervalID = setInterval(() => {
      if (resendIn !== 0) {
        setResendIn(resendIn - 1);
      }
    }, 1000);

    return () => clearInterval(intervalID);
  }, [resendIn]);

  const handleContinueWithGoogleClick = () => {
    googleMutation.mutate();
  };

  const onSubmit = (values: SignInSchema) => {
    const body: typeof values = {
      email: values.email,
      password: values.password,
      ...(tFAEnabled ? { code: values.code } : {}),
    };

    if (tFAEnabled && !values.code) {
      toast.info("Please enter the verification code sent to your email.");
      return;
    }

    signInMutation.mutate(body);
  };

  return (
    <CardWrapperParent>
      <CardWrapper
        center
        title={tFAEnabled ? "Verify your Sign in" : "Sign in to Rona"}
      >
        {!tFAEnabled ? (
          <>
            <CustomButton
              onClick={() => handleContinueWithGoogleClick()}
              isPending={googleMutation.isPending}
              variant={"outline"}
              icon={FcGoogle}
              size={"lg"}
              className="w-full"
            >
              Continue with Google
            </CustomButton>
            <div className="flex items-center w-full gap-4">
              <span className="border-b border-border w-full flex-1" />
              <span className="text-sm text-border tracking-widest font-light">
                OR
              </span>
              <span className="border-b border-border w-full flex-1" />
            </div>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-5 w-full flex flex-col"
            >
              <FieldGroup className="gap-5">
                <Controller
                  control={form.control}
                  name="email"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="email-input">Email</FieldLabel>
                      <Input
                        {...field}
                        id="email-input"
                        aria-invalid={fieldState.invalid}
                        placeholder="email@gmail.com"
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
                      <FieldLabel htmlFor="password-input">Password</FieldLabel>
                      <PasswordInput
                        {...field}
                        id="password-input"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>
              <CustomButton
                isPending={signInMutation.isPending}
                size={"lg"}
                className="w-full"
              >
                Sign in
              </CustomButton>
            </form>
          </>
        ) : (
          <>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-5 w-full flex flex-col"
            >
              <FieldGroup className="gap-5">
                <p className="text-muted-foreground">
                  Enter the verification code we sent to your email address:
                  {"  "}
                  <span className="text-primary brightness-50">
                    {emailValue}
                  </span>
                </p>
                <Controller
                  control={form.control}
                  name="code"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <div className="flex items-center justify-between">
                        <FieldLabel htmlFor="code-input">OTP Code</FieldLabel>
                        {resendIn <= 0 ? (
                          <Button
                            disabled={
                              !!resendIn ||
                              resendVerificationCodeMutation.isPending
                            }
                            onClick={() => {
                              if (resendIn <= 0) {
                                const body: ResendVerificationCodeSchema = {
                                  email: emailValue,
                                };

                                resendVerificationCodeMutation.mutate(body);
                              }
                            }}
                            size={"sm"}
                            variant={"link"}
                            type="button"
                          >
                            <RefreshCw />
                            Resend
                          </Button>
                        ) : (
                          <p className="text-muted-foreground text-sm">
                            Resend in {resendIn}s
                          </p>
                        )}
                      </div>
                      <InputOTP {...field} maxLength={6}>
                        <InputOTPGroup className="flex w-full">
                          <InputOTPSlot className="flex-1" index={0} />
                          <InputOTPSlot className="flex-1" index={1} />
                          <InputOTPSlot className="flex-1" index={2} />
                          <InputOTPSlot className="flex-1" index={3} />
                          <InputOTPSlot className="flex-1" index={4} />
                          <InputOTPSlot className="flex-1" index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>
              <CustomButton
                isPending={signInMutation.isPending}
                size={"lg"}
                className="w-full"
              >
                Continue
              </CustomButton>
            </form>
          </>
        )}
      </CardWrapper>
    </CardWrapperParent>
  );
};

export default Client;
