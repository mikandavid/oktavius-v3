export {
  type ChunkLoadRecoveryState,
  getChunkLoadRecoveryState,
  getLastHealthyLocation,
  isChunkLoadError,
  registerChunkLoadReload,
  rememberHealthyRoute,
  setLastHealthyLocation,
  triggerChunkLoadAutoReload,
} from '@/core/errors/chunkLoadRecovery';
