// Subscription Management System
class SubscriptionApp {
  constructor() {
    this.subscriptions = [];
    this.monthlyIncome = 0;
    this.currentUser = null;
    this.selectedFrequency = "monthly";
    this.selectedPriority = "medium";

    this.initializeElements();
    this.bindEvents();

    // Wait for auth system to initialize
    setTimeout(() => {
      const user = window.authSystem?.getCurrentUser();
      if (user) {
        this.loadUserData(user.id);
      }
    }, 100);
  }

  initializeElements() {
    // Elements
    this.addBtn = document.getElementById("add");
    this.inputs = document.getElementById("input");
    this.monthlyInput = document.getElementById("monthly-input");
    this.nameInput = document.getElementById("name");
    this.amountInput = document.getElementById("amount");
    this.noteInput = document.getElementById("note");
    this.dateInput = document.getElementById("date");
    this.tableBody = document.querySelector(".table_body");
    this.totalElement = document.getElementById("total");
    this.remainingPercentElement = document.getElementById("remaining-percent");
    this.remainingNumberElement = document.getElementById("remaining-number");
    this.nameActiveElement = document.getElementById("name-active");
    this.addFormBtn = document.querySelector("#input .button-01");
  }

  bindEvents() {
    // Toggle input form with animation
    if (this.addBtn && this.inputs) {
      this.addBtn.addEventListener("click", () => {
        const isHidden = this.inputs.style.display === "none" || this.inputs.style.display === "";

        if (isHidden) {
          // Show form with animation
          this.inputs.style.display = "flex";
          this.clearForm();

          if (window.gsap) {
            gsap.fromTo(this.inputs,
              { opacity: 0, y: -20 },
              { duration: 0.4, opacity: 1, y: 0, ease: "back.out(1.7)" }
            );
          }

          // Focus first input
          setTimeout(() => {
            this.nameInput?.focus();
          }, 400);
        } else {
          // Hide form with animation
          if (window.gsap) {
            gsap.to(this.inputs, {
              duration: 0.3,
              opacity: 0,
              y: -20,
              ease: "power2.out",
              onComplete: () => {
                this.inputs.style.display = "none";
                gsap.set(this.inputs, { opacity: 1, y: 0 });
              }
            });
          } else {
            this.inputs.style.display = "none";
          }
        }
      });
    }

    // Monthly income handler
    if (this.monthlyInput) {
      this.monthlyInput.addEventListener("change", () => {
        this.monthlyIncome = parseFloat(this.monthlyInput.value) || 0;
        this.saveUserData();
        this.updateCalculations();
      });
    }

    // Frequency option handlers
    const frequencyOptions = document.querySelectorAll("#frequency-options .option");
    frequencyOptions.forEach(option => {
      option.addEventListener("click", () => {
        frequencyOptions.forEach(opt => opt.classList.remove("selected"));
        option.classList.add("selected");
        this.selectedFrequency = option.querySelector(".button-option").textContent.toLowerCase();
      });
    });

    // Priority option handlers
    const priorityOptions = document.querySelectorAll("#priority-options .option");
    priorityOptions.forEach(option => {
      option.addEventListener("click", () => {
        priorityOptions.forEach(opt => opt.classList.remove("selected"));
        option.classList.add("selected");
        this.selectedPriority = option.querySelector(".button-option").textContent.toLowerCase();
      });
    });

    // Form submission
    if (this.addFormBtn) {
      this.addFormBtn.addEventListener("click", () => {
        this.addSubscription();
      });
    }

    // Name input handler for preview
    if (this.nameInput && this.nameActiveElement) {
      this.nameInput.addEventListener("input", () => {
        this.nameActiveElement.textContent = this.nameInput.value || "[name]";
      });
    }
  }

  async loadUserData(userId) {
    this.currentUser = userId;

    try {
      // Load user-specific data from Firebase
      if (window.dbService) {
        const subscriptionsResult = await window.dbService.getUserSubscriptions(userId);
        const incomeResult = await window.dbService.getMonthlyIncome(userId);

        this.subscriptions = subscriptionsResult.success ? subscriptionsResult.data : [];
        this.monthlyIncome = incomeResult.success ? incomeResult.data : 0;

        // Show offline indicator if data came from cache
        if (subscriptionsResult.offline || incomeResult.offline) {
          this.showOfflineIndicator();
        }
      } else {
        // Fallback to localStorage if Firebase isn't available
        this.subscriptions = JSON.parse(localStorage.getItem(`user_${userId}_subscriptions`) || '[]');
        this.monthlyIncome = parseFloat(localStorage.getItem(`user_${userId}_monthlyIncome`) || '0');
      }

      this.loadMonthlyIncome();
      this.loadSubscriptions();
      this.updateCalculations();
      this.setDefaultSelections();

    } catch (error) {
      console.error('Error loading user data:', error);
      this.showError('Error loading your data. Please try refreshing the page.');
    }
  }

