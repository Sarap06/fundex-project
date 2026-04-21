-- Fix: investor ID trigger used COUNT(*) which causes duplicate key errors
-- when rows are deleted (count goes down but existing IDs remain).
-- Changed to use MAX(numeric_part) + 1 so the next ID is always unique.

CREATE OR REPLACE FUNCTION generate_investor_id()
RETURNS TRIGGER AS $$
DECLARE
  max_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(investor_id FROM 5) AS INTEGER)), 0)
    INTO max_num
    FROM investors;
  NEW.investor_id := 'INV-' || LPAD((max_num + 1)::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
