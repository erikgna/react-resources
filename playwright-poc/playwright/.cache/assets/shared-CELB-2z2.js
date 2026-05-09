import { g as getDefaultExportFromCjs, r as reactExports } from './index-DOy_UqYY.js';

var jsxRuntime$2 = {exports: {}};

var reactJsxRuntime_production = {};

/**
 * @license React
 * react-jsx-runtime.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var hasRequiredReactJsxRuntime_production;

function requireReactJsxRuntime_production () {
	if (hasRequiredReactJsxRuntime_production) return reactJsxRuntime_production;
	hasRequiredReactJsxRuntime_production = 1;
	"use strict";
	var REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element"),
	  REACT_FRAGMENT_TYPE = Symbol.for("react.fragment");
	function jsxProd(type, config, maybeKey) {
	  var key = null;
	  void 0 !== maybeKey && (key = "" + maybeKey);
	  void 0 !== config.key && (key = "" + config.key);
	  if ("key" in config) {
	    maybeKey = {};
	    for (var propName in config)
	      "key" !== propName && (maybeKey[propName] = config[propName]);
	  } else maybeKey = config;
	  config = maybeKey.ref;
	  return {
	    $$typeof: REACT_ELEMENT_TYPE,
	    type: type,
	    key: key,
	    ref: void 0 !== config ? config : null,
	    props: maybeKey
	  };
	}
	reactJsxRuntime_production.Fragment = REACT_FRAGMENT_TYPE;
	reactJsxRuntime_production.jsx = jsxProd;
	reactJsxRuntime_production.jsxs = jsxProd;
	return reactJsxRuntime_production;
}

var jsxRuntime$1 = jsxRuntime$2.exports;

var hasRequiredJsxRuntime;

function requireJsxRuntime () {
	if (hasRequiredJsxRuntime) return jsxRuntime$2.exports;
	hasRequiredJsxRuntime = 1;
	"use strict";
	if (true) {
	  jsxRuntime$2.exports = requireReactJsxRuntime_production();
	} else {
	  module.exports = require("./cjs/react-jsx-runtime.development.js");
	}
	return jsxRuntime$2.exports;
}

var jsxRuntimeExports = requireJsxRuntime();
const jsxRuntime = /*@__PURE__*/getDefaultExportFromCjs(jsxRuntimeExports);

const ui = {
  h2: { fontSize: 18, marginBottom: 8, color: "#e0e0e0" },
  desc: { color: "#666", fontSize: 13, marginBottom: 24, lineHeight: 1.6 },
  input: {
    background: "#111",
    border: "1px solid #2a2a2a",
    color: "#e0e0e0",
    padding: "5px 9px",
    borderRadius: 3,
    fontSize: 13,
    outline: "none"
  }
};
function Section({ title, children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
    background: "#141414",
    border: "1px solid #1e1e1e",
    borderRadius: 4,
    padding: 18,
    marginBottom: 14
  }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { fontSize: 12, color: "#4a9eff", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }, children: title }),
    children
  ] });
}
function Row({ children, style }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", ...style }, children });
}
function Btn({ onClick, children, danger, disabled }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick, disabled, style: {
    padding: "5px 12px",
    background: danger ? "#2a1111" : "#1e1e1e",
    border: `1px solid ${danger ? "#5a1111" : "#2a2a2a"}`,
    color: danger ? "#ff6b6b" : "#c0c0c0",
    borderRadius: 3,
    fontSize: 12,
    opacity: disabled ? 0.4 : 1
  }, children });
}
function Info({ children, style }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { fontSize: 13, color: "#888", marginBottom: 10, lineHeight: 1.6, ...style }, children });
}
function Pre({ children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { style: {
    background: "#0a0a0a",
    border: "1px solid #1e1e1e",
    borderRadius: 3,
    padding: 12,
    fontSize: 12,
    overflowX: "auto",
    color: "#7ec8a0",
    marginTop: 10,
    lineHeight: 1.6
  }, children });
}
function Log({ entries }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
    background: "#0a0a0a",
    border: "1px solid #1e1e1e",
    borderRadius: 3,
    padding: 10,
    maxHeight: 160,
    overflowY: "auto",
    marginTop: 10,
    fontSize: 12,
    fontFamily: "monospace"
  }, children: entries.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "#333" }, children: "— no actions yet —" }) : entries.map((e, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#7ec8a0", lineHeight: 1.5 }, children: e }, i)) });
}
class ErrorBoundary extends reactExports.Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch() {
  }
  reset = () => this.setState({ error: null });
  render() {
    if (this.state.error) {
      return this.props.fallback ? this.props.fallback(this.state.error) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#1a0808", border: "1px solid #5a1111", borderRadius: 4, padding: 14 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#ff6b6b", fontSize: 12, marginBottom: 6 }, children: "Caught by ErrorBoundary" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#cc4444", fontSize: 12, fontFamily: "monospace" }, children: this.state.error.message }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: this.reset, style: { marginTop: 10, padding: "4px 10px", background: "#2a1111", border: "1px solid #5a1111", color: "#ff6b6b", borderRadius: 3, fontSize: 11 }, children: "Reset" })
      ] });
    }
    return this.props.children;
  }
}

export { Info as I, Log as L, Pre as P, Row as R, Section as S, jsxRuntimeExports as j };
//# sourceMappingURL=shared-CELB-2z2.js.map
