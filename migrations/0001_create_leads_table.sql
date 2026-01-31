-- Create leads table for storing distributor and retail applications
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  city TEXT,  -- Stores combined: "State - District - PIN"
  investment_range TEXT,
  timeline TEXT,
  current_business TEXT,
  experience_years TEXT,
  outlet_count TEXT,
  notes TEXT,
  business_type TEXT DEFAULT 'distributor',  -- 'distributor' or 'retail'
  source_page TEXT DEFAULT '/distributor',
  priority TEXT DEFAULT 'high',  -- 'high', 'medium', 'low'
  status TEXT DEFAULT 'new',  -- 'new', 'contacted', 'qualified', 'converted', 'rejected'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_priority ON leads(priority);
CREATE INDEX IF NOT EXISTS idx_leads_business_type ON leads(business_type);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
