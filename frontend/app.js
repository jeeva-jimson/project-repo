// IMPORTANT: Replace this after Render deployment
const API_URL = "https://your-backend-name.onrender.com";

// State
let courses = [];
let feedbacks = [];
let currentRating = 0;

// DOM Elements
const tabs = document.querySelectorAll('.nav-tab');
const tabContents = document.querySelectorAll('.tab-content');
const feedbackForm = document.getElementById('feedback-form');
const starRating = document.getElementById('star-rating');
const ratingText = document.getElementById('rating-text');
const courseSelect = document.getElementById('courseId');
const filterCourseSelect = document.getElementById('filterCourse');
const feedbacksContainer = document.getElementById('feedbacks-container');
const statisticsContainer = document.getElementById('statistics-container');
const toast = document.getElementById('toast');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadCourses();
});

function setupEventListeners() {
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            switchTab(tab.dataset.tab);
        });
    });

    const stars = starRating.querySelectorAll('.star');

    stars.forEach(star => {
        star.addEventListener('click', () => {
            const rating = parseInt(star.dataset.rating);
            setRating(rating);
        });

        star.addEventListener('mouseenter', () => {
            highlightStars(parseInt(star.dataset.rating));
        });
    });

    starRating.addEventListener('mouseleave', () => {
        highlightStars(currentRating);
    });

    feedbackForm.addEventListener('submit', handleSubmitFeedback);
    filterCourseSelect.addEventListener('change', loadFeedbacks);
}

function switchTab(tabName) {
    tabs.forEach(tab => tab.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));

    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');

    if (tabName === 'view') {
        loadFeedbacks();
    } else if (tabName === 'stats') {
        loadStatistics();
    }
}

function setRating(rating) {
    currentRating = rating;
    highlightStars(rating);
    updateRatingText(rating);
}

function highlightStars(rating) {
    const stars = starRating.querySelectorAll('.star');

    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
            star.textContent = '★';
        } else {
            star.classList.remove('active');
            star.textContent = '☆';
        }
    });
}

function updateRatingText(rating) {
    const labels = {
        1: 'Poor',
        2: 'Fair',
        3: 'Good',
        4: 'Very Good',
        5: 'Excellent'
    };

    ratingText.textContent = labels[rating] || 'Select rating';
}

// Load Courses
async function loadCourses() {
    try {
        const response = await fetch(`${API_URL}/api/courses`);
        if (!response.ok) throw new Error('Failed to load courses');

        courses = await response.json();
        populateCourseSelects();
    } catch (error) {
        console.error(error);
        showToast('Error loading courses', 'error');
    }
}

function populateCourseSelects() {
    courseSelect.innerHTML = '<option value="">-- Choose a course --</option>';
    filterCourseSelect.innerHTML = '<option value="">All Courses</option>';

    courses.forEach(course => {
        const formOption = document.createElement('option');
        formOption.value = course.id;
        formOption.textContent = `${course.name} - ${course.instructor}`;
        courseSelect.appendChild(formOption);

        const filterOption = document.createElement('option');
        filterOption.value = course.id;
        filterOption.textContent = course.name;
        filterCourseSelect.appendChild(filterOption);
    });
}

