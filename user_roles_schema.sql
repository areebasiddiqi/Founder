-- Add role support to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS roles TEXT[] DEFAULT ARRAY['founder'];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS active_role VARCHAR(20) DEFAULT 'founder';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS investor_profile JSONB;

-- Ensure existing users have default founder role
UPDATE profiles SET active_role = 'founder' WHERE active_role IS NULL;
UPDATE profiles SET roles = ARRAY['founder'] WHERE roles IS NULL OR array_length(roles, 1) IS NULL;

-- Create user_roles table for better role management
CREATE TABLE user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('founder', 'investor', 'admin')),
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create conversations table for messaging
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pitch_page_id UUID REFERENCES pitch_pages(id) ON DELETE CASCADE,
  founder_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  investor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pitch_page_id, founder_id, investor_id)
);

-- Create messages table
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'interest')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own roles" ON user_roles
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for conversations
CREATE POLICY "Users can view conversations they're part of" ON conversations
  FOR SELECT USING (auth.uid() = founder_id OR auth.uid() = investor_id);

CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = founder_id OR auth.uid() = investor_id);

CREATE POLICY "Users can update conversations they're part of" ON conversations
  FOR UPDATE USING (auth.uid() = founder_id OR auth.uid() = investor_id);

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND (conversations.founder_id = auth.uid() OR conversations.investor_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their conversations" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND (conversations.founder_id = auth.uid() OR conversations.investor_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (auth.uid() = sender_id);

-- Indexes for performance
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_conversations_founder_id ON conversations(founder_id);
CREATE INDEX idx_conversations_investor_id ON conversations(investor_id);
CREATE INDEX idx_conversations_pitch_page_id ON conversations(pitch_page_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_conversations_updated_at();

-- Function to switch user role
CREATE OR REPLACE FUNCTION switch_user_role(new_role VARCHAR(20))
RETURNS VOID AS $$
BEGIN
  -- Update active role in profiles
  UPDATE profiles 
  SET active_role = new_role 
  WHERE id = auth.uid();
  
  -- Ensure role exists in user_roles
  INSERT INTO user_roles (user_id, role, is_active)
  VALUES (auth.uid(), new_role, true)
  ON CONFLICT (user_id, role) 
  DO UPDATE SET is_active = true;
  
  -- Deactivate other roles
  UPDATE user_roles 
  SET is_active = false 
  WHERE user_id = auth.uid() AND role != new_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to initialize user roles when profile is created
CREATE OR REPLACE FUNCTION initialize_user_roles()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default founder role for new users
  INSERT INTO user_roles (user_id, role, is_active)
  VALUES (NEW.id, 'founder', true)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to initialize roles for new profiles
CREATE TRIGGER initialize_user_roles_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_roles();
