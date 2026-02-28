import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Chip,
  LinearProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const socket = io();
const START_DELAY = 10;

interface RallyLeader {
  id: string;
  name: string;
  marchTime: number;
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

const LeaderView: React.FC = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const { t } = useTranslation();
  
  const [rallyData, setRallyData] = useState<RallyData | null>(null);
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
      .catch(err => console.error("Error fetching data:", err));

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

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (timerState.status === 'counting' && timerState.startTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const currentElapsed = (now - timerState.startTime!) / 1000;
        setElapsed(currentElapsed);
      }, 100);
    } else {
      setElapsed(0);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [timerState]);

  const leaderData = useMemo(() => {
    if (!rallyData || !type || !id) return null;
    const list = rallyData[type as keyof RallyData] as RallyLeader[];
    const leader = list.find(l => l.id === id);
    if (!leader) return null;

    // Calculate absolute timing based on the 5-phase operation
    const maxMain = rallyData.mainRallies.reduce((max, l) => Math.max(max, l.marchTime), 0);
    const maxCounter = rallyData.counterRallies.reduce((max, l) => Math.max(max, l.marchTime), 0);
    const maxGhost = rallyData.ghostRallies.reduce((max, l) => Math.max(max, l.marchTime), 0);
    const maxCounterCounter = rallyData.counterCounterRallies.reduce((max, l) => Math.max(max, l.marchTime), 0);
    const maxSecondGhost = rallyData.secondGhostRallies.reduce((max, l) => Math.max(max, l.marchTime), 0);

    const counterStart = maxMain + rallyData.settings.counterOffset;
    const counterHit = counterStart + maxCounter;

    const ghostStart = counterHit + rallyData.settings.ghostOffset;
    const ghostHit = ghostStart + maxGhost;

    const counterCounterStart = ghostHit + rallyData.settings.counterCounterOffset;
    const counterCounterHit = counterCounterStart + maxCounterCounter;

    const secondGhostStart = counterCounterHit + rallyData.settings.secondGhostOffset;
    const secondGhostHit = secondGhostStart + maxSecondGhost;

    let groupStart = 0;
    let groupMax = maxMain;

    if (type === 'counterRallies') {
      groupStart = counterStart;
      groupMax = maxCounter;
    } else if (type === 'ghostRallies') {
      groupStart = ghostStart;
      groupMax = maxGhost;
    } else if (type === 'counterCounterRallies') {
      groupStart = counterCounterStart;
      groupMax = maxCounterCounter;
    } else if (type === 'secondGhostRallies') {
      groupStart = secondGhostStart;
      groupMax = maxSecondGhost;
    }

    const launchDelay = groupMax - leader.marchTime;
    const absoluteLaunchTime = START_DELAY + groupStart + launchDelay;
    const absoluteHitTime = START_DELAY + groupStart + groupMax;

    return {
      leader,
      launchIn: absoluteLaunchTime - elapsed,
      hitIn: absoluteHitTime - elapsed,
      totalMissionTime: secondGhostHit + START_DELAY
    };
  }, [rallyData, type, id, elapsed]);

  if (!leaderData) {
    return (
      <Container sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h5">Leader not found or loading...</Typography>
        <Button component={RouterLink} to="/" sx={{ mt: 2 }}>Back to Timer</Button>
      </Container>
    );
  }

  const { leader, launchIn, hitIn } = leaderData;

  const getStatus = () => {
    if (timerState.status === 'idle') return { label: t('STANDBY'), color: '#757575' };
    if (launchIn > 10) return { label: t('WAITING'), color: '#9e9e9e' };
    if (launchIn > 0) return { label: t('GET READY'), color: '#ffa000', pulse: true };
    if (launchIn > -2) return { label: t('LAUNCH NOW'), color: '#d32f2f', shake: true };
    if (hitIn > 0) return { label: t('IN TRANSIT'), color: '#1976d2' };
    return { label: t('HIT TARGET'), color: '#388e3c' };
  };

  const status = getStatus();

  return (
    <Container maxWidth="sm" sx={{ mt: 4, textAlign: 'center' }}>
      <Button 
        startIcon={<ArrowBackIcon />} 
        component={RouterLink} 
        to="/"
        sx={{ mb: 4, alignSelf: 'flex-start' }}
      >
        {t('Back to Timer')}
      </Button>

      <Paper 
        elevation={6} 
        sx={{ 
          p: 6, 
          borderRadius: 4, 
          borderTop: `12px solid ${status.color}`,
          transition: 'all 0.3s ease'
        }}
      >
        <Typography variant="overline" sx={{ fontWeight: 900, letterSpacing: 2, color: 'text.secondary' }}>
          {t(type!)}
        </Typography>
        <Typography variant="h2" sx={{ fontWeight: 900, mb: 1 }}>
          {leader.name}
        </Typography>
        <Chip 
          label={status.label} 
          sx={{ 
            bgcolor: status.color, 
            color: 'white', 
            fontWeight: 900, 
            px: 2, 
            py: 2,
            height: 40,
            fontSize: '1.2rem',
            mb: 4,
            animation: status.pulse ? 'pulse 1s infinite' : 'none'
          }} 
        />

        <Box sx={{ mb: 6 }}>
          <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 700, mb: 1 }}>
            {t('LAUNCH IN')}
          </Typography>
          <Typography 
            variant="h1" 
            sx={{ 
              fontWeight: 950, 
              fontSize: '6rem',
              color: launchIn <= 0 && hitIn > 0 ? '#1976d2' : (launchIn <= 10 ? '#d32f2f' : 'inherit'),
              lineHeight: 1
            }}
          >
            {formatTime(launchIn)}
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 700, mb: 1 }}>
            {t('HIT IN')}
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 800 }}>
            {formatTime(hitIn)}
          </Typography>
        </Box>

        {timerState.status === 'counting' && (
          <Box sx={{ mt: 4 }}>
            <LinearProgress 
              variant="determinate" 
              value={Math.min(100, (elapsed / leaderData.totalMissionTime) * 100)}
              sx={{ height: 12, borderRadius: 6 }}
            />
          </Box>
        )}
      </Paper>
      
      <Typography variant="body2" sx={{ mt: 4, opacity: 0.6 }}>
        {t('March Time (seconds)')}: {leader.marchTime}s | Status: {timerState.status.toUpperCase()}
      </Typography>
    </Container>
  );
};

export default LeaderView;