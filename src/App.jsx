import { ThemeProvider, createTheme } from '@mui/material/styles';
import Heights from './Heights';

const theme = createTheme();

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Heights />
    </ThemeProvider>
  );
}

export default App;
