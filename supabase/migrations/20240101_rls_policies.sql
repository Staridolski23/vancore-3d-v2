-- Safe RLS Policies for Vancore Supabase
-- Execute this in Supabase SQL Editor

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Helper: admin check
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: staff check
CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'consultant'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- USERS
CREATE POLICY "users_own_read" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_own_update" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "admins_all" ON users FOR ALL USING (is_admin());

-- CONVERSATIONS
CREATE POLICY "conversations_user_read" ON conversations FOR SELECT USING (
  user_id = auth.uid() OR is_staff()
);
CREATE POLICY "conversations_user_insert" ON conversations FOR INSERT WITH CHECK (
  user_id = auth.uid() OR is_staff()
);
CREATE POLICY "conversations_user_update" ON conversations FOR UPDATE USING (
  user_id = auth.uid() OR is_staff()
);
CREATE POLICY "conversations_admin_delete" ON conversations FOR DELETE USING (is_admin());

-- MESSAGES
CREATE POLICY "messages_read" ON messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND (conversations.user_id = auth.uid() OR is_staff())
  )
);
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND (conversations.user_id = auth.uid() OR is_staff())
  )
);
CREATE POLICY "messages_admin_all" ON messages FOR ALL USING (is_admin());

-- NOTES: staff/admin only
CREATE POLICY "notes_staff_all" ON notes FOR ALL USING (is_staff());

-- REPORTS
CREATE POLICY "reports_user_read" ON reports FOR SELECT USING (
  user_id = auth.uid() OR is_staff()
);
CREATE POLICY "reports_admin_all" ON reports FOR ALL USING (is_admin());

-- SITE_CONTENT: public read, admin write
CREATE POLICY "site_content_public_read" ON site_content FOR SELECT USING (true);
CREATE POLICY "site_content_admin_write" ON site_content FOR ALL USING (is_admin());

-- TASKS: staff/admin only (safe, no column assumptions)
CREATE POLICY "tasks_staff_read" ON tasks FOR SELECT USING (is_staff());
CREATE POLICY "tasks_staff_update" ON tasks FOR UPDATE USING (is_staff());
CREATE POLICY "tasks_admin_all" ON tasks FOR ALL USING (is_admin());
