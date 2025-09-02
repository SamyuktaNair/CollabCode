import * as React from 'react';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { languages } from './languages';

export default function LanguageSelect({language,setLanguage}) {
  

  const handleChange = (event) => {
    setLanguage(event.target.value);
  };

  return (
    <Box sx={{ minWidth: 200,width:'40%' }}>
      <FormControl fullWidth sx={{ borderRadius: 1 }}>
        <InputLabel id="language-select-label"
          sx={{ color: 'white' }}>
          Language
        </InputLabel>
        <Select
          labelId="language-select-label"
          id="language-select"
          value={language}
          label="Language"
          onChange={handleChange}
          sx={{
            color: 'white',           
            '.MuiOutlinedInput-notchedOutline': {
              borderColor: '#666',     
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#007acc',  
            },
            '& .MuiSvgIcon-root': {
              color: 'white',          
            }
          }}
          MenuProps={{
            PaperProps: {
              sx: {
                backgroundColor: '#1e1e1e', 
                color: 'white'              
              }
            }
          }}
        >
            {
                languages.map((lang)=>{
                    return(
                        <MenuItem value={lang.value}>{lang.label}</MenuItem>
                    )
                })
            }
          
        </Select>
      </FormControl>
    </Box>
  );
}
