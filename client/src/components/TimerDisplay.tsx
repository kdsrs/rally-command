import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
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
} from '@mui/material';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';

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
  counterCounterRallies: RallyLeader[];
  settings: {
    counterOffset: number;
    counterCounterOffset: number;
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
  const [rallyData, setRallyData] = useState<RallyData>({
    mainRallies: [],
    counterRallies: [],
    counterCounterRallies: [],
    settings: {
      counterOffset: 0,
      counterCounterOffset: 0,
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
    const counterCounterStart = counterHit + data.settings.counterCounterOffset;
    const maxCounterCounter = data.counterCounterRallies.reduce((max, l) => Math.max(max, l.marchTime), 0);
    return { maxMain, counterStart, maxCounter, counterHit, counterCounterStart, maxCounterCounter, operationTotalTime: counterCounterStart + maxCounterCounter };
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

    if (timerState.status === 'idle') return { label: 'STANDBY', color: '#757575', launch: absoluteLaunchTime, hit: leader.marchTime, active: false };
    if (timeUntilLaunch > 10) return { label: 'WAITING', color: '#9e9e9e', launch: timeUntilLaunch, hit: timeUntilHit, active: false };
    if (timeUntilLaunch > 0) return { label: 'GET READY', color: '#ffa000', launch: timeUntilLaunch, hit: timeUntilHit, active: true, pulse: true };
    if (timeUntilLaunch > -2) return { label: 'LAUNCH NOW', color: '#d32f2f', launch: 0, hit: timeUntilHit, active: true, shake: true };
    if (timeUntilHit > 0) return { label: 'IN TRANSIT', color: '#1976d2', launch: 0, hit: timeUntilHit, active: true };
    return { label: 'HIT TARGET', color: '#388e3c', launch: 0, hit: 0, active: false };
  };

  const renderRallySection = (type: 'mainRallies' | 'counterRallies' | 'counterCounterRallies', title: string, groupStart: number, groupMax: number) => (
    <Grid size={{ xs: 12, md: 4 }}>
      <Typography variant="h5" align="center" gutterBottom sx={{ fontWeight: 800, color: '#1a237e', mb: 2 }}>
        {title}
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {rallyData[type].length === 0 ? (
          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: '#f5f5f5' }}>
            <Typography variant="body2" color="textSecondary">No leaders assigned</Typography>
          </Paper>
        ) : (
          rallyData[type].map(leader => {
            const status = getStatusConfig(leader, groupStart, groupMax);
            return (
              <Card 
                key={leader.id} 
                elevation={status.active ? 8 : 1}
                sx={{ 
                  borderLeft: `8px solid ${status.color}`,
                  bgcolor: status.label === 'LAUNCH NOW' ? '#fff4f4' : 'white',
                  transform: status.label === 'LAUNCH NOW' ? 'scale(1.02)' : 'none',
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
                      <Typography variant="caption" sx={{ color: '#666', fontWeight: 700, display: 'block', mb: 0.5 }}>LAUNCH IN</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 900, color: status.label === 'LAUNCH NOW' ? '#d32f2f' : '#222' }}>
                        {formatTime(status.launch)}
                      </Typography>
                    </Grid>
                    <Grid size={6} sx={{ borderLeft: '1px solid #eee' }}>
                      <Typography variant="caption" sx={{ color: '#666', fontWeight: 700, display: 'block', mb: 0.5 }}>HIT IN</Typography>
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, pb: 8 }}>
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.6; }
          100% { opacity: 1; }
        }
      `}</style>

      {/* Hero Header & Warmup */}
      <Paper elevation={0} sx={{ p: 4, mb: 4, borderRadius: 4, bgcolor: '#1a237e', color: 'white', textAlign: 'center' }}>
        <Typography variant="h2" sx={{ fontWeight: 900, mb: 1, letterSpacing: -1 }}>RALLY COMMAND</Typography>
        
        {timerState.status === 'counting' && elapsed < START_DELAY ? (
          <Box sx={{ mt: 3, p: 3, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2, border: '2px dashed rgba(255,255,255,0.3)' }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: '#4fc3f7' }}>SYSTEM WARMUP IN PROGRESS</Typography>
            <Typography variant="h1" sx={{ fontWeight: 950, color: '#fff' }}>{Math.ceil(START_DELAY - elapsed)}</Typography>
            <Typography variant="subtitle1">GET READY TO LAUNCH THE FIRST MARCH</Typography>
          </Box>
        ) : (
          <Typography variant="h6" sx={{ opacity: 0.7, fontWeight: 500 }}>
            {timerState.status === 'idle' ? 'READY TO COORDINATE' : timerState.status === 'finished' ? 'OPERATION COMPLETE' : 'OPERATION LIVE'}
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
            INITIATE OPERATION
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => socket.emit('cancel-timer')}
            disabled={timerState.status === 'idle'}
            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', px: 4, borderRadius: 2, fontWeight: 700 }}
          >
            ABORT
          </Button>
        </Box>
      </Paper>

      {/* Global Progress */}
      {timerState.status === 'counting' && (
        <Box sx={{ mb: 6 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1a237e' }}>TOTAL MISSION PROGRESS</Typography>
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
        {renderRallySection('mainRallies', 'PHASE 1: MAIN', 0, timeline.maxMain)}
        {renderRallySection('counterRallies', 'PHASE 2: COUNTER', timeline.counterStart, timeline.maxCounter)}
        {renderRallySection('counterCounterRallies', 'PHASE 3: C-C', timeline.counterCounterStart, timeline.maxCounterCounter)}
      </Grid>
    </Container>
  );
};

export default TimerDisplay;