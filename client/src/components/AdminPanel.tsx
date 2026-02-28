import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import RallyForm from './RallyForm';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const socket = io();
const ACCESS_CODE = '262-12345';

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

type RallyType = 'mainRallies' | 'counterRallies' | 'ghostRallies' | 'counterCounterRallies' | 'secondGhostRallies';

const AdminPanel: React.FC = () => {
  const { t } = useTranslation();
  const [isVerified, setIsVerified] = useState(sessionStorage.getItem('admin_auth') === 'true');
  const [code, setCode] = useState('');
  
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
  const [editingLeader, setEditingLeader] = useState<RallyLeader | null>(null);
  const [showFormForType, setShowFormForType] = useState<RallyType | null>(null);

  useEffect(() => {
    if (!isVerified) return;

    axios.get('/api/rallies')
      .then(response => {
        setRallyData(response.data);
      })
      .catch(error => {
        console.error("Error fetching rally data:", error);
      });

    socket.on('update', (data: RallyData) => {
      setRallyData(data);
    });

    return () => {
      socket.off('update');
    };
  }, [isVerified]);

  const handleVerify = () => {
    if (code === ACCESS_CODE) {
      setIsVerified(true);
      sessionStorage.setItem('admin_auth', 'true');
    } else {
      alert('Incorrect Code');
    }
  };

  const handleSettingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRallyData(prevData => ({
      ...prevData,
      settings: {
        ...prevData.settings,
        [name]: parseInt(value) || 0,
      },
    }));
  };

  const saveRallyData = () => {
    axios.post('/api/rallies', rallyData)
      .then(response => {
        console.log(response.data.message);
      })
      .catch(error => {
        console.error("Error saving rally data:", error);
      });
  };

  const handleAddLeader = (type: RallyType) => {
    setEditingLeader(null);
    setShowFormForType(type);
  };

  const handleEditLeader = (type: RallyType, leader: RallyLeader) => {
    setEditingLeader(leader);
    setShowFormForType(type);
  };

  const handleDeleteLeader = (type: RallyType, id: string) => {
    setRallyData(prevData => {
      const updatedRallies = prevData[type].filter(leader => leader.id !== id);
      const newData = { ...prevData, [type]: updatedRallies };
      axios.post('/api/rallies', newData)
        .catch(error => console.error("Error auto-saving rally data:", error));
      return newData;
    });
  };

  const handleCopyLink = (type: RallyType, id: string) => {
    const url = `${window.location.origin}/leader/${type}/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      alert(t('Link copied to clipboard!'));
    });
  };

  const handleSaveForm = (leader: RallyLeader) => {
    setRallyData(prevData => {
      const type = showFormForType!;
      let updatedRallies;
      if (editingLeader) {
        updatedRallies = prevData[type].map(l => (l.id === leader.id ? leader : l));
      } else {
        updatedRallies = [...prevData[type], leader];
      }
      const newData = { ...prevData, [type]: updatedRallies };
      axios.post('/api/rallies', newData)
        .catch(error => console.error("Error auto-saving rally data:", error));
      return newData;
    });
    setEditingLeader(null);
    setShowFormForType(null);
  };

  const handleCancelForm = () => {
    setEditingLeader(null);
    setShowFormForType(null);
  };

  const renderRallySection = (type: RallyType, title: string) => (
    <Grid size={{ xs: 12, md: 4 }} key={type}>
      <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
        <Typography variant="h6" component="h2" gutterBottom>{t(title)}</Typography>
        <List sx={{ mb: 2 }}>
          {rallyData[type].map(leader => (
            <ListItem
              key={leader.id}
              secondaryAction={
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Tooltip title={t('View Timer')}>
                    <IconButton edge="end" component={RouterLink} to={`/leader/${type}/${leader.id}`}>
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('Copy Share Link')}>
                    <IconButton edge="end" onClick={() => handleCopyLink(type, leader.id)}>
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('Edit')}>
                    <IconButton edge="end" onClick={() => handleEditLeader(type, leader)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('Delete')}>
                    <IconButton edge="end" onClick={() => handleDeleteLeader(type, leader.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
            >
              <ListItemText primary={leader.name} secondary={`${leader.marchTime}s`} />
            </ListItem>
          ))}
        </List>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => handleAddLeader(type)}
          fullWidth
        >
          {t('Add Leader', { type: '' })}
        </Button>
        {showFormForType === type && (
          <RallyForm
            initialData={editingLeader || undefined}
            onSave={handleSaveForm}
            onCancel={handleCancelForm}
          />
        )}
      </Paper>
    </Grid>
  );

  if (!isVerified) {
    return (
      <Container maxWidth="xs" sx={{ mt: 10 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>{t('Access Code Required')}</Typography>
          <TextField
            fullWidth
            type="password"
            label={t('Enter Code')}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button variant="contained" fullWidth onClick={handleVerify}>{t('Submit')}</Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mt: 4 }}>
        {t('Admin Panel')}
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom>{t('Settings')}</Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              label={t('Counter Rally Offset (seconds)')}
              type="number"
              name="counterOffset"
              value={rallyData.settings.counterOffset}
              onChange={handleSettingChange}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              label={t('Ghost Rally Offset (seconds)')}
              type="number"
              name="ghostOffset"
              value={rallyData.settings.ghostOffset}
              onChange={handleSettingChange}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              label={t('Counter-Counter Rally Offset (seconds)')}
              type="number"
              name="counterCounterOffset"
              value={rallyData.settings.counterCounterOffset}
              onChange={handleSettingChange}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              label={t('Second Ghost Rally Offset (seconds)')}
              type="number"
              name="secondGhostOffset"
              value={rallyData.settings.secondGhostOffset}
              onChange={handleSettingChange}
            />
          </Grid>
          <Grid size={12}>
            <Button variant="contained" color="primary" onClick={saveRallyData}>
              {t('Save All Changes')}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        {renderRallySection('mainRallies', 'Main Rallies')}
        {renderRallySection('counterRallies', 'Counter Rallies')}
        {renderRallySection('ghostRallies', 'Ghost Rallies')}
        {renderRallySection('counterCounterRallies', 'Counter-Counter Rallies')}
        {renderRallySection('secondGhostRallies', 'Second Ghost Rallies')}
      </Grid>

      <Box sx={{ mt: 4, p: 2, bgcolor: 'background.paper' }}>
        <Typography variant="h6">{t('Debug Data')}:</Typography>
        <pre>{JSON.stringify(rallyData, null, 2)}</pre>
      </Box>
    </Container>
  );
};

export default AdminPanel;