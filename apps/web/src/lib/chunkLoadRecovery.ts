export {
  type ChunkLoadRecoveryState,
  getChunkLoadRecoveryState,
  getLastHealthyLocation,
  installChunkLoadRecoveryHandlers,
  isChunkLoadError,
  registerChunkLoadReload,
  rememberHealthyRoute,
  setLastHealthyLocation,
  triggerChunkLoadAutoReload,
} from '@/core/errors/chunkLoadRecovery';
