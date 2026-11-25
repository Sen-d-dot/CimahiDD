CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'company', 'investor')),
    phone VARCHAR(30),
    organization VARCHAR(150),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    owner_user_id INT REFERENCES users(id) ON DELETE SET NULL,
    category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    website VARCHAR(255),
    address TEXT,
    gmaps_url VARCHAR(500),
    funding_needed NUMERIC(20, 2),
    funding_purpose TEXT,
    funding_deadline DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
    rejection_reason VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_status ON companies (status);
CREATE INDEX IF NOT EXISTS idx_companies_owner ON companies (owner_user_id);

CREATE TABLE IF NOT EXISTS company_financials (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    year SMALLINT NOT NULL,
    revenue NUMERIC(20, 2) NOT NULL,
    net_profit NUMERIC(20, 2) NOT NULL,
    total_assets NUMERIC(20, 2) NOT NULL,
    total_liabilities NUMERIC(20, 2) NOT NULL,
    notes VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (company_id, year)
);

CREATE TABLE IF NOT EXISTS company_permits (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    type VARCHAR(80) NOT NULL,
    number VARCHAR(100) NOT NULL,
    issued_by VARCHAR(150),
    expiry_date DATE,
    file_data BYTEA,
    file_mime VARCHAR(60),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_permits_company ON company_permits (company_id);

CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    whatsapp VARCHAR(30) DEFAULT '',
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    from_admin SMALLINT NOT NULL DEFAULT 0,
    body TEXT NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_user ON messages (user_id, id);

INSERT INTO categories (name, slug) VALUES
    ('Teknologi', 'teknologi'),
    ('Kuliner & F&B', 'kuliner-fnb'),
    ('Keuangan & Fintech', 'keuangan-fintech'),
    ('Manufaktur', 'manufaktur'),
    ('Pertanian & Perikanan', 'pertanian-perikanan'),
    ('Properti & Konstruksi', 'properti-konstruksi'),
    ('Perdagangan & Ritel', 'perdagangan-ritel'),
    ('Jasa & Pendidikan', 'jasa-pendidikan')
ON CONFLICT (slug) DO NOTHING;
