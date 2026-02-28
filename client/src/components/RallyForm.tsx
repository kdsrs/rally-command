import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface RallyLeader {
  id: string;
  name: string;
  marchTime: number;
}

interface RallyFormProps {
  initialData?: RallyLeader;
  onSave: (leader: RallyLeader) => void;
  onCancel: () => void;
}

const RallyForm: React.FC<RallyFormProps> = ({ initialData, onSave, onCancel }) => {
  const { t } = useTranslation();
  const [name, setName] = useState(initialData?.name || '');
  const [marchTime, setMarchTime] = useState(initialData?.marchTime?.toString() || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
      name,
      marchTime: parseInt(marchTime) || 0,
    });
  };

  return (
    <Paper sx={{ p: 2, mt: 2, bgcolor: '#f9f9f9' }}>
      <Typography variant="subtitle1" gutterBottom>
        {initialData ? t('Edit Leader') : t('Add New Leader')}
      </Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label={t('Leader Name')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          fullWidth
        />
        <TextField
          label={t('March Time (seconds)')}
          type="number"
          value={marchTime}
          onChange={(e) => setMarchTime(e.target.value)}
          required
          fullWidth
        />
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <Button onClick={onCancel}>{t('Cancel')}</Button>
          <Button type="submit" variant="contained" color="primary">
            {t('Save')}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default RallyForm;