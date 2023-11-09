import Property from "@/components/property";
import { NextPage } from "next/types";
import { useEffect, useState } from "react";
import Image from "next/image";
import axios from "axios";
import { useWalletSelector } from "@/contexts/WalletSelectorContext";
import ChipHolder, { ChipHolderFlex } from "@/components/chipHolder";

const Board: NextPage = ({ }) => {

    const [width, setWidth] = useState(0);
    const [diceImage, setDiceImage] = useState("/assets/roll_1.png");
    const [diceNumber, setDiceNumber] = useState(1);
    const [showDiceNumber, setShowDiceNumber] = useState(false);
    const [consoleOutput, setConsoleOutput] = useState(0);
    const [gameLobbyTx, setGameLobbyTx] = useState("");

    const [playerList, setPlayerList] = useState<any>();
    const [playerColors, setPlayerColors] = useState<any>();
    const [playerLocation, setPlayerLocation] = useState<any>();
    const [gameStarted, setGameStarted] = useState(false);
    const [currentPlayerTurn, setCurrentPlayerTurn] = useState("");
    const [gameWon, setGameWon] = useState(false);
    const [actionActivated, setActionActivated] = useState("");
    const [actionTxId, setActionTx] = useState("")

    const { selector, modal, accounts, accountId } = useWalletSelector();
    
    const rowTopUrl = "emerald_ore_1.png"
    const rowBottomUrl = "gold_ore_1.png"
    const rowRightUrl = "red_ore_1.png"
    const rowLeftUrl = "diamond_ore_1.png"

    useEffect(() => {
      const screenHeight = window.innerHeight;
      const calculatedWidth = Math.floor((90 / 100) * screenHeight);
      setWidth(calculatedWidth);
      const fetchGameStatus = async () => {
        const gameStartedPay = await axios('/api/gameStarted');
        setGameStarted(gameStartedPay.data);
      }
      fetchGameStatus();
      
    }, []);


    useEffect(() => {
        const fetchData = async () => {
          try {
            const response = await axios.get('/api/getPlayerCount');
            const payload = response.data
            if(payload.play_turns.length > 0 && gameStarted) {
                setCurrentPlayerTurn(payload.players[payload.play_turns[0]].near_id);
            }
          } catch (error) {
            console.error('Error fetching data on currentPlayerTurn:', error);
          }
        };
    
        const intervalId = setInterval(() => {
            if(!gameWon) {
                fetchData();
            } else {
            clearInterval(intervalId); // Stop the interval when gameStarted is true
          }
        }, 2000);
    
        // Cleanup function to clear the interval when the component unmounts or gameStarted is true
        return () => clearInterval(intervalId);
      }, [gameStarted]);

      useEffect(() => {
        const fetchData = async () => {
          try {
            // Axios GET request
            const response = await axios.get('/api/getPlayerCount');
    
            // Process the response data
            
            //playerList array
            //@ts-ignore
            const nearIdsArray = Object.values(response.data.players).map(item => item.near_id);
            //const nearIdsArray1 = Object.values(response.data.players).map(item => item.near_id);
            setPlayerList(nearIdsArray)
            const gatheredColors = nearIdsArray.map((item: any, index: any) => generatePlayerColor(item))
            setPlayerColors(gatheredColors);
            setPlayerLocation(Array.from({ length: nearIdsArray.length }, () => 1));
            
            // Check if the game has started based on the response or your logic
            if (response.data.gameStarted) {
              setGameStarted(true);
            }
          } catch (error) {
            console.error('Error fetching data:', error);
          }
        };
        fetchData();
        // Conduct Axios GET request every 2 seconds until gameStarted is true
        const intervalId = setInterval(() => { 
          if (!gameStarted) {
            fetchData();
            if(playerList && playerList.includes(accountId) && currentPlayerTurn.length === 0) {
                setConsoleOutput(prev => 2);
            }
            console.log("fetching...");
          } else {
            clearInterval(intervalId); // Stop the interval when gameStarted is true
          }
        }, 2000);
    
        // Cleanup function to clear the interval when the component unmounts or gameStarted is true
        return () => clearInterval(intervalId);
      }, [gameStarted]);
    

    const determineSeconds = () => {
        setShowDiceNumber(false)
        const randomNumber = Math.floor(Math.random() * 3) + 2;
        let randomDiceNumber = 1;

        const intervalId = setInterval(() => {
            // Update dice image every 0.3 seconds
            if(randomDiceNumber === 6) {
                randomDiceNumber = 1;
                setDiceImage(`/assets/roll_${randomDiceNumber}.png`);
            } else {
                randomDiceNumber++;
                setDiceImage(`/assets/roll_${randomDiceNumber}.png`);
            }
        }, 100);

        // Stop updating after reaching the specified time (randomNumber in seconds)
        setTimeout(() => {
            //const randNumber = generateRandomDieNumber()
            const randNumber = 4;
            setDiceNumber((prevDiceNumber) => {
                return randNumber;
              });
            setDiceImage(prev => {
                return `/assets/roll_${randNumber}.png`;
            })
            setShowDiceNumber(true);
            // Submit Roll to MEM
            submitRoll(randNumber);
            clearInterval(intervalId);

        }, randomNumber * 1000);
    

    }


    useEffect(() => {
        if (!accountId) {
            setConsoleOutput(0);
        } else {
            setConsoleOutput(1);
        }
      }, [accountId])

    function generatePlayerColor(domain: string) {
        let hash = 0;
        for (let i = 0; i < domain.length; i++) {
          hash = domain.charCodeAt(i) + ((hash << 5) - hash);
        }
        let color = "#";
        for (let i = 0; i < 3; i++) {
          const value = (hash >> (i * 8)) & 0xff;
          color += ("00" + value.toString(16)).substr(-2);
        }
        return color;
    }

    const handleSignOut = async () => {
        const wallet = await selector.wallet();
    
        wallet.signOut().catch((err) => {
          console.log("Failed to sign out");
          console.error(err);
        });
    };

    const handleSignIn = () => {
        modal.show();
    }

    function generateRandomDieNumber() {
        return Math.floor(Math.random() * 6) + 1;
    }

    async function startGame() {
        const startStatus = await axios('/api/startGame/');
        if(startStatus.data.status === "SUCCESS") {
            setGameStarted(true);
        }
    }

    async function enterGameLobby(e: any) {
        e.preventDefault();
        const counter = await axios.get("/api/getCounter/")
        const playerCount = await axios.get("/api/getPlayerCount/")
        let playerToBeMade;
        if(playerCount.data) {
            playerToBeMade = Object.keys(playerCount.data.players).length + "1";
        } else {
            playerToBeMade = "1"
        }
        
        const playerRes = await axios.post("/api/playerIdentity", {player: playerToBeMade})
        const users = {
            near_id: accountId,
            evm_implicit_addr: playerRes.data.address,
            payment_txid: gameLobbyTx
        }
        console.log("Before: ", users)
        axios.post("/api/addToLobby", {user: users}).then((res) => {
            setConsoleOutput(2);
            console.log("LB:", res);
        })
        .catch(e => alert("Error in Lobby"));
        
    }

    async function sendActionTxid(e: any) {
        e.preventDefault();
        const res = await axios('/api/getPlayerCount/');
        //@ts-ignore
        const match = Object.entries(res.data.players).find(([_, value]) => value.near_id === accountId);
        //@ts-ignore
        axios.post("/api/roll/", {dice_result: [diceNumber,0], player_addr: match[0], player_sig: "", pay_plot_rule: actionTxId}).then((res) => {
            console.log(" new:", res);
        })
        .catch(e => alert("Error in Roll"));

    }

    async function submitRoll(rolledNum: Number) {
        //Check if there is an acitivty to do
        const actionPositions: any = {
            6: "Do a wallet to wallet transfer on Near. Any amount is good enough! Attach TXID below.",
            11: "Swap Near for Ref on Ref Finance. Any amount is good enough! Attach TXID below.",
            16: "Mint any NFT on Mintbase. Any amount is good enough! Attach TXID below."
        }
        const arrPos: any = [
            "Do a wallet to wallet transfer on Near. Any amount is good enough! Attach TXID below.",
            "Swap Near for Ref on Ref Finance. Any amount is good enough! Attach TXID below.",
            "Mint any NFT on Mintbase. Any amount is good enough! Attach TXID below."
        ]

        const index = playerList.indexOf(accountId)
        const currentLocation = playerLocation[index];
        //const newLocation = currentLocation+rolledNum;
        const newLocation = (currentLocation + rolledNum) % 20 || 20;
        const toBeUpdated = [...playerLocation];

        // Update the specific index in the copy
        toBeUpdated[index] = newLocation;
      
        // Set the state with the updated array
        setPlayerLocation(toBeUpdated);
        const res = await axios('/api/getPlayerCount/');
        //@ts-ignore
        const match = Object.entries(res.data.players).find(([_, value]) => value.near_id === accountId);
        // If special, do action
        if (actionPositions.hasOwnProperty(newLocation)) {
            setActionActivated(arrPos[index])
            return false
        } else {
            //@ts-ignore
            axios.post("/api/roll/", {dice_result: [diceNumber,0], player_addr: match[0], player_sig: "", pay_plot_rule: ""}).then((res) => {
                console.log(" new:", res);
            })
            .catch(e => alert("Error in Roll"));
            setActionActivated("");
        } 
        setActionActivated("")
        // submit roll
        
        return false;

        
        //const { admin_sig, dice_result, player_addr, player_sig, pay_plot_rule } =
    }

    const sideStyling = "absolute flex flex-row w-[65%] mx-auto h-[16%] space-x-3"
    return (
        <div 
            className="relative w-screen h-screen flex justify-center items-center"
            style={{ backgroundImage: `url('/assets/coarse_dirt.png')`, 
                backgroundSize: '3% 3%', // Adjust the percentage as needed
                backgroundRepeat: 'repeat'}}
            
        >
            {/* Grass */}
            <Image 
                src="/assets/grass.png"
                height={60}
                width={60}
                alt="Stem"
                className="absolute top-[50px] left-[1308px] shadow-md z-20"
            />
            <Image 
                src="/assets/grass.png"
                height={60}
                width={60}
                alt="Stem"
                className="absolute top-[345px] left-[1238px] shadow-md z-20"
            />
            <Image 
                src="/assets/grass.png"
                height={60}
                width={60}
                alt="Stem"
                className="absolute top-[545px] left-[1438px] shadow-md z-20"
            />
            <Image 
                src="/assets/grass.png"
                height={60}
                width={60}
                alt="Stem"
                className="absolute top-[500px] left-[1238px] shadow-md z-20"
            />
            <Image 
                src="/assets/grass.png"
                height={60}
                width={60}
                alt="Stem"
                className="absolute top-[300px] left-[1338px] shadow-md z-20"
            />
            {/* 

            Console
            
            */}
            <div className="absolute top-[30px] left-[1175px] bg-black opacity-75 rounded-sm h-[300px] w-[350px] z-40 p-3">
                {consoleOutput === 0 && !gameStarted && (<button className="text-white" onClick={() => handleSignIn()}>Connect Wallet</button>)}
                {consoleOutput === 1 && !playerList && !gameStarted && (
                    <div className="flex flex-col">
                        <p className="text-white">1. Pay 1 Near to sebastian1993.near to enter game lobby.</p>
                        <br />
                        <p className="text-white">2. Once paid, attach tx id below and press enter:</p>
                        <form onSubmit={enterGameLobby}>
                            <input type="text" className="bg-gray-700 text-white" onChange={(e) => setGameLobbyTx(e.target.value)}/>
                        </form>
                    </div>
                )}
                {playerList && playerList.includes(accountId) && !gameStarted && actionActivated && actionActivated.length == 0 && (
                    <p className="text-white">You have joined! Awaiting other players.</p>
                )}
                {gameStarted && currentPlayerTurn.length > 0  && (
                    <p className="text-white">{`${currentPlayerTurn}, it is your turn!`}</p>
                )}
                {actionActivated.length > 0 && (
                    <>
                        <p className="text-white">{`Challenge! ${actionActivated}`}</p>
                        <form onSubmit={sendActionTxid}>
                            <input type="text" className="bg-gray-700 text-white" onChange={(e) => setActionTx(e.target.value)}/>
                        </form>
                    </>
                    
                )}
            </div>
            {/* Decoration within Vegetation in Control Panel */}
            <Image 
                src="/assets/big_dripleaf_stem.png"
                height={35}
                width={35}
                alt="Stem"
                className="absolute top-[20px] left-[8px] shadow-md z-20"
            />
            <Image 
                src="/assets/big_dripleaf_stem.png"
                height={35}
                width={35}
                alt="Stem"
                className="absolute top-[40px] left-[8px] shadow-md z-20"
            />
            {/* Control Panel */}
            <div 
                className="absolute left-3 px-2 py-5 flex flex-col justify-start
                            z-10 bg-opacity-20
                            rounded-md card h-[95%] w-[320px] floating-board text-white items-center"
                style={{ 
                    backgroundImage: `url('/assets/andesite.png')`, 
                    backgroundSize: '5% 5%', // Adjust the percentage as needed
                    backgroundRepeat: 'repeat'
                }}
            >
                {accountId ? 
                    <>
                        <div className="flex flex-row space-x-2 items-center bg-black opacity-75 py-1 px-2 mb-[10px]">
                            <div className="text-emerald-500 bg-emerald-500 h-3 w-3 rounded-full"></div>
                            <h3 className="font-light">{accountId}</h3>
                        </div>
                        <button className="bg-black opacity-75 py-1 px-2 font-light mb-[120px]" onClick={() => handleSignOut()}>
                            
                            <p className="text-white">Disconnect</p>
                        </button>
                    </>
                :
                    <button className="bg-black opacity-75 py-1 px-2 font-light mb-[120px]" onClick={() => handleSignIn()}>
                        Connect
                    </button>
                }
                <div className="bg-black opacity-75 flex flex-col justify-start items-center space-y-3 w-[300px] py-3 mb-[120px]">
                    <p className="font-bold underline">Players</p>
                    {playerList && playerList.length > 0 && playerList.map((item: any, _index: any) => (
                        <div className="flex flex-row items-center space-x-1 justify-center">
                            <div className="w-2 h-2 rounded-full" style={{backgroundColor: playerColors[_index]}}></div>
                            <p>{item}</p>
                        </div>
                    ))}
                    {playerList && !gameStarted && playerList.length > 0 && (
                        <>
                            <hr className="border-b border-gray-200 bg-gray-200 text-gray-200" />
                            <button className="text-emerald-400 font-bold text-lg" onClick={() => startGame()}>Start Game!</button>
                        </>
                    )}
                </div>
                <div className="flex flex-col justify-center items-center">
                    <button onClick={currentPlayerTurn === accountId ? () => determineSeconds() : () => ""}>
                        <Image 
                            src={diceImage}
                            height={50}
                            width={50}
                            alt="Die"
                            className={currentPlayerTurn === accountId ? "filter grayscale-0" : "filter grayscale cursor-none"}
                        />
                    </button>
                    {showDiceNumber && (<p className="text-white text-4xl font-bold">{diceNumber}</p>)}
                </div>
            </div>
            {/* Obsidian Spaces */}
            <Image 
                src="/assets/obsidian.png"
                height={90}
                width={90}
                alt="Obsidian"
                className="absolute top-[35px] left-[1000px] shadow-md z-20 rounded-full floating-box z-30"
            />
            <ChipHolderFlex 
                className="z-40 absolute top-[35px] left-[1000px] w-[100px] h-[100px]"
                plotPosition={"6"}
                playerColors={playerColors}
                playerLocations={playerLocation}

            />
            <Image 
                src="/assets/obsidian.png"
                height={90}
                width={90}
                alt="Obsidian"
                className="absolute top-[608px] left-[1000px] shadow-md z-20 rounded-full floating-box z-30"
            />
            <ChipHolderFlex 
                className="z-40 absolute top-[608px] left-[1000px] w-[100px] h-[100px]"
                plotPosition={"11"}
                playerColors={playerColors}
                playerLocations={playerLocation}
            />
            <Image 
                src="/assets/obsidian.png"
                height={90}
                width={90}
                alt="Obsidian"
                className="absolute top-[608px] left-[445px] shadow-md z-20 rounded-full floating-box z-30"
            />
            <ChipHolderFlex 
                className="z-40 absolute top-[608px] left-[445px] w-[100px] h-[100px]"
                plotPosition={"16"}
                playerColors={playerColors}
                playerLocations={playerLocation}
            />
            {/* Arrow */}
            <Image 
                src="/assets/arrow.png"
                height={35}
                width={35}
                alt="Arrow"
                className="absolute top-[40px] left-[477px] z-30 transform rotate-90"
            />
            <ChipHolderFlex 
                className="z-40 absolute top-[35px] left-[444px] z-40 w-[100px] h-[100px]"
                plotPosition={"1"}
                playerColors={playerColors}
                playerLocations={playerLocation}
            />
            <div 
                className="relative h-[95%] justify-center items-center z-20 border-2 border-gray-700 shadow-2xl rounded-md floating-board"
                style={{ 
                    width: `${width}px`,
                    backgroundImage: `url('/assets/cobblestone.png')`, 
                    backgroundSize: '5% 5%', // Adjust the percentage as needed
                    backgroundRepeat: 'repeat'
                }}
            >
                {/* Logo */}
                <Image 
                    src="/assets/title_3.png"
                    height={350}
                    width={350}
                    alt="YoctoManji Logo"
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-md"
                />
                {/* Upside Down */}
                <div className={`${sideStyling} top-0 left-1/2 transform -translate-x-1/2 -rotate-180 `}>
                    <Property 
                        players={['red', 'blue']}
                        backgroundImg={rowTopUrl}
                    />
                    <Property 
                        players={['red', 'blue']}
                        backgroundImg={rowTopUrl}
                    />
                    <Property 
                        players={['red', 'blue']}
                        backgroundImg={rowTopUrl}
                    />
                    <Property 
                        players={['red', 'blue']}
                        backgroundImg={rowTopUrl}
                    />

                </div>
                <div className={`${sideStyling} top-0 left-1/2 transform -translate-x-1/2 -rotate-180`}>
                    <ChipHolder
                        plotPosition={"5"}
                        playerColors={playerColors}
                        playerLocations={playerLocation}
                    />
                    <ChipHolder
                        plotPosition={"4"}
                        playerColors={playerColors}
                        playerLocations={playerLocation}
                    />
                    <ChipHolder
                        plotPosition={"3"}
                        playerColors={playerColors}
                        playerLocations={playerLocation}
                    />
                    <ChipHolder
                        plotPosition={"2"}
                        playerColors={playerColors}
                        playerLocations={playerLocation}
                    />
                </div>
                {/* Front */}
                <div className={`${sideStyling} bottom-0 left-[50%] left-1/2 and transform -translate-x-1/2`}>
                    <Property 
                        players={['red', 'blue']}
                        backgroundImg={rowBottomUrl}
                    />
                    <Property 
                        players={['red', 'blue']}
                        backgroundImg={rowBottomUrl}
                    />
                    <Property 
                        players={['red', 'blue']}
                        backgroundImg={rowBottomUrl}
                    />
                    <Property 
                        players={['red', 'blue']}
                        backgroundImg={rowBottomUrl}
                    />
                </div>
                <div className={`${sideStyling} bottom-0 left-[50%] left-1/2 and transform -translate-x-1/2`}>
                    <ChipHolder
                        plotPosition={"15"}
                        playerColors={playerColors}
                        playerLocations={playerLocation}
                    />
                    <ChipHolder
                        plotPosition={"14"}
                        playerColors={playerColors}
                        playerLocations={playerLocation}
                    />
                    <ChipHolder
                        plotPosition={"13"}
                        playerColors={playerColors}
                        playerLocations={playerLocation}
                    />
                    <ChipHolder
                        plotPosition={"12"}
                        playerColors={playerColors}
                        playerLocations={playerLocation}
                    />
                </div>
                {/* Right Side */}
                <div className={`${sideStyling} right-[-161px] top-[41.5%] -rotate-90`}>
                    <Property 
                        players={['red', 'blue']}
                        backgroundImg={rowRightUrl}
                    />
                    <Property 
                        players={['red', 'blue']}
                        backgroundImg={rowRightUrl}
                    />
                    <Property 
                        players={['red', 'blue']}
                        backgroundImg={rowRightUrl}
                    />
                    <Property 
                        players={['red', 'blue']}
                        backgroundImg={rowRightUrl}
                    />
                </div>
                <div className={`${sideStyling} right-[-161px] top-[41.5%] -rotate-90`}>
                    <ChipHolder
                        plotPosition={"10"}
                        playerColors={playerColors}
                        playerLocations={playerLocation}
                    />
                    <ChipHolder
                        plotPosition={"9"}
                        playerColors={playerColors}
                        playerLocations={playerLocation}
                    />
                    <ChipHolder 
                        plotPosition={"8"}
                        playerColors={playerColors}
                        playerLocations={playerLocation}
                    />
                    <ChipHolder
                        plotPosition={"7"}
                        playerColors={playerColors}
                        playerLocations={playerLocation}
                    />
                </div>
                {/* Left Side */}
                <div className={`${sideStyling} left-[-160px] top-[41.5%]  transform rotate-90`}>
                    <Property 
                        players={['red', 'blue']}
                        backgroundImg={rowLeftUrl}
                    />
                    <Property 
                        players={['red', 'blue']}
                        backgroundImg={rowLeftUrl}
                    />
                    <Property 
                        players={['red', 'blue']}
                        backgroundImg={rowLeftUrl}
                    />
                    <Property 
                        players={['red', 'blue']}
                        backgroundImg={rowLeftUrl}
                    />
                </div>
                <div className={`${sideStyling} left-[-160px] top-[41.5%]  transform rotate-90`}>
                    <ChipHolder
                        plotPosition={"20"}
                        playerColors={playerColors}
                        playerLocations={playerLocation}
                    />
                    <ChipHolder
                        plotPosition={"19"}
                        playerColors={playerColors}
                        playerLocations={playerLocation}
                    />
                    <ChipHolder 
                        plotPosition={"18"}
                        playerColors={playerColors}
                        playerLocations={playerLocation}
                    />
                    <ChipHolder
                        plotPosition={"17"}
                        playerColors={playerColors}
                        playerLocations={playerLocation}
                    />
                </div>
                {/* Decorations */}
                <Image 
                    src="/assets/gold_block.png"
                    height={10}
                    width={10}
                    alt="Gold Chunk"
                    className="absolute top-[150px] left-[200px] rounded-[1px] -rotate-180"
                />
                <Image 
                    src="/assets/gold_block.png"
                    height={10}
                    width={10}
                    alt="Gold Chunk"
                    className="absolute top-[550px] left-[375px] rounded-[4px] rotate-90"
                />
                <Image 
                    src="/assets/gold_block.png"
                    height={10}
                    width={10}
                    alt="Gold Chunk"
                    className="absolute top-[250px] left-[475px] rounded-[6px] transform rotate-45"
                />
                <Image 
                    src="/assets/diamond_block.png"
                    height={10}
                    width={10}
                    alt="Diamond Chunk"
                    className="absolute top-[425px] left-[322px] rounded-[1px] -rotate-180"
                />
                <Image 
                    src="/assets/diamond_block.png"
                    height={10}
                    width={10}
                    alt="Diamond Chunk"
                    className="absolute top-[425px] left-[322px] rounded-[5px]"
                />
                <Image 
                    src="/assets/diamond_block.png"
                    height={10}
                    width={10}
                    alt="Diamond Chunk"
                    className="absolute top-[225px] left-[162px] rounded-[6px] transform rotate-45"
                />
                <Image 
                    src="/assets/redstone_block.png"
                    height={12}
                    width={12}
                    alt="Redstone chunk"
                    className="absolute top-[390px] left-[162px] shadow-md rounded-[6px] transform rotate-45"
                />
                <Image 
                    src="/assets/redstone_block.png"
                    height={12}
                    width={12}
                    alt="Redstone chunk"
                    className="absolute top-[190px] left-[362px] shadow-md rounded-[6px] transform rotate-45"
                />
                <Image 
                    src="/assets/emerald_block.png"
                    height={12}
                    width={12}
                    alt="Emerald chunk"
                    className="absolute top-[490px] left-[432px] shadow-md rounded-[6px] transform rotate-45"
                />
                <Image 
                    src="/assets/emerald_block.png"
                    height={12}
                    width={12}
                    alt="Emerald chunk"
                    className="absolute top-[500px] left-[180px] shadow-md rounded-[6px] transform rotate-45"
                />
                <Image 
                    src="/assets/bubble_coral.png"
                    height={14}
                    width={14}
                    alt="Bubble Coral"
                    className="absolute top-[250px] left-[220px] shadow-md rounded-[6px] transform rotate-45"
                />
                <Image 
                    src="/assets/beetroots_stage3.png"
                    height={14}
                    width={14}
                    alt="Beetroots Stage 3"
                    className="absolute top-[314px] left-[486px] shadow-md rounded-[6px]"
                />

                {/* Under the Y */}
                <Image 
                    src="/assets/big_dripleaf_stem.png"
                    height={35}
                    width={35}
                    alt="Stem"
                    className="absolute top-[370px] left-[162px] shadow-md"
                />
                <Image 
                    src="/assets/big_dripleaf_stem.png"
                    height={35}
                    width={35}
                    alt="Stem"
                    className="absolute top-[375px] left-[162px] shadow-md"
                />
                <Image 
                    src="/assets/big_dripleaf_stem.png"
                    height={35}
                    width={35}
                    alt="Stem"
                    className="absolute top-[390px] left-[162px] shadow-md"
                />
                <Image 
                    src="/assets/big_dripleaf_stem.png"
                    height={35}
                    width={35}
                    alt="Stem"
                    className="absolute top-[408px] left-[162px] shadow-md"
                />
                {/* Second Column underneath Y */}
                <Image 
                    src="/assets/big_dripleaf_stem.png"
                    height={35}
                    width={35}
                    alt="Stem"
                    className="absolute top-[370px] left-[181px] shadow-md"
                />
                <Image 
                    src="/assets/big_dripleaf_stem.png"
                    height={35}
                    width={35}
                    alt="Stem"
                    className="absolute top-[380px] left-[181px] shadow-md"
                />

                {/* Under the M */}
                <Image 
                    src="/assets/big_dripleaf_stem.png"
                    height={35}
                    width={35}
                    alt="Stem"
                    className="absolute top-[370px] left-[327px] shadow-md"
                />
            </div>
            <div></div>
        </div>
    )
};
  
export default Board;