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
        console.log('Current domain:', window.location.origin);
        console.log('Firebase authDomain:', FIREBASE_CONFIG.authDomain);
        
        // Set auth persistence to LOCAL (default) to persist across page refreshes
        auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch((error) => {
            console.error('Error setting auth persistence:', error);
        });
        
        // Important: Set the language code if needed
        auth.languageCode = 'en';
        
        // Check redirect result in case popup failed and we fell back to redirect
        auth.getRedirectResult().then((result) => {
            if (result.user) {
                console.log('✅ Redirect sign-in successful:', result.user.email);
                resetAllButtonLoadingStates();
            }
        }).catch((error) => {
            // Ignore redirect errors if no redirect happened (normal case)
            if (error.code && error.code !== 'auth/no-auth-event') {
                console.log('ℹ️ No redirect result (normal if using popup)');
            }
        });
        
        // Listen for auth state changes
        // This listener will be called:
        // 1. On initial page load (with current auth state)
        // 2. After redirect completes (with signed-in user)
        // 3. When user signs out manually
        auth.onAuthStateChanged((user) => {
            console.log('=== Auth State Changed ===');
            console.log('User:', user ? user.email : 'null');
            console.log('UID:', user ? user.uid : 'null');
            
            currentUser = user;
            if (user) {
                console.log('✅ User is signed in:', user.email);
                // Reset all button states when signing in
                resetAllButtonLoadingStates();
                showLanding();
            } else {
                console.log('❌ User is signed out');
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

// Language management
let currentLanguage = localStorage.getItem('appLanguage') || 'en'; // 'en' or 'ml'

// Helper function to get text based on language
function getText(obj, fallback = '') {
    if (!obj) return fallback;
    if (typeof obj === 'string') return obj; // Backward compatibility
    return obj[currentLanguage] || obj['en'] || obj['ml'] || fallback;
}

// Update language preference
function setLanguage(lang) {
    if (currentLanguage === lang) {
        // Already in this language, no need to update
        return;
    }
    
    currentLanguage = lang;
    localStorage.setItem('appLanguage', lang);
    updateLanguageToggles();
    
    // Re-render current screen content
    if (currentChallengeQuestions && currentChallengeQuestions.length > 0) {
        // Re-render quiz question to update question text and options
        renderQuizQuestion();
    } else if (selectedQuestions && selectedQuestions.length > 0) {
        // Re-render daily question to update question and answer text
        renderQuestion();
    } else if (challengesList && challengesList.children.length > 0) {
        // Re-fetch and render challenges to update challenge titles/descriptions
        if (viewChallengesButton) {
            viewChallengesButton.click();
        }
    }
}

// Update all language toggle buttons
function updateLanguageToggles() {
    const toggles = document.querySelectorAll('.language-toggle');
    toggles.forEach(toggle => {
        // Always show the current language on the button
        const langCode = toggle.querySelector('.lang-code');
        const langName = toggle.querySelector('.lang-name');
        
        if (langCode) {
            langCode.textContent = currentLanguage.toUpperCase();
        }
        if (langName) {
            langName.textContent = currentLanguage === 'en' ? 'English' : 'മലയാളം';
        }
        
        // The button is always "active" since it shows the current language
        toggle.classList.add('active');
    });
}

// Toggle language
function toggleLanguage() {
    const newLang = currentLanguage === 'en' ? 'ml' : 'en';
    setLanguage(newLang);
}

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

const googleSignInButton = document.getElementById('googleSignInButton');
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
    if (authError) authError.classList.add('hidden');
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
    resetButton(googleSignInButton);
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
async function handleGoogleSignIn() {
    console.log('handleGoogleSignIn called');
    
    if (!auth) {
        const errorMsg = 'Authentication not initialized. Please check Firebase configuration.';
        if (authError) {
            authError.textContent = errorMsg;
            authError.classList.remove('hidden');
        }
        return;
    }
    
    // Check if Google provider is available
    if (typeof firebase === 'undefined' || typeof firebase.auth === 'undefined' || typeof firebase.auth.GoogleAuthProvider === 'undefined') {
        const errorMsg = 'Google Sign-In is not available. Please enable it in Firebase Console.';
        if (authError) {
            authError.textContent = errorMsg;
            authError.classList.remove('hidden');
        }
        console.error('GoogleAuthProvider not available');
        return;
    }
    
    if (!googleSignInButton) {
        console.error('Google sign-in button not found');
        return;
    }
    
    // Hide previous errors and set loading state
    if (authError) authError.classList.add('hidden');
    setButtonLoading(googleSignInButton, true);
    
    const provider = new firebase.auth.GoogleAuthProvider();
    
    // Add scopes if needed
    provider.addScope('profile');
    provider.addScope('email');
    
    try {
        console.log('🔄 Attempting Google sign-in with popup...');
        console.log('Provider:', provider);
        console.log('Auth object:', auth);
        console.log('Current window:', window.location.href);
        console.log('Firebase auth available:', typeof firebase !== 'undefined' && typeof firebase.auth !== 'undefined');
        
        // Use popup for better UX - no page redirect needed
        // Note: Some browsers may open popups as new tabs if popup blocker is active
        // This is a browser behavior, not something we can control
        const result = await auth.signInWithPopup(provider);
        console.log('✅ Google sign-in successful:', result.user.email);
        console.log('✅ Popup closed successfully');
        
        // Reset button state immediately after successful sign-in
        resetAllButtonLoadingStates();
        
        // Auth state listener will handle navigation
        // The popup should have closed automatically after successful authentication
    } catch (error) {
        console.error('❌ Google sign-in popup error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Full error object:', error);
        
        // If popup is blocked or fails, try redirect as fallback
        if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user' || 
            (error.message && error.message.includes('popup'))) {
            console.log('🔄 Popup failed, trying redirect as fallback...');
            try {
                await auth.signInWithRedirect(provider);
                console.log('✅ Redirect initiated - page will redirect to Google');
                // Page will redirect, so no code after this executes
                return;
            } catch (redirectError) {
                console.error('❌ Redirect also failed:', redirectError);
                setButtonLoading(googleSignInButton, false);
                
                if (authError) {
                    authError.textContent = 'Sign-in failed. Please allow popups or try again.';
                    authError.classList.remove('hidden');
                }
                return;
            }
        }
        
        // Reset button on error
        setButtonLoading(googleSignInButton, false);
        
        let errorMessage = 'Failed to sign in with Google';
        
        // Provide more specific error messages
        if (error.code === 'auth/popup-closed-by-user') {
            errorMessage = 'Sign-in was cancelled. Please try again.';
        } else if (error.code === 'auth/popup-blocked') {
            errorMessage = 'Popup was blocked. Please allow popups for this site and try again.';
            console.warn('💡 Tip: Check your browser popup blocker settings');
        } else if (error.code === 'auth/cancelled-popup-request') {
            errorMessage = 'Another sign-in request is in progress. Please wait.';
        } else if (error.code === 'auth/invalid-credential') {
            errorMessage = 'Google Sign-In is not properly configured. Please check Firebase Console settings.';
        } else if (error.code === 'auth/operation-not-allowed') {
            errorMessage = 'Google Sign-In is not enabled. Please enable it in Firebase Console.';
        } else if (error.code && error.code.startsWith('auth/')) {
            errorMessage = `Authentication error: ${error.message || error.code}`;
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        if (authError) {
            authError.textContent = errorMessage;
            authError.classList.remove('hidden');
        }
    }
}

async function handleLogout() {
    console.log('handleLogout called');
    
    if (!auth) {
        console.error('Auth not initialized');
        return;
    }
    
    if (!logoutButton) {
        console.error('Logout button not found');
        return;
    }
    
    setButtonLoading(logoutButton, true, 'Signing out...');
    try {
        console.log('Attempting to sign out...');
        await auth.signOut();
        console.log('Sign out successful');
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
    questionText.textContent = getText(question.question);
    
    // Update answer text
    answerText.textContent = getText(question.answer);
    
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
        
        // Mark current question as completed (use questionId if available, otherwise use id)
        if (currentQuestion) {
            const questionIdToMark = currentQuestion.questionId || currentQuestion.id;
            if (questionIdToMark) {
                await markQuestionCompleted(questionIdToMark);
            }
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
        challengesList.innerHTML = '<p class="message-text">No learning challenges available at the moment.</p>';
        return;
    }
    
    challenges.forEach(challenge => {
        const challengeCard = document.createElement('div');
        challengeCard.className = 'challenge-card';
        challengeCard.innerHTML = `
            <h3 class="challenge-title">${getText(challenge.title)}</h3>
            ${challenge.description ? `<p class="challenge-description">${getText(challenge.description)}</p>` : ''}
            <div class="challenge-meta">
                <span class="challenge-questions">${challenge.questions.length} ${currentLanguage === 'ml' ? 'ചോദ്യങ്ങൾ' : 'questions'}</span>
                ${challenge.estimatedTime ? `<span class="challenge-time">~${challenge.estimatedTime} ${currentLanguage === 'ml' ? 'മിനിറ്റ്' : 'min'}</span>` : ''}
                ${challenge.difficulty ? `<span class="challenge-difficulty ${challenge.difficulty}">${challenge.difficulty}</span>` : ''}
            </div>
            <button class="btn-primary start-challenge-btn" data-challenge-id="${challenge.challengeId}">${currentLanguage === 'ml' ? 'ആരംഭിക്കുക' : 'Start Challenge'}</button>
        `;
        
        const startBtn = challengeCard.querySelector('.start-challenge-btn');
        startBtn.addEventListener('click', () => startChallenge(challenge, startBtn));
        
        challengesList.appendChild(challengeCard);
    });
}

// Helper function to shuffle array (Fisher-Yates algorithm)
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Firebase - Fetch questions from challenges (for daily questions)
async function fetchQuestionsFromFirebase() {
    if (!db) {
        throw new Error('Firebase not initialized. Please configure Firebase.');
    }
    
    try {
        // Fetch all challenges
        const challenges = await fetchChallengesFromFirebase();
        
        // Extract all questions from all challenges
        const allQuestions = [];
        
        challenges.forEach(challenge => {
            if (challenge.questions && Array.isArray(challenge.questions)) {
                challenge.questions.forEach(question => {
                    // Get the correct answer option
                    let correctAnswerText = '';
                    const options = question.options;
                    
                    if (Array.isArray(options)) {
                        // Old format: array of strings
                        correctAnswerText = options[question.correctAnswer] || '';
                    } else if (options && typeof options === 'object') {
                        // New multilingual format: {en: [...], ml: [...]}
                        const langOptions = options[currentLanguage] || options['en'] || options['ml'] || [];
                        if (Array.isArray(langOptions)) {
                            correctAnswerText = langOptions[question.correctAnswer] || '';
                        }
                    }
                    
                    // Get explanation if available
                    const explanation = getText(question.explanation, '');
                    
                    // Create answer text: correct option + explanation (if available)
                    let answerText = correctAnswerText;
                    if (explanation) {
                        answerText = answerText ? `${answerText}. ${explanation}` : explanation;
                    }
                    
                    // Convert challenge question to daily question format
                    allQuestions.push({
                        id: question.questionId || `${challenge.challengeId}_${question.questionId || Math.random()}`,
                        questionId: question.questionId,
                        challengeId: challenge.challengeId,
                        question: question.question, // Can be string or {en: string, ml: string}
                        answer: answerText || getText(question.explanation, 'No answer available'),
                        // Keep original question data for reference
                        originalQuestion: question
                    });
                });
            }
        });
        
        // Shuffle/mix up all questions
        const shuffledQuestions = shuffleArray(allQuestions);
        
        return shuffledQuestions;
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
    return questions.filter(q => {
        // Check both questionId and id for compatibility
        const questionId = q.questionId || q.id;
        return !completedIds.includes(questionId) && !completedIds.includes(q.id);
    });
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
    quizQuestionText.textContent = getText(question.question);
    
    // Clear and render options
    quizOptions.innerHTML = '';
    selectedQuizAnswer = null;
    quizNextButton.classList.add('hidden');
    quizExplanation.classList.add('hidden');
    quizExplanation.textContent = '';
    
    // Handle options - can be array of strings or object with language keys
    let optionsArray = [];
    if (Array.isArray(question.options)) {
        // Old format: array of strings (backward compatibility)
        optionsArray = question.options;
    } else if (question.options && typeof question.options === 'object') {
        // Multilingual format: {en: [...], ml: [...]}
        // Try to get options for current language
        if (question.options[currentLanguage] && Array.isArray(question.options[currentLanguage])) {
            optionsArray = question.options[currentLanguage];
        } else if (question.options['en'] && Array.isArray(question.options['en'])) {
            // Fallback to English
            optionsArray = question.options['en'];
        } else if (question.options['ml'] && Array.isArray(question.options['ml'])) {
            // Fallback to Malayalam
            optionsArray = question.options['ml'];
        } else {
            // Last resort: try to extract any array from the object
            optionsArray = Object.values(question.options).find(val => Array.isArray(val)) || [];
        }
    }
    
    // Render options
    optionsArray.forEach((option, index) => {
        const optionButton = document.createElement('button');
        optionButton.className = 'quiz-option';
        // Options should be strings, but handle multilingual objects just in case
        optionButton.textContent = typeof option === 'string' ? option : (getText(option) || String(option));
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
        quizExplanation.textContent = getText(question.explanation);
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
        completionTitle.textContent = 'Practice Complete!';
    }
    if (completionMessage) {
        completionMessage.textContent = 'Well done! You completed all practice questions. Keep up the great learning!';
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
        completionTitle.textContent = 'Learning Challenge Complete!';
    }
    if (completionMessage) {
        completionMessage.textContent = `You scored ${quizScore} out of ${currentChallengeQuestions.length} (${percentage}%). Excellent work! Keep learning and growing.`;
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
// Logout button handler
if (logoutButton) {
    console.log('Logout button found, attaching event listener');
    logoutButton.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Logout button clicked');
        handleLogout();
    });
} else {
    console.error('logoutButton not found when attaching event listener');
    // Try to attach after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            const btn = document.getElementById('logoutButton');
            if (btn) {
                console.log('Logout button found on DOMContentLoaded, attaching event listener');
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    handleLogout();
                });
            } else {
                console.error('logoutButton still not found after DOMContentLoaded');
            }
        });
    }
}

// Google sign-in button handler
// Try to attach immediately, and also on DOMContentLoaded as fallback
function attachGoogleSignInHandler() {
    const btn = document.getElementById('googleSignInButton');
    if (btn) {
        console.log('✅ Google sign-in button found, attaching event listener');
        // Remove any existing listeners by cloning the button
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        // Attach the event listener to the new button
        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🖱️ Google sign-in button clicked!');
            console.log('Button element:', newBtn);
            console.log('handleGoogleSignIn function:', typeof handleGoogleSignIn);
            handleGoogleSignIn();
        });
        console.log('✅ Event listener attached to Google sign-in button');
        return true;
    } else {
        console.warn('⚠️ googleSignInButton not found yet');
        return false;
    }
}

