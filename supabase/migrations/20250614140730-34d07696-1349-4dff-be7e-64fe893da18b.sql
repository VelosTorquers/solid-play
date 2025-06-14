
-- Create rooms table for brainstorming sessions
CREATE TABLE public.rooms (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  is_active BOOLEAN DEFAULT true
);

-- Create sticky notes table
CREATE TABLE public.sticky_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id TEXT REFERENCES public.rooms(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  x_position FLOAT NOT NULL DEFAULT 0,
  y_position FLOAT NOT NULL DEFAULT 0,
  color TEXT DEFAULT 'yellow' CHECK (color IN ('yellow', 'blue', 'green', 'pink', 'orange')),
  created_by TEXT DEFAULT 'Anonymous',
  votes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create drawings table for pen tool sketches
CREATE TABLE public.drawings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id TEXT REFERENCES public.rooms(id) ON DELETE CASCADE,
  path_data TEXT NOT NULL,
  color TEXT DEFAULT 'black',
  stroke_width INTEGER DEFAULT 2,
  created_by TEXT DEFAULT 'Anonymous',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create text elements table for larger text
CREATE TABLE public.text_elements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id TEXT REFERENCES public.rooms(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  x_position FLOAT NOT NULL DEFAULT 0,
  y_position FLOAT NOT NULL DEFAULT 0,
  font_size INTEGER DEFAULT 16,
  color TEXT DEFAULT 'black',
  created_by TEXT DEFAULT 'Anonymous',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sticky_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drawings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.text_elements ENABLE ROW LEVEL SECURITY;

-- Create policies (public access for anonymous collaboration)
CREATE POLICY "Anyone can view rooms" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Anyone can create rooms" ON public.rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update rooms" ON public.rooms FOR UPDATE USING (true);

CREATE POLICY "Anyone can view sticky notes" ON public.sticky_notes FOR SELECT USING (true);
CREATE POLICY "Anyone can create sticky notes" ON public.sticky_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update sticky notes" ON public.sticky_notes FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete sticky notes" ON public.sticky_notes FOR DELETE USING (true);

CREATE POLICY "Anyone can view drawings" ON public.drawings FOR SELECT USING (true);
CREATE POLICY "Anyone can create drawings" ON public.drawings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete drawings" ON public.drawings FOR DELETE USING (true);

CREATE POLICY "Anyone can view text elements" ON public.text_elements FOR SELECT USING (true);
CREATE POLICY "Anyone can create text elements" ON public.text_elements FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update text elements" ON public.text_elements FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete text elements" ON public.text_elements FOR DELETE USING (true);

-- Enable realtime for all tables
ALTER TABLE public.rooms REPLICA IDENTITY FULL;
ALTER TABLE public.sticky_notes REPLICA IDENTITY FULL;
ALTER TABLE public.drawings REPLICA IDENTITY FULL;
ALTER TABLE public.text_elements REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sticky_notes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.drawings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.text_elements;

-- Function to generate room codes
CREATE OR REPLACE FUNCTION generate_room_code() RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired rooms
CREATE OR REPLACE FUNCTION cleanup_expired_rooms() RETURNS void AS $$
BEGIN
  DELETE FROM public.rooms WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
