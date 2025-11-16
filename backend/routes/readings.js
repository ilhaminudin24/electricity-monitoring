const express = require('express');
const router = express.Router();
const db = require('../database/db');

/**
 * POST /api/readings
 * Create a new meter reading
 */
router.post('/', (req, res) => {
  const { reading_kwh, token_amount, token_cost, notes, created_at } = req.body;

  // Validate required field
  if (!reading_kwh || reading_kwh === '') {
    return res.status(400).json({ error: 'reading_kwh is required' });
  }

  // Use provided created_at or current datetime
  const timestamp = created_at || new Date().toISOString().slice(0, 19).replace('T', ' ');

  const sql = `
    INSERT INTO meter_readings (reading_kwh, token_amount, token_cost, notes, created_at)
    VALUES (?, ?, ?, ?, ?)
  `;

  const database = db.getDb();
  database.run(sql, [reading_kwh, token_amount || null, token_cost || null, notes || null, timestamp], function(err) {
    if (err) {
      console.error('Error inserting reading:', err.message);
      return res.status(500).json({ error: 'Failed to save reading' });
    }

    // Fetch the created record
    database.get(
      'SELECT * FROM meter_readings WHERE id = ?',
      [this.lastID],
      (err, row) => {
        if (err) {
          console.error('Error fetching created reading:', err.message);
          return res.status(500).json({ error: 'Reading saved but failed to retrieve' });
        }
        res.status(201).json(row);
      }
    );
  });
});

/**
 * GET /api/readings
 * Get all meter readings (optionally filtered by date range)
 */
router.get('/', (req, res) => {
  const { start_date, end_date } = req.query;
  let sql = 'SELECT * FROM meter_readings ORDER BY created_at DESC';
  const params = [];

  if (start_date && end_date) {
    sql = 'SELECT * FROM meter_readings WHERE created_at BETWEEN ? AND ? ORDER BY created_at DESC';
    params.push(start_date, end_date);
  }

  const database = db.getDb();
  database.all(sql, params, (err, rows) => {
    if (err) {
      console.error('Error fetching readings:', err.message);
      return res.status(500).json({ error: 'Failed to fetch readings' });
    }
    res.json(rows);
  });
});

/**
 * GET /api/readings/latest
 * Get the most recent meter reading
 */
router.get('/latest', (req, res) => {
  const sql = 'SELECT * FROM meter_readings ORDER BY created_at DESC LIMIT 1';

  const database = db.getDb();
  database.get(sql, [], (err, row) => {
    if (err) {
      console.error('Error fetching latest reading:', err.message);
      return res.status(500).json({ error: 'Failed to fetch latest reading' });
    }
    if (!row) {
      return res.status(404).json({ error: 'No readings found' });
    }
    res.json(row);
  });
});

/**
 * GET /api/readings/:id
 * Get a specific reading by ID
 */
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'SELECT * FROM meter_readings WHERE id = ?';

  const database = db.getDb();
  database.get(sql, [id], (err, row) => {
    if (err) {
      console.error('Error fetching reading:', err.message);
      return res.status(500).json({ error: 'Failed to fetch reading' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Reading not found' });
    }
    res.json(row);
  });
});

/**
 * PUT /api/readings/:id
 * Update an existing meter reading
 */
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { reading_kwh, token_amount, token_cost, notes, created_at } = req.body;

  // Validate required field
  if (!reading_kwh || reading_kwh === '') {
    return res.status(400).json({ error: 'reading_kwh is required' });
  }

  // Use provided created_at or keep existing
  const timestamp = created_at || null;

  const sql = timestamp
    ? `UPDATE meter_readings 
       SET reading_kwh = ?, token_amount = ?, token_cost = ?, notes = ?, created_at = ?
       WHERE id = ?`
    : `UPDATE meter_readings 
       SET reading_kwh = ?, token_amount = ?, token_cost = ?, notes = ?
       WHERE id = ?`;

  const params = timestamp
    ? [reading_kwh, token_amount || null, token_cost || null, notes || null, timestamp, id]
    : [reading_kwh, token_amount || null, token_cost || null, notes || null, id];

  const database = db.getDb();
  database.run(sql, params, function(err) {
    if (err) {
      console.error('Error updating reading:', err.message);
      return res.status(500).json({ error: 'Failed to update reading' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Reading not found' });
    }

    // Fetch the updated record
    database.get(
      'SELECT * FROM meter_readings WHERE id = ?',
      [id],
      (err, row) => {
        if (err) {
          console.error('Error fetching updated reading:', err.message);
          return res.status(500).json({ error: 'Reading updated but failed to retrieve' });
        }
        res.json(row);
      }
    );
  });
});

/**
 * DELETE /api/readings/:id
 * Delete a meter reading
 */
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  console.log(`DELETE request received for reading ID: ${id}`);
  
  const sql = 'DELETE FROM meter_readings WHERE id = ?';

  const database = db.getDb();
  database.run(sql, [id], function(err) {
    if (err) {
      console.error('Error deleting reading:', err.message);
      return res.status(500).json({ error: 'Failed to delete reading' });
    }

    if (this.changes === 0) {
      console.log(`Reading with ID ${id} not found`);
      return res.status(404).json({ error: 'Reading not found' });
    }

    console.log(`Reading with ID ${id} deleted successfully`);
    res.json({ message: 'Reading deleted successfully', id: parseInt(id) });
  });
});

module.exports = router;

