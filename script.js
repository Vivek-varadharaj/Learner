// Firebase Configuration is loaded from firebase-config.js
// Make sure firebase-config.js is loaded before this script in index.html

// Initialize Firebase (only if config is provided)
let db = null;
let auth = null;
let currentUser = null;

function initializeFirebase() {
    if (typeof firebase === 'undefined') {
        console.error('Firebase SDK not loaded');
        return;
    }
    
    // Check if FIREBASE_CONFIG is defined
    if (typeof FIREBASE_CONFIG === 'undefined') {
        console.error('firebase-config.js is missing! Make sure it is deployed to GitHub Pages.');
        console.error('See GITHUB_PAGES_DEPLOYMENT.md for instructions.');
        // Show error to user
        const message = document.getElementById('message');
        if (message) {
            message.innerHTML = `
                <h1>Configuration Error</h1>
                <p>Firebase configuration file is missing.</p>
                <p>Please check GITHUB_PAGES_DEPLOYMENT.md for setup instructions.</p>
            `;
        }
        return;
    }
    
    if (FIREBASE_CONFIG.apiKey === 'YOUR_API_KEY' || !FIREBASE_CONFIG.apiKey) {
        console.error('Firebase not configured. Please update firebase-config.js with your Firebase credentials.');
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
                // Reset all button states when signing in
                resetAllButtonLoadingStates();
                showLanding();
            } else {
                console.log('User signed out');
                // Reset all button states when signing out
                resetAllButtonLoadingStates();
                showAuth();
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
// For daily questions (tap-to-reveal)
let selectedQuestions = [];
let currentQuestionIndex = 0;
let isDailyQuestionsMode = false;

// For challenges (multiple choice quiz)
let currentChallenge = null;
let currentChallengeQuestions = [];
let currentQuizQuestionIndex = 0;
let selectedQuizAnswer = null;
let quizScore = 0;

// DOM elements
const authScreen = document.getElementById('authScreen');
const landingScreen = document.getElementById('landingScreen');
const challengesScreen = document.getElementById('challengesScreen');
const quizScreen = document.getElementById('quizScreen');
const loadingScreen = document.getElementById('loadingScreen');
const noContentScreen = document.getElementById('noContentScreen');
const contentScreen = document.getElementById('contentScreen');
const completionScreen = document.getElementById('completionScreen');

const signInTab = document.getElementById('signInTab');
const signUpTab = document.getElementById('signUpTab');
const signInContent = document.getElementById('signInContent');
const signUpContent = document.getElementById('signUpContent');
const loginButton = document.getElementById('loginButton');
const signupButton = document.getElementById('signupButton');
const googleLoginButton = document.getElementById('googleLoginButton');
const googleSignupButton = document.getElementById('googleSignupButton');
const logoutButton = document.getElementById('logoutButton');
const startQuestionsButton = document.getElementById('startQuestionsButton');
const viewChallengesButton = document.getElementById('viewChallengesButton');
const backToLandingFromChallenges = document.getElementById('backToLandingFromChallenges');
const challengesList = document.getElementById('challengesList');
const viewMoreChallengesButton = document.getElementById('viewMoreChallengesButton');
const backToLandingButton1 = document.getElementById('backToLandingButton1');
const backToLandingButton2 = document.getElementById('backToLandingButton2');
const shareScreenshotButton = document.getElementById('shareScreenshotButton');
const completionContent = document.getElementById('completionContent');
const completionIcon = document.getElementById('completionIcon');
const completionTitle = document.getElementById('completionTitle');
const completionMessage = document.getElementById('completionMessage');
const progressText = document.getElementById('progressText');
const questionText = document.getElementById('questionText');
const answerText = document.getElementById('answerText');
const answerContainer = document.getElementById('answerContainer');
const answerOverlay = document.getElementById('answerOverlay');
const nextButton = document.getElementById('nextButton');
const quizProgressText = document.getElementById('quizProgressText');
const quizQuestionText = document.getElementById('quizQuestionText');
const quizOptions = document.getElementById('quizOptions');
const quizNextButton = document.getElementById('quizNextButton');
const quizExplanation = document.getElementById('quizExplanation');
const authError = document.getElementById('authError');
const signupError = document.getElementById('signupError');

const questionContainer = document.querySelector('.question-container');

// Screen management
function hideAllScreens() {
    authScreen.classList.add('hidden');
    landingScreen.classList.add('hidden');
    challengesScreen.classList.add('hidden');
    loadingScreen.classList.add('hidden');
    noContentScreen.classList.add('hidden');
    contentScreen.classList.add('hidden');
    completionScreen.classList.add('hidden');
    if (quizScreen) quizScreen.classList.add('hidden');
}

function showChallenges() {
    hideAllScreens();
    challengesScreen.classList.remove('hidden');
}

function showQuiz() {
    hideAllScreens();
    quizScreen.classList.remove('hidden');
}

function showAuth() {
    hideAllScreens();
    authScreen.classList.remove('hidden');
    // Reset all button loading states when showing auth screen
    resetAllButtonLoadingStates();
    // Clear errors when showing auth screen
    const authError = document.getElementById('authError');
    const signupError = document.getElementById('signupError');
    if (authError) authError.classList.add('hidden');
    if (signupError) signupError.classList.add('hidden');
}

// Tab switching
function switchTab(tabName) {
    // Update tab buttons
    signInTab.classList.toggle('active', tabName === 'signin');
    signUpTab.classList.toggle('active', tabName === 'signup');
    
    // Update tab content
    signInContent.classList.toggle('active', tabName === 'signin');
    signUpContent.classList.toggle('active', tabName === 'signup');
    
    // Clear errors when switching tabs
    const authError = document.getElementById('authError');
    const signupError = document.getElementById('signupError');
    if (authError) authError.classList.add('hidden');
    if (signupError) signupError.classList.add('hidden');
}

function showLanding() {
    if (!currentUser) {
        showAuth();
        return;
    }
    hideAllScreens();
    landingScreen.classList.remove('hidden');
}

function showLoading() {
    hideAllScreens();
    loadingScreen.classList.remove('hidden');
}

function showNoContent(message = 'No content available at the moment.') {
    hideAllScreens();
    noContentScreen.classList.remove('hidden');
    if (noContentMessage) {
        noContentMessage.textContent = message;
    }
}

function showContent() {
    hideAllScreens();
    contentScreen.classList.remove('hidden');
}

function showCompletion() {
    // This function is kept for backward compatibility but should not be used directly
    // Use showDailyQuestionsCompletion() or showChallengeCompletion() instead
    showDailyQuestionsCompletion();
}

// Button loading state utility functions
function setButtonLoading(button, isLoading, loadingText = null) {
    if (!button) return;
    
    if (isLoading) {
        button.disabled = true;
        button.classList.add('loading');
        if (loadingText) {
            button.dataset.originalText = button.textContent;
            button.textContent = loadingText;
        }
    } else {
        button.disabled = false;
        button.classList.remove('loading');
        if (button.dataset.originalText) {
            button.textContent = button.dataset.originalText;
            delete button.dataset.originalText;
        }
    }
}

function resetButton(button) {
    if (!button) return;
    setButtonLoading(button, false);
}

// Reset all button loading states
function resetAllButtonLoadingStates() {
    // Reset authentication buttons
    resetButton(loginButton);
    resetButton(signupButton);
    resetButton(googleLoginButton);
    resetButton(googleSignupButton);
    resetButton(logoutButton);
    
    // Reset navigation buttons
    resetButton(startQuestionsButton);
    resetButton(viewChallengesButton);
    resetButton(viewMoreChallengesButton);
    
    // Reset action buttons
    resetButton(nextButton);
    resetButton(quizNextButton);
    resetButton(shareScreenshotButton);
    
    // Reset all start challenge buttons
    const startChallengeButtons = document.querySelectorAll('.start-challenge-btn');
    startChallengeButtons.forEach(btn => resetButton(btn));
    
    // Reset all quiz option buttons
    const quizOptionButtons = document.querySelectorAll('.quiz-option');
    quizOptionButtons.forEach(btn => {
        if (btn.disabled && !btn.classList.contains('correct') && !btn.classList.contains('incorrect')) {
            btn.disabled = false;
            btn.style.cursor = '';
        }
    });
}



// Authentication functions
async function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        authError.textContent = 'Please enter email and password';
        authError.classList.remove('hidden');
        return;
    }
    
    if (!auth) {
        authError.textContent = 'Authentication not initialized. Please check Firebase configuration.';
        authError.classList.remove('hidden');
        return;
    }
    
    // Hide previous errors and set loading state
    authError.classList.add('hidden');
    setButtonLoading(loginButton, true, 'Signing in...');
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
        // Auth state listener will handle navigation
    } catch (error) {
        // Reset button on error
        setButtonLoading(loginButton, false);
        console.error('Login error:', error);
        
        let errorMessage = 'Failed to sign in';
        
        // Provide user-friendly error messages
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'No account found with this email. Please sign up first.';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = 'Incorrect password. Please try again.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email address. Please check and try again.';
        } else if (error.code === 'auth/user-disabled') {
            errorMessage = 'This account has been disabled. Please contact support.';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Too many failed attempts. Please try again later.';
        } else if (error.code === 'auth/operation-not-allowed') {
            errorMessage = 'Email/Password authentication is not enabled. Please contact support.';
        } else if (error.code === 'auth/network-request-failed') {
            errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        authError.textContent = errorMessage;
        authError.classList.remove('hidden');
    }
}

