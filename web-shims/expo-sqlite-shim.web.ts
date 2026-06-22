// Web shim for expo-sqlite module
// On web, Metro will use this file instead of trying to load the native expo-sqlite
// which pulls in .wasm files

import React from 'react';

export const SQLiteProvider = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(React.Fragment, {}, children);
};

export const useSQLiteContext = () => {
  return {};
};
