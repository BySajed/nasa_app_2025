import img from "../assets/remi.png";
function Sky() {
    return (
        <div className="w-full h-full flex items-center justify-center">
            <img src={img} alt="Sky" className=" object-center" />
        </div>
    )
}

export default Sky;