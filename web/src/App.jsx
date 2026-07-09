import { useEffect } from 'react';
import { AppRouter } from './router/AppRouter';
import { useAuthStore } from './store/useAuthStore';

function App() {
  const initializeAuthListener = useAuthStore((state) => state.initializeAuthListener);

  useEffect(() => {
    initializeAuthListener();
  }, [initializeAuthListener]);

  return <AppRouter />;
}

export default App;
