import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { MainPage } from './pages/MainPage';
import { RoomPage } from './pages/RoomPage';
import './index.css';

const router = createBrowserRouter([
  { path: '/', element: <MainPage /> },
  { path: '/room/:roomId', element: <RoomPage /> },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
