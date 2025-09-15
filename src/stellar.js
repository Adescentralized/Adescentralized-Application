
const StellarSdk = require('stellar-sdk');

const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
const sourceKeys = StellarSdk.Keypair.random();

const fundAccount = async (publicKey) => {
    try {
        const response = await fetch(
            `https://friendbot.stellar.org?addr=${encodeURIComponent(
                publicKey
            )}`
        );
        const responseJSON = await response.json();
        console.log("SUCCESS! You have a new account :)", responseJSON);
    } catch (e) {
        console.error("ERROR!", e);
    }
};

module.exports = { server, sourceKeys, StellarSdk, fundAccount };
