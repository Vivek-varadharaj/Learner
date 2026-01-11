// Firebase Configuration is loaded from firebase-config.js
// Make sure firebase-config.js is loaded before this script in index.html

// Initialize Firebase (only if config is provided)
let db = null;
let auth = null;
let currentUser = null;

function initializeFirebase() {
    if (typeof firebase === 'undefined') {
        console.log('Firebase SDK not loaded');
        return;
    }
    
    if (FIREBASE_CONFIG.apiKey === 'YOUR_API_KEY') {
        console.log('Firebase not configured. Logging will be skipped.');
        return;
    }
    
    try {
        firebase.initializeApp(FIREBASE_CONFIG);
        db = firebase.firestore();
        auth = firebase.auth();
        console.log('Firebase initialized successfully');
        
        // Listen for auth state changes
        auth.onAuthStateChanged((user) => {
            currentUser = user;
            if (user) {
                console.log('User signed in:', user.email);
                showLanding();
            } else {
                console.log('User signed out');
                showLogin();
            }
        });
    } catch (error) {
        console.warn('Firebase initialization failed:', error);
    }
}

// Initialize Firebase when page loads (Firebase SDK loads before this script)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFirebase);
} else {
    // DOM already loaded
    setTimeout(initializeFirebase, 100); // Small delay to ensure Firebase SDK is loaded
}

// State management
let currentQuestions = [];
let currentQuestionIndex = 0;
let selectedQuestions = [];

// DOM elements
const loginScreen = document.getElementById('loginScreen');
const signupScreen = document.getElementById('signupScreen');
const landingScreen = document.getElementById('landingScreen');
const loadingScreen = document.getElementById('loadingScreen');
const noContentScreen = document.getElementById('noContentScreen');
const contentScreen = document.getElementById('contentScreen');
const completionScreen = document.getElementById('completionScreen');
const prizeScreen = document.getElementById('prizeScreen');

const loginButton = document.getElementById('loginButton');
const signupButton = document.getElementById('signupButton');
const showSignupButton = document.getElementById('showSignupButton');
const showLoginButton = document.getElementById('showLoginButton');
const logoutButton = document.getElementById('logoutButton');
const startButton = document.getElementById('startButton');
const backToLandingButton1 = document.getElementById('backToLandingButton1');
const backToLandingButton2 = document.getElementById('backToLandingButton2');
const backToLandingButton4 = document.getElementById('backToLandingButton4');
const progressText = document.getElementById('progressText');
const questionText = document.getElementById('questionText');
const answerText = document.getElementById('answerText');
const answerContainer = document.getElementById('answerContainer');
const answerOverlay = document.getElementById('answerOverlay');
const nextButton = document.getElementById('nextButton');
const authError = document.getElementById('authError');
const signupError = document.getElementById('signupError');

const questionContainer = document.querySelector('.question-container');

// Screen management
function hideAllScreens() {
    loginScreen.classList.add('hidden');
    signupScreen.classList.add('hidden');
    landingScreen.classList.add('hidden');
    loadingScreen.classList.add('hidden');
    noContentScreen.classList.add('hidden');
    contentScreen.classList.add('hidden');
    completionScreen.classList.add('hidden');
    prizeScreen.classList.add('hidden');
}

function showLogin() {
    hideAllScreens();
    loginScreen.classList.remove('hidden');
    authError.classList.add('hidden');
}

function showSignup() {
    hideAllScreens();
    signupScreen.classList.remove('hidden');
    signupError.classList.add('hidden');
}

function showLanding() {
    if (!currentUser) {
        showLogin();
        return;
    }
    hideAllScreens();
    landingScreen.classList.remove('hidden');
}

function showLoading() {
    hideAllScreens();
    loadingScreen.classList.remove('hidden');
}

function showNoContent() {
    hideAllScreens();
    noContentScreen.classList.remove('hidden');
}

function showContent() {
    hideAllScreens();
    contentScreen.classList.remove('hidden');
}

function showCompletion() {
    hideAllScreens();
    completionScreen.classList.remove('hidden');
}

function showPrize() {
    hideAllScreens();
    prizeScreen.classList.remove('hidden');
}

// Authentication functions
async function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        authError.textContent = 'Please enter email and password';
        authError.classList.remove('hidden');
        return;
    }
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
        // Auth state listener will handle navigation
    } catch (error) {
        authError.textContent = error.message;
        authError.classList.remove('hidden');
    }
}

async function handleSignup() {
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    
    if (!email || !password) {
        signupError.textContent = 'Please enter email and password';
        signupError.classList.remove('hidden');
        return;
    }
    
    if (password.length < 6) {
        signupError.textContent = 'Password must be at least 6 characters';
        signupError.classList.remove('hidden');
        return;
    }
    
    try {
        await auth.createUserWithEmailAndPassword(email, password);
        // Auth state listener will handle navigation
    } catch (error) {
        signupError.textContent = error.message;
        signupError.classList.remove('hidden');
    }
}

