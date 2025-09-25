const hre = require("hardhat");

async function main() {
  const NewsContract = await hre.ethers.getContractFactory("NewsContract");
  const contract = await NewsContract.deploy();
  await contract.deployed();

  console.log("NewsContract deployed to:", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
