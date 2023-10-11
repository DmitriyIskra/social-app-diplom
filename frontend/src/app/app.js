import Notifi from './Notification';
import ControllApp from "./controlApp";
import RedrawApp from './redrawApp';
import Pattern from './pattern';
import Http from './http';
import Ws from "./ws";
 
const ws = new Ws('ws://localhost:7070');
// ws.registerWsEvents();

// import { format, parse } from 'date-fns';

// console.log(
//     format(new Date(), 'dd.MM.yy HH:mm')
// )

const app = document.querySelector('.wrapper-app');
const pattern = new Pattern();
const http = new Http('http://localhost:7070/');
const notification = new Notifi(http);

const redrawApp = new RedrawApp(app, pattern, http, ws);
const controllApp = new ControllApp(redrawApp, notification);
controllApp.init();