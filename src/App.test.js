import { render, screen } from '@testing-library/react';
import App from './App';

// Keep the smoke test deterministic: a signed-out visitor lands on the
// sign-in gate. Mocking the auth SDK boundary avoids real Firebase calls.
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  GoogleAuthProvider: jest.fn(),
  onAuthStateChanged: (auth, cb) => {
    cb(null);
    return () => {};
  },
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
}));

test('renders the sign-in gate for a signed-out visitor', () => {
  render(<App />);
  expect(screen.getByText(/go to nanmamaram app/i)).toBeInTheDocument();
});