async function handleSignup() {
    const email = document.getElementById('signupEmail').value.trim();
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
    
    if (!auth) {
        signupError.textContent = 'Authentication not initialized. Please check Firebase configuration.';
        signupError.classList.remove('hidden');
        return;
    }
    
    // Hide previous errors and set loading state
    signupError.classList.add('hidden');
    setButtonLoading(signupButton, true, 'Creating account...');
    
    try {
        await auth.createUserWithEmailAndPassword(email, password);
        // Auth state listener will handle navigation
    } catch (error) {
        // Reset button on error
        setButtonLoading(signupButton, false);
        console.error('Signup error:', error);
        
        let errorMessage = 'Failed to create account';
        
        // Provide user-friendly error messages
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'An account with this email already exists. Please sign in instead.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email address. Please check and try again.';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Password is too weak. Please choose a stronger password.';
        } else if (error.code === 'auth/operation-not-allowed') {
            errorMessage = 'Email/Password authentication is not enabled. Please contact support.';
        } else if (error.code === 'auth/network-request-failed') {
            errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        signupError.textContent = errorMessage;
        signupError.classList.remove('hidden');
    }
}

async function handleGoogleSignIn(isSignup = false) {
    console.log('handleGoogleSignIn called, isSignup:', isSignup);
    
    if (!auth) {
        const errorMsg = 'Authentication not initialized. Please check Firebase configuration.';
        if (authError) authError.textContent = errorMsg;
        if (authError) authError.classList.remove('hidden');
        if (signupError) signupError.textContent = errorMsg;
        if (signupError) signupError.classList.remove('hidden');
        return;
    }
    
    // Check if Google provider is available
    if (typeof firebase === 'undefined' || typeof firebase.auth === 'undefined' || typeof firebase.auth.GoogleAuthProvider === 'undefined') {
        const errorMsg = 'Google Sign-In is not available. Please enable it in Firebase Console.';
        const errorElement = isSignup ? signupError : authError;
        if (errorElement) {
            errorElement.textContent = errorMsg;
            errorElement.classList.remove('hidden');
        }
        console.error('GoogleAuthProvider not available');
        return;
    }
    
    // Determine which button to show loading state for
    const button = isSignup ? googleSignupButton : googleLoginButton;
    const errorElement = isSignup ? signupError : authError;
    
    if (!button) {
        console.error('Google sign-in button not found:', isSignup ? 'googleSignupButton' : 'googleLoginButton');
        return;
    }
    
    // Hide previous errors and set loading state
    if (errorElement) errorElement.classList.add('hidden');
    setButtonLoading(button, true);
    
    const provider = new firebase.auth.GoogleAuthProvider();
    
    // Add scopes if needed
    provider.addScope('profile');
    provider.addScope('email');
    
    try {
        console.log('Attempting Google sign-in...');
        await auth.signInWithPopup(provider);
        console.log('Google sign-in successful');
        // Auth state listener will handle navigation
    } catch (error) {
        // Reset button on error
        setButtonLoading(button, false);
        console.error('Google sign-in error:', error);
        
        let errorMessage = 'Failed to sign in with Google';
        
        // Provide more specific error messages
        if (error.code === 'auth/popup-closed-by-user') {
            errorMessage = 'Sign-in was cancelled. Please try again.';
        } else if (error.code === 'auth/popup-blocked') {
            errorMessage = 'Popup was blocked. Please allow popups and try again.';
        } else if (error.code === 'auth/invalid-credential') {
            errorMessage = 'Google Sign-In is not properly configured. Please check Firebase Console settings.';
        } else if (error.code === 'auth/operation-not-allowed') {
            errorMessage = 'Google Sign-In is not enabled. Please enable it in Firebase Console.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        authError.textContent = errorMessage;
        authError.classList.remove('hidden');
        signupError.textContent = errorMessage;
        signupError.classList.remove('hidden');
    }
}

async function handleLogout() {
    setButtonLoading(logoutButton, true, 'Signing out...');
    try {
        await auth.signOut();
        // Auth state listener will handle navigation and reset button states
    } catch (error) {
        console.error('Logout error:', error);
        setButtonLoading(logoutButton, false);
    }
}

// Firebase - Fetch all challenges
async function fetchChallengesFromFirebase() {
    if (!db) {
        throw new Error('Firebase not initialized. Please configure Firebase.');
    }
    
    try {
        const challengesSnapshot = await db.collection('challenges').get();
        const challenges = [];
        
        challengesSnapshot.forEach(doc => {
            const data = doc.data();
            challenges.push({
                id: doc.id,
                challengeId: data.challengeId || doc.id,
                title: data.title,
                description: data.description || '',
                questions: data.questions || [],
                difficulty: data.difficulty || 'beginner',
                estimatedTime: data.estimatedTime || 0
            });
        });
        
        return challenges;
    } catch (error) {
        console.error('Error fetching challenges from Firebase:', error);
        throw error;
    }
}

// Firebase - Get user's completed challenges
async function getUserCompletedChallenges() {
    if (!db || !currentUser) {
        return [];
    }
    
    try {
        const userChallengesRef = db.collection('userChallenges').doc(currentUser.uid);
        const doc = await userChallengesRef.get();
        
        if (doc.exists) {
            const data = doc.data();
            return data.completedChallengeIds || [];
        }
        return [];
    } catch (error) {
        console.error('Error fetching user challenges:', error);
        return [];
    }
}

// Firebase - Mark challenge as completed
async function markChallengeCompleted(challengeId) {
    if (!db || !currentUser) {
        return;
    }
    
    try {
        const userChallengesRef = db.collection('userChallenges').doc(currentUser.uid);
        const doc = await userChallengesRef.get();
        
        if (doc.exists) {
            const data = doc.data();
            const completedIds = data.completedChallengeIds || [];
            if (!completedIds.includes(challengeId)) {
                await userChallengesRef.update({
                    completedChallengeIds: firebase.firestore.FieldValue.arrayUnion(challengeId),
                    completedCount: firebase.firestore.FieldValue.increment(1),
                    currentChallengeId: null,
                    currentQuestionIndex: 0,
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        } else {
            await userChallengesRef.set({
                userId: currentUser.uid,
                email: currentUser.email,
                completedChallengeIds: [challengeId],
                completedCount: 1,
                currentChallengeId: null,
                currentQuestionIndex: 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        console.log('Challenge marked as completed:', challengeId);
    } catch (error) {
        console.error('Error marking challenge as completed:', error);
    }
}

// Filter challenges - exclude completed ones for current user
async function getAvailableChallenges(challenges) {
    if (!currentUser) {
        return [];
    }
    
    const completedIds = await getUserCompletedChallenges();
    return challenges.filter(c => !completedIds.includes(c.challengeId));
}

// Content rendering (for daily questions)
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

// Handle next question (for daily questions)
async function handleNext() {
    setButtonLoading(nextButton, true, 'Loading...');
    try {
        const currentQuestion = selectedQuestions[currentQuestionIndex];
        
        // Mark current question as completed
        if (currentQuestion && currentQuestion.id) {
            await markQuestionCompleted(currentQuestion.id);
        }
        
        currentQuestionIndex++;
        
        if (currentQuestionIndex >= selectedQuestions.length) {
            // All questions completed
            showDailyQuestionsCompletion();
        } else {
            // Render next question
            renderQuestion();
        }
        setButtonLoading(nextButton, false);
    } catch (error) {
        console.error('Error in handleNext:', error);
        setButtonLoading(nextButton, false);
    }
}

// Render challenges list
function renderChallenges(challenges) {
    challengesList.innerHTML = '';
    
    if (challenges.length === 0) {
        challengesList.innerHTML = '<p class="message-text">No challenges available.</p>';
        return;
    }
    
    challenges.forEach(challenge => {
        const challengeCard = document.createElement('div');
        challengeCard.className = 'challenge-card';
        challengeCard.innerHTML = `
            <h3 class="challenge-title">${challenge.title}</h3>
            ${challenge.description ? `<p class="challenge-description">${challenge.description}</p>` : ''}
            <div class="challenge-meta">
                <span class="challenge-questions">${challenge.questions.length} questions</span>
                ${challenge.estimatedTime ? `<span class="challenge-time">~${challenge.estimatedTime} min</span>` : ''}
                ${challenge.difficulty ? `<span class="challenge-difficulty ${challenge.difficulty}">${challenge.difficulty}</span>` : ''}
            </div>
            <button class="btn-primary start-challenge-btn" data-challenge-id="${challenge.challengeId}">Start Challenge</button>
        `;
        
        const startBtn = challengeCard.querySelector('.start-challenge-btn');
        startBtn.addEventListener('click', () => startChallenge(challenge, startBtn));
        
        challengesList.appendChild(challengeCard);
    });
}

// Firebase - Fetch questions (for daily questions)
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

// Firebase - Get user's completed questions (for daily questions)
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

// Firebase - Mark question as completed (for daily questions)
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
        
        console.log('Question marked as completed:', questionId);
    } catch (error) {
        console.error('Error marking question as completed:', error);
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

// Start a challenge (quiz)
async function startChallenge(challenge, buttonElement = null) {
    // Find the button that was clicked
    const button = buttonElement || document.querySelector(`[data-challenge-id="${challenge.challengeId}"]`);
    
    if (button && button.classList.contains('start-challenge-btn')) {
        setButtonLoading(button, true, 'Loading...');
    }
    
    try {
        currentChallenge = challenge;
        currentChallengeQuestions = challenge.questions || [];
        currentQuizQuestionIndex = 0;
        selectedQuizAnswer = null;
        quizScore = 0;
        
        if (currentChallengeQuestions.length === 0) {
            console.error('Challenge has no questions');
            showNoContent('This challenge has no questions available.');
            if (button) setButtonLoading(button, false);
            return;
        }
        
        showQuiz();
        renderQuizQuestion();
        if (button) setButtonLoading(button, false);
    } catch (error) {
        console.error('Error starting challenge:', error);
        if (button) setButtonLoading(button, false);
    }
}

// Render quiz question
function renderQuizQuestion() {
    if (!currentChallengeQuestions || currentChallengeQuestions.length === 0 || 
        currentQuizQuestionIndex >= currentChallengeQuestions.length) {
        console.error('No quiz question available');
        return;
    }
    
    const question = currentChallengeQuestions[currentQuizQuestionIndex];
    if (!question) {
        console.error('Quiz question is undefined');
        return;
    }
    
    // Update progress
    quizProgressText.textContent = `Question ${currentQuizQuestionIndex + 1} of ${currentChallengeQuestions.length}`;
    
    // Update question text
    quizQuestionText.textContent = question.question;
    
    // Clear and render options
    quizOptions.innerHTML = '';
    selectedQuizAnswer = null;
    quizNextButton.classList.add('hidden');
    quizExplanation.classList.add('hidden');
    quizExplanation.textContent = '';
    
    question.options.forEach((option, index) => {
        const optionButton = document.createElement('button');
        optionButton.className = 'quiz-option';
        optionButton.textContent = option;
        optionButton.dataset.index = index;
        optionButton.addEventListener('click', () => selectQuizAnswer(index, question.correctAnswer));
        quizOptions.appendChild(optionButton);
    });
}

// Handle answer selection
function selectQuizAnswer(selectedIndex, correctIndex) {
    if (selectedQuizAnswer !== null) return; // Already answered
    
    selectedQuizAnswer = selectedIndex;
    const optionButtons = quizOptions.querySelectorAll('.quiz-option');
    
    // Disable all options
    optionButtons.forEach(btn => {
        btn.disabled = true;
        btn.style.cursor = 'not-allowed';
    });
    
    // Mark correct answer (green)
    optionButtons[correctIndex].classList.add('correct');
    
    // Mark selected answer
    if (selectedIndex === correctIndex) {
        optionButtons[selectedIndex].classList.add('correct');
        quizScore++;
    } else {
        optionButtons[selectedIndex].classList.add('incorrect');
    }
    
    // Show explanation if available
    const question = currentChallengeQuestions[currentQuizQuestionIndex];
    if (question.explanation) {
        quizExplanation.textContent = question.explanation;
        quizExplanation.classList.remove('hidden');
    }
    
    // Show next button
    quizNextButton.classList.remove('hidden');
}

// Handle next quiz question
async function handleQuizNext() {
    setButtonLoading(quizNextButton, true, 'Loading...');
    try {
        currentQuizQuestionIndex++;
        
        if (currentQuizQuestionIndex >= currentChallengeQuestions.length) {
            // All questions completed
            if (currentChallenge && currentChallenge.challengeId) {
                await markChallengeCompleted(currentChallenge.challengeId);
            }
            // Show completion with score
            showChallengeCompletion();
        } else {
            // Render next question
            renderQuizQuestion();
        }
        setButtonLoading(quizNextButton, false);
    } catch (error) {
        console.error('Error in handleQuizNext:', error);
        setButtonLoading(quizNextButton, false);
    }
}

// Show daily questions completion
function showDailyQuestionsCompletion() {
    hideAllScreens();
    completionScreen.classList.remove('hidden');
    isDailyQuestionsMode = false;
    
    const viewMoreBtn = document.getElementById('viewMoreChallengesButton');
    const backBtn = document.getElementById('backToLandingButton2');
    const shareBtn = document.getElementById('shareScreenshotButton');
    
    // Set celebratory content
    if (completionIcon) {
        completionIcon.textContent = '✨';
    }
    if (completionTitle) {
        completionTitle.textContent = 'You completed every question!';
    }
    if (completionMessage) {
        completionMessage.textContent = 'Congrats! Share this milestone.';
    }
    
    // Show share button for daily questions
    if (shareBtn) {
        shareBtn.classList.remove('hidden');
    }
    
    // Hide "View More Challenges" button for daily questions
    if (viewMoreBtn) {
        viewMoreBtn.classList.add('hidden');
    }
    
    // Show back button
    if (backBtn) {
        backBtn.classList.remove('hidden');
    }
}

// Show challenge completion
function showChallengeCompletion() {
    hideAllScreens();
    completionScreen.classList.remove('hidden');
    isDailyQuestionsMode = false;
    
    const viewMoreBtn = document.getElementById('viewMoreChallengesButton');
    const backBtn = document.getElementById('backToLandingButton2');
    const shareBtn = document.getElementById('shareScreenshotButton');
    
    // Calculate score and percentage
    const percentage = Math.round((quizScore / currentChallengeQuestions.length) * 100);
    
    // Set celebratory content
    if (completionIcon) {
        completionIcon.textContent = '🎉';
    }
    if (completionTitle) {
        completionTitle.textContent = 'Challenge Complete!';
    }
    if (completionMessage) {
        completionMessage.textContent = `You scored ${quizScore} out of ${currentChallengeQuestions.length} (${percentage}%). Great work! Share this achievement.`;
    }
    
    // Show share button for challenges
    if (shareBtn) {
        shareBtn.classList.remove('hidden');
    }
    
    // Show "View More Challenges" button for challenges
    if (viewMoreBtn) {
        viewMoreBtn.classList.remove('hidden');
    }
    
    // Show back button
    if (backBtn) {
        backBtn.classList.remove('hidden');
    }
}

// Event listeners
signInTab.addEventListener('click', () => switchTab('signin'));
signUpTab.addEventListener('click', () => switchTab('signup'));
loginButton.addEventListener('click', handleLogin);
signupButton.addEventListener('click', handleSignup);
logoutButton.addEventListener('click', handleLogout);

// Google sign-in button handlers - ensure buttons exist before attaching listeners
function attachGoogleSignInHandlers() {
    const loginBtn = document.getElementById('googleLoginButton');
    const signupBtn = document.getElementById('googleSignupButton');
    
    if (loginBtn) {
        console.log('Google login button found, attaching event listener');
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Google login button clicked');
            handleGoogleSignIn(false);
        });
    } else {
        console.error('googleLoginButton not found');
    }

    if (signupBtn) {
        console.log('Google signup button found, attaching event listener');
        signupBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Google signup button clicked');
            handleGoogleSignIn(true);
        });
    } else {
        console.error('googleSignupButton not found');
    }
}

// Attach handlers when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachGoogleSignInHandlers);
} else {
    // DOM already loaded
    attachGoogleSignInHandlers();
}

// Start daily questions
startQuestionsButton.addEventListener('click', async () => {
    if (!currentUser) {
        showAuth();
        return;
    }
    
    showLoading();
    
    try {
        // Fetch all questions
        const allQuestions = await fetchQuestionsFromFirebase();
        
        // Filter out completed questions for this user
        const availableQuestions = await getAvailableQuestions(allQuestions);
        
        if (availableQuestions.length === 0) {
            showNoContent('No questions available for now.');
            return;
        }
        
        // Use all available questions
        selectedQuestions = availableQuestions;
        currentQuestionIndex = 0;
        
        // Render first question
        showContent();
        renderQuestion();
        
    } catch (error) {
        console.error('Error loading questions:', error);
        showNoContent('No questions available for now.');
    }
});

viewChallengesButton.addEventListener('click', async () => {
    if (!currentUser) {
        showAuth();
        return;
    }
    
    showLoading();
    
    try {
        // Fetch all challenges
        const allChallenges = await fetchChallengesFromFirebase();
        
        // Filter out completed challenges for this user
        const availableChallenges = await getAvailableChallenges(allChallenges);
        
        if (availableChallenges.length === 0) {
            showNoContent('No challenges available for now.');
            return;
        }
        
        // Render challenges list
        showChallenges();
        renderChallenges(availableChallenges);
        
    } catch (error) {
        console.error('Error loading challenges:', error);
        showNoContent('No challenges available for now.');
    }
});

if (backToLandingFromChallenges) {
    backToLandingFromChallenges.addEventListener('click', showLanding);
} else {
    console.warn('backToLandingFromChallenges not found');
}

if (viewMoreChallengesButton) {
    viewMoreChallengesButton.addEventListener('click', async () => {
        showLoading();
        
        try {
            const allChallenges = await fetchChallengesFromFirebase();
            const availableChallenges = await getAvailableChallenges(allChallenges);
            
            if (availableChallenges.length === 0) {
                showNoContent('No challenges available for now.');
                return;
            }
            
            showChallenges();
            renderChallenges(availableChallenges);
        } catch (error) {
            console.error('Error loading challenges:', error);
            showNoContent('No challenges available for now.');
        }
    });
} else {
    console.warn('viewMoreChallengesButton not found');
}

// Answer overlay click handler
answerOverlay.addEventListener('click', revealAnswer);
answerOverlay.addEventListener('touchend', (e) => {
    e.preventDefault();
    revealAnswer();
});

// Next button handler (for daily questions)
nextButton.addEventListener('click', handleNext);

// Quiz next button handler
if (quizNextButton) {
    quizNextButton.addEventListener('click', handleQuizNext);
} else {
    console.warn('quizNextButton not found - quiz functionality may not work');
}

// Back button handlers
if (backToLandingButton1) {
    backToLandingButton1.addEventListener('click', () => {
        console.log('backToLandingButton1 clicked');
        showLanding();
    });
} else {
    console.error('backToLandingButton1 not found');
}

if (backToLandingButton2) {
    backToLandingButton2.addEventListener('click', () => {
        console.log('backToLandingButton2 clicked');
        showLanding();
    });
} else {
    console.error('backToLandingButton2 not found');
}

// Screenshot sharing functionality
async function captureAndShareScreenshot() {
    if (!completionContent) {
        console.error('Completion content not found');
        return;
    }

    try {
        // Check if html2canvas is loaded
        if (typeof html2canvas === 'undefined') {
            alert('Screenshot feature not available. Please refresh the page.');
            return;
        }

        // Show loading state
        setButtonLoading(shareScreenshotButton, true, 'Capturing...');

        // Capture the completion content as canvas
        const canvas = await html2canvas(completionContent, {
            backgroundColor: null,
            scale: 2, // Higher quality
            useCORS: true,
            logging: false
        });

        // Convert canvas to blob
        canvas.toBlob(async (blob) => {
            if (!blob) {
                console.error('Failed to create image blob');
                setButtonLoading(shareScreenshotButton, false);
                return;
            }

            // Check if Web Share API is available (mobile devices)
            if (navigator.share && navigator.canShare) {
                try {
                    const file = new File([blob], 'completion.png', { type: 'image/png' });
                    if (navigator.canShare({ files: [file] })) {
                        await navigator.share({
                            files: [file],
                            title: 'Challenge Completed!',
                            text: 'I completed a challenge!'
                        });
                        // Reset button
                        setButtonLoading(shareScreenshotButton, false);
                        return;
                    }
                } catch (shareError) {
                    // If share fails, fall back to download
                    console.log('Share failed, falling back to download:', shareError);
                }
            }
            
            // Desktop: Download the screenshot
            downloadScreenshot(blob);
            
            // Reset button
            setButtonLoading(shareScreenshotButton, false);
        }, 'image/png');
    } catch (error) {
        console.error('Error capturing screenshot:', error);
        alert('Failed to capture screenshot. Please try again.');
        setButtonLoading(shareScreenshotButton, false);
    }
}

function downloadScreenshot(blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `completion-${new Date().toISOString().split('T')[0]}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Share screenshot button handler
if (shareScreenshotButton) {
    shareScreenshotButton.addEventListener('click', captureAndShareScreenshot);
} else {
    console.warn('shareScreenshotButton not found');
}

// Initial setup - wait for auth state
// Auth state listener handles initial navigation
