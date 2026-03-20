"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = __importDefault(require("chai"));
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const shared_models_1 = require("@railgun-community/shared-models");
const mocks_test_1 = require("../../../../tests/mocks.test");
const setup_test_1 = require("../../../../tests/setup.test");
const providers_1 = require("../providers");
const load_provider_1 = require("../load-provider");
const wallets_1 = require("../../wallets/wallets");
const merkletree_1 = require("../merkletree");
const engine_1 = require("@railgun-community/engine");
chai_1.default.use(chai_as_promised_1.default);
const { expect } = chai_1.default;
const MOCK_MNEMONIC_PROVIDERS_ONLY = 'pause crystal tornado alcohol genre cement fade large song like bag where';
const txidVersion = shared_models_1.TXIDVersion.V2_PoseidonMerkle;
const expectV2FeesSerialized = (feesSerialized) => {
    expect(feesSerialized.shieldFeeV2).to.match(/^\d+$/);
    expect(feesSerialized.unshieldFeeV2).to.match(/^\d+$/);
    expect(feesSerialized.shieldFeeV3).to.equal(undefined);
    expect(feesSerialized.unshieldFeeV3).to.equal(undefined);
};
describe('providers', () => {
    before(async () => {
        await (0, setup_test_1.closeTestEngine)();
        await (0, setup_test_1.initTestEngine)();
    });
    after(async () => {
        await (0, setup_test_1.closeTestEngine)();
    });
    it('Should load provider with json, pull fees, and check created objects', async () => {
        const response = await (0, load_provider_1.loadProvider)(mocks_test_1.MOCK_FALLBACK_PROVIDER_JSON_CONFIG_SEPOLIA, shared_models_1.NetworkName.EthereumSepolia, 10000);
        expectV2FeesSerialized(response.feesSerialized);
        expect((0, providers_1.getFallbackProviderForNetwork)(shared_models_1.NetworkName.EthereumSepolia)).to.not.be
            .undefined;
        expect(() => (0, providers_1.getFallbackProviderForNetwork)(shared_models_1.NetworkName.EthereumRopsten_DEPRECATED)).to.throw;
        expect((0, merkletree_1.getUTXOMerkletreeForNetwork)(txidVersion, shared_models_1.NetworkName.EthereumSepolia))
            .to.not.be.undefined;
        expect(() => (0, merkletree_1.getUTXOMerkletreeForNetwork)(txidVersion, shared_models_1.NetworkName.EthereumRopsten_DEPRECATED)).to.throw;
        expect(() => (0, merkletree_1.getTXIDMerkletreeForNetwork)(txidVersion, shared_models_1.NetworkName.EthereumRopsten_DEPRECATED)).to.throw;
        const { chain } = shared_models_1.NETWORK_CONFIG[shared_models_1.NetworkName.EthereumSepolia];
        expect(engine_1.RailgunVersionedSmartContracts.getShieldApprovalContract(txidVersion, chain)).to.not.be.undefined;
        expect(engine_1.RelayAdaptVersionedSmartContracts.getRelayAdaptContract(txidVersion, chain)).to.not.be.undefined;
        const { chain: chainEthereumRopsten } = shared_models_1.NETWORK_CONFIG[shared_models_1.NetworkName.EthereumRopsten_DEPRECATED];
        expect(() => engine_1.RelayAdaptVersionedSmartContracts.getRelayAdaptContract(txidVersion, chainEthereumRopsten)).to.throw;
        // Check that new wallet has merkletree.
        const railgunWalletInfo = await (0, wallets_1.createRailgunWallet)(mocks_test_1.MOCK_DB_ENCRYPTION_KEY, MOCK_MNEMONIC_PROVIDERS_ONLY, undefined);
        if (!(0, shared_models_1.isDefined)(railgunWalletInfo)) {
            throw new Error('Expected railgunWalletInfo.');
        }
        const wallet = (0, wallets_1.walletForID)(railgunWalletInfo.id);
        expect(wallet.getUTXOMerkletree(txidVersion, shared_models_1.NETWORK_CONFIG[shared_models_1.NetworkName.EthereumSepolia].chain)).to.not.be.undefined;
    }).timeout(15000);
    it('Should fail with invalid chain ID', async () => {
        await expect((0, load_provider_1.loadProvider)({ chainId: 55 }, shared_models_1.NetworkName.BNBChain, 10000)).rejectedWith('Invalid chain ID');
    });
    it('Should fail with invalid json', async () => {
        await expect((0, load_provider_1.loadProvider)({ chainId: 56 }, shared_models_1.NetworkName.BNBChain, 10000)).rejectedWith('Invalid fallback provider config for chain 56');
    });
    it('Should load provider without RelayAdapt for basic flows', async () => {
        const network = shared_models_1.NETWORK_CONFIG[shared_models_1.NetworkName.EthereumSepolia];
        const originalRelayAdaptContract = network.relayAdaptContract;
        network.relayAdaptContract = '';
        try {
            const response = await (0, load_provider_1.loadProvider)(mocks_test_1.MOCK_FALLBACK_PROVIDER_JSON_CONFIG_SEPOLIA, shared_models_1.NetworkName.EthereumSepolia, 10000);
            expectV2FeesSerialized(response.feesSerialized);
            expect(() => engine_1.RelayAdaptVersionedSmartContracts.getRelayAdaptContract(txidVersion, network.chain)).to.throw;
        }
        finally {
            network.relayAdaptContract = originalRelayAdaptContract;
        }
    }).timeout(15000);
});
//# sourceMappingURL=providers.test.js.map