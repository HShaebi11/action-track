// Auth0 Authentication System
class Auth0Auth {
  constructor() {
    this.auth0 = null;
    this.currentUser = null;
    this.isLoading = true;
    this.initializeAuth0();
  }

  async initializeAuth0() {
    try {
      // Wait for Auth0 script to load
      await this.loadAuth0Script();

      // Initialize Auth0
      this.auth0 = await window.auth0.createAuth0Client({
        domain: 'dev-0zwsc562k38xp18u.us.auth0.com',
        clientId: 'PRnLJc8MlOKb6fDHWHZlyzsPZcwp7GNR',
        authorizationParams: {
          redirect_uri: window.location.origin
        },
        cacheLocation: 'localstorage' // Persist login across browser sessions
      });

      // Check if user is already authenticated
      const isAuthenticated = await this.auth0.isAuthenticated();

      if (isAuthenticated) {
        this.currentUser = await this.auth0.getUser();
        this.showMainApp();
      } else {
        // Check for authentication callback
        const query = window.location.search;
        if (query.includes('code=') || query.includes('error=')) {
          try {
            await this.auth0.handleRedirectCallback();
            this.currentUser = await this.auth0.getUser();

            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);

            this.showMainApp();
            this.showSuccess(`Welcome back, ${this.currentUser.name || this.currentUser.email}!`);
          } catch (error) {
            console.error('Auth callback error:', error);
            this.showError('Authentication failed. Please try again.');
            this.showLoginPrompt();
          }
        } else {
          this.showLoginPrompt();
        }
      }

      this.isLoading = false;
      this.bindEvents();

    } catch (error) {
      console.error('Auth0 initialization failed:', error);
      this.showError('Authentication service unavailable. Please refresh the page.');
      this.isLoading = false;
    }
  }

  async loadAuth0Script() {
    return new Promise((resolve, reject) => {
      if (window.auth0) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.auth0.com/js/auth0-spa-js/2.1/auth0-spa-js.production.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
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

    loginSubmit?.addEventListener('click', () => this.handleAuth0Login());
    signupSubmit?.addEventListener('click', () => this.handleAuth0Signup());

    // Close modal when clicking outside
    authModal?.addEventListener('click', (e) => {
      if (e.target === authModal) {
        this.hideAuthModal();
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
      this.updateLoginFormForAuth0();
      loginForm.style.display = 'block';
      signupForm.style.display = 'none';
    } else {
      authTitle.textContent = 'Create Account';
      this.updateSignupFormForAuth0();
      loginForm.style.display = 'none';
      signupForm.style.display = 'block';
    }

    authModal.style.display = 'block';
  }

  updateLoginFormForAuth0() {
    const loginForm = document.getElementById('login-form');
    loginForm.innerHTML = `
      <div class="auth0-info">
        <p class="contexual-text" style="font-size: 14px; margin-bottom: 15px;">
          Sign in securely with Auth0 - supports email, Google, GitHub, and more.
        </p>
      </div>
      <div class="button-01" id="login-submit">
        <div class="contexual-text button-text">🔐 Sign In with Auth0</div>
      </div>
      <div class="auth-switch">
        <span class="contexual-text">Don't have an account? </span>
        <span id="switch-to-signup" class="contexual-text" style="cursor: pointer; text-decoration: underline;">Sign Up</span>
      </div>
    `;

    // Re-bind the switch event
    document.getElementById('switch-to-signup')?.addEventListener('click', () => this.switchAuthMode('signup'));
  }

  updateSignupFormForAuth0() {
    const signupForm = document.getElementById('signup-form');
    signupForm.innerHTML = `
      <div class="auth0-info">
        <p class="contexual-text" style="font-size: 14px; margin-bottom: 15px;">
          Create your account with Auth0 - choose from multiple sign-in options.
        </p>
      </div>
      <div class="button-01" id="signup-submit">
        <div class="contexual-text button-text">🚀 Create Account with Auth0</div>
      </div>
      <div class="auth-switch">
        <span class="contexual-text">Already have an account? </span>
        <span id="switch-to-login" class="contexual-text" style="cursor: pointer; text-decoration: underline;">Sign In</span>
      </div>
    `;

    // Re-bind the switch event
    document.getElementById('switch-to-login')?.addEventListener('click', () => this.switchAuthMode('login'));
  }

  hideAuthModal() {
    const authModal = document.getElementById('auth-modal');
    authModal.style.display = 'none';
  }

  switchAuthMode(mode) {
    this.showAuthModal(mode);
  }

  async handleAuth0Login() {
    if (!this.auth0) {
      this.showError('Authentication not ready. Please wait and try again.');
      return;
    }

    try {
      this.showLoading('Redirecting to Auth0...');

      await this.auth0.loginWithRedirect({
        authorizationParams: {
          screen_hint: 'login'
        }
      });

    } catch (error) {
      this.hideLoading();
      console.error('Auth0 login error:', error);
      this.showError('Login failed. Please try again.');
    }
  }

  async handleAuth0Signup() {
    if (!this.auth0) {
      this.showError('Authentication not ready. Please wait and try again.');
      return;
    }

    try {
      this.showLoading('Redirecting to Auth0...');

      await this.auth0.loginWithRedirect({
        authorizationParams: {
          screen_hint: 'signup'
        }
      });

    } catch (error) {
      this.hideLoading();
      console.error('Auth0 signup error:', error);
      this.showError('Signup failed. Please try again.');
    }
  }

  async logout() {
    if (!this.auth0) return;

    try {
      this.showLoading('Signing out...');

      await this.auth0.logout({
        logoutParams: {
          returnTo: window.location.origin
        }
      });

    } catch (error) {
      this.hideLoading();
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

    if (userName && this.currentUser) {
      const displayName = this.currentUser.name || this.currentUser.nickname || this.currentUser.email;
      userName.textContent = `Welcome, ${displayName}`;
    }

    // Initialize or reload user-specific data
    if (window.subscriptionApp && this.currentUser) {
      window.subscriptionApp.loadUserData(this.currentUser.sub); // Auth0 uses 'sub' as user ID
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

  getCurrentUser() {
    return this.currentUser ? {
      id: this.currentUser.sub,
      name: this.currentUser.name || this.currentUser.nickname || this.currentUser.email,
      email: this.currentUser.email,
      picture: this.currentUser.picture
    } : null;
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
    // Cleanup if needed
  }
}

// Add CSS for Auth0 info boxes
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

  .auth0-info {
    background-color: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 5px;
    padding: 15px;
    margin-bottom: 15px;
  }

  .auth0-info p {
    margin: 0;
    color: #495057;
    line-height: 1.4;
  }
`;
document.head.appendChild(style);

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  window.authSystem = new Auth0Auth();
});

export { Auth0Auth };