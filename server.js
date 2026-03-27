const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory database (replace with actual database in production)
let feedbacks = [];
let courses = [
  { id: 1, name: 'Computer Science 101', instructor: 'Dr. Smith' },
  { id: 2, name: 'Mathematics 201', instructor: 'Prof. Johnson' },
  { id: 3, name: 'Physics 301', instructor: 'Dr. Williams' },
  { id: 4, name: 'Chemistry 101', instructor: 'Prof. Brown' }
];

// Routes

// Get all courses
app.get('/api/courses', (req, res) => {
  res.json(courses);
});

// Submit feedback
app.post('/api/feedback', (req, res) => {
  const { studentName, email, courseId, rating, comments } = req.body;
  
  if (!studentName || !email || !courseId || !rating) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const feedback = {
    id: feedbacks.length + 1,
    studentName,
    email,
    courseId: parseInt(courseId),
    rating: parseInt(rating),
    comments: comments || '',
    timestamp: new Date().toISOString()
  };

  feedbacks.push(feedback);
  res.status(201).json({ message: 'Feedback submitted successfully', feedback });
});

// Get all feedbacks (admin view)
app.get('/api/feedback', (req, res) => {
  const { courseId } = req.query;
  
  let filteredFeedbacks = feedbacks;
  
  if (courseId) {
    filteredFeedbacks = feedbacks.filter(f => f.courseId === parseInt(courseId));
  }

  // Enrich with course information
  const enrichedFeedbacks = filteredFeedbacks.map(feedback => {
    const course = courses.find(c => c.id === feedback.courseId);
    return {
      ...feedback,
      courseName: course?.name,
      instructor: course?.instructor
    };
  });

  res.json(enrichedFeedbacks);
});

// Get feedback statistics
app.get('/api/statistics', (req, res) => {
  const stats = courses.map(course => {
    const courseFeedbacks = feedbacks.filter(f => f.courseId === course.id);
    const totalRatings = courseFeedbacks.reduce((sum, f) => sum + f.rating, 0);
    const averageRating = courseFeedbacks.length > 0 
      ? (totalRatings / courseFeedbacks.length).toFixed(2) 
      : 0;

    return {
      courseId: course.id,
      courseName: course.name,
      instructor: course.instructor,
      totalFeedbacks: courseFeedbacks.length,
      averageRating: parseFloat(averageRating),
      ratings: {
        5: courseFeedbacks.filter(f => f.rating === 5).length,
        4: courseFeedbacks.filter(f => f.rating === 4).length,
        3: courseFeedbacks.filter(f => f.rating === 3).length,
        2: courseFeedbacks.filter(f => f.rating === 2).length,
        1: courseFeedbacks.filter(f => f.rating === 1).length
      }
    };
  });

  res.json(stats);
});

// Delete feedback (admin)
app.delete('/api/feedback/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = feedbacks.findIndex(f => f.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Feedback not found' });
  }

  feedbacks.splice(index, 1);
  res.json({ message: 'Feedback deleted successfully' });
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});