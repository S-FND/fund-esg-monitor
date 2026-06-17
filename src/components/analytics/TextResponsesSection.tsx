import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, FileText, Users, ExternalLink } from 'lucide-react';
import { CompanyRawMetrics } from '@/hooks/useAnalyticsDashboardData';
import { FEATURE_FIELD_MAPPINGS } from '@/lib/featureFieldMapping';

interface TextResponsesSectionProps {
  featureKey: string;
  companyRawData: CompanyRawMetrics[];
  onDrillDown?: (title: string, companyData: { brand: string; companyName: string; industry: string; value: string; col1?: string }[], isPct: boolean) => void;
  /** Additional feature keys whose additional_comments should also be collected */
  additionalCommentKeys?: string[];
}

interface TextEntry {
  brand: string;
  companyName: string;
  industry: string;
  fieldLabel: string;
  value: string;
}

// Features that should NOT show the "Text Field Responses" card
const HIDE_TEXT_FIELD_CARD_FEATURES = new Set([
  'businessInformation',
  'social',
]);

const isCategoricalFieldId = (fieldId: string): boolean => {
  return fieldId === 'list' || fieldId.includes('_size') || fieldId.includes('_dei_factors') || 
    fieldId.includes('_impact') || fieldId.includes('description') ||
    fieldId.includes('_list') || fieldId.includes('_names') || 
    fieldId.includes('_validity') || fieldId.includes('weblinks') ||
    fieldId.includes('_note') || fieldId.includes('classification') ||
    fieldId.includes('partner_name') || fieldId.includes('_comments') ||
    fieldId.includes('last_update') || fieldId.includes('_initiatives') ||
    fieldId.includes('approach_vision');
};

// Map featureKey to allowed KPI key prefixes for approach_vision wildcard scan
const FEATURE_KPI_PREFIXES: Record<string, string[]> = {
  primarySecondaryPackaging: ['food_pkg_', 'packaging_'],
  fashionMaterials: ['fashion_'],
  incidentLog: ['incident_'],
  healthCare: ['healthcare_'],
  waterManagement: ['water_', 'energy_'],
  wasteManagement: ['waste_'],
  sourcingFulfillment: ['vendor_', 'supplier_', 'logistics_', 'sourcing_'],
  governancePolicies: ['policy_', 'governance_'],
  csr: ['csr_'],
  operations: ['operations_'],
  certifications: ['cert_', 'certification_'],
  productServiceCertifications: ['founder_', 'media_', 'patent_', 'awards_'],
  sri: ['sri_', 'beneficiar', 'jobs_', 'enterprise_'],
};

/** Try to parse a JSON value and format it as human-readable text */
const formatJsonValue = (raw: string): string => {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const formatted = parsed.map((item: any, i: number) => {
        if (typeof item === 'string') return `${i + 1}. ${item}`;
        if (typeof item !== 'object' || item === null) return null;
        // Handle objects with common keys
        const parts: string[] = [];
        if (item.title?.trim()) parts.push(item.title.trim());
        if (item.description?.trim()) parts.push(item.description.trim());
        if (item.impact?.trim()) parts.push(`Impact: ${item.impact.trim()}`);
        if (item.link?.trim()) parts.push(`Link: ${item.link.trim()}`);
        if (item.source?.trim()) parts.push(`Source: ${item.source.trim()}`);
        if (item.name?.trim()) parts.push(item.name.trim());
        // Fallback: gather ALL string values from the object (skip 'id' keys)
        if (parts.length === 0) {
          Object.entries(item).forEach(([k, v]) => {
            if (k === 'id' || typeof v !== 'string' || !v.trim()) return;
            const label = k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()).trim();
            parts.push(`${label}: ${v.trim()}`);
          });
        }
        if (parts.length === 0) return null;
        return `${i + 1}. ${parts.join(' — ')}`;
      }).filter(Boolean);
      if (formatted.length > 0) return formatted.join('\n');
      // If array had items but none were formattable, return raw
      return raw;
    }
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      const parts = Object.entries(parsed)
        .filter(([, v]) => v && typeof v !== 'object' && String(v).trim())
        .map(([k, v]) => `${k}: ${v}`);
      if (parts.length > 0) return parts.join('; ');
    }
  } catch {
    // Not JSON, return as-is
  }
  return raw;
};

