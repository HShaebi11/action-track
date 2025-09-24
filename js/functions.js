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
    // Toggle input form
    if (this.addBtn && this.inputs) {
      this.addBtn.addEventListener("click", () => {
        if (this.inputs.style.display === "none" || this.inputs.style.display === "") {
          this.inputs.style.display = "flex";
          this.clearForm();
        } else {
          this.inputs.style.display = "none";
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

  loadUserData(userId) {
    this.currentUser = userId;

    // Load user-specific data
    this.subscriptions = window.authSystem?.getUserData('subscriptions') || [];
    this.monthlyIncome = parseFloat(window.authSystem?.getUserData('monthlyIncome')) || 0;

    this.loadMonthlyIncome();
    this.loadSubscriptions();
    this.updateCalculations();
    this.setDefaultSelections();
  }

  saveUserData() {
    if (!this.currentUser) return;

    window.authSystem?.setUserData('subscriptions', this.subscriptions);
    window.authSystem?.setUserData('monthlyIncome', this.monthlyIncome);
  }

  addSubscription() {
    const name = this.nameInput.value.trim();
    const amount = parseFloat(this.amountInput.value) || 0;
    const note = this.noteInput.value.trim();
    const date = this.dateInput.value;

    if (!name || amount <= 0) {
      alert("Please enter a valid name and amount");
      return;
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

    this.loadSubscriptions();
    this.updateCalculations();
    this.clearForm();
    this.inputs.style.display = "none";
  }

  removeSubscription(id) {
    this.subscriptions = this.subscriptions.filter(sub => sub.id !== id);
    this.saveUserData();
    this.loadSubscriptions();
    this.updateCalculations();
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

    this.subscriptions.forEach(subscription => {
      const row = document.createElement("tr");
      row.className = "table_row";
      row.innerHTML = `
        <td class="table_cell">${subscription.name}</td>
        <td class="table_cell">£${subscription.amount.toFixed(2)}</td>
        <td class="table_cell">${subscription.frequency}</td>
        <td class="table_cell">${subscription.note || "-"}</td>
        <td class="table_cell">${subscription.priority}</td>
        <td class="table_cell">${subscription.date || "-"}</td>
        <td class="table_cell" style="cursor: pointer; color: #ff4444;" onclick="window.subscriptionApp.removeSubscription(${subscription.id})">X</td>
      `;
      this.tableBody.appendChild(row);
    });
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