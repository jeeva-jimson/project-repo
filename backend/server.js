const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// -----------------------------
// Create tables + seed courses
// -----------------------------
async function initializeDatabase() {
  try {
    // Courses table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        instructor VARCHAR(255) NOT NULL
      );
    `);

    // Feedback table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS feedbacks (
        id SERIAL PRIMARY KEY,
        student_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comments TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed courses only if empty
    const courseCheck = await pool.query(`SELECT COUNT(*) FROM courses`);
    const courseCount = parseInt(courseCheck.rows[0].count);

    if (courseCount === 0) {
      await pool.query(`
        INSERT INTO courses (name, instructor)
        VALUES
          ('Computer Science 101', 'Dr. Oliver'),
          ('Mathematics 201', 'Prof. Rithesh'),
          ('Physics 301', 'Dr. Harshan'),
          ('Chemistry 101', 'Prof. Parth');
      `);

      console.log('Courses seeded successfully');
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// Health route
app.get('/', (req, res) => {
  res.json({ message: 'Student Feedback API running 🚀' });
});

// -----------------------------
// Get all courses
// -----------------------------
app.get('/api/courses', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM courses ORDER BY id ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// -----------------------------
// Submit feedback
// -----------------------------
app.post('/api/feedback', async (req, res) => {
  try {
    const { studentName, email, courseId, rating, comments } = req.body;

    if (!studentName || !email || !courseId || !rating) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const parsedCourseId = parseInt(courseId);
    const parsedRating = parseInt(rating);

    if (parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check course exists
    const courseResult = await pool.query(
      `SELECT * FROM courses WHERE id = $1`,
      [parsedCourseId]
    );

    if (courseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const insertResult = await pool.query(
      `
      INSERT INTO feedbacks (student_name, email, course_id, rating, comments)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
      `,
      [
        studentName.trim(),
        email.trim(),
        parsedCourseId,
        parsedRating,
        comments?.trim() || ''
      ]
    );

    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback: insertResult.rows[0]
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// -----------------------------
// Get all feedbacks
// -----------------------------
app.get('/api/feedback', async (req, res) => {
  try {
    const { courseId } = req.query;

    let query = `
      SELECT
        f.id,
        f.student_name AS "studentName",
        f.email,
        f.course_id AS "courseId",
        f.rating,
        f.comments,
        f.created_at AS "timestamp",
        c.name AS "courseName",
        c.instructor
      FROM feedbacks f
      JOIN courses c ON f.course_id = c.id
    `;

    const values = [];

    if (courseId) {
      query += ` WHERE f.course_id = $1`;
      values.push(parseInt(courseId));
    }

    query += ` ORDER BY f.created_at DESC`;

    const result = await pool.query(query, values);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    res.status(500).json({ error: 'Failed to fetch feedbacks' });
  }
});

// -----------------------------
// Get statistics
// -----------------------------
app.get('/api/statistics', async (req, res) => {
  try {
    const coursesResult = await pool.query(`
      SELECT * FROM courses ORDER BY id ASC
    `);

    const stats = [];

    for (const course of coursesResult.rows) {
      const feedbackResult = await pool.query(
        `
        SELECT rating
        FROM feedbacks
        WHERE course_id = $1
        `,
        [course.id]
      );

      const courseFeedbacks = feedbackResult.rows;
      const totalFeedbacks = courseFeedbacks.length;
      const totalRatings = courseFeedbacks.reduce((sum, f) => sum + f.rating, 0);
      const averageRating =
        totalFeedbacks > 0 ? (totalRatings / totalFeedbacks).toFixed(2) : '0.00';

      stats.push({
        courseId: course.id,
        courseName: course.name,
        instructor: course.instructor,
        totalFeedbacks,
        averageRating: parseFloat(averageRating),
        ratings: {
          5: courseFeedbacks.filter(f => f.rating === 5).length,
          4: courseFeedbacks.filter(f => f.rating === 4).length,
          3: courseFeedbacks.filter(f => f.rating === 3).length,
          2: courseFeedbacks.filter(f => f.rating === 2).length,
          1: courseFeedbacks.filter(f => f.rating === 1).length
        }
      });
    }

    res.json(stats);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// -----------------------------
// Delete feedback
// -----------------------------
app.delete('/api/feedback/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const deleteResult = await pool.query(
      `DELETE FROM feedbacks WHERE id = $1 RETURNING *`,
      [id]
    );

    if (deleteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({ error: 'Failed to delete feedback' });
  }
});

// Start server after DB init
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await initializeDatabase();
});