import { ThemeProvider, createTheme } from '@mui/material/styles';
import Heights from './Heights';
import EmployeDetails from './EmployeDetails';

// const theme = createTheme();

function App() {
  return (
    // <ThemeProvider theme={theme}>
    //   <Heights />
    // </ThemeProvider>
    <>
      <EmployeDetails />
    </>

  );
}

export default App;
