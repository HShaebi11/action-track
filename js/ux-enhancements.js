// UX Enhancements with GSAP Animations
class UXEnhancements {
  constructor() {
    this.isInitialized = false;
    this.init();
  }

  init() {
    // Wait for GSAP to load
    this.waitForGSAP().then(() => {
      this.setupAnimations();
      this.enhanceInteractions();
      this.improveFormUX();
      this.addLoadingStates();
      this.setupMobileOptimizations();
      this.isInitialized = true;
    });
  }

  async waitForGSAP() {
    let attempts = 0;
    while (!window.gsap && attempts < 100) {
      await new Promise(resolve => setTimeout(resolve, 50));
      attempts++;
    }
    if (!window.gsap) {
      console.warn('GSAP not loaded - animations disabled');
      return false;
    }
    return true;
  }

  setupAnimations() {
    if (!window.gsap) return;

    // Initial page load animation
    gsap.set(".fullscreen-wrapper > *", { opacity: 0, y: 30 });

    gsap.timeline()
      .to(".header-wrapper", { duration: 0.8, opacity: 1, y: 0, ease: "power3.out" })
      .to(".control", { duration: 0.6, opacity: 1, y: 0, ease: "power3.out" }, "-=0.4")
      .to("#table", { duration: 0.6, opacity: 1, y: 0, ease: "power3.out" }, "-=0.3")
      .to(".total-wrapper", { duration: 0.6, opacity: 1, y: 0, ease: "power3.out" }, "-=0.3");

    // Animate elements on scroll (if needed)
    this.setupScrollAnimations();
  }

  setupScrollAnimations() {
    if (!window.gsap) return;

    // Animate table rows
    const tableRows = document.querySelectorAll('.table_row');
    tableRows.forEach((row, index) => {
      gsap.set(row, { opacity: 0, x: -20 });
      gsap.to(row, {
        duration: 0.5,
        opacity: 1,
        x: 0,
        delay: index * 0.1,
        ease: "power2.out"
      });
    });
  }

  enhanceInteractions() {
    // Button hover animations
    this.enhanceButtons();

    // Input focus animations
    this.enhanceInputs();

    // Modal animations
    this.enhanceModals();

    // Option selection animations
    this.enhanceOptions();
  }

  enhanceButtons() {
    const buttons = document.querySelectorAll('.button-01, .option');

    buttons.forEach(button => {
      // Add ripple effect container
      const ripple = document.createElement('div');
      ripple.className = 'ripple-effect';
      button.style.position = 'relative';
      button.style.overflow = 'hidden';
      button.appendChild(ripple);

      // Hover animations
      button.addEventListener('mouseenter', (e) => {
        if (!window.gsap) return;
        gsap.to(button, {
          duration: 0.3,
          scale: 1.02,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          ease: "power2.out"
        });
      });

      button.addEventListener('mouseleave', (e) => {
        if (!window.gsap) return;
        gsap.to(button, {
          duration: 0.3,
          scale: 1,
          boxShadow: "0 0 0 rgba(0,0,0,0)",
          ease: "power2.out"
        });
      });

      // Click ripple effect
      button.addEventListener('click', (e) => {
        this.createRipple(e, button);
      });

      // Add subtle pulse for primary buttons
      if (button.classList.contains('button-01')) {
        button.addEventListener('mouseenter', () => {
          if (!window.gsap) return;
          gsap.to(button, {
            duration: 0.2,
            backgroundColor: "#f8f8f8",
            ease: "power2.out"
          });
        });

        button.addEventListener('mouseleave', () => {
          if (!window.gsap) return;
          gsap.to(button, {
            duration: 0.2,
            backgroundColor: "transparent",
            ease: "power2.out"
          });
        });
      }
    });
  }

  createRipple(event, button) {
    if (!window.gsap) return;

    const rippleElement = button.querySelector('.ripple-effect');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    gsap.set(rippleElement, {
      width: size,
      height: size,
      left: x,
      top: y,
      backgroundColor: "rgba(0,0,0,0.1)",
      borderRadius: "50%",
      position: "absolute",
      pointerEvents: "none",
      scale: 0
    });

    gsap.to(rippleElement, {
      duration: 0.6,
      scale: 1,
      opacity: 0,
      ease: "power2.out",
      onComplete: () => {
        gsap.set(rippleElement, { scale: 0, opacity: 1 });
      }
    });
  }