// Submit Feedback
async function handleSubmitFeedback(e) {
    e.preventDefault();

    if (currentRating === 0) {
        showToast('Please select a rating', 'error');
        return;
    }

    const formData = {
        studentName: document.getElementById('studentName').value.trim(),
        email: document.getElementById('email').value.trim(),
        courseId: document.getElementById('courseId').value,
        rating: currentRating,
        comments: document.getElementById('comments').value.trim()
    };

    try {
        const response = await fetch(`${API_URL}/api/feedback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to submit feedback');
        }

        showToast('Feedback submitted successfully!', 'success');
        feedbackForm.reset();
        currentRating = 0;
        setRating(0);
    } catch (error) {
        console.error(error);
        showToast(error.message, 'error');
    }
}

// Load Feedbacks
async function loadFeedbacks() {
    feedbacksContainer.innerHTML = '<p class="loading">Loading feedbacks...</p>';

    const courseId = filterCourseSelect.value;
    const url = courseId
        ? `${API_URL}/api/feedback?courseId=${courseId}`
        : `${API_URL}/api/feedback`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to load feedbacks');

        feedbacks = await response.json();
        displayFeedbacks();
    } catch (error) {
        console.error(error);
        feedbacksContainer.innerHTML = '<p class="loading">Error loading feedbacks</p>';
    }
}

function displayFeedbacks() {
    if (feedbacks.length === 0) {
        feedbacksContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <h3>No Feedbacks Yet</h3>
                <p>Be the first to submit feedback!</p>
            </div>
        `;
        return;
    }

    feedbacksContainer.innerHTML = feedbacks.map(feedback => `
        <div class="feedback-card">
            <div class="feedback-header">
                <div class="feedback-info">
                    <h3>${escapeHTML(feedback.studentName)}</h3>
                    <div class="feedback-course">${escapeHTML(feedback.courseName)}</div>
                    <div style="color: var(--text-light); font-size: 0.9rem; margin-top: 0.25rem;">
                        ${escapeHTML(feedback.instructor)}
                    </div>
                </div>
                <div class="feedback-meta">
                    <div class="feedback-rating">${getStars(feedback.rating)}</div>
                    <div class="feedback-date">${formatDate(feedback.timestamp)}</div>
                </div>
            </div>
            ${feedback.comments ? `<div class="feedback-comments">"${escapeHTML(feedback.comments)}"</div>` : ''}
            <div class="feedback-student">${escapeHTML(feedback.email)}</div>
            <div class="feedback-actions">
                <button class="btn btn-danger" onclick="deleteFeedback(${feedback.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

// Delete Feedback
async function deleteFeedback(id) {
    if (!confirm('Are you sure you want to delete this feedback?')) return;

    try {
        const response = await fetch(`${API_URL}/api/feedback/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to delete feedback');
        }

        showToast('Feedback deleted successfully', 'success');
        loadFeedbacks();
    } catch (error) {
        console.error(error);
        showToast(error.message, 'error');
    }
}

// Load Statistics
async function loadStatistics() {
    statisticsContainer.innerHTML = '<p class="loading">Loading statistics...</p>';

    try {
        const response = await fetch(`${API_URL}/api/statistics`);
        if (!response.ok) throw new Error('Failed to load statistics');

        const stats = await response.json();
        displayStatistics(stats);
    } catch (error) {
        console.error(error);
        statisticsContainer.innerHTML = '<p class="loading">Error loading statistics</p>';
    }
}

function displayStatistics(stats) {
    if (stats.every(stat => stat.totalFeedbacks === 0)) {
        statisticsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📊</div>
                <h3>No Statistics Available</h3>
                <p>Statistics will appear once feedback is submitted.</p>
            </div>
        `;
        return;
    }

    statisticsContainer.innerHTML = stats.map(stat => `
        <div class="stat-card">
            <div class="stat-header">
                <div class="stat-course">${escapeHTML(stat.courseName)}</div>
                <div class="stat-instructor">${escapeHTML(stat.instructor)}</div>
            </div>
            <div class="stat-metrics">
                <div class="stat-metric">
                    <span class="stat-value">${stat.totalFeedbacks}</span>
                    <span class="stat-label">Feedbacks</span>
                </div>
                <div class="stat-metric">
                    <span class="stat-value">${stat.averageRating}</span>
                    <span class="stat-label">Avg Rating</span>
                </div>
            </div>
            <div class="stat-breakdown">
                ${[5, 4, 3, 2, 1].map(rating => {
                    const count = stat.ratings[rating];
                    const percentage = stat.totalFeedbacks > 0
                        ? (count / stat.totalFeedbacks) * 100
                        : 0;

                    return `
                        <div class="rating-bar">
                            <span class="rating-bar-label">${rating}★</span>
                            <div class="rating-bar-bg">
                                <div class="rating-bar-fill" style="width: ${percentage}%"></div>
                            </div>
                            <span class="rating-bar-count">${count}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `).join('');
}

// Helpers
function getStars(rating) {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function escapeHTML(str) {
    return String(str).replace(/[&<>"']/g, match => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[match]);
}

window.deleteFeedback = deleteFeedback;