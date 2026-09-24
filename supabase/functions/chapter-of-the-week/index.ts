// Supabase Edge Function: chapter-of-the-week
// Schedules and rotates a featured chapter every Monday at 00:00 UTC.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ROTATING_CHAPTERS = [
  {
    book: 'Romans',
    chapter: 8,
    blurb:
      'Romans 8 is regarded as the pinnacle of Paul’s theology of grace. It begins with no condemnation for those in Christ Jesus, walks through our adoption as children of God, and concludes with the triumphant promise that nothing can separate us from God’s love.',
  },
  {
    book: 'Isaiah',
    chapter: 53,
    blurb:
      'Penned seven centuries before the cross, Isaiah 53 reveals God’s servant pierced for our transgressions and crushed for our iniquities so that by His wounds we might be made whole.',
  },
  {
    book: 'Hebrews',
    chapter: 11,
    blurb:
      'Faith is the assurance of things hoped for, the conviction of things not seen. This chapter recounts generation after generation who persevered by keeping their eyes on God.',
  },
  {
    book: 'Psalms',
    chapter: 23,
    blurb:
      'David’s beloved psalm of pastoral protection and intimate fellowship. Even in the valley of the shadow of death, we fear no evil because the Lord is with us.',
  },
  {
    book: 'John',
    chapter: 15,
    blurb:
      'Jesus gives the secret of spiritual fruitfulness on the night before His crucifixion: Abiding in Him. Apart from Him we can do nothing; in Him, our joy is made complete.',
  },
];

serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const now = new Date();
  // Get current Monday ISO date
  const dayOfWeek = now.getDay();
  const diffToMonday = (dayOfWeek + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  const weekStartDate = monday.toISOString().split('T')[0];

  const weekNumber = Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000));
  const selected = ROTATING_CHAPTERS[Math.abs(weekNumber) % ROTATING_CHAPTERS.length];

  const { data, error } = await supabase
    .from('chapter_of_the_week')
    .upsert({
      week_start_date: weekStartDate,
      book: selected.book,
      chapter: selected.chapter,
      blurb: selected.blurb,
    }, { onConflict: 'week_start_date' })
    .select();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true, featured: data }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
