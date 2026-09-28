-- =========================================================================
-- NSC subject catalogue (reference data, not content).
-- Codes match SubjectCode in src/engine/schemas.ts, which the APS engine and
-- course requirements use. Safe to run more than once.
-- =========================================================================
INSERT INTO public.subjects (code, name, is_language, is_life_orientation) VALUES
  ('english_hl',                       'English Home Language',                 true,  false),
  ('english_fal',                      'English First Additional Language',     true,  false),
  ('afrikaans_hl',                     'Afrikaans Huistaal',                    true,  false),
  ('afrikaans_fal',                    'Afrikaans Eerste Addisionele Taal',     true,  false),
  ('isizulu_hl',                       'isiZulu Home Language',                 true,  false),
  ('isizulu_fal',                      'isiZulu First Additional Language',     true,  false),
  ('sesotho_hl',                       'Sesotho Home Language',                 true,  false),
  ('sesotho_fal',                      'Sesotho First Additional Language',     true,  false),
  ('mathematics',                      'Mathematics',                           false, false),
  ('mathematical_literacy',            'Mathematical Literacy',                 false, false),
  ('technical_mathematics',            'Technical Mathematics',                 false, false),
  ('life_orientation',                 'Life Orientation',                      false, true),
  ('physical_sciences',                'Physical Sciences',                     false, false),
  ('life_sciences',                    'Life Sciences',                         false, false),
  ('geography',                        'Geography',                             false, false),
  ('history',                          'History',                               false, false),
  ('accounting',                       'Accounting',                            false, false),
  ('business_studies',                 'Business Studies',                      false, false),
  ('economics',                        'Economics',                             false, false),
  ('agricultural_sciences',            'Agricultural Sciences',                 false, false),
  ('consumer_studies',                 'Consumer Studies',                      false, false),
  ('tourism',                          'Tourism',                               false, false),
  ('information_technology',           'Information Technology',                false, false),
  ('computer_applications_technology', 'Computer Applications Technology',      false, false),
  ('engineering_graphics_design',      'Engineering Graphics and Design',       false, false),
  ('visual_arts',                      'Visual Arts',                           false, false),
  ('dramatic_arts',                    'Dramatic Arts',                         false, false),
  ('music',                            'Music',                                 false, false),
  ('other',                            'Other subject',                         false, false)
ON CONFLICT (code) DO UPDATE
  SET name = EXCLUDED.name,
      is_language = EXCLUDED.is_language,
      is_life_orientation = EXCLUDED.is_life_orientation;
