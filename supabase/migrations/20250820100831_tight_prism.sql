@@ .. @@
 -- Seeding sample data for testing
 -- Insert sample gym owner
 INSERT INTO users (phone_number, password_hash, user_type, full_name, date_of_birth, gender) VALUES
-('9876543210', '$2a$10$example_hash_for_password_123456', 'gym_owner', 'Rajesh Kumar', '1985-05-15', 'Male');
+('+919876543210', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'gym_owner', 'Rajesh Kumar', '1985-05-15', 'Male');
 
 -- Get the gym owner ID
 DO $$
@@ .. @@
 BEGIN
     -- Get owner ID
-    SELECT id INTO owner_uuid FROM users WHERE phone_number = '9876543210';
+    SELECT id INTO owner_uuid FROM users WHERE phone_number = '+919876543210';
     
     -- Insert sample gym
     INSERT INTO gyms (owner_id, gym_name, gym_code, location_latitude, location_longitude, coin_value)
@@ .. @@
     -- Insert sample members
     INSERT INTO users (phone_number, password_hash, user_type, full_name, date_of_birth, gender, height, weight) VALUES
-    ('9876543211', '$2a$10$example_hash_for_password_123456', 'member', 'Priya Sharma', '1995-08-20', 'Female', 165, 58.5),
-    ('9876543212', '$2a$10$example_hash_for_password_123456', 'member', 'Amit Singh', '1992-03-10', 'Male', 175, 70.0),
-    ('9876543213', '$2a$10$example_hash_for_password_123456', 'member', 'Sneha Das', '1998-12-05', 'Female', 160, 55.0);
+    ('+919876543211', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'member', 'Priya Sharma', '1995-08-20', 'Female', 165, 58.5),
+    ('+919876543212', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'member', 'Amit Singh', '1992-03-10', 'Male', 175, 70.0),
+    ('+919876543213', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'member', 'Sneha Das', '1998-12-05', 'Female', 160, 55.0);
     
     -- Get plan ID for memberships
     SELECT id INTO plan_uuid FROM gym_plans WHERE gym_id = gym_uuid AND plan_name = 'Standard' LIMIT 1;