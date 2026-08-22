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
      info="Share these login credentials securely. The password is shown only now."
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
            <dd className="rounded-md bg-muted px-3 py-2 font-mono break-all">
              {credentials.email}
            </dd>
          </div>
          <div className="grid gap-1">
            <dt className="font-medium text-muted-foreground">Password</dt>
            <dd className="rounded-md bg-muted px-3 py-2 font-mono break-all">
              {credentials.password}
            </dd>
          </div>
        </dl>
      )}
    </DialogWrapper>
  );
};

export default UserCredentialsModal;
