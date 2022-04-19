// Constant variables
const MINUS = "minus";
const PLUS = "plus";
const addr = "PUT_YOUR_ADDRESS";
const correctNetworkID = 1;
const abi = JSON.stringify([
    {
        YOUR_ABI: 'YOUR ABI'
    }
])

let account;
let isPresaleStarts;
let isMintingActive;
let mintingPrice;
let presalePrice;
let toWei;
const contract = {};

// Queries
const counterBtns = document.querySelectorAll(".YOUR_COUNTER_BUTTONS");
const coutnerText = document.querySelector(".YOUR_TOTAL_COUNT");
const btnConnect = document.querySelector(".CONNECT_WALLET_BTN");
const mintBtn = document.querySelector(".MINT_PROCESSING_BTN");
const presaleText = document.querySelector("PRESALE_TEXT_SELECTOR");
const publicSaleText = document.querySelector("PUBLIC_TEXT_SELECTOR");

// Methods
const handleCounter = (e) => {
  const target = e.currentTarget;
  const toggle = target.dataset.toggle;
  const currentCount = parseInt(coutnerText.textContent);

  if (toggle === PLUS && currentCount < 10) {
    coutnerText.textContent = currentCount + 1;
    return;
  }

  if (toggle === MINUS && currentCount > 1) {
    coutnerText.textContent = currentCount - 1;
    return;
  }
};

const handleConnect = async (e) => {
  const target = e.currentTarget;
  target.textContent = "Loading...";

  if (!window.ethereum) {
    window.open("https://metamask.io/");
    alert(`Please Install Metamask to be able to continue`);
    target.textContent = "Connect Wallet";
    return;
  }

  let web3 = new Web3(window.ethereum);

  try {
    await window.ethereum.enable();
    const accounts = await window.ethereum.request({
      method: "eth_accounts",
    });

    const networkId = await window.ethereum.request({
      method: "net_version",
    });

    if (parseInt(networkId) === correctNetworkID) {
      const SmartContractObj = new web3.eth.Contract(JSON.parse(abi), addr);

      Object.assign(contract, SmartContractObj);

      const isOnWhiteList = await SmartContractObj.methods
        ?.checkIfOnAllowList(accounts[0])
        ?.call();

      if (!isOnWhiteList && isPresaleStarts) {
        alert("You are not whitelisted");
        target.textContent = "Connect Wallet";
        return;
      }
      isPresaleStarts = await SmartContractObj.methods
        .isPresaleActive()
        ?.call();

      isMintingActive = await SmartContractObj.methods?.isActive()?.call();

      mintingPrice = web3.utils.fromWei(
        await SmartContractObj.methods?.mintPrice()?.call()
      );

      presalePrice = web3.utils.fromWei(
        await SmartContractObj.methods?.presalePrice()?.call()
      );
      toWei = web3.utils.toWei;
      account = accounts[0];
      target.textContent = accounts[0];
      presaleText.innerHTML = presalePrice;
      publicSaleText.innerHTML = mintingPrice;
      mintBtn.disabled = false;
    }
  } catch (error) {
    alert("Error: " + error.message);
    target.textContent = "Connect Wallet";
    throw new Error(error.message);
  }
};

const handleMint = async (e) => {
  const target = e.currentTarget;
  target.textContent = "Loading...";
  const currentCount = parseInt(coutnerText.textContent);
  const { preSaleMint, mint } = contract.methods;

  if (isPresaleStarts) {
    await preSaleMint(currentCount)
      .send({
        from: account,
        value: toWei((presalePrice * currentCount).toString(), "ether"),
      })
      .once("error", (err) => {
        alert(err.message);
      })
      .then((success) => {
        if (success?.status) {
          alert("Congratulations. Your NFT's successfully claimed");
          target.textContent = "Mint";
        }
      });
    return;
  }

  await mint(currentCount)
    .send({
      from: account,
      value: toWei((mintingPrice * currentCount).toString(), "ether"),
    })
    .once("error", (err) => {
      alert(err.message);
    })
    .then((success) => {
      if (success?.status) {
        alert("Congratulations. Your NFT's successfully claimed");
        target.textContent = "Mint";
      }
    });
};

// Executions
counterBtns.forEach((btn) => btn.addEventListener("click", handleCounter));
btnConnect.addEventListener("click", handleConnect);
mintBtn.addEventListener("click", handleMint);
