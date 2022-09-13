import React from 'react';

const AppFooter = () => {
  return (
    <div className="layout-footer">
      <div className="footer-logo-container">
        <img
          id="footer-logo"
          src={process.env.PUBLIC_URL+"/assets/layout/images/logo-dark.svg"}
          alt="diamond-layout"
        />
        <span className="app-name">IFM</span>
      </div>
      <span className="copyright">&#169; Signum TTE - 2022</span>
    </div>
  );
};

export default AppFooter;
