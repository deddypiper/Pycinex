
import Web3 from "web3"
import { newKitFromWeb3 } from "@celo/contractkit"
import BigNumber from "bignumber.js"
import pycinexAbi from "../contract/pycinex.abi.json"
import erc20Abi from "../contract/erc20.abi.json"

const ERC20_DECIMALS = 18
const pycinexContractAddress = "0xaF77a86e0c5B827041587d9A15430Db4CC3D55CC"
const cUSDContractAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"

let kit;
let contract;
let classicMovies = []


// Connect CeloExtensionWallet to the DApp
const connectCeloWallet = async function () {
  if (window.celo) {
    notification("⚠️ Please approve this DApp to use it.")
    try {
      await window.celo.enable()
      notificationOff()

      const web3 = new Web3(window.celo);
      kit = newKitFromWeb3(web3); 

      const accounts = await kit.web3.eth.getAccounts();
      kit.defaultAccount = accounts[0]; 
      
      contract = new kit.web3.eth.Contract(pycinexAbi, pycinexContractAddress)
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
  } else {
    notification("⚠️ Please install the CeloExtensionWallet.")
  }
}

// Approve the contract to spend the specified amount for the transaction
async function approve(_price) {
  const cUSDContract = new kit.web3.eth.Contract(erc20Abi, cUSDContractAddress)

  const result = await cUSDContract.methods
    .approve(pycinexContractAddress, _price)
    .send({ from: kit.defaultAccount })
  return result
}

// Retrieve Wallet Balance
const getBalance = async function () {
  const totalBalance = await kit.getTotalBalance(kit.defaultAccount)
  const cUSDBalance = totalBalance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2)
  document.querySelector("#balance").textContent = cUSDBalance
}

// Display Movies on the frontend
function renderMovies() {
  document.getElementById("newReleasesMain").innerHTML = ""
  movies.forEach((_movie) => {
    const newDiv = document.createElement("div")
    newDiv.className = "col-md-4"
    newDiv.innerHTML = movieTemplate(_movie)
    document.getElementById("newReleasesMain").appendChild(newDiv)
  })
  document.getElementById("classicsMain").innerHTML = ""
  cMovies.forEach((_movie) => {
    const newDiv = document.createElement("div")
    newDiv.className = "col-md-6"
    newDiv.innerHTML = movieTemplate(_movie)
    document.getElementById("classicsMain").appendChild(newDiv)
  })
}

function movieTemplate(_movie) {
  return `
    <div class="card mb-2" id="${_movie.id}">
      <img style="object-fit: contain; width: 100%;" class="card-img-top" src="${_movie.image}" alt="imagepic">
      <div class="card-body text-left p-2 position-relative">
      <div class="top-0 bg-warning ticker px-2 py-1 rounded-start" style="display: flex; align-items: center; justify-content: space-around; color: white;">
        <button class="btn btn-primary plus"> + </button>
        <span class="tit">
        ${_movie.ticket} 
        </span>
        <button class="btn btn-primary minus"> - </button>
      </div>
        
        <h2 class="card-title fs-4 fw-bold ">${_movie.name}</h2>
        <p class="card-text mb-2" style="min-height: 42px">
          ${_movie.description}             
        </p>
        <p class="card-text mt-2">
          <i class="bi bi-star-fill"></i>
          <span style="color: #4a46dc;">${_movie.stars}</span>
        </p>
        <div class="d-grid gap-2">
          <a class="btn btn-lg btn-outline-dark buyBtn fs-6 p-3" id=${
            _movie.id
          }>
            Buy for ${_movie.price} cUSD
          </a>
        </div>
      </div>
    </div>
  `
}

// Notification
function notification(_text) {
  document.querySelector(".alert").style.display = "block"
  document.querySelector("#notification").textContent = _text
}

function notificationOff() {
  document.querySelector(".alert").style.display = "none"
}

// Window onload event listener
window.addEventListener("load", async () => {
  notification("⌛ Loading...")
  await connectCeloWallet()
  await getBalance()
  renderMovies()
  await getClassicMovieList()
  notificationOff()
});

