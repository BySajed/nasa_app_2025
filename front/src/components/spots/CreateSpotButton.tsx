import { apiClient } from "../../api/client";

const postSpot = async (lng: number, lat: number, onCreated: () => void) => {
  try {
  const response = await apiClient.post("spots", {
      json: { latitude: lat, longitude: lng },
    });
    onCreated();
    return response.json();
  } catch (error) {
    console.error(error);
  }
};

const CreateSpotButton = ({ lng, lat, onCreated }: { lng: number; lat: number; onCreated: () => void }) => {
  return (
    <button
      className="btn btn-soft btn-sm"
      onClick={() => {
        console.log("Create Spot Button clicked");
        postSpot(lng, lat, onCreated);
      }}
    >
      Create Spot
    </button>
  );
};

export default CreateSpotButton;
