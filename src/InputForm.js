import React, { useState, useEffect } from 'react';
import { 
  TextField, 
  Button, 
  Box, 
  Typography,
  Snackbar,
  Alert,
  Slider,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SaveIcon from '@mui/icons-material/Save';

const InputForm = ({ onPlanSubmit, currentPlan, onCircleChange, circleInfo }) => {
  const [purpose, setPurpose] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const [circleRadius, setCircleRadius] = useState(circleInfo?.radius || 1000);
  const [rangeType, setRangeType] = useState('circle');
  const [textRange, setTextRange] = useState('');

  // circleInfoが変更されたときにradiusを更新
  useEffect(() => {
    if (circleInfo?.radius) {
      setCircleRadius(circleInfo.radius);
    }
  }, [circleInfo]);

  // スライダーの値が変更されたときの処理
  const handleRadiusChange = (event, newValue) => {
    setCircleRadius(newValue);
    if (onCircleChange && circleInfo?.center) {
      onCircleChange(circleInfo.center, newValue);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    let rangeInfo = '';
    if (rangeType === 'circle' && circleInfo?.center && circleRadius) {
      rangeInfo = `中心座標: ${JSON.stringify(circleInfo.center)}, 半径: ${circleRadius}メートル`;
    } else if (rangeType === 'text') {
      rangeInfo = textRange;
    }
    
    onPlanSubmit(purpose, rangeInfo);
  };

  const handleSave = async () => {
    if (!currentPlan) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          purpose,
          range: rangeType === 'circle' 
            ? `中心座標: ${JSON.stringify(circleInfo?.center)}, 半径: ${circleRadius}メートル`
            : textRange,
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
        setTimeout(() => {
          window.location.reload();
        }, 1000);
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

      <FormControl component="fieldset" sx={{ mb: 2 }}>
        <Typography gutterBottom>
          行動範囲の指定方法
        </Typography>
        <RadioGroup
          value={rangeType}
          onChange={(e) => setRangeType(e.target.value)}
        >
          <FormControlLabel 
            value="circle" 
            control={<Radio />} 
            label="地図上で円を描いて指定" 
          />
          <FormControlLabel 
            value="text" 
            control={<Radio />} 
            label="テキストで指定" 
          />
        </RadioGroup>
      </FormControl>

      {rangeType === 'circle' ? (
        <>
          <Typography id="range-slider" gutterBottom>
            行動範囲 (半径: {circleRadius}m)
          </Typography>
          <Slider
            value={circleRadius}
            onChange={handleRadiusChange}
            min={100}
            max={5000}
            step={100}
            aria-labelledby="range-slider"
          />
        </>
      ) : (
        <TextField
          fullWidth
          label="行動範囲"
          value={textRange}
          onChange={(e) => setTextRange(e.target.value)}
          margin="normal"
          variant="outlined"
          placeholder="例：渋谷駅周辺、東京タワー付近、など"
          required
        />
      )}

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

        {currentPlan && !currentPlan.id && (
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