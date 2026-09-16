import CustomButton from "@/components/custom/custom-button";
import DialogWrapper from "@/components/custom/dialog-wrapper";
import { useModalStore } from "@/store";
import { UserCredentialsDto } from "@rona/types/admin";

const UserCredentialsModal = () => {
  const { open, data: rawData, closeModal } = useModalStore();
  const modalData = rawData as {
    credentials?: UserCredentialsDto;
    title?: string;
  } | null;
  const credentials = modalData?.credentials;

  return (
    <DialogWrapper
      title={modalData?.title ?? "User created successfully"}
      info="A one-time password has been emailed to the user. They will be prompted to set a new password on first sign-in."
      open={open === "admin-user-credentials"}
      onOpen={() => closeModal()}
      footer={
        <CustomButton type="button" onClick={closeModal}>
          Done
        </CustomButton>
      }
    >
      {credentials && (
        <dl className="grid gap-4 text-sm">
          <div className="grid gap-1">
            <dt className="font-medium text-muted-foreground">Email</dt>
            <dd className="rounded-md bg-muted px-3 py-1 font-mono break-all">
              {credentials.email}
            </dd>
          </div>
          <p className="text-muted-foreground">
            The one-time password was sent to this email address. For security, it is not
            displayed here.
          </p>
        </dl>
      )}
    </DialogWrapper>
  );
};

export default UserCredentialsModal;
