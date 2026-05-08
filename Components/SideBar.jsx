import React, { useEffect, useState } from "react";

const SideBar = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <>
      <div className="body-overlay"></div>
      <aside className="slide-bar">
        <div className="close-mobile-menu">
          <a href="javascript:void(0);" className="tx-close"></a>
        </div>
        <nav className="side-mobile-menu">
          <a href="/" className="header__logo mb-30">
            <img src="assets/img/logo/logo.svg" alt="Logo" />
          </a>
          <div className="header-mobile-search">
            <form action="#" role="search">
              <input type="text" placeholder="Search..." />
              <button type="submit">
                <i className="fas fa-search"></i>
              </button>
            </form>
          </div>
          <ul id="mobile-menu-active" suppressHydrationWarning>
            <li>
              <a className="scrollspy-btn" href="/">
                Home
              </a>
            </li>
            <li>
              <a className="scrollspy-btn" href="#about">
                About
              </a>
            </li>
            <li>
              <a className="scrollspy-btn" href="#features">
                Feature
              </a>
            </li>
            <li>
              <a className="scrollspy-btn" href="#optimizer">
                AI Router
              </a>
            </li>
            <li>
              <a className="scrollspy-btn" href="#dashboard">
                Dashboard
              </a>
            </li>
            <li>
              <a className="scrollspy-btn" href="#faq">
                FAQ
              </a>
            </li>
            <li>
              <a className="scrollspy-btn" href="#contact">
                Contact
              </a>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default SideBar;
