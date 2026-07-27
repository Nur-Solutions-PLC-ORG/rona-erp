"use client";

import CardWrapper from "@/components/custom/card-wrapper";
import CustomButton from "@/components/custom/custom-button";
import PasswordInput from "@/components/custom/password-input";
import { FaGoogle } from "react-icons/fa";

const Client = () => {
  const handleContinueWithGoogleClick = () => {};
  const isPending = false;

  return (
    <CardWrapper
      center
      title="Sign in to Rona"
      description="Use your login credentials to login to your account"
      footer={
        <>
          <CustomButton
            onClick={() => handleContinueWithGoogleClick()}
            isPending={isPending}
            size={"lg"}
            className="w-full"
            variant={"outline"}
            icon={FaGoogle}
          >
            Continue with Google
          </CustomButton>
        </>
      }
    >
      <PasswordInput />
    </CardWrapper>
  );
};

export default Client;
