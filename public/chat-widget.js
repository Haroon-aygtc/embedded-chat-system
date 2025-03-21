// Web Component for Chat Widget

class ChatWidgetElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  static get observedAttributes() {
    return [
      "title",
      "subtitle",
      "position",
      "context-mode",
      "context-rule-id",
      "avatar-src",
    ];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    if (this.shadowRoot.innerHTML !== "") {
      this.render();
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

    // Create iframe with parameters
    const iframe = document.createElement("iframe");
    const baseUrl = window.location.origin;
    let url = `${baseUrl}/chat-embed?`;
    url += `title=${encodeURIComponent(title)}`;
    url += `&subtitle=${encodeURIComponent(subtitle)}`;
    url += `&position=${encodeURIComponent(position)}`;
    url += `&contextMode=${encodeURIComponent(contextMode)}`;

    if (contextRuleId) {
      url += `&contextRuleId=${encodeURIComponent(contextRuleId)}`;
    }

    if (avatarSrc) {
      url += `&avatarSrc=${encodeURIComponent(avatarSrc)}`;
    }

    iframe.src = url;
    iframe.style.border = "none";
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.minHeight = "600px";
    iframe.allow = "microphone";

    // Clear and append
    this.shadowRoot.innerHTML = "";
    this.shadowRoot.appendChild(iframe);
  }
}

// Define the custom element
customElements.define("chat-widget", ChatWidgetElement);
