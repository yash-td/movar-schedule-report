/*
  # Create registrations table

  1. New Tables
    - `registrations`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text)
      - `organization` (text)
      - `role` (text)
      - `phone` (text)
      - `help_description` (text)
      - `created_at` (timestamp)
  2. Security
    - Enable RLS on `registrations` table
    - Add policy for inserting new registrations
*/

CREATE TABLE IF NOT EXISTS registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  organization text NOT NULL,
  role text NOT NULL,
  phone text NOT NULL,
  help_description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert registrations"
  ON registrations
  FOR INSERT
  TO anon
  WITH CHECK (true);