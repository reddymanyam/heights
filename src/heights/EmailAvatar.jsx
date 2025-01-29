import React from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';

const EmailAvatars = ({ emails = [] }) => {
  // Function to get initials from email
  const getInitials = (email) => {
    if (!email || typeof email !== 'string') return '';
    return email
      .split('@')[0]
      .split('.')
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  };

  // Function to generate consistent color based on email
  const getColorFromEmail = (email) => {
    if (!email || typeof email !== 'string') return '#000'; // Fallback color for invalid emails

    const colors = [
      '#1976d2', '#2196f3', '#03a9f4', '#00bcd4',
      '#009688', '#4caf50', '#8bc34a', '#cddc39',
      '#ffc107', '#ff9800', '#ff5722', '#f44336',
    ];

    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = email.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <Box display="flex" flexWrap="wrap">
      {emails
        .filter((email) => email && typeof email === 'string') // Filter out invalid emails
        .map((email, index) => (
          <Avatar
            key={index}
            sx={{
              bgcolor: getColorFromEmail(email),
              width: 24,
              height: 24,
              fontSize: 12,
            }}
            title={email}
          >
            {getInitials(email)}
          </Avatar>
        ))}
    </Box>
  );
};

export default EmailAvatars;
