import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './Auth';
import Home from './Home';
import Profile from './Profile';
import Search from './Search';
import Header from './Header';
import Login from './Login';
import Register from './Register';
import Link from './Link';
import store from './Store';
import { Provider } from 'react-redux';
import UserSearchResults from './SearchResults/users';
import CarSearchResults from './SearchResults/cars';
import CarDetails from './CarDetails';
import CarDetail from './Profile/CarDetail';
import AdminPanel from './AdminPanel';

const App: React.FC = () => {
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  return (
    <AuthProvider>
      <Provider store={store}>
        <Router>
          <Header onToggleSidebar={toggleSidebar} />
          <br />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/profile" element={<Profile sidebarVisible={isSidebarVisible} onToggleSidebar={toggleSidebar} />} />
            <Route path="/profile/:uid" element={<Profile sidebarVisible={isSidebarVisible} onToggleSidebar={toggleSidebar} />} />
            <Route path="/search" element={<Search />} />
            <Route path="/search/users" element={<UserSearchResults />} />
            <Route path="/search/cars" element={<CarSearchResults />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/link" element={<Link />} />
            <Route path="/cars/details" element={<CarDetails />} />
            <Route path="/panel" element={<AdminPanel />} />
          </Routes>
        </Router>
      </Provider>
    </AuthProvider>
  );
};

export default App;