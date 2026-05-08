import React, { useState, useEffect } from "react";

import {
  TiSocialFacebook,
  TiSocialLinkedin,
  TiSocialTwitter,
  TiSocialInstagram,
  TiSocialGithub,
} from "react-icons/ti";
import { IoCloudDownload, IoSend } from "react-icons/io5";

const Footer = () => {
  const footerStyle = {
    backgroundImage: 'url("assets/img/bg/footer_bg.png")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  return (
    <>
      <footer
        className="site-footer footer__ico pos-rel"
        style={footerStyle}
        suppressHydrationWarning
      >
        <div className="container">
          <div className="row mt-none-30">
            <div className="footer__widget footer__subscribe">
              <h2>Subscribe to our newsletter</h2>
              <p>For latest update of the Arc network</p>
              <form action="">
                <input type="text" placeholder="shrinivas75@gmail.com" />
                <button>
                  <IoSend />
                </button>
              </form>
            </div>
          </div>
          <div className="footer__bottom ul_li_between mt-50">
            <div className="footer__logo mt-20">
              <a href="/">
                <img src="assets/img/logo/logo.svg" alt="" />
              </a>
            </div>
            <div className="footer__social ul_li mt-20">
              <li>
                <a href="https://www.linkedin.com/in/sujal-bedre-4122003-artificialintelligence/">
                  <TiSocialLinkedin />
                </a>
              </li>
              <li>
                <a href="#">
                  <TiSocialTwitter />
                </a>
              </li>
              <li>
                <a href="https://www.instagram.com/qm_sujal/">
                  <TiSocialInstagram />
                </a>
              </li>
              <li>
                <a href="https://github.com/SujalBedre4">
                  <TiSocialGithub />
                </a>
              </li>
            </div>
          </div>
        </div>

        <div className="footer__copyright mt-35">
          <div className="container">
            <div className="footer__copyright-inner ul_li_between ">
              <div className="footer__copyright-text mt-15 white-color">
                <p>© 2025 AI Agents. All rights reserved.</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
