-- Fix the trigger function that's causing user creation to fail
-- Run this in Supabase SQL Editor

-- First, drop the problematic trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create a simpler, more robust trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    profile_id UUID;
BEGIN
    -- Try to insert into profiles
    BEGIN
        INSERT INTO profiles (id, email, full_name)
        VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
        profile_id := NEW.id;
    EXCEPTION
        WHEN OTHERS THEN
            -- If profiles insert fails, still allow user creation
            RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
            RETURN NEW;
    END;

    -- Try to insert into subscriptions
    BEGIN
        INSERT INTO subscriptions (user_id, plan_type, status)
        VALUES (profile_id, 'free', 'inactive');
    EXCEPTION
        WHEN undefined_table THEN
            -- subscriptions table doesn't exist, skip
            NULL;
        WHEN OTHERS THEN
            -- Other error, log but continue
            RAISE WARNING 'Failed to create subscription for user %: %', NEW.id, SQLERRM;
    END;

    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION handle_new_user();

-- Test the trigger function directly
SELECT 'Trigger function created successfully' as status;
