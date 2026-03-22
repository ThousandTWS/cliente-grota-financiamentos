"use client";
import React from "react";
import { useHideValues } from "@/application/core/context/HideValuesContext";

interface HideValueProps {
  value: React.ReactNode;
  placeholder?: string;
  isCurrency?: boolean;
}

export const HideValue: React.FC<HideValueProps> = ({ 
  value, 
  placeholder,
  isCurrency = false 
}) => {
  const { isHidden } = useHideValues();
  
  const defaultPlaceholder = isCurrency ? "R$ ••••••" : "••••••";
  const displayPlaceholder = placeholder || defaultPlaceholder;
  
  return <>{isHidden ? displayPlaceholder : value}</>;
};
