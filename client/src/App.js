import './App.css';
import Home from './components/home/Home';
import Header from './components/header/Header';
import Profile from './components/profile/Profile';
import Login from './components/login/Login';
import Signup from './components/login/Signup';
import Pin from './components/create/Pin';
import Board from './components/create/Board';
import FollowStream from './components/create/FollowStream';
import ProtectedRoute from './components/ProtectedRoute';
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

        {/*  TO DO: protect routes (not working) */}
        {/* <Route element={<ProtectedRoute />}> */}
          <Route path="/pin" element={<Pin />} />
          <Route path="/board" element={<Board />} />
          <Route path="/followstream" element={<FollowStream />} />
        {/* </Route> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
