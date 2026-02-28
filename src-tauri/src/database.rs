use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TrackItem {
    pub id: Option<i64>,
    pub app: String,
    pub task_name: String,
    pub title: String,
    pub url: Option<String>,
    pub domain: Option<String>,
    pub color: Option<String>,
    pub begin_date: i64,
    pub end_date: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSetting {
    pub id: Option<i64>,
    pub name: String,
    pub color: Option<String>,
}

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new(path: &str) -> Result<Self> {
        let conn = Connection::open(path)?;

        // Enable WAL mode for better concurrency
        conn.execute_batch("PRAGMA journal_mode = WAL;")?;

        // Create tables
        conn.execute(
            "CREATE TABLE IF NOT EXISTS track_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                app TEXT NOT NULL,
                task_name TEXT NOT NULL,
                title TEXT NOT NULL,
                url TEXT,
                domain TEXT,
                color TEXT,
                begin_date INTEGER NOT NULL,
                end_date INTEGER NOT NULL
            )",
            [],
        )?;

        // Migration: Add domain column if it doesn't exist (for existing databases)
        let _ = conn.execute("ALTER TABLE track_items ADD COLUMN domain TEXT", []);

        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_track_items_begin_date ON track_items(begin_date)",
            [],
        )?;

        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_track_items_end_date ON track_items(end_date)",
            [],
        )?;

        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_track_items_task_name ON track_items(task_name)",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS app_settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                color TEXT
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                json_data TEXT
            )",
            [],
        )?;

        log::info!("Database initialized at: {}", path);

        Ok(Self { conn })
    }

    /// Find all items for a specific day and task type
    pub fn find_all_day_items(
        &self,
        from: i64,
        to: i64,
        task_name: &str,
    ) -> Result<Vec<TrackItem>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, app, task_name, title, url, domain, color, begin_date, end_date 
             FROM track_items 
             WHERE task_name = ?1 AND end_date > ?2 AND begin_date < ?3
             ORDER BY begin_date ASC",
        )?;

        let items = stmt.query_map(params![task_name, from, to], |row| {
            Ok(TrackItem {
                id: Some(row.get(0)?),
                app: row.get(1)?,
                task_name: row.get(2)?,
                title: row.get(3)?,
                url: row.get(4)?,
                domain: row.get(5)?,
                color: row.get(6)?,
                begin_date: row.get(7)?,
                end_date: row.get(8)?,
            })
        })?;

        let mut result = Vec::new();
        for item in items {
            result.push(item?);
        }

        Ok(result)
    }

    /// Create a new track item
    pub fn create_track_item(&self, item: &TrackItem) -> Result<TrackItem> {
        self.conn.execute(
            "INSERT INTO track_items (app, task_name, title, url, domain, color, begin_date, end_date)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![
                item.app,
                item.task_name,
                item.title,
                item.url,
                item.domain,
                item.color,
                item.begin_date,
                item.end_date,
            ],
        )?;

        let id = self.conn.last_insert_rowid();

        Ok(TrackItem {
            id: Some(id),
            ..item.clone()
        })
    }

    /// Update an existing track item
    pub fn update_track_item(&self, item: &TrackItem) -> Result<TrackItem> {
        if let Some(id) = item.id {
            self.conn.execute(
                "UPDATE track_items 
                 SET app = ?1, task_name = ?2, title = ?3, url = ?4, domain = ?5, color = ?6, begin_date = ?7, end_date = ?8
                 WHERE id = ?9",
                params![
                    item.app,
                    item.task_name,
                    item.title,
                    item.url,
                    item.domain,
                    item.color,
                    item.begin_date,
                    item.end_date,
                    id,
                ],
            )?;
        }

        Ok(item.clone())
    }

    /// Delete track items by IDs
    pub fn delete_by_ids(&self, ids: &[i64]) -> Result<()> {
        for id in ids {
            self.conn
                .execute("DELETE FROM track_items WHERE id = ?1", params![id])?;
        }
        Ok(())
    }

    /// Search track items
    pub fn search_items(
        &self,
        from: i64,
        to: i64,
        task_name: Option<&str>,
        search_str: Option<&str>,
        limit: i64,
        offset: i64,
    ) -> Result<(Vec<TrackItem>, i64)> {
        // Build base query
        let base_sql = "SELECT id, app, task_name, title, url, domain, color, begin_date, end_date 
             FROM track_items WHERE end_date > ? AND begin_date < ?
             ORDER BY begin_date DESC LIMIT ? OFFSET ?";

        let mut stmt = self.conn.prepare(base_sql)?;

        let mut rows = stmt.query(params![from, to, limit, offset])?;

        let mut result = Vec::new();
        while let Some(row) = rows.next()? {
            let item = TrackItem {
                id: Some(row.get(0)?),
                app: row.get(1)?,
                task_name: row.get(2)?,
                title: row.get(3)?,
                url: row.get(4)?,
                domain: row.get(5)?,
                color: row.get(6)?,
                begin_date: row.get(7)?,
                end_date: row.get(8)?,
            };

            // Filter by task_name if provided
            if let Some(tn) = task_name {
                if item.task_name != tn {
                    continue;
                }
            }

            // Filter by search string if provided
            if let Some(s) = search_str {
                if !s.is_empty() {
                    let s_lower = s.to_lowercase();
                    if !item.app.to_lowercase().contains(&s_lower)
                        && !item.title.to_lowercase().contains(&s_lower)
                    {
                        continue;
                    }
                }
            }

            result.push(item);
        }

        let total = result.len() as i64;

        Ok((result, total))
    }

    /// Update track item color
    pub fn update_track_item_color(&self, app_name: &str, color: &str) -> Result<()> {
        // Update existing items
        self.conn.execute(
            "UPDATE track_items SET color = ?1 WHERE app = ?2",
            params![color, app_name],
        )?;

        // Upsert app setting
        self.conn.execute(
            "INSERT INTO app_settings (name, color) VALUES (?1, ?2)
             ON CONFLICT(name) DO UPDATE SET color = ?2",
            params![app_name, color],
        )?;

        Ok(())
    }

    /// Get app color
    pub fn get_app_color(&self, app_name: &str) -> Result<Option<String>> {
        let mut stmt = self
            .conn
            .prepare("SELECT color FROM app_settings WHERE name = ?1")?;

        let result = stmt.query_row(params![app_name], |row| row.get(0));

        match result {
            Ok(color) => Ok(Some(color)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    /// Get application settings
    pub fn get_settings(&self) -> Result<crate::commands::AppSettings> {
        let mut stmt = self
            .conn
            .prepare("SELECT json_data FROM settings WHERE name = 'app_settings'")?;

        let result: std::result::Result<String, _> = stmt.query_row([], |row| row.get(0));

        match result {
            Ok(json) => serde_json::from_str(&json)
                .map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e))),
            Err(rusqlite::Error::QueryReturnedNoRows) => {
                Ok(crate::commands::AppSettings::default())
            }
            Err(e) => Err(e),
        }
    }

    /// Save application settings
    pub fn save_settings(&self, settings: &crate::commands::AppSettings) -> Result<()> {
        let json = serde_json::to_string(settings)
            .map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;

        self.conn.execute(
            "INSERT OR REPLACE INTO settings (id, name, json_data) 
             VALUES ((SELECT id FROM settings WHERE name = 'app_settings'), 'app_settings', ?1)",
            params![json],
        )?;

        Ok(())
    }

    /// Get all tracked apps with their colors and total time
    pub fn get_tracked_apps(&self) -> Result<Vec<crate::commands::TrackedApp>> {
        let mut stmt = self.conn.prepare(
            "SELECT app, color, SUM(end_date - begin_date) as total_time
             FROM track_items
             WHERE task_name = 'AppTrackItem'
             GROUP BY app
             ORDER BY total_time DESC",
        )?;

        let items = stmt.query_map([], |row| {
            Ok(crate::commands::TrackedApp {
                name: row.get(0)?,
                color: row.get(1)?,
                total_time: row.get(2)?,
            })
        })?;

        items.collect()
    }

    /// Clear data before a specific date
    pub fn clear_data_before(&self, before_date: i64) -> Result<i64> {
        let deleted = self.conn.execute(
            "DELETE FROM track_items WHERE end_date < ?1",
            params![before_date],
        )?;

        Ok(deleted as i64)
    }
}
