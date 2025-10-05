import ky from "ky";

export const apiClient = ky.create({
  prefixUrl: import.meta.env.VITE_API_URL,
  timeout: 100000000,
  hooks: {
    beforeRequest: [
      (request) => {
        const token = localStorage.getItem("access_token");
        if (token) {
          request.headers.set("Authorization", `Bearer ${token}`);
        }
      },
    ],
  },
});
