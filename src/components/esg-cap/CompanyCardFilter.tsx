import { Label } from "@/components/ui/label";
import { Loader2, Building2, Mail } from "lucide-react";

interface Company {
  email: string;
  companyName: string;
}

interface CompanyCardFilterProps {
  companies: Company[];
  selectedCompany: string;
  onCompanyChange: (value: string) => void;
  loading?: boolean;
}

// Color palette – each object contains Tailwind classes for different states
const colorPalette = [
  {
    name: "emerald",
    border: "border-emerald-200",
    hoverBorder: "hover:border-emerald-400",
    selectedBorder: "border-emerald-500",
    selectedBg: "bg-emerald-50",
    selectedRing: "ring-emerald-200",
    iconDefault: "text-gray-400",
    iconSelected: "text-emerald-600",
    hoverShadow: "hover:shadow-emerald-100",
  },
  {
    name: "teal",
    border: "border-teal-200",
    hoverBorder: "hover:border-teal-400",
    selectedBorder: "border-teal-500",
    selectedBg: "bg-teal-50",
    selectedRing: "ring-teal-200",
    iconDefault: "text-gray-400",
    iconSelected: "text-teal-600",
    hoverShadow: "hover:shadow-teal-100",
  },
  {
    name: "amber",
    border: "border-amber-200",
    hoverBorder: "hover:border-amber-400",
    selectedBorder: "border-amber-500",
    selectedBg: "bg-amber-50",
    selectedRing: "ring-amber-200",
    iconDefault: "text-gray-400",
    iconSelected: "text-amber-600",
    hoverShadow: "hover:shadow-amber-100",
  },
  {
    name: "purple",
    border: "border-purple-200",
    hoverBorder: "hover:border-purple-400",
    selectedBorder: "border-purple-500",
    selectedBg: "bg-purple-50",
    selectedRing: "ring-purple-200",
    iconDefault: "text-gray-400",
    iconSelected: "text-purple-600",
    hoverShadow: "hover:shadow-purple-100",
  },
  {
    name: "rose",
    border: "border-rose-200",
    hoverBorder: "hover:border-rose-400",
    selectedBorder: "border-rose-500",
    selectedBg: "bg-rose-50",
    selectedRing: "ring-rose-200",
    iconDefault: "text-gray-400",
    iconSelected: "text-rose-600",
    hoverShadow: "hover:shadow-rose-100",
  },
  {
    name: "indigo",
    border: "border-indigo-200",
    hoverBorder: "hover:border-indigo-400",
    selectedBorder: "border-indigo-500",
    selectedBg: "bg-indigo-50",
    selectedRing: "ring-indigo-200",
    iconDefault: "text-gray-400",
    iconSelected: "text-indigo-600",
    hoverShadow: "hover:shadow-indigo-100",
  },
];

export function CompanyCardFilter({
  companies,
  selectedCompany,
  onCompanyChange,
  loading = false,
}: CompanyCardFilterProps) {
  return (
    <div className="space-y-4">
      {/* <Label className="block text-base font-semibold text-gray-800">
        Filter by Company
      </Label> */}

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading companies...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {companies.map((company, index) => {
            const isSelected = selectedCompany === company.email;
            const colorScheme = colorPalette[index % colorPalette.length];
            
            return (
              <button
                key={company.email}
                type="button"
                onClick={() => onCompanyChange(company.email)}
                className={`
                  group relative flex flex-col items-start p-5 rounded-2xl border-2 
                  transition-all duration-200 ease-out text-left
                  bg-white
                  ${colorScheme.border}
                  ${!isSelected && colorScheme.hoverBorder}
                  ${!isSelected && "hover:shadow-lg hover:-translate-y-0.5"}
                  ${isSelected ? colorScheme.selectedBorder : ""}
                  ${isSelected ? colorScheme.selectedBg : ""}
                  ${isSelected ? `ring-2 ${colorScheme.selectedRing}` : ""}
                  dark:bg-gray-900 dark:border-gray-700
                `}
              >
                {/* Hover gradient overlay */}
                <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-white/50 to-transparent dark:from-white/5" />

                <div className="relative z-10 w-full">
                  <div className="flex items-start justify-between gap-2">
                    <Building2
                      className={`h-5 w-5 flex-shrink-0 transition-colors ${
                        isSelected ? colorScheme.iconSelected : colorScheme.iconDefault
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate dark:text-gray-100">
                        {company.companyName}
                      </h3>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{company.email}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}