-- Actualiza únicamente las cuentas iniciales que aún usan la clave anterior.
-- Si una cuenta cambió su contraseña después, se respeta ese cambio.
UPDATE usuarios
SET password_hash = crypt('12345678', gen_salt('bf'))
WHERE email IN (
  'admin@upse.edu.ec',
  'cliente@upse.edu.ec',
  'luis.poveda@demo.local',
  'marta.sanchez@demo.local',
  'carlos.ruiz@demo.local',
  'sofia.leon@demo.local',
  'marco.diaz@demo.local',
  'diana.paz@demo.local'
)
AND password_hash = crypt('123456', password_hash);
