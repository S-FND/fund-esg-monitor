-- Create comprehensive demo data with proper UUIDs

-- Create second tenant
INSERT INTO public.tenants (id, name, description, settings) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Venture Capital Partners', 'Leading VC firm focused on tech startups', '{"theme": "blue", "notifications": true}')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  settings = EXCLUDED.settings;

-- Update first tenant with proper ID and settings
INSERT INTO public.tenants (id, name, description, settings) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Fandoro Capital', 'Sustainable investment fund focusing on ESG', '{"theme": "green", "notifications": true}')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  settings = EXCLUDED.settings;

-- Update existing profiles with proper tenant_id
UPDATE public.profiles SET tenant_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' 
WHERE tenant_id IS NULL OR tenant_id != 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- Create demo funds for both tenants
INSERT INTO public.funds (id, tenant_id, name, size, currency, stage, sectors, inclusion_terms, exclusion_terms, created_by) VALUES
  -- Fandoro Capital funds (using existing user)
  ('f1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Green Tech Fund I', '$50M', 'USD', 'Series A', ARRAY['ClimateTech', 'AgriTech'], ARRAY['Sustainable Development', 'Planet Positive'], ARRAY['Mining', 'Alcohol', 'Arms'], '11111111-1111-1111-1111-111111111111'),
  ('f2222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Sustainable Growth Fund', '$100M', 'USD', 'Series B and above', ARRAY['AgriTech', 'HealthTech'], ARRAY['Quality Education', 'Healthcare', 'SDGs'], ARRAY['Weapons', 'Mining'], '11111111-1111-1111-1111-111111111111'),
  ('f3333333-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Impact Ventures', '$25M', 'USD', 'Seed', ARRAY['EdTech', 'FinTech'], ARRAY['Quality Education', 'Upskilling'], ARRAY['Politics', 'Arms'], '11111111-1111-1111-1111-111111111111'),
  -- VC Partners funds (will be assigned to new admin once created)
  ('f4444444-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Tech Innovation Fund', '$200M', 'USD', 'Series A to C', ARRAY['AI/ML', 'Cybersecurity', 'SaaS'], ARRAY['Innovation', 'Scalability'], ARRAY['Gambling', 'Tobacco'], NULL),
  ('f5555555-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Healthcare Ventures', '$150M', 'USD', 'Series B+', ARRAY['Biotech', 'MedTech', 'Digital Health'], ARRAY['Patient Care', 'Medical Innovation'], ARRAY['Animal Testing', 'Controversial Research'], NULL),
  ('f6666666-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Fintech Pioneer Fund', '$75M', 'USD', 'Seed to Series A', ARRAY['Fintech', 'Blockchain', 'Payments'], ARRAY['Financial Inclusion', 'Innovation'], ARRAY['Cryptocurrency Mining', 'Predatory Lending'], NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  size = EXCLUDED.size,
  currency = EXCLUDED.currency,
  stage = EXCLUDED.stage,
  sectors = EXCLUDED.sectors,
  inclusion_terms = EXCLUDED.inclusion_terms,
  exclusion_terms = EXCLUDED.exclusion_terms;

-- Create demo portfolio companies
INSERT INTO public.portfolio_companies (id, tenant_id, fund_id, name, description, industry, stage, founded_year, employee_count, headquarters, website, valuation, investment_amount, equity_percentage, esg_score, created_by) VALUES
  -- Fandoro Capital companies
  ('c1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'f1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'SolarFlow Energy', 'Revolutionary solar panel technology with 40% efficiency', 'ClimateTech', 'Series A', 2019, 45, 'San Francisco, CA', 'https://solarflow.com', 25000000, 5000000, 20.0, 92.5, '11111111-1111-1111-1111-111111111111'),
  ('c2222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'f1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'AgroSmart Solutions', 'AI-powered precision agriculture platform', 'AgriTech', 'Series A', 2020, 32, 'Austin, TX', 'https://agrosmart.com', 18000000, 3500000, 19.4, 88.7, '11111111-1111-1111-1111-111111111111'),
  ('c3333333-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'f2222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'EduBridge Platform', 'Online education platform for underserved communities', 'EdTech', 'Series B', 2018, 78, 'Boston, MA', 'https://edubridge.com', 45000000, 8000000, 17.8, 91.2, '11111111-1111-1111-1111-111111111111'),
  ('c4444444-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'f3333333-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'CleanWater Tech', 'Water purification systems for developing regions', 'CleanTech', 'Seed', 2021, 15, 'Seattle, WA', 'https://cleanwatertech.com', 8000000, 2000000, 25.0, 94.8, '11111111-1111-1111-1111-111111111111'),
  -- VC Partners companies (will be assigned proper created_by once users exist)
  ('c5555555-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'f4444444-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'CyberShield AI', 'Next-generation cybersecurity using machine learning', 'Cybersecurity', 'Series B', 2019, 125, 'Palo Alto, CA', 'https://cybershield.ai', 85000000, 15000000, 17.6, 78.3, NULL),
  ('c6666666-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'f4444444-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'DataFlow Analytics', 'Real-time data processing and analytics platform', 'SaaS', 'Series A', 2020, 68, 'New York, NY', 'https://dataflow.com', 42000000, 8000000, 19.0, 82.1, NULL),
  ('c7777777-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'f5555555-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'BioGenetic Therapeutics', 'Gene therapy solutions for rare diseases', 'Biotech', 'Series C', 2017, 156, 'Cambridge, MA', 'https://biogenetic.com', 120000000, 25000000, 20.8, 89.4, NULL),
  ('c8888888-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'f6666666-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'PayFlow Solutions', 'Cross-border payment platform for emerging markets', 'Fintech', 'Series A', 2021, 43, 'Miami, FL', 'https://payflow.com', 28000000, 6000000, 21.4, 85.6, NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  stage = EXCLUDED.stage,
  valuation = EXCLUDED.valuation,
  investment_amount = EXCLUDED.investment_amount,
  equity_percentage = EXCLUDED.equity_percentage,
  esg_score = EXCLUDED.esg_score;