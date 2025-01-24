import React, { useState } from 'react';
import InputForm from './InputForm';
import MapDisplay from './MapDisplay';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Container, Paper, Typography, Box, CircularProgress } from '@mui/material';

const App = () => {
  const [route, setRoute] = useState({
    center: { lat: 35.681236, lng: 139.767125 }, // 初期表示用の座標(東京駅)
    path: [{ lat: 35.681236, lng: 139.767125 }]
  });
  const [loading, setLoading] = useState(false);
  const [planText, setPlanText] = useState('');
  const [locationText, setLocationText] = useState('');  // 追加

  const handlePlanSubmit = async (purpose, range) => {
    // 既存のデータをクリア
    setPlanText('');
    setLocationText('');
    setRoute({
      center: { lat: 35.681236, lng: 139.767125 }, // 東京駅に戻す
      path: [{ lat: 35.681236, lng: 139.767125 }]
    });
    
    setLoading(true);
    try {
      const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
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
      
      // より堅牢なJSON文字列のクリーニング
      const jsonText = text
        .replace(/```(?:json)?\n?/g, '')  // コードブロックの削除
        .replace(/`/g, '')  // バッククォートの削除
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')  // 制御文字の削除
        .replace(/\n/g, '\\n')  // 改行を適切にエスケープ
        .replace(/\*\*/g, '')   // Markdown の強調記号を削除
        .replace(/\s*-\s*/g, '・')  // 箇条書きの記号を統一
        .trim();  // 前後の空白を削除
      
      console.log('Original text:', text);
      console.log('Cleaned JSON text:', jsonText);
      
      try {
        const jsonResponse = JSON.parse(jsonText);
        console.log('Parsed JSON:', jsonResponse);
        
        // detailsの改行を適切に処理
        const formattedDetails = jsonResponse.details
          .replace(/\\n/g, '\n')  // エスケープされた改行を実際の改行に変換
          .trim();
        
        setPlanText(formattedDetails);

        // すべての場所を取得
        const locations = jsonResponse.locations;
        if (locations && locations.length > 0) {
          setLocationText(JSON.stringify(locations));
        }
      } catch (jsonError) {
        console.error('JSON parsing error:', jsonError);
        console.error('Failed to parse text:', jsonText);
        // エラーメッセージをユーザーに表示
        setPlanText('申し訳ありません。プランの生成中にエラーが発生しました。もう一度お試しください。');
      }
    } catch (error) {
      console.error('API request error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
        プラン生成地図AI
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        <Box sx={{ flex: 1 }}>
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <InputForm onPlanSubmit={handlePlanSubmit} />
          </Paper>
          
          {loading ? (
            <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
              <CircularProgress />
              <Typography sx={{ mt: 2 }}>プラン作成中...</Typography>
            </Paper>
          ) : planText && (
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography 
                component="pre"
                sx={{ 
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'inherit',
                  fontSize: '1rem',
                  lineHeight: 1.7
                }}
              >
                {planText}
              </Typography>
            </Paper>
          )}
        </Box>
        
        <Paper elevation={3} sx={{ flex: 1, overflow: 'hidden' }}>
          <MapDisplay 
            route={route} 
            locationText={locationText}  // 追加
            onLocationUpdate={setRoute}
          />
        </Paper>
      </Box>
    </Container>
  );
};

export default App;
