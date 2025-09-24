// Passkey Authentication System using WebAuthn
class PasskeyAuth {
  constructor() {
    this.isSupported = this.checkWebAuthnSupport();
    this.currentUser = null;
    this.initializeAuth();
  }

  checkWebAuthnSupport() {
    return !!(navigator.credentials && navigator.credentials.create && navigator.credentials.get && window.PublicKeyCredential);
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

    loginSubmit?.addEventListener('click', () => this.handlePasskeyLogin());
    signupSubmit?.addEventListener('click', () => this.handlePasskeySignup());

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
      authTitle.textContent = 'Login with Passkey';
      loginForm.style.display = 'block';
      signupForm.style.display = 'none';

      // Update login form for passkey
      this.updateLoginFormForPasskey();
    } else {
      authTitle.textContent = 'Create Account with Passkey';
      signupForm.style.display = 'block';
      loginForm.style.display = 'none';

      // Update signup form for passkey
      this.updateSignupFormForPasskey();
    }

    authModal.style.display = 'block';

    // Show WebAuthn not supported message if needed
    if (!this.isSupported) {
      this.showError('Passkeys are not supported in this browser. Please use a modern browser like Chrome, Safari, or Firefox.');
    }
  }

  updateLoginFormForPasskey() {
    const loginForm = document.getElementById('login-form');
    loginForm.innerHTML = `
      <div class="passkey-info">
        <p class="contexual-text" style="font-size: 14px; margin-bottom: 15px;">
          Use your passkey to sign in securely without passwords.
        </p>
      </div>
      <div class="input-wrapper">
        <div class="contexual-text label">Email (optional):</div>
        <input type="email" id="login-email" class="input" placeholder="Enter your email (helps find your account)">
      </div>
      <div class="button-01" id="login-submit">
        <div class="contexual-text button-text">🔑 Sign in with Passkey</div>
      </div>
      <div class="auth-switch">
        <span class="contexual-text">Don't have an account? </span>
        <span id="switch-to-signup" class="contexual-text" style="cursor: pointer; text-decoration: underline;">Create Account</span>
      </div>
    `;

    // Re-bind the switch event
    document.getElementById('switch-to-signup')?.addEventListener('click', () => this.switchAuthMode('signup'));
  }

  updateSignupFormForPasskey() {
    const signupForm = document.getElementById('signup-form');
    signupForm.innerHTML = `
      <div class="passkey-info">
        <p class="contexual-text" style="font-size: 14px; margin-bottom: 15px;">
          Create a secure passkey for passwordless authentication across all your devices.
        </p>
      </div>
      <div class="input-wrapper">
        <div class="contexual-text label">Name:</div>
        <input type="text" id="signup-name" class="input" placeholder="Enter your full name" required>
      </div>
      <div class="input-wrapper">
        <div class="contexual-text label">Email:</div>
        <input type="email" id="signup-email" class="input" placeholder="Enter your email" required>
      </div>
      <div class="button-01" id="signup-submit">
        <div class="contexual-text button-text">🔑 Create Account with Passkey</div>
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

  async handlePasskeySignup() {
    if (!this.isSupported) {
      this.showError('Passkeys are not supported in this browser.');
      return;
    }

    const name = document.getElementById('signup-name')?.value.trim();
    const email = document.getElementById('signup-email')?.value.trim().toLowerCase();

    if (!name || !email) {
      this.showError('Please fill in all fields');
      return;
    }

    if (!this.isValidEmail(email)) {
      this.showError('Please enter a valid email address');
      return;
    }

    try {
      // Check if user already exists
      const existingUsers = JSON.parse(localStorage.getItem('passkeyUsers') || '{}');
      if (existingUsers[email]) {
        this.showError('An account with this email already exists');
        return;
      }

      this.showLoading('Creating your passkey...');

      // Generate user ID
      const userId = this.generateUserId();

      // Create WebAuthn credential
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: this.generateChallenge(),
          rp: {
            name: "action:Track",
            id: window.location.hostname,
          },
          user: {
            id: new TextEncoder().encode(userId),
            name: email,
            displayName: name,
          },
          pubKeyCredParams: [{alg: -7, type: "public-key"}],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required"
          },
          timeout: 60000,
          attestation: "direct"
        }
      });

      if (credential) {
        // Save user data
        const userData = {
          id: userId,
          name: name,
          email: email,
          credentialId: credential.id,
          publicKey: Array.from(new Uint8Array(credential.response.getPublicKey?.() || [])),
          createdAt: new Date().toISOString()
        };

        // Store locally (in production, this would go to your server)
        existingUsers[email] = userData;
        localStorage.setItem('passkeyUsers', JSON.stringify(existingUsers));

        // Save to Firebase if online
        if (window.dbService) {
          await window.dbService.createUser(userData);
        }

        // Auto login
        this.currentUser = {
          id: userId,
          name: name,
          email: email
        };

        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        this.hideAuthModal();
        this.showMainApp();
        this.hideLoading();
        this.showSuccess(`Welcome to action:Track, ${name}! Your passkey has been created.`);

      }
    } catch (error) {
      this.hideLoading();
      console.error('Passkey creation failed:', error);

      if (error.name === 'NotAllowedError') {
        this.showError('Passkey creation was cancelled or failed. Please try again.');
      } else if (error.name === 'NotSupportedError') {
        this.showError('Your device doesn\'t support passkeys. Please use a different device or browser.');
      } else {
        this.showError('Failed to create passkey. Please try again.');
      }
    }
  }

  async handlePasskeyLogin() {
    if (!this.isSupported) {
      this.showError('Passkeys are not supported in this browser.');
      return;
    }

    try {
      this.showLoading('Authenticating with your passkey...');

      const email = document.getElementById('login-email')?.value.trim().toLowerCase();

      // Get stored credentials
      const existingUsers = JSON.parse(localStorage.getItem('passkeyUsers') || '{}');

      let allowCredentials = [];
      if (email && existingUsers[email]) {
        // Use specific credential if email provided
        allowCredentials = [{
          id: this.base64ToArrayBuffer(existingUsers[email].credentialId),
          type: 'public-key'
        }];
      } else {
        // Allow any stored credential
        allowCredentials = Object.values(existingUsers).map(user => ({
          id: this.base64ToArrayBuffer(user.credentialId),
          type: 'public-key'
        }));
      }

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: this.generateChallenge(),
          allowCredentials: allowCredentials,
          userVerification: "required",
          timeout: 60000
        }
      });

      if (assertion) {
        // Find the user by credential ID
        const credentialId = assertion.id;
        let foundUser = null;

        for (const [userEmail, userData] of Object.entries(existingUsers)) {
          if (userData.credentialId === credentialId) {
            foundUser = userData;
            break;
          }
        }

        if (foundUser) {
          // Login successful
          this.currentUser = {
            id: foundUser.id,
            name: foundUser.name,
            email: foundUser.email
          };

          localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

          // Update last login in Firebase
          if (window.dbService) {
            await window.dbService.updateUser(foundUser.id, {
              lastLogin: new Date().toISOString()
            });
          }

          this.hideAuthModal();
          this.showMainApp();
          this.hideLoading();
          this.showSuccess(`Welcome back, ${foundUser.name}!`);
        } else {
          this.hideLoading();
          this.showError('Passkey not recognized. Please try again or create a new account.');
        }
      }
    } catch (error) {
      this.hideLoading();
      console.error('Passkey authentication failed:', error);

      if (error.name === 'NotAllowedError') {
        this.showError('Authentication was cancelled or failed. Please try again.');
      } else if (error.name === 'InvalidStateError') {
        this.showError('No passkey found. Please create an account first.');
      } else {
        this.showError('Authentication failed. Please try again.');
      }
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

  // Utility functions
  generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
  }

  generateChallenge() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return array;
  }

  base64ToArrayBuffer(base64) {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
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

  .passkey-info {
    background-color: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 5px;
    padding: 15px;
    margin-bottom: 15px;
  }

  .passkey-info p {
    margin: 0;
    color: #495057;
    line-height: 1.4;
  }
`;
document.head.appendChild(style);

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  window.authSystem = new PasskeyAuth();
});

export { PasskeyAuth };