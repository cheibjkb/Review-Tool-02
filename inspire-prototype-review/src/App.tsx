import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from '@douyinfe/semi-ui';
import enUS from '@douyinfe/semi-ui/lib/es/locale/source/en_US';
import Home from './pages/Home';
import { ReviewProvider } from './review/ReviewProvider';
import { ReviewLayer } from './review/ReviewLayer';
import '@douyinfe/semi-ui/dist/css/semi.min.css';
import './index.css';

const App = () => {
  return (
    <ConfigProvider locale={enUS}>
      <HashRouter>
        <ReviewProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <ReviewLayer />
        </ReviewProvider>
      </HashRouter>
    </ConfigProvider>
  );
};

export default App;
