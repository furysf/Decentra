// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

contract DecentraNews {
    struct News {
        address author;
        string title;
        string content;
        string ipfsUrl;
        uint256 timestamp;
    }

    News[] public newsList;

    event NewsSubmitted(address indexed author, string title, string ipfsUrl);

    function submitNews(string memory title, string memory content, string memory ipfsUrl) public {
        newsList.push(News(msg.sender, title, content, ipfsUrl, block.timestamp));
        emit NewsSubmitted(msg.sender, title, ipfsUrl);
    }

    function getNews(uint256 index) public view returns (
        address, string memory, string memory, string memory, uint256
    ) {
        News memory n = newsList[index];
        return (n.author, n.title, n.content, n.ipfsUrl, n.timestamp);
    }

    function getNewsCount() public view returns (uint256) {
        return newsList.length;
    }
}
