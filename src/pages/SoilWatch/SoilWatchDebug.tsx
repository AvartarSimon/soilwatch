import React from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { useSoilingModelData } from './hooks/useSoilingModelData';

const SoilWatchDebug: React.FC = () => {
  const { loading, error, data } = useSoilingModelData();

  console.log('SoilWatchDebug rendered');
  console.log('Loading:', loading);
  console.log('Error:', error);
  console.log('Data:', data);

  if (loading) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        SoilWatch Debug Page
      </Typography>
      <Typography variant="body1">
        Data loaded successfully!
      </Typography>
      <Typography variant="body2" sx={{ mt: 2 }}>
        Strings: {data?.strings?.length || 0}
      </Typography>
      <Typography variant="body2">
        Daily Data Points: {data?.dailyData?.length || 0}
      </Typography>
      <Typography variant="body2">
        Parameters: {data?.parameters?.length || 0}
      </Typography>
    </Box>
  );
};

export default SoilWatchDebug;