  enhanceInputs() {
    const inputs = document.querySelectorAll('.input');

    inputs.forEach(input => {
      // Focus animations
      input.addEventListener('focus', () => {
        if (!window.gsap) return;
        gsap.to(input, {
          duration: 0.3,
          borderColor: "#4CAF50",
          boxShadow: "0 0 0 2px rgba(76, 175, 80, 0.2)",
          ease: "power2.out"
        });
      });

      input.addEventListener('blur', () => {
        if (!window.gsap) return;
        gsap.to(input, {
          duration: 0.3,
          borderColor: "#000",
          boxShadow: "0 0 0 0px rgba(76, 175, 80, 0)",
          ease: "power2.out"
        });
      });

      // Typing animation for better feedback
      input.addEventListener('input', () => {
        if (!window.gsap) return;
        gsap.fromTo(input,
          { scale: 1 },
          { duration: 0.1, scale: 1.01, yoyo: true, repeat: 1, ease: "power2.out" }
        );
      });
    });
  }

  enhanceModals() {
    const modal = document.getElementById('auth-modal');
    const modalContent = document.querySelector('.auth-modal-content');

    if (!modal || !modalContent) return;

    // Override default modal show/hide
    const originalShowModal = window.authSystem?.showAuthModal;
    const originalHideModal = window.authSystem?.hideAuthModal;

    if (originalShowModal) {
      window.authSystem.showAuthModal = (mode) => {
        originalShowModal.call(window.authSystem, mode);
        this.animateModalIn(modal, modalContent);
      };
    }

    if (originalHideModal) {
      window.authSystem.hideAuthModal = () => {
        this.animateModalOut(modal, modalContent, () => {
          originalHideModal.call(window.authSystem);
        });
      };
    }
  }

  animateModalIn(modal, content) {
    if (!window.gsap) return;

    gsap.set(modal, { display: 'block' });
    gsap.fromTo(modal,
      { opacity: 0 },
      { duration: 0.3, opacity: 1, ease: "power2.out" }
    );
    gsap.fromTo(content,
      { scale: 0.8, y: -50 },
      { duration: 0.4, scale: 1, y: 0, ease: "back.out(1.7)" }
    );
  }

  animateModalOut(modal, content, callback) {
    if (!window.gsap) {
      callback();
      return;
    }

    gsap.to(content, {
      duration: 0.3,
      scale: 0.8,
      y: -30,
      ease: "back.in(1.7)"
    });
    gsap.to(modal, {
      duration: 0.3,
      opacity: 0,
      ease: "power2.out",
      onComplete: callback
    });
  }

  enhanceOptions() {
    const options = document.querySelectorAll('.option');

    options.forEach(option => {
      option.addEventListener('click', () => {
        // Remove selection from siblings
        const siblings = option.parentNode.querySelectorAll('.option');
        siblings.forEach(sibling => {
          if (sibling !== option && window.gsap) {
            gsap.to(sibling, {
              duration: 0.3,
              backgroundColor: "transparent",
              color: "#000",
              ease: "power2.out"
            });
          }
        });

        // Animate current selection
        if (window.gsap) {
          gsap.to(option, {
            duration: 0.3,
            backgroundColor: "#000",
            color: "#fff",
            ease: "power2.out"
          });
        }
      });
    });
  }

  improveFormUX() {
    // Add floating labels effect
    this.addFloatingLabels();

    // Add form validation feedback
    this.addValidationFeedback();

    // Enhance form submission
    this.enhanceFormSubmission();
  }

  addFloatingLabels() {
    const inputWrappers = document.querySelectorAll('.input-wrapper');

    inputWrappers.forEach(wrapper => {
      const label = wrapper.querySelector('.contexual-text.label');
      const input = wrapper.querySelector('.input');

      if (!label || !input) return;

      input.addEventListener('focus', () => {
        if (!window.gsap) return;
        gsap.to(label, {
          duration: 0.3,
          color: "#4CAF50",
          scale: 0.9,
          ease: "power2.out"
        });
      });

      input.addEventListener('blur', () => {
        if (!window.gsap) return;
        gsap.to(label, {
          duration: 0.3,
          color: "#000",
          scale: 1,
          ease: "power2.out"
        });
      });
    });
  }

  addValidationFeedback() {
    const inputs = document.querySelectorAll('.input');

    inputs.forEach(input => {
      input.addEventListener('blur', () => {
        this.validateInput(input);
      });

      input.addEventListener('input', () => {
        // Clear validation state on input
        this.clearValidationState(input);
      });
    });
  }

  validateInput(input) {
    if (!window.gsap) return;

    let isValid = true;
    const value = input.value.trim();

    // Basic validation rules
    if (input.type === 'email' && value) {
      isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    } else if (input.type === 'number' && value) {
      isValid = !isNaN(value) && parseFloat(value) >= 0;
    } else if (input.required && !value) {
      isValid = false;
    }

    if (!isValid) {
      gsap.to(input, {
        duration: 0.3,
        borderColor: "#ff4444",
        boxShadow: "0 0 0 2px rgba(255, 68, 68, 0.2)",
        ease: "power2.out"
      });
      this.showValidationError(input);
    }
  }

