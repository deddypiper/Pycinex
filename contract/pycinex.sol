// SPDX-License-Identifier: MIT 

pragma solidity >=0.7.0 <0.9.0;

interface IERC20Token {
  function transfer(address, uint256) external returns (bool);
  function approve(address, uint256) external returns (bool);
  function transferFrom(address, address, uint256) external returns (bool);
  function totalSupply() external view returns (uint256);
  function balanceOf(address) external view returns (uint256);
  function allowance(address, address) external view returns (uint256);

  event Transfer(address indexed from, address indexed to, uint256 value);
  event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract pycinex {
    uint internal classicMoviesLength = 0;
    address internal pycinexAddr = 0x328bc1c1d8Feb38e087B8Fba55d14e3f9b010F0e;
    address internal cUsdTokenAddress = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;

    struct classicMovie {
        //address payable owner; // check where owner/seller/cinema/my address is inputed/coming from
        string name;
        string year;
        string genre;
        uint vote;
    }

    mapping (uint => classicMovie) internal classicMovies; 

    function writeclassicMovie( 
      string memory _name, 
      string memory _year, 
      string memory _genre 
    ) public {
      uint _vote = 0;
      classicMovies[classicMoviesLength] = classicMovie (
        _name,
        _year,
        _genre,
        _vote
      );
      classicMoviesLength++;
    }

    function getClassicMovie(uint _index) public view returns (
      string memory, 
      string memory, 
      string memory,   
		  uint
    ) {
        return ( 
          classicMovies[_index].name, 
          classicMovies[_index].year, 
          classicMovies[_index].genre, 
          classicMovies[_index].vote 
		    );
    }

    function voteClassicMovie(uint _index) public  {
      require(classicMovies[_index].vote < 1000, "Maximum votes acquired");
      classicMovies[_index].vote++;
	  }

    function buyMovie(uint _price) public payable  {
      require(
        IERC20Token(cUsdTokenAddress).transferFrom(
        msg.sender,
        pycinexAddr,
        _price
        ),
        "Transfer failed."
      );
	  }

    function getClassicMoviesLength() public view returns (uint) {
      return classicMoviesLength;
    }

}