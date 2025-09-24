// Simplified Auth0 Integration
let auth0Client = null;

async function initAuth0() {
    try {
        // Load Auth0 SDK
        if (!window.auth0) {
            const script = document.createElement('script');
            script.src = 'https://cdn.auth0.com/js/auth0-spa-js/2.1/auth0-spa-js.production.js';
            document.head.appendChild(script);

            await new Promise((resolve, reject) => {
                script.onload = resolve;
                script.onerror = reject;
            });
        }

        // Initialize Auth0
        auth0Client = await window.auth0.createAuth0Client({
            domain: 'dev-0zwsc562k38xp18u.us.auth0.com',
            clientId: 'PRnLJc8MlOKb6fDHWHZlyzsPZcwp7GNR',
            authorizationParams: {
                redirect_uri: window.location.origin
            }
        });

        console.log('Auth0 ready!');

        // Handle callback
        const query = window.location.search;
        if (query.includes('code=') || query.includes('error=')) {
            try {
                await auth0Client.handleRedirectCallback();
                window.history.replaceState({}, document.title, window.location.pathname);
            } catch (error) {
                console.error('Callback error:', error);
            }
        }

        // Check authentication status
        updateUI();

    } catch (error) {
        console.error('Auth0 init failed:', error);
        showError('Authentication service failed to load. Please refresh.');
    }
}

async function updateUI() {
    try {
        const isAuthenticated = await auth0Client.isAuthenticated();

        if (isAuthenticated) {
            const user = await auth0Client.getUser();
            showMainApp(user);
        } else {
            showLoginPrompt();
        }
    } catch (error) {
        console.error('UI update failed:', error);
    }
}

function showMainApp(user) {
    const mainApp = document.getElementById('main-app');
    const userInfo = document.getElementById('user-info');
    const loginPrompt = document.getElementById('login-prompt');
    const userName = document.getElementById('user-name');

    if (mainApp) mainApp.style.display = 'block';
    if (userInfo) userInfo.style.display = 'block';
    if (loginPrompt) loginPrompt.style.display = 'none';
    if (userName) userName.textContent = `Welcome, ${user.name || user.email}`;

    // Load user data
    if (window.subscriptionApp) {
        window.subscriptionApp.loadUserData(user.sub);
    }
}

function showLoginPrompt() {
    const mainApp = document.getElementById('main-app');
    const userInfo = document.getElementById('user-info');
    const loginPrompt = document.getElementById('login-prompt');

    if (mainApp) mainApp.style.display = 'none';
    if (userInfo) userInfo.style.display = 'none';
    if (loginPrompt) loginPrompt.style.display = 'block';
}

async function login() {
    if (!auth0Client) {
        showError('Auth0 not ready. Please wait.');
        return;
    }

    try {
        await auth0Client.loginWithRedirect();
    } catch (error) {
        console.error('Login failed:', error);
        showError('Login failed. Please try again.');
    }
}

async function logout() {
    if (!auth0Client) return;

    try {
        await auth0Client.logout({
            logoutParams: {
                returnTo: window.location.origin
            }
        });
    } catch (error) {
        console.error('Logout failed:', error);
    }
}

function showError(message) {
    alert(message); // Simple error display
}

function getCurrentUser() {
    return auth0Client ? auth0Client.getUser() : null;
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    initAuth0();

    // Bind events
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const logoutBtn = document.getElementById('logout-btn');

    if (loginBtn) loginBtn.addEventListener('click', login);
    if (signupBtn) signupBtn.addEventListener('click', login);
    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    // Make globally available
    window.authSystem = {
        getCurrentUser: getCurrentUser
    };
});

export { initAuth0, login, logout, getCurrentUser };