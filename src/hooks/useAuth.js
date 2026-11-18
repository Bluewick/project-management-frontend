import { useContext } from 'react';
import { AuthContext } from '../context/contexts.js';

/**
 * Access global authentication state and session actions.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
}