async function handleLogout() {
    try {
        await auth.signOut();
        // Auth state listener will handle navigation
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Firebase - Get user's completed questions
async function getUserCompletedQuestions() {
    if (!db || !currentUser) {
        return [];
    }
    
    try {
        const userCompletionsRef = db.collection('userCompletions').doc(currentUser.uid);
        const doc = await userCompletionsRef.get();
        
        if (doc.exists) {
            const data = doc.data();
            return data.completedQuestionIds || [];
        }
        return [];
    } catch (error) {
        console.error('Error fetching user completions:', error);
        return [];
    }
}

// Firebase - Mark question as completed for user
async function markQuestionCompleted(questionId) {
    if (!db || !currentUser) {
        return;
    }
    
    try {
        const userCompletionsRef = db.collection('userCompletions').doc(currentUser.uid);
        const doc = await userCompletionsRef.get();
        
        if (doc.exists) {
            const data = doc.data();
            const completedIds = data.completedQuestionIds || [];
            if (!completedIds.includes(questionId)) {
                completedIds.push(questionId);
                await userCompletionsRef.update({
                    completedQuestionIds: completedIds,
                    completedCount: firebase.firestore.FieldValue.increment(1),
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        } else {
            await userCompletionsRef.set({
                userId: currentUser.uid,
                email: currentUser.email,
                completedQuestionIds: [questionId],
                completedCount: 1,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        console.log('Question marked as completed for user');
    } catch (error) {
        console.error('Error marking question completed:', error);
    }
}

// Firebase - Get user completion count
async function getUserCompletionCount() {
    if (!db || !currentUser) {
        return 0;
    }
    
    try {
        const userCompletionsRef = db.collection('userCompletions').doc(currentUser.uid);
        const doc = await userCompletionsRef.get();
        
        if (doc.exists) {
            const data = doc.data();
            return data.completedCount || 0;
        }
        return 0;
    } catch (error) {
        console.error('Error fetching completion count:', error);
        return 0;
    }
}

// Firebase - Fetch questions
async function fetchQuestionsFromFirebase() {
    if (!db) {
        throw new Error('Firebase not initialized. Please configure Firebase.');
    }
    
    try {
        const questionsSnapshot = await db.collection('questions').get();
        const questions = [];
        
        questionsSnapshot.forEach(doc => {
            const data = doc.data();
            questions.push({
                id: doc.id,
                date: data.date,
                question: data.question,
                answer: data.answer
            });
        });
        
        return questions;
    } catch (error) {
        console.error('Error fetching questions from Firebase:', error);
        throw error;
    }
}

// Filter questions - exclude completed ones for current user
async function getAvailableQuestions(questions) {
    if (!currentUser) {
        return [];
    }
    
    const completedIds = await getUserCompletedQuestions();
    return questions.filter(q => !completedIds.includes(q.id));
}

// Content rendering
function renderQuestion() {
    if (!selectedQuestions || selectedQuestions.length === 0 || currentQuestionIndex >= selectedQuestions.length) {
        console.error('No question available at index:', currentQuestionIndex);
        return;
    }
    
    const question = selectedQuestions[currentQuestionIndex];
    if (!question) {
        console.error('Question is undefined at index:', currentQuestionIndex);
        return;
    }
    
    // Update progress
    progressText.textContent = `Question ${currentQuestionIndex + 1} of ${selectedQuestions.length}`;
    
    // Update question text
    questionText.textContent = question.question;
    
    // Update answer text
    answerText.textContent = question.answer;
    
    // Reset answer overlay
    answerContainer.classList.remove('revealed');
    nextButton.classList.add('hidden');
    
    // Add fade-in animation (only if not the first question)
    if (questionContainer) {
        questionContainer.classList.remove('fade-out');
        if (currentQuestionIndex > 0) {
            questionContainer.classList.add('fade-in');
            setTimeout(() => {
                questionContainer.classList.remove('fade-in');
            }, 500);
        }
    }
    
    // Reset answer overlay
    isRevealed = false;
}

// Answer reveal interaction
let isRevealed = false;

function revealAnswer() {
    if (isRevealed) return;
    
    isRevealed = true;
    answerContainer.classList.add('revealed');
    
    // Show next button after reveal
    setTimeout(() => {
        nextButton.classList.remove('hidden');
    }, 300);
}

// Handle next question
async function handleNext() {
    const currentQuestion = selectedQuestions[currentQuestionIndex];
    
    // Mark current question as completed
    if (currentQuestion && currentQuestion.id) {
        await markQuestionCompleted(currentQuestion.id);
    }
    
    currentQuestionIndex++;
    
    if (currentQuestionIndex >= selectedQuestions.length) {
        // All questions completed
        await handleAllQuestionsCompleted();
    } else {
        // Render next question
        renderQuestion();
    }
}

async function handleAllQuestionsCompleted() {
    const completionCount = await getUserCompletionCount();
    
    // Check if user reached 25 completions
    if (completionCount >= 25) {
        showPrize();
    } else {
        showCompletion();
    }
}

// Event listeners
loginButton.addEventListener('click', handleLogin);
signupButton.addEventListener('click', handleSignup);
showSignupButton.addEventListener('click', showSignup);
showLoginButton.addEventListener('click', showLogin);
logoutButton.addEventListener('click', handleLogout);

startButton.addEventListener('click', async () => {
    if (!currentUser) {
        showLogin();
        return;
    }
    
    showLoading();
    
    try {
        // Fetch all questions
        const allQuestions = await fetchQuestionsFromFirebase();
        
        // Filter out completed questions for this user
        const availableQuestions = await getAvailableQuestions(allQuestions);
        
        if (availableQuestions.length === 0) {
            showNoContent();
            return;
        }
        
        // Use available questions (show all, or limit to 5, etc.)
        selectedQuestions = availableQuestions.slice(0, 5); // Show up to 5 questions at a time
        currentQuestionIndex = 0;
        
        // Render first question
        showContent();
        renderQuestion();
        
    } catch (error) {
        console.error('Error loading content:', error);
        showNoContent();
    }
});

// Answer overlay click handler
answerOverlay.addEventListener('click', revealAnswer);
answerOverlay.addEventListener('touchend', (e) => {
    e.preventDefault();
    revealAnswer();
});

// Next button handler
nextButton.addEventListener('click', handleNext);

// Back button handlers
backToLandingButton1.addEventListener('click', showLanding);
backToLandingButton2.addEventListener('click', showLanding);
backToLandingButton4.addEventListener('click', showLanding);

// Initial setup - wait for auth state
// Auth state listener handles initial navigation
