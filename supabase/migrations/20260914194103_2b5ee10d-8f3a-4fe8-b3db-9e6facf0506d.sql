CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  label text NOT NULL,
  sort int NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subtitle text NOT NULL DEFAULT '',
  category_slug text NOT NULL REFERENCES public.categories(slug) ON UPDATE CASCADE,
  price numeric(10,2) NOT NULL DEFAULT 0,
  discount_percent int NOT NULL DEFAULT 0,
  image text NOT NULL DEFAULT 'hero-bottle',
  abv text NOT NULL DEFAULT '',
  note text NOT NULL DEFAULT '',
  in_stock boolean NOT NULL DEFAULT true,
  featured boolean NOT NULL DEFAULT false,
  sort int NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.categories TO anon, authenticated;
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
GRANT ALL ON public.products TO service_role;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories are public" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "products are public" ON public.products FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.categories (slug, label, sort) VALUES
  ('gift', 'מתנות', 10),
  ('whisky', 'ויסקי', 20),
  ('wine', 'יין', 30),
  ('spirits', 'ספיריטים', 40);

INSERT INTO public.products (name, subtitle, category_slug, price, image, abv, note, sort) VALUES
  ('CEMRON — 18 שנות בַּשְׁלָה', 'ויסקי · סקוטלנד', 'whisky', 649, 'hero-bottle', '46%', 'וניל, דבש כהה וסיומת עשן עדינה. חבית שרי ראשונה.', 10),
  ('CEMRON — קברנה רזרב', 'יין אדום · נאפה', 'wine', 289, 'wine-bottle', '14.5%', 'פירות יער כהים, ארז וטאנינים קטיפתיים. מצוין עם בשר.', 20),
  ('CEMRON — ג''ין בוטניקל', 'ג''ין · אנגליה', 'spirits', 219, 'gin-bottle', '43%', 'מחט ערער, הדרים ופלפל ורוד. מושלם לג''ין טוניק.', 30),
  ('CEMRON — רום מיושן', 'רום · קריביים', 'spirits', 420, 'hero-bottle', '40%', 'קרמל, בננה קלויה וקינמון. יישון 12 שנים.', 40),
  ('CEMRON — שמפניה בלאן דה נואר', 'שמפניה · צרפת', 'wine', 540, 'champagne-bottle', '12.5%', 'בועות דקיקות, בריוש ותפוח ירוק. לרגעים גדולים.', 50),
  ('CEMRON — קוניאק XO', 'קוניאק · קונייאק', 'spirits', 890, 'cognac-bottle', '40%', 'משמש מיובש, אגוזים ועץ אלון עתיק. יישון ארוך.', 60),
  ('CEMRON — וודקה כסופה', 'וודקה · פולין', 'spirits', 199, 'vodka-bottle', '40%', 'זיקוק חמש פעמים, נקייה וקרירה במיוחד.', 70),
  ('CEMRON — מארז מורשת 20 & 30', 'מארז מתנה · שני בקבוקים', 'gift', 1290, 'gift-set', '43%', 'שני וויסקי מיושנים בקופסת סאטן שחורה עם כרטיס אישי.', 80),
  ('CEMRON — מארז חגיגה', 'מארז מתנה · שמפניה וכוסות', 'gift', 690, 'champagne-bottle', '12.5%', 'שמפניה פרימיום, שתי כוסות קריסטל ואריזת מתנה.', 90),
  ('CEMRON — מארז ערב זוגי', 'מארז מתנה · יין וקינוח', 'gift', 450, 'wine-bottle', '14%', 'קברנה רזרב, שוקולד מריר ופותחן מעוצב.', 100),
  ('CEMRON — סינגל מאלט 12', 'ויסקי · איילה', 'whisky', 389, 'hero-bottle', '43%', 'כבול ימי, מלח ופלפל. קלאסיקה מעושנת.', 110),
  ('CEMRON — שרדונה מיושן', 'יין לבן · בורגון', 'wine', 245, 'wine-bottle', '13%', 'חמאה, אגס ומינרליות. מוגש מצונן.', 120);