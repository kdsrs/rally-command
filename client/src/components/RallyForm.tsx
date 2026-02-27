import React, { useState, useEffect } from 'react';
import { TextField, Button, Box } from '@mui/material';

interface RallyLeader {
  id: string;
  name: string;
  marchTime: number; // in seconds
}

interface RallyFormProps {
  initialData?: RallyLeader;
  onSave: (leader: RallyLeader) => void;
  onCancel: () => void;
}

const RallyForm: React.FC<RallyFormProps> = ({ initialData, onSave, onCancel }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [marchTime, setMarchTime] = useState(initialData?.marchTime || 0);

  useEffect(() => {
    setName(initialData?.name || '');
    setMarchTime(initialData?.marchTime || 0);
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: initialData?.id || Date.now().toString(), // Generate new ID if not editing
      name,
      marchTime,
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Name"
        variant="outlined"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        fullWidth
      />
      <TextField
        label="March Time (seconds)"
        variant="outlined"
        type="number"
        value={marchTime}
        onChange={(e) => setMarchTime(parseInt(e.target.value) || 0)}
        required
        fullWidth
      />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button variant="contained" color="primary" type="submit">Save</Button>
        <Button variant="outlined" color="secondary" onClick={onCancel}>Cancel</Button>
      </Box>
    </Box>
  );
};

export default RallyForm;