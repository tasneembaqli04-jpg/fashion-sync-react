import { Component } from "react";

/**
 * Catches a render error and shows a message in place of the crashed subtree.
 *
 * React unmounts the whole tree when a render throws, so without a boundary a
 * single bad value anywhere blanks the entire page. One boundary around the
 * router keeps that from happening; one around each panel keeps the failure
 * inside the panel, so the rest of the screen and the navigation still work.
 *
 * Written as a class because that is the only way to catch a render error —
 * there is no hook equivalent.
 *
 * The message is deliberately plain and carries no details of the fault: the
 * customer cannot act on a stack trace, and it belongs in the console.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error("Render failed:", error, info?.componentStack);
  }

  componentDidUpdate(prevProps) {
    // Moving to another panel clears the failure, so one broken screen does
    // not keep showing its message after the customer has navigated away.
    if (this.state.failed && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ failed: false });
    }
  }

  render() {
    if (!this.state.failed) {
      return this.props.children;
    }

    return (
      <div
        role="alert"
        style={{
          padding: "2rem 1rem",
          textAlign: "center",
          color: "var(--muted)",
        }}
      >
        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⚠️</div>
        <div style={{ fontWeight: 700, color: "var(--text)" }}>
          {this.props.title}
        </div>
        <div style={{ marginTop: "0.4rem" }}>{this.props.message}</div>
      </div>
    );
  }
}
