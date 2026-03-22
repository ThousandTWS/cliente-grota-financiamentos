"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

interface HideValuesContextData {
  isHidden: boolean;
  toggleHideValues: () => void;
}

const HideValuesContext = createContext<HideValuesContextData>({} as HideValuesContextData);

export const HideValuesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("@Grota:hideValues");
    if (stored) {
      setIsHidden(JSON.parse(stored));
    }
  }, []);

  const toggleHideValues = () => {
    setIsHidden((prev) => {
      const newVal = !prev;
      localStorage.setItem("@Grota:hideValues", JSON.stringify(newVal));
      return newVal;
    });
  };

  return (
    <HideValuesContext.Provider value={{ isHidden, toggleHideValues }}>
      {children}
    </HideValuesContext.Provider>
  );
};

export const useHideValues = () => useContext(HideValuesContext);
