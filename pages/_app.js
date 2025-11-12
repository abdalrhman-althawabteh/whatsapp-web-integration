/**
 * Next.js App Wrapper
 * Provides global context and styles
 */

import { AuthProvider } from '../src/hooks/useAuth';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;
