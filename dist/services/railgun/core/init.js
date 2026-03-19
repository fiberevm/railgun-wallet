"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopRailgunEngine = exports.startRailgunEngine = exports.setOnTXIDMerkletreeScanCallback = exports.setOnUTXOMerkletreeScanCallback = void 0;
const engine_1 = require("@railgun-community/engine");
const shared_models_1 = require("@railgun-community/shared-models");
const logger_1 = require("../../../utils/logger");
const artifacts_1 = require("./artifacts");
const error_1 = require("../../../utils/error");
const quick_sync_events_1 = require("../quick-sync/quick-sync-events");
const railgun_txid_sync_graph_v2_1 = require("../railgun-txids/railgun-txid-sync-graph-v2");
const engine_2 = require("./engine");
const balance_update_1 = require("../wallets/balance-update");
const createEngineDebugger = (verboseScanLogging) => {
    return {
        log: (msg) => (0, logger_1.sendMessage)(msg),
        error: (error) => (0, logger_1.sendErrorMessage)(error),
        verboseScanLogging,
    };
};
const setOnUTXOMerkletreeScanCallback = (onUTXOMerkletreeScanCallback) => {
    const engine = (0, engine_2.getEngine)();
    engine.on(engine_1.EngineEvent.UTXOMerkletreeHistoryScanUpdate, ({ chain, scanStatus, progress }) => onUTXOMerkletreeScanCallback({
        scanStatus,
        chain,
        progress: progress ?? 0.0,
    }));
};
exports.setOnUTXOMerkletreeScanCallback = setOnUTXOMerkletreeScanCallback;
const setOnTXIDMerkletreeScanCallback = (onTXIDMerkletreeScanCallback) => {
    const engine = (0, engine_2.getEngine)();
    engine.on(engine_1.EngineEvent.TXIDMerkletreeHistoryScanUpdate, ({ chain, scanStatus, progress }) => onTXIDMerkletreeScanCallback({
        scanStatus,
        chain,
        progress: progress ?? 0.0,
    }));
};
exports.setOnTXIDMerkletreeScanCallback = setOnTXIDMerkletreeScanCallback;
const setOnUTXOScanDecryptBalancesCompleteListener = () => {
    const engine = (0, engine_2.getEngine)();
    engine.on(engine_1.EngineEvent.UTXOScanDecryptBalancesComplete, ({ txidVersion, chain, walletIdFilter, }) => {
        const updateWalletBalances = async () => {
            let walletsToUpdate = Object.values(engine.wallets);
            if ((0, shared_models_1.isDefined)(walletIdFilter)) {
                walletsToUpdate = walletsToUpdate.filter(wallet => walletIdFilter.includes(wallet.id));
            }
            // await onBalancesUpdate calls for each wallet
            await Promise.all(walletsToUpdate.map(wallet => (0, balance_update_1.onBalancesUpdate)(txidVersion, wallet, chain)));
            // emit event to notify listeners that UTXOMerkletreeHistoryScan is complete
            engine.emitScanEventHistoryComplete(txidVersion, chain);
        };
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        updateWalletBalances();
    });
};
/**
 *
 * @param walletSource - Name for your wallet implementation. Encrypted and viewable in private transaction history. Maximum of 16 characters, lowercase.
 * @param db - LevelDOWN compatible database for storing encrypted wallets.
 * @param shouldDebug - Whether to forward Engine debug logs to Logger.
 * @param artifactStore - Persistent store for downloading large artifact files. See Wallet SDK Developer Guide for platform implementations.
 * @param useNativeArtifacts - Whether to download native C++ or web-assembly artifacts. TRUE for mobile. FALSE for nodejs and browser.
 * @param skipMerkletreeScans - Whether to skip merkletree syncs and private balance scans. Only set to TRUE in shield-only applications that don't load private wallets or balances.
 * @param validateRailgunTxidMerkleroot - Validator for TXID merkle roots.
 * @param getLatestValidatedRailgunTxid - Getter for latest validated railgun txid.
 * @returns
 */
const startRailgunEngine = async (walletSource, db, shouldDebug, artifactStore, useNativeArtifacts, skipMerkletreeScans, validateRailgunTxidMerkleroot, getLatestValidatedRailgunTxid, verboseScanLogging = false) => {
    if ((0, engine_2.hasEngine)()) {
        return;
    }
    try {
        (0, artifacts_1.setArtifactStore)(artifactStore);
        (0, artifacts_1.setUseNativeArtifacts)(useNativeArtifacts);
        const defaultMerklerootValidator = () => Promise.resolve(true);
        const defaultGetLatestValidatedRailgunTxid = () => Promise.resolve({ txidIndex: undefined, merkleroot: undefined });
        const engine = await engine_1.RailgunEngine.initForWallet(walletSource, db, artifacts_1.artifactGetterDownloadJustInTime, quick_sync_events_1.quickSyncEventsGraph, railgun_txid_sync_graph_v2_1.quickSyncRailgunTransactionsV2, validateRailgunTxidMerkleroot ?? defaultMerklerootValidator, getLatestValidatedRailgunTxid ?? defaultGetLatestValidatedRailgunTxid, shouldDebug ? createEngineDebugger(verboseScanLogging) : undefined, skipMerkletreeScans);
        (0, engine_2.setEngine)(engine);
        setOnUTXOScanDecryptBalancesCompleteListener();
    }
    catch (err) {
        throw (0, error_1.reportAndSanitizeError)(exports.startRailgunEngine.name, err);
    }
};
exports.startRailgunEngine = startRailgunEngine;
const stopRailgunEngine = async () => {
    if (!(0, engine_2.hasEngine)()) {
        return;
    }
    await (0, engine_2.getEngine)()?.unload();
    (0, engine_2.setEngine)(undefined);
};
exports.stopRailgunEngine = stopRailgunEngine;
//# sourceMappingURL=init.js.map