  async saveUserData() {
    if (!this.currentUser) return;

    try {
      if (window.dbService) {
        // Save to Firebase
        const subscriptionsResult = await window.dbService.saveUserSubscriptions(this.currentUser, this.subscriptions);
        const incomeResult = await window.dbService.saveMonthlyIncome(this.currentUser, this.monthlyIncome);

        // Show offline indicator if saved locally
        if (subscriptionsResult.offline || incomeResult.offline) {
          this.showOfflineIndicator();
        } else {
          this.hideOfflineIndicator();
        }

        // Also save locally as backup
        localStorage.setItem(`user_${this.currentUser}_subscriptions`, JSON.stringify(this.subscriptions));
        localStorage.setItem(`user_${this.currentUser}_monthlyIncome`, this.monthlyIncome.toString());

      } else {
        // Fallback to localStorage only
        localStorage.setItem(`user_${this.currentUser}_subscriptions`, JSON.stringify(this.subscriptions));
        localStorage.setItem(`user_${this.currentUser}_monthlyIncome`, this.monthlyIncome.toString());
      }
    } catch (error) {
      console.error('Error saving user data:', error);
      this.showError('Error saving your data. Changes have been saved locally.');
    }
  }

  showOfflineIndicator() {
    let indicator = document.getElementById('offline-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'offline-indicator';
      indicator.style.cssText = `
        position: fixed;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #ff9800;
        color: white;
        padding: 8px 15px;
        border-radius: 20px;
        font-family: Ppneuemontrealmono, Arial, sans-serif;
        font-size: 11px;
        z-index: 1001;
        animation: slideDown 0.3s ease;
      `;
      indicator.textContent = '📱 Working Offline - Changes will sync when online';
      document.body.appendChild(indicator);
    }
  }

  hideOfflineIndicator() {
    const indicator = document.getElementById('offline-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'status-indicator error';
    errorDiv.textContent = message;

    document.body.appendChild(errorDiv);

    // Animate in
    if (window.gsap) {
      gsap.fromTo(errorDiv,
        { opacity: 0, x: 100 },
        { duration: 0.4, opacity: 1, x: 0, ease: "back.out(1.7)" }
      );

      // Animate out
      setTimeout(() => {
        gsap.to(errorDiv, {
          duration: 0.3,
          opacity: 0,
          x: 100,
          ease: "power2.out",
          onComplete: () => errorDiv.remove()
        });
      }, 4000);
    } else {
      setTimeout(() => errorDiv.remove(), 4000);
    }
  }

  showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'status-indicator success';
    successDiv.textContent = message;

    document.body.appendChild(successDiv);

    // Animate in
    if (window.gsap) {
      gsap.fromTo(successDiv,
        { opacity: 0, x: 100 },
        { duration: 0.4, opacity: 1, x: 0, ease: "back.out(1.7)" }
      );

      // Animate out
      setTimeout(() => {
        gsap.to(successDiv, {
          duration: 0.3,
          opacity: 0,
          x: 100,
          ease: "power2.out",
          onComplete: () => successDiv.remove()
        });
      }, 3000);
    } else {
      setTimeout(() => successDiv.remove(), 3000);
    }
  }

  addSubscription() {
    const name = this.nameInput.value.trim();
    const amount = parseFloat(this.amountInput.value) || 0;
    const note = this.noteInput.value.trim();
    const date = this.dateInput.value;

    if (!name || amount <= 0) {
      this.showError("Please enter a valid name and amount");
      return;
    }

    // Show loading state
    const submitButton = document.querySelector('#input .button-01');
    if (window.uxEnhancements && submitButton) {
      window.uxEnhancements.showButtonLoading(submitButton);
    }

    const subscription = {
      id: Date.now(),
      name,
      amount,
      note,
      date,
      frequency: this.selectedFrequency,
      priority: this.selectedPriority
    };

    this.subscriptions.push(subscription);
    this.saveUserData();

    // Add delay for better UX feedback
    setTimeout(() => {
      this.loadSubscriptions();
      this.updateCalculations();
      this.clearForm();

      // Animate form closing
      if (window.gsap) {
        gsap.to(this.inputs, {
          duration: 0.3,
          opacity: 0,
          y: -20,
          ease: "power2.out",
          onComplete: () => {
            this.inputs.style.display = "none";
            gsap.set(this.inputs, { opacity: 1, y: 0 });
          }
        });
      } else {
        this.inputs.style.display = "none";
      }

      // Hide loading state
      if (window.uxEnhancements && submitButton) {
        window.uxEnhancements.hideButtonLoading(submitButton);
      }

      // Show success message
      this.showSuccess(`${name} subscription added successfully!`);
    }, 800);
  }

