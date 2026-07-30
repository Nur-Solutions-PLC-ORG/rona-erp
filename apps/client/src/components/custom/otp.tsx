import { InputOTP, InputOTPGroup, InputOTPSlot } from "../ui/input-otp";

interface Props {
  name: string;
  length?: number;
  disabled?: boolean;
  value?: string;
  onChange: (value: string) => void;
}

const OTP = ({ length = 6, ...props }: Props) => {
  return (
    <InputOTP {...props} maxLength={length}>
      <InputOTPGroup className="flex w-full">
        {Array.from({ length }).map((_, i) => (
          <InputOTPSlot key={"key" + i} className="flex-1" index={i} />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );
};
export default OTP;
