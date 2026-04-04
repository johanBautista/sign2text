import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import i18n from "./i18n.js";

// Font Awesome
import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import {
  faHome,
  faCamera,
  faBook,
  faInfoCircle,
  faHandPaper,
  faBolt,
  faUniversalAccess,
  faGlobe,
  faPlay,
  faStop,
  faSave,
  faTimes,
  faLightbulb,
  faEye,
  faVideo,
  faUserGraduate,
  faCog,
  faGears,
  faBullseye,
  faTools,
  faPalette,
  faMobile,
  faRobot,
  faUsers,
  faBug,
  faPhone,
  faEnvelope,
} from "@fortawesome/free-solid-svg-icons";

// Agregar iconos a la librería
library.add(
  faHome,
  faCamera,
  faBook,
  faInfoCircle,
  faHandPaper,
  faBolt,
  faUniversalAccess,
  faGlobe,
  faPlay,
  faStop,
  faSave,
  faTimes,
  faLightbulb,
  faEye,
  faVideo,
  faUserGraduate,
  faCog,
  faGears,
  faBullseye,
  faTools,
  faPalette,
  faMobile,
  faRobot,
  faUsers,
  faBug,
  faPhone,
  faEnvelope,
);

const app = createApp(App);
app.use(i18n);
app.component("font-awesome-icon", FontAwesomeIcon);
app.mount("#app");
