-- Create comprehensive demo data (excluding auth-dependent user profiles for now)

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
  ('fund1aaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Green Tech Fund I', '$50M', 'USD', 'Series A', ARRAY['ClimateTech', 'AgriTech'], ARRAY['Sustainable Development', 'Planet Positive'], ARRAY['Mining', 'Alcohol', 'Arms'], '11111111-1111-1111-1111-111111111111'),
  ('fund2aaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Sustainable Growth Fund', '$100M', 'USD', 'Series B and above', ARRAY['AgriTech', 'HealthTech'], ARRAY['Quality Education', 'Healthcare', 'SDGs'], ARRAY['Weapons', 'Mining'], '11111111-1111-1111-1111-111111111111'),
  ('fund3aaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Impact Ventures', '$25M', 'USD', 'Seed', ARRAY['EdTech', 'FinTech'], ARRAY['Quality Education', 'Upskilling'], ARRAY['Politics', 'Arms'], '11111111-1111-1111-1111-111111111111'),
  -- VC Partners funds (will be assigned to new admin once created)
  ('fund1bbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Tech Innovation Fund', '$200M', 'USD', 'Series A to C', ARRAY['AI/ML', 'Cybersecurity', 'SaaS'], ARRAY['Innovation', 'Scalability'], ARRAY['Gambling', 'Tobacco'], NULL),
  ('fund2bbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Healthcare Ventures', '$150M', 'USD', 'Series B+', ARRAY['Biotech', 'MedTech', 'Digital Health'], ARRAY['Patient Care', 'Medical Innovation'], ARRAY['Animal Testing', 'Controversial Research'], NULL),
  ('fund3bbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Fintech Pioneer Fund', '$75M', 'USD', 'Seed to Series A', ARRAY['Fintech', 'Blockchain', 'Payments'], ARRAY['Financial Inclusion', 'Innovation'], ARRAY['Cryptocurrency Mining', 'Predatory Lending'], NULL)
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
  ('comp1aaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'fund1aaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'SolarFlow Energy', 'Revolutionary solar panel technology with 40% efficiency', 'ClimateTech', 'Series A', 2019, 45, 'San Francisco, CA', 'https://solarflow.com', 25000000, 5000000, 20.0, 92.5, '11111111-1111-1111-1111-111111111111'),
  ('comp2aaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'fund1aaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'AgroSmart Solutions', 'AI-powered precision agriculture platform', 'AgriTech', 'Series A', 2020, 32, 'Austin, TX', 'https://agrosmart.com', 18000000, 3500000, 19.4, 88.7, '11111111-1111-1111-1111-111111111111'),
  ('comp3aaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'fund2aaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'EduBridge Platform', 'Online education platform for underserved communities', 'EdTech', 'Series B', 2018, 78, 'Boston, MA', 'https://edubridge.com', 45000000, 8000000, 17.8, 91.2, '11111111-1111-1111-1111-111111111111'),
  ('comp4aaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'fund3aaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'CleanWater Tech', 'Water purification systems for developing regions', 'CleanTech', 'Seed', 2021, 15, 'Seattle, WA', 'https://cleanwatertech.com', 8000000, 2000000, 25.0, 94.8, '11111111-1111-1111-1111-111111111111'),
  -- VC Partners companies (will be assigned proper created_by once users exist)
  ('comp1bbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'fund1bbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'CyberShield AI', 'Next-generation cybersecurity using machine learning', 'Cybersecurity', 'Series B', 2019, 125, 'Palo Alto, CA', 'https://cybershield.ai', 85000000, 15000000, 17.6, 78.3, NULL),
  ('comp2bbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'fund1bbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'DataFlow Analytics', 'Real-time data processing and analytics platform', 'SaaS', 'Series A', 2020, 68, 'New York, NY', 'https://dataflow.com', 42000000, 8000000, 19.0, 82.1, NULL),
  ('comp3bbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'fund2bbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'BioGenetic Therapeutics', 'Gene therapy solutions for rare diseases', 'Biotech', 'Series C', 2017, 156, 'Cambridge, MA', 'https://biogenetic.com', 120000000, 25000000, 20.8, 89.4, NULL),
  ('comp4bbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'fund3bbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'PayFlow Solutions', 'Cross-border payment platform for emerging markets', 'Fintech', 'Series A', 2021, 43, 'Miami, FL', 'https://payflow.com', 28000000, 6000000, 21.4, 85.6, NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  stage = EXCLUDED.stage,
  valuation = EXCLUDED.valuation,
  investment_amount = EXCLUDED.investment_amount,
  equity_percentage = EXCLUDED.equity_percentage,
  esg_score = EXCLUDED.esg_score;

-- Create demo company KPIs
INSERT INTO public.company_kpis (id, tenant_id, company_id, kpi_name, kpi_value, target_value, unit, reporting_period, created_by) VALUES
  -- SolarFlow Energy KPIs
  ('kpi1comp1a-aaaa-aaaa-aaaa-aaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'comp1aaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Carbon Emissions Reduction', 85.2, 90.0, '% reduction', 'Q4 2024', '11111111-1111-1111-1111-111111111111'),
  ('kpi2comp1a-aaaa-aaaa-aaaa-aaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'comp1aaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Women in Leadership', 42.0, 50.0, '% of positions', 'Q4 2024', '11111111-1111-1111-1111-111111111111'),
  ('kpi3comp1a-aaaa-aaaa-aaaa-aaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'comp1aaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Board Independence', 75.0, 80.0, '% independent directors', 'Q4 2024', '11111111-1111-1111-1111-111111111111'),
  -- AgroSmart Solutions KPIs
  ('kpi1comp2a-aaaa-aaaa-aaaa-aaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'comp2aaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Water Usage Efficiency', 92.3, 95.0, '% efficiency', 'Q4 2024', '11111111-1111-1111-1111-111111111111'),
  ('kpi2comp2a-aaaa-aaaa-aaaa-aaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'comp2aaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Employee Satisfaction', 88.5, 85.0, 'Score out of 100', 'Q4 2024', '11111111-1111-1111-1111-111111111111'),
  -- EduBridge Platform KPIs
  ('kpi1comp3a-aaaa-aaaa-aaaa-aaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'comp3aaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Student Engagement', 89.2, 90.0, '% active users', 'Q4 2024', '11111111-1111-1111-1111-111111111111'),
  ('kpi2comp3a-aaaa-aaaa-aaaa-aaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'comp3aaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Course Completion Rate', 78.4, 80.0, '% completion', 'Q4 2024', '11111111-1111-1111-1111-111111111111'),
  -- CleanWater Tech KPIs
  ('kpi1comp4a-aaaa-aaaa-aaaa-aaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'comp4aaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Water Purification Efficiency', 99.5, 99.0, '% contaminants removed', 'Q4 2024', '11111111-1111-1111-1111-111111111111'),
  ('kpi2comp4a-aaaa-aaaa-aaaa-aaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'comp4aaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Community Impact', 25000, 30000, 'People served', 'Q4 2024', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO UPDATE SET
  kpi_value = EXCLUDED.kpi_value,
  target_value = EXCLUDED.target_value,
  reporting_period = EXCLUDED.reporting_period;

-- Create demo ESG responses
INSERT INTO public.esg_responses (id, tenant_id, company_id, question_id, category, subcategory, response_value, score, created_by) VALUES
  -- SolarFlow Energy ESG responses
  ('esg1comp1a-aaaa-aaaa-aaaa-aaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'comp1aaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ENV001', 'Environmental', 'Carbon Management', 'Comprehensive carbon reduction program with 85% reduction target achieved', 95, '11111111-1111-1111-1111-111111111111'),
  ('esg2comp1a-aaaa-aaaa-aaaa-aaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'comp1aaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'SOC001', 'Social', 'Diversity & Inclusion', 'Active diversity programs with 42% women in leadership roles', 85, '11111111-1111-1111-1111-111111111111'),
  ('esg3comp1a-aaaa-aaaa-aaaa-aaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'comp1aaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'GOV001', 'Governance', 'Board Structure', 'Independent board with 75% independent directors', 90, '11111111-1111-1111-1111-111111111111'),
  -- AgroSmart Solutions ESG responses
  ('esg1comp2a-aaaa-aaaa-aaaa-aaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'comp2aaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ENV002', 'Environmental', 'Water Management', 'Advanced water conservation with 92% efficiency rating', 92, '11111111-1111-1111-1111-111111111111'),
  ('esg2comp2a-aaaa-aaaa-aaaa-aaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'comp2aaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'SOC002', 'Social', 'Employee Wellbeing', 'Comprehensive wellbeing programs with high satisfaction scores', 88, '11111111-1111-1111-1111-111111111111'),
  -- EduBridge Platform ESG responses
  ('esg1comp3a-aaaa-aaaa-aaaa-aaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'comp3aaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ENV003', 'Environmental', 'Digital Carbon Footprint', 'Carbon-neutral hosting and green IT practices', 88, '11111111-1111-1111-1111-111111111111'),
  ('esg2comp3a-aaaa-aaaa-aaaa-aaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'comp3aaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'SOC003', 'Social', 'Educational Access', 'Free courses for underserved communities', 94, '11111111-1111-1111-1111-111111111111'),
  ('esg3comp3a-aaaa-aaaa-aaaa-aaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'comp3aaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'GOV002', 'Governance', 'Data Protection', 'GDPR compliant with strong student privacy policies', 91, '11111111-1111-1111-1111-111111111111'),
  -- CleanWater Tech ESG responses
  ('esg1comp4a-aaaa-aaaa-aaaa-aaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'comp4aaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ENV004', 'Environmental', 'Water Conservation', 'Direct impact on clean water access and conservation', 98, '11111111-1111-1111-1111-111111111111'),
  ('esg2comp4a-aaaa-aaaa-aaaa-aaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'comp4aaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'SOC004', 'Social', 'Community Development', 'Partnership with local communities for sustainable development', 96, '11111111-1111-1111-1111-111111111111'),
  ('esg3comp4a-aaaa-aaaa-aaaa-aaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'comp4aaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'GOV003', 'Governance', 'Impact Measurement', 'Transparent impact reporting and third-party verification', 92, '11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO UPDATE SET
  response_value = EXCLUDED.response_value,
  score = EXCLUDED.score;