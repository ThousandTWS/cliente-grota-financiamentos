-- Seed de admin inicial
INSERT INTO users (
    id,
    name,
    email,
    password_hash,
    role,
    verified,
    active,
    phone,
    cpf,
    address,
    created_at,
    updated_at
)
VALUES (
    '8b3e0b4c-9b5c-4a10-9c12-4c3b1d4e7f1a',
    'Admin Master',
    'admin@grota.com',
    '$2a$10$7EqJtq98hPqEX7fNZaFWoOhi5x1E4H9n1tFoZT3zh7ElBTtPlqvuy',
    'ADMIN',
    TRUE,
    TRUE,
    NULL,
    NULL,
    NULL,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO NOTHING;
