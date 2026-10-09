CREATE TYPE public.entry_kind AS ENUM ('sentence','image','book','movie','status');
CREATE TYPE public.entry_visibility AS ENUM ('self','friends');
CREATE TYPE public.friendship_status AS ENUM ('pending','accepted');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '',
  color text NOT NULL DEFAULT '#8fa3b5',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_name_len CHECK (char_length(display_name) <= 40),
  CONSTRAINT profiles_bio_len CHECK (char_length(bio) <= 200)
);

CREATE TABLE public.entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind public.entry_kind NOT NULL,
  visibility public.entry_visibility NOT NULL DEFAULT 'friends',
  text text,
  caption text,
  title text,
  creator text,
  note text,
  mood text,
  image_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT entries_text_len CHECK (char_length(coalesce(text,'')) <= 2000 AND char_length(coalesce(note,'')) <= 1000 AND char_length(coalesce(caption,'')) <= 300 AND char_length(coalesce(title,'')) <= 200 AND char_length(coalesce(creator,'')) <= 200 AND char_length(coalesce(mood,'')) <= 40),
  CONSTRAINT entries_image_not_data_url CHECK (image_path IS NULL OR image_path NOT LIKE 'data:%')
);
CREATE INDEX entries_user_created_idx ON public.entries (user_id, created_at DESC);

CREATE TABLE public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL,
  addressee_id uuid NOT NULL,
  status public.friendship_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT friendships_not_self CHECK (requester_id <> addressee_id)
);
CREATE UNIQUE INDEX friendships_pair_uidx ON public.friendships (LEAST(requester_id, addressee_id), GREATEST(requester_id, addressee_id));

CREATE TABLE public.replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  entry_id uuid REFERENCES public.entries(id) ON DELETE CASCADE,
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT replies_text_len CHECK (char_length(text) BETWEEN 1 AND 500)
);

CREATE TABLE public.rooms (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.room_members (
  room_id text NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (room_id, user_id)
);

CREATE TABLE public.room_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id text NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT room_notes_text_len CHECK (char_length(text) BETWEEN 1 AND 500)
);
CREATE INDEX room_notes_room_idx ON public.room_notes (room_id, created_at DESC);

-- Grants (no anon writes anywhere; anon may only read the room catalog)
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.entries TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.friendships TO authenticated;
GRANT UPDATE (status) ON public.friendships TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.replies TO authenticated;
GRANT SELECT ON public.rooms TO anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.room_members TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.room_notes TO authenticated;
GRANT ALL ON public.profiles, public.entries, public.friendships, public.replies, public.rooms, public.room_members, public.room_notes TO service_role;

-- Helper functions
CREATE OR REPLACE FUNCTION public.are_friends(_a uuid, _b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _a IS NOT NULL AND _b IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.friendships f
    WHERE f.status = 'accepted'
      AND ((f.requester_id = _a AND f.addressee_id = _b) OR (f.requester_id = _b AND f.addressee_id = _a))
  )
$$;

CREATE OR REPLACE FUNCTION public.has_friendship_link(_a uuid, _b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _a IS NOT NULL AND _b IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.friendships f
    WHERE (f.requester_id = _a AND f.addressee_id = _b) OR (f.requester_id = _b AND f.addressee_id = _a)
  )
$$;

CREATE OR REPLACE FUNCTION public.is_room_member(_room text, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _user IS NOT NULL AND EXISTS (SELECT 1 FROM public.room_members m WHERE m.room_id = _room AND m.user_id = _user)
$$;

CREATE OR REPLACE FUNCTION public.shares_room(_a uuid, _b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _a IS NOT NULL AND _b IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.room_members m1 JOIN public.room_members m2 ON m1.room_id = m2.room_id
    WHERE m1.user_id = _a AND m2.user_id = _b
  )
$$;

CREATE OR REPLACE FUNCTION public.can_view_entry_image(_path text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.entries e
    WHERE e.image_path = _path
      AND (e.user_id = auth.uid() OR (e.visibility = 'friends' AND public.are_friends(auth.uid(), e.user_id)))
  )
$$;

REVOKE EXECUTE ON FUNCTION public.are_friends(uuid, uuid), public.has_friendship_link(uuid, uuid), public.is_room_member(text, uuid), public.shares_room(uuid, uuid), public.can_view_entry_image(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.are_friends(uuid, uuid), public.has_friendship_link(uuid, uuid), public.is_room_member(text, uuid), public.shares_room(uuid, uuid), public.can_view_entry_image(text) TO authenticated;

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: read self, friends, linked, roommates" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_friendship_link(auth.uid(), id) OR public.shares_room(auth.uid(), id));
CREATE POLICY "profiles: insert self" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles: update self" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "entries: owner or accepted friends" ON public.entries FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR (visibility = 'friends' AND public.are_friends(auth.uid(), user_id)));
CREATE POLICY "entries: insert own" ON public.entries FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "entries: update own" ON public.entries FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "entries: delete own" ON public.entries FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "friendships: read own" ON public.friendships FOR SELECT TO authenticated
  USING (requester_id = auth.uid() OR addressee_id = auth.uid());
CREATE POLICY "friendships: request as self" ON public.friendships FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid() AND status = 'pending');
CREATE POLICY "friendships: addressee accepts" ON public.friendships FOR UPDATE TO authenticated
  USING (addressee_id = auth.uid()) WITH CHECK (addressee_id = auth.uid() AND status = 'accepted');
CREATE POLICY "friendships: either side removes" ON public.friendships FOR DELETE TO authenticated
  USING (requester_id = auth.uid() OR addressee_id = auth.uid());

CREATE POLICY "replies: author or recipient reads" ON public.replies FOR SELECT TO authenticated
  USING (author_id = auth.uid() OR recipient_id = auth.uid());
CREATE POLICY "replies: send to accepted friend" ON public.replies FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND public.are_friends(auth.uid(), recipient_id)
    AND (entry_id IS NULL OR EXISTS (SELECT 1 FROM public.entries e WHERE e.id = entry_id AND e.user_id = recipient_id AND e.visibility = 'friends')));
CREATE POLICY "replies: author deletes" ON public.replies FOR DELETE TO authenticated USING (author_id = auth.uid());

CREATE POLICY "rooms: catalog is readable" ON public.rooms FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "room_members: see own and co-members" ON public.room_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_room_member(room_id, auth.uid()));
CREATE POLICY "room_members: join as self" ON public.room_members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "room_members: leave as self" ON public.room_members FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "room_notes: members read" ON public.room_notes FOR SELECT TO authenticated
  USING (public.is_room_member(room_id, auth.uid()));
CREATE POLICY "room_notes: members write own" ON public.room_notes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_room_member(room_id, auth.uid()));
CREATE POLICY "room_notes: delete own" ON public.room_notes FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, left(coalesce(nullif(NEW.raw_user_meta_data->>'display_name',''), split_part(NEW.email,'@',1), '你'), 40))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();