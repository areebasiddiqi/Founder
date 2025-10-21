-- Alternative: Manual profile creation approach
-- Run this if the trigger approach doesn't work

-- 1. Drop the trigger completely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Create a simple function that manually creates profiles
CREATE OR REPLACE FUNCTION create_user_profile(user_id UUID, user_email TEXT, user_name TEXT DEFAULT NULL)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Insert into profiles
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (user_id, user_email, COALESCE(user_name, user_email));

    -- Insert into subscriptions if table exists
    BEGIN
        INSERT INTO public.subscriptions (user_id, plan_type, status)
        VALUES (user_id, 'free', 'inactive');
    EXCEPTION
        WHEN undefined_table THEN
            NULL;
    END;

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to create profile for %: %', user_id, SQLERRM;
        RETURN FALSE;
END;
$$;

-- 3. In your app code, instead of relying on trigger, call this function
-- Example for your Next.js app (in your auth signup handler):

/*
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function handleUserSignup(user) {
    // Call the manual profile creation function
    const { data, error } = await supabase.rpc('create_user_profile', {
        user_id: user.id,
        user_email: user.email,
        user_name: user.user_metadata?.full_name || null
    });

    if (error) {
        console.error('Failed to create profile:', error);
        return false;
    }

    return true;
}
*/

SELECT 'Manual profile creation function created' as status;
