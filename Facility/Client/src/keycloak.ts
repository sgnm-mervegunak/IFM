import Keycloak from "keycloak-js";

// Setup Keycloak instance as needed
// Pass initialization options as required or leave blank to load from 'keycloak.json'
const keycloak = Keycloak({
  url: process.env.REACT_APP_API_KEYCLOAK + '/auth',
  realm: process.env.REACT_APP_KEYCLOAK_REALM,
  clientId: process.env.REACT_APP_KEYCLOAK_CLIENTID,
});

// let initOptions = {
//   url: "http://172.19.100.120:8080/auth",
//   realm: "IFM",
//   clientId: "front",
//   onLoad: "login-required",
// };

export default keycloak;
