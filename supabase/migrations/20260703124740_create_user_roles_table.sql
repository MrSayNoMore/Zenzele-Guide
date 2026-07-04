-- Create user_roles table for admin access control
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('super_admin', 'content_admin')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can read their own roles, admins can read all
CREATE POLICY "users_read_own_roles" ON user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Service role can do everything (for admin operations)
CREATE POLICY "service_role_full_access" ON user_roles
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);

-- Grant authenticated users select access
GRANT SELECT ON user_roles TO authenticated;
GRANT SELECT ON user_roles TO anon;