// Adding, removing and and buying blockbuster movie ticket(s)
document.querySelector("#newReleasesMain").addEventListener("click", async (e) => {
  const index = e.target.parentNode.parentNode.parentNode.id
  if (e.target.className.includes("plus")) {
    movies[index].ticket++
  }
  if (e.target.className.includes("minus") && movies[index].ticket >= 1) {
    movies[index].ticket--
  }
  if (e.target.className.includes("buyBtn") && movies[index].ticket >= 1) {
    const totalSum = new BigNumber(movies[index].price * movies[index].ticket).shiftedBy(ERC20_DECIMALS).toString()
    notification("⌛ Waiting for payment approval...")
    try { 
      await approve(totalSum)
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
    notification(`⌛ Awaiting payment for "${movies[index].name}"...`)
    try {
      const result = await contract.methods
      .buyMovie(totalSum) 
      .send({ from: kit.defaultAccount })
      notification(`🎉 You successfully bought ${movies[index].ticket} ${movies[index].name} tickets.`)
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
  } else {
    notification(`⚠️ No ticket selected for ${movies[index].name}.`)
  }
  getBalance() 
  renderMovies()
})  

// Adding, removing and and buying classic movie ticket(s)
document.querySelector("#classicsMain").addEventListener("click", async (e) => {
  const index = e.target.parentNode.parentNode.parentNode.id
  if (e.target.className.includes("plus")) {
    cMovies[index].ticket++
  }
  if (e.target.className.includes("minus") && cMovies[index].ticket >= 1) {
    cMovies[index].ticket--
  }
  if (e.target.className.includes("buyBtn") && cMovies[index].ticket >= 1) {
    const totalSum = new BigNumber(cMovies[index].price * cMovies[index].ticket).shiftedBy(ERC20_DECIMALS).toString()
    notification("⌛ Waiting for payment approval...")
    try { 
      await approve(totalSum)
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
    notification(`⌛ Awaiting payment for "${cMovies[index].name}"...`)
    try {
      const result = await contract.methods
        .buyMovie(totalSum) 
        .send({ from: kit.defaultAccount })
      notification(`🎉 You successfully bought ${cMovies[index].ticket} ${cMovies[index].name} tickets.`)
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
  } else {
    notification(`⚠️ No ticket selected for ${cMovies[index].name}.`)
  }
  getBalance() 
  renderMovies()
})  

// Adding a classic movie to the Classic Movies Bucket
document
.querySelector("#newClassicMovieBtn")
  .addEventListener("click", async (e) => {
    const params = [
      document.getElementById("newMovieName").value,
      document.getElementById("newMovieReleaseYear").value,
      document.getElementById("newMovieGenre").value,
    ]
    console.log(params)
    notification(`⌛ Adding "${params[0]}"...`)
    try {
      await contract.methods 
      .writeclassicMovie(...params)
      .send({ from: kit.defaultAccount });
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
    notification(`🎉 You successfully added "${params[0]}".`)
    getClassicMovieList();
  }); 

  /// Retrieving the added classic movies
  const getClassicMovieList = async function() {
    const _classicMoviesLength = await contract.methods.getClassicMoviesLength().call()
    const _classicMovies = []
    for (let i = 0; i < _classicMoviesLength; i++) {
      let _classicMovie = new Promise(async (resolve, reject) => {
        let m = await contract.methods.getClassicMovie(i).call()
        resolve({
          index: i,
          name: m[0],
          year: m[1],
          genre: m[2],
          vote: m[3],
        })
      })
      _classicMovies.push(_classicMovie)
    }
    classicMovies = await Promise.all(_classicMovies)
    renderClassicMovieList()
  }

  // Display the Classic Movies Bucket
  function renderClassicMovieList() {
    document.getElementById("pycinex").innerHTML = ""
    classicMovies.forEach((classicMovie) => {
      const newList = document.createElement("li")
      newList.innerHTML = classicMovieTemplate(classicMovie)     
      document.getElementById("pycinex").appendChild(newList)
    })
  }
  
  function classicMovieTemplate(classicMovie) {
    return `
      <div id=${classicMovie.index} class="px-1 py-2" style=" margin: 2px 0px; box-shadow: rgb(0 0 0 / 10%) 0px 10px 20px; border-radius: 10px; "> 
        <span style="color: #4a46dc;"><b> ${classicMovie.name}</b></span > {${classicMovie.genre}}  released in: <span style="color: #4a46dc;">${classicMovie.year}</span> 
        <button class="voteBtn" style=" border: none; border-radius: 10%; color: white; margin: 0px 30px; background: #ffc107;">Vote</button> &nbsp; <span class="px-1 py-1" style="background-color: teal; color: white; border-radius: 3px;">${classicMovie.vote} vote(s)</span>
      </div>
      `
    }
    
    // Voting for a favorite classic movie(s)
    document.querySelector("#pycinex").addEventListener("click", async function(event) {
      if(event.target.classList.contains("voteBtn")) {
        const classicIndex = event.target.parentNode.id
        if (classicMovies[classicIndex].vote < 1000) {
          notification(`⌛ Voting ${classicMovies[classicIndex].name} ...`)
          try {
            await contract.methods.voteClassicMovie(classicIndex).send({ from: kit.defaultAccount })
          } catch (error) {
            notification(`⚠️ ${error}.`)
          }
          notification(`🎉 You successfully voted "${classicMovies[classicIndex].name}" in the Classic Movies Bucket .`)
          await getClassicMovieList()
        } else {
          notification(`🎉 Maximum votes acquired`)
        }
      }
    }, false)
    console.log("meat")
    let movies = [
      {
        id: 0,
        name: "Minions & More Volume 1",
        image: "https://static.netnaija.com/i/1xYNeYbANLJ.jpg",
        year: "Sep 27, 2022 (United States)",
        description: "This collection of Minions shorts from the 'Despicable Me' franchise includes mini-movies like 'Training Wheels,' 'Puppy' and 'Yellow Is the New Black.'",
        genre: "Adventure, Animation, Comedy, Family",
        stars: "Pierre Coffin, Raymond S. Persi, Carlos Alazraqui, Tara Strong...",
        ticket: 0,
        price: 28.00
      },
      {
        id: 1,
        name: "Bullet Train",
        image: "https://static.netnaija.com/i/deYakzxk7P3.jpg",
        year: "Aug 05, 2022 (United States)",
        description: "Unlucky assassin Ladybug is determined to do his job peacefully after one too many gigs gone off the rails. Fate, however, may have other plans, as Ladybug's latest mission puts him on a collision course with lethal adversaries from around the globe-all with connected, yet conflicting, objectives-on the world's fastest train.",
        genre: "Action, Comedy, Thriller",
        stars: "Brad Pitt, Joey King, Aaron Taylor-Johnson...",
        ticket: 0,
        price: 28.00
      },
      {
        id: 2,
        name: "The Secrets of Bella Vista",
        image: "https://static.netnaija.com/i/zOJabRRZaG2.jpg",
        year: "Sep 18, 2022 (United States)",
        description: "Tess Delaney gets the surprising news by estate executor Damhnaic McAuley that she has inherited half of an apple orchard from the father she never knew and has a half-sister she didn't know about. When she visits the orchard and connects with her new-found family, she learns that the orchard is deep in debt. Using her knowledge as an antiques expert, Tess and her half-sister work to unravel the mystery of their grandmother's 'treasure' that could hold the key to saving the orchard. And, in the process, Tess ultimately finds a new understanding of herself.",
        genre: "Drama, Romance",
        stars: "Rachelle Lefevre, Niall Matter, Helena Marie...",
        ticket: 0,
        price: 27.00
      },
      {
        id: 3,
        name: "The Stranger in Our Bed",
        image: "https://static.netnaija.com/i/1qGK1yW6KrV.jpg",
        year: "May 27, 2022 (United States)",
        description: "Passion, money, killer secrets. A newly married woman leaves her wealthy husband for a lover who mysteriously disappears. Things start to unravel and become life-threatening on a trip to the husband's family estate.",
        genre: "Action, Drama",
        stars: "Tom Cruise, Miles Teller, Jennifer Connelly...",
        ticket: 0,
        price: 25.00
      },
      {
        id: 4,
        name: "Top Gun Maverick",
        image: "https://static.netnaija.com/i/5VrNpWY9a9O.jpg",
        year: "Jul 29, 2022 (United Kingdom)",
        description: "Feel the need... The need for speed, After more than thirty years of service as one of the Navy's top aviators, and dodging the advancement in rank that would ground him, Pete 'Maverick' Mitchell finds himself training a detachment of TOP GUN graduates for a specialized mission the likes of which no living pilot has ever seen.",
        genre: "Mystery, Thriller",
        stars: "Emily Berrington, Ben Lloyd-Hughes, Samantha Bond...",
        ticket: 0,
        price: 25.00
      },
      {
        id: 5,
        name: "Planning On Forever",
        image: "https://static.netnaija.com/i/rOx7xn4bN0M.jpg",
        year: "Jun26, 2022 (United States)",
        description: "Emma is a hyper efficient corporate events planner who doesn't have time for love - until her sister Miranda reveals that the wedding of her dreams is in six weeks and she has last minute travel plans for work. Emma agrees to step in and plan it herself with the help of Brett's Best Man Liam, who Emma had a disastrous blind date with years ago. Finding common ground is definitely a challenge, but as they stand-in on behalf of their friends' love, they discover they might be making room for their own.",
        genre: "Drama, Family, Romance",
        stars: "Emily Tennant, Alec Santos, Jocelyn Gauthier...",
        ticket: 0,
        price: 23.00
      },
      {
        id: 6,
        name: "Vengeance",
        image: "https://static.netnaija.com/i/bvWaqnLXNrk.jpg",
        year: "Jul 29, 2022 (United States)",
        description: "Ben Manalowitz, a journalist and podcaster, travels from New York City to West Texas to investigate the death of a girl he was hooking up with.",
        genre: "Comedy, Drama, Thriller",
        stars: "B.J. Novak, Boyd Holbrook, J. Smith-Cameron...",
        ticket: 0,
        price: 24.00
      },
      {
        id: 7,
        name: "Secret Society 2 Never Enough",
        image: "https://static.netnaija.com/i/zOJab8oxKG2.jpg",
        year: "Jul 29, 2022 (United States)",
        description: "Celess is back with a newfound hunger and a bestie. They are on the brink of making it big but that's when they learn the bigger you are the harder you fall, especially when your past is tugging at your stilettos.",
        genre: "Action, Drama",
        stars: "Reyna Love, Adejah Parrish, Erica Pinkett, Johnell Young...",
        ticket: 0,
        price: 18.00
      },
      {
        id: 8,
        name: "Romance In Style",
        image: "https://static.netnaija.com/i/Aq2NAX1ZazJ.jpg",
        year: "Aug 13, 2022 (Canada)",
        description: "Ella's unique designs inspire publishing mogul Derek to include plus-sized fashion in his magazine. It's not long before Derek realizes that Ella's influence reaches far beyond the catwalk.",
        genre: "Comedy, Romance",
        stars: "Jaicy Elliot, Benjamin Hollingsworth, Connie Manfredi...",
        ticket: 0,
        price: 15.00
      }, 
    ]

    let cMovies = [
      {
        id: 0,
        name: "Gladiator",
        image: "https://fzmovies.net/imdb_images/Gladiator.jpg",
        year: "Aug 31, 2000 (United States)",
        description: "Maximus is a powerful Roman general, loved by the people and the aging Emperor, Marcus Aurelius. Before his death, the Emperor chooses Maximus to be his heir over his own son, Commodus, and a power struggle leaves Maximus and his family condemned to death. The powerful general is unable to save his family, and his loss of will allows him to get captured and put into the Gladiator games until he dies. The only desire that fuels him now is the chance to rise to the top so that he will be able to look into the eyes of the man who will feel his revenge.",
        genre: "Action, Adventure, Drama",
        stars: "Russell Crowe, Joaquin Phoenix, Connie Nielsen...",
        ticket: 0,
        price: 15.00
      },
      {
        id: 1,
        name: "Anini",
        image: "https://i.ytimg.com/vi/N7JNFJVk49Y/hqdefault.jpg",
        year: "Aug 29, 2005 (Nigeria)",
        description: "A young boy is taken from his Village to the City to better his chances of being successful in life. He undergoes challenging and arduous travails, and this puts him in a debacle, what does he make of himself? He becomes someone everyone knows but is terrified of, a menace to the Law Enforcement and the society at Large. How does this end?",
        genre: "Action, Drama, Comedy, Romance",
        stars: "Celestine Agofure, Bimbo Akintola, Wilson Akobeghian Ehigiator...",
        ticket: 0,
        price: 15.00
      }, 
      {
        id: 2,
        name: "Home alone 2 Lost in New York",
        image: "https://fzmovies.net/imdb_images/Home Alone 2 Lost in New York.jpg",
        year: "Nov 19, 1992 (United States)",
        description: "Kevin McCallister is back. But this time he's in New York City with enough cash and credit cards to turn the Big Apple into his very own playground. But Kevin won't be alone for long. The notorious Wet Bandits, Harry and Marv, still smarting from their last encounter with Kevin, are bound for New York too, plotting a huge holiday heist! Kevin's ready to welcome them with more battery of booby traps the bumbling bandits will never forget!",
        genre: "Adventure, Comedy, Crime, family",
        stars: "Macaulay Caulkin, Ben Lloyd-Hughes, Samantha Bond...",
        ticket: 0,
        price: 14.00
      },
      {
        id: 3,
        name: "The Gods Must Be Crazy",
        image: "https://fzmovies.net/imdb_images/The Gods Must Be Crazy.jpg",
        year: "Sep 09, 1980 (United States)",
        description: "A Sho in the Kalahari desert encounters technology for the first time--in the shape of a Coke bottle. He takes it back to his people, and they use it for many tasks. The people start to fight over it, so he decides to return it to the God--where he thinks it came from. Meanwhile, we are introduced to a school teacher assigned to a small village, a despotic revolutionary, and a clumsy biologist.",
        genre: "Action, Comedy",
        stars: "Marius Weyers, Sandra Prinsloo, N!xau...",
        ticket: 0,
        price: 12.00
      },
      {
        id: 4,
        name: "The Spy Who Loved Me",
        image: "https://fzmovies.net/imdb_images/The Spy Who Loved Me.jpg",
        year: "Aug 02, 1977 (United States)",
        description: " James Bond is back again and his new mission is to find out how a Royal Navy Polaris submarine holding sixteen nuclear warheads simply disappears whilst on patrol. Bond joins Major Anya Amasova and takes on a a web-handed mastermind, known as Karl Stromberg, as well as his henchman Jaws, who has a mouthful of metal teeth. Bond must track down the location of the missing submarine before the warheads are fired.",
        genre: "Action, Adventure, Romance, Thriller",
        stars: "Roger Moore, Barbara Bach, Curd Jurgens...",
        ticket: 0,
        price: 12.00
      },
      {
        id: 5,
        name: "Titanic",
        image: "https://fzmovies.net/imdb_images/Titanic.jpg",
        year: "Mar 12, 1997 (United States)",
        description: "84 years later, a 101-year-old woman named Rose DeWitt Bukater tells the story to her granddaughter Lizzy Calvert, Brock Lovett, Lewis Bodine, Bobby Buell and Anatoly Mikailavich on the Keldysh about her life set in April 10th 1912, on a ship called Titanic when young Rose boards the departing ship with the upper-class passengers and her mother, Ruth DeWitt Bukater, and her fianc�, Caledon Hockley. Meanwhile, a drifter and artist named Jack Dawson and his best friend Fabrizio De Rossi win third-class tickets to the ship in a game. And she explains the whole story from departure until the death of Titanic on its first and last voyage April 15th, 1912 at 2:20 in the morning.",
        genre: "Adventure, Drama, History, Romance",
        stars: "Leonardo DiCaprio, Kate Winslet, Kathy Bates...",
        ticket: 0,
        price: 10.00
      },
    ]