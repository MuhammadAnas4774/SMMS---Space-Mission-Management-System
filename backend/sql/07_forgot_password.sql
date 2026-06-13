-- ================================================================
-- SMMS AUTH EXTENSION: Forgot Password
-- ================================================================
-- Adds ResetToken and ResetExpires columns to PERSON table
-- to enable the forgot password feature.
-- ================================================================

USE smms;

ALTER TABLE PERSON 
  ADD COLUMN ResetToken VARCHAR(255) NULL,
  ADD COLUMN ResetExpires DATETIME NULL;
