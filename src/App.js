import React, { useState, useEffect } from 'react';
import InputForm from './InputForm';
import MapDisplay from './MapDisplay';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Container, Paper, Typography, Box, CircularProgress, Grid, List, ListItem, ListItemText, Divider, Alert } from '@mui/material';

const App = () => {
  const [route, setRoute] = useState({
    center: { lat: 35.681236, lng: 139.767125 }, // 初期表示用の座標(東京駅)
    path: [{ lat: 35.681236, lng: 139.767125 }]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [planText, setPlanText] = useState('');
  const [locationText, setLocationText] = useState('');  // 追加
  const [currentPlan, setCurrentPlan] = useState(null);
  const [savedPlans, setSavedPlans] = useState([]);

  useEffect(() => {
    fetchSavedPlans();
  }, []);

  const fetchSavedPlans = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/plans');
      if (response.ok) {
        const plans = await response.json();
        setSavedPlans(plans);
      }
    } catch (error) {
      console.error('Failed to fetch saved plans:', error);
      setError('保存済みプランの取得に失敗しました');
    }
  };

  const handlePlanSubmit = async (purpose, range) => {
    setError('');
    setPlanText('');
    setLocationText('');
    setCurrentPlan(null);
    
    if (!process.env.REACT_APP_GEMINI_API_KEY) {
      setError('Gemini APIキーが設定されていません');
      return;
    }
    
    setLoading(true);
    try {
      const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      console.log('Generating plan with:', { purpose, range });
      
      const prompt = `
次の制約条件で行動プランを作成し、以下のJSON形式で返答してください：
{
  "title": "プランのタイトル",
  "locations": [
    {
      "name": "場所の名前",
      "address": "場所の正確な住所（都道府県から記載）",
      "description": "この場所での行動内容"
    }
  ],
  "details": "1. [場所1]\\n説明\\n\\n2. [場所2]\\n説明"
}

制約条件：
目的: ${purpose}
行動範囲: ${range}

注意：
- locationsは必ず1つ以上含めてください
- 場所の名前は具体的な施設名や地名を指定してください
- addressは必ず正確な住所を記載してください（例：東京都渋谷区神宮前1-1-1）
- detailsは必ずlocationsの順番に対応したナンバリングを含めてください
- Markdown記法は使用せず、プレーンテキストで記述してください
- 箇条書きには「・」を使用してください
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('API Response:', text);
      
      const jsonText = text
        .replace(/```(?:json)?\n?/g, '')
        .replace(/`/g, '')
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
        .replace(/\n/g, '\\n')
        .replace(/\*\*/g, '')
        .replace(/\s*-\s*/g, '・')
        .trim();
      
      try {
        const jsonResponse = JSON.parse(jsonText);
        console.log('Parsed plan:', jsonResponse);
        
        const formattedDetails = jsonResponse.details
          .replace(/\\n/g, '\n')
          .trim();
        
        setPlanText(formattedDetails);
        setLocationText(JSON.stringify(jsonResponse.locations));

        const newPlan = {
          purpose,
          range,
          planText: formattedDetails,
          locations: jsonResponse.locations,
          title: jsonResponse.title
        };
        
        setCurrentPlan(newPlan);
        console.log('Setting current plan:', newPlan);
      } catch (jsonError) {
        console.error('JSON parsing error:', jsonError);
        setError('プランの生成中にエラーが発生しました。もう一度お試しください。');
      }
    } catch (error) {
      console.error('API request error:', error);
      setError('APIリクエスト中にエラーが発生しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <InputForm onPlanSubmit={handlePlanSubmit} currentPlan={currentPlan} />
            
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <CircularProgress />
              </Box>
            )}
            
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
            
            {planText && !loading && !error && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  生成されたプラン
                </Typography>
                <Typography component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                  {planText}
                </Typography>
              </Box>
            )}
          </Paper>

          {savedPlans.length > 0 && (
            <Paper sx={{ p: 2, mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                保存済みプラン
              </Typography>
              <List>
                {savedPlans.map((plan, index) => (
                  <React.Fragment key={plan.id}>
                    <ListItem button onClick={() => setCurrentPlan(plan)}>
                      <ListItemText
                        primary={plan.purpose}
                        secondary={`${plan.range} - ${new Date(plan.created_at).toLocaleDateString()}`}
                      />
                    </ListItem>
                    {index < savedPlans.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          )}
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '70vh' }}>
            <MapDisplay plan={currentPlan} />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default App;
