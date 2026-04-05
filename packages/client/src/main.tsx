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

window.onerror = (msg, src, line, col, err) => {
  document.body.innerHTML = `<pre style="color:red;padding:16px;white-space:pre-wrap;word-break:break-all">[ERROR]\n${msg}\n${src}:${line}:${col}\n${err?.stack ?? ''}</pre>`;
};
window.onunhandledrejection = (e) => {
  document.body.innerHTML = `<pre style="color:red;padding:16px;white-space:pre-wrap;word-break:break-all">[UNHANDLED REJECTION]\n${e.reason}</pre>`;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
