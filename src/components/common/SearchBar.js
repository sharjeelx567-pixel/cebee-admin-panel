import React from 'react';
import { TextField, InputAdornment, Box } from '@mui/material';
import { Search } from '@mui/icons-material';
import { colors } from '../../config/theme';

const SearchBar = ({ value, onChange, placeholder = 'Search...', sx = {}, onFocus }) => {
  return (
    <Box sx={{ ...sx }}>
      <TextField
        fullWidth
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            backgroundColor: colors.brandWhite,
            fontSize: 14,
            '& fieldset': {
              borderColor: `${colors.divider}66`,
              borderWidth: 1.5,
            },
            '&:hover fieldset': {
              borderColor: colors.brandRed,
            },
            '&.Mui-focused fieldset': {
              borderColor: colors.brandRed,
              borderWidth: 2,
            },
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search sx={{ color: colors.brandRed, fontSize: 20 }} />
            </InputAdornment>
          ),
        }}
      />
    </Box>
  );
};

export default SearchBar;
