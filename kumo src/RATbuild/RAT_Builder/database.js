import sqlite3 from "sqlite3";

// Initialize the database connection
let db = new sqlite3.Database("./premium.db", sqlite3.OPEN_READWRITE, (err) => {
  if (err && err.code == "SQLITE_CANTOPEN") {
    console.log("[DATABASE] Database not found, creating a new one...");
    createDatabase();
  } else if (err) {
    console.error("[DATABASE] Error opening database: " + err);
  } else {
    console.log("[DATABASE] Successfully connected to database.");
  }
});

// Function to create the tables if they don't exist
export async function createTables() {
  console.log("[DATABASE] Creating tables if they don't exist...");
  return new Promise(function (resolve, reject) {
    db.exec(
        `CREATE TABLE IF NOT EXISTS premium (
        user_id VARCHAR(255) PRIMARY KEY NOT NULL,
        type VARCHAR(255) NOT NULL,
        expires VARCHAR(255)
      );`,
        (err) => {
          if (err) {
            console.error("[DATABASE] Error creating 'premium' table: ", err);
            return resolve(null);
          }
          console.log("[DATABASE] 'premium' table created or exists.");
        }
    );
    db.exec(
        `CREATE TABLE IF NOT EXISTS webhooks (
        code VARCHAR(255) PRIMARY KEY NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        webhook VARCHAR(255) NOT NULL,
        dhooked BOOLEAN NOT NULL
      );`,
        (err) => {
          if (err) {
            console.error("[DATABASE] Error creating 'webhooks' table: ", err);
          } else {
            console.log("[DATABASE] 'webhooks' table created or exists.");
          }
          return resolve();
        }
    );
  });
}

// Function to fetch a plan for a user
export async function getPlan(interaction, userID) {
  console.log(`[DATABASE] Fetching plan for user ID: ${userID}`);
  return new Promise(function (resolve, reject) {
    db.all(`SELECT * FROM premium WHERE user_id = $1;`, userID, (err, rows) => {
      if (err) {
        console.error("[DATABASE] Error fetching plan:", err);
      }
      rows.forEach(async (row) => {
        if (row.expires != 0 && row.expires < Date.now()) {
          try {
            console.log("[DATABASE] Expiration detected, deleting premium and removing roles...");
            await deletePremium(userID);
            const member = await interaction.guild.members.fetch(userID);
            await member.roles.remove(client.config.tiers[1]);
            await member.roles.remove(client.config.tiers[2]);
            await member.roles.remove(client.config.tiers[3]);
          } catch (err) {
            console.error("[DATABASE] Error while handling expired plan:", err);
          }
          return resolve("tier_0");
        }
        return resolve(row.type);
      });
      return resolve("tier_0");
    });
  });
}

// Function to fetch all premium members
export async function getAllPremiumMembers() {
  console.log("[DATABASE] Fetching all premium members...");
  return new Promise(function (resolve, reject) {
    db.all(`SELECT * FROM premium;`, (err, rows) => {
      if (err) {
        console.error("[DATABASE] Error fetching all premium members:", err);
        return resolve(null);
      }
      console.log(`[DATABASE] Fetched ${rows.length} premium members.`);
      return resolve(rows);
    });
  });
}

// Function to set premium for a user
export async function setPremium(userID, tier, expiration) {
  console.log(`[DATABASE] Setting premium for user ID: ${userID} to tier: ${tier}`);
  return new Promise(function (resolve, reject) {
    db.run(
        `INSERT OR REPLACE INTO premium (user_id, expires, type) VALUES ($1, $2, $3);`,
        [userID, expiration, tier],
        (err) => {
          if (err) {
            console.error("[DATABASE] Error setting premium:", err);
            return resolve(null);
          }
          console.log(`[DATABASE] Premium set for user ID: ${userID} to tier: ${tier}`);
          return resolve(true);
        }
    );
  });
}

