// Firebase Authentication System
class FirebaseAuth {
  constructor() {
    this.currentUser = null;
    this.auth = null;
    this.unsubscribe = null;
    this.initializeAuth();
  }

  async initializeAuth() {
    // Wait for Firebase to load
    let attempts = 0;
    while (!window.firebaseAuth && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (!window.firebaseAuth) {
      console.error('Firebase Auth not available');
      this.showError('Authentication service unavailable. Please refresh the page.');
      return;
    }

    this.auth = window.firebaseAuth;

    // Listen for authentication state changes
    this.unsubscribe = this.auth.onAuthStateChanged((user) => {
      if (user) {
        // User is signed in
        this.currentUser = {
          id: user.uid,
          name: user.displayName || user.email.split('@')[0],
          email: user.email
        };
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        this.showMainApp();
      } else {
        // User is signed out
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.showLoginPrompt();
      }
    });

    this.bindEvents();
  }

  bindEvents() {
    // Header buttons
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const logoutBtn = document.getElementById('logout-btn');

    // Modal elements
    const authModal = document.getElementById('auth-modal');
    const closeAuth = document.getElementById('close-auth');
    const switchToSignup = document.getElementById('switch-to-signup');
    const switchToLogin = document.getElementById('switch-to-login');

    // Form buttons
    const loginSubmit = document.getElementById('login-submit');
    const signupSubmit = document.getElementById('signup-submit');

    // Event listeners
    loginBtn?.addEventListener('click', () => this.showAuthModal('login'));
    signupBtn?.addEventListener('click', () => this.showAuthModal('signup'));
    logoutBtn?.addEventListener('click', () => this.logout());

    closeAuth?.addEventListener('click', () => this.hideAuthModal());
    switchToSignup?.addEventListener('click', () => this.switchAuthMode('signup'));
    switchToLogin?.addEventListener('click', () => this.switchAuthMode('login'));

    loginSubmit?.addEventListener('click', () => this.handleLogin());
    signupSubmit?.addEventListener('click', () => this.handleSignup());

    // Close modal when clicking outside
    authModal?.addEventListener('click', (e) => {
      if (e.target === authModal) {
        this.hideAuthModal();
      }
    });

    // Enter key submission
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && authModal?.style.display === 'block') {
        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');

        if (loginForm?.style.display !== 'none') {
          this.handleLogin();
        } else if (signupForm?.style.display !== 'none') {
          this.handleSignup();
        }
      }
    });
  }

  showAuthModal(mode = 'login') {
    const authModal = document.getElementById('auth-modal');
    const authTitle = document.getElementById('auth-title');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    if (mode === 'login') {
      authTitle.textContent = 'Login to action:Track';
      loginForm.style.display = 'block';
      signupForm.style.display = 'none';
    } else {
      authTitle.textContent = 'Create Account';
      loginForm.style.display = 'none';
      signupForm.style.display = 'block';
    }

    authModal.style.display = 'block';
    setTimeout(() => {
      const firstInput = mode === 'login' ?
        document.getElementById('login-email') :
        document.getElementById('signup-name');
      firstInput?.focus();
    }, 100);
  }

  hideAuthModal() {
    const authModal = document.getElementById('auth-modal');
    authModal.style.display = 'none';
    this.clearForms();
  }

  switchAuthMode(mode) {
    this.clearForms();
    this.showAuthModal(mode);
  }

  clearForms() {
    // Clear login form
    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');
    if (loginEmail) loginEmail.value = '';
    if (loginPassword) loginPassword.value = '';

    // Clear signup form
    const signupName = document.getElementById('signup-name');
    const signupEmail = document.getElementById('signup-email');
    const signupPassword = document.getElementById('signup-password');
    const signupConfirm = document.getElementById('signup-confirm');
    if (signupName) signupName.value = '';
    if (signupEmail) signupEmail.value = '';
    if (signupPassword) signupPassword.value = '';
    if (signupConfirm) signupConfirm.value = '';
  }

  async handleLogin() {
    if (!this.auth) {
      this.showError('Authentication not ready. Please wait and try again.');
      return;
    }

    const email = document.getElementById('login-email')?.value.trim();
    const password = document.getElementById('login-password')?.value;

    if (!email || !password) {
      this.showError('Please fill in all fields');
      return;
    }

    this.showLoading('Signing you in...');

    try {
      const { signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
      await signInWithEmailAndPassword(this.auth, email, password);

      // Success handled by onAuthStateChanged
      this.hideLoading();
      this.hideAuthModal();
      this.showSuccess('Welcome back!');

    } catch (error) {
      this.hideLoading();
      console.error('Login error:', error);

      let errorMessage = 'Login failed. Please try again.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Account not found. Please sign up first.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      }

      this.showError(errorMessage);
    }
  }

  async handleSignup() {
    if (!this.auth) {
      this.showError('Authentication not ready. Please wait and try again.');
      return;
    }

    const name = document.getElementById('signup-name')?.value.trim();
    const email = document.getElementById('signup-email')?.value.trim().toLowerCase();
    const password = document.getElementById('signup-password')?.value;
    const confirmPassword = document.getElementById('signup-confirm')?.value;

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      this.showError('Please fill in all fields');
      return;
    }

    if (!this.isValidEmail(email)) {
      this.showError('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      this.showError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      this.showError('Passwords do not match');
      return;
    }

    this.showLoading('Creating your account...');

    try {
      const { createUserWithEmailAndPassword, updateProfile } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');

      // Create user
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;

      // Update display name
      await updateProfile(user, {
        displayName: name
      });

      // Save additional user data to Firestore
      if (window.dbService) {
        await window.dbService.createUser({
          id: user.uid,
          name: name,
          email: email,
          createdAt: new Date().toISOString()
        });
      }

      // Success handled by onAuthStateChanged
      this.hideLoading();
      this.hideAuthModal();
      this.showSuccess(`Welcome to action:Track, ${name}!`);

    } catch (error) {
      this.hideLoading();
      console.error('Signup error:', error);

      let errorMessage = 'Account creation failed. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use at least 6 characters.';
      }

      this.showError(errorMessage);
    }
  }

  async logout() {
    if (!this.auth) return;

    try {
      const { signOut } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
      await signOut(this.auth);
      // Success handled by onAuthStateChanged
      this.showSuccess('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      this.showError('Logout failed. Please try again.');
    }
  }

  showMainApp() {
    const mainApp = document.getElementById('main-app');
    const userInfo = document.getElementById('user-info');
    const loginPrompt = document.getElementById('login-prompt');
    const userName = document.getElementById('user-name');

    if (mainApp) mainApp.style.display = 'block';
    if (userInfo) userInfo.style.display = 'block';
    if (loginPrompt) loginPrompt.style.display = 'none';
    if (userName && this.currentUser) userName.textContent = `Welcome, ${this.currentUser.name}`;

    // Initialize or reload user-specific data
    if (window.subscriptionApp && this.currentUser) {
      window.subscriptionApp.loadUserData(this.currentUser.id);
    }
  }

  hideMainApp() {
    const mainApp = document.getElementById('main-app');
    if (mainApp) mainApp.style.display = 'none';
  }

  showLoginPrompt() {
    const userInfo = document.getElementById('user-info');
    const loginPrompt = document.getElementById('login-prompt');

    if (userInfo) userInfo.style.display = 'none';
    if (loginPrompt) {
      loginPrompt.style.display = 'block';
      // Ensure visibility with animation
      if (window.gsap) {
        gsap.fromTo(loginPrompt,
          { opacity: 0, y: -10 },
          { duration: 0.3, opacity: 1, y: 0, ease: "power2.out" }
        );
      }
    }

    console.log('Showing login prompt - user not authenticated');
  }

  // Utility functions
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  getCurrentUser() {
    return this.currentUser;
  }

  // UI Helper Functions
  showError(message) {
    let errorDiv = document.querySelector('.auth-error');
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.className = 'auth-error';
      errorDiv.style.cssText = `
        color: #ff4444;
        text-align: center;
        padding: 10px;
        margin: 10px 0;
        border: 1px solid #ff4444;
        border-radius: 5px;
        background-color: #fff0f0;
        font-size: 12px;
      `;

      const activeForm = document.querySelector('.auth-form:not([style*="display: none"])');
      activeForm?.insertBefore(errorDiv, activeForm.firstChild);
    }

    errorDiv.textContent = message;
    setTimeout(() => errorDiv?.remove(), 5000);
  }

  showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: #4CAF50;
      color: white;
      padding: 15px 20px;
      border-radius: 5px;
      font-family: Ppneuemontrealmono, Arial, sans-serif;
      font-size: 12px;
      z-index: 1001;
      animation: slideInRight 0.3s ease;
    `;
    successDiv.textContent = message;

    document.body.appendChild(successDiv);
    setTimeout(() => successDiv.remove(), 3000);
  }

  showLoading(message) {
    let loadingDiv = document.querySelector('.auth-loading');
    if (!loadingDiv) {
      loadingDiv = document.createElement('div');
      loadingDiv.className = 'auth-loading';
      loadingDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 20px 30px;
        border-radius: 10px;
        font-family: Ppneuemontrealmono, Arial, sans-serif;
        font-size: 14px;
        z-index: 1002;
        text-align: center;
      `;
      document.body.appendChild(loadingDiv);
    }

    loadingDiv.innerHTML = `
      <div style="margin-bottom: 10px;">
        <div style="width: 30px; height: 30px; border: 3px solid #f3f3f3; border-top: 3px solid #4CAF50; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
      </div>
      ${message}
    `;
  }

  hideLoading() {
    const loadingDiv = document.querySelector('.auth-loading');
    if (loadingDiv) {
      loadingDiv.remove();
    }
  }

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}

// Add spinning animation
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes slideInRight {
    from {
      transform: translateX(100px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('Initializing Firebase Auth system...');
  window.authSystem = new FirebaseAuth();

  // Force show login prompt initially if no user is logged in
  setTimeout(() => {
    if (!window.authSystem.currentUser) {
      console.log('No current user - showing login prompt');
      window.authSystem.showLoginPrompt();
    }
  }, 1500);
});

export { FirebaseAuth };