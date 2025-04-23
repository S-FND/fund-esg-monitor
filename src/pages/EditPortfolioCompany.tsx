
import { useParams } from "react-router-dom";
import { portfolioCompanies } from "@/features/edit-portfolio-company/portfolioCompanies";
import CompanyNotFound from "@/features/edit-portfolio-company/CompanyNotFound";
import EditCompanyForm from "@/features/edit-portfolio-company/EditCompanyForm";

export default function EditPortfolioCompany() {
  const { id } = useParams();
  const company = portfolioCompanies.find(
    (company) => company.id.toString() === id
  );

  if (!company) {
    return <CompanyNotFound />;
  }

  return <EditCompanyForm company={company} />;
}
