import img from "../assets/remi.png";
function Sky() {
    return (
        <div className="w-full h-full flex items-center justify-center">
            <img src={img} alt="Sky" className="w-1/2 h-1/2 object-contain" />
        </div>
    )
}

export default Sky;