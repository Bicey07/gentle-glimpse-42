-- Finish the additive setup required by the browser client.
-- The bucket stays private; access is controlled by the policies in 0001.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'entry-images',
  'entry-images',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO public.rooms (id, name, description)
VALUES
  ('weekend-exhibition', '周末有人想去展览', '看画，发呆，慢慢走。'),
  ('tokyo-life', '东京生活', '在另一座城市里慢慢生活。'),
  ('reading', '最近在读书的人', '一起把书慢慢看完。'),
  ('morning', '安静的早晨', '天还没亮的时候醒来。'),
  ('night-writers', '夜里写字的人', '灯还亮着的房间。')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Keep user-owned rows tied to real accounts and remove them automatically
-- when an account is deleted. The migration is additive and preserves data.
ALTER TABLE public.entries
  ADD CONSTRAINT entries_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.friendships
  ADD CONSTRAINT friendships_requester_id_fkey
  FOREIGN KEY (requester_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD CONSTRAINT friendships_addressee_id_fkey
  FOREIGN KEY (addressee_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.replies
  ADD CONSTRAINT replies_author_id_fkey
  FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD CONSTRAINT replies_recipient_id_fkey
  FOREIGN KEY (recipient_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.room_members
  ADD CONSTRAINT room_members_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.room_notes
  ADD CONSTRAINT room_notes_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
