// Web Component for Chat Widget

class ChatWidgetElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._isConnected = false;
    this._resizeObserver = null;
    this._intersectionObserver = null;
    this._mediaQueryList = null;
    this._deviceType = this._getDeviceType();
  }

  static get observedAttributes() {
    return [
      "title",
      "subtitle",
      "position",
      "context-mode",
      "context-rule-id",
      "avatar-src",
      "widget-id",
      "color",
      "size",
      "theme",
      "auto-open",
      "lazy-load",
    ];
  }

  connectedCallback() {
    this._isConnected = true;

    // Validate the origin for security
    this._validateOrigin();

    // Check if lazy loading is enabled
    const lazyLoad = this.getAttribute("lazy-load") === "true";

    if (lazyLoad) {
      // Set up intersection observer for lazy loading
      this._setupIntersectionObserver();
    } else {
      // Render immediately if lazy loading is not enabled
      this.render();
    }

    // Set up resize observer to handle responsive sizing
    this._setupResizeObserver();

    // Set up media query listeners for responsive design
    this._setupMediaQueryListeners();

    // Log embedding for analytics (if needed)
    this._logEmbedding();
  }

  disconnectedCallback() {
    this._isConnected = false;

    // Clean up observers
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }

    if (this._intersectionObserver) {
      this._intersectionObserver.disconnect();
      this._intersectionObserver = null;
    }

    // Clean up media query listeners
    if (this._mediaQueryList) {
      if (this._mediaQueryList.removeEventListener) {
        this._mediaQueryList.removeEventListener(
          "change",
          this._handleOrientationChange,
        );
      } else if (this._mediaQueryList.removeListener) {
        this._mediaQueryList.removeListener(this._handleOrientationChange);
      }
      this._mediaQueryList = null;
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (
      this._isConnected &&
      this.shadowRoot.innerHTML !== "" &&
      oldValue !== newValue
    ) {
      this.render();
    }
  }

  _setupIntersectionObserver() {
    // Only observe if IntersectionObserver is supported
    if ("IntersectionObserver" in window) {
      this._intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              this.render();
              // Once rendered, disconnect the observer
              this._intersectionObserver.disconnect();
            }
          });
        },
        { threshold: 0.1 },
      ); // 10% visibility threshold

      this._intersectionObserver.observe(this);
    } else {
      // Fallback for browsers that don't support IntersectionObserver
      this.render();
    }
  }

  _setupResizeObserver() {
    // Only observe if ResizeObserver is supported
    if ("ResizeObserver" in window) {
      this._resizeObserver = new ResizeObserver((entries) => {
        // Handle resize if needed (e.g., adjust iframe size)
        const iframe = this.shadowRoot.querySelector("iframe");
        if (iframe) {
          const entry = entries[0];
          const width = entry.contentRect.width;
          const height = entry.contentRect.height;

          // Add responsive classes based on width
          if (width < 300) {
            iframe.classList.add("chat-widget-small");
            iframe.classList.remove("chat-widget-medium", "chat-widget-large");
          } else if (width < 500) {
            iframe.classList.add("chat-widget-medium");
            iframe.classList.remove("chat-widget-small", "chat-widget-large");
          } else {
            iframe.classList.add("chat-widget-large");
            iframe.classList.remove("chat-widget-small", "chat-widget-medium");
          }

          // Adjust for very small heights
          if (height < 400) {
            iframe.classList.add("chat-widget-compact");
          } else {
            iframe.classList.remove("chat-widget-compact");
          }

          // Dispatch resize event to iframe content
          this._notifyIframeOfResize(width, height);
        }
      });

      this._resizeObserver.observe(this);
    }
  }

  _notifyIframeOfResize(width, height) {
    // Notify the iframe content about resize events
    const iframe = this.shadowRoot.querySelector("iframe");
    if (iframe && iframe.contentWindow) {
      try {
        const baseUrl = window.location.origin;
        iframe.contentWindow.postMessage(
          {
            type: "chat-widget-resize",
            width,
            height,
            deviceType: this._deviceType,
          },
          baseUrl,
        );
      } catch (e) {
        // Silently fail - iframe might not be loaded yet
      }
    }
  }

  _getDeviceType() {
    // Detect device type based on user agent and screen size
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return "tablet";
    }
    if (
      /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
        ua,
      )
    ) {
      return "mobile";
    }
    return "desktop";
  }

  _setupMediaQueryListeners() {
    // Listen for device orientation changes
    this._mediaQueryList = window.matchMedia("(orientation: portrait)");

    const handleOrientationChange = (e) => {
      // Adjust widget size and position based on orientation
      this._updateWidgetForOrientation(e.matches);
    };

    // Use the appropriate event listener based on browser support
    if (this._mediaQueryList.addEventListener) {
      this._mediaQueryList.addEventListener("change", handleOrientationChange);
    } else if (this._mediaQueryList.addListener) {
      // Fallback for older browsers
      this._mediaQueryList.addListener(handleOrientationChange);
    }

    // Initial check
    handleOrientationChange(this._mediaQueryList);
  }

  _updateWidgetForOrientation(isPortrait) {
    const iframe = this.shadowRoot.querySelector("iframe");
    if (!iframe) return;

    if (this._deviceType === "mobile") {
      if (isPortrait) {
        iframe.style.maxWidth = "100%";
        iframe.style.height = "70vh";
      } else {
        iframe.style.maxWidth = "60%";
        iframe.style.height = "90vh";
      }
    }
  }

  _validateOrigin() {
    // Security: Validate the origin of the embedding page
    const embedOrigin = window.location.origin;
    const allowedOrigins = [
      // List of allowed origins can be dynamically loaded from server
      // For now, we'll allow the current origin and common development origins
      embedOrigin,
      "https://localhost:3000",
      "https://localhost:5173",
      "https://127.0.0.1:5173",
    ];

    // Check if current origin is allowed
    const isAllowedOrigin =
      allowedOrigins.includes(embedOrigin) ||
      embedOrigin.endsWith(".tempolabs.ai") ||
      embedOrigin.startsWith("https://");

    if (!isAllowedOrigin) {
      console.warn(
        "Chat widget embedded on potentially insecure origin:",
        embedOrigin,
      );
      // We don't block the widget, but we add a warning class
      this.classList.add("insecure-origin");
    }

    return isAllowedOrigin;
  }

  _logEmbedding() {
    // Optional: Send anonymous analytics about embedding
    try {
      const widgetId = this.getAttribute("widget-id") || "default";
      const embedUrl = window.location.hostname;
      const browserInfo = {
        userAgent: navigator.userAgent,
        deviceType: this._deviceType,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        isSecureContext: window.isSecureContext,
      };

      // Use sendBeacon if available for non-blocking analytics
      if (navigator.sendBeacon) {
        const baseUrl = window.location.origin;
        const analyticsUrl = `${baseUrl}/api/widget-analytics`;
        const data = new FormData();
        data.append("widgetId", widgetId);
        data.append("embedUrl", embedUrl);
        data.append("event", "embed");
        data.append("browserInfo", JSON.stringify(browserInfo));
        navigator.sendBeacon(analyticsUrl, data);
      }
    } catch (e) {
      // Silently fail analytics - should not affect widget functionality
    }
  }

  render() {
    // Get attributes with defaults
    const title = this.getAttribute("title") || "Chat Assistant";
    const subtitle = this.getAttribute("subtitle") || "Ask me anything";
    const position = this.getAttribute("position") || "bottom-right";
    const contextMode = this.getAttribute("context-mode") || "general";
    const contextRuleId = this.getAttribute("context-rule-id") || "";
    const avatarSrc = this.getAttribute("avatar-src") || "";
    const widgetId = this.getAttribute("widget-id") || "";
    const color = this.getAttribute("color") || "";
    const size = this.getAttribute("size") || "medium";
    const theme = this.getAttribute("theme") || "light";
    const autoOpen = this.getAttribute("auto-open") === "true";

    // Create iframe with parameters
    const iframe = document.createElement("iframe");
    const baseUrl = window.location.origin;
    let url = `${baseUrl}/chat-embed?`;
    url += `title=${encodeURIComponent(title)}`;
    url += `&subtitle=${encodeURIComponent(subtitle)}`;
    url += `&position=${encodeURIComponent(position)}`;
    url += `&contextMode=${encodeURIComponent(contextMode)}`;
    url += `&deviceType=${encodeURIComponent(this._deviceType)}`;

    if (contextRuleId) {
      url += `&contextRuleId=${encodeURIComponent(contextRuleId)}`;
    }

    if (avatarSrc) {
      url += `&avatarSrc=${encodeURIComponent(avatarSrc)}`;
    }

    if (widgetId) {
      url += `&widgetId=${encodeURIComponent(widgetId)}`;
    }

    if (color) {
      url += `&color=${encodeURIComponent(color)}`;
    }

    if (size) {
      url += `&size=${encodeURIComponent(size)}`;
    }

    if (theme) {
      url += `&theme=${encodeURIComponent(theme)}`;
    }

    if (autoOpen) {
      url += `&autoOpen=true`;
    }

    // Add referrer information for security validation
    url += `&embedOrigin=${encodeURIComponent(window.location.origin)}`;
    url += `&timestamp=${Date.now()}`; // Prevent caching issues

    // Security: Add a CSRF token if available
    const csrfToken = this._getCsrfToken();
    if (csrfToken) {
      url += `&csrfToken=${encodeURIComponent(csrfToken)}`;
    }

    iframe.src = url;
    iframe.style.border = "none";
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.minHeight = this._deviceType === "mobile" ? "500px" : "600px";
    iframe.style.maxHeight = this._deviceType === "mobile" ? "600px" : "800px";
    iframe.style.borderRadius = "12px";
    iframe.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
    iframe.style.backgroundColor = "white";
    iframe.style.transition = "all 0.3s ease";
    iframe.allow = "microphone; camera";
    iframe.title = "Chat Widget";
    iframe.setAttribute("loading", "lazy");
    iframe.setAttribute("importance", "low");
    iframe.setAttribute(
      "sandbox",
      "allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox",
    );
    iframe.setAttribute("referrerpolicy", "origin");

    // Add responsive class based on size and device type
    iframe.classList.add(`chat-widget-${size}`);
    iframe.classList.add(`chat-widget-${this._deviceType}`);

    // Create and append stylesheet for iframe
    const style = document.createElement("style");
    style.textContent = `
      :host {
        display: block;
        width: 100%;
        height: 100%;
        min-height: ${this._deviceType === "mobile" ? "500px" : "600px"};
        max-height: ${this._deviceType === "mobile" ? "600px" : "800px"};
      }
      
      iframe {
        transition: opacity 0.3s ease, transform 0.3s ease;
      }
      
      iframe.loading {
        opacity: 0;
        transform: translateY(10px);
      }
      
      .chat-widget-small {
        max-width: 300px;
      }
      
      .chat-widget-medium {
        max-width: 380px;
      }
      
      .chat-widget-large {
        max-width: 450px;
      }
      
      .chat-widget-compact {
        min-height: 400px !important;
      }
      
      .chat-widget-mobile {
        max-width: 100% !important;
      }
      
      .chat-widget-tablet {
        max-width: 450px;
      }
      
      @media (max-width: 480px) {
        :host {
          width: 100% !important;
          min-height: 500px;
        }
        
        iframe {
          width: 100% !important;
          min-height: 500px;
          border-radius: 0 !important;
        }
      }
      
      @media (max-width: 768px) and (orientation: landscape) {
        :host {
          height: 90vh;
          min-height: 300px;
        }
        
        iframe {
          height: 90vh;
          min-height: 300px;
        }
      }
      
      /* Dark mode support */
      @media (prefers-color-scheme: dark) {
        iframe {
          background-color: #1a1a1a;
        }
      }
      
      /* High contrast mode support */
      @media (forced-colors: active) {
        iframe {
          border: 2px solid CanvasText;
        }
      }
      
      /* Reduced motion preference */
      @media (prefers-reduced-motion: reduce) {
        iframe {
          transition: opacity 0.1s ease;
        }
      }
    `;

    // Add loading class initially
    iframe.classList.add("loading");

    // Handle iframe load event
    iframe.onload = () => {
      iframe.classList.remove("loading");

      // Set up message event listener for cross-frame communication
      window.addEventListener("message", (event) => {
        // Verify the origin for security
        if (event.origin !== baseUrl) return;

        // Handle messages from the iframe
        if (event.data && event.data.type === "chat-widget-event") {
          // Dispatch custom event that can be listened to by the embedding page
          const customEvent = new CustomEvent("chat-widget-event", {
            detail: event.data,
            bubbles: true,
            composed: true,
          });

          this.dispatchEvent(customEvent);
        }
      });

      // Notify iframe of current size
      this._notifyIframeOfResize(this.clientWidth, this.clientHeight);
    };

    // Clear and append
    this.shadowRoot.innerHTML = "";
    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(iframe);
  }

  _getCsrfToken() {
    // Try to get CSRF token from meta tag or cookies
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) {
      return metaTag.getAttribute("content");
    }

    // Fallback: try to get from cookies
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.startsWith("XSRF-TOKEN=")) {
        return cookie.substring("XSRF-TOKEN=".length, cookie.length);
      }
    }

    return null;
  }
}

// Define the custom element
if (!customElements.get("chat-widget")) {
  customElements.define("chat-widget", ChatWidgetElement);
}
