import type { AbstractLevelDOWN } from 'abstract-leveldown';
import { MerklerootValidator, GetLatestValidatedRailgunTxid } from '@railgun-community/engine';
import { MerkletreeScanUpdateEvent } from '@railgun-community/shared-models';
import { ArtifactStore } from '../../artifacts/artifact-store';
export type EngineDebugger = {
    log: (msg: string) => void;
    error: (error: Error) => void;
    verboseScanLogging: boolean;
};
export declare const setOnUTXOMerkletreeScanCallback: (onUTXOMerkletreeScanCallback: (scanData: MerkletreeScanUpdateEvent) => void) => void;
export declare const setOnTXIDMerkletreeScanCallback: (onTXIDMerkletreeScanCallback: (scanData: MerkletreeScanUpdateEvent) => void) => void;
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
export declare const startRailgunEngine: (walletSource: string, db: AbstractLevelDOWN, shouldDebug: boolean, artifactStore: ArtifactStore, useNativeArtifacts: boolean, skipMerkletreeScans: boolean, validateRailgunTxidMerkleroot?: MerklerootValidator, getLatestValidatedRailgunTxid?: GetLatestValidatedRailgunTxid, verboseScanLogging?: boolean) => Promise<void>;
export declare const stopRailgunEngine: () => Promise<void>;
