// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract NewsContract {
    struct News {
        address author;
        string title;
        string content;
        uint256 timestamp;
        uint256 verifications;
    }

    News[] public newsList;

    event NewsSubmitted(uint256 newsId, address indexed author, string title);
    event NewsVerified(uint256 newsId, address indexed verifier);

    function submitNews(string memory _title, string memory _content) public {
        newsList.push(News(msg.sender, _title, _content, block.timestamp, 0));
        emit NewsSubmitted(newsList.length - 1, msg.sender, _title);
    }

    function verifyNews(uint256 _newsId) public {
        require(_newsId < newsList.length, "Invalid news ID");
        newsList[_newsId].verifications += 1;
        emit NewsVerified(_newsId, msg.sender);
    }

    function getAllNews() public view returns (News[] memory) {
        return newsList;
    }
}
