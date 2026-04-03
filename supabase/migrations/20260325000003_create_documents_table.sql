-- Create Documents Table and Related Tables
-- Migration: 20260325000003

-- Create Storage Bucket (Private)
-- Note: Security policies are created below
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Bucket Policies for documents bucket
-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow INSERT (upload files)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow upload to documents bucket' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Allow upload to documents bucket"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'documents');
  END IF;
END $$;

-- Policy: Allow SELECT (read/download files)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow read from documents bucket' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Allow read from documents bucket"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'documents');
  END IF;
END $$;

-- Policy: Allow UPDATE (modify file metadata)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow update in documents bucket' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Allow update in documents bucket"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'documents')
    WITH CHECK (bucket_id = 'documents');
  END IF;
END $$;

-- Policy: Allow DELETE (remove files)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow delete from documents bucket' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Allow delete from documents bucket"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'documents');
  END IF;
END $$;

-- Create document_types enum table
CREATE TABLE IF NOT EXISTS document_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create document_categories enum table
CREATE TABLE IF NOT EXISTS document_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create document_statuses enum table
CREATE TABLE IF NOT EXISTS document_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  category VARCHAR(100) NOT NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  investor_id UUID REFERENCES investors(id) ON DELETE SET NULL,
  file_url VARCHAR(500),
  file_size VARCHAR(50),
  file_type VARCHAR(50),
  uploaded_by VARCHAR(255),
  upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) NOT NULL,
  notify_investor BOOLEAN DEFAULT false,
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255)
);

-- Insert default document types
INSERT INTO document_types (name, description) VALUES
  ('Offering', 'Offering memorandum documents'),
  ('Agreement', 'Legal agreements and contracts'),
  ('Appraisal', 'Property appraisal reports'),
  ('Report', 'Financial and performance reports'),
  ('Other', 'Other document types')
ON CONFLICT (name) DO NOTHING;

-- Insert default document categories
INSERT INTO document_categories (name, description) VALUES
  ('Deal Documents', 'Documents related to specific deals'),
  ('Investor Documents', 'Documents for investor agreements'),
  ('Reports', 'Financial and operational reports'),
  ('Legal Documents', 'Legal and compliance documents'),
  ('Other', 'Other category')
ON CONFLICT (name) DO NOTHING;

-- Insert default document statuses
INSERT INTO document_statuses (name, description) VALUES
  ('Draft', 'Document is in draft stage'),
  ('Published', 'Document is published'),
  ('Signed', 'Document has been signed'),
  ('Archived', 'Document has been archived'),
  ('Pending Review', 'Awaiting review')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_documents_document_id ON documents(document_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_deal_id ON documents(deal_id);
CREATE INDEX IF NOT EXISTS idx_documents_investor_id ON documents(investor_id);
CREATE INDEX IF NOT EXISTS idx_documents_upload_date ON documents(upload_date DESC);
CREATE INDEX IF NOT EXISTS idx_documents_search ON documents USING GIN (tags);

-- Enable RLS
ALTER TABLE document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for Development (permissive)
-- Allow read access for all
CREATE POLICY "Enable read access for all users" ON documents
  FOR SELECT
  USING (true);

CREATE POLICY "Enable read access for all users - document_types" ON document_types
  FOR SELECT
  USING (true);

CREATE POLICY "Enable read access for all users - document_categories" ON document_categories
  FOR SELECT
  USING (true);

CREATE POLICY "Enable read access for all users - document_statuses" ON document_statuses
  FOR SELECT
  USING (true);

-- Allow insert/update/delete for authenticated users (development)
CREATE POLICY "Enable insert for all users" ON documents
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON documents
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for all users" ON documents
  FOR DELETE
  USING (true);

-- Insert sample documents for demonstration
INSERT INTO documents (
  document_id, name, type, category, file_size, file_type, uploaded_by,
  upload_date, status, notes, tags
) VALUES
  (
    'DOC-2024-445',
    'Multifamily Bridge Loan - Offering Memorandum.pdf',
    'Offering',
    'Deal Documents',
    '2.4 MB',
    'application/pdf',
    'John Doe',
    '2026-03-01',
    'Published',
    'Offering memorandum for multifamily bridge loan deal',
    ARRAY['Offering', 'Bridge Loan', 'Published']
  ),
  (
    'DOC-2024-444',
    'Sarah Johnson - Subscription Agreement.pdf',
    'Agreement',
    'Investor Documents',
    '1.1 MB',
    'application/pdf',
    'Sarah Johnson',
    '2026-02-28',
    'Signed',
    'Signed subscription agreement for investor',
    ARRAY['Agreement', 'Investor', 'Signed']
  ),
  (
    'DOC-2024-443',
    'Industrial Property - Property Appraisal.pdf',
    'Appraisal',
    'Deal Documents',
    '5.8 MB',
    'application/pdf',
    'John Doe',
    '2026-02-25',
    'Published',
    'Professional appraisal report for industrial property',
    ARRAY['Appraisal', 'Industrial', 'Published']
  ),
  (
    'DOC-2024-442',
    'Q4 2025 Performance Report.xlsx',
    'Report',
    'Reports',
    '892 KB',
    'application/vnd.ms-excel',
    'Emma Williams',
    '2026-02-20',
    'Published',
    'Quarterly performance report',
    ARRAY['Report', 'Performance', 'Published']
  ),
  (
    'DOC-2024-441',
    'Commercial Construction - Environmental Study.pdf',
    'Report',
    'Deal Documents',
    '3.2 MB',
    'application/pdf',
    'David Brown',
    '2026-02-18',
    'Draft',
    'Environmental impact study in progress',
    ARRAY['Report', 'Environmental', 'Draft']
  )
ON CONFLICT (document_id) DO NOTHING;
