import { HashRouter } from 'react-router-dom';
import { AppRouter } from './routes';
import { AuthProvider } from './store/AuthContext';
import { Toaster } from './components/ui/toaster';

function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppRouter />
        <Toaster />
      </AuthProvider>
    </HashRouter>
  );
}

export default App;
