// Browser Compatibility Fixes
class BrowserCompatibility {
  constructor() {
    this.detectBrowser();
    this.applyFixes();
  }

  detectBrowser() {
    const userAgent = navigator.userAgent;
    this.isWebKit = /WebKit/.test(userAgent);
    this.isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
    this.isChrome = /Chrome/.test(userAgent);
    this.isArc = /Arc/.test(userAgent) || userAgent.includes('Arc');
    this.isFirefox = /Firefox/.test(userAgent);

    // Add browser classes to body
    document.body.classList.add(
      this.isWebKit ? 'webkit' : 'non-webkit',
      this.isSafari ? 'safari' : 'non-safari',
      this.isChrome ? 'chrome' : 'non-chrome',
      this.isArc ? 'arc' : 'non-arc',
      this.isFirefox ? 'firefox' : 'non-firefox'
    );

    console.log('Browser detected:', {
      webkit: this.isWebKit,
      safari: this.isSafari,
      chrome: this.isChrome,
      arc: this.isArc,
      firefox: this.isFirefox
    });
  }

  applyFixes() {
    // Test CSS feature support
    this.testFeatureSupport();

    // Apply browser-specific fixes
    if (this.isSafari || this.isArc) {
      this.applySafariFixes();
    }

    if (this.isFirefox) {
      this.applyFirefoxFixes();
    }

    // Test GSAP loading
    this.testGSAP();
  }

  testFeatureSupport() {
    const features = {
      backdropFilter: CSS.supports('backdrop-filter', 'blur(10px)'),
      webkitBackdropFilter: CSS.supports('-webkit-backdrop-filter', 'blur(10px)'),
      transforms: CSS.supports('transform', 'translateZ(0)'),
      transitions: CSS.supports('transition', 'all 0.3s ease')
    };

    console.log('CSS Feature Support:', features);

    // Add feature classes to body
    Object.keys(features).forEach(feature => {
      document.body.classList.add(
        features[feature] ? `supports-${feature}` : `no-${feature}`
      );
    });

    // Apply fallbacks for unsupported features
    if (!features.backdropFilter && !features.webkitBackdropFilter) {
      this.addBackdropFallbacks();
    }
  }

  addBackdropFallbacks() {
    const style = document.createElement('style');
    style.textContent = `
      .table_instance,
      .inputs,
      .auth-modal-content {
        background: rgba(255, 255, 255, 0.98) !important;
        border: 1px solid rgba(0, 0, 0, 0.1) !important;
      }

      .auth-modal {
        background-color: rgba(0, 0, 0, 0.85) !important;
      }

      .total-wrapper {
        background: rgba(0, 0, 0, 0.95) !important;
      }
    `;
    document.head.appendChild(style);
  }

  applySafariFixes() {
    const safariStyle = document.createElement('style');
    safariStyle.textContent = `
      /* Safari-specific fixes */
      .safari .table_row,
      .arc .table_row {
        will-change: transform;
        -webkit-transform: translateZ(0);
        transform: translateZ(0);
      }

      .safari .button-01,
      .arc .button-01,
      .safari .option,
      .arc .option {
        -webkit-transform: translateZ(0);
        transform: translateZ(0);
        -webkit-backface-visibility: hidden;
        backface-visibility: hidden;
      }

      .safari .input,
      .arc .input {
        -webkit-appearance: none;
        appearance: none;
      }

      .safari .table_instance,
      .arc .table_instance {
        -webkit-overflow-scrolling: touch;
      }

      /* Fix Arc browser specific issues */
      .arc .fullscreen-wrapper {
        -webkit-font-smoothing: antialiased;
        text-rendering: optimizeLegibility;
      }

      .arc .heading01 {
        -webkit-text-stroke: 0.5px transparent;
        text-stroke: 0.5px transparent;
      }
    `;
    document.head.appendChild(safariStyle);
  }

