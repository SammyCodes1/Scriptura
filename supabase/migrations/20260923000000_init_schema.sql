-- Scriptura Supabase Initial Schema
-- Enforces: RLS, Triggers, Indexes, Cascades

-- 1. Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles (User model linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Trigger to create profile automatically on auth.users sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Bookmark(user_id, book, chapter, verse, translation, created_at)
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    book TEXT NOT NULL,
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    translation TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    UNIQUE(user_id, book, chapter, verse, translation)
);

-- 4. Highlight(user_id, book, chapter, verse, translation, color, created_at)
CREATE TABLE IF NOT EXISTS public.highlights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    book TEXT NOT NULL,
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    translation TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#FFE082',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    UNIQUE(user_id, book, chapter, verse, translation)
);

-- 5. Note(user_id, book, chapter, verse, translation, text, created_at, updated_at)
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    book TEXT NOT NULL,
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    translation TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 6. ReadingHistory(user_id, book, chapter, translation, last_read_at)
CREATE TABLE IF NOT EXISTS public.reading_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    book TEXT NOT NULL,
    chapter INTEGER NOT NULL,
    translation TEXT NOT NULL,
    last_read_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    UNIQUE(user_id, book, chapter, translation)
);

-- 7. ReadingPlan
CREATE TABLE IF NOT EXISTS public.reading_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    duration_days INTEGER NOT NULL,
    plan_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 8. ReadingPlanProgress
CREATE TABLE IF NOT EXISTS public.reading_plan_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.reading_plans(id) ON DELETE CASCADE,
    current_day INTEGER NOT NULL DEFAULT 1,
    completed_days JSONB NOT NULL DEFAULT '[]'::jsonb,
    started_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    completed_at TIMESTAMPTZ,
    UNIQUE(user_id, plan_id)
);

-- 9. ChapterOfTheWeek(week_start_date, book, chapter, blurb)
CREATE TABLE IF NOT EXISTS public.chapter_of_the_week (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week_start_date DATE NOT NULL,
    book TEXT NOT NULL,
    chapter INTEGER NOT NULL,
    blurb TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    UNIQUE(week_start_date)
);

-- 10. ConfessionDeck
CREATE TABLE IF NOT EXISTS public.confession_decks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    theme TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 11. ConfessionItem
CREATE TABLE IF NOT EXISTS public.confession_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_id UUID NOT NULL REFERENCES public.confession_decks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    scripture_reference TEXT NOT NULL,
    confession_text TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 12. ConfessionProgress
CREATE TABLE IF NOT EXISTS public.confession_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    deck_id UUID NOT NULL REFERENCES public.confession_decks(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.confession_items(id) ON DELETE CASCADE,
    mastered BOOLEAN NOT NULL DEFAULT false,
    times_recited INTEGER NOT NULL DEFAULT 0,
    last_recited_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    UNIQUE(user_id, item_id)
);

-- 13. Group
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_private BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 14. GroupMember
CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member', -- 'admin', 'moderator', 'member'
    joined_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    UNIQUE(group_id, user_id)
);

-- 15. CommunityPost
CREATE TABLE IF NOT EXISTS public.community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    scripture_tag TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 16. PrayerRequest
CREATE TABLE IF NOT EXISTS public.prayer_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    is_anonymous BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 17. PrayerResponse
CREATE TABLE IF NOT EXISTS public.prayer_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.prayer_requests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT,
    prayed BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

--------------------------------------------------------------------------------
-- INDEXES
--------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_highlights_user ON public.highlights(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_history_user ON public.reading_history(user_id);
CREATE INDEX IF NOT EXISTS idx_confession_items_deck ON public.confession_items(deck_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_group ON public.community_posts(group_id);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_group ON public.prayer_requests(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON public.group_members(user_id);

--------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
--------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_plan_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_of_the_week ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.confession_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.confession_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.confession_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_responses ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone authenticated can read profiles; users can update their own
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Personal Bible data policies (Bookmarks, Highlights, Notes, ReadingHistory)
CREATE POLICY "Users can manage their own bookmarks" ON public.bookmarks
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own highlights" ON public.highlights
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own notes" ON public.notes
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their reading history" ON public.reading_history
    FOR ALL USING (auth.uid() = user_id);

-- Plans & Chapter of the Week
CREATE POLICY "Anyone can view reading plans" ON public.reading_plans
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their plan progress" ON public.reading_plan_progress
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view chapter of the week" ON public.chapter_of_the_week
    FOR SELECT USING (true);

-- Confessions
CREATE POLICY "Anyone can view confession decks" ON public.confession_decks
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view confession items" ON public.confession_items
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their confession progress" ON public.confession_progress
    FOR ALL USING (auth.uid() = user_id);

-- Groups & Community
CREATE POLICY "Public groups are viewable by everyone" ON public.groups
    FOR SELECT USING (is_private = false OR auth.uid() IN (SELECT user_id FROM public.group_members WHERE group_id = id));

CREATE POLICY "Users can create groups" ON public.groups
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group members can view membership" ON public.group_members
    FOR SELECT USING (true);

CREATE POLICY "Users can join groups" ON public.group_members
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view posts from visible groups or public" ON public.community_posts
    FOR SELECT USING (
        group_id IS NULL OR
        EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.is_private = false) OR
        EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = community_posts.group_id AND gm.user_id = auth.uid())
    );

CREATE POLICY "Users can create posts" ON public.community_posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" ON public.community_posts
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view prayer requests" ON public.prayer_requests
    FOR SELECT USING (
        group_id IS NULL OR
        EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.is_private = false) OR
        EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = prayer_requests.group_id AND gm.user_id = auth.uid())
    );

CREATE POLICY "Users can create prayer requests" ON public.prayer_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view and respond to prayer requests" ON public.prayer_responses
    FOR ALL USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM public.prayer_requests pr WHERE pr.id = request_id AND pr.user_id = auth.uid()
    ));
