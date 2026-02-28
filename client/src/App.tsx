import './App.css';
import { Link as RouterLink, Route, Routes } from 'react-router-dom';
import AdminPanel from './components/AdminPanel';
import TimerDisplay from './components/TimerDisplay';
import WikiPage from './components/WikiPage';
import LeaderView from './components/LeaderView';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';

function App() {
  const { t } = useTranslation();

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Rally Timer
          </Typography>
          <Button color="inherit" component={RouterLink} to="/">
            Timer
          </Button>
          <Button color="inherit" component={RouterLink} to="/admin">
            Admin
          </Button>
          <Button color="inherit" component={RouterLink} to="/wiki">
            {t('Wiki')}
          </Button>
        </Toolbar>
      </AppBar>
      <Box sx={{ p: 3 }}>
        <Routes>
          <Route path="/" element={<TimerDisplay />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/wiki" element={<WikiPage />} />
          <Route path="/leader/:type/:id" element={<LeaderView />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default App;