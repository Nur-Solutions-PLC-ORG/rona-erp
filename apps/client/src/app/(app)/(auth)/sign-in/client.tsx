"use client";

import { ApiGetGoogleUrl } from "@/api";
import CardWrapper from "@/components/custom/card-wrapper";
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
import { useCreateMutation } from "@/hooks/utils";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { FcGoogle } from "react-icons/fc";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { OPT_RESEND_DELAY_DURATION_MS } from "@rona/config/server";

const Client = () => {
  const router = useRouter();

  const showTFATab = true;
  const [resendIn, setResendIn] = useState(5);

  const googleMutation = useCreateMutation(ApiGetGoogleUrl, (data) => {
    if (data.success && data.data) {
      router.push(data.data);
    } else {
      router.push("#");
    }
  });

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

  const form = useForm();

  const onSubmit = () => {};

  return (
    <CardWrapper
      center
      title={showTFATab ? "Verify your Sign in" : "Sign in to Rona"}
    >
      {!showTFATab ? (
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
            <Button size={"lg"} className="w-full">
              Sign in
            </Button>
          </form>
        </>
      ) : (
        <>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5 w-full flex flex-col"
          >
            <FieldGroup className="gap-5">
              <p className="">
                Enter the verification code we sent to your email address:{"  "}
                <span className="text-primary brightness-50">
                  {"youremail@gmail.com"}
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
                          disabled={!!resendIn}
                          onClick={() =>
                            setResendIn(OPT_RESEND_DELAY_DURATION_MS)
                          }
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
            <Button size={"lg"} className="w-full">
              Continue
            </Button>
          </form>
        </>
      )}
    </CardWrapper>
  );
};

export default Client;
