-- Continue adding comprehensive demo data - KPIs and ESG responses

-- Create demo company KPIs
INSERT INTO public.company_kpis (id, tenant_id, company_id, kpi_name, kpi_value, target_value, unit, reporting_period, created_by) VALUES
  -- SolarFlow Energy KPIs
  ('k1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Carbon Emissions Reduction', 85.2, 90.0, '% reduction', 'Q4 2024', '11111111-1111-1111-1111-111111111111'),
  ('k2222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Women in Leadership', 42.0, 50.0, '% of positions', 'Q4 2024', '11111111-1111-1111-1111-111111111111'),
  ('k3333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Board Independence', 75.0, 80.0, '% independent directors', 'Q4 2024', '11111111-1111-1111-1111-111111111111'),
  -- AgroSmart Solutions KPIs
  ('k4444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c2222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Water Usage Efficiency', 92.3, 95.0, '% efficiency', 'Q4 2024', '11111111-1111-1111-1111-111111111111'),
  ('k5555555-5555-5555-5555-555555555555', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c2222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Employee Satisfaction', 88.5, 85.0, 'Score out of 100', 'Q4 2024', '11111111-1111-1111-1111-111111111111'),
  -- EduBridge Platform KPIs
  ('k6666666-6666-6666-6666-666666666666', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c3333333-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Student Engagement', 89.2, 90.0, '% active users', 'Q4 2024', '11111111-1111-1111-1111-111111111111'),
  ('k7777777-7777-7777-7777-777777777777', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c3333333-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Course Completion Rate', 78.4, 80.0, '% completion', 'Q4 2024', '11111111-1111-1111-1111-111111111111'),
  -- CleanWater Tech KPIs
  ('k8888888-8888-8888-8888-888888888888', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c4444444-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Water Purification Efficiency', 99.5, 99.0, '% contaminants removed', 'Q4 2024', '11111111-1111-1111-1111-111111111111'),
  ('k9999999-9999-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c4444444-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Community Impact', 25000, 30000, 'People served', 'Q4 2024', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO UPDATE SET
  kpi_value = EXCLUDED.kpi_value,
  target_value = EXCLUDED.target_value,
  reporting_period = EXCLUDED.reporting_period;

-- Create demo ESG responses
INSERT INTO public.esg_responses (id, tenant_id, company_id, question_id, category, subcategory, response_value, score, created_by) VALUES
  -- SolarFlow Energy ESG responses
  ('e1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ENV001', 'Environmental', 'Carbon Management', 'Comprehensive carbon reduction program with 85% reduction target achieved', 95, '11111111-1111-1111-1111-111111111111'),
  ('e2222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'SOC001', 'Social', 'Diversity & Inclusion', 'Active diversity programs with 42% women in leadership roles', 85, '11111111-1111-1111-1111-111111111111'),
  ('e3333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'GOV001', 'Governance', 'Board Structure', 'Independent board with 75% independent directors', 90, '11111111-1111-1111-1111-111111111111'),
  -- AgroSmart Solutions ESG responses
  ('e4444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c2222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ENV002', 'Environmental', 'Water Management', 'Advanced water conservation with 92% efficiency rating', 92, '11111111-1111-1111-1111-111111111111'),
  ('e5555555-5555-5555-5555-555555555555', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c2222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'SOC002', 'Social', 'Employee Wellbeing', 'Comprehensive wellbeing programs with high satisfaction scores', 88, '11111111-1111-1111-1111-111111111111'),
  -- EduBridge Platform ESG responses
  ('e6666666-6666-6666-6666-666666666666', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c3333333-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ENV003', 'Environmental', 'Digital Carbon Footprint', 'Carbon-neutral hosting and green IT practices', 88, '11111111-1111-1111-1111-111111111111'),
  ('e7777777-7777-7777-7777-777777777777', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c3333333-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'SOC003', 'Social', 'Educational Access', 'Free courses for underserved communities', 94, '11111111-1111-1111-1111-111111111111'),
  ('e8888888-8888-8888-8888-888888888888', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c3333333-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'GOV002', 'Governance', 'Data Protection', 'GDPR compliant with strong student privacy policies', 91, '11111111-1111-1111-1111-111111111111'),
  -- CleanWater Tech ESG responses
  ('e9999999-9999-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c4444444-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ENV004', 'Environmental', 'Water Conservation', 'Direct impact on clean water access and conservation', 98, '11111111-1111-1111-1111-111111111111'),
  ('e1010101-1010-1010-1010-101010101010', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c4444444-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'SOC004', 'Social', 'Community Development', 'Partnership with local communities for sustainable development', 96, '11111111-1111-1111-1111-111111111111'),
  ('e1111101-1111-1111-1111-111111111101', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c4444444-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'GOV003', 'Governance', 'Impact Measurement', 'Transparent impact reporting and third-party verification', 92, '11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO UPDATE SET
  response_value = EXCLUDED.response_value,
  score = EXCLUDED.score;

-- Create some audit logs for demo activities
INSERT INTO public.audit_logs (id, tenant_id, entity_type, entity_id, action, actor_user_id, before_snapshot, after_snapshot, ip_address, user_agent) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'portfolio_company', 'c1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'CREATE', '11111111-1111-1111-1111-111111111111', '{}', '{"name": "SolarFlow Energy", "industry": "ClimateTech"}', '192.168.1.100', 'Mozilla/5.0'),
  ('a2222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'esg_response', 'e1111111-1111-1111-1111-111111111111', 'UPDATE', '22222222-2222-2222-2222-222222222222', '{"score": 90}', '{"score": 95}', '192.168.1.101', 'Mozilla/5.0'),
  ('a3333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'fund', 'f1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'UPDATE', '11111111-1111-1111-1111-111111111111', '{"size": "$45M"}', '{"size": "$50M"}', '192.168.1.102', 'Mozilla/5.0')
ON CONFLICT (id) DO UPDATE SET
  action = EXCLUDED.action,
  before_snapshot = EXCLUDED.before_snapshot,
  after_snapshot = EXCLUDED.after_snapshot;