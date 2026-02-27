import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
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
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

const socket = io();

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

type RallyType = 'mainRallies' | 'counterRallies' | 'counterCounterRallies';

const AdminPanel: React.FC = () => {
  const [rallyData, setRallyData] = useState<RallyData>({
    mainRallies: [],
    counterRallies: [],
    counterCounterRallies: [],
    settings: {
      counterOffset: 0,
      counterCounterOffset: 0,
    },
  });
  const [editingLeader, setEditingLeader] = useState<RallyLeader | null>(null);
  const [showFormForType, setShowFormForType] = useState<RallyType | null>(null);

  useEffect(() => {
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
  }, []);

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
      <Paper elevation={3} sx={{ p: 2 }}>
        <Typography variant="h6" component="h2" gutterBottom>{title}</Typography>
        <List>
          {rallyData[type].map(leader => (
            <ListItem
              key={leader.id}
              secondaryAction={
                <>
                  <IconButton edge="end" aria-label="edit" onClick={() => handleEditLeader(type, leader)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteLeader(type, leader.id)}>
                    <DeleteIcon />
                  </IconButton>
                </>
              }
            >
              <ListItemText primary={leader.name} secondary={`${leader.marchTime} seconds`} />
            </ListItem>
          ))}
        </List>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleAddLeader(type)}
          sx={{ mt: 2 }}
        >
          Add {title.replace(' Rallies', '')} Leader
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

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Admin Panel
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom>Settings</Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Counter Rally Offset (seconds)"
              type="number"
              name="counterOffset"
              value={rallyData.settings.counterOffset}
              onChange={handleSettingChange}
              variant="outlined"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Counter-Counter Rally Offset (seconds)"
              type="number"
              name="counterCounterOffset"
              value={rallyData.settings.counterCounterOffset}
              onChange={handleSettingChange}
              variant="outlined"
            />
          </Grid>
          <Grid size={12}>
            <Button variant="contained" color="primary" onClick={saveRallyData}>
              Save All Changes
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        {renderRallySection('mainRallies', 'Main Rallies')}
        {renderRallySection('counterRallies', 'Counter Rallies')}
        {renderRallySection('counterCounterRallies', 'Counter-Counter Rallies')}
      </Grid>

      <Box sx={{ mt: 4, p: 2, bgcolor: 'background.paper' }}>
        <Typography variant="h6">Debug Data:</Typography>
        <pre>{JSON.stringify(rallyData, null, 2)}</pre>
      </Box>
    </Container>
  );
};

export default AdminPanel;