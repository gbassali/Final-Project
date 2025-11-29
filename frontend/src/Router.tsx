import { useState, useEffect } from 'react';
import App from './App';
import Admin from './Admin';

export default function Router() {
  const [route, setRoute] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (route === '#admin') {
    return <Admin />;
  }

  return <App />;
}