// Function to delete a user's premium status
export async function deletePremium(userID) {
  console.log(`[DATABASE] Deleting premium for user ID: ${userID}`);
  return new Promise(function (resolve, reject) {
    db.run(`DELETE FROM premium WHERE user_id = $1;`, userID, (err) => {
      if (err) {
        console.error("[DATABASE] Error deleting premium:", err);
        return resolve(null);
      }
      console.log(`[DATABASE] Premium deleted for user ID: ${userID}`);
      return resolve(true);
    });
  });
}

// Function to fetch all webhooks
export async function getAllWebhooks() {
  console.log("[DATABASE] Fetching all webhooks...");
  return new Promise(function (resolve, reject) {
    db.all(`SELECT * FROM webhooks;`, (err, rows) => {
      if (err) {
        console.error("[DATABASE] Error fetching all webhooks:", err);
      }
      console.log(`[DATABASE] Fetched ${rows.length} webhooks.`);
      return resolve(rows);
    });
  });
}

// Function to fetch webhooks for a specific user
export async function getWebhooks(userID) {
  console.log(`[DATABASE] Fetching webhooks for user ID: ${userID}`);
  return new Promise(function (resolve, reject) {
    db.all(`SELECT * FROM webhooks WHERE user_id = $1;`, userID, (err, rows) => {
      if (err) {
        console.error("[DATABASE] Error fetching webhooks:", err);
      }
      return resolve(rows);
    });
  });
}

// Function to fetch a specific webhook by code
export async function getWebhook(code) {
  console.log(`[DATABASE] Fetching webhook with code: ${code}`);
  return new Promise(function (resolve, reject) {
    db.all(`SELECT * FROM webhooks WHERE code = $1;`, code, (err, rows) => {
      if (err) {
        console.error("[DATABASE] Error fetching webhook:", err);
      }
      rows.forEach((row) => {
        return resolve(row);
      });
      return resolve({ webhook: null, dhooked: true });
    });
  });
}

// Function to fetch a code for a given user and webhook
export async function getCode(userID, webhook) {
  console.log(`[DATABASE] Fetching code for user ID: ${userID} and webhook: ${webhook}`);
  return new Promise(function (resolve, reject) {
    db.all(`SELECT * FROM webhooks WHERE user_id = $1 AND webhook = $2;`, [userID, webhook], (err, rows) => {
      if (err) {
        console.error("[DATABASE] Error fetching code:", err);
      }
      rows.forEach((row) => {
        return resolve(row.code);
      });
      return resolve(null);
    });
  });
}

// Function to set a webhook for a user
export async function setWebhook(userID, code, webhook, dhooked = true) {
  console.log(`[DATABASE] Setting webhook for user ID: ${userID} with code: ${code}`);
  return new Promise(function (resolve, reject) {
    db.run(
        `INSERT OR REPLACE INTO webhooks (code, user_id, webhook, dhooked) VALUES ($1, $2, $3, $4);`,
        [code, userID, webhook, dhooked],
        (err) => {
          if (err) {
            console.error("[DATABASE] Error setting webhook:", err);
          }
          return resolve();
        }
    );
  });
}

// Function to delete a webhook by code
export async function deleteWebhook(code) {
  console.log(`[DATABASE] Deleting webhook with code: ${code}`);
  return new Promise(function (resolve, reject) {
    db.run(`DELETE FROM webhooks WHERE code = $1;`, code, (err) => {
      if (err) {
        console.error("[DATABASE] Error deleting webhook:", err);
        return resolve(null);
      }
      console.log(`[DATABASE] Webhook deleted with code: ${code}`);
      return resolve(true);
    });
  });
}

// Function to create the database if it doesn't exist
function createDatabase() {
  console.log("[DATABASE] Creating new database...");
  db = new sqlite3.Database("./premium.db", (err) => {
    if (err) {
      console.error("[DATABASE] Error creating database: " + err);
    } else {
      console.log("[DATABASE] Database created successfully.");
    }
  });
}
