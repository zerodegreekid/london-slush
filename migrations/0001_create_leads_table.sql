-- Leads table with comprehensive fields
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  whatsapp TEXT,
  business_type TEXT,
  city TEXT,
  state TEXT,
  investment_range TEXT,
  timeline TEXT,
  experience_years INTEGER,
  current_business TEXT,
  outlet_count TEXT,
  lead_score INTEGER DEFAULT 50,
  status TEXT DEFAULT 'new',
  priority TEXT DEFAULT 'medium',
  source_page TEXT,
  utm_source TEXT,
  utm_campaign TEXT,
  utm_medium TEXT,
  referrer TEXT,
  form_completion_time INTEGER,
  page_views_before_submit INTEGER,
  notes TEXT,
  assigned_to TEXT,
  next_follow_up DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_contacted DATETIME
);

-- Form submissions table (backup)
CREATE TABLE IF NOT EXISTS form_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  form_type TEXT NOT NULL,
  form_data TEXT NOT NULL,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT,
  user_agent TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_priority ON leads(priority);
