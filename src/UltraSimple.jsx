import React from 'react';

// Ultra simple component with no dependencies
function UltraSimple() {
  console.log('UltraSimple component is rendering');
  
  return React.createElement('div', { 
    style: { 
      backgroundColor: 'red', 
      color: 'white', 
      fontSize: '50px', 
      padding: '50px', 
      textAlign: 'center' 
    } 
  }, 'HELLO WORLD - WORKING!');
}

export default UltraSimple;