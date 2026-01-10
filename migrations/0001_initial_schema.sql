-- Leads table with intelligent segmentation
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Contact Information
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  whatsapp TEXT,
  
  -- Business Context
  business_type TEXT NOT NULL CHECK(business_type IN ('franchise', 'retail', 'distributor', 'investor')),
  city TEXT NOT NULL,
  state TEXT,
  
  -- Qualification Data
  investment_range TEXT NOT NULL,
  timeline TEXT NOT NULL CHECK(timeline IN ('0-30', '30-60', '60-90', '90+')),
  
  -- Business Details (optional, depends on type)
  current_business TEXT,
  outlet_count INTEGER DEFAULT 0,
  experience_years INTEGER DEFAULT 0,
  
  -- Lead Scoring & Status
  lead_score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'new' CHECK(status IN ('new', 'contacted', 'qualified', 'converted', 'rejected')),
  priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'hot')),
  
  -- Source Tracking
  source_page TEXT NOT NULL,
  utm_source TEXT,
  utm_campaign TEXT,
  utm_medium TEXT,
  referrer TEXT,
  
  -- Engagement Data
  form_completion_time INTEGER, -- in seconds
  page_views_before_submit INTEGER DEFAULT 1,
  
  -- Notes & Follow-up
  notes TEXT,
  assigned_to TEXT,
  next_follow_up DATETIME,
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_contacted DATETIME
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_business_type ON leads(business_type);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_priority ON leads(priority);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_city ON leads(city);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);

-- Form submissions tracking (for analytics)
CREATE TABLE IF NOT EXISTS form_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER,
  form_type TEXT NOT NULL,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT,
  user_agent TEXT,
  conversion_path TEXT, -- JSON array of pages visited
  FOREIGN KEY (lead_id) REFERENCES leads(id)
);

CREATE INDEX IF NOT EXISTS idx_submissions_lead_id ON form_submissions(lead_id);
CREATE INDEX IF NOT EXISTS idx_submissions_form_type ON form_submissions(form_type);
