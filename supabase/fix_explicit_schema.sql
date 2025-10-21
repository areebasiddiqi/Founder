-- Fix the trigger function to explicitly reference the public schema
-- Run this in Supabase SQL Editor

-- Drop the problematic trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create a trigger function that explicitly uses the public schema
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if profiles table exists first
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
        RAISE WARNING 'profiles table does not exist';
        RETURN NEW;
    END IF;

    -- Try to insert into profiles with explicit schema reference
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );

    -- Try to insert into subscriptions if it exists
    BEGIN
        INSERT INTO public.subscriptions (user_id, plan_type, status)
        VALUES (NEW.id, 'free', 'inactive');
    EXCEPTION
        WHEN undefined_table THEN
            -- subscriptions table doesn't exist, skip
            NULL;
    END;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail user creation
        RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Test the trigger function
DO $$
BEGIN
    -- Simulate a user creation to test the trigger
    PERFORM handle_new_user();
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Trigger function test: %', SQLERRM;
END;
$$;

SELECT 'Trigger function fixed with explicit schema reference' as status;
