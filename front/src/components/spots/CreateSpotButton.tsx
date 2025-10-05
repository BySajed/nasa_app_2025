const CreateSpotButton = ({ lng, lat }: { lng: number; lat: number }) => {
  return (
    <button
      className="btn btn-soft btn-sm"
      onClick={() => {
        console.log(lng, lat);
      }}
    >
      Create Spot
    </button>
  );
};

export default CreateSpotButton;
