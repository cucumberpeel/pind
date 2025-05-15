import './App.css';
import Home from './components/home/Home';
import Header from './components/header/Header';
import Profile from './components/profile/Profile';
import Login from './components/login/Login';
import Signup from './components/login/Signup';
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {

  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/user/:username" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