  clearValidationState(input) {
    if (!window.gsap) return;

    gsap.to(input, {
      duration: 0.3,
      borderColor: "#000",
      boxShadow: "0 0 0 0px rgba(255, 68, 68, 0)",
      ease: "power2.out"
    });
    this.hideValidationError(input);
  }

  showValidationError(input) {
    const wrapper = input.closest('.input-wrapper');
    if (!wrapper) return;

    let errorElement = wrapper.querySelector('.validation-error');
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.className = 'validation-error contexual-text';
      errorElement.style.cssText = `
        color: #ff4444;
        font-size: 10px;
        margin-top: 5px;
        opacity: 0;
        transform: translateY(-10px);
      `;
      wrapper.appendChild(errorElement);
    }

    errorElement.textContent = this.getValidationMessage(input);

    if (window.gsap) {
      gsap.to(errorElement, {
        duration: 0.3,
        opacity: 1,
        y: 0,
        ease: "power2.out"
      });
    }
  }

  hideValidationError(input) {
    const wrapper = input.closest('.input-wrapper');
    if (!wrapper) return;

    const errorElement = wrapper.querySelector('.validation-error');
    if (!errorElement) return;

    if (window.gsap) {
      gsap.to(errorElement, {
        duration: 0.3,
        opacity: 0,
        y: -10,
        ease: "power2.out",
        onComplete: () => errorElement.remove()
      });
    } else {
      errorElement.remove();
    }
  }

  getValidationMessage(input) {
    if (input.type === 'email') return 'Invalid email address';
    if (input.type === 'number') return 'Please enter a valid number';
    if (input.required && !input.value.trim()) return 'This field is required';
    return 'Invalid input';
  }

  enhanceFormSubmission() {
    const forms = document.querySelectorAll('.auth-form');

    forms.forEach(form => {
      const submitButton = form.querySelector('[id$="-submit"]');
      if (!submitButton) return;

      submitButton.addEventListener('click', (e) => {
        this.animateFormSubmission(submitButton);
      });
    });
  }

  animateFormSubmission(button) {
    if (!window.gsap) return;

    const timeline = gsap.timeline();

    timeline
      .to(button, {
        duration: 0.2,
        scale: 0.95,
        ease: "power2.out"
      })
      .to(button, {
        duration: 0.3,
        scale: 1,
        ease: "back.out(1.7)"
      });
  }

  addLoadingStates() {
    // Add skeleton loading for table
    this.addTableSkeleton();

    // Add loading states for buttons
    this.addButtonLoadingStates();
  }

  addTableSkeleton() {
    const tableBody = document.querySelector('.table_body');
    if (!tableBody) return;

    // Create skeleton rows
    const skeletonHTML = Array(3).fill().map(() => `
      <tr class="table_row skeleton-row">
        <td class="table_cell"><div class="skeleton-text"></div></td>
        <td class="table_cell"><div class="skeleton-text short"></div></td>
        <td class="table_cell"><div class="skeleton-text short"></div></td>
        <td class="table_cell"><div class="skeleton-text"></div></td>
        <td class="table_cell"><div class="skeleton-text short"></div></td>
        <td class="table_cell"><div class="skeleton-text short"></div></td>
        <td class="table_cell"><div class="skeleton-text short"></div></td>
      </tr>
    `).join('');

    // Add skeleton styles
    if (!document.getElementById('skeleton-styles')) {
      const skeletonStyles = document.createElement('style');
      skeletonStyles.id = 'skeleton-styles';
      skeletonStyles.textContent = `
        .skeleton-text {
          height: 12px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
          border-radius: 4px;
          margin: 2px 0;
        }
        .skeleton-text.short { width: 60%; }
        @keyframes loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `;
      document.head.appendChild(skeletonStyles);
    }

    // Show skeleton initially
    tableBody.innerHTML = skeletonHTML;
  }

  addButtonLoadingStates() {
    const buttons = document.querySelectorAll('.button-01');

    buttons.forEach(button => {
      button.addEventListener('click', () => {
        this.showButtonLoading(button);

        // Auto-hide after 2 seconds (adjust based on actual operation time)
        setTimeout(() => {
          this.hideButtonLoading(button);
        }, 2000);
      });
    });
  }

  showButtonLoading(button) {
    const originalText = button.querySelector('.contexual-text.button-text').textContent;
    button.dataset.originalText = originalText;

    const loadingHTML = `
      <div class="loading-spinner"></div>
      <span>Processing...</span>
    `;

    button.querySelector('.contexual-text.button-text').innerHTML = loadingHTML;
    button.disabled = true;

    // Add spinner styles if not exists
    if (!document.getElementById('spinner-styles')) {
      const spinnerStyles = document.createElement('style');
      spinnerStyles.id = 'spinner-styles';
      spinnerStyles.textContent = `
        .loading-spinner {
          width: 12px;
          height: 12px;
          border: 2px solid #f3f3f3;
          border-top: 2px solid #000;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-right: 8px;
          display: inline-block;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(spinnerStyles);
    }
  }

  hideButtonLoading(button) {
    const originalText = button.dataset.originalText || 'Submit';
    button.querySelector('.contexual-text.button-text').textContent = originalText;
    button.disabled = false;
  }

  setupMobileOptimizations() {
    // Add touch-friendly interactions
    this.addTouchOptimizations();

    // Improve mobile table experience
    this.optimizeMobileTable();

    // Add mobile-specific gestures
    this.addMobileGestures();
  }

  addTouchOptimizations() {
    // Increase touch targets on mobile
    const mediaQuery = window.matchMedia('(max-width: 768px)');

    if (mediaQuery.matches) {
      const touchTargets = document.querySelectorAll('.button-01, .option, .input');
      touchTargets.forEach(target => {
        target.style.minHeight = '44px';
        target.style.minWidth = '44px';
      });
    }
  }

  optimizeMobileTable() {
    const table = document.querySelector('.table_table');
    const mediaQuery = window.matchMedia('(max-width: 768px)');

    if (mediaQuery.matches && table) {
      // Make table scrollable horizontally
      const tableWrapper = table.parentElement;
      tableWrapper.style.overflowX = 'auto';
      tableWrapper.style.webkitOverflowScrolling = 'touch';

      // Add scroll indicator
      this.addScrollIndicator(tableWrapper);
    }
  }

  addScrollIndicator(container) {
    const indicator = document.createElement('div');
    indicator.className = 'scroll-indicator';
    indicator.style.cssText = `
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      width: 20px;
      background: linear-gradient(to left, rgba(0,0,0,0.1), transparent);
      pointer-events: none;
      opacity: 1;
      transition: opacity 0.3s ease;
    `;

    container.style.position = 'relative';
    container.appendChild(indicator);

    container.addEventListener('scroll', () => {
      const isScrolledToEnd = container.scrollLeft >= (container.scrollWidth - container.clientWidth - 10);
      indicator.style.opacity = isScrolledToEnd ? '0' : '1';
    });
  }

  addMobileGestures() {
    // Add swipe to delete functionality for table rows
    const tableRows = document.querySelectorAll('.table_row');

    tableRows.forEach(row => {
      let startX = 0;
      let currentX = 0;
      let isDragging = false;

      row.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
      });

      row.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        currentX = e.touches[0].clientX;
        const diffX = currentX - startX;

        if (Math.abs(diffX) > 10) {
          e.preventDefault();
          if (window.gsap) {
            gsap.set(row, { x: diffX * 0.3 });
          }
        }
      });

      row.addEventListener('touchend', () => {
        if (!isDragging) return;
        isDragging = false;

        const diffX = currentX - startX;
        if (window.gsap) {
          if (Math.abs(diffX) > 100) {
            // Trigger delete action
            gsap.to(row, {
              duration: 0.3,
              x: diffX > 0 ? 300 : -300,
              opacity: 0,
              ease: "power2.out",
              onComplete: () => {
                // Trigger actual delete functionality
                const deleteBtn = row.querySelector('[onclick*="removeSubscription"]');
                if (deleteBtn) deleteBtn.click();
              }
            });
          } else {
            // Snap back
            gsap.to(row, {
              duration: 0.3,
              x: 0,
              ease: "back.out(1.7)"
            });
          }
        }
      });
    });
  }

  // Public method to refresh animations after data changes
  refreshAnimations() {
    if (!this.isInitialized) return;

    // Re-setup table animations
    this.setupScrollAnimations();

    // Re-setup mobile gestures
    this.addMobileGestures();

    // Re-enhance any new buttons or inputs
    this.enhanceButtons();
    this.enhanceInputs();
  }

  // Public method to animate new table row addition
  animateNewRow(row) {
    if (!window.gsap || !row) return;

    gsap.fromTo(row,
      { opacity: 0, x: -30, scale: 0.9 },
      {
        duration: 0.6,
        opacity: 1,
        x: 0,
        scale: 1,
        ease: "back.out(1.7)"
      }
    );
  }

  // Public method to animate row removal
  animateRowRemoval(row, callback) {
    if (!window.gsap || !row) {
      if (callback) callback();
      return;
    }

    gsap.to(row, {
      duration: 0.4,
      opacity: 0,
      x: 30,
      scale: 0.9,
      ease: "power2.in",
      onComplete: callback
    });
  }
}

// Initialize UX enhancements when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  window.uxEnhancements = new UXEnhancements();
});

export { UXEnhancements };