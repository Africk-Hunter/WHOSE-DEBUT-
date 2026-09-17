import React from "react";

const LoadingScreen: React.FC = () => {
  return (
    <div className="loadingScreen">
      <div className="loadingSpinner"></div>
      <p className="loadingText">Loading</p>
    </div>
  );
};

export default LoadingScreen;
