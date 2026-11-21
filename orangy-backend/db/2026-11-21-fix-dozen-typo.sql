-- Fix the "dozon" -> "dozen" typo in catalogue text (variant labels, product
-- names and descriptions). Safe to run more than once.
BEGIN;
UPDATE product_variants SET label = regexp_replace(label, 'dozon', 'dozen', 'gi') WHERE label ~* 'dozon';
UPDATE products SET name = regexp_replace(name, 'dozon', 'dozen', 'gi') WHERE name ~* 'dozon';
UPDATE products SET description = regexp_replace(description, 'dozon', 'dozen', 'gi') WHERE description ~* 'dozon';
COMMIT;
