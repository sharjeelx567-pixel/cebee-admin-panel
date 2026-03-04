import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { colors } from '../../config/theme';

const FilterChips = ({ label, options, selected, onChange, getLabel, getColor }) => {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
      {label && (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color: colors.textPrimary,
            fontSize: 14,
            marginRight: 0.5,
          }}
        >
          {label}:
        </Typography>
      )}
      {options.map((option) => {
        const optionValue = typeof option === 'object' ? option.value : option;
        const isSelected = selected === optionValue;
        const labelText = getLabel ? getLabel(option) : (typeof option === 'object' ? option.label : option);
        const chipColor = getColor ? getColor(option) : colors.brandRed;

        return (
          <Chip
            key={optionValue}
            label={labelText}
            onClick={() => onChange(optionValue)}
            sx={{
              backgroundColor: isSelected ? chipColor : colors.brandWhite,
              color: isSelected ? colors.brandWhite : colors.textPrimary,
              fontWeight: isSelected ? 700 : 500,
              fontSize: 12,
              border: `1.5px solid ${isSelected ? chipColor : colors.border}33`,
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: isSelected ? chipColor : `${chipColor}14`,
                borderColor: chipColor,
              },
            }}
          />
        );
      })}
    </Box>
  );
};

export default FilterChips;
