"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gasEstimateForUnprovenUnshieldToOrigin = exports.populateProvedUnshieldToOrigin = exports.getERC20AndNFTAmountRecipientsForUnshieldToOrigin = exports.gasEstimateForUnprovenUnshieldBaseToken = exports.gasEstimateForUnprovenUnshield = exports.populateProvedUnshieldBaseToken = exports.populateProvedUnshield = void 0;
const shared_models_1 = require("@railgun-community/shared-models");
const tx_generator_1 = require("./tx-generator");
const proof_cache_1 = require("./proof-cache");
const engine_1 = require("@railgun-community/engine");
const tx_gas_broadcaster_fee_estimator_1 = require("./tx-gas-broadcaster-fee-estimator");
const tx_cross_contract_calls_1 = require("./tx-cross-contract-calls");
const error_1 = require("../../utils/error");
const tx_gas_details_1 = require("./tx-gas-details");
const railgun_1 = require("../railgun");
const ERC20_TRANSFER_EVENT_SIGNATURE = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const populateProvedUnshield = async (txidVersion, networkName, railgunWalletID, erc20AmountRecipients, nftAmountRecipients, broadcasterFeeERC20AmountRecipient, sendWithPublicWallet, overallBatchMinGasPrice, gasDetails) => {
    try {
        const { transaction, nullifiers } = await (0, proof_cache_1.populateProvedTransaction)(txidVersion, networkName, shared_models_1.ProofType.Unshield, railgunWalletID, false, // showSenderAddressToRecipient
        undefined, // memoText
        erc20AmountRecipients, nftAmountRecipients, undefined, // relayAdaptUnshieldERC20AmountRecipients
        undefined, // relayAdaptUnshieldNFTAmounts
        undefined, // relayAdaptShieldERC20Recipients
        undefined, // relayAdaptShieldNFTRecipients
        undefined, // crossContractCalls
        broadcasterFeeERC20AmountRecipient, sendWithPublicWallet, overallBatchMinGasPrice, gasDetails);
        return {
            nullifiers,
            transaction,
            preTransactionPOIsPerTxidLeafPerList: {},
        };
    }
    catch (err) {
        throw (0, error_1.reportAndSanitizeError)(exports.populateProvedUnshield.name, err);
    }
};
exports.populateProvedUnshield = populateProvedUnshield;
const populateProvedUnshieldBaseToken = async (txidVersion, networkName, publicWalletAddress, railgunWalletID, wrappedERC20Amount, broadcasterFeeERC20AmountRecipient, sendWithPublicWallet, overallBatchMinGasPrice, gasDetails) => {
    try {
        const erc20AmountRecipients = [
            {
                ...wrappedERC20Amount,
                recipientAddress: publicWalletAddress,
            },
        ];
        const relayAdaptUnshieldERC20Amounts = [
            wrappedERC20Amount,
        ];
        // Empty NFT Recipients.
        const nftAmountRecipients = [];
        const { transaction, nullifiers } = await (0, proof_cache_1.populateProvedTransaction)(txidVersion, networkName, shared_models_1.ProofType.UnshieldBaseToken, railgunWalletID, false, // showSenderAddressToRecipient
        undefined, // memoText
        erc20AmountRecipients, nftAmountRecipients, relayAdaptUnshieldERC20Amounts, undefined, // relayAdaptUnshieldNFTAmounts
        undefined, // relayAdaptShieldERC20Recipients
        undefined, // relayAdaptShieldNFTRecipients
        undefined, // crossContractCalls
        broadcasterFeeERC20AmountRecipient, sendWithPublicWallet, overallBatchMinGasPrice, gasDetails);
        return {
            nullifiers,
            transaction,
            preTransactionPOIsPerTxidLeafPerList: {},
        };
    }
    catch (err) {
        throw (0, error_1.reportAndSanitizeError)(exports.populateProvedUnshieldBaseToken.name, err);
    }
};
exports.populateProvedUnshieldBaseToken = populateProvedUnshieldBaseToken;
const gasEstimateForUnprovenUnshield = async (txidVersion, networkName, railgunWalletID, encryptionKey, erc20AmountRecipients, nftAmountRecipients, originalGasDetails, feeTokenDetails, sendWithPublicWallet) => {
    try {
        const overallBatchMinGasPrice = 0n;
        const response = await (0, tx_gas_broadcaster_fee_estimator_1.gasEstimateResponseDummyProofIterativeBroadcasterFee)((broadcasterFeeERC20Amount) => (0, tx_generator_1.generateDummyProofTransactions)(shared_models_1.ProofType.Unshield, networkName, railgunWalletID, txidVersion, encryptionKey, false, // showSenderAddressToRecipient
        undefined, // memoText
        erc20AmountRecipients, nftAmountRecipients, broadcasterFeeERC20Amount, sendWithPublicWallet, overallBatchMinGasPrice), (txs) => (0, tx_generator_1.generateTransact)(txidVersion, txs, networkName, true), txidVersion, networkName, railgunWalletID, erc20AmountRecipients, originalGasDetails, feeTokenDetails, sendWithPublicWallet, false);
        return response;
    }
    catch (err) {
        throw (0, error_1.reportAndSanitizeError)(exports.gasEstimateForUnprovenUnshield.name, err);
    }
};
exports.gasEstimateForUnprovenUnshield = gasEstimateForUnprovenUnshield;
const gasEstimateForUnprovenUnshieldBaseToken = async (txidVersion, networkName, publicWalletAddress, railgunWalletID, encryptionKey, wrappedERC20Amount, originalGasDetails, feeTokenDetails, sendWithPublicWallet) => {
    try {
        const relayAdaptUnshieldERC20AmountRecipients = (0, tx_cross_contract_calls_1.createRelayAdaptUnshieldERC20AmountRecipients)(txidVersion, networkName, [
            wrappedERC20Amount,
        ]);
        // Empty NFT Recipients.
        const nftAmountRecipients = [];
        const overallBatchMinGasPrice = 0n;
        const response = await (0, tx_gas_broadcaster_fee_estimator_1.gasEstimateResponseDummyProofIterativeBroadcasterFee)((broadcasterFeeERC20Amount) => (0, tx_generator_1.generateDummyProofTransactions)(shared_models_1.ProofType.UnshieldBaseToken, networkName, railgunWalletID, txidVersion, encryptionKey, false, // showSenderAddressToRecipient
        undefined, // memoText
        relayAdaptUnshieldERC20AmountRecipients, nftAmountRecipients, broadcasterFeeERC20Amount, sendWithPublicWallet, overallBatchMinGasPrice), (txs) => {
            const relayAdaptParamsRandom = engine_1.ByteUtils.randomHex(31);
            return (0, tx_generator_1.generateUnshieldBaseToken)(txidVersion, txs, networkName, publicWalletAddress, relayAdaptParamsRandom, true, // useDummyProof (for gas estimation)
            sendWithPublicWallet);
        }, txidVersion, networkName, railgunWalletID, relayAdaptUnshieldERC20AmountRecipients, originalGasDetails, feeTokenDetails, sendWithPublicWallet, false);
        return response;
    }
    catch (err) {
        throw (0, error_1.reportAndSanitizeError)(exports.gasEstimateForUnprovenUnshieldBaseToken.name, err);
    }
};
exports.gasEstimateForUnprovenUnshieldBaseToken = gasEstimateForUnprovenUnshieldBaseToken;
async function extractTokenOwnerFromTransferEvents(receipt, railgunContractAddress) {
    const railgunAddressLower = railgunContractAddress.toLowerCase();
    const potentialOwners = new Set();
    for (const log of receipt.logs) {
        try {
            if (log.topics.length < 3) {
                continue;
            }
            if (log.topics[0] !== ERC20_TRANSFER_EVENT_SIGNATURE) {
                continue;
            }
            // topics[0] = event signature hash
            const toAddress = `0x${log.topics[2].slice(-40).toLowerCase()}`;
            if (toAddress === railgunAddressLower) {
                const fromAddress = `0x${log.topics[1].slice(-40)}`;
                potentialOwners.add(fromAddress);
            }
        }
        catch (error) {
            console.warn('Error parsing log for token owner extraction:', error);
            continue;
        }
    }
    if (potentialOwners.size === 1) {
        const [owner] = Array.from(potentialOwners);
        return owner;
    }
    // this handles cases where there are multiple deposits in one transaction
    if (potentialOwners.size > 1) {
        const [firstOwner] = Array.from(potentialOwners);
        return firstOwner;
    }
    throw new Error('Could not find token owner: No Transfer event to Railgun contract detected in transaction');
}
async function getTokenOwnerWithFallback(receipt, transaction, railgunContractAddress) {
    try {
        // first attempt is try to extract from Transfer events
        const tokenOwner = await extractTokenOwnerFromTransferEvents(receipt, railgunContractAddress);
        return tokenOwner;
    }
    catch (error) {
        return transaction.from;
    }
}
const getERC20AndNFTAmountRecipientsForUnshieldToOrigin = async (txidVersion, networkName, railgunWalletID, originalShieldTxid) => {
    const wallet = (0, railgun_1.walletForID)(railgunWalletID);
    const chain = shared_models_1.NETWORK_CONFIG[networkName].chain;
    const balances = await wallet.getTokenBalancesForUnshieldToOrigin(txidVersion, chain, originalShieldTxid);
    const provider = (0, railgun_1.getFallbackProviderForNetwork)(networkName);
    const [transaction, receipt] = await Promise.all([
        provider.getTransaction(originalShieldTxid),
        provider.getTransactionReceipt(originalShieldTxid),
    ]);
    if (!transaction) {
        throw new Error('Could not find shield transaction from RPC');
    }
    if (!receipt) {
        throw new Error('Could not find shield transaction receipt from RPC');
    }
    const network = shared_models_1.NETWORK_CONFIG[networkName];
    const railgunContractAddress = network.proxyContract;
    if (!railgunContractAddress) {
        throw new Error(`Could not find Railgun proxy contract for network: ${networkName}`);
    }
    const recipientAddress = await getTokenOwnerWithFallback(receipt, transaction, railgunContractAddress);
    const erc20Amounts = (0, railgun_1.getSerializedERC20Balances)(balances);
    const nftAmounts = (0, railgun_1.getSerializedNFTBalances)(balances);
    const erc20AmountRecipients = erc20Amounts
        .filter(({ amount }) => amount > 0n)
        .map(erc20Amount => ({
        ...erc20Amount,
        recipientAddress,
    }));
    const nftAmountRecipients = nftAmounts
        .filter(({ amount }) => amount > 0n)
        .map(nftAmount => ({
        ...nftAmount,
        recipientAddress,
    }));
    return { erc20AmountRecipients, nftAmountRecipients };
};
exports.getERC20AndNFTAmountRecipientsForUnshieldToOrigin = getERC20AndNFTAmountRecipientsForUnshieldToOrigin;
const populateProvedUnshieldToOrigin = async (txidVersion, networkName, railgunWalletID, erc20AmountRecipients, nftAmountRecipients, gasDetails) => {
    try {
        const { transaction, nullifiers } = await (0, proof_cache_1.populateProvedTransaction)(txidVersion, networkName, shared_models_1.ProofType.Unshield, railgunWalletID, false, // showSenderAddressToRecipient
        undefined, // memoText
        erc20AmountRecipients, nftAmountRecipients, undefined, // relayAdaptUnshieldERC20AmountRecipients
        undefined, // relayAdaptUnshieldNFTAmounts
        undefined, // relayAdaptShieldERC20Recipients
        undefined, // relayAdaptShieldNFTRecipients
        undefined, // crossContractCalls
        undefined, // broadcasterFeeERC20AmountRecipient
        true, // sendWithPublicWallet
        undefined, // overallBatchMinGasPrice
        gasDetails);
        return {
            nullifiers,
            transaction,
            preTransactionPOIsPerTxidLeafPerList: {},
        };
    }
    catch (err) {
        throw (0, error_1.reportAndSanitizeError)(exports.populateProvedUnshieldToOrigin.name, err);
    }
};
exports.populateProvedUnshieldToOrigin = populateProvedUnshieldToOrigin;
const gasEstimateForUnprovenUnshieldToOrigin = async (originalShieldTxid, txidVersion, networkName, railgunWalletID, encryptionKey, erc20AmountRecipients, nftAmountRecipients) => {
    try {
        // Use dead address for private transaction gas estimate
        const fromWalletAddress = tx_generator_1.DUMMY_FROM_ADDRESS;
        const overallBatchMinGasPrice = 0n;
        const serializedTransactions = await (0, tx_generator_1.generateDummyProofTransactions)(shared_models_1.ProofType.Unshield, networkName, railgunWalletID, txidVersion, encryptionKey, false, // showSenderAddressToRecipient
        undefined, // memoText
        erc20AmountRecipients, nftAmountRecipients, undefined, // broadcasterFeeERC20Amount
        true, // sendWithPublicWallet
        overallBatchMinGasPrice, originalShieldTxid);
        const transaction = await (0, tx_generator_1.generateTransact)(txidVersion, serializedTransactions, networkName, true);
        const gasEstimate = await (0, tx_gas_details_1.getGasEstimate)(txidVersion, networkName, transaction, fromWalletAddress, true, // sendWithPublicWallet
        false);
        return (0, tx_gas_details_1.gasEstimateResponse)(gasEstimate, undefined, // broadcasterFeeCommitment
        true);
    }
    catch (err) {
        throw (0, error_1.reportAndSanitizeError)(exports.gasEstimateForUnprovenUnshieldToOrigin.name, err);
    }
};
exports.gasEstimateForUnprovenUnshieldToOrigin = gasEstimateForUnprovenUnshieldToOrigin;
//# sourceMappingURL=tx-unshield.js.map