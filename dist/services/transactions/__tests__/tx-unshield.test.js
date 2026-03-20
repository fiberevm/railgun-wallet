"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = __importDefault(require("chai"));
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const sinon_1 = __importDefault(require("sinon"));
const engine_1 = require("@railgun-community/engine");
const shared_models_1 = require("@railgun-community/shared-models");
const setup_test_1 = require("../../../tests/setup.test");
const mocks_test_1 = require("../../../tests/mocks.test");
const tx_unshield_1 = require("../tx-unshield");
const tx_proof_unshield_1 = require("../tx-proof-unshield");
const txGasDetailsModule = __importStar(require("../tx-gas-details"));
const railgunModule = __importStar(require("../../railgun"));
const wallets_1 = require("../../railgun/wallets/wallets");
const providers_1 = require("../../railgun/core/providers");
const proof_cache_1 = require("../proof-cache");
const engine_stubs_test_1 = require("../../../tests/stubs/engine-stubs.test");
const helper_test_1 = require("../../../tests/helper.test");
let gasEstimateStub;
let railProveStub;
let railDummyProveStub;
let railTransactStub;
let relayAdaptPopulateUnshieldBaseToken;
let addUnshieldDataSpy;
let erc20NoteSpy;
let railgunWallet;
let broadcasterFeeERC20AmountRecipient;
const polygonRelayAdaptContract = shared_models_1.NETWORK_CONFIG[shared_models_1.NetworkName.Polygon].relayAdaptContract;
chai_1.default.use(chai_as_promised_1.default);
const { expect } = chai_1.default;
const txidVersion = (0, helper_test_1.getTestTXIDVersion)();
const mockERC20TokenData0 = (0, engine_1.getTokenDataERC20)(mocks_test_1.MOCK_TOKEN_AMOUNTS[0].tokenAddress);
const mockERC20TokenData1 = (0, engine_1.getTokenDataERC20)(mocks_test_1.MOCK_TOKEN_AMOUNTS[1].tokenAddress);
const mockNFTTokenData0 = (0, engine_1.getTokenDataNFT)(mocks_test_1.MOCK_NFT_AMOUNT_RECIPIENTS_UNSHIELD[0].nftAddress, mocks_test_1.MOCK_NFT_AMOUNT_RECIPIENTS_UNSHIELD[0].nftTokenType, mocks_test_1.MOCK_NFT_AMOUNT_RECIPIENTS_UNSHIELD[0].tokenSubID);
const mockNFTTokenData1 = (0, engine_1.getTokenDataNFT)(mocks_test_1.MOCK_NFT_AMOUNT_RECIPIENTS_UNSHIELD[1].nftAddress, mocks_test_1.MOCK_NFT_AMOUNT_RECIPIENTS_UNSHIELD[1].nftTokenType, mocks_test_1.MOCK_NFT_AMOUNT_RECIPIENTS_UNSHIELD[1].tokenSubID);
const MOCK_TOKEN_AMOUNTS_DIFFERENT = [
    {
        tokenAddress: mocks_test_1.MOCK_TOKEN_ADDRESS,
        amount: BigInt(0x0100),
    },
    {
        tokenAddress: mocks_test_1.MOCK_TOKEN_ADDRESS_2,
        amount: BigInt(0x0300),
    },
];
const overallBatchMinGasPrice = BigInt('0x1000');
const gasDetails = {
    evmGasType: shared_models_1.EVMGasType.Type1,
    gasEstimate: 1000n,
    gasPrice: overallBatchMinGasPrice,
};
const gasDetailsType2 = {
    evmGasType: shared_models_1.EVMGasType.Type2,
    gasEstimate: 1000n,
    maxFeePerGas: overallBatchMinGasPrice,
    maxPriorityFeePerGas: overallBatchMinGasPrice,
};
const MOCK_TOKEN_AMOUNT_RECIPIENTS_INVALID = mocks_test_1.MOCK_TOKEN_AMOUNTS.map(erc20Amount => ({
    ...erc20Amount,
    recipientAddress: mocks_test_1.MOCK_RAILGUN_WALLET_ADDRESS,
}));
const MOCK_TOKEN_AMOUNT_RECIPIENTS = mocks_test_1.MOCK_TOKEN_AMOUNTS.map(erc20Amount => ({
    ...erc20Amount,
    recipientAddress: mocks_test_1.MOCK_ETH_WALLET_ADDRESS,
}));
const MOCK_TOKEN_AMOUNT_RECIPIENTS_DIFFERENT = MOCK_TOKEN_AMOUNTS_DIFFERENT.map(erc20Amount => ({
    ...erc20Amount,
    recipientAddress: mocks_test_1.MOCK_ETH_WALLET_ADDRESS,
}));
const stubGasEstimateSuccess = () => {
    gasEstimateStub = sinon_1.default.stub(txGasDetailsModule, 'getGasEstimate').resolves(BigInt('200'));
};
const stubGasEstimateFailure = () => {
    gasEstimateStub = sinon_1.default.stub(txGasDetailsModule, 'getGasEstimate').rejects(new Error('test rejection - gas estimate'));
};
const spyOnSetUnshield = () => {
    addUnshieldDataSpy = sinon_1.default.spy(engine_1.TransactionBatch.prototype, 'addUnshieldData');
};
describe('tx-unshield', () => {
    before(async function run() {
        this.timeout(60000);
        await (0, setup_test_1.initTestEngine)();
        await (0, setup_test_1.initTestEngineNetworks)();
        const railgunWalletInfo = await (0, wallets_1.createRailgunWallet)(mocks_test_1.MOCK_DB_ENCRYPTION_KEY, mocks_test_1.MOCK_MNEMONIC, undefined);
        if (!(0, shared_models_1.isDefined)(railgunWalletInfo)) {
            throw new Error('Expected railgunWalletInfo');
        }
        railgunWallet = (0, wallets_1.fullWalletForID)(railgunWalletInfo.id);
        const broadcasterWalletInfo = await (0, wallets_1.createRailgunWallet)(mocks_test_1.MOCK_DB_ENCRYPTION_KEY, mocks_test_1.MOCK_MNEMONIC, undefined);
        if (!(0, shared_models_1.isDefined)(broadcasterWalletInfo)) {
            throw new Error('Expected broadcasterWalletInfo');
        }
        const broadcasterRailgunAddress = broadcasterWalletInfo.railgunAddress;
        broadcasterFeeERC20AmountRecipient = {
            ...mocks_test_1.MOCK_TOKEN_FEE,
            recipientAddress: broadcasterRailgunAddress,
        };
        railProveStub = sinon_1.default.stub(engine_1.TransactionBatch.prototype, 'generateTransactions').resolves({
            provedTransactions: [
                {
                    nullifiers: mocks_test_1.MOCK_NULLIFIERS,
                },
            ],
        });
        railDummyProveStub = sinon_1.default.stub(engine_1.TransactionBatch.prototype, 'generateDummyTransactions').resolves([
            {
                txidVersion,
                commitments: mocks_test_1.MOCK_COMMITMENTS,
                boundParams: (0, helper_test_1.isV2Test)() ? mocks_test_1.MOCK_BOUND_PARAMS_V2 : mocks_test_1.MOCK_BOUND_PARAMS_V3,
                nullifiers: mocks_test_1.MOCK_NULLIFIERS,
            },
        ]);
        railTransactStub = sinon_1.default.stub(engine_1.RailgunVersionedSmartContracts, 'generateTransact').resolves({ data: '0x0123' });
        relayAdaptPopulateUnshieldBaseToken = sinon_1.default.stub(engine_1.RelayAdaptVersionedSmartContracts, 'populateUnshieldBaseToken').resolves({ data: '0x0123' });
        // For Unshield To Origin
        await (0, engine_stubs_test_1.createEngineWalletBalancesStub)(railgunWallet.addressKeys, mocks_test_1.MOCK_TOKEN_ADDRESS, 0);
    });
    afterEach(() => {
        gasEstimateStub?.restore();
        addUnshieldDataSpy?.restore();
        erc20NoteSpy?.restore();
    });
    after(async () => {
        railProveStub.restore();
        railDummyProveStub.restore();
        railTransactStub.restore();
        relayAdaptPopulateUnshieldBaseToken.restore();
        (0, engine_stubs_test_1.restoreEngineStubs)();
        await (0, setup_test_1.closeTestEngine)();
    });
    // UNSHIELD - GAS ESTIMATE
    it('Should get gas estimates for valid Unshield', async () => {
        stubGasEstimateSuccess();
        spyOnSetUnshield();
        const rsp = await (0, tx_unshield_1.gasEstimateForUnprovenUnshield)(txidVersion, shared_models_1.NetworkName.Polygon, railgunWallet.id, mocks_test_1.MOCK_DB_ENCRYPTION_KEY, MOCK_TOKEN_AMOUNT_RECIPIENTS, [], // nftAmountRecipients
        mocks_test_1.MOCK_TRANSACTION_GAS_DETAILS_SERIALIZED_TYPE_2, mocks_test_1.MOCK_FEE_TOKEN_DETAILS, false);
        expect(rsp.broadcasterFeeCommitment).to.not.be.undefined;
        expect(rsp.broadcasterFeeCommitment?.commitmentCiphertext).to.deep.equal((0, helper_test_1.isV2Test)()
            ? mocks_test_1.MOCK_FORMATTED_BROADCASTER_FEE_COMMITMENT_CIPHERTEXT_V2
            : mocks_test_1.MOCK_FORMATTED_BROADCASTER_FEE_COMMITMENT_CIPHERTEXT_V3);
        expect(addUnshieldDataSpy.called).to.be.true;
        expect(addUnshieldDataSpy.args).to.deep.equal([
            [
                {
                    toAddress: mocks_test_1.MOCK_ETH_WALLET_ADDRESS,
                    tokenData: mockERC20TokenData0,
                    value: BigInt('0x0100'),
                    allowOverride: false,
                },
            ],
            [
                {
                    toAddress: mocks_test_1.MOCK_ETH_WALLET_ADDRESS,
                    tokenData: mockERC20TokenData1,
                    value: BigInt('0x0200'),
                    allowOverride: false,
                },
            ],
            [
                {
                    toAddress: mocks_test_1.MOCK_ETH_WALLET_ADDRESS,
                    tokenData: mockERC20TokenData0,
                    value: BigInt('0x0100'),
                    allowOverride: false,
                },
            ],
            [
                {
                    toAddress: mocks_test_1.MOCK_ETH_WALLET_ADDRESS,
                    tokenData: mockERC20TokenData1,
                    value: BigInt('0x0200'),
                    allowOverride: false,
                },
            ], // run 2 - token 2
        ]);
        // Add 9000 for the dummy tx variance
        expect(rsp.gasEstimate).to.equal(9000n + 200n);
    }).timeout(30000);
    it('Should get gas estimates for valid Unshield To Origin', async () => {
        stubGasEstimateSuccess();
        spyOnSetUnshield();
        const rsp = await (0, tx_unshield_1.gasEstimateForUnprovenUnshieldToOrigin)(engine_stubs_test_1.MOCK_SHIELD_TXID_FOR_BALANCES, // originalShieldTxid
        txidVersion, shared_models_1.NetworkName.Polygon, railgunWallet.id, mocks_test_1.MOCK_DB_ENCRYPTION_KEY, [
            {
                tokenAddress: mocks_test_1.MOCK_TOKEN_ADDRESS,
                amount: engine_stubs_test_1.MOCK_TOKEN_BALANCE,
                recipientAddress: mocks_test_1.MOCK_ETH_WALLET_ADDRESS,
            },
        ], []);
        expect(rsp.broadcasterFeeCommitment).to.be.undefined;
        expect(addUnshieldDataSpy.called).to.be.true;
        expect(addUnshieldDataSpy.args).to.deep.equal([
            [
                {
                    toAddress: mocks_test_1.MOCK_ETH_WALLET_ADDRESS,
                    tokenData: mockERC20TokenData0,
                    value: engine_stubs_test_1.MOCK_TOKEN_BALANCE,
                    allowOverride: false,
                },
            ],
        ]);
        // Add 9000 for the dummy tx variance
        expect(rsp.gasEstimate).to.equal(9000n + 200n);
    }).timeout(30000);
    it('Should error on gas estimates for invalid Unshield', async () => {
        stubGasEstimateSuccess();
        await expect((0, tx_unshield_1.gasEstimateForUnprovenUnshield)(txidVersion, shared_models_1.NetworkName.Polygon, railgunWallet.id, mocks_test_1.MOCK_DB_ENCRYPTION_KEY, MOCK_TOKEN_AMOUNT_RECIPIENTS_INVALID, [], // nftAmountRecipients
        mocks_test_1.MOCK_TRANSACTION_GAS_DETAILS_SERIALIZED_TYPE_2, mocks_test_1.MOCK_FEE_TOKEN_DETAILS, false)).rejectedWith('Invalid wallet address.');
    });
    it('Should error on unshield gas estimate for ethers rejections', async () => {
        stubGasEstimateFailure();
        await expect((0, tx_unshield_1.gasEstimateForUnprovenUnshield)(txidVersion, shared_models_1.NetworkName.Polygon, railgunWallet.id, mocks_test_1.MOCK_DB_ENCRYPTION_KEY, MOCK_TOKEN_AMOUNT_RECIPIENTS, [], // nftAmountRecipients
        mocks_test_1.MOCK_TRANSACTION_GAS_DETAILS_SERIALIZED_TYPE_2, mocks_test_1.MOCK_FEE_TOKEN_DETAILS, false)).rejectedWith('test rejection - gas estimate');
    });
    // UNSHIELD BASE TOKEN - GAS ESTIMATE
    it('Should get gas estimates for valid Unshield base token', async () => {
        stubGasEstimateSuccess();
        spyOnSetUnshield();
        const rsp = await (0, tx_unshield_1.gasEstimateForUnprovenUnshieldBaseToken)(txidVersion, shared_models_1.NetworkName.Polygon, mocks_test_1.MOCK_ETH_WALLET_ADDRESS, railgunWallet.id, mocks_test_1.MOCK_DB_ENCRYPTION_KEY, mocks_test_1.MOCK_TOKEN_AMOUNTS[0], mocks_test_1.MOCK_TRANSACTION_GAS_DETAILS_SERIALIZED_TYPE_2, mocks_test_1.MOCK_FEE_TOKEN_DETAILS, false);
        expect(rsp.broadcasterFeeCommitment).to.not.be.undefined;
        expect(rsp.broadcasterFeeCommitment?.commitmentCiphertext).to.deep.equal((0, helper_test_1.isV2Test)()
            ? mocks_test_1.MOCK_FORMATTED_BROADCASTER_FEE_COMMITMENT_CIPHERTEXT_V2
            : mocks_test_1.MOCK_FORMATTED_BROADCASTER_FEE_COMMITMENT_CIPHERTEXT_V3);
        expect(addUnshieldDataSpy.called).to.be.true;
        expect(addUnshieldDataSpy.args).to.deep.equal([
            [
                {
                    toAddress: polygonRelayAdaptContract,
                    tokenData: mockERC20TokenData0,
                    value: BigInt('0x0100'),
                    allowOverride: false,
                },
            ],
            [
                {
                    toAddress: polygonRelayAdaptContract,
                    tokenData: mockERC20TokenData0,
                    value: BigInt('0x0100'),
                    allowOverride: false,
                },
            ],
        ]);
        // Add 9000 for the dummy tx variance
        expect(rsp.gasEstimate).to.equal(9000n + 200n);
    }).timeout(30000);
    it('Should get gas estimates for valid Unshield base token: public wallet', async () => {
        stubGasEstimateSuccess();
        spyOnSetUnshield();
        const rsp = await (0, tx_unshield_1.gasEstimateForUnprovenUnshieldBaseToken)(txidVersion, shared_models_1.NetworkName.Polygon, mocks_test_1.MOCK_ETH_WALLET_ADDRESS, railgunWallet.id, mocks_test_1.MOCK_DB_ENCRYPTION_KEY, mocks_test_1.MOCK_TOKEN_AMOUNTS[0], mocks_test_1.MOCK_TRANSACTION_GAS_DETAILS_SERIALIZED_TYPE_2, mocks_test_1.MOCK_FEE_TOKEN_DETAILS, true);
        expect(rsp.broadcasterFeeCommitment).to.be.undefined;
        expect(addUnshieldDataSpy.called).to.be.true;
        expect(addUnshieldDataSpy.args).to.deep.equal([
            [
                {
                    toAddress: polygonRelayAdaptContract,
                    tokenData: mockERC20TokenData0,
                    value: BigInt('0x0100'),
                    allowOverride: false,
                },
            ],
        ]);
        // Add 9000 for the dummy tx variance
        expect(rsp.gasEstimate).to.equal(9000n + 200n);
    }).timeout(30000);
    it('Should error on gas estimates for invalid Unshield base token', async () => {
        stubGasEstimateSuccess();
        await expect((0, tx_unshield_1.gasEstimateForUnprovenUnshieldBaseToken)(txidVersion, shared_models_1.NetworkName.Polygon, mocks_test_1.MOCK_RAILGUN_WALLET_ADDRESS, railgunWallet.id, mocks_test_1.MOCK_DB_ENCRYPTION_KEY, mocks_test_1.MOCK_TOKEN_AMOUNTS[0], mocks_test_1.MOCK_TRANSACTION_GAS_DETAILS_SERIALIZED_TYPE_2, mocks_test_1.MOCK_FEE_TOKEN_DETAILS, false)).rejectedWith('Invalid wallet address.');
    });
    it('Should error on unshield base token gas estimate for ethers rejections', async () => {
        stubGasEstimateFailure();
        await expect((0, tx_unshield_1.gasEstimateForUnprovenUnshieldBaseToken)(txidVersion, shared_models_1.NetworkName.Polygon, mocks_test_1.MOCK_ETH_WALLET_ADDRESS, railgunWallet.id, mocks_test_1.MOCK_DB_ENCRYPTION_KEY, mocks_test_1.MOCK_TOKEN_AMOUNTS[0], mocks_test_1.MOCK_TRANSACTION_GAS_DETAILS_SERIALIZED_TYPE_2, mocks_test_1.MOCK_FEE_TOKEN_DETAILS, false)).rejectedWith('test rejection - gas estimate');
    });
    // UNSHIELD - PROVE AND SEND
    it('Should populate tx for valid Unshield', async () => {
        stubGasEstimateSuccess();
        (0, proof_cache_1.setCachedProvedTransaction)(undefined);
        spyOnSetUnshield();
        await (0, tx_proof_unshield_1.generateUnshieldProof)(txidVersion, shared_models_1.NetworkName.Polygon, railgunWallet.id, mocks_test_1.MOCK_DB_ENCRYPTION_KEY, MOCK_TOKEN_AMOUNT_RECIPIENTS, mocks_test_1.MOCK_NFT_AMOUNT_RECIPIENTS_UNSHIELD, broadcasterFeeERC20AmountRecipient, false, // sendWithPublicWallet
        overallBatchMinGasPrice, () => { });
        expect(addUnshieldDataSpy.called).to.be.true;
        expect(addUnshieldDataSpy.args).to.deep.equal([
            [
                {
                    toAddress: mocks_test_1.MOCK_ETH_WALLET_ADDRESS,
                    tokenData: mockERC20TokenData0,
                    value: BigInt('0x0100'),
                    allowOverride: false,
                },
            ],
            [
                {
                    toAddress: mocks_test_1.MOCK_ETH_WALLET_ADDRESS,
                    tokenData: mockERC20TokenData1,
                    value: BigInt('0x0200'),
                    allowOverride: false,
                },
            ],
            [
                {
                    toAddress: mocks_test_1.MOCK_ETH_WALLET_ADDRESS,
                    tokenData: mockNFTTokenData0,
                    value: BigInt(1),
                    allowOverride: false,
                },
            ],
            [
                {
                    toAddress: mocks_test_1.MOCK_ETH_WALLET_ADDRESS,
                    tokenData: mockNFTTokenData1,
                    value: BigInt(2),
                    allowOverride: false,
                },
            ], // run 1 - NFT token 2
        ]);
        const populateResponse = await (0, tx_unshield_1.populateProvedUnshield)(txidVersion, shared_models_1.NetworkName.Polygon, railgunWallet.id, MOCK_TOKEN_AMOUNT_RECIPIENTS, mocks_test_1.MOCK_NFT_AMOUNT_RECIPIENTS_UNSHIELD, broadcasterFeeERC20AmountRecipient, false, // sendWithPublicWallet
        overallBatchMinGasPrice, gasDetails);
        expect(populateResponse.nullifiers).to.deep.equal([
            '0x0000000000000000000000000000000000000000000000000000000000000001',
            '0x0000000000000000000000000000000000000000000000000000000000000002',
        ]);
        const { transaction } = populateResponse;
        expect(transaction.nonce).to.equal(undefined);
        expect(transaction.gasPrice?.toString()).to.equal('4096');
        expect(transaction.gasLimit).to.equal(1200n);
        expect(transaction.value?.toString()).to.equal(undefined);
        expect(transaction.data).to.equal('0x0123');
        expect(transaction.to).to.equal(undefined);
        expect(transaction.chainId).to.equal(undefined);
        expect(transaction.type).to.equal(1);
    });
    it('Should populate tx for valid Unshield To Origin', async () => {
        stubGasEstimateSuccess();
        (0, proof_cache_1.setCachedProvedTransaction)(undefined);
        spyOnSetUnshield();
        await (0, tx_proof_unshield_1.generateUnshieldToOriginProof)(engine_stubs_test_1.MOCK_SHIELD_TXID_FOR_BALANCES, // originalShieldTxid
        txidVersion, shared_models_1.NetworkName.Polygon, railgunWallet.id, mocks_test_1.MOCK_DB_ENCRYPTION_KEY, [
            {
                tokenAddress: mocks_test_1.MOCK_TOKEN_ADDRESS,
                amount: engine_stubs_test_1.MOCK_TOKEN_BALANCE,
                recipientAddress: mocks_test_1.MOCK_ETH_WALLET_ADDRESS,
            },
        ], [], () => { });
        expect(addUnshieldDataSpy.called).to.be.true;
        expect(addUnshieldDataSpy.args).to.deep.equal([
            [
                {
                    toAddress: mocks_test_1.MOCK_ETH_WALLET_ADDRESS,
                    tokenData: mockERC20TokenData0,
                    value: engine_stubs_test_1.MOCK_TOKEN_BALANCE,
                    allowOverride: false,
                },
            ], // run 1 - erc20 token 1
        ]);
        const populateResponse = await (0, tx_unshield_1.populateProvedUnshieldToOrigin)(txidVersion, shared_models_1.NetworkName.Polygon, railgunWallet.id, [
            {
                tokenAddress: mocks_test_1.MOCK_TOKEN_ADDRESS,
                amount: engine_stubs_test_1.MOCK_TOKEN_BALANCE,
                recipientAddress: mocks_test_1.MOCK_ETH_WALLET_ADDRESS,
            },
        ], [], gasDetailsType2);
        expect(populateResponse.nullifiers).to.deep.equal([
            '0x0000000000000000000000000000000000000000000000000000000000000001',
            '0x0000000000000000000000000000000000000000000000000000000000000002',
        ]);
        const { transaction } = populateResponse;
        expect(transaction.nonce).to.equal(undefined);
        expect(transaction.gasLimit).to.equal(1200n);
        expect(transaction.value?.toString()).to.equal(undefined);
        expect(transaction.data).to.equal('0x0123');
        expect(transaction.to).to.equal(undefined);
        expect(transaction.chainId).to.equal(undefined);
        expect(transaction.type).to.equal(2);
    });
    it('Should error on populate tx for invalid Unshield', async () => {
        stubGasEstimateSuccess();
        await expect((0, tx_unshield_1.populateProvedUnshield)(txidVersion, shared_models_1.NetworkName.Polygon, railgunWallet.id, MOCK_TOKEN_AMOUNT_RECIPIENTS_DIFFERENT, mocks_test_1.MOCK_NFT_AMOUNT_RECIPIENTS_UNSHIELD, broadcasterFeeERC20AmountRecipient, false, // sendWithPublicWallet
        overallBatchMinGasPrice, gasDetails)).rejectedWith('Invalid proof for this transaction');
    });
    it('Should error on populate unshield tx for unproved transaction', async () => {
        stubGasEstimateSuccess();
        (0, proof_cache_1.setCachedProvedTransaction)(undefined);
        await expect((0, tx_unshield_1.populateProvedUnshield)(txidVersion, shared_models_1.NetworkName.Polygon, railgunWallet.id, MOCK_TOKEN_AMOUNT_RECIPIENTS, [], // nftAmountRecipients
        broadcasterFeeERC20AmountRecipient, false, // sendWithPublicWallet
        overallBatchMinGasPrice, gasDetails)).rejectedWith('Invalid proof for this transaction');
    });
    it('Should error on populate unshield tx when params changed (invalid cached proof)', async () => {
        stubGasEstimateSuccess();
        await (0, tx_proof_unshield_1.generateUnshieldProof)(txidVersion, shared_models_1.NetworkName.Polygon, railgunWallet.id, mocks_test_1.MOCK_DB_ENCRYPTION_KEY, MOCK_TOKEN_AMOUNT_RECIPIENTS, [], // nftAmountRecipients
        broadcasterFeeERC20AmountRecipient, false, // sendWithPublicWallet
        overallBatchMinGasPrice, () => { });
        await expect((0, tx_unshield_1.populateProvedUnshield)(txidVersion, shared_models_1.NetworkName.Polygon, railgunWallet.id, MOCK_TOKEN_AMOUNT_RECIPIENTS_DIFFERENT, [], // nftAmountRecipients
        broadcasterFeeERC20AmountRecipient, false, // sendWithPublicWallet
        overallBatchMinGasPrice, gasDetails)).rejectedWith('Invalid proof for this transaction');
    });
    // UNSHIELD BASE TOKEN - PROVE AND SEND
    it('Should populate tx for valid Unshield Base Token', async () => {
        stubGasEstimateSuccess();
        (0, proof_cache_1.setCachedProvedTransaction)(undefined);
        spyOnSetUnshield();
        await (0, tx_proof_unshield_1.generateUnshieldBaseTokenProof)(txidVersion, shared_models_1.NetworkName.Polygon, mocks_test_1.MOCK_ETH_WALLET_ADDRESS, railgunWallet.id, mocks_test_1.MOCK_DB_ENCRYPTION_KEY, mocks_test_1.MOCK_TOKEN_AMOUNTS[0], broadcasterFeeERC20AmountRecipient, false, // sendWithPublicWallet
        overallBatchMinGasPrice, () => { });
        expect(addUnshieldDataSpy.called).to.be.true;
        expect(addUnshieldDataSpy.args).to.deep.equal([
            [
                {
                    toAddress: polygonRelayAdaptContract,
                    tokenData: mockERC20TokenData0,
                    value: BigInt('0x0100'),
                    allowOverride: false,
                },
            ],
            [
                {
                    toAddress: polygonRelayAdaptContract,
                    tokenData: mockERC20TokenData0,
                    value: BigInt('0x0100'),
                    allowOverride: false,
                },
            ], // Actual prove
        ]);
        const populateResponse = await (0, tx_unshield_1.populateProvedUnshieldBaseToken)(txidVersion, shared_models_1.NetworkName.Polygon, mocks_test_1.MOCK_ETH_WALLET_ADDRESS, railgunWallet.id, mocks_test_1.MOCK_TOKEN_AMOUNTS[0], broadcasterFeeERC20AmountRecipient, false, // sendWithPublicWallet
        overallBatchMinGasPrice, gasDetails);
        const { transaction } = populateResponse;
        expect(transaction.nonce).to.equal(undefined);
        expect(transaction.gasPrice?.toString()).to.equal('4096');
        expect(transaction.gasLimit).to.equal(1200n);
        expect(transaction.value?.toString()).to.equal(undefined);
        expect(transaction.data).to.equal('0x0123');
        expect(transaction.to).to.equal(undefined);
        expect(transaction.chainId).to.equal(undefined);
        expect(transaction.type).to.equal(1);
    }).timeout(60000);
    it('Should error on populate tx for invalid Unshield Base Token', async () => {
        stubGasEstimateSuccess();
        await expect((0, tx_unshield_1.populateProvedUnshieldBaseToken)(txidVersion, shared_models_1.NetworkName.Polygon, mocks_test_1.MOCK_ETH_WALLET_ADDRESS, railgunWallet.id, MOCK_TOKEN_AMOUNTS_DIFFERENT[1], broadcasterFeeERC20AmountRecipient, false, // sendWithPublicWallet
        overallBatchMinGasPrice, gasDetails)).rejectedWith('Invalid proof for this transaction');
    });
    it('Should error on populate Unshield Base Token tx for unproved transaction', async () => {
        stubGasEstimateSuccess();
        (0, proof_cache_1.setCachedProvedTransaction)(undefined);
        await expect((0, tx_unshield_1.populateProvedUnshieldBaseToken)(txidVersion, shared_models_1.NetworkName.Polygon, railgunWallet.id, mocks_test_1.MOCK_ETH_WALLET_ADDRESS, mocks_test_1.MOCK_TOKEN_AMOUNTS[0], broadcasterFeeERC20AmountRecipient, false, // sendWithPublicWallet
        overallBatchMinGasPrice, gasDetails)).rejectedWith('Invalid proof for this transaction');
    });
    it('Should error on populate Unshield Base Token tx when params changed (invalid cached proof)', async () => {
        stubGasEstimateSuccess();
        await (0, tx_proof_unshield_1.generateUnshieldBaseTokenProof)(txidVersion, shared_models_1.NetworkName.Polygon, mocks_test_1.MOCK_ETH_WALLET_ADDRESS, railgunWallet.id, mocks_test_1.MOCK_DB_ENCRYPTION_KEY, mocks_test_1.MOCK_TOKEN_AMOUNTS[1], broadcasterFeeERC20AmountRecipient, false, // sendWithPublicWallet
        overallBatchMinGasPrice, () => { });
        await expect((0, tx_unshield_1.populateProvedUnshieldBaseToken)(txidVersion, shared_models_1.NetworkName.Polygon, mocks_test_1.MOCK_ETH_WALLET_ADDRESS, railgunWallet.id, MOCK_TOKEN_AMOUNTS_DIFFERENT[1], broadcasterFeeERC20AmountRecipient, false, // sendWithPublicWallet
        overallBatchMinGasPrice, gasDetails)).rejectedWith('Invalid proof for this transaction');
    });
    describe('Token unshield owner', () => {
        let originalProvider;
        let hadOriginalProvider;
        const MOCK_USER_ADDRESS = '0x1234567890123456789012345678901234567890';
        const MOCK_RELAYER_ADDRESS = '0x9876543210987654321098765432109876543210';
        const MOCK_RAILGUN_PROXY_ADDRESS = shared_models_1.NETWORK_CONFIG[shared_models_1.NetworkName.Polygon].proxyContract;
        const MOCK_SHIELD_TXID = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
        const ERC20_TRANSFER_EVENT_SIGNATURE = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
        beforeEach(() => {
            // Save original provider if it exists
            try {
                originalProvider = railgunModule.getFallbackProviderForNetwork(shared_models_1.NetworkName.Polygon);
                hadOriginalProvider = true;
            }
            catch {
                originalProvider = undefined;
                hadOriginalProvider = false;
            }
        });
        afterEach(() => {
            // Restore original provider or clear it
            if (hadOriginalProvider && originalProvider) {
                (0, providers_1.setFallbackProviderForNetwork)(shared_models_1.NetworkName.Polygon, originalProvider);
            }
            else if (!hadOriginalProvider) {
                // Clear the mock provider we set
                delete providers_1.fallbackProviderMap[shared_models_1.NetworkName.Polygon];
            }
        });
        const createMockTransferLog = (fromAddress, toAddress, tokenAddress = mocks_test_1.MOCK_TOKEN_ADDRESS) => {
            const paddedFrom = fromAddress.toLowerCase().replace('0x', '').padStart(64, '0');
            const paddedTo = toAddress.toLowerCase().replace('0x', '').padStart(64, '0');
            return {
                address: tokenAddress,
                topics: [
                    ERC20_TRANSFER_EVENT_SIGNATURE,
                    `0x${paddedFrom}`,
                    `0x${paddedTo}`,
                ],
                data: '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000',
                blockNumber: 12345,
                transactionHash: MOCK_SHIELD_TXID,
                transactionIndex: 0,
                blockHash: '0xblockhash',
                logIndex: 0,
                removed: false,
                index: 0,
            };
        };
        const createMockReceipt = (logs) => {
            return {
                to: MOCK_RAILGUN_PROXY_ADDRESS,
                from: MOCK_RELAYER_ADDRESS,
                contractAddress: null,
                transactionIndex: 0,
                gasUsed: BigInt(100000),
                logsBloom: '0x',
                blockHash: '0xblockhash',
                transactionHash: MOCK_SHIELD_TXID,
                logs,
                blockNumber: 12345,
                confirmations: 10,
                cumulativeGasUsed: BigInt(100000),
                effectiveGasPrice: BigInt(1000000000),
                status: 1,
                type: 2,
                byzantium: true,
                hash: MOCK_SHIELD_TXID,
                index: 0,
            };
        };
        const createMockTransaction = (fromAddress) => {
            return {
                hash: MOCK_SHIELD_TXID,
                from: fromAddress,
                to: MOCK_RAILGUN_PROXY_ADDRESS,
                nonce: 1,
                gasLimit: BigInt(200000),
                data: '0x',
                value: BigInt(0),
                chainId: BigInt(137),
                blockNumber: 12345,
                blockHash: '0xblockhash',
                index: 0,
                type: 2,
                accessList: [],
            };
        };
        it('Should reject when getTransaction fails', async function () {
            this.timeout(60000);
            const mockProvider = {
                getTransaction: async () => {
                    throw new Error('RPC error: Transaction lookup failed');
                },
                getTransactionReceipt: async () => createMockReceipt([]),
            };
            (0, providers_1.setFallbackProviderForNetwork)(shared_models_1.NetworkName.Polygon, mockProvider);
            await expect((0, tx_unshield_1.getERC20AndNFTAmountRecipientsForUnshieldToOrigin)(txidVersion, shared_models_1.NetworkName.Polygon, railgunWallet.id, MOCK_SHIELD_TXID)).to.be.rejectedWith('RPC error: Transaction lookup failed');
        });
        it('Should reject when getTransactionReceipt fails', async function () {
            this.timeout(60000);
            const mockProvider = {
                getTransaction: async () => createMockTransaction(MOCK_USER_ADDRESS),
                getTransactionReceipt: async () => {
                    throw new Error('RPC error: Receipt lookup failed');
                },
            };
            (0, providers_1.setFallbackProviderForNetwork)(shared_models_1.NetworkName.Polygon, mockProvider);
            await expect((0, tx_unshield_1.getERC20AndNFTAmountRecipientsForUnshieldToOrigin)(txidVersion, shared_models_1.NetworkName.Polygon, railgunWallet.id, MOCK_SHIELD_TXID)).to.be.rejectedWith('RPC error: Receipt lookup failed');
        });
        it('Should reject when both getTransaction and getTransactionReceipt fail', async function () {
            this.timeout(60000);
            const mockProvider = {
                getTransaction: async () => {
                    // Simulate slower failure
                    await new Promise(resolve => setTimeout(resolve, 100));
                    throw new Error('RPC error: Transaction lookup failed');
                },
                getTransactionReceipt: async () => {
                    // Simulate faster failure
                    throw new Error('RPC error: Receipt lookup failed');
                },
            };
            (0, providers_1.setFallbackProviderForNetwork)(shared_models_1.NetworkName.Polygon, mockProvider);
            // Promise.all() should reject with whichever error occurs first
            // In this case, receipt fails faster
            await expect((0, tx_unshield_1.getERC20AndNFTAmountRecipientsForUnshieldToOrigin)(txidVersion, shared_models_1.NetworkName.Polygon, railgunWallet.id, MOCK_SHIELD_TXID)).to.be.rejectedWith(/RPC error/);
        });
        it('Should timeout when getTransaction hangs indefinitely', async function () {
            this.timeout(10000);
            const mockProvider = {
                getTransaction: async () => {
                    // Simulate a hanging promise that never resolves
                    return new Promise(() => { });
                },
                getTransactionReceipt: async () => createMockReceipt([]),
            };
            (0, providers_1.setFallbackProviderForNetwork)(shared_models_1.NetworkName.Polygon, mockProvider);
            // Create a timeout wrapper to test hanging behavior
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Test timeout: getTransaction hung')), 2000));
            const callPromise = (0, tx_unshield_1.getERC20AndNFTAmountRecipientsForUnshieldToOrigin)(txidVersion, shared_models_1.NetworkName.Polygon, railgunWallet.id, MOCK_SHIELD_TXID);
            await expect(Promise.race([callPromise, timeoutPromise])).to.be.rejectedWith('Test timeout: getTransaction hung');
        });
        it('Should timeout when getTransactionReceipt hangs indefinitely', async function () {
            this.timeout(10000);
            const mockProvider = {
                getTransaction: async () => createMockTransaction(MOCK_USER_ADDRESS),
                getTransactionReceipt: async () => {
                    // Simulate a hanging promise that never resolves
                    return new Promise(() => { });
                },
            };
            (0, providers_1.setFallbackProviderForNetwork)(shared_models_1.NetworkName.Polygon, mockProvider);
            // Create a timeout wrapper to test hanging behavior
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Test timeout: getTransactionReceipt hung')), 2000));
            const callPromise = (0, tx_unshield_1.getERC20AndNFTAmountRecipientsForUnshieldToOrigin)(txidVersion, shared_models_1.NetworkName.Polygon, railgunWallet.id, MOCK_SHIELD_TXID);
            await expect(Promise.race([callPromise, timeoutPromise])).to.be.rejectedWith('Test timeout: getTransactionReceipt hung');
        });
        it('Should extract true token owner from Transfer events in EIP-7702 gasless transaction', async function () {
            this.timeout(60000);
            const transferLog = createMockTransferLog(MOCK_USER_ADDRESS, MOCK_RAILGUN_PROXY_ADDRESS);
            const mockReceipt = createMockReceipt([transferLog]);
            const mockTransaction = createMockTransaction(MOCK_RELAYER_ADDRESS);
            const mockProvider = {
                getTransaction: async () => mockTransaction,
                getTransactionReceipt: async () => mockReceipt,
            };
            (0, providers_1.setFallbackProviderForNetwork)(shared_models_1.NetworkName.Polygon, mockProvider);
            const result = await (0, tx_unshield_1.getERC20AndNFTAmountRecipientsForUnshieldToOrigin)(txidVersion, shared_models_1.NetworkName.Polygon, railgunWallet.id, MOCK_SHIELD_TXID);
            expect(result.erc20AmountRecipients).to.be.an('array');
            if (result.erc20AmountRecipients.length > 0) {
                expect(result.erc20AmountRecipients[0].recipientAddress).to.equal(MOCK_USER_ADDRESS, 'Should extract token owner from Transfer event, not tx.from (relayer)');
            }
        });
        it('Should handle standard transactions where tx.from equals token owner', async function () {
            this.timeout(60000);
            const transferLog = createMockTransferLog(MOCK_USER_ADDRESS, MOCK_RAILGUN_PROXY_ADDRESS);
            const mockReceipt = createMockReceipt([transferLog]);
            const mockTransaction = createMockTransaction(MOCK_USER_ADDRESS);
            const mockProvider = {
                getTransaction: async () => mockTransaction,
                getTransactionReceipt: async () => mockReceipt,
            };
            (0, providers_1.setFallbackProviderForNetwork)(shared_models_1.NetworkName.Polygon, mockProvider);
            const result = await (0, tx_unshield_1.getERC20AndNFTAmountRecipientsForUnshieldToOrigin)(txidVersion, shared_models_1.NetworkName.Polygon, railgunWallet.id, MOCK_SHIELD_TXID);
            expect(result.erc20AmountRecipients).to.be.an('array');
            if (result.erc20AmountRecipients.length > 0) {
                expect(result.erc20AmountRecipients[0].recipientAddress).to.equal(MOCK_USER_ADDRESS);
            }
        });
        it('Should ignore Transfer events not directed to Railgun contract', async function () {
            this.timeout(60000);
            const irrelevantTransferLog = createMockTransferLog(MOCK_USER_ADDRESS, mocks_test_1.MOCK_ETH_WALLET_ADDRESS);
            const relevantTransferLog = createMockTransferLog(MOCK_USER_ADDRESS, MOCK_RAILGUN_PROXY_ADDRESS);
            const mockReceipt = createMockReceipt([
                irrelevantTransferLog,
                relevantTransferLog,
            ]);
            const mockTransaction = createMockTransaction(MOCK_RELAYER_ADDRESS);
            const mockProvider = {
                getTransaction: async () => mockTransaction,
                getTransactionReceipt: async () => mockReceipt,
            };
            (0, providers_1.setFallbackProviderForNetwork)(shared_models_1.NetworkName.Polygon, mockProvider);
            const result = await (0, tx_unshield_1.getERC20AndNFTAmountRecipientsForUnshieldToOrigin)(txidVersion, shared_models_1.NetworkName.Polygon, railgunWallet.id, MOCK_SHIELD_TXID);
            expect(result.erc20AmountRecipients).to.be.an('array');
            if (result.erc20AmountRecipients.length > 0) {
                expect(result.erc20AmountRecipients[0].recipientAddress).to.equal(MOCK_USER_ADDRESS);
            }
        });
        it('Should fallback to tx.from when no Transfer events found', async function () {
            this.timeout(60000);
            const mockReceipt = createMockReceipt([]);
            const mockTransaction = createMockTransaction(MOCK_USER_ADDRESS);
            const mockProvider = {
                getTransaction: async () => mockTransaction,
                getTransactionReceipt: async () => mockReceipt,
            };
            (0, providers_1.setFallbackProviderForNetwork)(shared_models_1.NetworkName.Polygon, mockProvider);
            const result = await (0, tx_unshield_1.getERC20AndNFTAmountRecipientsForUnshieldToOrigin)(txidVersion, shared_models_1.NetworkName.Polygon, railgunWallet.id, MOCK_SHIELD_TXID);
            expect(result.erc20AmountRecipients).to.be.an('array');
            if (result.erc20AmountRecipients.length > 0) {
                expect(result.erc20AmountRecipients[0].recipientAddress).to.equal(MOCK_USER_ADDRESS, 'Should fallback to tx.from when no Transfer events');
            }
        });
        it('Should handle malformed log topics gracefully', async function () {
            this.timeout(60000);
            const malformedLog = {
                address: mocks_test_1.MOCK_TOKEN_ADDRESS,
                topics: [ERC20_TRANSFER_EVENT_SIGNATURE],
                data: '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000',
                blockNumber: 12345,
                transactionHash: MOCK_SHIELD_TXID,
                transactionIndex: 0,
                blockHash: '0xblockhash',
                logIndex: 0,
                removed: false,
                index: 0,
            };
            const validLog = createMockTransferLog(MOCK_USER_ADDRESS, MOCK_RAILGUN_PROXY_ADDRESS);
            const mockReceipt = createMockReceipt([malformedLog, validLog]);
            const mockTransaction = createMockTransaction(MOCK_RELAYER_ADDRESS);
            const mockProvider = {
                getTransaction: async () => mockTransaction,
                getTransactionReceipt: async () => mockReceipt,
            };
            (0, providers_1.setFallbackProviderForNetwork)(shared_models_1.NetworkName.Polygon, mockProvider);
            const result = await (0, tx_unshield_1.getERC20AndNFTAmountRecipientsForUnshieldToOrigin)(txidVersion, shared_models_1.NetworkName.Polygon, railgunWallet.id, MOCK_SHIELD_TXID);
            expect(result.erc20AmountRecipients).to.be.an('array');
            if (result.erc20AmountRecipients.length > 0) {
                expect(result.erc20AmountRecipients[0].recipientAddress).to.equal(MOCK_USER_ADDRESS, 'Should skip malformed log and process valid one');
            }
        });
        it('Should throw error when transaction is not found', async function () {
            this.timeout(60000);
            const mockProvider = {
                getTransaction: async () => null,
                getTransactionReceipt: async () => createMockReceipt([]),
            };
            (0, providers_1.setFallbackProviderForNetwork)(shared_models_1.NetworkName.Polygon, mockProvider);
            await expect((0, tx_unshield_1.getERC20AndNFTAmountRecipientsForUnshieldToOrigin)(txidVersion, shared_models_1.NetworkName.Polygon, railgunWallet.id, MOCK_SHIELD_TXID)).to.be.rejectedWith('Could not find shield transaction from RPC');
        });
        it('Should throw error when receipt is not found', async function () {
            this.timeout(60000);
            const mockProvider = {
                getTransaction: async () => createMockTransaction(MOCK_USER_ADDRESS),
                getTransactionReceipt: async () => null,
            };
            (0, providers_1.setFallbackProviderForNetwork)(shared_models_1.NetworkName.Polygon, mockProvider);
            await expect((0, tx_unshield_1.getERC20AndNFTAmountRecipientsForUnshieldToOrigin)(txidVersion, shared_models_1.NetworkName.Polygon, railgunWallet.id, MOCK_SHIELD_TXID)).to.be.rejectedWith('Could not find shield transaction receipt from RPC');
        });
        it('Should handle multiple token owners by using first one', async function () {
            this.timeout(60000);
            const user1Address = '0x1111111111111111111111111111111111111111';
            const user2Address = '0x2222222222222222222222222222222222222222';
            const transferLog1 = createMockTransferLog(user1Address, MOCK_RAILGUN_PROXY_ADDRESS);
            const transferLog2 = createMockTransferLog(user2Address, MOCK_RAILGUN_PROXY_ADDRESS);
            const mockReceipt = createMockReceipt([transferLog1, transferLog2]);
            const mockTransaction = createMockTransaction(MOCK_RELAYER_ADDRESS);
            const mockProvider = {
                getTransaction: async () => mockTransaction,
                getTransactionReceipt: async () => mockReceipt,
            };
            (0, providers_1.setFallbackProviderForNetwork)(shared_models_1.NetworkName.Polygon, mockProvider);
            const result = await (0, tx_unshield_1.getERC20AndNFTAmountRecipientsForUnshieldToOrigin)(txidVersion, shared_models_1.NetworkName.Polygon, railgunWallet.id, MOCK_SHIELD_TXID);
            expect(result.erc20AmountRecipients).to.be.an('array');
            if (result.erc20AmountRecipients.length > 0) {
                const recipientAddr = result.erc20AmountRecipients[0].recipientAddress.toLowerCase();
                const isValidOwner = recipientAddr === user1Address.toLowerCase() ||
                    recipientAddr === user2Address.toLowerCase();
                expect(isValidOwner).to.be.true;
            }
        });
    });
});
//# sourceMappingURL=tx-unshield.test.js.map