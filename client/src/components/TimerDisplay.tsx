import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Typography,
  Button,
  Box,
  Paper,
  Grid,
  Chip,
  LinearProgress,
  Card,
  CardContent,
  MenuItem,
  Select,
  FormControl,
} from '@mui/material';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import LanguageIcon from '@mui/icons-material/Language';

const socket = io();
const START_DELAY = 10;

interface RallyLeader {
  id: string;
  name: string;
  marchTime: number; // in seconds
}

interface RallyData {
  mainRallies: RallyLeader[];
  counterRallies: RallyLeader[];
  ghostRallies: RallyLeader[];
  counterCounterRallies: RallyLeader[];
  secondGhostRallies: RallyLeader[];
  settings: {
    counterOffset: number;
    ghostOffset: number;
    counterCounterOffset: number;
    secondGhostOffset: number;
  };
}

interface TimerState {
  startTime: number | null;
  status: 'idle' | 'counting' | 'paused' | 'finished';
}

const formatTime = (seconds: number): string => {
  if (seconds <= 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? "0" + s : s}`;
};

const TimerDisplay: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [rallyData, setRallyData] = useState<RallyData>({
    mainRallies: [],
    counterRallies: [],
    ghostRallies: [],
    counterCounterRallies: [],
    secondGhostRallies: [],
    settings: {
      counterOffset: 0,
      ghostOffset: 0,
      counterCounterOffset: 0,
      secondGhostOffset: 0,
    },
  });
  const [timerState, setTimerState] = useState<TimerState>({
    startTime: null,
    status: 'idle',
  });
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    axios.get('/api/rallies')
      .then(response => {
        setRallyData(response.data);
        if (response.data.timerState) setTimerState(response.data.timerState);
      })
      .catch(err => console.error("Error fetching initial rallies:", err));

    socket.on('update', (data: RallyData) => setRallyData(data));
    socket.on('start-timer', (startTime: number) => setTimerState({ startTime, status: 'counting' }));
    socket.on('cancel-timer', () => {
      setTimerState({ startTime: null, status: 'idle' });
      setElapsed(0);
    });

    return () => {
      socket.off('update');
      socket.off('start-timer');
      socket.off('cancel-timer');
    };
  }, []);

  const calculateTimeline = (data: RallyData) => {
    const maxMain = data.mainRallies.reduce((max, l) => Math.max(max, l.marchTime), 0);
    
    const counterStart = maxMain + data.settings.counterOffset;
    const maxCounter = data.counterRallies.reduce((max, l) => Math.max(max, l.marchTime), 0);
    const counterHit = counterStart + maxCounter;

    const ghostStart = counterHit + data.settings.ghostOffset;
    const maxGhost = data.ghostRallies.reduce((max, l) => Math.max(max, l.marchTime), 0);
    const ghostHit = ghostStart + maxGhost;

    const counterCounterStart = ghostHit + data.settings.counterCounterOffset;
    const maxCounterCounter = data.counterCounterRallies.reduce((max, l) => Math.max(max, l.marchTime), 0);
    const counterCounterHit = counterCounterStart + maxCounterCounter;

    const secondGhostStart = counterCounterHit + data.settings.secondGhostOffset;
    const maxSecondGhost = data.secondGhostRallies.reduce((max, l) => Math.max(max, l.marchTime), 0);
    
    return { 
      maxMain, 
      counterStart, maxCounter, 
      ghostStart, maxGhost,
      counterCounterStart, maxCounterCounter, 
      secondGhostStart, maxSecondGhost,
      operationTotalTime: secondGhostStart + maxSecondGhost 
    };
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (timerState.status === 'counting' && timerState.startTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const currentElapsed = (now - timerState.startTime!) / 1000;
        setElapsed(currentElapsed);

        const timeline = calculateTimeline(rallyData);
        if (currentElapsed > timeline.operationTotalTime + START_DELAY + 1) {
          setTimerState(prev => ({ ...prev, status: 'finished' }));
          if (interval) clearInterval(interval);
        }
      }, 100);
    } else {
      setElapsed(0);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [timerState, rallyData]);

  const timeline = useMemo(() => calculateTimeline(rallyData), [rallyData]);

  const getStatusConfig = (leader: RallyLeader, groupStart: number, groupMax: number) => {
    const launchDelay = groupMax - leader.marchTime;
    const absoluteLaunchTime = START_DELAY + groupStart + launchDelay;
    const timeUntilLaunch = absoluteLaunchTime - elapsed;
    const timeUntilHit = (START_DELAY + groupStart + groupMax) - elapsed;

    if (timerState.status === 'idle') return { label: t('STANDBY'), color: '#757575', launch: absoluteLaunchTime, hit: leader.marchTime, active: false };
    if (timeUntilLaunch > 10) return { label: t('WAITING'), color: '#9e9e9e', launch: timeUntilLaunch, hit: timeUntilHit, active: false };
    if (timeUntilLaunch > 0) return { label: t('GET READY'), color: '#ffa000', launch: timeUntilLaunch, hit: timeUntilHit, active: true, pulse: true };
    if (timeUntilLaunch > -2) return { label: t('LAUNCH NOW'), color: '#d32f2f', launch: 0, hit: timeUntilHit, active: true, shake: true };
    if (timeUntilHit > 0) return { label: t('IN TRANSIT'), color: '#1976d2', launch: 0, hit: timeUntilHit, active: true };
    return { label: t('HIT TARGET'), color: '#388e3c', launch: 0, hit: 0, active: false };
  };

  const renderRallySection = (type: keyof RallyData, title: string, groupStart: number, groupMax: number) => {
    const list = rallyData[type] as RallyLeader[];
    if (!list) return null;

    return (
      <Grid size={{ xs: 12, md: 4 }}>
        <Typography variant="h5" align="center" gutterBottom sx={{ fontWeight: 800, color: '#1a237e', mb: 2 }}>
          {t(title)}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {list.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: '#f5f5f5' }}>
              <Typography variant="body2" color="textSecondary">{t('No leaders assigned')}</Typography>
            </Paper>
          ) : (
            list.map(leader => {
              const status = getStatusConfig(leader, groupStart, groupMax);
              return (
                <Card 
                  key={leader.id} 
                  elevation={status.active ? 8 : 1}
                  sx={{ 
                    borderLeft: `8px solid ${status.color}`,
                    bgcolor: status.label === t('LAUNCH NOW') ? '#fff4f4' : 'white',
                    transform: status.label === t('LAUNCH NOW') ? 'scale(1.02)' : 'none',
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  <CardContent sx={{ p: '16px !important' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>{leader.name}</Typography>
                      <Chip 
                        label={status.label} 
                        sx={{ 
                          bgcolor: status.color, 
                          color: 'white', 
                          fontWeight: 900,
                          fontSize: '0.7rem',
                          height: 24,
                          animation: status.pulse ? 'pulse 1s infinite' : 'none'
                        }} 
                      />
                    </Box>
                    
                    <Grid container spacing={2}>
                      <Grid size={6}>
                        <Typography variant="caption" sx={{ color: '#666', fontWeight: 700, display: 'block', mb: 0.5 }}>{t('LAUNCH IN')}</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 900, color: status.label === t('LAUNCH NOW') ? '#d32f2f' : '#222' }}>
                          {formatTime(status.launch)}
                        </Typography>
                      </Grid>
                      <Grid size={6} sx={{ borderLeft: '1px solid #eee' }}>
                        <Typography variant="caption" sx={{ color: '#666', fontWeight: 700, display: 'block', mb: 0.5 }}>{t('HIT IN')}</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 900, color: '#444' }}>
                          {formatTime(status.hit)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              );
            })
          )}
        </Box>
      </Grid>
    );
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, pb: 8 }}>
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.6; }
          100% { opacity: 1; }
        }
      `}</style>

      {/* Language Switcher */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, alignItems: 'center', gap: 1 }}>
        <LanguageIcon color="action" />
        <FormControl variant="standard" size="small" sx={{ minWidth: 120 }}>
          <Select
            value={i18n.language.split('-')[0]}
            onChange={(e) => changeLanguage(e.target.value)}
            displayEmpty
          >
            <MenuItem value="en">English</MenuItem>
            <MenuItem value="fr">Français</MenuItem>
            <MenuItem value="tr">Türkçe</MenuItem>
            <MenuItem value="de">Deutsch</MenuItem>
            <MenuItem value="sv">Svenska</MenuItem>
            <MenuItem value="es">Español</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Hero Header & Warmup */}
      <Paper elevation={0} sx={{ p: 4, mb: 4, borderRadius: 4, bgcolor: '#1a237e', color: 'white', textAlign: 'center' }}>
        <Typography variant="h2" sx={{ fontWeight: 900, mb: 1, letterSpacing: -1 }}>{t('RALLY COMMAND')}</Typography>
        
        {timerState.status === 'counting' && elapsed < START_DELAY ? (
          <Box sx={{ mt: 3, p: 3, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2, border: '2px dashed rgba(255,255,255,0.3)' }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: '#4fc3f7' }}>{t('SYSTEM WARMUP IN PROGRESS')}</Typography>
            <Typography variant="h1" sx={{ fontWeight: 950, color: '#fff' }}>{Math.ceil(START_DELAY - elapsed)}</Typography>
            <Typography variant="subtitle1">{t('GET READY TO LAUNCH THE FIRST MARCH')}</Typography>
          </Box>
        ) : (
          <Typography variant="h6" sx={{ opacity: 0.7, fontWeight: 500 }}>
            {timerState.status === 'idle' ? t('READY TO COORDINATE') : timerState.status === 'finished' ? t('OPERATION COMPLETE') : t('OPERATION LIVE')}
          </Typography>
        )}

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button
            variant="contained"
            size="large"
            color="success"
            onClick={() => socket.emit('start-timer', Date.now())}
            disabled={timerState.status === 'counting'}
            startIcon={<RocketLaunchIcon />}
            sx={{ px: 4, py: 1.5, borderRadius: 2, fontWeight: 900, fontSize: '1.1rem' }}
          >
            {t('INITIATE OPERATION')}
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => socket.emit('cancel-timer')}
            disabled={timerState.status === 'idle'}
            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', px: 4, borderRadius: 2, fontWeight: 700 }}
          >
            {t('ABORT')}
          </Button>
        </Box>
      </Paper>

      {/* Global Progress */}
      {timerState.status === 'counting' && (
        <Box sx={{ mb: 6 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1a237e' }}>{t('TOTAL MISSION PROGRESS')}</Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1a237e' }}>{Math.round((elapsed / (timeline.operationTotalTime + START_DELAY)) * 100)}%</Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={Math.min(100, (elapsed / (timeline.operationTotalTime + START_DELAY)) * 100)} 
            sx={{ height: 16, borderRadius: 8, bgcolor: '#e0e0e0', '& .MuiLinearProgress-bar': { bgcolor: '#1a237e', borderRadius: 8 } }}
          />
        </Box>
      )}

      <Grid container spacing={4}>
        {renderRallySection('mainRallies', 'Main Rallies', 0, timeline.maxMain)}
        {renderRallySection('counterRallies', 'Counter Rallies', timeline.counterStart, timeline.maxCounter)}
        {renderRallySection('ghostRallies', 'Ghost Rallies', timeline.ghostStart, timeline.maxGhost)}
        {renderRallySection('counterCounterRallies', 'Counter-Counter Rallies', timeline.counterCounterStart, timeline.maxCounterCounter)}
        {renderRallySection('secondGhostRallies', 'Second Ghost Rallies', timeline.secondGhostStart, timeline.maxSecondGhost)}
      </Grid>
    </Container>
  );
};

export default TimerDisplay;