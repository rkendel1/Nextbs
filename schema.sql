-- schema.sql
CREATE TABLE sites (
    id SERIAL PRIMARY KEY,
    url TEXT NOT NULL UNIQUE,
    domain TEXT,
    title TEXT,
    description TEXT,
    raw_html TEXT,
    screenshot TEXT,
    crawled_at TIMESTAMP DEFAULT now()
);

CREATE TABLE company_info (
    id SERIAL PRIMARY KEY,
    site_id INT REFERENCES sites(id) ON DELETE CASCADE,
    company_name TEXT,
    legal_name TEXT,
    contact_emails JSONB,
    contact_phones JSONB,
    addresses JSONB,
    structured_json JSONB
);

CREATE TABLE design_tokens (
    id SERIAL PRIMARY KEY,
    site_id INT REFERENCES sites(id) ON DELETE CASCADE,
    token_key TEXT,
    token_type TEXT,
    token_value JSONB,
    source TEXT,
    meta JSONB
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    site_id INT REFERENCES sites(id) ON DELETE CASCADE,
    name TEXT,
    slug TEXT,
    price TEXT,
    description TEXT,
    product_url TEXT,
    metadata JSONB
);

CREATE TABLE brand_voice (
    id SERIAL PRIMARY KEY,
    site_id INT REFERENCES sites(id) ON DELETE CASCADE,
    summary TEXT,
    guidelines JSONB,
    embedding JSONB
);