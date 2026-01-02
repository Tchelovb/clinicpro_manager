-- Create dental_catalog table if not exists
CREATE TABLE IF NOT EXISTS public.dental_catalog (
    code text NOT NULL,
    type text NOT NULL,
    label text NOT NULL,
    short_label text,
    tooth_number integer,
    quadrant integer,
    category text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT dental_catalog_pkey PRIMARY KEY (code)
);

-- Insert data (Dentes e Regiões HOF)
INSERT INTO public.dental_catalog (code, type, label, short_label, tooth_number, quadrant, category)
VALUES 
    -- Quadrante 1
    ('11', 'TOOTH', 'Incisivo Central Superior Direito', '11', 11, 1, 'ODONTOLOGIA'),
    ('12', 'TOOTH', 'Incisivo Lateral Superior Direito', '12', 12, 1, 'ODONTOLOGIA'),
    ('13', 'TOOTH', 'Canino Superior Direito', '13', 13, 1, 'ODONTOLOGIA'),
    ('14', 'TOOTH', '1º Pré-Molar Superior Direito', '14', 14, 1, 'ODONTOLOGIA'),
    ('15', 'TOOTH', '2º Pré-Molar Superior Direito', '15', 15, 1, 'ODONTOLOGIA'),
    ('16', 'TOOTH', '1º Molar Superior Direito', '16', 16, 1, 'ODONTOLOGIA'),
    ('17', 'TOOTH', '2º Molar Superior Direito', '17', 17, 1, 'ODONTOLOGIA'),
    ('18', 'TOOTH', '3º Molar Superior Direito', '18', 18, 1, 'ODONTOLOGIA'),

    -- Quadrante 2
    ('21', 'TOOTH', 'Incisivo Central Superior Esquerdo', '21', 21, 2, 'ODONTOLOGIA'),
    ('22', 'TOOTH', 'Incisivo Lateral Superior Esquerdo', '22', 22, 2, 'ODONTOLOGIA'),
    ('23', 'TOOTH', 'Canino Superior Esquerdo', '23', 23, 2, 'ODONTOLOGIA'),
    ('24', 'TOOTH', '1º Pré-Molar Superior Esquerdo', '24', 24, 2, 'ODONTOLOGIA'),
    ('25', 'TOOTH', '2º Pré-Molar Superior Esquerdo', '25', 25, 2, 'ODONTOLOGIA'),
    ('26', 'TOOTH', '1º Molar Superior Esquerdo', '26', 26, 2, 'ODONTOLOGIA'),
    ('27', 'TOOTH', '2º Molar Superior Esquerdo', '27', 27, 2, 'ODONTOLOGIA'),
    ('28', 'TOOTH', '3º Molar Superior Esquerdo', '28', 28, 2, 'ODONTOLOGIA'),

    -- Quadrante 3
    ('31', 'TOOTH', 'Incisivo Central Inferior Esquerdo', '31', 31, 3, 'ODONTOLOGIA'),
    ('32', 'TOOTH', 'Incisivo Lateral Inferior Esquerdo', '32', 32, 3, 'ODONTOLOGIA'),
    ('33', 'TOOTH', 'Canino Inferior Esquerdo', '33', 33, 3, 'ODONTOLOGIA'),
    ('34', 'TOOTH', '1º Pré-Molar Inferior Esquerdo', '34', 34, 3, 'ODONTOLOGIA'),
    ('35', 'TOOTH', '2º Pré-Molar Inferior Esquerdo', '35', 35, 3, 'ODONTOLOGIA'),
    ('36', 'TOOTH', '1º Molar Inferior Esquerdo', '36', 36, 3, 'ODONTOLOGIA'),
    ('37', 'TOOTH', '2º Molar Inferior Esquerdo', '37', 37, 3, 'ODONTOLOGIA'),
    ('38', 'TOOTH', '3º Molar Inferior Esquerdo', '38', 38, 3, 'ODONTOLOGIA'),

    -- Quadrante 4
    ('41', 'TOOTH', 'Incisivo Central Inferior Direito', '41', 41, 4, 'ODONTOLOGIA'),
    ('42', 'TOOTH', 'Incisivo Lateral Inferior Direito', '42', 42, 4, 'ODONTOLOGIA'),
    ('43', 'TOOTH', 'Canino Inferior Direito', '43', 43, 4, 'ODONTOLOGIA'),
    ('44', 'TOOTH', '1º Pré-Molar Inferior Direito', '44', 44, 4, 'ODONTOLOGIA'),
    ('45', 'TOOTH', '2º Pré-Molar Inferior Direito', '45', 45, 4, 'ODONTOLOGIA'),
    ('46', 'TOOTH', '1º Molar Inferior Direito', '46', 46, 4, 'ODONTOLOGIA'),
    ('47', 'TOOTH', '2º Molar Inferior Direito', '47', 47, 4, 'ODONTOLOGIA'),
    ('48', 'TOOTH', '3º Molar Inferior Direito', '48', 48, 4, 'ODONTOLOGIA'),

    -- HOF
    ('FACE_FULL', 'REGION', 'Face Completa (Full Face)', 'Full Face', NULL, NULL, 'HOF'),
    ('UPPER_THIRD', 'REGION', 'Terço Superior', 'Terço Sup.', NULL, NULL, 'HOF'),
    ('LIPS', 'REGION', 'Lábios', 'Lábios', NULL, NULL, 'HOF'),
    ('JAW', 'REGION', 'Mandíbula e Contorno', 'Mandíbula', NULL, NULL, 'HOF'),
    ('NECK', 'REGION', 'Pescoço/Papada', 'Pescoço', NULL, NULL, 'HOF')

ON CONFLICT (code) DO NOTHING;