// Try to attach immediately
if (!attachGoogleSignInHandler()) {
    // Also try on DOMContentLoaded as fallback
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('📄 DOMContentLoaded - trying to attach Google sign-in handler');
            attachGoogleSignInHandler();
        });
    } else {
        // DOM already loaded, try again after a short delay
        setTimeout(() => {
            attachGoogleSignInHandler();
        }, 100);
    }
}

// Start daily questions
if (startQuestionsButton) {
    startQuestionsButton.addEventListener('click', async () => {
        if (!currentUser) {
            showAuth();
            return;
        }
        
        showLoading();
        
        try {
            // Fetch all questions from challenges (already shuffled)
            const allQuestions = await fetchQuestionsFromFirebase();
            
            if (allQuestions.length === 0) {
                showNoContent('No practice questions available. Please add challenges first.');
                return;
            }
            
            // Filter out completed questions for this user
            const availableQuestions = await getAvailableQuestions(allQuestions);
            
            if (availableQuestions.length === 0) {
                showNoContent('You have completed all available practice questions! Great job!');
                return;
            }
            
            // Use all available questions from all challenges
            selectedQuestions = availableQuestions;
            currentQuestionIndex = 0;
            isDailyQuestionsMode = true;
            
            // Render first question
            showContent();
            renderQuestion();
            
        } catch (error) {
            console.error('Error loading questions:', error);
            showNoContent('No questions available for now.');
        }
    });
} else {
    console.warn('startQuestionsButton not found');
}

if (viewChallengesButton) {
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
                showNoContent('No learning challenges available for now.');
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
} else {
    console.warn('viewChallengesButton not found');
}

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
                showNoContent('No learning challenges available for now.');
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

// Language toggle event listeners
function setupLanguageToggles() {
    const toggles = document.querySelectorAll('.language-toggle');
    toggles.forEach(toggle => {
        // Remove any existing listeners by cloning
        const newToggle = toggle.cloneNode(true);
        toggle.parentNode.replaceChild(newToggle, toggle);
        
        newToggle.addEventListener('click', () => {
            // Toggle to the other language
            const newLang = currentLanguage === 'en' ? 'ml' : 'en';
            setLanguage(newLang);
        });
    });
    updateLanguageToggles();
}

// Initialize language on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setupLanguageToggles();
    });
} else {
    setupLanguageToggles();
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
