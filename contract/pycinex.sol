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
    uint private classicMoviesLength = 0;
    address private pycinexAddr = 0x328bc1c1d8Feb38e087B8Fba55d14e3f9b010F0e;
    address private cUsdTokenAddress = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;

    struct ClassicMovie {
        string name;
        string year;
        string genre;
        uint vote;
        uint price;
        uint sold;
    }

    mapping (uint => ClassicMovie) private classicMovies;
    // keeps track of users who voted for a movie
    mapping(uint => mapping(address => bool)) private votedMovies;
    // keeps track of users who bought a movie
    mapping(uint => mapping(address => bool)) private boughtMovies;
    // keeps track of indexes that have been initialized
    mapping(uint => bool) private _exists; 

    // checks if movie with id of _index exists
    modifier exists(uint _index){
      require(_exists[_index], "Query of nonexistent classic movie");
      _;
    }

    /**
      * @dev allow users to add a movie to the platform
      * @notice input data needs to contain only valid values

     */
    function writeclassicMovie( 
      string calldata _name, 
      string calldata _year, 
      string calldata _genre,
      uint _price 
    ) public {
      require(bytes(_name).length > 0,"Empty name");
      require(bytes(_year).length == 4,"Year format must be in YYYY");
      require(bytes(_genre).length > 0, "Empty genre");
      require(_price >= 0.5 ether, "Price needs to be at least 0.5 CUSD");
      uint _vote = 0;
      uint _sold = 0;
      uint index = classicMoviesLength;
      classicMoviesLength++;
      classicMovies[index] = ClassicMovie (
        _name,
        _year,
        _genre,
        _vote,
        _price,
        _sold
      );
      _exists[index] = true;
    }

    function getClassicMovie(uint _index) public view exists(_index) returns (
      string memory, 
      string memory, 
      string memory,   
		  uint,
      uint,
      uint
    ) {
        ClassicMovie memory movie = classicMovies[_index];
        return ( 
          movie.name, 
          movie.year, 
          movie.genre, 
          movie.vote,
          movie.price,
          movie.sold 
		    );
    }

    /**
      * @dev allow users who bought the movie with id of _index to upvote
      * @notice Only one vote per user
      * @notice Limit for voting is one thousand votes
     */
    function voteClassicMovie(uint _index) public exists(_index)  {
      require(boughtMovies[_index][msg.sender], "Only users who bought the movie can vote");
      require(!votedMovies[_index][msg.sender], "You have already voted for this movie");
      require(classicMovies[_index].vote < 1000, "Maximum votes acquired");
      votedMovies[_index][msg.sender] = true;
      classicMovies[_index].vote++;
	  }

    /**
      * @dev allow users to buy a movie
      * @notice a movie can only be bought once per user
     */
    function buyMovie(uint _index) public payable exists(_index)  {
      require(pycinexAddr != msg.sender, "Owner can't buy his movies");
      require(!boughtMovies[_index][msg.sender], "You have already bought this movie");
      boughtMovies[_index][msg.sender] = true;
      ClassicMovie storage currentMovie = classicMovies[_index];
      currentMovie.sold++;
      require(
        IERC20Token(cUsdTokenAddress).transferFrom(
        msg.sender,
        pycinexAddr,
        currentMovie.price
        ),
        "Transfer failed."
      );
      
	  }

    function getClassicMoviesLength() public view returns (uint) {
      return classicMoviesLength;
    }

}