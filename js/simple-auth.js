// Simplified Email/Password Authentication with Firebase
class SimpleAuth {
  constructor() {
    this.currentUser = null;
    this.initializeAuth();
  }

  async initializeAuth() {
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
    const email = document.getElementById('login-email')?.value.trim();
    const password = document.getElementById('login-password')?.value;

    if (!email || !password) {
      this.showError('Please fill in all fields');
      return;
    }

    this.showLoading('Signing you in...');

    try {
      // Check stored users (in production, this would be Firebase Auth)
      const users = JSON.parse(localStorage.getItem('appUsers') || '{}');
      const user = users[email];

      if (!user) {
        this.hideLoading();
        this.showError('Account not found. Please sign up first.');
        return;
      }

      if (user.password !== password) {
        this.hideLoading();
        this.showError('Invalid password');
        return;
      }

      // Login successful
      this.currentUser = {
        id: user.id,
        name: user.name,
        email: user.email
      };

      localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

      // Update last login in Firebase
      if (window.dbService) {
        await window.dbService.updateUser(user.id, {
          lastLogin: new Date().toISOString()
        });
      }

      this.hideLoading();
      this.hideAuthModal();
      this.showMainApp();
      this.showSuccess(`Welcome back, ${user.name}!`);

    } catch (error) {
      this.hideLoading();
      console.error('Login error:', error);
      this.showError('Login failed. Please try again.');
    }
  }

  async handleSignup() {
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
      // Check if user already exists
      const users = JSON.parse(localStorage.getItem('appUsers') || '{}');
      if (users[email]) {
        this.hideLoading();
        this.showError('An account with this email already exists');
        return;
      }

      // Create new user
      const userId = this.generateUserId();
      const newUser = {
        id: userId,
        name: name,
        email: email,
        password: password,
        createdAt: new Date().toISOString()
      };

      // Store locally
      users[email] = newUser;
      localStorage.setItem('appUsers', JSON.stringify(users));

      // Save to Firebase
      if (window.dbService) {
        await window.dbService.createUser(newUser);
      }

      // Auto login after signup
      this.currentUser = {
        id: userId,
        name: name,
        email: email
      };

      localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

      this.hideLoading();
      this.hideAuthModal();
      this.showMainApp();
      this.showSuccess(`Welcome to action:Track, ${name}!`);

    } catch (error) {
      this.hideLoading();
      console.error('Signup error:', error);
      this.showError('Account creation failed. Please try again.');
    }
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

    if (mainApp) mainApp.style.display = 'block';
    if (userInfo) userInfo.style.display = 'block';
    if (loginPrompt) loginPrompt.style.display = 'none';
    if (userName) userName.textContent = `Welcome, ${this.currentUser.name}`;

    // Initialize or reload user-specific data
    if (window.subscriptionApp) {
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
    if (loginPrompt) loginPrompt.style.display = 'block';
  }

  // Utility functions
  generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
  }

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
  window.authSystem = new SimpleAuth();
});

export { SimpleAuth };