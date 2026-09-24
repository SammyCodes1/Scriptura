-- Supabase Migration: Automated pg_cron Schedule for Chapter of the Week
-- Rotates featured chapter every Monday at 00:00 UTC

-- 1. Enable pg_cron and pg_net extensions if supported by database
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Stored procedure to rotate Chapter of the Week
CREATE OR REPLACE FUNCTION public.rotate_chapter_of_the_week()
RETURNS VOID AS $$
DECLARE
    cur_monday DATE := date_trunc('week', CURRENT_DATE)::DATE;
    week_idx INT := EXTRACT(WEEK FROM CURRENT_DATE)::INT;
    ch_book TEXT;
    ch_num INT;
    ch_blurb TEXT;
BEGIN
    -- Rotation calendar
    CASE (week_idx % 5)
        WHEN 0 THEN
            ch_book := 'Romans'; ch_num := 8;
            ch_blurb := 'Romans 8 reveals life in the Spirit, no condemnation, and the inseparable love of God.';
        WHEN 1 THEN
            ch_book := 'Isaiah'; ch_num := 53;
            ch_blurb := 'Isaiah 53 prophecies the suffering servant carrying our sorrows to bring us peace.';
        WHEN 2 THEN
            ch_book := 'Hebrews'; ch_num := 11;
            ch_blurb := 'Hebrews 11 chronicles the persevering faith of generations anchored in God.';
        WHEN 3 THEN
            ch_book := 'Psalms'; ch_num := 23;
            ch_blurb := 'Psalm 23 celebrates the Good Shepherd comforting and leading us through dark valleys.';
        ELSE
            ch_book := 'John'; ch_num := 15;
            ch_blurb := 'John 15 teaches the vital practice of abiding in the True Vine for fruitful joy.';
    END CASE;

    INSERT INTO public.chapter_of_the_week (week_start_date, book, chapter, blurb)
    VALUES (cur_monday, ch_book, ch_num, ch_blurb)
    ON CONFLICT (week_start_date) DO UPDATE
    SET book = EXCLUDED.book,
        chapter = EXCLUDED.chapter,
        blurb = EXCLUDED.blurb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Schedule the rotation every Monday morning at 00:00 UTC
SELECT cron.schedule(
    'rotate-chapter-of-the-week-monday',
    '0 0 * * 1', -- At 00:00 on Monday
    'SELECT public.rotate_chapter_of_the_week();'
);
