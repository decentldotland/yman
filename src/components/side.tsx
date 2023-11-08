interface SideType {
}

export default function Side({}: SideType) {
    return (
        <div 
            className="relative px-2 py-5 flex flex-col justify-start flex-1 grow
                        z-10 bg-opacity-20
                        rounded-md shadow-md card h-32 w-[20px]"
            style={{ backgroundImage: `linear-gradient(to bottom right, #f7f7f2, transparent)` }}
        >
        </div>
    )
}