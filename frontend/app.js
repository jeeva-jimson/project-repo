// API Base URL - change this when deploying
const API_URL = "https://project-repo-32mr.onrender.com";

// State
let courses = [];
let feedbacks = [];
let currentRating = 0;

// DOM Elements
const tabs = document.querySelectorAll('.nav-tab');
const tabContents = document.querySelectorAll('.tab-content');
const feedbackForm = document.getElementById('feedback-form');
const starRating = document.getElementById('star-rating');
const ratingInput = document.getElementById('rating');
const ratingText = document.getElementById('rating-text');
const courseSelect = document.getElementById('courseId');
const filterCourseSelect = document.getElementById('filterCourse');
const feedbacksContainer = document.getElementById('feedbacks-container');
const statisticsContainer = document.getElementById('statistics-container');
const toast = document.getElementById('toast');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadCourses();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    // Tab navigation
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            switchTab(tabName);
        });
    });

    // Star rating
    const stars = starRating.querySelectorAll('.star');
    stars.forEach(star => {
        star.addEventListener('click', () => {
            const rating = parseInt(star.dataset.rating);
            setRating(rating);
        });

        star.addEventListener('mouseenter', () => {
            const rating = parseInt(star.dataset.rating);
            highlightStars(rating);
        });
    });

    starRating.addEventListener('mouseleave', () => {
        highlightStars(currentRating);
    });

    // Form submission
    feedbackForm.addEventListener('submit', handleSubmitFeedback);

    // Filter
    filterCourseSelect.addEventListener('change', loadFeedbacks);
}

// Tab Switching
function switchTab(tabName) {
    tabs.forEach(t => t.classList.remove('active'));
    tabContents.forEach(tc => tc.classList.remove('active'));

    const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
    const activeContent = document.getElementById(`${tabName}-tab`);

    activeTab.classList.add('active');
    activeContent.classList.add('active');

    // Load data when switching tabs
    if (tabName === 'view') {
        loadFeedbacks();
    } else if (tabName === 'stats') {
        loadStatistics();
    }
}

// Star Rating Functions
function setRating(rating) {
    currentRating = rating;
    ratingInput.value = rating;
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
    const texts = {
        1: 'Poor',
        2: 'Fair',
        3: 'Good',
        4: 'Very Good',
        5: 'Excellent'
    };
    ratingText.textContent = texts[rating] || 'Select rating';
}

// API Calls
async function loadCourses() {
    try {
        const response = await fetch(`${API_URL}/api/courses`);
        courses = await response.json();
        populateCourseSelects();
    } catch (error) {
        console.error('Error loading courses:', error);
        showToast('Error loading courses', 'error');
    }
}

function populateCourseSelects() {
    // Populate feedback form dropdown
    courseSelect.innerHTML = '<option value="">-- Choose a course --</option>';
    courses.forEach(course => {
        const option = document.createElement('option');
        option.value = course.id;
        option.textContent = `${course.name} - ${course.instructor}`;
        courseSelect.appendChild(option);
    });

    // Populate filter dropdown
    filterCourseSelect.innerHTML = '<option value="">All Courses</option>';
    courses.forEach(course => {
        const option = document.createElement('option');
        option.value = course.id;
        option.textContent = course.name;
        filterCourseSelect.appendChild(option);
    });
}

async function handleSubmitFeedback(e) {
    e.preventDefault();

    const formData = {
        studentName: document.getElementById('studentName').value,
        email: document.getElementById('email').value,
        courseId: document.getElementById('courseId').value,
        rating: currentRating,
        comments: document.getElementById('comments').value
    };

    if (currentRating === 0) {
        showToast('Please select a rating', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/feedback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            showToast('Feedback submitted successfully!', 'success');
            feedbackForm.reset();
            setRating(0);
            currentRating = 0;
        } else {
            throw new Error('Failed to submit feedback');
        }
    } catch (error) {
        console.error('Error submitting feedback:', error);
        showToast('Error submitting feedback', 'error');
    }
}

async function loadFeedbacks() {
    const courseId = filterCourseSelect.value;
    const url = courseId 
        ? `${API_URL}/api/feedback?courseId=${courseId}`
        : `${API_URL}/api/feedback`;

    try {
        const response = await fetch(url);
        feedbacks = await response.json();
        displayFeedbacks();
    } catch (error) {
        console.error('Error loading feedbacks:', error);
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
                    <h3>${feedback.studentName}</h3>
                    <div class="feedback-course">${feedback.courseName || 'Unknown Course'}</div>
                    <div style="color: var(--text-light); font-size: 0.9rem; margin-top: 0.25rem;">
                        ${feedback.instructor || ''}
                    </div>
                </div>
                <div class="feedback-meta">
                    <div class="feedback-rating">${getStars(feedback.rating)}</div>
                    <div class="feedback-date">${formatDate(feedback.timestamp)}</div>
                </div>
            </div>
            ${feedback.comments ? `
                <div class="feedback-comments">"${feedback.comments}"</div>
            ` : ''}
            <div class="feedback-student">
                ${feedback.email}
            </div>
            <div class="feedback-actions">
                <button class="btn btn-danger" onclick="deleteFeedback(${feedback.id})">
                    Delete
                </button>
            </div>
        </div>
    `).join('');
}

async function deleteFeedback(id) {
    if (!confirm('Are you sure you want to delete this feedback?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/feedback/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showToast('Feedback deleted successfully', 'success');
            loadFeedbacks();
        } else {
            throw new Error('Failed to delete feedback');
        }
    } catch (error) {
        console.error('Error deleting feedback:', error);
        showToast('Error deleting feedback', 'error');
    }
}

async function loadStatistics() {
    try {
        const response = await fetch(`${API_URL}/api/statistics`);
        const stats = await response.json();
        displayStatistics(stats);
    } catch (error) {
        console.error('Error loading statistics:', error);
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

    statisticsContainer.innerHTML = stats.map(stat => {
        const maxRating = Math.max(...Object.values(stat.ratings));
        
        return `
            <div class="stat-card">
                <div class="stat-header">
                    <div class="stat-course">${stat.courseName}</div>
                    <div class="stat-instructor">${stat.instructor}</div>
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
        `;
    }).join('');
}

// Helper Functions
function getStars(rating) {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
}

function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Make deleteFeedback available globally
window.deleteFeedback = deleteFeedback;