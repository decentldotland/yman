interface ChipHolderType {
    plotPosition: string,
    playerLocations: any
    playerColors: any
}

interface FlexType extends ChipHolderType {
    className: string
}

export default function ChipHolder({plotPosition, playerLocations, playerColors}: ChipHolderType) {
    return (
        <div 
            className="relative px-2 py-5 flex flex-col justify-start flex-1 grow h-full z-40 floating-box"
            style={{ backgroundImage: "transparent"}}
        >
            <div className="w-full h-full">
                {playerLocations && playerLocations.map((item: any, index: any) => {
                    if(item == plotPosition) {
                        return (
                            <div className="w-8 h-8 rounded-full z-50 mb-1 floating-box" style={{backgroundColor: playerColors[index]}}></div>
                        )
                    }
                })}
            </div>
        </div>
    )
}

export function ChipHolderFlex({plotPosition, playerLocations, playerColors, className}: FlexType) {
    return (
        <div 
            className={`absolute px-2 py-5 flex flex-col justify-start flex-1 grow h-full z-40 floating-box ${className}`}
            style={{ backgroundImage: "transparent"}}
        >
            <div className="w-full h-full">
            {playerLocations && playerLocations.map((item: any, index: any) => {
                    if(item == plotPosition) {
                        return (
                            <div className="w-8 h-8 rounded-full z-50 mb-1 floating-box" style={{backgroundColor: playerColors[index]}}></div>
                        )
                    }
                })}
            </div>
        </div>
    )
}