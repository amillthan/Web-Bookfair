-- Create Database if not exists
CREATE DATABASE IF NOT EXISTS Bookfairpro;
USE Bookfairpro;

-- 1. Users / UserProfiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    identity_provider_user_id VARCHAR(255) NOT NULL UNIQUE, -- maps to OIDC 'sub' claim
    username VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    contact_number VARCHAR(50),
    organization_name VARCHAR(100),
    role VARCHAR(50) NOT NULL DEFAULT 'Vendor', -- 'Vendor' or 'Organizer'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index for JIT OIDC user lookup
CREATE INDEX idx_user_idp_id ON user_profiles(identity_provider_user_id);
CREATE INDEX idx_user_email ON user_profiles(email);

-- 2. Exhibitions Table
CREATE TABLE IF NOT EXISTS exhibitions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Reservations Table
CREATE TABLE IF NOT EXISTS reservations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    vendor_user_id BIGINT NOT NULL,
    exhibition_id BIGINT NOT NULL,
    reservation_date DATE NOT NULL,
    stall_type VARCHAR(50) NOT NULL, -- 'Standard', 'Premium', 'Corner Stall'
    stall_size VARCHAR(50) NOT NULL, -- 'Small', 'Medium', 'Large'
    number_of_stalls INT NOT NULL,
    business_category VARCHAR(100) NOT NULL, -- 'Food & Beverage', 'Clothing', 'Electronics', etc.
    special_requirements TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected', 'Cancelled'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_reservation_vendor FOREIGN KEY (vendor_user_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_reservation_exhibition FOREIGN KEY (exhibition_id) REFERENCES exhibitions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for performance and resource authorization
CREATE INDEX idx_reservation_vendor_id ON reservations(vendor_user_id);
CREATE INDEX idx_reservation_exhibition_id ON reservations(exhibition_id);
CREATE INDEX idx_reservation_status ON reservations(status);

-- Seed Sample Exhibitions
INSERT INTO exhibitions (name, description, event_date, is_active) VALUES
('Colombo International Trade Exhibition', 'The premier international trade exhibition in Colombo showcasing global businesses.', '2026-10-15', TRUE),
('Sri Lanka Business Expo', 'Connecting local entrepreneurs and SMEs with national corporations and investors.', '2026-11-20', TRUE),
('Technology & Innovation Expo', 'Showcasing the latest in tech advancements, software, and electronic hardware.', '2026-12-05', TRUE),
('Food & Beverage Exhibition', 'A culinary gathering highlighting organic foods, agricultural products, and dining equipment.', '2027-01-18', TRUE),
('Handicraft Exhibition', 'Celebrating traditional crafts, home decor, apparel, and handmade items from Sri Lanka.', '2027-02-10', TRUE);

-- Seed Sample User Profiles for local development testing
-- These represent users that would log in via OIDC, mapped to their mock sub IDs.
INSERT INTO user_profiles (identity_provider_user_id, username, name, email, contact_number, organization_name, role) VALUES
('auth0|mock-vendor-id-123', 'vendor1', 'John Doe', 'vendor@bookfair.com', '+94771234567', 'Doe Publishers Ltd', 'Vendor'),
('auth0|mock-organizer-id-456', 'organizer1', 'Jane Smith', 'organizer@bookfair.com', '+94777654321', 'CIBF Committee', 'Organizer');
