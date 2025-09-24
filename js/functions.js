// action:Track Redesigned Application
class ActionTrackApp {
  constructor() {
    this.subscriptions = [];
    this.monthlyIncome = 0;
    this.currentUser = null;
    this.selectedFrequency = 'monthly';
    this.selectedPriority = 'medium';

    // Initialize when DOM is loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  init() {
    this.initializeElements();
    this.bindEvents();
    this.setupAnimations();
    this.loadInitialData();

    console.log('action:Track Redesigned App initialized');
  }

  initializeElements() {
    // Core elements
    this.monthlyInput = document.getElementById('monthly-input');
    this.addSubscriptionBtn = document.getElementById('add-subscription-btn');
    this.subscriptionForm = document.getElementById('subscription-form');
    this.tableBody = document.getElementById('subscriptions-table-body');

    // Form elements
    this.subNameInput = document.getElementById('sub-name');
    this.subAmountInput = document.getElementById('sub-amount');
    this.subNotesInput = document.getElementById('sub-notes');
    this.subDateInput = document.getElementById('sub-date');
    this.cancelBtn = document.getElementById('cancel-subscription');
    this.saveBtn = document.getElementById('save-subscription');

    // Summary elements
    this.totalAmountElement = document.getElementById('total-amount');
    this.remainingPercentageElement = document.getElementById('remaining-percentage');
    this.remainingAmountElement = document.getElementById('remaining-amount');

    // Option groups
    this.frequencyOptions = document.getElementById('frequency-options');
    this.priorityOptions = document.getElementById('priority-options');
  }

  bindEvents() {
    // Monthly income
    if (this.monthlyInput) {
      this.monthlyInput.addEventListener('input', () => {
        this.monthlyIncome = parseFloat(this.monthlyInput.value) || 0;
        this.saveUserData();
        this.updateSummary();
        this.animateNumberChange(this.monthlyInput);
      });
    }

    // Add subscription toggle
    if (this.addSubscriptionBtn) {
      this.addSubscriptionBtn.addEventListener('click', () => {
        this.toggleSubscriptionForm();
      });
    }

    // Form actions
    if (this.cancelBtn) {
      this.cancelBtn.addEventListener('click', () => {
        this.hideSubscriptionForm();
      });
    }

    if (this.saveBtn) {
      this.saveBtn.addEventListener('click', () => {
        this.saveSubscription();
      });
    }

    // Option groups
    this.bindOptionGroups();

    // Form validation
    this.bindFormValidation();

    // Keyboard shortcuts
    this.bindKeyboardShortcuts();
  }

  bindOptionGroups() {
    // Frequency options
    if (this.frequencyOptions) {
      this.frequencyOptions.addEventListener('click', (e) => {
        if (e.target.classList.contains('option-btn')) {
          this.selectOption(this.frequencyOptions, e.target);
          this.selectedFrequency = e.target.dataset.value;
          this.animateOptionSelection(e.target);
        }
      });
    }

    // Priority options
    if (this.priorityOptions) {
      this.priorityOptions.addEventListener('click', (e) => {
        if (e.target.classList.contains('option-btn')) {
          this.selectOption(this.priorityOptions, e.target);
          this.selectedPriority = e.target.dataset.value;
          this.animateOptionSelection(e.target);
        }
      });
    }
  }

  selectOption(container, selectedButton) {
    // Remove selected class from all options in the container
    container.querySelectorAll('.option-btn').forEach(btn => {
      btn.classList.remove('selected');
    });

    // Add selected class to clicked button
    selectedButton.classList.add('selected');
  }

  bindFormValidation() {
    const inputs = [this.subNameInput, this.subAmountInput, this.subNotesInput];

    inputs.forEach(input => {
      if (!input) return;

      input.addEventListener('blur', () => this.validateInput(input));
      input.addEventListener('input', () => this.clearValidationError(input));
    });
  }

  bindKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Escape key to close form
      if (e.key === 'Escape') {
        if (this.subscriptionForm && this.subscriptionForm.style.display !== 'none') {
          this.hideSubscriptionForm();
        }
      }

      // Enter key to save form (when focused in form)
      if (e.key === 'Enter' && e.ctrlKey) {
        if (this.subscriptionForm && this.subscriptionForm.style.display !== 'none') {
          e.preventDefault();
          this.saveSubscription();
        }
      }

