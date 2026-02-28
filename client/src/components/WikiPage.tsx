import React, { useState, useEffect } from 'react';
import { Container, Typography, Paper, Box, Divider, Button, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';

const ACCESS_CODE = '262-12345';

const WikiPage: React.FC = () => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [wikiData, setWikiData] = useState({ title: '', content: '' });
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    axios.get('/api/wiki')
      .then(res => {
        setWikiData(res.data);
        setEditTitle(res.data.title);
        setEditContent(res.data.content);
      })
      .catch(err => console.error("Error fetching wiki:", err));
  }, []);

  const handleEditToggle = () => {
    if (isEditing) {
      setIsEditing(false);
    } else {
      const input = prompt(t('Enter Code'));
      if (input === ACCESS_CODE) {
        setIsEditing(true);
      } else {
        alert('Incorrect Code');
      }
    }
  };

  const handleSave = () => {
    axios.post('/api/wiki', {
      code: ACCESS_CODE,
      content: { title: editTitle, content: editContent }
    })
    .then(() => {
      setWikiData({ title: editTitle, content: editContent });
      setIsEditing(false);
    })
    .catch(err => alert('Error saving wiki: ' + err.message));
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, pb: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h3" sx={{ fontWeight: 900, color: '#1a237e' }}>
          {t('Wiki')}
        </Typography>
        <Button 
          startIcon={isEditing ? <SaveIcon /> : <EditIcon />} 
          variant="outlined" 
          onClick={isEditing ? handleSave : handleEditToggle}
        >
          {isEditing ? t('Save Wiki') : t('Edit Wiki')}
        </Button>
      </Box>

      <Divider sx={{ my: 4 }} />

      {isEditing ? (
        <Paper elevation={3} sx={{ p: 4 }}>
          <TextField
            fullWidth
            label="Title"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            sx={{ mb: 3 }}
          />
          <TextField
            fullWidth
            multiline
            rows={15}
            label="Content"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
          />
        </Paper>
      ) : (
        <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 3 }}>
            {wikiData.title}
          </Typography>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
            {wikiData.content}
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default WikiPage;