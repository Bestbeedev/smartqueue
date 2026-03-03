import './echo'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import './index.css'
import App from './App'
import { store } from './store'
import { ThemeProvider } from './components/theme-provider'
import Router from './router/index'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        storageKey="smartqueue-theme"
      >
        <Router />
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
)
