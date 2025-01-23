import React, { useState } from 'react';
import { 
  TextField, 
  Button, 
  Box, 
  Typography
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

const InputForm = ({ onPlanSubmit }) => {
  const [purpose, setPurpose] = useState('');
  const [range, setRange] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onPlanSubmit(purpose, range);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
      <Typography variant="h6" gutterBottom>
        プラン作成
      </Typography>
      
      <TextField
        fullWidth
        label="目的"
        value={purpose}
        onChange={(e) => setPurpose(e.target.value)}
        margin="normal"
        variant="outlined"
        placeholder="例：カフェ巡り、観光、デート、散歩など"
        required
        sx={{ mb: 3 }}
      />
      
      <TextField
        fullWidth
        label="行動範囲"
        value={range}
        onChange={(e) => setRange(e.target.value)}
        margin="normal"
        variant="outlined"
        placeholder="例：東京駅周辺、渋谷・原宿エリア、浅草・上野エリアなど"
        required
        sx={{ mb: 3 }}
      />

      <Button 
        type="submit"
        variant="contained"
        fullWidth
        size="large"
        endIcon={<SendIcon />}
        sx={{
          mt: 2,
          backgroundColor: '#1976d2',
          '&:hover': {
            backgroundColor: '#115293'
          }
        }}
      >
        プラン作成
      </Button>
    </Box>
  );
};

export default InputForm;