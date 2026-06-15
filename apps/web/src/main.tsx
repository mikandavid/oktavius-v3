// Must be imported before anything else so Sentry is initialized before the
// app (and React) start executing and can instrument them.
import './instrument';
import '@1771technologies/lytenyte-core/light-dark.css';
import './styles/globals.css';

import ReactDOM from 'react-dom/client';

import { App } from './app/App';
import { installChunkLoadRecoveryHandlers } from './lib/chunkLoadRecovery';

// Catches stale-chunk failures (e.g. after a deploy invalidates hashed assets)
// that surface outside any React render boundary, and auto-reloads once.
installChunkLoadRecoveryHandlers();

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
