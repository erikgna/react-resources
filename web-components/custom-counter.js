class CustomCounter extends HTMLElement {
  static get observedAttributes() {
    return ["initial"];
  }

  constructor() {
    super();
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

customElements.define("custom-counter", CustomCounter);