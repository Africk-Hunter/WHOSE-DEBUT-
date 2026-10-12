import React from "react";

const LoadingScreen: React.FC = () => {
  return (
    <div className="loadingScreen">
      <div className="loadingTurntable" aria-hidden="true">
        <div className="loadingRecord"></div>
        <div className="loadingTonearm"></div>
      </div>
      <p className="loadingText">Loading</p>
    </div>
  );
};

export default LoadingScreen;
