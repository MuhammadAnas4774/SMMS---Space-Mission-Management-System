const pool = require('./backend/src/db');

async function migrate() {
  try {
    console.log("Adding ResetToken and ResetExpires to PERSON table...");
    await pool.query(`
      ALTER TABLE PERSON 
      ADD COLUMN ResetToken VARCHAR(255) NULL,
      ADD COLUMN ResetExpires DATETIME NULL;
    `);
    console.log("Migration successful!");
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log("Columns already exist.");
    } else {
      console.error("Migration failed:", err);
    }
  } finally {
    process.exit();
  }
}

migrate();
