interface PropertyType {
    desc?: string,
    containerClassName?: string,
    backgroundImg: string,
    players: String[] // A player object should go here
}
// Monopoly Default: #BFDBAE #d1d5db  #f7f7f2
// bg-gradient-to-br from-gray-300 to-transparent
//style={{ backgroundImage: `linear-gradient(to bottom right, ${hex}, #eeeeee, transparent)` }} old gradient
export default function Property({desc, containerClassName, backgroundImg}: PropertyType) {
    const url = `url('/assets/${backgroundImg}')`;
    return (
        <div 
            className="relative px-2 py-5 flex flex-col justify-start flex-1 grow h-full z-10 floating-box"
            style={{ backgroundImage: url, 
            backgroundSize: '100% 100%', // Adjust the percentage as needed
            backgroundRepeat: 'repeat'}}
        >
            <div className="w-full h-full">
                {desc && (
                <div className="w-full flex justify-center items-center">
                    <p>{desc}</p>
                </div>                
                )}
            </div>
        </div>
    )
}