      // Ctrl+N to add new subscription
      if (e.key === 'n' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this.showSubscriptionForm();
      }
    });
  }

  setupAnimations() {
    // Set up initial animation delays
    const animatedElements = document.querySelectorAll('.animate-in-delayed');
    animatedElements.forEach((element, index) => {
      element.style.animationDelay = `${index * 0.2}s`;
      element.style.opacity = '0';
    });

    // Trigger animations after a short delay
    setTimeout(() => {
      animatedElements.forEach(element => {
        element.style.opacity = '1';
        element.classList.add('animate-in');
      });
    }, 100);
  }

  async loadInitialData() {
    // Wait for auth system to initialize
    setTimeout(async () => {
      const user = window.authSystem?.getCurrentUser();
      if (user) {
        this.currentUser = user.id;
        await this.loadUserData();
      } else {
        this.hideSkeleton();
        this.updateSummary();
      }
    }, 1000);
  }

  async loadUserData() {
    try {
      if (window.dbService) {
        const [subscriptionsResult, incomeResult] = await Promise.all([
          window.dbService.getUserSubscriptions(this.currentUser),
          window.dbService.getMonthlyIncome(this.currentUser)
        ]);

        this.subscriptions = subscriptionsResult.success ? subscriptionsResult.data : [];
        this.monthlyIncome = incomeResult.success ? incomeResult.data : 0;

        if (subscriptionsResult.offline || incomeResult.offline) {
          this.showStatus('Working offline - changes will sync when online', 'warning');
        }
      } else {
        // Fallback to localStorage
        this.subscriptions = JSON.parse(localStorage.getItem(`user_${this.currentUser}_subscriptions`) || '[]');
        this.monthlyIncome = parseFloat(localStorage.getItem(`user_${this.currentUser}_monthlyIncome`) || '0');
      }

      this.updateUI();
    } catch (error) {
      console.error('Error loading user data:', error);
      this.showStatus('Error loading your data', 'error');
    }
  }

  async saveUserData() {
    if (!this.currentUser) return;

    try {
      if (window.dbService) {
        const [subscriptionsResult, incomeResult] = await Promise.all([
          window.dbService.saveUserSubscriptions(this.currentUser, this.subscriptions),
          window.dbService.saveMonthlyIncome(this.currentUser, this.monthlyIncome)
        ]);

        if (subscriptionsResult.offline || incomeResult.offline) {
          this.showStatus('Changes saved locally - will sync when online', 'warning');
        }
      }

      // Always save to localStorage as backup
      localStorage.setItem(`user_${this.currentUser}_subscriptions`, JSON.stringify(this.subscriptions));
      localStorage.setItem(`user_${this.currentUser}_monthlyIncome`, this.monthlyIncome.toString());

    } catch (error) {
      console.error('Error saving user data:', error);
      this.showStatus('Error saving data - saved locally instead', 'warning');
    }
  }

  updateUI() {
    this.updateMonthlyIncomeInput();
    this.renderSubscriptionsTable();
    this.updateSummary();
    this.hideSkeleton();
  }

  updateMonthlyIncomeInput() {
    if (this.monthlyInput) {
      this.monthlyInput.value = this.monthlyIncome.toFixed(2);
    }
  }

  toggleSubscriptionForm() {
    const isHidden = this.subscriptionForm.style.display === 'none' || !this.subscriptionForm.style.display;

    if (isHidden) {
      this.showSubscriptionForm();
    } else {
      this.hideSubscriptionForm();
    }
  }

  showSubscriptionForm() {
    this.clearForm();
    this.subscriptionForm.style.display = 'block';

    // Animate form appearance
    if (window.gsap) {
      gsap.fromTo(this.subscriptionForm,
        { opacity: 0, y: -20, scale: 0.95 },
        { duration: 0.4, opacity: 1, y: 0, scale: 1, ease: 'back.out(1.7)' }
      );
    }

    // Focus first input
    setTimeout(() => {
      this.subNameInput?.focus();
    }, 400);

    // Update button text
    this.addSubscriptionBtn.textContent = 'Cancel';
    this.addSubscriptionBtn.classList.add('btn-ghost');
    this.addSubscriptionBtn.classList.remove('btn-primary');
  }

  hideSubscriptionForm() {
    if (window.gsap) {
      gsap.to(this.subscriptionForm, {
        duration: 0.3,
        opacity: 0,
        y: -20,
        scale: 0.95,
        ease: 'power2.out',
        onComplete: () => {
          this.subscriptionForm.style.display = 'none';
        }
      });
    } else {
      this.subscriptionForm.style.display = 'none';
    }

    // Reset button
    this.addSubscriptionBtn.textContent = 'Add Subscription';
    this.addSubscriptionBtn.classList.remove('btn-ghost');
    this.addSubscriptionBtn.classList.add('btn-primary');
  }

  clearForm() {
    if (this.subNameInput) this.subNameInput.value = '';
    if (this.subAmountInput) this.subAmountInput.value = '';
    if (this.subNotesInput) this.subNotesInput.value = '';
    if (this.subDateInput) this.subDateInput.value = '';

    // Reset selections
    this.selectedFrequency = 'monthly';
    this.selectedPriority = 'medium';

    // Reset option buttons
    this.resetOptionGroups();

    // Clear validation errors
    this.clearAllValidationErrors();
  }

  resetOptionGroups() {
    // Reset frequency options
    if (this.frequencyOptions) {
      this.frequencyOptions.querySelectorAll('.option-btn').forEach(btn => {
        btn.classList.remove('selected');
        if (btn.dataset.value === 'monthly') {
          btn.classList.add('selected');
        }
      });
    }

    // Reset priority options
    if (this.priorityOptions) {
      this.priorityOptions.querySelectorAll('.option-btn').forEach(btn => {
        btn.classList.remove('selected');
        if (btn.dataset.value === 'medium') {
          btn.classList.add('selected');
        }
      });
    }
  }

  validateInput(input) {
    const value = input.value.trim();
    let isValid = true;
    let errorMessage = '';

    switch (input.id) {
      case 'sub-name':
        isValid = value.length > 0;
        errorMessage = 'Subscription name is required';
        break;
      case 'sub-amount':
        isValid = value && !isNaN(value) && parseFloat(value) > 0;
        errorMessage = 'Please enter a valid amount greater than 0';
        break;
    }

    if (!isValid) {
      this.showValidationError(input, errorMessage);
    } else {
      this.clearValidationError(input);
    }

    return isValid;
  }

  showValidationError(input, message) {
    this.clearValidationError(input);

    const errorElement = document.createElement('div');
    errorElement.className = 'validation-error text-body';
    errorElement.style.cssText = `
      color: var(--color-danger);
      margin-top: var(--space-xs);
      opacity: 0;
      transform: translateY(-10px);
      transition: var(--transition-base);
    `;
    errorElement.textContent = message;

    const formGroup = input.closest('.form-group');
    formGroup.appendChild(errorElement);

    // Animate in
    setTimeout(() => {
      errorElement.style.opacity = '1';
      errorElement.style.transform = 'translateY(0)';
    }, 10);

    // Style input as invalid
    input.style.borderColor = 'var(--color-danger)';
    input.style.boxShadow = '0 0 0 2px rgba(255, 68, 68, 0.2)';
  }

  clearValidationError(input) {
    const formGroup = input.closest('.form-group');
    const existingError = formGroup.querySelector('.validation-error');

    if (existingError) {
      existingError.remove();
    }

    // Reset input styling
    input.style.borderColor = '';
    input.style.boxShadow = '';
  }

  clearAllValidationErrors() {
    document.querySelectorAll('.validation-error').forEach(error => error.remove());
    document.querySelectorAll('.input').forEach(input => {
      input.style.borderColor = '';
      input.style.boxShadow = '';
    });
  }

  async saveSubscription() {
    const name = this.subNameInput?.value.trim();
    const amount = parseFloat(this.subAmountInput?.value) || 0;
    const notes = this.subNotesInput?.value.trim();
    const date = this.subDateInput?.value;

    // Validate required fields
    const nameValid = this.validateInput(this.subNameInput);
    const amountValid = this.validateInput(this.subAmountInput);

    if (!nameValid || !amountValid) {
      this.showStatus('Please fix the errors above', 'error');
      return;
    }

    // Show loading state
    this.setButtonLoading(this.saveBtn, true);

    try {
      const subscription = {
        id: Date.now(),
        name,
        amount,
        notes: notes || '',
        date: date || '',
        frequency: this.selectedFrequency,
        priority: this.selectedPriority,
        createdAt: new Date().toISOString()
      };

      this.subscriptions.push(subscription);
      await this.saveUserData();

      this.updateUI();
      this.hideSubscriptionForm();
      this.showStatus(`${name} subscription added successfully!`, 'success');

    } catch (error) {
      console.error('Error saving subscription:', error);
      this.showStatus('Error saving subscription', 'error');
    } finally {
      this.setButtonLoading(this.saveBtn, false);
    }
  }

  async removeSubscription(id) {
    const subscription = this.subscriptions.find(sub => sub.id === id);
    if (!subscription) return;

    try {
      this.subscriptions = this.subscriptions.filter(sub => sub.id !== id);
      await this.saveUserData();
      this.updateUI();
      this.showStatus(`${subscription.name} subscription removed`, 'success');
    } catch (error) {
      console.error('Error removing subscription:', error);
      this.showStatus('Error removing subscription', 'error');
    }
  }

  renderSubscriptionsTable() {
    if (!this.tableBody) return;

    // Clear existing rows
    this.tableBody.innerHTML = '';

    if (this.subscriptions.length === 0) {
      const emptyRow = document.createElement('tr');
      emptyRow.innerHTML = `
        <td colspan="7" style="text-align: center; padding: var(--space-xl); color: var(--color-secondary);">
          <div class="text-body">No subscriptions yet</div>
          <div class="text-body" style="margin-top: var(--space-sm); opacity: 0.7;">
            Click "Add Subscription" to get started
          </div>
        </td>
      `;
      this.tableBody.appendChild(emptyRow);
      return;
    }

    // Render subscription rows
    this.subscriptions.forEach((subscription, index) => {
      const row = this.createSubscriptionRow(subscription);
      this.tableBody.appendChild(row);

      // Animate row appearance
      if (window.gsap) {
        gsap.fromTo(row,
          { opacity: 0, x: -30 },
          {
            duration: 0.5,
            opacity: 1,
            x: 0,
            delay: index * 0.1,
            ease: 'power2.out'
          }
        );
      }
    });
  }

  createSubscriptionRow(subscription) {
    const row = document.createElement('tr');
    row.className = 'subscription-row';

    // Format date
    const formattedDate = subscription.date ?
      new Date(subscription.date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short'
      }) : '-';

    // Priority styling
    const priorityClass = `priority-${subscription.priority}`;

    row.innerHTML = `
      <td class="text-body" style="font-weight: 600;">${subscription.name}</td>
      <td class="text-body">£${subscription.amount.toFixed(2)}</td>
      <td class="text-body">${subscription.frequency}</td>
      <td class="text-body" style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;" title="${subscription.notes || '-'}">${subscription.notes || '-'}</td>
      <td><span class="priority-badge ${priorityClass}">${subscription.priority}</span></td>
      <td class="text-body">${formattedDate}</td>
      <td>
        <button class="delete-btn" onclick="window.actionTrackApp.removeSubscriptionWithAnimation(${subscription.id}, this.closest('tr'))">
          ×
        </button>
      </td>
    `;

    return row;
  }

  removeSubscriptionWithAnimation(id, rowElement) {
    if (window.gsap) {
      gsap.to(rowElement, {
        duration: 0.4,
        opacity: 0,
        x: 100,
        scale: 0.95,
        ease: 'power2.in',
        onComplete: () => {
          this.removeSubscription(id);
        }
      });
    } else {
      this.removeSubscription(id);
    }
  }

  updateSummary() {
    const total = this.calculateMonthlyTotal();
    const remaining = Math.max(0, this.monthlyIncome - total);
    const remainingPercentage = this.monthlyIncome > 0 ?
      (remaining / this.monthlyIncome) * 100 : 100;

    // Update displays with animation
    this.animateValueUpdate(this.totalAmountElement, `£${total.toFixed(2)}`);
    this.animateValueUpdate(this.remainingAmountElement, `£${remaining.toFixed(2)}`);
    this.animateValueUpdate(this.remainingPercentageElement, `${remainingPercentage.toFixed(1)}%`);

    // Update remaining card color based on percentage
    const remainingCard = this.remainingPercentageElement?.closest('.card');
    if (remainingCard) {
      remainingCard.classList.remove('text-danger', 'text-warning');
      if (remainingPercentage < 10) {
        remainingCard.classList.add('text-danger');
      } else if (remainingPercentage < 25) {
        remainingCard.classList.add('text-warning');
      }
    }
  }

  calculateMonthlyTotal() {
    return this.subscriptions.reduce((total, sub) => {
      let monthlyAmount = sub.amount;

      switch (sub.frequency) {
        case 'weekly':
          monthlyAmount = sub.amount * 4.33; // Average weeks per month
          break;
        case 'yearly':
          monthlyAmount = sub.amount / 12;
          break;
        case 'one-time':
          monthlyAmount = 0; // One-time payments don't affect monthly calculations
          break;
      }

      return total + monthlyAmount;
    }, 0);
  }

  animateValueUpdate(element, newValue) {
    if (!element || !window.gsap) {
      if (element) element.textContent = newValue;
      return;
    }

    gsap.to(element, {
      duration: 0.3,
      scale: 1.05,
      ease: 'power2.out',
      onComplete: () => {
        element.textContent = newValue;
        gsap.to(element, {
          duration: 0.3,
          scale: 1,
          ease: 'power2.out'
        });
      }
    });
  }

  animateNumberChange(element) {
    if (!window.gsap) return;

    gsap.fromTo(element,
      { scale: 1 },
      {
        duration: 0.2,
        scale: 1.02,
        yoyo: true,
        repeat: 1,
        ease: 'power2.out'
      }
    );
  }

  animateOptionSelection(element) {
    if (!window.gsap) return;

    gsap.fromTo(element,
      { scale: 1 },
      {
        duration: 0.2,
        scale: 1.05,
        yoyo: true,
        repeat: 1,
        ease: 'back.out(1.7)'
      }
    );
  }

  setButtonLoading(button, loading) {
    if (!button) return;

    if (loading) {
      button.disabled = true;
      button.innerHTML = `
        <div class="loading-spinner"></div>
        Processing...
      `;

      // Add spinner styles if not exists
      if (!document.getElementById('redesigned-spinner-styles')) {
        const style = document.createElement('style');
        style.id = 'redesigned-spinner-styles';
        style.textContent = `
          .loading-spinner {
            width: 12px;
            height: 12px;
            border: 2px solid rgba(255,255,255,0.3);
            border-top: 2px solid currentColor;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-right: var(--space-sm);
          }
        `;
        document.head.appendChild(style);
      }
    } else {
      button.disabled = false;
      button.textContent = 'Save Subscription';
    }
  }

  hideSkeleton() {
    const skeletonRows = document.querySelectorAll('.skeleton-row');

    if (window.gsap) {
      gsap.to(skeletonRows, {
        duration: 0.3,
        opacity: 0,
        y: -10,
        stagger: 0.1,
        onComplete: () => {
          skeletonRows.forEach(row => row.remove());
        }
      });
    } else {
      skeletonRows.forEach(row => row.remove());
    }
  }

  showStatus(message, type = 'info') {
    const statusElement = document.createElement('div');
    statusElement.className = `status-indicator ${type}`;
    statusElement.textContent = message;

    document.body.appendChild(statusElement);

    // Animate in
    setTimeout(() => statusElement.classList.add('show'), 100);

    // Auto remove
    setTimeout(() => {
      statusElement.classList.remove('show');
      setTimeout(() => {
        if (statusElement.parentNode) {
          statusElement.parentNode.removeChild(statusElement);
        }
      }, 300);
    }, type === 'error' ? 5000 : 3000);
  }

  // Public methods for external access
  getCurrentUser() {
    return this.currentUser;
  }

  getSubscriptions() {
    return [...this.subscriptions];
  }

  getMonthlyIncome() {
    return this.monthlyIncome;
  }

  // Method to handle auth state changes
  handleAuthStateChange(user) {
    if (user) {
      this.currentUser = user.id;
      this.loadUserData();
    } else {
      this.currentUser = null;
      this.subscriptions = [];
      this.monthlyIncome = 0;
      this.updateUI();
    }
  }
}

// Add priority badge styles
const priorityStyles = document.createElement('style');
priorityStyles.textContent = `
  .priority-badge {
    display: inline-block;
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-sm);
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .priority-high {
    background: rgba(244, 67, 54, 0.1);
    color: var(--color-danger);
    border: 1px solid rgba(244, 67, 54, 0.2);
  }

  .priority-medium {
    background: rgba(255, 152, 0, 0.1);
    color: var(--color-warning);
    border: 1px solid rgba(255, 152, 0, 0.2);
  }

  .priority-low {
    background: rgba(76, 175, 80, 0.1);
    color: var(--color-accent);
    border: 1px solid rgba(76, 175, 80, 0.2);
  }

  .text-danger { color: var(--color-danger) !important; }
  .text-warning { color: var(--color-warning) !important; }
`;
document.head.appendChild(priorityStyles);

// Initialize the app
window.actionTrackApp = new ActionTrackApp();

export { ActionTrackApp };