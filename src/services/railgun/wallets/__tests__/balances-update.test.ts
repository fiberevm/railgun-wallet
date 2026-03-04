import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {
  RailgunWallet,
  TokenBalances,
  Chain,
  ChainType,
  getTokenDataERC20,
} from '@railgun-community/engine';
import Sinon, { SinonStub } from 'sinon';
import {
  NETWORK_CONFIG,
  NetworkName,
  RailgunBalancesEvent,
  RailgunWalletBalanceBucket,
  isDefined,
} from '@railgun-community/shared-models';
import {
  onBalancesUpdate,
  setOnBalanceUpdateCallback,
} from '../balance-update';
import { createRailgunWallet, fullWalletForID } from '../wallets';
import {
  MOCK_DB_ENCRYPTION_KEY,
  MOCK_FALLBACK_PROVIDER_JSON_CONFIG_SEPOLIA,
  MOCK_MNEMONIC,
} from '../../../../tests/mocks.test';
import { closeTestEngine, initTestEngine } from '../../../../tests/setup.test';
import { loadProvider } from '../../core/load-provider';
import { getTestTXIDVersion } from '../../../../tests/helper.test';
import { getEngine } from '../../core/engine';

chai.use(chaiAsPromised);
const { expect } = chai;

const MOCK_TOKEN_ADDRESS = '0x012536';

const txidVersion = getTestTXIDVersion();

let wallet: RailgunWallet;

let walletBalanceStub: SinonStub;
let walletBalancesByBucketStub: SinonStub;
let walletTokenBalanceStub: SinonStub;

describe('balances-update', () => {
  before(async function run() {
    this.timeout(60_000);
    await initTestEngine();
    const railgunWalletInfo = await createRailgunWallet(
      MOCK_DB_ENCRYPTION_KEY,
      MOCK_MNEMONIC,
      undefined, // creationBlockNumbers
    );
    if (!isDefined(railgunWalletInfo)) {
      throw new Error('Expected railgunWalletInfo');
    }
    await loadProvider(
      MOCK_FALLBACK_PROVIDER_JSON_CONFIG_SEPOLIA,
      NetworkName.EthereumSepolia,
      10_000, // pollingInterval
    );
    const { chain } = NETWORK_CONFIG[NetworkName.EthereumSepolia];
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    getEngine().scanContractHistory(
      chain,
      undefined, // walletIdFilter
    );
    wallet = fullWalletForID(railgunWalletInfo.id);
    const tokenAddress = MOCK_TOKEN_ADDRESS.replace('0x', '');
    const tokenData = getTokenDataERC20(tokenAddress);
    const balances: TokenBalances = {
      [tokenAddress]: {
        balance: BigInt(10),
        utxos: [],
        tokenData,
      },
    };
    walletBalanceStub = Sinon.stub(
      RailgunWallet,
      'getTokenBalancesByTxidVersion',
    ).resolves(balances);
    walletBalancesByBucketStub = Sinon.stub(
      RailgunWallet.prototype,
      'getTokenBalancesByBucket',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    ).resolves({ Spendable: balances } as any);
    walletTokenBalanceStub = Sinon.stub(
      RailgunWallet.prototype,
      'getTokenBalances',
    ).resolves(balances);
  });

  afterEach(() => {
    walletBalanceStub.resetHistory();
    walletBalancesByBucketStub.resetHistory();
    walletTokenBalanceStub.resetHistory();
  });
  after(async () => {
    walletBalanceStub.restore();
    walletBalancesByBucketStub.restore();
    walletTokenBalanceStub.restore();
    await closeTestEngine();
  });

  it('Should not pull balances without callback', async () => {
    setOnBalanceUpdateCallback(undefined);
    const chain: Chain = { type: ChainType.EVM, id: 1 };
    await expect(onBalancesUpdate(txidVersion, wallet, chain)).to.be.fulfilled;
    expect(walletBalanceStub.notCalled).to.be.true;
    expect(walletBalancesByBucketStub.notCalled).to.be.true;
  });

  it('Should parse wallet balances response', async () => {
    let formattedBalances!: RailgunBalancesEvent;
    const callback = (balancesFormatted: RailgunBalancesEvent) => {
      formattedBalances = balancesFormatted;
    };
    setOnBalanceUpdateCallback(callback);
    const chain: Chain = { type: ChainType.EVM, id: 80001 };
    await expect(onBalancesUpdate(txidVersion, wallet, chain)).to.be.fulfilled;
    expect(formattedBalances.balanceBucket).to.deep.equal(
      RailgunWalletBalanceBucket.Spendable,
    );
    expect(formattedBalances.chain).to.deep.equal(chain);
    expect(formattedBalances.erc20Amounts.length).to.equal(1);
    expect(formattedBalances.erc20Amounts[0]).to.deep.equal({
      tokenAddress: '0x0000000000000000000000000000000000012536',
      amount: 10n,
    });
  });
});
