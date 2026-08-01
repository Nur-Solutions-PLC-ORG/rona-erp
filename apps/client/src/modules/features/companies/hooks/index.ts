import { CompanyDto } from "@rona/types/admin";

export const useCompanies = () => {
  return {
    companies: [
      {
        id: "a;s",
        name: "Sample Org",
        slug: "samlsd-s",
        email: "samls@tgma.com",
        phone: "910821",
        country: "Ethiopia",
        status: "active",
        createdAt: "",
      },
    ] as CompanyDto[],
  };
};
