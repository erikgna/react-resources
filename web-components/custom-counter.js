class CustomCounter extends HTMLElement {
  static get observedAttributes() {
    return ["initial"];
  }

  constructor() {
    super();
    // create private dom tree to hide internals from JS or CSS styles outside this element.
    // It's open to allow outside JS to access the shadow element
    this.attachShadow({ mode: "open" });
    this.count = 0;
  }

  connectedCallback() {
    this.count = Number(this.getAttribute("initial")) || 0;
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "initial") {
      this.count = Number(newValue);
      this.update();
    }
  }

  render() {
    this.shadowRoot.innerHTML = `<button id="inc">Count: ${this.count}</button>`;

    this.shadowRoot
      .getElementById("inc")
      .addEventListener("click", () => {
        this.count++;

        // emit event
        this.dispatchEvent(new CustomEvent("count-change", { detail: { value: this.count } }));
        this.update();
      });
  }

  update() {
    this.shadowRoot.getElementById("inc").textContent = `Count: ${this.count}`;
  }
}

// register the custom element to be used
customElements.define("custom-counter", CustomCounter);
