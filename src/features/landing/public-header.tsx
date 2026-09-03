import { Link, useRouterState } from "@tanstack/react-router";
import { List, X } from "@phosphor-icons/react";
import { useState } from "react";

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const isHome = useRouterState({ select: (state) => state.location.pathname === "/" });

  const close = () => setOpen(false);

  return (
    <header className="landing-header">
      <nav className="island-nav" aria-label="Primary navigation">
        <Link
          className="landing-wordmark"
          to="/"
          aria-current={isHome ? "page" : undefined}
          onClick={close}
        >
          <span className="landing-mark" aria-hidden>
            <span />
          </span>
          <span>Northstar demo</span>
        </Link>

        <div className="desktop-nav">
          <a href="/#benefits">Benefits</a>
          <a href="/#workflow">How it works</a>
          <a href="/#proof">Roles</a>
        </div>

        <a className="header-demo-link" href="/#agent-demo">
          Open clinic
        </a>

        <button
          className={`nav-menu-button${open ? " is-open" : ""}`}
          type="button"
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-label={open ? "Close navigation" : "Open navigation"}
          onClick={() => setOpen((value) => !value)}
        >
          <List className="menu-open-icon" aria-hidden weight="bold" />
          <X className="menu-close-icon" aria-hidden weight="bold" />
        </button>
      </nav>

      <div className={`mobile-nav-overlay${open ? " is-open" : ""}`} id="mobile-navigation">
        <nav aria-label="Mobile navigation">
          <a href="/#benefits" onClick={close}>
            Benefits
          </a>
          <a href="/#workflow" onClick={close}>
            How it works
          </a>
          <a href="/#proof" onClick={close}>
            Roles
          </a>
          <a href="/#agent-demo" onClick={close}>
            Open the clinic workspace
          </a>
        </nav>
      </div>
    </header>
  );
}
