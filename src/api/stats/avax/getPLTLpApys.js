const BigNumber = require('bignumber.js');
const { avaxWeb3: web3 } = require('../../../utils/web3');

const MasterChef = require('../../../abis/pltMasterChef.json');
const fetchPrice = require('../../../utils/fetchPrice');
const pools = require('../../../data/avax/pltLpPool.json');
const { compound } = require('../../../utils/compound');
const { getTotalStakedInUsd } = require('../../../utils/getTotalStakedInUsd');
const { AVAX_CHAIN_ID } = require('../../../constants');
const getBlockNumber = require('../../../utils/getBlockNumber');

const getPLTLpApys = async () => {
  let apys = {};
  const masterchef = '0x96634DbA8Ea2d9cF2a9B5F6Ee1eCE60900E89F2a';

  let promises = [];
  pools.forEach(pool => promises.push(getPoolApy(masterchef, pool)));
  const values = await Promise.all(promises);

  for (let item of values) {
    apys = { ...apys, ...item };
  }

  return apys;
};

const getPoolApy = async (masterchef, pool) => {
  const [yearlyRewardsInUsd, totalStakedInUsd] = await Promise.all([
    getYearlyRewardsInUsd(masterchef, pool),
    getTotalStakedInUsd(masterchef, pool.address, 'lps', pool.name,"1e18",43114),
  ]);
  const simpleApy = yearlyRewardsInUsd.dividedBy(totalStakedInUsd);
  const apy = simpleApy
  return { [pool.name]: apy };
};

const getYearlyRewardsInUsd = async (masterchef, pool) => {
  const blockNum = await getBlockNumber(AVAX_CHAIN_ID);
  const masterchefContract = new web3.eth.Contract(MasterChef, masterchef);

  const multiplier = new BigNumber(
    await masterchefContract.methods.getMultiplier(blockNum - 1, blockNum).call()
  );
  const blockRewards = new BigNumber(await masterchefContract.methods.pltPerBlock().call());

  let { allocPoint } = await masterchefContract.methods.poolInfo(pool.poolId).call();
  allocPoint = new BigNumber(allocPoint);

  const totalAllocPoint = new BigNumber(await masterchefContract.methods.totalAllocPoint().call());
  const poolBlockRewards = blockRewards
    .times(multiplier)
    .times(allocPoint)
    .dividedBy(totalAllocPoint);

  const secondsPerBlock = 3;
  const secondsPerYear = 31536000;
  const yearlyRewards = poolBlockRewards.dividedBy(secondsPerBlock).times(secondsPerYear);

  const pltPrice = await fetchPrice({ oracle: 'tokens', id: 'PLT' });
  const yearlyRewardsInUsd = yearlyRewards.times(pltPrice).dividedBy('1e18');

  return yearlyRewardsInUsd;
};

module.exports = getPLTLpApys;