  applyFirefoxFixes() {
    const firefoxStyle = document.createElement('style');
    firefoxStyle.textContent = `
      /* Firefox-specific fixes */
      .firefox .table_instance,
      .firefox .inputs,
      .firefox .auth-modal-content {
        background: rgba(255, 255, 255, 0.95);
      }

      .firefox .input {
        -moz-appearance: none;
        appearance: none;
      }

      .firefox .button-01:hover,
      .firefox .option:hover {
        transform: translateY(-1px) translateZ(0);
      }
    `;
    document.head.appendChild(firefoxStyle);
  }

  testGSAP() {
    setTimeout(() => {
      if (!window.gsap) {
        console.warn('GSAP not loaded - adding fallback animations');
        this.addCSSFallbacks();
      } else {
        console.log('GSAP loaded successfully');
        document.body.classList.add('gsap-loaded');
      }
    }, 1000);
  }

  addCSSFallbacks() {
    document.body.classList.add('no-gsap');

    const fallbackStyle = document.createElement('style');
    fallbackStyle.textContent = `
      /* CSS Animation Fallbacks */
      .no-gsap .table_row {
        animation: fadeInUp 0.6s ease forwards;
        opacity: 0;
      }

      .no-gsap .table_row:nth-child(1) { animation-delay: 0.1s; }
      .no-gsap .table_row:nth-child(2) { animation-delay: 0.2s; }
      .no-gsap .table_row:nth-child(3) { animation-delay: 0.3s; }
      .no-gsap .table_row:nth-child(4) { animation-delay: 0.4s; }
      .no-gsap .table_row:nth-child(5) { animation-delay: 0.5s; }

      .no-gsap .fullscreen-wrapper > * {
        animation: fadeIn 0.8s ease forwards;
        opacity: 0;
      }

      .no-gsap .header-wrapper { animation-delay: 0.1s; }
      .no-gsap .control { animation-delay: 0.3s; }
      .no-gsap .table_instance { animation-delay: 0.5s; }
      .no-gsap .total-wrapper { animation-delay: 0.7s; }

      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `;
    document.head.appendChild(fallbackStyle);
  }

  // Public method to check if enhancements should be enabled
  shouldUseEnhancements() {
    // Disable heavy animations on older browsers or low-end devices
    const isLowEnd = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
    const isOldBrowser = !CSS.supports('display', 'grid');

    return !isLowEnd && !isOldBrowser;
  }

  // Method to fix common Arc browser issues
  fixArcSpecificIssues() {
    if (!this.isArc) return;

    // Fix Arc's aggressive content blocking
    setTimeout(() => {
      const scripts = document.querySelectorAll('script[src*="cdnjs"]');
      scripts.forEach(script => {
        if (!script.dataset.loaded) {
          console.log('Reloading script for Arc:', script.src);
          const newScript = document.createElement('script');
          newScript.src = script.src;
          newScript.onload = () => {
            script.dataset.loaded = 'true';
            if (script.src.includes('gsap')) {
              // Reinitialize GSAP-dependent features
              if (window.uxEnhancements) {
                window.uxEnhancements.init();
              }
            }
          };
          document.head.appendChild(newScript);
        }
      });
    }, 2000);
  }

  // Debug method to show current state
  debug() {
    const info = {
      browser: {
        webkit: this.isWebKit,
        safari: this.isSafari,
        chrome: this.isChrome,
        arc: this.isArc,
        firefox: this.isFirefox
      },
      features: {
        backdropFilter: CSS.supports('backdrop-filter', 'blur(10px)'),
        gsapLoaded: !!window.gsap,
        uxEnhancementsLoaded: !!window.uxEnhancements
      },
      bodyClasses: Array.from(document.body.classList)
    };

    console.table(info.browser);
    console.table(info.features);
    console.log('Body classes:', info.bodyClasses.join(', '));

    return info;
  }
}

// Initialize browser compatibility fixes
document.addEventListener('DOMContentLoaded', function() {
  window.browserCompatibility = new BrowserCompatibility();

  // Add debug command for troubleshooting
  window.debugBrowser = () => window.browserCompatibility.debug();

  // Fix Arc-specific issues after a delay
  setTimeout(() => {
    if (window.browserCompatibility) {
      window.browserCompatibility.fixArcSpecificIssues();
    }
  }, 3000);
});

export { BrowserCompatibility };