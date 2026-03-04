import React from 'react';
import { Box, Fade, Grow } from '@mui/material';

const AnimatedPage = ({ children, animationType = 'fade', delay = 0 }) => {
  const animationProps = {
    in: true,
    timeout: { enter: 600, exit: 300 },
    style: { transitionDelay: `${delay}ms` },
  };

  if (animationType === 'grow') {
    return (
      <Grow {...animationProps}>
        <Box>{children}</Box>
      </Grow>
    );
  }

  return (
    <Fade {...animationProps}>
      <Box>{children}</Box>
    </Fade>
  );
};

export default AnimatedPage;