  removeSubscription(id) {
    this.subscriptions = this.subscriptions.filter(sub => sub.id !== id);
    this.saveUserData();
    this.loadSubscriptions();
    this.updateCalculations();
  }

  removeSubscriptionWithAnimation(id, rowElement) {
    if (window.uxEnhancements && window.uxEnhancements.isInitialized) {
      window.uxEnhancements.animateRowRemoval(rowElement, () => {
        this.removeSubscription(id);
      });
    } else {
      this.removeSubscription(id);
    }
  }

  setDefaultSelections() {
    // Set default frequency to monthly
    const frequencyOptions = document.querySelectorAll("#frequency-options .option");
    frequencyOptions.forEach(opt => opt.classList.remove("selected"));
    const monthlyOption = Array.from(frequencyOptions).find(opt =>
      opt.querySelector(".button-option").textContent.toLowerCase() === "monthly"
    );
    if (monthlyOption) {
      monthlyOption.classList.add("selected");
    }

    // Set default priority to medium
    const priorityOptions = document.querySelectorAll("#priority-options .option");
    priorityOptions.forEach(opt => opt.classList.remove("selected"));
    const mediumOption = Array.from(priorityOptions).find(opt =>
      opt.querySelector(".button-option").textContent.toLowerCase() === "medium"
    );
    if (mediumOption) {
      mediumOption.classList.add("selected");
    }
  }

  clearForm() {
    this.nameInput.value = "";
    this.amountInput.value = "";
    this.noteInput.value = "";
    this.dateInput.value = "";
    this.nameActiveElement.textContent = "[name]";

    // Reset to defaults
    this.selectedFrequency = "monthly";
    this.selectedPriority = "medium";
    this.setDefaultSelections();
  }

  loadMonthlyIncome() {
    if (this.monthlyInput) {
      this.monthlyInput.value = this.monthlyIncome.toFixed(2);
    }
  }

  loadSubscriptions() {
    if (!this.tableBody) return;

    // Clear existing rows (keep header)
    this.tableBody.innerHTML = "";

    this.subscriptions.forEach((subscription, index) => {
      const row = document.createElement("tr");
      row.className = "table_row";
      row.innerHTML = `
        <td class="table_cell">${subscription.name}</td>
        <td class="table_cell">£${subscription.amount.toFixed(2)}</td>
        <td class="table_cell">${subscription.frequency}</td>
        <td class="table_cell">${subscription.note || "-"}</td>
        <td class="table_cell">${subscription.priority}</td>
        <td class="table_cell">${subscription.date || "-"}</td>
        <td class="table_cell" style="cursor: pointer; color: #ff4444;" onclick="window.subscriptionApp.removeSubscriptionWithAnimation(${subscription.id}, this.parentElement)">×</td>
      `;
      this.tableBody.appendChild(row);

      // Animate new row if UX enhancements are available
      if (window.uxEnhancements && window.uxEnhancements.isInitialized) {
        setTimeout(() => {
          window.uxEnhancements.animateNewRow(row);
        }, index * 100);
      }
    });

    // Refresh UX enhancements for new elements
    if (window.uxEnhancements) {
      setTimeout(() => {
        window.uxEnhancements.refreshAnimations();
      }, this.subscriptions.length * 100 + 200);
    }
  }

  updateCalculations() {
    const total = this.subscriptions.reduce((sum, sub) => {
      let monthlyAmount = sub.amount;

      switch(sub.frequency) {
        case "weekly":
          monthlyAmount = sub.amount * 4.33; // Average weeks per month
          break;
        case "yearly":
          monthlyAmount = sub.amount / 12;
          break;
        case "one-time":
          monthlyAmount = 0; // One-time payments don't affect monthly calculations
          break;
      }

      return sum + monthlyAmount;
    }, 0);

    const remaining = this.monthlyIncome - total;
    const remainingPercent = this.monthlyIncome > 0 ? (remaining / this.monthlyIncome) * 100 : 0;

    if (this.totalElement) {
      this.totalElement.textContent = `£${total.toFixed(2)}`;
    }

    if (this.remainingNumberElement) {
      this.remainingNumberElement.textContent = `£${remaining.toFixed(2)}`;
    }

    if (this.remainingPercentElement) {
      this.remainingPercentElement.textContent = `${remainingPercent.toFixed(1)}%`;
    }
  }
}

// Initialize the subscription app
document.addEventListener("DOMContentLoaded", function() {
  window.subscriptionApp = new SubscriptionApp();
});