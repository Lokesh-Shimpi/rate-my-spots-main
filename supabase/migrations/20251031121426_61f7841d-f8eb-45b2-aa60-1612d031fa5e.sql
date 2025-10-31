-- Create user role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'owner');

-- Create users table (profile table linked to auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL CHECK (char_length(name) >= 20 AND char_length(name) <= 60),
  address TEXT NOT NULL CHECK (char_length(address) <= 400),
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create stores table
CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on stores
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- Create ratings table
CREATE TABLE public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, store_id)
);

-- Enable RLS on ratings
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, address, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Default User Name - Please Update'),
    COALESCE(NEW.raw_user_meta_data->>'address', 'Default Address - Please Update'),
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'user')
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger for ratings updated_at
CREATE TRIGGER update_ratings_updated_at
  BEFORE UPDATE ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = _user_id AND role = _role
  )
$$;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert users"
  ON public.users FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can update any user"
  ON public.users FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for stores table
CREATE POLICY "Anyone authenticated can view stores"
  ON public.stores FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert stores"
  ON public.stores FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update stores"
  ON public.stores FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete stores"
  ON public.stores FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for ratings table
CREATE POLICY "Users can view all ratings"
  ON public.ratings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own ratings"
  ON public.ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'user'));

CREATE POLICY "Users can update their own ratings"
  ON public.ratings FOR UPDATE
  USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'user'));

CREATE POLICY "Users can delete their own ratings"
  ON public.ratings FOR DELETE
  USING (auth.uid() = user_id);