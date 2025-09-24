// User Authentication System
class AuthSystem {
  constructor() {
    this.currentUser = null;
    this.users = JSON.parse(localStorage.getItem('users')) || {};
    this.initializeAuth();
  }

  initializeAuth() {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
      this.showMainApp();
    } else {
      this.showLoginPrompt();
    }

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
      if (e.key === 'Enter' && authModal.style.display === 'block') {
        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');

        if (loginForm.style.display !== 'none') {
          this.handleLogin();
        } else if (signupForm.style.display !== 'none') {
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
      authTitle.textContent = 'Sign Up for action:Track';
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
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';

    // Clear signup form
    document.getElementById('signup-name').value = '';
    document.getElementById('signup-email').value = '';
    document.getElementById('signup-password').value = '';
    document.getElementById('signup-confirm').value = '';
  }

  handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
      this.showError('Please fill in all fields');
      return;
    }

    const user = this.users[email];
    if (!user) {
      this.showError('User not found. Please sign up first.');
      return;
    }

    if (user.password !== password) {
      this.showError('Invalid password');
      return;
    }

    // Login successful
    this.currentUser = {
      name: user.name,
      email: user.email,
      id: user.id
    };

    localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    this.hideAuthModal();
    this.showMainApp();
    this.showSuccess(`Welcome back, ${user.name}!`);
  }

  handleSignup() {
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim().toLowerCase();
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm').value;

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

    if (this.users[email]) {
      this.showError('An account with this email already exists');
      return;
    }

    // Create new user
    const userId = Date.now().toString();
    const newUser = {
      id: userId,
      name: name,
      email: email,
      password: password,
      createdAt: new Date().toISOString()
    };

    this.users[email] = newUser;
    localStorage.setItem('users', JSON.stringify(this.users));

    // Auto login after signup
    this.currentUser = {
      name: newUser.name,
      email: newUser.email,
      id: newUser.id
    };

    localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    this.hideAuthModal();
    this.showMainApp();
    this.showSuccess(`Welcome to action:Track, ${name}!`);
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
    this.showLoginPrompt();
    this.hideMainApp();
    this.showSuccess('Logged out successfully');
  }

  showMainApp() {
    const mainApp = document.getElementById('main-app');
    const userInfo = document.getElementById('user-info');
    const loginPrompt = document.getElementById('login-prompt');
    const userName = document.getElementById('user-name');

    mainApp.style.display = 'block';
    userInfo.style.display = 'block';
    loginPrompt.style.display = 'none';
    userName.textContent = `Welcome, ${this.currentUser.name}`;

    // Initialize or reload user-specific data
    if (window.subscriptionApp) {
      window.subscriptionApp.loadUserData(this.currentUser.id);
    }
  }

  hideMainApp() {
    const mainApp = document.getElementById('main-app');
    mainApp.style.display = 'none';
  }

  showLoginPrompt() {
    const userInfo = document.getElementById('user-info');
    const loginPrompt = document.getElementById('login-prompt');

    userInfo.style.display = 'none';
    loginPrompt.style.display = 'block';
  }

  showError(message) {
    // Create or update error message
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
    // Create success notification
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

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  getCurrentUser() {
    return this.currentUser;
  }

  getUserData(key) {
    if (!this.currentUser) return null;
    const userKey = `user_${this.currentUser.id}_${key}`;
    return JSON.parse(localStorage.getItem(userKey) || 'null');
  }

  setUserData(key, data) {
    if (!this.currentUser) return;
    const userKey = `user_${this.currentUser.id}_${key}`;
    localStorage.setItem(userKey, JSON.stringify(data));
  }
}

// Add slide-in animation for success messages
const style = document.createElement('style');
style.textContent = `
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

// Initialize authentication system when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  window.authSystem = new AuthSystem();
});