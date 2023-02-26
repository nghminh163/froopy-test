// Define constant
const web3Rpc = "https://goerli.infura.io/v3/9290f48b3d614e6f85978f5f7e4a468a"; // goerli rpc
const contractAddress = "0xdb6f6f88b32793349ca121421777a7615c4b8848";
const tokenId = 410;

// Import lib
const Web3 = require('web3');
const { MerkleTree } = require('merkletreejs');
const axios = require('axios');
const contractABI = require('./abi.json');
const { sha256 } = require('./utils')
const crypto = require('crypto');



async function main() {
    const web3 = new Web3(web3Rpc);
    const contractInstance = new web3.eth.Contract(contractABI, contractAddress);
    let metadataURI = await contractInstance.methods.tokenURI(tokenId).call();
    if (metadataURI.includes("ipfs://")) {
        metadataURI = metadataURI.replace("ipfs://", "https://ipfs.io/ipfs/"); // replace ipfs custom protocol to restful
    }
    const { data: metadataResponse } = await axios.get(metadataURI);
    const attributes = [];
    for (const trait of metadataResponse.attributes) {
        attributes.push(sha256(trait.trait_type + trait.value).toString('hex'));
    }
    const merkleTree = new MerkleTree(attributes, sha256, {
        sort: true
    });
    const proofHashLst = []
    const res = []
    for (attribute of attributes) {
        const proof = merkleTree.getProof(attribute);
        const targetData = attribute;
        const targetHash = sha256(targetData, true)
        let proofHash = targetHash;
        for (const p of proof) {
            const isLeftNode = proofHash <= p.data;
            const concatenated = isLeftNode ? proofHash + p.data : p.data + proofHash;
            proofHash = sha256(concatenated, true)
        }
        proofHashLst.push(proofHash);
        // res only export to test file for verify
        res.push({
            proof: proof.map(hash => `0x${hash.data.toString('hex')}`),
            leaf: attribute,
            proofHash: `0x${proofHash}`
        })
    }
    console.log(merkleTree.getHexRoot())
    console.log("Proof Hash are: ", proofHashLst)
    require('fs').writeFileSync('proof.json', JSON.stringify(res, null, 2));

}

(async () => {
    await main()
})()