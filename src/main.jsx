import React from 'react';
import ReactDOM from 'react-dom/client';
import GeneratedApp from './GeneratedApp.jsx';
import RabbitMQActivityPanel from './RabbitMQActivityPanel.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RabbitMQActivityPanel />
    <GeneratedApp />
  </React.StrictMode>
);