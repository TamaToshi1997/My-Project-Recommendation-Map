import React, { useState } from 'react';
import { 
  TextField, 
  Button, 
  Box, 
  Typography,
  Snackbar,
  Alert
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SaveIcon from '@mui/icons-material/Save';

const InputForm = ({ onPlanSubmit, currentPlan }) => {
  const [purpose, setPurpose] = useState('');
  const [range, setRange] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onPlanSubmit(purpose, range);
  };

  const handleSave = async () => {
    if (!currentPlan) return;

    try {
      const response = await fetch('http://localhost:5000/api/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          purpose,
          range,
          plan_text: currentPlan.planText,
          locations: currentPlan.locations,
          route: currentPlan.route
        })
      });

      if (response.ok) {
        setSnackbar({
          open: true,
          message: 'プランを保存しました',
          severity: 'success'
        });
      } else {
        throw new Error('保存に失敗しました');
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message,
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
      <Typography variant="h6" gutterBottom sx={{ 
        fontFamily: "'Segoe UI', 'Comic Sans MS', cursive",
        fontWeight: 'bold',
        color: '#1976d2',
        letterSpacing: '0.1em'
      }}>
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

      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Button 
          type="submit"
          variant="contained"
          fullWidth
          size="large"
          endIcon={<SendIcon />}
          sx={{
            backgroundColor: '#1976d2',
            '&:hover': {
              backgroundColor: '#115293'
            }
          }}
        >
          プラン作成
        </Button>

        {currentPlan && (
          <Button 
            onClick={handleSave}
            variant="contained"
            fullWidth
            size="large"
            endIcon={<SaveIcon />}
            sx={{
              backgroundColor: '#4caf50',
              '&:hover': {
                backgroundColor: '#388e3c'
              }
            }}
          >
            プラン保存
          </Button>
        )}
      </Box>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InputForm;