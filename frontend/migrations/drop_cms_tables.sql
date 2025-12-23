-- Migration to drop CMS tables and cleanup
-- Run this in Supabase SQL Editor

DROP TABLE IF EXISTS public.cms_content CASCADE;

-- If there are any specific functions or triggers for CMS, drop them here
DROP FUNCTION IF EXISTS public.get_cms_content();
DROP FUNCTION IF EXISTS public.update_cms_content();
