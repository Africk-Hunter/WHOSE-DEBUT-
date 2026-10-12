import React from "react";
import { Link } from "react-router-dom";

const Footer: React.FC = () => {
  return (
    <>
      <nav className="preFooter" aria-label="Site map">
        <Link to="/">Home</Link>
        <Link to="/#stillFresh">Still Fresh</Link>
        <Link to="/#archive">Archive</Link>
        <Link to="/submission">Submit Your Release</Link>
        <Link to="/about">About &amp; Contact</Link>
      </nav>
      <section className="footer" id='footer'>
        <p className="footerText">Copyright © 2026 WhoseDebut.com - All Rights Reserved.</p>
        <p className="footerText">Designed & Developed by Hunter Africk | <span className="portfolioLink"><a href='https://hunterafrick.com/' target="_blank">hunterafrick.com</a></span></p>
      </section>
    </>
  );
};

export default Footer;
