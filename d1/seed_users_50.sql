-- Seed 50 Random Users
-- Run with: wrangler d1 execute bitsbarter-staging --remote --file=./d1/seed_users_50.sql

-- User 1
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Kj8mN2pQ', 'alex.martinez@gmail.com', 'alex_martinez', 'google', 1, 0, 0, strftime('%s','now') - (random() % 31536000), 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', 87, 0, strftime('%s','now') - (random() % 31536000), 1, 0);

-- User 2
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Ei0kL3mN', 'sarah.chen@outlook.com', 'sarah_chen', 'google', 0, 0, 0, strftime('%s','now') - (random() % 31536000), 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face', 156, 0, strftime('%s','now') - (random() % 31536000), 1, 0);

-- User 3
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Sw0yZ3aB', 'mike.johnson@yahoo.com', 'mike_j', 'google', 1, 0, 0, strftime('%s','now') - (random() % 31536000), 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', 42, 0, strftime('%s','now') - (random() % 31536000), 1, 0);

-- User 4
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Pq7rT9vX', 'emma.wilson@gmail.com', 'emma_w', 'google', 1, 0, 0, strftime('%s','now') - (random() % 31536000), 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', 193, 0, strftime('%s','now') - (random() % 31536000), 1, 0);

-- User 5
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Hf4gJ6kL', 'david.brown@outlook.com', 'david_brown', 'google', 0, 0, 0, strftime('%s','now') - (random() % 31536000), 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face', 78, 0, strftime('%s','now') - (random() % 31536000), 1, 0);

-- User 6
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Yt2uI8oP', 'lisa.garcia@yahoo.com', 'lisa_g', 'google', 1, 0, 0, strftime('%s','now') - (random() % 31536000), 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face', 134, 0, strftime('%s','now') - (random() % 31536000), 1, 0);

-- User 7
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Wx5cV1nM', 'james.lee@gmail.com', 'james_lee', 'google', 0, 0, 0, strftime('%s','now') - (random() % 31536000), 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', 67, 0, strftime('%s','now') - (random() % 31536000), 1, 0);

-- User 8
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Bq3aR7tY', 'anna.smith@outlook.com', 'anna_smith', 'google', 1, 0, 0, strftime('%s','now') - (random() % 31536000), 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face', 189, 0, strftime('%s','now') - (random() % 31536000), 1, 0);

-- User 9
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Df6hK9lZ', 'robert.taylor@yahoo.com', 'rob_taylor', 'google', 1, 0, 0, strftime('%s','now') - (random() % 31536000), 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', 95, 0, strftime('%s','now') - (random() % 31536000), 1, 0);

-- User 10
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Gm8sN4wQ', 'maria.rodriguez@gmail.com', 'maria_r', 'google', 0, 0, 0, strftime('%s','now') - (random() % 31536000), 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', 112, 0, strftime('%s','now') - (random() % 31536000), 1, 0);

-- User 11
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Jk2lP5xR', 'thomas.anderson@outlook.com', 'tom_anderson', 'google', 1, 0, 0, strftime('%s','now') - (random() % 31536000), 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face', 73, 0, strftime('%s','now') - (random() % 31536000), 1, 0);

-- User 12
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Lq7mS8yT', 'jennifer.white@yahoo.com', 'jen_white', 'google', 1, 0, 0, strftime('%s','now') - (random() % 31536000), 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face', 167, 0, strftime('%s','now') - (random() % 31536000), 1, 0);

-- User 13
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Nw4oU9zA', 'chris.miller@gmail.com', 'chris_m', 'google', 0, 0, 0, strftime('%s','now') - (random() % 31536000), 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', 54, 0, strftime('%s','now') - (random() % 31536000), 1, 0);

-- User 14
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Px6qV1bC', 'rachel.green@outlook.com', 'rachel_g', 'google', 1, 0, 0, strftime('%s','now') - (random() % 31536000), 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face', 145, 0, strftime('%s','now') - (random() % 31536000), 1, 0);

-- User 15
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Rz8sW3dE', 'kevin.davis@yahoo.com', 'kevin_d', 'google', 1, 0, 0, strftime('%s','now') - (random() % 31536000), 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', 88, 0, strftime('%s','now') - (random() % 31536000), 1, 0);

-- User 16
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Ta1uX5fG', 'amanda.clark@gmail.com', 'amanda_c', 'google', 0, 0, 0, strftime('%s','now') - (random() % 31536000), 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', 123, 0, strftime('%s','now') - (random() % 31536000), 1, 0);

