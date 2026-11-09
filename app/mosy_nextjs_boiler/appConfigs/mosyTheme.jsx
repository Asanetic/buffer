// appConfigs.js
import Image from 'next/image';
import logo from '../img/logo/logo.png'; // outside public!


const commonRoot = ""; // Update this path if needed

const mosyThemeConfigs = {
  // App Identity
  mosyAppName: "Buffer",
  mosySystemName: "buffer",
  mosyAppLogo: logo.src,
  mosyAppLogoStyle: {
    width: "auto",
    height: "70px",
  },

  // Color Scheme
  themeName: "Mosy",
  btnBg: "#A9069C",
  btnTxt: "#fff",
  ctnBg: "#FCFCFC",
  ctnTxt: "#000",
  bodyColor: "#fff",//"rgba(247, 244, 244, 0.9)",
  bodyTxt: "#000",
  navBarBgColor: "#FFF",
  navbarBorderColor: "#ccc",
  navbarBorderSize: "1",
  navShadowClass: "shadow-sm",
  genBorderColor: "#ccc",
  genBorderSize: "1",
  wildColor: "",
  skinPlasma: "rgba(255, 255, 255, 0.0)",
  bodySkinCss: "#fff",

  systemBorderRadius : "18px",

  // Gradient and Sidebar
  btnFirstColor: "#A9069C",
  btnSecondColor: "#000000",
  get sideBarBg() {
    return `linear-gradient(225deg, ${this.btnFirstColor}, ${this.btnSecondColor})`;
    //return this.btnBg;
  },

  get sideBarTxt() {
    return this.btnTxt;
  },


  get sideBarChipBg() {
    return this.sideBarBg;
  },
  get sideBarChipTxt() {
    return this.sideBarTxt;
  },
  sideBarType: "mini-sidebar", // mini-sidebar || ""

  // App Colors Shortcut
  get skinClr() {
    return this.ctnBg;
  },
  get buttonClr() {
    return this.btnBg;
  },
  get genTxtClr() {
    return this.ctnTxt;
  },
  get buttonTxtClr() {
    return this.btnTxt;
  },

  // App Routing (placeholder, update with actual Next.js routes)
  appIndexPage: "/sedcoclient/mywallet",
};

export default mosyThemeConfigs;
