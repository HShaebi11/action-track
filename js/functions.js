document.addEventListener("DOMContentLoaded", function() {
  // Storage for subscriptions
  let subscriptions = JSON.parse(localStorage.getItem('subscriptions')) || [];
  let monthlyIncome = parseFloat(localStorage.getItem('monthlyIncome')) || 0;

  // Elements
  const addBtn = document.getElementById("add");
  const inputs = document.getElementById("input");
  const monthlyInput = document.getElementById("monthly-input");
  const nameInput = document.getElementById("name");
  const amountInput = document.getElementById("amount");
  const noteInput = document.getElementById("note");
  const dateInput = document.getElementById("date");
  const tableBody = document.querySelector(".table_body");
  const totalElement = document.getElementById("total");
  const remainingPercentElement = document.getElementById("remaining-percent");
  const remainingNumberElement = document.getElementById("remaining-number");
  const nameActiveElement = document.getElementById("name-active");
  const addFormBtn = document.querySelector("#input .button-01");

  let selectedFrequency = "monthly";
  let selectedPriority = "medium";

  // Initialize
  loadMonthlyIncome();
  loadSubscriptions();
  updateCalculations();
  setDefaultSelections();

  // Toggle input form
  if (addBtn && inputs) {
    addBtn.addEventListener("click", function() {
      if (inputs.style.display === "none" || inputs.style.display === "") {
        inputs.style.display = "flex";
        clearForm();
      } else {
        inputs.style.display = "none";
      }
    });
  }

  // Monthly income handler
  if (monthlyInput) {
    monthlyInput.addEventListener("change", function() {
      monthlyIncome = parseFloat(this.value) || 0;
      localStorage.setItem('monthlyIncome', monthlyIncome.toString());
      updateCalculations();
    });
  }

  // Frequency option handlers
  const frequencyOptions = document.querySelectorAll("#frequency-options .option");
  frequencyOptions.forEach(option => {
    option.addEventListener("click", function() {
      frequencyOptions.forEach(opt => opt.classList.remove("selected"));
      this.classList.add("selected");
      selectedFrequency = this.querySelector(".button-option").textContent.toLowerCase();
    });
  });

  // Priority option handlers
  const priorityOptions = document.querySelectorAll("#priority-options .option");
  priorityOptions.forEach(option => {
    option.addEventListener("click", function() {
      priorityOptions.forEach(opt => opt.classList.remove("selected"));
      this.classList.add("selected");
      selectedPriority = this.querySelector(".button-option").textContent.toLowerCase();
    });
  });

  // Form submission
  if (addFormBtn) {
    addFormBtn.addEventListener("click", function() {
      addSubscription();
    });
  }

  // Name input handler for preview
  if (nameInput && nameActiveElement) {
    nameInput.addEventListener("input", function() {
      nameActiveElement.textContent = this.value || "[name]";
    });
  }

  function addSubscription() {
    const name = nameInput.value.trim();
    const amount = parseFloat(amountInput.value) || 0;
    const note = noteInput.value.trim();
    const date = dateInput.value;

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
      frequency: selectedFrequency,
      priority: selectedPriority
    };

    subscriptions.push(subscription);
    localStorage.setItem('subscriptions', JSON.stringify(subscriptions));

    loadSubscriptions();
    updateCalculations();
    clearForm();
    inputs.style.display = "none";
  }

  function removeSubscription(id) {
    subscriptions = subscriptions.filter(sub => sub.id !== id);
    localStorage.setItem('subscriptions', JSON.stringify(subscriptions));
    loadSubscriptions();
    updateCalculations();
  }

  function setDefaultSelections() {
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

  function clearForm() {
    nameInput.value = "";
    amountInput.value = "";
    noteInput.value = "";
    dateInput.value = "";
    nameActiveElement.textContent = "[name]";

    // Reset to defaults
    selectedFrequency = "monthly";
    selectedPriority = "medium";
    setDefaultSelections();
  }

  function loadMonthlyIncome() {
    if (monthlyInput) {
      monthlyInput.value = monthlyIncome.toFixed(2);
    }
  }

  function loadSubscriptions() {
    if (!tableBody) return;

    // Clear existing rows (keep header)
    tableBody.innerHTML = "";

    subscriptions.forEach(subscription => {
      const row = document.createElement("tr");
      row.className = "table_row";
      row.innerHTML = `
        <td class="table_cell">${subscription.name}</td>
        <td class="table_cell">£${subscription.amount.toFixed(2)}</td>
        <td class="table_cell">${subscription.frequency}</td>
        <td class="table_cell">${subscription.note || "-"}</td>
        <td class="table_cell">${subscription.priority}</td>
        <td class="table_cell">${subscription.date || "-"}</td>
        <td class="table_cell" style="cursor: pointer; color: #ff4444;" onclick="removeSubscription(${subscription.id})">X</td>
      `;
      tableBody.appendChild(row);
    });
  }

  function updateCalculations() {
    const total = subscriptions.reduce((sum, sub) => {
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

    const remaining = monthlyIncome - total;
    const remainingPercent = monthlyIncome > 0 ? (remaining / monthlyIncome) * 100 : 0;

    if (totalElement) {
      totalElement.textContent = `£${total.toFixed(2)}`;
    }

    if (remainingNumberElement) {
      remainingNumberElement.textContent = `£${remaining.toFixed(2)}`;
    }

    if (remainingPercentElement) {
      remainingPercentElement.textContent = `${remainingPercent.toFixed(1)}%`;
    }
  }

  // Make removeSubscription globally accessible
  window.removeSubscription = removeSubscription;
});