export const TextResponsesSection = ({ featureKey, companyRawData, onDrillDown, additionalCommentKeys }: TextResponsesSectionProps) => {
  const mapping = FEATURE_FIELD_MAPPINGS[featureKey];
  const hideTextFieldCard = HIDE_TEXT_FIELD_CARD_FEATURES.has(featureKey);

  const { textEntries, additionalComments, textFieldCount } = useMemo(() => {
    const entries: TextEntry[] = [];
    const comments: { brand: string; companyName: string; industry: string; value: string }[] = [];
    const textFieldIds = new Set<string>();

    // Collect additional comments for this feature
    const commentKeys = [`${featureKey}_additional_comments`];
    if (additionalCommentKeys) {
      additionalCommentKeys.forEach(k => commentKeys.push(`${k}_additional_comments`));
    }
    
    companyRawData.forEach(company => {
      commentKeys.forEach(commentsKey => {
        const commentVal = company.kpis[commentsKey];
        if (commentVal && commentVal.trim()) {
          // Avoid duplicate comments for same company
          if (!comments.some(c => c.brand === company.brand && c.value === commentVal.trim())) {
            comments.push({ brand: company.brand, companyName: company.companyName, industry: company.industry, value: commentVal.trim() });
          }
        }
      });
    });

    // Collect text/categorical field responses from the feature mapping
    if (mapping) {
      mapping.kpis.forEach(kpi => {
        kpi.fields.forEach(field => {
          if (!isCategoricalFieldId(field.id)) return;
          if (field.id.endsWith('_additional_comments')) return;

          companyRawData.forEach(company => {
            const possibleKeys = [
              field.id,
              `${kpi.id}_${field.id}`,
              `${featureKey}_${kpi.id}_${field.id}`,
            ];
            let rawValue = '';
            for (const key of possibleKeys) {
              if (company.kpis[key] && company.kpis[key].trim()) {
                rawValue = company.kpis[key].trim();
                break;
              }
            }
            if (!rawValue) {
              const matchingKey = Object.keys(company.kpis).find(k =>
                k.includes(field.id) && company.kpis[k]?.trim()
              );
              if (matchingKey) rawValue = company.kpis[matchingKey].trim();
            }

            if (rawValue && rawValue.toLowerCase() !== 'n/a' && rawValue !== '0') {
              textFieldIds.add(field.id);
              // Format JSON values as readable text
              const displayValue = formatJsonValue(rawValue);
              entries.push({
                brand: company.brand,
                companyName: company.companyName,
                industry: company.industry,
                fieldLabel: `${kpi.label} — ${field.label}`,
                value: displayValue,
              });
            }
          });
        });
      });
    }

    // Also scan for approach/vision text fields stored directly in kpis
    // Only include those that match the current feature's KPI prefix
    const allowedPrefixes = FEATURE_KPI_PREFIXES[featureKey] || [];
    companyRawData.forEach(company => {
      Object.entries(company.kpis).forEach(([key, val]) => {
        if (!val || !val.trim()) return;
        if (!key.includes('approach_vision')) return;
        if (textFieldIds.has(key)) return;
        if (!isNaN(parseFloat(val)) && val.trim().length < 10) return;
        // Only include if the key matches the current feature's prefix
        if (allowedPrefixes.length > 0 && !allowedPrefixes.some(prefix => key.startsWith(prefix))) return;
        textFieldIds.add(key);
        entries.push({
          brand: company.brand,
          companyName: company.companyName,
          industry: company.industry,
          fieldLabel: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          value: val.trim(),
        });
      });
    });

    return { textEntries: entries, additionalComments: comments, textFieldCount: textFieldIds.size };
  }, [featureKey, companyRawData, mapping, additionalCommentKeys]);

  const showTextCard = !hideTextFieldCard && textEntries.length > 0;
  const totalCount = (showTextCard ? textEntries.length : 0) + additionalComments.length;
  if (totalCount === 0) return null;

  const handleCommentsClick = () => {
    if (!onDrillDown) return;
    const drillData = additionalComments.map(c => ({
      brand: c.brand,
      companyName: c.companyName,
      industry: c.industry,
      value: c.value,
    }));
    onDrillDown('Additional Comments', drillData, false);
  };

  const handleTextFieldsClick = () => {
    if (!onDrillDown) return;

    // Group certification _names and _validity entries into paired rows
    const pairedMap = new Map<string, { nameEntry?: TextEntry; validityEntry?: TextEntry }>();
    const nonPairedEntries: TextEntry[] = [];

    textEntries.forEach(e => {
      // Check if this is a certification names or validity field
      const namesMatch = e.fieldLabel.match(/^(.+ — .+) — Names$/);
      const validityMatch = e.fieldLabel.match(/^(.+ — .+) — Validity$/);
      if (namesMatch) {
        const pairKey = `${e.brand}::${namesMatch[1]}`;
        const existing = pairedMap.get(pairKey) || {};
        existing.nameEntry = e;
        pairedMap.set(pairKey, existing);
      } else if (validityMatch) {
        const pairKey = `${e.brand}::${validityMatch[1]}`;
        const existing = pairedMap.get(pairKey) || {};
        existing.validityEntry = e;
        pairedMap.set(pairKey, existing);
      } else {
        nonPairedEntries.push(e);
      }
    });

    const drillData: { brand: string; companyName: string; industry: string; value: string; col1?: string; col2?: string }[] = [];

    // Add paired certification entries (names + validity in same row)
    pairedMap.forEach((pair) => {
      const entry = pair.nameEntry || pair.validityEntry!;
      const baseLabel = entry.fieldLabel.replace(/ — (Names|Validity)$/, '');
      drillData.push({
        brand: entry.brand,
        companyName: entry.companyName,
        industry: entry.industry,
        value: pair.nameEntry?.value || '—',
        col1: baseLabel,
        col2: pair.validityEntry?.value || '—',
      });
    });

    // Add non-paired entries
    nonPairedEntries.forEach(e => {
      drillData.push({
        brand: e.brand,
        companyName: e.companyName,
        industry: e.industry,
        value: e.value,
        col1: e.fieldLabel,
      });
    });

    onDrillDown('Text Field Responses', drillData, false);
  };

  return (
    <section className="mt-6">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="w-5 h-5 text-primary" />
        <h2 className="text-base font-semibold">Text Responses & Additional Comments</h2>
        <Badge variant="secondary" className="text-xs">
          <FileText className="w-3 h-3 mr-1" />
          {totalCount} responses
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {additionalComments.length > 0 && (
          <Card 
            className="hover:shadow-md transition-shadow cursor-pointer group"
            onClick={handleCommentsClick}
          >
            <CardContent className="pt-3 pb-2">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] text-muted-foreground leading-tight flex-1">Additional Comments</p>
                <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0" />
              </div>
              <p className="text-lg font-bold">{additionalComments.length}</p>
              <p className="text-[10px] text-muted-foreground">
                <Users className="w-3 h-3 inline mr-0.5" />
                companies responded
              </p>
            </CardContent>
          </Card>
        )}
        {showTextCard && (
          <Card 
            className="hover:shadow-md transition-shadow cursor-pointer group"
            onClick={handleTextFieldsClick}
          >
            <CardContent className="pt-3 pb-2">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] text-muted-foreground leading-tight flex-1">Text Field Responses</p>
                <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0" />
              </div>
              <p className="text-lg font-bold">{textEntries.length}</p>
              <p className="text-[10px] text-muted-foreground">
                across {textFieldCount} fields
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
};