-- User 17
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Vb2wY7hI', 'daniel.martin@outlook.com', 'dan_martin', 'google', 1, 0, 0, strftime('%s','now') - (random() % 31536000), 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face', 176, 0, strftime('%s','now') - (random() % 31536000), 1, 0);

-- User 18
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Xc3yZ9jK', 'stephanie.lewis@yahoo.com', 'steph_lewis', 'google', 1, 0, 0, strftime('%s','now') - (random() % 31536000), 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face', 92, 0, strftime('%s','now') - (random() % 31536000), 1, 0);

-- User 19
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Zd4aA1lM', 'michael.walker@gmail.com', 'mike_walker', 'google', 0, 0, 0, strftime('%s','now') - (random() % 31536000), 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', 61, 0, strftime('%s','now') - (random() % 31536000), 1, 0);

-- User 20
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Be5bB3nO', 'jessica.hall@outlook.com', 'jess_hall', 'google', 1, 0, 0, strftime('%s','now') - (random() % 31536000), 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face', 198, 0, strftime('%s','now') - (random() % 31536000), 1, 0);

-- User 21
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Fg6cC5pQ', 'ryan.young@yahoo.com', 'ryan_y', 'google', 1, 0, 0, strftime('%s','now') - (random() % 31536000), 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', 83, 0, strftime('%s','now') - (random() % 31536000), 1, 0);

-- User 22
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Hh7dD7qR', 'nicole.king@gmail.com', 'nicole_k', 'google', 0, 0, 0, strftime('%s','now') - (random() % 31536000), 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', 137, 0, strftime('%s','now') - (random() % 31536000), 1, 0);

-- User 23
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Ji8eE9rS', 'brandon.wright@outlook.com', 'brandon_w', 'google', 1, 0, 0, strftime('%s','now') - (random() % 31536000), 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face', 104, 0, strftime('%s','now') - (random() % 31536000), 1, 0);

-- User 24
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Kj9fF1sT', 'ashley.lopez@yahoo.com', 'ashley_l', 'google', 1, 0, 0, strftime('%s','now') - (random() % 31536000), 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face', 159, 0, strftime('%s','now') - (random() % 31536000), 1, 0);

-- User 25
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Lk0gG3tU', 'jason.hill@gmail.com', 'jason_hill', 'google', 0, 0, 0, strftime('%s','now') - (random() % 31536000), 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', 71, 0, strftime('%s','now') - (random() % 31536000), 1, 0);

-- User 26
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Ml1hH5uV', 'samantha.scott@outlook.com', 'sam_scott', 'google', 1, 0, 0, strftime('%s','now') - (random() % 31536000), 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face', 182, 0, strftime('%s','now') - (random() % 31536000), 1, 0);

-- User 27
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Nm2iI7vW', 'eric.adams@yahoo.com', 'eric_a', 'google', 1, 0, 0, strftime('%s','now') - (random() % 31536000), 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', 96, 0, strftime('%s','now') - (random() % 31536000), 1, 0);

-- User 28
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('On3jJ9wX', 'lauren.baker@gmail.com', 'lauren_b', 'google', 0, 0, 0, strftime('%s','now') - (random() % 31536000), 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', 148, 0, strftime('%s','now') - (random() % 31536000), 1, 0);

-- User 29
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Po4kK1xY', 'justin.gonzalez@outlook.com', 'justin_g', 'google', 1, 0, 0, strftime('%s','now') - (random() % 31536000), 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face', 115, 0, strftime('%s','now') - (random() % 31536000), 1, 0);

-- User 30
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Qp5lL3yZ', 'melissa.nelson@yahoo.com', 'melissa_n', 'google', 1, 0, 0, strftime('%s','now') - (random() % 31536000), 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face', 163, 0, strftime('%s','now') - (random() % 31536000), 1, 0);

-- User 31
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Rq6mM5zA', 'andrew.carter@gmail.com', 'andy_carter', 'google', 0, 0, 0, strftime('%s','now') - (random() % 31536000), 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', 79, 0, strftime('%s','now') - (random() % 31536000), 1, 0);

-- User 32
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Sr7nN7aB', 'rebecca.mitchell@outlook.com', 'becca_m', 'google', 1, 0, 0, strftime('%s','now') - (random() % 31536000), 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face', 191, 0, strftime('%s','now') - (random() % 31536000), 1, 0);

-- User 33
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Ts8oO9bC', 'tyler.roberts@yahoo.com', 'tyler_r', 'google', 1, 0, 0, strftime('%s','now') - (random() % 31536000), 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', 102, 0, strftime('%s','now') - (random() % 31536000), 1, 0);

