
-- Create saved_whiteboards table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.saved_whiteboards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Whiteboard',
  room_id TEXT NOT NULL,
  thumbnail_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on saved_whiteboards
ALTER TABLE public.saved_whiteboards ENABLE ROW LEVEL SECURITY;

-- Create policies for saved_whiteboards
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_whiteboards' AND policyname = 'Users can view their own whiteboards') THEN
    CREATE POLICY "Users can view their own whiteboards" 
      ON public.saved_whiteboards 
      FOR SELECT 
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_whiteboards' AND policyname = 'Users can create their own whiteboards') THEN
    CREATE POLICY "Users can create their own whiteboards" 
      ON public.saved_whiteboards 
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_whiteboards' AND policyname = 'Users can update their own whiteboards') THEN
    CREATE POLICY "Users can update their own whiteboards" 
      ON public.saved_whiteboards 
      FOR UPDATE 
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_whiteboards' AND policyname = 'Users can delete their own whiteboards') THEN
    CREATE POLICY "Users can delete their own whiteboards" 
      ON public.saved_whiteboards 
      FOR DELETE 
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create whiteboard_collaborators table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.whiteboard_collaborators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  whiteboard_id UUID NOT NULL REFERENCES public.saved_whiteboards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission TEXT NOT NULL DEFAULT 'view' CHECK (permission IN ('view', 'edit', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(whiteboard_id, user_id)
);

-- Enable RLS on whiteboard_collaborators
ALTER TABLE public.whiteboard_collaborators ENABLE ROW LEVEL SECURITY;

-- Create policies for whiteboard_collaborators
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'whiteboard_collaborators' AND policyname = 'Users can view collaborators for their whiteboards') THEN
    CREATE POLICY "Users can view collaborators for their whiteboards" 
      ON public.whiteboard_collaborators 
      FOR SELECT 
      USING (
        EXISTS (
          SELECT 1 FROM public.saved_whiteboards 
          WHERE id = whiteboard_id AND user_id = auth.uid()
        ) OR user_id = auth.uid()
      );
  END IF;
END $$;
