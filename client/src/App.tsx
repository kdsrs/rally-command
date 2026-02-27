import './App.css';
import { Link as RouterLink, Route, Routes } from 'react-router-dom';
import AdminPanel from './components/AdminPanel';
import TimerDisplay from './components/TimerDisplay';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';

function App() {
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
        </Toolbar>
      </AppBar>
      <Box sx={{ p: 3 }}>
        <Routes>
          <Route path="/" element={<TimerDisplay />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default App;