-- User 34
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Ut9pP1cD', 'victoria.turner@gmail.com', 'vicky_t', 'google', 0, 0, 0, strftime('%s','now') - (random() % 31536000), 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', 126, 0, strftime('%s','now') - (random() % 31536000), 1, 0);

-- User 35
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Vu0qQ3dE', 'nathan.phillips@outlook.com', 'nate_phillips', 'google', 1, 0, 0, strftime('%s','now') - (random() % 31536000), 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face', 89, 0, strftime('%s','now') - (random() % 31536000), 1, 0);

-- User 36
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Wv1rR5eF', 'hannah.campbell@yahoo.com', 'hannah_c', 'google', 1, 0, 0, strftime('%s','now') - (random() % 31536000), 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face', 174, 0, strftime('%s','now') - (random() % 31536000), 1, 0);

-- User 37
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Xw2sS7fG', 'sean.parker@gmail.com', 'sean_p', 'google', 0, 0, 0, strftime('%s','now') - (random() % 31536000), 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', 58, 0, strftime('%s','now') - (random() % 31536000), 1, 0);

-- User 38
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Yx3tT9gH', 'olivia.evans@outlook.com', 'olivia_e', 'google', 1, 0, 0, strftime('%s','now') - (random() % 31536000), 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face', 152, 0, strftime('%s','now') - (random() % 31536000), 1, 0);

-- User 39
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Zy4uU1hI', 'cody.edwards@yahoo.com', 'cody_e', 'google', 1, 0, 0, strftime('%s','now') - (random() % 31536000), 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', 97, 0, strftime('%s','now') - (random() % 31536000), 1, 0);

-- User 40
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Az5vV3iJ', 'sophia.collins@gmail.com', 'sophia_c', 'google', 0, 0, 0, strftime('%s','now') - (random() % 31536000), 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', 141, 0, strftime('%s','now') - (random() % 31536000), 1, 0);

-- User 41
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Ba6wW5jK', 'austin.stewart@outlook.com', 'austin_s', 'google', 1, 0, 0, strftime('%s','now') - (random() % 31536000), 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face', 118, 0, strftime('%s','now') - (random() % 31536000), 1, 0);

-- User 42
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Cb7xX7kL', 'isabella.morris@yahoo.com', 'bella_morris', 'google', 1, 0, 0, strftime('%s','now') - (random() % 31536000), 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face', 185, 0, strftime('%s','now') - (random() % 31536000), 1, 0);

-- User 43
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Dc8yY9lM', 'logan.rogers@gmail.com', 'logan_r', 'google', 0, 0, 0, strftime('%s','now') - (random() % 31536000), 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', 64, 0, strftime('%s','now') - (random() % 31536000), 1, 0);

-- User 44
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Ed9zZ1nO', 'madison.reed@outlook.com', 'maddie_reed', 'google', 1, 0, 0, strftime('%s','now') - (random() % 31536000), 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face', 169, 0, strftime('%s','now') - (random() % 31536000), 1, 0);

-- User 45
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Fe0aA3pQ', 'gavin.cooper@yahoo.com', 'gavin_c', 'google', 1, 0, 0, strftime('%s','now') - (random() % 31536000), 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', 107, 0, strftime('%s','now') - (random() % 31536000), 1, 0);

-- User 46
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Gf1bB5qR', 'chloe.richardson@gmail.com', 'chloe_r', 'google', 0, 0, 0, strftime('%s','now') - (random() % 31536000), 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', 133, 0, strftime('%s','now') - (random() % 31536000), 1, 0);

-- User 47
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Hg2cC7rS', 'owen.cox@outlook.com', 'owen_cox', 'google', 1, 0, 0, strftime('%s','now') - (random() % 31536000), 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face', 91, 0, strftime('%s','now') - (random() % 31536000), 1, 0);

-- User 48
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Ih3dD9sT', 'ava.ward@yahoo.com', 'ava_ward', 'google', 1, 0, 0, strftime('%s','now') - (random() % 31536000), 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face', 157, 0, strftime('%s','now') - (random() % 31536000), 1, 0);

-- User 49
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Ji4eE1tU', 'elijah.torres@gmail.com', 'elijah_t', 'google', 0, 0, 0, strftime('%s','now') - (random() % 31536000), 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', 76, 0, strftime('%s','now') - (random() % 31536000), 1, 0);

-- User 50
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Kj5fF3uV', 'grace.peterson@outlook.com', 'grace_p', 'google', 1, 0, 0, strftime('%s','now') - (random() % 31536000), 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face', 194, 0, strftime('%s','now') - (random() % 31536000), 1, 0);

-- Display results
SELECT '50 USERS SEEDED SUCCESSFULLY' as status;
SELECT COUNT(*) as total_users FROM users;
