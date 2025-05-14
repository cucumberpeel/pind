import axios from 'axios';
import { useState } from 'react';
import './App.css';

function App() {
  const [ hello, setHello ] = useState('');
  const test = () => {
    axios.get('http://localhost:8080/api/test').then((data) => {
      console.log(data);
      setHello(data.data);
    })
    .catch(err => console.error(err));
  }
  return (
    <div className="App">
      <button onClick={test}>Test backend</button>
      <div>{hello}</div>
    </div>
  );
}

export default App;
