import { useState } from "react";

const Tooltip = ({ children, text }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onTouchStart={() => setVisible(!visible)}
    >
      {children}
      {visible && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 bg-gray-800 text-white text-xs text-center rounded-lg p-2 shadow-lg z-50">
          {text}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
